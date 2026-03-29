import { sendWorkflowEmail } from "./email";
import { google } from "googleapis";
import { Client } from "@notionhq/client";

type WorkflowNode = {
  id: string;
  type: string;
  data: {
    label: string;
    config?: Record<string, string>;
  };
};

type WorkflowEdge = {
  source: string;
  target: string;
  sourceHandle?: string;
};

type WorkflowData = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

type ExecutionResult = {
  node: string;
  status: "success" | "error";
  result?: unknown;
  error?: string;
};

export type UserConnections = {
  resend?:  { api_key?: string };
  gmail?:   { email?: string; app_password?: string };
  slack?:   { webhook_url?: string; bot_token?: string };
  notion?:  { token?: string };
  airtable?:{ api_key?: string };
  sheets?:  { service_email?: string; private_key?: string };
};

const AI_BLOCK_LABELS = ["filtre ia", "générer texte", "generate text", "ai filter"];
const PRO_ONLY_LABELS = [...AI_BLOCK_LABELS];

export async function executeWorkflow(
  workflowData: WorkflowData,
  triggerData: Record<string, unknown>,
  connections: UserConnections = {},
  plan = "free"
): Promise<ExecutionResult[]> {
  const nodes = workflowData.nodes || [];
  const edges = workflowData.edges || [];
  if (nodes.length === 0) return [];

  // Construire la liste d'adjacence avec les handles
  const adjacency: Record<string, { target: string; sourceHandle?: string }[]> = {};
  for (const edge of edges) {
    if (!adjacency[edge.source]) adjacency[edge.source] = [];
    adjacency[edge.source].push({ target: edge.target, sourceHandle: edge.sourceHandle });
  }

  // Trouver le nœud déclencheur
  const triggerLabels = ["webhook", "planifié", "slack event", "github"];
  const triggerNode = nodes.find(n =>
    triggerLabels.some(t => (n.data?.label || "").toLowerCase().includes(t))
  );

  const results: ExecutionResult[] = [];

  async function traverse(nodeId: string, data: Record<string, unknown>, seen: Set<string>): Promise<void> {
    if (seen.has(nodeId)) return;
    seen.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const label = (node.data?.label || "").toLowerCase();
    const isCondition = label.includes("condition");
    const isTrigger = triggerLabels.some(t => label === t || label.startsWith(t));
    const isLoop = label.includes("boucle") || label.includes("loop");
    const isFilterIA = label.includes("filtre") && label.includes("ia") || label === "filtre ia";
    const nodeConfig = node.data?.config || {};

    // Les déclencheurs sont juste loggés, pas "exécutés"
    if (isTrigger) {
      results.push({ node: node.data?.label || node.type, status: "success", result: { message: "Déclencheur reçu", data } });
      for (const edge of adjacency[nodeId] || []) {
        await traverse(edge.target, data, seen);
      }
      return;
    }

    // Bloc Boucle : itérer sur un tableau et exécuter les enfants pour chaque item
    if (isLoop) {
      const loopConfig = node.data?.config || {};
      const field = loopConfig.array_field || "";
      let items: unknown[] = [];
      try {
        const raw = data[field];
        if (Array.isArray(raw)) items = raw;
        else if (typeof raw === "string") items = JSON.parse(raw);
      } catch { items = []; }

      results.push({ node: node.data?.label || node.type, status: "success", result: { message: `Boucle sur ${items.length} élément(s)`, field } });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemData: Record<string, unknown> = {
          ...data,
          ...(typeof item === "object" && item !== null ? item as Record<string, unknown> : { _item: item }),
          _index: i,
        };
        for (const edge of adjacency[nodeId] || []) {
          await traverse(edge.target, itemData, new Set<string>());
        }
      }
      return;
    }

    // Vérification plan : bloquer les blocs Pro pour les users Free/Starter
    if (plan !== "pro" && plan !== "business") {
      const isProBlock = PRO_ONLY_LABELS.some(t => label.includes(t));
      if (isProBlock) {
        results.push({ node: node.data?.label || node.type, status: "error", error: "Ce bloc (IA) nécessite le plan Pro ou supérieur." });
        return;
      }
    }

    let passed: boolean | undefined;
    const maxAttempts = 2;
    let lastError: unknown;
    let result: unknown;
    let succeeded = false;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        result = await executeNode(node, data, connections);
        succeeded = true;
        break;
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (!succeeded) {
      results.push({ node: node.data?.label || node.type, status: "error", error: String(lastError) });
      return; // Arrêter cette branche en cas d'erreur
    }

    results.push({ node: node.data?.label || node.type, status: "success", result });
    if (typeof (result as { passed?: boolean }).passed === "boolean") {
      passed = (result as { passed: boolean }).passed;
    }

    // Injecter les sorties du bloc dans le contexte pour les blocs suivants
    const outputVars = extractOutputVars(node, result);
    const nextData = Object.keys(outputVars).length > 0 ? { ...data, ...outputVars } : data;

    const nextEdges = adjacency[nodeId] || [];

    for (const edge of nextEdges) {
      if (isCondition) {
        // Ne suivre que la branche correspondante (Oui ou Non)
        const shouldFollow = passed === true
          ? edge.sourceHandle === "yes"
          : edge.sourceHandle === "no";
        if (shouldFollow) await traverse(edge.target, nextData, seen);
      } else if (isFilterIA) {
        // Respecter les actions configurées (action_if_yes / action_if_no)
        const action = passed === true
          ? (nodeConfig.action_if_yes || "Continuer le workflow")
          : (nodeConfig.action_if_no || "Arrêter le workflow");
        if (action !== "Arrêter le workflow" && action !== "Ignorer silencieusement") {
          await traverse(edge.target, nextData, seen);
        }
      } else {
        await traverse(edge.target, nextData, seen);
      }
    }
  }

  if (triggerNode) {
    await traverse(triggerNode.id, triggerData, new Set<string>());
  } else {
    // Fallback si pas de déclencheur trouvé : exécuter tout séquentiellement
    for (const node of nodes) {
      try {
        const result = await executeNode(node, triggerData);
        results.push({ node: node.data?.label || node.type, status: "success", result });
      } catch (error) {
        results.push({ node: node.data?.label || node.type, status: "error", error: String(error) });
      }
    }
  }

  return results;
}

