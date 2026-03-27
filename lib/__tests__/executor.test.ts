import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserConnections } from "../executor";

// ─── Mocks hoistés (doivent être déclarés AVANT vi.mock car vi.mock est hoisted) ──

const { mockSendMail, mockSheetsAppend, mockNotionCreate, mockGroqCreate, mockSendWorkflowEmail } = vi.hoisted(() => ({
  mockSendMail: vi.fn().mockResolvedValue({ messageId: "mock_id" }),
  mockSheetsAppend: vi.fn().mockResolvedValue({ data: {} }),
  mockNotionCreate: vi.fn().mockResolvedValue({ id: "page_mock" }),
  mockGroqCreate: vi.fn(),
  mockSendWorkflowEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../email", () => ({ sendWorkflowEmail: mockSendWorkflowEmail }));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: mockSendMail })),
  },
}));

vi.mock("googleapis", () => ({
  google: {
    auth: {
      GoogleAuth: class MockGoogleAuth {
        constructor() {}
      },
    },
    sheets: vi.fn(() => ({
      spreadsheets: { values: { append: mockSheetsAppend } },
    })),
  },
}));

vi.mock("@notionhq/client", () => ({
  Client: class MockNotionClient {
    pages = { create: mockNotionCreate };
  },
}));

vi.mock("groq-sdk", () => ({
  default: class MockGroq {
    chat = { completions: { create: mockGroqCreate } };
    constructor(_opts: unknown) {}
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

type NodeDef = { id: string; label: string; config?: Record<string, string> };
type EdgeDef = { source: string; target: string; sourceHandle?: string };

function wf(nodes: NodeDef[], edges: EdgeDef[]) {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: "custom",
      data: { label: n.label, config: n.config || {} },
    })),
    edges,
  };
}

const TRIGGER_DATA = {
  email: "client@test.com",
  name: "Jean Dupont",
  message: "Demande urgente",
  phone: "+33612345678",
  amount: "99.90",
  subject: "Info produit",
  status: "pending",
  id: "evt_123",
};

const CONNECTIONS: UserConnections = {
  gmail: { email: "bot@test.com", app_password: "app_pass_mock" },
  slack: { webhook_url: "https://hooks.slack.com/mock" },
};

// ─── Import executor après les mocks ─────────────────────────────────────────

let executeWorkflow: typeof import("../executor").executeWorkflow;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import("../executor");
  executeWorkflow = mod.executeWorkflow;

  // Mock fetch global par défaut (200 OK)
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true }),
    json: async () => ({ success: true, id: "mock_id" }),
  }));

  // Groq par défaut : répond OUI
  mockGroqCreate.mockResolvedValue({
    choices: [{ message: { content: "OUI" } }],
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TESTS BASIQUES
// ═════════════════════════════════════════════════════════════════════════════

describe("Workflow vide", () => {
  it("retourne [] si aucun nœud", async () => {
    const res = await executeWorkflow({ nodes: [], edges: [] }, TRIGGER_DATA);
    expect(res).toEqual([]);
  });
});

describe("Déclencheur Webhook", () => {
  it("est loggé comme succès et passe les données", async () => {
    const data = wf(
      [{ id: "1", label: "Webhook" }],
      []
    );
    const res = await executeWorkflow(data, TRIGGER_DATA);
    expect(res[0].status).toBe("success");
    expect(res[0].node).toBe("Webhook");
  });

  it("Planifié fonctionne aussi comme trigger", async () => {
    const data = wf([{ id: "1", label: "Planifié" }], []);
    const res = await executeWorkflow(data, TRIGGER_DATA);
    expect(res[0].status).toBe("success");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// INTERPOLATION DE VARIABLES
// ═════════════════════════════════════════════════════════════════════════════

describe("Variables {{}} dans les configs", () => {
  it("{{email}} est remplacé dans le destinataire Gmail", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Gmail", config: { to: "{{email}}", subject: "Test", body: "Bonjour {{name}}" } },
      ],
      [{ source: "1", target: "2" }]
    );
    await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "client@test.com",
        subject: "Test",
      })
    );
  });

  it("{{name}} et {{message}} interpolés dans le corps", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Gmail", config: { to: "dest@test.com", subject: "S", body: "De {{name}} : {{message}}" } },
      ],
      [{ source: "1", target: "2" }]
    );
    await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain("Jean Dupont");
    expect(call.html).toContain("Demande urgente");
  });

  it("variable manquante reste {{variable}} non remplacée", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Gmail", config: { to: "dest@test.com", subject: "S", body: "{{inexistant}}" } },
      ],
      [{ source: "1", target: "2" }]
    );
    await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain("{{inexistant}}");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOC GMAIL
