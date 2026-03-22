import { sendWorkflowEmail } from "./email";
import { google } from "googleapis";
import { Client } from "@notionhq/client";

type WorkflowNode = {
  type: string;
  data: {
    label: string;
    config?: Record<string, string>;
  };
};

type WorkflowData = {
  nodes: WorkflowNode[];
  edges: { source: string; target: string }[];
};

export async function executeWorkflow(
  workflowData: WorkflowData,
  triggerData: Record<string, unknown>
) {
  const results = [];

  for (const node of workflowData.nodes) {
    try {
      const result = await executeNode(node, triggerData);
      results.push({ node: node.data?.label || node.type, status: "success", result });
    } catch (error) {
      results.push({ node: node.data?.label || node.type, status: "error", error: String(error) });
    }
  }

  return results;
}

function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(data[key] || `{{${key}}}`);
  });
}

async function executeNode(
  node: WorkflowNode,
  triggerData: Record<string, unknown>
) {
  const config = node.data?.config || {};
  const label = node.data?.label?.toLowerCase() || "";

  // DÉCLENCHEURS
  if (label.includes("webhook") || label.includes("planifié")) {
    return { message: "Déclencheur reçu", data: triggerData };
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