// Extrait les variables de sortie d'un bloc pour les injecter dans les blocs suivants
function extractOutputVars(node: WorkflowNode, result: unknown): Record<string, unknown> {
  const label = (node.data?.label || "").toLowerCase();
  const config = node.data?.config || {};
  const r = result as Record<string, unknown>;
  if (!r) return {};

  // Générer texte → {{texte_genere}} toujours disponible + nom custom via output_var
  if (label.includes("générer")) {
    const varName = config.output_var?.trim() || "texte_genere";
    // On exporte toujours texte_genere en alias pour que {{texte_genere}} fonctionne quoi qu'il arrive
    return { texte_genere: r.text ?? "", [varName]: r.text ?? "" };
  }

  // Filtre IA → {{ia_result}} (OUI/NON), {{ia_passed}} (true/false)
  if (label.includes("filtre")) {
    return { ia_result: r.result ?? "", ia_passed: r.passed ?? false };
  }

  // HTTP Request → tous les champs JSON de la réponse + {{http_status}}
  if (label.includes("http")) {
    const { status, ok, url, ...rest } = r;
    return { http_status: status, http_ok: ok, http_url: url, ...rest };
  }

  // Stripe → champs de l'objet Stripe directement accessibles
  if (label.includes("stripe")) {
    const d = r.data as Record<string, unknown>;
    if (d && typeof d === "object") {
      return { stripe_id: d.id ?? "", stripe_status: d.status ?? "", ...d };
    }
    return {};
  }

  // Airtable → {{airtable_id}}
  if (label.includes("airtable")) {
    return { airtable_id: String(r.message ?? "").split(": ")[1] ?? "" };
  }

  // Lire emails → {{email_subject}}, {{email_from}}, {{email_date}}, {{email_count}}, {{emails}}
  if (label === "lire emails") {
    return {
      emails: r.emails ?? [],
      email_count: r.email_count ?? 0,
      email_subject: r.email_subject ?? "",
      email_from: r.email_from ?? "",
      email_date: r.email_date ?? "",
    };
  }

  return {};
}

function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{([\w.[\]]+)\}\}/g, (_, key) => {
    // Supporte la notation pointée : event.text → data["event"]["text"]
    const val = key.split(".").reduce((obj: unknown, part: string) => {
      if (obj === null || obj === undefined) return undefined;
      return (obj as Record<string, unknown>)[part];
    }, data as unknown);
    return val !== undefined && val !== null ? String(val) : `{{${key}}}`;
  });
}