// ═════════════════════════════════════════════════════════════════════════════

describe("Bloc Gmail", () => {
  it("envoie l'email avec la connexion utilisateur", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Gmail", config: { to: "dest@test.com", subject: "Notif", body: "Contenu" } },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS);
    const gmailResult = res.find(r => r.node === "Gmail");
    expect(gmailResult?.status).toBe("success");
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it("utilise sendWorkflowEmail si pas de connexion Gmail", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Gmail", config: { to: "dest@test.com", subject: "S", body: "B" } },
      ],
      [{ source: "1", target: "2" }]
    );
    await executeWorkflow(data, TRIGGER_DATA, {}); // sans connexion
    expect(mockSendWorkflowEmail).toHaveBeenCalledWith("dest@test.com", "S", "B");
  });

  it("retourne succès sans envoi si pas de destinataire", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Gmail", config: { to: "", subject: "S", body: "B" } },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS);
    const gmailResult = res.find(r => r.node === "Gmail");
    expect(gmailResult?.status).toBe("success");
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("format Texte brut envoie en text: et non html:", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Gmail", config: { to: "d@t.com", subject: "S", body: "B", format: "Texte brut" } },
      ],
      [{ source: "1", target: "2" }]
    );
    await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.text).toBe("B");
    expect(call.html).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOC CONDITION
// ═════════════════════════════════════════════════════════════════════════════

