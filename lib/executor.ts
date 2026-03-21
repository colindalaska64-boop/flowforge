import { sendWelcomeEmail } from "./email";

type WorkflowNode = {
  type: string;
  data: {
    label: string;
    desc: string;
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

async function executeNode(
  node: WorkflowNode,
  triggerData: Record<string, unknown>
) {
  switch (node.type) {

    case "gmail":
    case "webhook":
    case "schedule":
      // Déclencheurs — pas d'action à exécuter
      return { message: "Déclencheur reçu", data: triggerData };

    case "http": {
      // Appel HTTP vers une URL externe
      const url = (triggerData.url as string) || "https://httpbin.org/post";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(triggerData),
      });
      return { status: res.status, ok: res.ok };
    }

    case "ai_filter": {
      // Utilise Groq pour analyser les données
      const Groq = (await import("groq-sdk")).default;
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Analyse ces données et réponds par OUI ou NON si elles sont pertinentes." },
          { role: "user", content: JSON.stringify(triggerData) },
        ],
        max_tokens: 10,
      });
      return { result: completion.choices[0]?.message?.content };
    }

    case "ai_generate": {
      // Génère du texte avec Groq
      const Groq = (await import("groq-sdk")).default;
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Tu génères du contenu utile basé sur les données reçues." },
          { role: "user", content: `Génère un résumé de ces données : ${JSON.stringify(triggerData)}` },
        ],
        max_tokens: 200,
      });
      return { text: completion.choices[0]?.message?.content };
    }

    default:
      return { message: `Nœud ${node.type} non encore implémenté` };
  }
}