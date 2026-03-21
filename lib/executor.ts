import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
      results.push({ node: node.type, status: "success", result });
    } catch (error) {
      results.push({ node: node.type, status: "error", error: String(error) });
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
  const nodeType = node.data?.label?.toLowerCase();

  switch (true) {

    // DÉCLENCHEURS — rien à exécuter
    case nodeType?.includes("webhook"):
    case nodeType?.includes("planifié"):
    case nodeType?.includes("gmail") && !config.to:
      return { message: "Déclencheur reçu", data: triggerData };

    // EMAIL via Gmail configuré
    case nodeType?.includes("gmail") && !!config.to: {
      const to = interpolate(config.to, triggerData);
      const subject = interpolate(config.subject || "Notification Loopflo", triggerData);
      const body = interpolate(config.body || JSON.stringify(triggerData, null, 2), triggerData);

      await resend.emails.send({
        from: process.env.RESEND_FROM!,
        to,
        subject,
        html: `
          <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
            <div style="margin-bottom:24px;">
              <span style="font-size:18px;font-weight:800;color:#0A0A0A;">Loop<span style="color:#4F46E5;">flo</span></span>
            </div>
            <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:24px;">
              <h2 style="font-size:18px;font-weight:700;color:#0A0A0A;margin:0 0 12px;">${subject}</h2>
              <p style="font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${body}</p>
            </div>
            <p style="font-size:11px;color:#D1D5DB;margin-top:16px;text-align:center;">Envoyé automatiquement par Loopflo</p>
          </div>
        `,
      });
      return { message: `Email envoyé à ${to}` };
    }

    // HTTP REQUEST
    case nodeType?.includes("http"): {
      const url = interpolate(config.url || "https://httpbin.org/post", triggerData);
      const method = config.method || "POST";
      let headers: Record<string, string> = { "Content-Type": "application/json" };
      let body: string | undefined;

      try {
        if (config.headers) headers = { ...headers, ...JSON.parse(config.headers) };
      } catch { /* headers invalides, on ignore */ }

      if (method !== "GET") {
        body = config.body ? interpolate(config.body, triggerData) : JSON.stringify(triggerData);
      }

      const res = await fetch(url, { method, headers, body });
      return { status: res.status, ok: res.ok, url };
    }

    // SLACK via webhook
    case nodeType?.includes("slack"): {
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
    case nodeType?.includes("filtre"): {
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
    case nodeType?.includes("générer"): {
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
    case nodeType?.includes("notion"): {
      if (!config.database_id) return { message: "Notion non configuré — ajoutez l'ID de la base" };
      return { message: "Notion — intégration API à venir", config };
    }

    // GOOGLE SHEETS
    case nodeType?.includes("sheets"): {
      if (!config.spreadsheet_url) return { message: "Sheets non configuré — ajoutez l'URL" };
      return { message: "Google Sheets — intégration API à venir", config };
    }

    default:
      return { message: `Nœud exécuté`, type: nodeType };
  }
}