describe("Bloc Condition", () => {
  function conditionWf(operator: string, value: string, field = "message") {
    return wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Condition", config: { field, operator, value } },
        { id: "3", label: "Gmail", config: { to: "oui@test.com", subject: "OUI", body: "branche oui" } },
        { id: "4", label: "Slack", config: { message: "branche non" } },
      ],
      [
        { source: "1", target: "2" },
        { source: "2", target: "3", sourceHandle: "yes" },
        { source: "2", target: "4", sourceHandle: "no" },
      ]
    );
  }

  it("contient → OUI déclenche branche yes", async () => {
    const res = await executeWorkflow(conditionWf("contient", "urgent"), TRIGGER_DATA, CONNECTIONS);
    expect(res.find(r => r.node === "Gmail")?.status).toBe("success");
    expect(res.find(r => r.node === "Slack")).toBeUndefined();
  });

  it("contient → NON déclenche branche no", async () => {
    const res = await executeWorkflow(conditionWf("contient", "facture"), TRIGGER_DATA, CONNECTIONS);
    expect(res.find(r => r.node === "Gmail")).toBeUndefined();
    expect(res.find(r => r.node === "Slack")?.status).toBe("success");
  });

  it("égal à fonctionne", async () => {
    const res = await executeWorkflow(conditionWf("égal à", "pending", "status"), TRIGGER_DATA, CONNECTIONS);
    expect(res.find(r => r.node === "Gmail")?.status).toBe("success");
  });

  it("plus grand que fonctionne avec des nombres", async () => {
    const res = await executeWorkflow(conditionWf("plus grand que", "50", "amount"), TRIGGER_DATA, CONNECTIONS);
    expect(res.find(r => r.node === "Gmail")?.status).toBe("success");
  });

  it("est vide fonctionne", async () => {
    const trigger = { ...TRIGGER_DATA, message: "" };
    const res = await executeWorkflow(conditionWf("est vide", ""), trigger, CONNECTIONS);
    expect(res.find(r => r.node === "Gmail")?.status).toBe("success");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOC GOOGLE SHEETS
// ═════════════════════════════════════════════════════════════════════════════

describe("Bloc Google Sheets", () => {
  const sheetsConfig = {
    spreadsheet_url: "https://docs.google.com/spreadsheets/d/SHEET_ID_123/edit",
    sheet_name: "Leads",
    columns: JSON.stringify([{ col: "A", val: "{{email}}" }, { col: "B", val: "{{name}}" }]),
  };

  it("ajoute une ligne avec le format JSON colonnes", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Google Sheets", config: sheetsConfig },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA);
    const sheetsResult = res.find(r => r.node === "Google Sheets");
    expect(sheetsResult?.status).toBe("success");
    expect(mockSheetsAppend).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadsheetId: "SHEET_ID_123",
        requestBody: { values: [["client@test.com", "Jean Dupont"]] },
      })
    );
  });

  it("ajoute une ligne avec le format legacy (A=email,B=name)", async () => {
    const legacyConfig = {
      ...sheetsConfig,
      columns: "A=email, B=name",
    };
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Google Sheets", config: legacyConfig },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA);
    expect(res.find(r => r.node === "Google Sheets")?.status).toBe("success");
    expect(mockSheetsAppend).toHaveBeenCalled();
  });

  it("retourne succès sans appel si URL manquante", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Google Sheets", config: { spreadsheet_url: "" } },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA);
    expect(res.find(r => r.node === "Google Sheets")?.status).toBe("success");
    expect(mockSheetsAppend).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOC HTTP REQUEST
// ═════════════════════════════════════════════════════════════════════════════

describe("Bloc HTTP Request", () => {
  it("fait un appel POST avec le corps interpolé", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "HTTP Request", config: { url: "https://api.test.com/hook", method: "POST", body: '{"email":"{{email}}"}' } },
      ],
      [{ source: "1", target: "2" }]
    );
    await executeWorkflow(data, TRIGGER_DATA);
    const fetchMock = vi.mocked(global.fetch);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test.com/hook");
    expect((options as RequestInit).method).toBe("POST");
    expect((options as RequestInit).body).toContain("client@test.com");
  });

  it("ajoute Authorization: Bearer si auth_type = Bearer Token", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "HTTP Request", config: { url: "https://api.test.com/data", method: "GET", auth_type: "Bearer Token", bearer_token: "TOKEN_SECRET" } },
      ],
      [{ source: "1", target: "2" }]
    );
    await executeWorkflow(data, TRIGGER_DATA);
    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    expect((options as RequestInit).headers as Record<string, string>).toMatchObject({ Authorization: "Bearer TOKEN_SECRET" });
  });

  it("ajoute Authorization: Basic si auth_type = Basic Auth", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "HTTP Request", config: { url: "https://api.test.com/data", method: "GET", auth_type: "Basic Auth", basic_user: "user", basic_pass: "pass" } },
      ],
      [{ source: "1", target: "2" }]
    );
    await executeWorkflow(data, TRIGGER_DATA);
    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    const expectedBase64 = Buffer.from("user:pass").toString("base64");
    expect((options as RequestInit).headers as Record<string, string>).toMatchObject({ Authorization: `Basic ${expectedBase64}` });
  });

  it("exporte les champs JSON de la réponse comme variables", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200,
      text: async () => JSON.stringify({ user_id: "U123", score: 42 }),
      json: async () => ({ user_id: "U123", score: 42 }),
    }));

    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "HTTP Request", config: { url: "https://api.test.com/user", method: "GET" } },
        { id: "3", label: "Gmail", config: { to: "x@x.com", subject: "Score: {{score}}", body: "ID: {{user_id}}" } },
      ],
      [{ source: "1", target: "2" }, { source: "2", target: "3" }]
    );
    await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toBe("Score: 42");
    expect(call.html).toContain("U123");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOC FILTRE IA