async function executeNode(
  node: WorkflowNode,
  triggerData: Record<string, unknown>,
  connections: UserConnections = {}
) {
  const config = node.data?.config || {};
  const label = node.data?.label?.toLowerCase() || "";

  // CONDITION if/else
  if (label.includes("condition")) {
    const field = config.field || "";
    const operator = config.operator || "contient";
    const value = (config.value || "").toLowerCase().trim();
    const fieldValue = String(triggerData[field] ?? "").toLowerCase().trim();

    let passed = false;
    switch (operator) {
      case "contient":         passed = fieldValue.includes(value); break;
      case "ne contient pas":  passed = !fieldValue.includes(value); break;
      case "égal à":           passed = fieldValue === value; break;
      case "différent de":     passed = fieldValue !== value; break;
      case "commence par":     passed = fieldValue.startsWith(value); break;
      case "se termine par":   passed = fieldValue.endsWith(value); break;
      case "plus grand que":   passed = parseFloat(fieldValue) > parseFloat(value); break;
      case "plus petit que":   passed = parseFloat(fieldValue) < parseFloat(value); break;
      case "est vide":         passed = !fieldValue; break;
      case "n'est pas vide":   passed = !!fieldValue; break;
      default:                 passed = false;
    }

    return {
      passed,
      evaluated: `"${fieldValue}" ${operator} "${value}" → ${passed ? "OUI" : "NON"}`,
    };
  }

  // EMAIL via Gmail
  if (label.includes("gmail")) {
    const toRaw = config.to ? interpolate(config.to, triggerData) : null;
    if (!toRaw) return { message: "Gmail — pas de destinataire configuré" };

    // Support multiple recipients (comma-separated, including {{variable}} that resolves to multiple)
    const toList = toRaw.split(",").map((e: string) => e.trim()).filter(Boolean);
    const to = toList.join(", ");

    const subject = interpolate(config.subject || "Notification Loopflo", triggerData);
    const body = interpolate(config.body || JSON.stringify(triggerData, null, 2), triggerData);

    const format = config.format || "HTML";

    // Priorité : choix utilisateur → Resend → Gmail SMTP → Loopflo fallback
    const sendVia = config.send_via || "";
    const forceLoopflo = sendVia.includes("Loopflo");
    if (!forceLoopflo && connections.resend?.api_key) {
      const { Resend } = await import("resend");
      const resend = new Resend(connections.resend.api_key);
      const { error } = await resend.emails.send(
        format === "HTML"
          ? { from: "Loopflo <onboarding@resend.dev>", to: toList, subject, html: body }
          : { from: "Loopflo <onboarding@resend.dev>", to: toList, subject, text: body }
      );
      if (error) throw new Error(error.message);
    } else if (connections.gmail?.email && connections.gmail?.app_password) {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: connections.gmail.email, pass: connections.gmail.app_password },
      });
      await transporter.sendMail({
        from: `Loopflo <${connections.gmail.email}>`,
        to, subject,
        [format === "HTML" ? "html" : "text"]: body,
      });
    } else {
      await sendWorkflowEmail(to, subject, body);
    }
    return { message: `Email envoyé à ${toList.length > 1 ? `${toList.length} destinataires` : to}` };
  }

  // GOOGLE SHEETS
  if (label.includes("sheets") || label.includes("google")) {
    const spreadsheetUrl = config.spreadsheet_url;
    if (!spreadsheetUrl) return { message: "Sheets non configuré — ajoutez l'URL" };

    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return { message: "URL Google Sheets invalide" };

    const spreadsheetId = match[1];
    const sheetName = config.sheet_name || "Feuille1";

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    let values: string[][];

    if (config.columns) {
      try {
        // Format JSON sauvé par SheetsColumnsField : [{ col: "A", val: "{{email}}" }]
        const colDefs = JSON.parse(config.columns) as { col: string; val: string }[];
        if (Array.isArray(colDefs)) {
          values = [colDefs.map(({ val }) => interpolate(val || "", triggerData))];
        } else throw new Error();
      } catch {
        // Fallback format legacy : "A=email, B=name"
        const cols = config.columns.split(",").map((c: string) => c.trim());
        const row = cols.map((col: string) => {
          const [, key] = col.split("=").map((s: string) => s.trim());
          return key ? interpolate(`{{${key}}}`, triggerData) : "";
        });
        values = [row];
      }
    } else {
      const row = [
        new Date().toISOString(),
        ...Object.values(triggerData).map(v => String(v)),
      ];
      values = [row];
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return { message: `Ligne ajoutée dans ${sheetName}` };
  }

  // NOTION
  if (label.includes("notion")) {
    const databaseId = config.database_id;
    if (!databaseId) return { message: "Notion non configuré — ajoutez l'ID de la base" };

    const notionToken = connections.notion?.token || process.env.NOTION_TOKEN;
    const notion = new Client({ auth: notionToken });

    const title = interpolate(
      config.title || "Nouvelle entrée {{date}}",
      triggerData
    );

    const content = interpolate(
      config.content || JSON.stringify(triggerData, null, 2),
      triggerData
    );

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        title: {
          title: [{ text: { content: title } }],
        },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ text: { content: content } }],
          },
        },
      ],
    });

    return { message: `Page créée dans Notion : ${title}` };
  }

  // HTTP REQUEST
  if (label.includes("http")) {
    let url = interpolate(config.url || "https://httpbin.org/post", triggerData);
    const method = config.method || "POST";
    let headers: Record<string, string> = { "Content-Type": "application/json" };
    let body: string | undefined;

    try {
      if (config.headers) headers = { ...headers, ...JSON.parse(config.headers) };
    } catch { /* headers invalides */ }

    // Authentification
    if (config.auth_type === "Bearer Token" && config.bearer_token) {
      headers["Authorization"] = `Bearer ${config.bearer_token}`;
    } else if (config.auth_type === "Basic Auth" && config.basic_user) {
      const creds = Buffer.from(`${config.basic_user}:${config.basic_pass || ""}`).toString("base64");
      headers["Authorization"] = `Basic ${creds}`;
    } else if (config.auth_type === "API Key dans header" && config.api_key_header) {
      headers[config.api_key_header] = config.api_key_value || "";
    } else if (config.auth_type === "API Key dans URL" && config.api_key_param) {
      const sep = url.includes("?") ? "&" : "?";
      url += sep + config.api_key_param.replace(/^[?&]/, "");
    }

    if (method !== "GET") {
      body = config.body ? interpolate(config.body, triggerData) : JSON.stringify(triggerData);
    }

    const res = await fetch(url, { method, headers, body });
    const responseText = await res.text();
    let responseBody: Record<string, unknown> = {};
    try { responseBody = JSON.parse(responseText); } catch { /* pas du JSON */ }
    return { status: res.status, ok: res.ok, url, ...responseBody };
  }

  // SLACK
  if (label.includes("slack")) {
    // Utiliser la connexion Slack de l'utilisateur si disponible
    const webhookUrl = config.webhook_url || connections.slack?.webhook_url;
    if (!webhookUrl) return { message: "Slack non configuré — ajoutez l'URL webhook dans le bloc ou dans Paramètres → Connexions" };

    const message = interpolate(config.message || JSON.stringify(triggerData), triggerData);
    const channel = config.channel || "#general";

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `*${channel}* — ${message}` }),
    });

    return { message: `Message Slack envoyé sur ${channel}` };
  }

  // IA FILTER
  if (label.includes("filtre")) {
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const condition = config.condition || "Ces données sont-elles pertinentes ?";

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: `Réponds UNIQUEMENT par OUI ou NON. ${condition}` },
        { role: "user", content: JSON.stringify(triggerData) },
      ],
      max_tokens: 5,
    });

    const answer = completion.choices[0]?.message?.content?.trim().toUpperCase();
    return { result: answer, passed: answer === "OUI" };
  }

  // IA GENERATE
  if (label.includes("générer")) {
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const prompt = interpolate(
      config.prompt || "Résume ces données : {{data}}",
      { ...triggerData, data: JSON.stringify(triggerData) }
    );
    const language = config.language || "Français";

    const maxWords = parseInt(config.max_words || "150");
    const maxTokens = Math.min(Math.round(maxWords * 1.5), 2000);
    const toneInstruction = config.tone && config.tone !== ""
      ? ` Adopte un ton ${config.tone.toLowerCase()}.`
      : "";

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: `Tu réponds en ${language}.${toneInstruction}` },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
    });

    return { text: completion.choices[0]?.message?.content };
  }

  // DISCORD
  if (label.includes("discord")) {
    const webhookUrl = config.webhook_url;
    if (!webhookUrl) return { message: "Discord non configuré — ajoutez l'URL webhook" };

    const message = interpolate(config.message || JSON.stringify(triggerData), triggerData);
    const username = config.username || "Loopflo";

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message, username }),
    });

    return { message: `Message Discord envoyé` };
  }

  // AIRTABLE
  if (label.includes("airtable")) {
    const apiKey = config.api_key;
    const baseId = config.base_id;
    const tableName = config.table_name;
    if (!apiKey || !baseId || !tableName) return { message: "Airtable non configuré — ajoutez le token, base ID et nom de table" };

    let fields: Record<string, string> = {};
    try {
      if (config.fields) {
        // Parser le template JSON d'abord, puis interpoler chaque valeur séparément
        // pour éviter de casser le JSON si une valeur contient des guillemets
        const template = JSON.parse(config.fields) as Record<string, string>;
        fields = Object.fromEntries(
          Object.entries(template).map(([k, v]) => [k, interpolate(String(v), triggerData)])
        );
      } else {
        fields = Object.fromEntries(Object.entries(triggerData).map(([k, v]) => [k, String(v)]));
      }
    } catch {
      fields = Object.fromEntries(Object.entries(triggerData).map(([k, v]) => [k, String(v)]));
    }

    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Airtable error ${res.status}: ${err}`);
    }

    const data = await res.json() as { id: string };
    return { message: `Entrée Airtable créée : ${data.id}` };
  }

  // STRIPE
  if (label.includes("stripe")) {
    const secretKey = config.secret_key;
    if (!secretKey) return { message: "Stripe non configuré — ajoutez la clé secrète" };

    const action = config.action || "Récupérer un paiement";
    const resourceId = interpolate(config.resource_id || "", triggerData);

    if (!resourceId) return { message: "Stripe — ID de la ressource manquant" };

    let endpoint = "";
    if (action === "Récupérer un paiement") endpoint = `payment_intents/${resourceId}`;
    else if (action === "Récupérer un client") endpoint = `customers/${resourceId}`;
    else if (action === "Créer un client") {
      const res = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ email: interpolate("{{email}}", triggerData) }).toString(),
      });
      if (!res.ok) throw new Error(`Stripe error ${res.status}`);
      const customer = await res.json() as { id: string; email: string };
      return { message: `Client Stripe créé : ${customer.id}`, customer };
    }

    const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
      headers: { "Authorization": `Bearer ${secretKey}` },
    });

    if (!res.ok) throw new Error(`Stripe error ${res.status}`);
    const stripeData = await res.json() as Record<string, unknown>;
    return { message: `Données Stripe récupérées`, data: stripeData };
  }

  // TELEGRAM
  if (label.includes("telegram")) {
    const token = config.bot_token;
    const chatId = config.chat_id;
    if (!token || !chatId) return { message: "Telegram non configuré — ajoutez le token et le chat ID" };
    const message = interpolate(config.message || JSON.stringify(triggerData), triggerData);
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
    });
    if (!res.ok) {
      const err = await res.json() as { description?: string };
      throw new Error(`Telegram error: ${err.description || res.status}`);
    }
    return { message: `Message Telegram envoyé à ${chatId}` };
  }

  // SMS via Twilio
  if (label.includes("sms") || label.includes("twilio")) {
    const sid = config.account_sid;
    const token = config.auth_token;
    const from = config.from_number;
    const to = interpolate(config.to_number || "", triggerData);
    if (!sid || !token || !from || !to) return { message: "SMS non configuré — ajoutez les identifiants Twilio" };
    const body = interpolate(config.message || "Notification Loopflo : {{message}}", triggerData);
    const creds = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
    });
    if (!res.ok) throw new Error(`Twilio error ${res.status}`);
    const data = await res.json() as { sid: string };
    return { message: `SMS envoyé à ${to}`, sms_sid: data.sid };
  }

  // LIRE EMAILS — Gmail IMAP
  if (label === "lire emails") {
    // En mode test (source = test_loopflo) → retourner des données fictives sans se connecter
    if (triggerData.source === "test_loopflo") {
      const mockEmails = [
        { uid: 1, subject: "Bienvenue sur Loopflo !", from: "equipe@loopflo.io", date: new Date().toISOString().split("T")[0] },
        { uid: 2, subject: "Votre facture de mars 2026", from: "facturation@exemple.com", date: new Date().toISOString().split("T")[0] },
        { uid: 3, subject: "Réunion demain à 10h", from: "martin@equipe.com", date: new Date().toISOString().split("T")[0] },
      ];
      return {
        emails: mockEmails,
        email_count: mockEmails.length,
        email_subject: mockEmails[2].subject,
        email_from: mockEmails[2].from,
        email_date: mockEmails[2].date,
        _test: true,
      };
    }

    const gmailConn = connections.gmail;
    if (!gmailConn?.email || !gmailConn?.app_password) {
      return { message: "Gmail non configuré — ajoutez email + mot de passe d'application dans Paramètres → Connexions" };
    }

    const { ImapFlow } = await import("imapflow");
    const maxCount = Math.min(parseInt(config.max_count || "5"), 20);
    const folder = config.folder || "INBOX";
    const filterType = config.filter || "Tous";
    const subjectFilter = (config.subject_filter || "").trim();

    const client = new ImapFlow({
      host: "imap.gmail.com",
      port: 993,
      secure: true,
      auth: { user: gmailConn.email, pass: gmailConn.app_password },
      logger: false,
    });

    try {
      await client.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Authentication") || msg.includes("Invalid credentials")) {
        throw new Error("Authentification Gmail échouée — vérifiez votre email et votre mot de passe d'application dans Paramètres → Connexions");
      }
      throw new Error(`Connexion Gmail impossible : ${msg}`);
    }

    const lock = await client.getMailboxLock(folder).catch(() => {
      throw new Error(`Dossier Gmail "${folder}" introuvable — vérifiez le nom (ex: INBOX)`);
    });
    const messages: Array<{ uid: number; subject: string; from: string; date: string }> = [];

    try {
      if (filterType === "Tous") {
        const mb = client.mailbox;
        const total = (mb && typeof mb === "object" && "exists" in mb) ? (mb.exists as number) : 0;
        if (total > 0) {
          const start = Math.max(1, total - maxCount + 1);
          for await (const msg of client.fetch(`${start}:${total}`, { envelope: true })) {
            messages.push({
              uid: msg.uid,
              subject: msg.envelope?.subject || "(sans sujet)",
              from: msg.envelope?.from?.[0]?.address || "",
              date: msg.envelope?.date?.toISOString().split("T")[0] || "",
            });
          }
        }
      } else {
        type ImapSearch = Parameters<typeof client.search>[0];
        const searchQuery: ImapSearch =
          filterType === "Non lus seulement" ? { seen: false } :
          { subject: subjectFilter };

        const found = await client.search(searchQuery);
        const seqnums = Array.isArray(found) ? found.slice(-maxCount) : [];

        if (seqnums.length > 0) {
          for await (const msg of client.fetch(seqnums, { envelope: true })) {
            messages.push({
              uid: msg.uid,
              subject: msg.envelope?.subject || "(sans sujet)",
              from: msg.envelope?.from?.[0]?.address || "",
              date: msg.envelope?.date?.toISOString().split("T")[0] || "",
            });
          }
        }
      }
    } finally {
      lock.release();
      await client.logout();
    }

    const latest = messages[messages.length - 1] || {};
    return {
      emails: messages,
      email_count: messages.length,
      email_subject: latest.subject || "",
      email_from: latest.from || "",
      email_date: latest.date || "",
    };
  }

  // HUBSPOT — Créer un contact
  if (label.includes("hubspot")) {
    const apiKey = config.api_key;
    if (!apiKey) return { message: "HubSpot non configuré — ajoutez la clé API" };
    const email = interpolate(config.email || "{{email}}", triggerData);
    const firstName = interpolate(config.first_name || "{{name}}", triggerData);
    const properties: Record<string, string> = { email };
    if (firstName) properties.firstname = firstName;
    if (config.last_name) properties.lastname = interpolate(config.last_name, triggerData);
    if (config.phone) properties.phone = interpolate(config.phone, triggerData);
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    });
    if (!res.ok) {
      const err = await res.json() as { message?: string };
      throw new Error(`HubSpot error: ${err.message || res.status}`);
    }
    const data = await res.json() as { id: string };
    return { message: `Contact HubSpot créé : ${email}`, hubspot_id: data.id };
  }

  return { message: `Nœud exécuté`, label };
}
