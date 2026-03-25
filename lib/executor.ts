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

export async function executeWorkflow(
  workflowData: WorkflowData,
  triggerData: Record<string, unknown>
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
  const triggerLabels = ["webhook", "planifié", "gmail"];
  const triggerNode = nodes.find(n =>
    triggerLabels.some(t => (n.data?.label || "").toLowerCase().includes(t))
  );

  const results: ExecutionResult[] = [];
  const visited = new Set<string>();

  async function traverse(nodeId: string): Promise<void> {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const label = (node.data?.label || "").toLowerCase();
    const isCondition = label.includes("condition");
    const isTrigger = triggerLabels.some(t => label.includes(t));

    // Les déclencheurs sont juste loggés, pas "exécutés"
    if (isTrigger) {
      results.push({ node: node.data?.label || node.type, status: "success", result: { message: "Déclencheur reçu", data: triggerData } });
      for (const edge of adjacency[nodeId] || []) {
        await traverse(edge.target);
      }
      return;
    }

    let passed: boolean | undefined;
    try {
      const result = await executeNode(node, triggerData);
      results.push({ node: node.data?.label || node.type, status: "success", result });
      if (typeof (result as { passed?: boolean }).passed === "boolean") {
        passed = (result as { passed: boolean }).passed;
      }
    } catch (error) {
      results.push({ node: node.data?.label || node.type, status: "error", error: String(error) });
      return; // Arrêter cette branche en cas d'erreur
    }

    const nextEdges = adjacency[nodeId] || [];

    for (const edge of nextEdges) {
      if (isCondition) {
        // Ne suivre que la branche correspondante (Oui ou Non)
        const shouldFollow = passed === true
          ? edge.sourceHandle === "yes"
          : edge.sourceHandle === "no";
        if (shouldFollow) await traverse(edge.target);
      } else {
        await traverse(edge.target);
      }
    }
  }

  if (triggerNode) {
    await traverse(triggerNode.id);
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

function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(data[key] ?? `{{${key}}}`);
  });
}

async function executeNode(
  node: WorkflowNode,
  triggerData: Record<string, unknown>
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
    const to = config.to ? interpolate(config.to, triggerData) : null;
    if (!to) return { message: "Gmail — pas de destinataire configuré" };

    const subject = interpolate(config.subject || "Notification Loopflo", triggerData);
    const body = interpolate(config.body || JSON.stringify(triggerData, null, 2), triggerData);

    await sendWorkflowEmail(to, subject, body);
    return { message: `Email envoyé à ${to}` };
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
      const cols = config.columns.split(",").map((c: string) => c.trim());
      const row = cols.map((col: string) => {
        const [, key] = col.split("=").map((s: string) => s.trim());
        return key ? interpolate(`{{${key}}}`, triggerData) : "";
      });
      values = [row];
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

    const notion = new Client({ auth: process.env.NOTION_TOKEN });

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
    const url = interpolate(config.url || "https://httpbin.org/post", triggerData);
    const method = config.method || "POST";
    let headers: Record<string, string> = { "Content-Type": "application/json" };
    let body: string | undefined;

    try {
      if (config.headers) headers = { ...headers, ...JSON.parse(config.headers) };
    } catch { /* headers invalides */ }

    if (method !== "GET") {
      body = config.body ? interpolate(config.body, triggerData) : JSON.stringify(triggerData);
    }

    const res = await fetch(url, { method, headers, body });
    return { status: res.status, ok: res.ok, url };
  }

  // SLACK
  if (label.includes("slack")) {
    const webhookUrl = config.webhook_url;
    if (!webhookUrl) return { message: "Slack non configuré — ajoutez l'URL webhook" };

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

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: `Tu réponds en ${language}.` },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
    });

    return { text: completion.choices[0]?.message?.content };
  }

  return { message: `Nœud exécuté`, label };
}