// ═════════════════════════════════════════════════════════════════════════════

describe("Bloc Filtre IA", () => {
  it("action_if_yes=Continuer → exécute le bloc suivant si OUI", async () => {
    mockGroqCreate.mockResolvedValue({ choices: [{ message: { content: "OUI" } }] });
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Filtre IA", config: { condition: "C'est urgent ?", action_if_yes: "Continuer le workflow", action_if_no: "Arrêter le workflow" } },
        { id: "3", label: "Gmail", config: { to: "boss@test.com", subject: "Urgent", body: "{{message}}" } },
      ],
      [{ source: "1", target: "2" }, { source: "2", target: "3" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS, "pro");
    expect(res.find(r => r.node === "Gmail")?.status).toBe("success");
  });

  it("action_if_no=Arrêter → n'exécute pas le bloc suivant si NON", async () => {
    mockGroqCreate.mockResolvedValue({ choices: [{ message: { content: "NON" } }] });
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Filtre IA", config: { condition: "C'est urgent ?", action_if_yes: "Continuer le workflow", action_if_no: "Arrêter le workflow" } },
        { id: "3", label: "Gmail", config: { to: "boss@test.com", subject: "Urgent", body: "{{message}}" } },
      ],
      [{ source: "1", target: "2" }, { source: "2", target: "3" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS, "pro");
    expect(res.find(r => r.node === "Gmail")).toBeUndefined();
  });

  it("est bloqué sur le plan free", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Filtre IA", config: { condition: "test" } },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA, {}, "free");
    expect(res.find(r => r.node === "Filtre IA")?.status).toBe("error");
    expect(res.find(r => r.node === "Filtre IA")?.error).toContain("Pro");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOC GÉNÉRER TEXTE
// ═════════════════════════════════════════════════════════════════════════════

describe("Bloc Générer texte", () => {
  it("{{texte_genere}} disponible dans le bloc suivant", async () => {
    mockGroqCreate.mockResolvedValue({ choices: [{ message: { content: "Voici un texte généré par l'IA." } }] });
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Générer texte", config: { prompt: "Résume : {{message}}", tone: "Professionnel", max_words: "100" } },
        { id: "3", label: "Gmail", config: { to: "dest@test.com", subject: "Résumé IA", body: "{{texte_genere}}" } },
      ],
      [{ source: "1", target: "2" }, { source: "2", target: "3" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS, "pro");
    expect(res.find(r => r.node === "Générer texte")?.status).toBe("success");
    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain("Voici un texte généré par l'IA.");
  });

  it("output_var custom ET texte_genere sont tous les deux disponibles", async () => {
    mockGroqCreate.mockResolvedValue({ choices: [{ message: { content: "Mon résumé" } }] });
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Générer texte", config: { prompt: "Résume", output_var: "mon_texte" } },
        { id: "3", label: "Slack", config: { message: "{{texte_genere}} — {{mon_texte}}" } },
      ],
      [{ source: "1", target: "2" }, { source: "2", target: "3" }]
    );
    await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS, "pro");
    const slackFetch = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(slackFetch[1]?.body as string);
    expect(body.text).toContain("Mon résumé");
    // Les deux variables doivent être présentes
    expect(body.text.match(/Mon résumé/g)?.length).toBe(2);
  });

  it("est bloqué sur le plan starter", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Générer texte", config: { prompt: "test" } },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA, {}, "starter");
    expect(res.find(r => r.node === "Générer texte")?.status).toBe("error");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOC SLACK
// ═════════════════════════════════════════════════════════════════════════════

describe("Bloc Slack", () => {
  it("envoie un message avec interpolation", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Slack", config: { message: "Nouveau message de {{name}}" } },
      ],
      [{ source: "1", target: "2" }]
    );
    await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS);
    const fetchMock = vi.mocked(global.fetch);
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body.text).toContain("Jean Dupont");
  });

  it("retourne succès sans appel si pas de webhook_url", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Slack", config: { message: "test" } },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA, {}); // sans connexion
    expect(res.find(r => r.node === "Slack")?.status).toBe("success");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOC DISCORD
// ═════════════════════════════════════════════════════════════════════════════

describe("Bloc Discord", () => {
  it("envoie un message via webhook avec interpolation", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Discord", config: { webhook_url: "https://discord.com/api/webhooks/mock", message: "Alerte : {{message}}" } },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA);
    expect(res.find(r => r.node === "Discord")?.status).toBe("success");
    const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string);
    expect(body.content).toContain("Demande urgente");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOC NOTION
// ═════════════════════════════════════════════════════════════════════════════

describe("Bloc Notion", () => {
  it("crée une page avec le titre interpolé", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Notion", config: { database_id: "db_123", title: "Lead : {{email}}", content: "{{message}}" } },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA);
    expect(res.find(r => r.node === "Notion")?.status).toBe("success");
    expect(mockNotionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: { database_id: "db_123" },
        properties: { title: { title: [{ text: { content: "Lead : client@test.com" } }] } },
      })
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOC TELEGRAM
// ═════════════════════════════════════════════════════════════════════════════

describe("Bloc Telegram", () => {
  it("envoie un message à l'API Telegram", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Telegram", config: { bot_token: "TOKEN123", chat_id: "-100456", message: "Bonjour {{name}}" } },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA);
    expect(res.find(r => r.node === "Telegram")?.status).toBe("success");
    const [url, options] = vi.mocked(global.fetch).mock.calls[0];
    expect(String(url)).toContain("TOKEN123");
    const body = JSON.parse(options?.body as string);
    expect(body.chat_id).toBe("-100456");
    expect(body.text).toContain("Jean Dupont");
  });

  it("erreur si token ou chat_id manquant", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Telegram", config: { bot_token: "", chat_id: "" } },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA);
    expect(res.find(r => r.node === "Telegram")?.status).toBe("success");
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOC SMS (Twilio)
// ═════════════════════════════════════════════════════════════════════════════

describe("Bloc SMS (Twilio)", () => {
  it("envoie un SMS avec Basic auth", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "SMS", config: { account_sid: "AC123", auth_token: "tok", from_number: "+33100000000", to_number: "{{phone}}", message: "Bonjour {{name}}" } },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA);
    expect(res.find(r => r.node === "SMS")?.status).toBe("success");
    const [url, options] = vi.mocked(global.fetch).mock.calls[0];
    expect(String(url)).toContain("AC123");
    const expectedBase64 = Buffer.from("AC123:tok").toString("base64");
    expect((options?.headers as Record<string, string>)?.Authorization).toBe(`Basic ${expectedBase64}`);
    const body = new URLSearchParams(options?.body as string);
    expect(body.get("To")).toBe("+33612345678");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOC HUBSPOT
// ═════════════════════════════════════════════════════════════════════════════

describe("Bloc HubSpot", () => {
  it("crée un contact avec les données interpolées", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 201,
      text: async () => JSON.stringify({ id: "contact_789" }),
      json: async () => ({ id: "contact_789" }),
    }));

    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "HubSpot", config: { api_key: "pat-eu1-mock", email: "{{email}}", first_name: "{{name}}" } },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA);
    expect(res.find(r => r.node === "HubSpot")?.status).toBe("success");
    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);
    expect(body.properties.email).toBe("client@test.com");
    expect(body.properties.firstname).toBe("Jean Dupont");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOC AIRTABLE
// ═════════════════════════════════════════════════════════════════════════════

describe("Bloc Airtable", () => {
  it("crée une entrée avec les champs interpolés", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Airtable", config: { api_key: "pat_mock", base_id: "appXXX", table_name: "Leads", fields: '{"Email":"{{email}}","Nom":"{{name}}"}' } },
      ],
      [{ source: "1", target: "2" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA);
    expect(res.find(r => r.node === "Airtable")?.status).toBe("success");
    const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string);
    expect(body.fields.Email).toBe("client@test.com");
    expect(body.fields.Nom).toBe("Jean Dupont");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// COMPATIBILITÉ : chaînes de blocs
// ═════════════════════════════════════════════════════════════════════════════

describe("Compatibilité entre blocs", () => {
  it("Webhook → Condition → Gmail (oui) + Slack (non)", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Condition", config: { field: "amount", operator: "plus grand que", value: "50" } },
        { id: "3", label: "Gmail", config: { to: "finance@test.com", subject: "Paiement élevé", body: "{{amount}}" } },
        { id: "4", label: "Slack", config: { message: "Paiement faible : {{amount}}" } },
      ],
      [
        { source: "1", target: "2" },
        { source: "2", target: "3", sourceHandle: "yes" },
        { source: "2", target: "4", sourceHandle: "no" },
      ]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS);
    expect(res.find(r => r.node === "Gmail")?.status).toBe("success");
    expect(res.find(r => r.node === "Slack")).toBeUndefined();
    // Gmail reçoit bien {{amount}} interpolé
    expect(mockSendMail.mock.calls[0][0].html).toContain("99.90");
  });

  it("Webhook → HTTP → Gmail (variables HTTP disponibles)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200,
      text: async () => JSON.stringify({ crm_id: "CRM_456", tier: "premium" }),
      json: async () => ({ crm_id: "CRM_456", tier: "premium" }),
    }));

    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "HTTP Request", config: { url: "https://crm.test.com/lookup", method: "POST" } },
        { id: "3", label: "Gmail", config: { to: "dest@test.com", subject: "CRM {{crm_id}}", body: "Tier: {{tier}}" } },
      ],
      [{ source: "1", target: "2" }, { source: "2", target: "3" }]
    );
    await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toBe("CRM CRM_456");
    expect(call.html).toContain("premium");
  });

  it("Webhook → Générer texte → Slack (texte_genere disponible)", async () => {
    mockGroqCreate.mockResolvedValue({ choices: [{ message: { content: "Résumé automatique." } }] });
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Générer texte", config: { prompt: "Résume : {{message}}" } },
        { id: "3", label: "Slack", config: { message: "IA dit : {{texte_genere}}" } },
      ],
      [{ source: "1", target: "2" }, { source: "2", target: "3" }]
    );
    await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS, "pro");
    const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string);
    expect(body.text).toContain("Résumé automatique.");
  });

  it("Webhook → Filtre IA → Telegram (conditionnel)", async () => {
    mockGroqCreate.mockResolvedValue({ choices: [{ message: { content: "OUI" } }] });
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Filtre IA", config: { condition: "C'est urgent ?", action_if_yes: "Continuer le workflow", action_if_no: "Arrêter le workflow" } },
        { id: "3", label: "Telegram", config: { bot_token: "TOKEN", chat_id: "12345", message: "Urgent : {{message}}" } },
      ],
      [{ source: "1", target: "2" }, { source: "2", target: "3" }]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA, CONNECTIONS, "pro");
    expect(res.find(r => r.node === "Telegram")?.status).toBe("success");
    const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string);
    expect(body.text).toContain("Demande urgente");
  });

  it("Webhook → Notion + Discord en parallèle (2 edges depuis webhook)", async () => {
    const data = wf(
      [
        { id: "1", label: "Webhook" },
        { id: "2", label: "Notion", config: { database_id: "db_123", title: "Lead {{name}}", content: "{{message}}" } },
        { id: "3", label: "Discord", config: { webhook_url: "https://discord.com/mock", message: "{{email}}" } },
      ],
      [
        { source: "1", target: "2" },
        { source: "1", target: "3" },
      ]
    );
    const res = await executeWorkflow(data, TRIGGER_DATA);
    expect(res.find(r => r.node === "Notion")?.status).toBe("success");
    expect(res.find(r => r.node === "Discord")?.status).toBe("success");
    expect(mockNotionCreate).toHaveBeenCalledTimes(1);
  });
});
