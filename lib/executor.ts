import { sendWorkflowEmail } from "./email";

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

  // DÉCLENCHEURS — rien à exécuter
  if (label.includes("webhook") || label.includes("planifié")) {
    return { message: "Déclencheur reçu", data: triggerData };
  }

  // EMAIL via Gmail (Nodemailer)
  if (label.includes("gmail")) {
    const to = config.to ? interpolate(config.to, triggerData) : null;

    if (!to) {
      return { message: "Gmail — pas de destinataire configuré" };
    }

    const subject = interpolate(
      config.subject || "Notification Loopflo",
      triggerData
    );
    const body = interpolate(
      config.body || JSON.stringify(triggerData, null, 2),
      triggerData
    );

    await sendWorkflowEmail(to, subject, body);
    return { message: `Email envoyé à ${to}` };
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
      body = config.body
        ? interpolate(config.body, triggerData)
        : JSON.stringify(triggerData);
    }

    const res = await fetch(url, { method, headers, body });
    return { status: res.status, ok: res.ok, url };
  }

  // SLACK
  if (label.includes("slack")) {
    const webhookUrl = config.webhook_url;
    if (!webhookUrl) return { message: "Slack non configuré — ajoutez l'URL webhook" };

    const message = interpolate(
      config.message || JSON.stringify(triggerData),
      triggerData
    );
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

  // NOTION
  if (label.includes("notion")) {
    if (!config.database_id) return { message: "Notion non configuré — ajoutez l'ID de la base" };
    return { message: "Notion — intégration API à venir" };
  }

  // GOOGLE SHEETS
  if (label.includes("sheets") || label.includes("google")) {
    if (!config.spreadsheet_url) return { message: "Sheets non configuré — ajoutez l'URL" };
    return { message: "Google Sheets — intégration API à venir" };
  }

  return { message: `Nœud exécuté`, label };
}