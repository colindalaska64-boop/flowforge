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

  // Aplatir le format Tally (data.fields[].label → valeur directe)
  const tallyFields = (triggerData?.data as Record<string, unknown>)?.fields;
  if (Array.isArray(tallyFields)) {
    for (const field of tallyFields as { label?: string; value?: unknown }[]) {
      if (field.label && field.value !== undefined) {
        triggerData[field.label] = field.value;
        triggerData[field.label.toLowerCase()] = field.value;
      }
    }
  }

  // Construire la liste d'adjacence avec les handles
  const adjacency: Record<string, { target: string; sourceHandle?: string }[]> = {};
  for (const edge of edges) {
    if (!adjacency[edge.source]) adjacency[edge.source] = [];
    adjacency[edge.source].push({ target: edge.target, sourceHandle: edge.sourceHandle });
  }

  // Trouver le nœud déclencheur
  const triggerLabels = ["webhook", "planifié", "slack event", "github", "rss feed", "typeform"];
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
    const isTrigger = triggerLabels.some(t => label === t || label.startsWith(t) || label.includes(t));
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
    const maxAttempts = 3;
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
        const result = await executeNode(node, triggerData, connections);
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
    return { airtable_id: r.airtable_id ?? String(r.message ?? "").split(": ")[1] ?? "" };
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

  // Trello → {{trello_id}}, {{trello_url}}
  if (label.includes("trello")) return { trello_id: r.trello_id ?? "", trello_url: r.trello_url ?? "" };
  // Zoom → {{zoom_join_url}}, {{zoom_start_url}}, {{zoom_id}}
  if (label.includes("zoom")) return { zoom_id: r.zoom_id ?? "", zoom_join_url: r.zoom_join_url ?? "", zoom_start_url: r.zoom_start_url ?? "" };
  // Calendly → {{calendly_url}}
  if (label.includes("calendly")) return { calendly_url: r.calendly_url ?? "" };
  // YouTube → {{youtube_id}}, {{youtube_url}}
  if (label.includes("youtube")) return { youtube_id: r.youtube_id ?? "", youtube_url: r.youtube_url ?? "" };
  // Instagram → {{instagram_post_id}}
  if (label.includes("instagram")) return { instagram_post_id: r.instagram_post_id ?? "" };
  // TikTok → {{tiktok_publish_id}}
  if (label.includes("tiktok")) return { tiktok_publish_id: r.tiktok_publish_id ?? "" };
  // HubSpot → {{hubspot_id}}
  if (label.includes("hubspot")) return { hubspot_id: r.hubspot_id ?? "" };
  // Salesforce → {{salesforce_id}}
  if (label.includes("salesforce")) return { salesforce_id: r.salesforce_id ?? "" };
  // Mailchimp → {{mailchimp_id}}
  if (label.includes("mailchimp")) return { mailchimp_id: r.mailchimp_id ?? "" };
  // Google Drive → {{drive_id}}, {{drive_url}}
  if (label.includes("drive")) return { drive_id: r.drive_id ?? "", drive_url: r.drive_url ?? "" };

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
    const field = interpolate(config.field || "", triggerData);
    const operator = config.operator || "contient";
    const value = interpolate(config.value || "", triggerData).toLowerCase().trim();
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

    const serviceEmail = connections.sheets?.service_email || process.env.GOOGLE_SERVICE_EMAIL;
    const privateKey = (connections.sheets?.private_key || process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    if (!serviceEmail || !privateKey) return { message: "Google Sheets non configuré — ajoutez les credentials dans Paramètres → Connexions" };

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceEmail,
        private_key: privateKey,
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

    const slackRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `*${channel}* — ${message}` }),
    });

    if (!slackRes.ok) {
      throw new Error(`Slack a retourné une erreur : ${slackRes.status}`);
    }

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

    const answer = completion.choices[0]?.message?.content?.trim().toUpperCase().replace(/[^A-Z]/g, "");
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

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message, username }),
    });

    if (!discordRes.ok) {
      throw new Error(`Discord a retourné une erreur : ${discordRes.status}`);
    }

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
    return { message: `Entrée Airtable créée : ${data.id}`, airtable_id: data.id };
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
        body: new URLSearchParams({ email: interpolate(config.email || "{{email}}", triggerData) }).toString(),
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

    let lock: Awaited<ReturnType<typeof client.getMailboxLock>> | null = null;
    const messages: Array<{ uid: number; subject: string; from: string; date: string }> = [];

    try {
      lock = await client.getMailboxLock(folder).catch(() => {
        throw new Error(`Dossier Gmail "${folder}" introuvable — vérifiez le nom (ex: INBOX)`);
      });

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
          subjectFilter ? { subject: subjectFilter } : { all: true };

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
      lock?.release();
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
      const err = await res.json() as { message?: string; status?: string };
      if (res.status === 409) {
        return { message: `Contact HubSpot déjà existant : ${email}`, skipped: true };
      }
      throw new Error(`HubSpot error: ${err.message || res.status}`);
    }
    const data = await res.json() as { id: string };
    return { message: `Contact HubSpot créé : ${email}`, hubspot_id: data.id };
  }

  // BREVO — Envoyer un email
  if (label.includes("brevo")) {
    const apiKey = config.api_key;
    if (!apiKey) return { message: "Brevo non configuré — ajoutez la clé API" };
    const to = interpolate(config.to || "{{email}}", triggerData);
    if (!to) return { message: "Brevo — destinataire manquant" };
    const subject = interpolate(config.subject || "Notification Loopflo", triggerData);
    const htmlContent = interpolate(config.body || JSON.stringify(triggerData, null, 2), triggerData);
    const senderName = config.sender_name || "Loopflo";
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: senderName, email: "noreply@loopflo.app" },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });
    if (!res.ok) {
      const err = await res.json() as { message?: string };
      throw new Error(`Brevo error ${res.status}: ${err.message || "Erreur inconnue"}`);
    }
    return { message: `Email Brevo envoyé à ${to}` };
  }

  // MAILCHIMP — Ajouter un abonné
  if (label.includes("mailchimp")) {
    const apiKey = config.api_key;
    const listId = config.list_id;
    if (!apiKey || !listId) return { message: "Mailchimp non configuré — ajoutez la clé API et l'ID de liste" };
    const email = interpolate(config.email || "{{email}}", triggerData);
    if (!email) return { message: "Mailchimp — email manquant" };
    const dc = apiKey.split("-")[1] || "us1";
    const status = (config.status || "subscribed").replace(" (double opt-in)", "").replace("pending ", "pending");
    const merge_fields: Record<string, string> = {};
    if (config.first_name) merge_fields.FNAME = interpolate(config.first_name, triggerData);
    const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`loopflo:${apiKey}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email_address: email, status: status === "pending (double opt-in)" ? "pending" : "subscribed", merge_fields }),
    });
    if (!res.ok) {
      const err = await res.json() as { title?: string; detail?: string };
      if (err.title === "Member Exists") return { message: `Abonné Mailchimp déjà existant : ${email}`, skipped: true };
      throw new Error(`Mailchimp error: ${err.detail || err.title || res.status}`);
    }
    const data = await res.json() as { id: string };
    return { message: `Abonné Mailchimp ajouté : ${email}`, mailchimp_id: data.id };
  }

  // GOOGLE DRIVE — Enregistrer un fichier
  if (label.includes("google drive") || label.includes("drive")) {
    const folderId = config.folder_id;
    const fileName = interpolate(config.file_name || `loopflo-${Date.now()}.txt`, triggerData);
    const content = interpolate(config.content || JSON.stringify(triggerData, null, 2), triggerData);
    const mimeTypeMap: Record<string, string> = {
      "Texte (.txt)": "text/plain",
      "CSV (.csv)": "text/csv",
      "JSON (.json)": "application/json",
    };
    const mimeType = mimeTypeMap[config.format || "Texte (.txt)"] || "text/plain";

    const serviceEmail = process.env.GOOGLE_SERVICE_EMAIL;
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    if (!serviceEmail || !privateKey) return { message: "Google Drive non configuré — ajoutez GOOGLE_SERVICE_EMAIL et GOOGLE_PRIVATE_KEY dans les variables d'environnement" };

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: serviceEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    const drive = google.drive({ version: "v3", auth });
    const meta: Record<string, unknown> = { name: fileName, mimeType };
    if (folderId) meta.parents = [folderId];

    const { Readable } = await import("stream");
    const res = await drive.files.create({
      requestBody: meta,
      media: { mimeType, body: Readable.from([content]) },
      fields: "id, name, webViewLink",
    });
    return { message: `Fichier créé sur Google Drive : ${res.data.name}`, drive_id: res.data.id, drive_url: res.data.webViewLink };
  }

  // TRELLO — Créer une carte
  if (label.includes("trello")) {
    const apiKey = config.api_key;
    const token = config.token;
    const listId = config.list_id;
    if (!apiKey || !token || !listId) return { message: "Trello non configuré — ajoutez la clé API, le token et l'ID de liste" };
    const name = interpolate(config.name || "Nouvelle carte — {{source}}", triggerData);
    const desc = interpolate(config.desc || "", triggerData);
    const params = new URLSearchParams({ key: apiKey, token, idList: listId, name });
    if (desc) params.append("desc", desc);
    const res = await fetch(`https://api.trello.com/1/cards?${params.toString()}`, {
      method: "POST",
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) throw new Error(`Trello error ${res.status}`);
    const data = await res.json() as { id: string; url: string; name: string };
    return { message: `Carte Trello créée : ${data.name}`, trello_id: data.id, trello_url: data.url };
  }

  // SHOPIFY — Gérer une commande
  if (label.includes("shopify")) {
    const storeDomain = config.store_domain?.replace(/^https?:\/\//, "");
    const accessToken = config.access_token;
    if (!storeDomain || !accessToken) return { message: "Shopify non configuré — ajoutez le domaine et l'access token" };
    const action = config.action || "Récupérer une commande";
    const headers = { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" };
    const baseUrl = `https://${storeDomain}/admin/api/2024-01`;

    if (action === "Récupérer une commande") {
      const orderId = interpolate(config.order_id || "{{id}}", triggerData);
      const endpoint = orderId && orderId !== "{{id}}" ? `${baseUrl}/orders/${orderId}.json` : `${baseUrl}/orders.json?limit=5&status=any`;
      const res = await fetch(endpoint, { headers });
      if (!res.ok) throw new Error(`Shopify error ${res.status}`);
      const data = await res.json() as { order?: Record<string, unknown>; orders?: Record<string, unknown>[] };
      const order = data.order || data.orders?.[0];
      return { message: `Commande Shopify récupérée`, shopify_order_id: (order as Record<string, unknown>)?.id, ...order };
    }
    return { message: `Shopify — action "${action}" non supportée` };
  }

  // ZOOM — Créer une réunion
  if (label.includes("zoom")) {
    const accountId = config.account_id;
    const clientId = config.client_id;
    const clientSecret = config.client_secret;
    if (!accountId || !clientId || !clientSecret) return { message: "Zoom non configuré — ajoutez Account ID, Client ID et Client Secret" };

    // Obtenir le token OAuth Server-to-Server
    const tokenRes = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (!tokenRes.ok) throw new Error(`Zoom OAuth error ${tokenRes.status}`);
    const { access_token } = await tokenRes.json() as { access_token: string };

    const topic = interpolate(config.topic || "Réunion Loopflo — {{source}}", triggerData);
    const durationMap: Record<string, number> = { "15 min": 15, "30 min": 30, "45 min": 45, "1 heure": 60, "2 heures": 120 };
    const duration = durationMap[config.duration || "30 min"] || 30;
    const typeMap: Record<string, number> = { "Instantanée": 1, "Planifiée": 2, "Récurrente": 3 };
    const type = typeMap[config.type || "Instantanée"] || 1;

    const meetRes = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ topic, type, duration }),
    });
    if (!meetRes.ok) throw new Error(`Zoom meeting error ${meetRes.status}`);
    const meet = await meetRes.json() as { id: number; join_url: string; start_url: string; topic: string };
    return { message: `Réunion Zoom créée : ${meet.topic}`, zoom_id: meet.id, zoom_join_url: meet.join_url, zoom_start_url: meet.start_url };
  }

  // CALENDLY — Créer un lien de prise de RDV
  if (label.includes("calendly")) {
    const accessToken = config.access_token;
    if (!accessToken) return { message: "Calendly non configuré — ajoutez votre Personal Access Token" };

    // Récupérer l'utilisateur courant
    const userRes = await fetch("https://api.calendly.com/users/me", {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    if (!userRes.ok) throw new Error(`Calendly auth error ${userRes.status}`);
    const userData = await userRes.json() as { resource: { uri: string; scheduling_url: string } };

    const ownerUri = config.event_type_uri || userData.resource.uri;
    const ownerType = config.event_type_uri ? "EventType" : "User";

    const linkRes = await fetch("https://api.calendly.com/scheduling_links", {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ max_event_count: 1, owner: ownerUri, owner_type: ownerType }),
    });
    if (!linkRes.ok) throw new Error(`Calendly link error ${linkRes.status}`);
    const linkData = await linkRes.json() as { resource: { booking_url: string } };
    return { message: "Lien Calendly créé", calendly_url: linkData.resource.booking_url, calendly_profile: userData.resource.scheduling_url };
  }

  // SALESFORCE — Créer un objet CRM
  if (label.includes("salesforce")) {
    const clientId = config.client_id;
    const clientSecret = config.client_secret;
    const username = config.username;
    const password = config.password;
    if (!clientId || !clientSecret || !username || !password) return { message: "Salesforce non configuré — ajoutez Consumer Key, Secret, username et password+token" };

    // OAuth2 password grant
    const tokenRes = await fetch("https://login.salesforce.com/services/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "password", client_id: clientId, client_secret: clientSecret, username, password }).toString(),
    });
    if (!tokenRes.ok) throw new Error(`Salesforce OAuth error ${tokenRes.status}`);
    const { access_token, instance_url } = await tokenRes.json() as { access_token: string; instance_url: string };

    const objectType = config.object_type || "Contact";
    const fields: Record<string, string> = {};
    if (config.name) fields.LastName = interpolate(config.name, triggerData);
    if (config.email) fields.Email = interpolate(config.email, triggerData);

    const createRes = await fetch(`${instance_url}/services/data/v57.0/sobjects/${objectType}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!createRes.ok) throw new Error(`Salesforce create error ${createRes.status}`);
    const sfData = await createRes.json() as { id: string };
    return { message: `${objectType} Salesforce créé`, salesforce_id: sfData.id };
  }

  // INSTAGRAM — Publier un post
  if (label.includes("instagram")) {
    const accessToken = config.access_token;
    const accountId = config.instagram_account_id;
    if (!accessToken || !accountId) return { message: "Instagram non configuré — ajoutez l'Access Token et l'ID du compte" };
    const imageUrl = interpolate(config.image_url || "", triggerData);
    if (!imageUrl) return { message: "Instagram — URL de l'image manquante" };
    const caption = interpolate(config.caption || "", triggerData);
    const mediaType = config.media_type || "IMAGE";

    // Étape 1 : créer le conteneur média
    const containerBody: Record<string, string> = { access_token: accessToken };
    if (mediaType === "VIDEO" || mediaType === "REELS") {
      containerBody.media_type = "REELS";
      containerBody.video_url = imageUrl;
    } else {
      containerBody.image_url = imageUrl;
    }
    if (caption) containerBody.caption = caption;

    const containerRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(containerBody),
    });
    if (!containerRes.ok) {
      const err = await containerRes.json() as { error?: { message?: string } };
      throw new Error(`Instagram media error: ${err.error?.message || containerRes.status}`);
    }
    const { id: creationId } = await containerRes.json() as { id: string };

    // Étape 2 : publier
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
    });
    if (!publishRes.ok) throw new Error(`Instagram publish error ${publishRes.status}`);
    const published = await publishRes.json() as { id: string };
    return { message: `Post Instagram publié`, instagram_post_id: published.id };
  }

  // YOUTUBE — Publier une vidéo
  if (label.includes("youtube")) {
    const clientId = config.client_id;
    const clientSecret = config.client_secret;
    const refreshToken = config.refresh_token;
    if (!clientId || !clientSecret || !refreshToken) return { message: "YouTube non configuré — ajoutez Client ID, Client Secret et Refresh Token" };
    const videoUrl = interpolate(config.video_url || "", triggerData);
    if (!videoUrl) return { message: "YouTube — URL de la vidéo manquante" };

    // Obtenir un access token via refresh token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }).toString(),
    });
    if (!tokenRes.ok) throw new Error(`YouTube OAuth error ${tokenRes.status}`);
    const { access_token } = await tokenRes.json() as { access_token: string };

    const title = interpolate(config.title || "Vidéo Loopflo — {{source}}", triggerData);
    const description = interpolate(config.description || "", triggerData);
    const privacyStatus = config.privacy_status || "private";

    // Télécharger la vidéo depuis l'URL
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) throw new Error(`Impossible de télécharger la vidéo depuis l'URL fournie`);
    const videoBuffer = await videoRes.arrayBuffer();

    // Upload multipart vers YouTube
    const boundary = "loopflo_boundary_" + Date.now();
    const metaJson = JSON.stringify({ snippet: { title, description }, status: { privacyStatus } });
    const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaJson}\r\n`;
    const videoPart = `--${boundary}\r\nContent-Type: video/*\r\n\r\n`;
    const closePart = `\r\n--${boundary}--`;

    const bodyParts = [
      new TextEncoder().encode(metaPart),
      new TextEncoder().encode(videoPart),
      new Uint8Array(videoBuffer),
      new TextEncoder().encode(closePart),
    ];
    const totalLength = bodyParts.reduce((s, p) => s + p.byteLength, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of bodyParts) { merged.set(part, offset); offset += part.byteLength; }

    const uploadRes = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status", {
      method: "POST",
      headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      body: merged,
    });
    if (!uploadRes.ok) {
      const err = await uploadRes.json() as { error?: { message?: string } };
      throw new Error(`YouTube upload error: ${err.error?.message || uploadRes.status}`);
    }
    const ytData = await uploadRes.json() as { id: string };
    return { message: `Vidéo YouTube uploadée (${privacyStatus})`, youtube_id: ytData.id, youtube_url: `https://youtu.be/${ytData.id}` };
  }

  // TIKTOK — Publier une vidéo
  if (label.includes("tiktok")) {
    const accessToken = config.access_token;
    const openId = config.open_id;
    if (!accessToken || !openId) return { message: "TikTok non configuré — ajoutez l'Access Token et l'Open ID" };
    const videoUrl = interpolate(config.video_url || "", triggerData);
    if (!videoUrl) return { message: "TikTok — URL de la vidéo manquante" };
    const caption = interpolate(config.caption || "", triggerData);
    const privacyLevel = config.privacy_level || "SELF_ONLY";

    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({
        post_info: { title: caption.slice(0, 150), privacy_level: privacyLevel, disable_duet: false, disable_stitch: false, disable_comment: false },
        source_info: { source: "PULL_FROM_URL", video_url: videoUrl },
      }),
    });
    if (!initRes.ok) {
      const err = await initRes.json() as { error?: { message?: string } };
      throw new Error(`TikTok error: ${err.error?.message || initRes.status}`);
    }
    const ttData = await initRes.json() as { data?: { publish_id?: string } };
    return { message: `Vidéo TikTok soumise à la publication`, tiktok_publish_id: ttData.data?.publish_id };
  }

  return { message: `Nœud exécuté`, label };
}
