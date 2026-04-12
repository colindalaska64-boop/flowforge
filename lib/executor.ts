import { sendWorkflowEmail, sendFeatureSuggestionToAdmin } from "./email";
import { google } from "googleapis";
import { Client } from "@notionhq/client";
import crypto from "crypto";

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
  resend?:     { api_key?: string };
  gmail?:      { email?: string; app_password?: string };
  gmail_oauth?: { email?: string; access_token?: string; refresh_token?: string; expires_at?: number };
  slack?:      { webhook_url?: string; bot_token?: string };
  notion?:     { token?: string };
  airtable?:   { api_key?: string };
  sheets?:     { service_email?: string; private_key?: string };
  stability?:  { api_key?: string };
  gemini?:     { api_key?: string };
  elevenlabs?: { api_key?: string };
};

// Rafraîchit un access_token Google si expiré
async function getValidGoogleAccessToken(oauth: NonNullable<UserConnections["gmail_oauth"]>): Promise<string | null> {
  if (!oauth.access_token) return null;
  const isExpired = !oauth.expires_at || Date.now() >= oauth.expires_at - 60_000;
  if (!isExpired) return oauth.access_token;
  if (!oauth.refresh_token) return oauth.access_token; // mieux que rien

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return oauth.access_token;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: oauth.refresh_token,
        grant_type: "refresh_token",
      }).toString(),
    });
    const data = await res.json() as { access_token?: string };
    return data.access_token || oauth.access_token;
  } catch {
    return oauth.access_token;
  }
}

const AI_BLOCK_LABELS = ["filtre ia", "générer texte", "generate text", "ai filter", "réponse auto", "reponse auto", "générer image", "générer voix", "générer vidéo", "vidéo virale"];

// Phrases indiquant que l'IA a dit qu'une fonctionnalité est impossible / non disponible dans Loopflo
const IMPOSSIBLE_INDICATORS = [
  "pas encore disponible",
  "n'est pas disponible",
  "n'est pas encore",
  "pas encore implémenté",
  "pas encore intégré",
  "bientôt disponible",
  "prochainement disponible",
  "pas encore pris en charge",
  "n'est pas pris en charge",
  "ne supporte pas encore",
  "loopflo ne supporte pas",
  "loopflo ne peut pas",
  "cette fonctionnalité n'est pas",
  "fonctionnalité non disponible",
  "cette intégration n'existe pas",
  "not yet available",
  "not currently supported",
  "not yet implemented",
  "coming soon",
];

function detectsImpossible(text: string): boolean {
  const lower = text.toLowerCase();
  return IMPOSSIBLE_INDICATORS.some(phrase => lower.includes(phrase));
}
const PRO_ONLY_LABELS = [...AI_BLOCK_LABELS];

export async function executeWorkflow(
  workflowData: WorkflowData,
  triggerData: Record<string, unknown>,
  connections: UserConnections = {},
  plan = "free",
  globalVars: Record<string, string> = {},
  workflowMeta: { name?: string; userEmail?: string } = {}
): Promise<ExecutionResult[]> {
  const nodes = workflowData.nodes || [];
  const edges = workflowData.edges || [];
  if (nodes.length === 0) return [];

  // Injecter les variables globales dans les données de trigger
  // Accessibles via {{nom_variable}} comme les données webhook
  for (const [key, val] of Object.entries(globalVars)) {
    if (!(key in triggerData)) {
      triggerData[key] = val;
    }
  }

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

    // Bloc Délai : attendre N secondes puis continuer
    const isDélai = label.includes("délai") || label === "delay";
    if (isDélai) {
      const seconds = Math.min(parseInt(nodeConfig.seconds || "5"), 30);
      await new Promise(r => setTimeout(r, seconds * 1000));
      results.push({ node: node.data?.label || node.type, status: "success", result: { message: `Attente de ${seconds}s terminée` } });
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
        result = await executeNode(node, data, connections, workflowMeta);
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
    // Fallback si pas de déclencheur trouvé : exécuter tout séquentiellement en chaînant les sorties
    let fallbackData: Record<string, unknown> = { ...triggerData };
    for (const node of nodes) {
      try {
        const result = await executeNode(node, fallbackData, connections, workflowMeta);
        results.push({ node: node.data?.label || node.type, status: "success", result });
        const outputVars = extractOutputVars(node, result);
        if (Object.keys(outputVars).length > 0) {
          fallbackData = { ...fallbackData, ...outputVars };
        }
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

  // Générer image → {{image_url}} + nom custom
  if (label.includes("générer image") || label.includes("generer image")) {
    const varName = config.output_var?.trim() || "image_url";
    return { image_url: r.image_url ?? "", [varName]: r.image_url ?? "" };
  }

  // Générer voix → {{audio_url}} + nom custom
  if (label.includes("générer voix") || label.includes("generer voix")) {
    const varName = config.output_var?.trim() || "audio_url";
    return { audio_url: r.audio_url ?? "", [varName]: r.audio_url ?? "" };
  }

  // Générer vidéo → {{video_url}} + nom custom
  if (label.includes("générer vidéo") || label.includes("generer video")) {
    const varName = config.output_var?.trim() || "video_url";
    return { video_url: r.video_url ?? "", [varName]: r.video_url ?? "" };
  }

  // Vidéo virale courte → {{script}}, {{audio_url}}, {{image_url}}
  if (label.includes("vidéo virale") || label.includes("video virale")) {
    const varName = config.output_var?.trim() || "video";
    return {
      script: r.script ?? "",
      audio_url: r.audio_url ?? "",
      image_url: r.image_url ?? "",
      [varName]: r.script ?? "",
    };
  }

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
  connections: UserConnections = {},
  workflowMeta: { name?: string; userEmail?: string } = {}
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

  // COMPOSITE — Notification multi-canal (envoie à plusieurs canaux d'un coup)
  if (label.includes("multi-canal") || label.includes("notification multi")) {
    const message = interpolate(config.message || "Notification", triggerData);
    const sent: string[] = [];
    const errors: string[] = [];

    if (config.send_email === "1" && config.email_to) {
      try {
        const to = interpolate(config.email_to, triggerData);
        const subject = interpolate(config.email_subject || "Notification Loopflo", triggerData);
        if (connections.gmail_oauth?.access_token) {
          const accessToken = await getValidGoogleAccessToken(connections.gmail_oauth);
          const fromEmail = connections.gmail_oauth.email || "me";
          const raw = Buffer.from([
            `From: Loopflo <${fromEmail}>`,
            `To: ${to}`,
            `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
            "MIME-Version: 1.0",
            "Content-Type: text/plain; charset=UTF-8",
            "",
            message,
          ].join("\r\n")).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
          const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ raw }),
          });
          if (!r.ok) throw new Error(`Gmail API ${r.status}`);
        } else if (connections.gmail?.email && connections.gmail?.app_password) {
          const nodemailer = (await import("nodemailer")).default;
          const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: connections.gmail.email, pass: connections.gmail.app_password } });
          await transporter.sendMail({ from: `Loopflo <${connections.gmail.email}>`, to, subject, text: message });
        } else {
          await sendWorkflowEmail(to, subject, message);
        }
        sent.push("Email");
      } catch (e) { errors.push(`Email: ${e}`); }
    }

    if (config.send_slack === "1") {
      try {
        const url = config.slack_webhook || connections.slack?.webhook_url;
        if (!url) throw new Error("webhook manquant");
        const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: message }) });
        if (!r.ok) throw new Error(`status ${r.status}`);
        sent.push("Slack");
      } catch (e) { errors.push(`Slack: ${e}`); }
    }

    if (config.send_discord === "1") {
      try {
        const url = config.discord_webhook;
        if (!url) throw new Error("webhook manquant");
        const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: message, username: "Loopflo" }) });
        if (!r.ok) throw new Error(`status ${r.status}`);
        sent.push("Discord");
      } catch (e) { errors.push(`Discord: ${e}`); }
    }

    if (config.send_telegram === "1") {
      try {
        const token = config.telegram_bot;
        const chatId = config.telegram_chat;
        if (!token || !chatId) throw new Error("token ou chat ID manquant");
        const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
        });
        if (!r.ok) throw new Error(`status ${r.status}`);
        sent.push("Telegram");
      } catch (e) { errors.push(`Telegram: ${e}`); }
    }

    if (sent.length === 0 && errors.length === 0) {
      return { message: "Aucun canal sélectionné — cochez au moins un canal" };
    }
    if (errors.length > 0) {
      throw new Error(`Multi-canal partiel — envoyés: [${sent.join(", ")}] — erreurs: ${errors.join(" | ")}`);
    }
    return { message: `Notification envoyée sur ${sent.join(", ")}`, channels: sent };
  }

  // COMPOSITE — Réponse auto IA (IA + envoi en 1 bloc)
  if (label.includes("réponse auto") || label.includes("reponse auto") || label.includes("auto ia")) {
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const prompt = interpolate(config.prompt || "Réponds à : {{message}}", triggerData);
    const tone = config.tone ? ` Adopte un ton ${config.tone.toLowerCase()}.` : "";
    const maxWords = parseInt(config.max_words || "150");
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: `Tu réponds en français.${tone} Sois concis (max ${maxWords} mots).` },
        { role: "user", content: prompt },
      ],
      max_tokens: Math.min(Math.round(maxWords * 1.5), 2000),
    });
    const generated = completion.choices[0]?.message?.content?.trim() || "";

    // Détecter si l'IA signale une fonctionnalité manquante → alerter Colin
    if (generated && detectsImpossible(generated)) {
      sendFeatureSuggestionToAdmin(
        workflowMeta.name || "Inconnu",
        workflowMeta.userEmail || "inconnu",
        node.data?.label || "Réponse auto IA",
        prompt,
        generated
      ).catch(() => {});
    }

    const channel = config.channel || "Email";
    const recipient = interpolate(config.recipient || "", triggerData);
    if (!recipient) return { message: "Réponse auto IA — destinataire manquant", text: generated };

    if (channel === "Email") {
      if (connections.gmail?.email && connections.gmail?.app_password) {
        const nodemailer = (await import("nodemailer")).default;
        const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: connections.gmail.email, pass: connections.gmail.app_password } });
        await transporter.sendMail({ from: `Loopflo <${connections.gmail.email}>`, to: recipient, subject: "Réponse automatique", text: generated });
      } else {
        await sendWorkflowEmail(recipient, "Réponse automatique", generated);
      }
    } else if (channel === "Slack") {
      const r = await fetch(recipient, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: generated }) });
      if (!r.ok) throw new Error(`Slack status ${r.status}`);
    } else if (channel === "Discord") {
      const r = await fetch(recipient, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: generated, username: "Loopflo" }) });
      if (!r.ok) throw new Error(`Discord status ${r.status}`);
    }

    return { message: `Réponse IA envoyée via ${channel}`, text: generated };
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

    // Priorité : OAuth Google (1-clic) → choix user → Resend → Gmail SMTP → Loopflo fallback
    const sendVia = config.send_via || "";
    const forceLoopflo = sendVia.includes("Loopflo");

    // OAuth Gmail (1-clic) — envoi via Gmail API
    if (!forceLoopflo && connections.gmail_oauth?.access_token) {
      const accessToken = await getValidGoogleAccessToken(connections.gmail_oauth);
      if (accessToken) {
        const fromEmail = connections.gmail_oauth.email || "me";
        const headers = [
          `From: Loopflo <${fromEmail}>`,
          `To: ${to}`,
          `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
          "MIME-Version: 1.0",
          format === "HTML" ? "Content-Type: text/html; charset=UTF-8" : "Content-Type: text/plain; charset=UTF-8",
          "",
          body,
        ].join("\r\n");
        const raw = Buffer.from(headers).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ raw }),
        });
        if (!sendRes.ok) {
          const err = await sendRes.text();
          throw new Error(`Gmail API: ${sendRes.status} ${err}`);
        }
        return { message: `Email envoyé via Gmail (OAuth) à ${toList.length > 1 ? `${toList.length} destinataires` : to}` };
      }
    }

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
  if (label === "google sheets" || label.includes("sheets")) {
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

  // GOOGLE DRIVE
  if (label === "google drive" || label.includes("google drive")) {
    const serviceEmail = process.env.GOOGLE_SERVICE_EMAIL;
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    if (!serviceEmail || !privateKey) return { message: "Google Drive non configuré — ajoutez les credentials dans les variables d'environnement" };

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: serviceEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });
    const folderId = config.folder_id ? interpolate(config.folder_id, triggerData) : undefined;
    const query = folderId ? `'${folderId}' in parents` : undefined;
    const res = await drive.files.list({
      q: query,
      pageSize: 10,
      fields: "files(id,name,mimeType,modifiedTime)",
    });
    const files = res.data.files || [];
    return { message: `${files.length} fichier(s) trouvé(s) dans Drive`, files };
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

  // IA GÉNÉRER IMAGE — Stability AI (priorité, dispo partout incl. EU) puis Gemini fallback
  if (label.includes("générer image") || label.includes("generer image")) {
    const promptRaw = interpolate(config.prompt || "Une image générée par IA", triggerData);
    const style = config.style || "";
    const fullPrompt = style ? `${promptRaw}, style ${style.toLowerCase()}` : promptRaw;
    const ratioRaw = (config.ratio || "1:1").split(" ")[0];
    const stabilityKey = connections.stability?.api_key || process.env.STABILITY_API_KEY;
    const geminiKey = connections.gemini?.api_key || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (stabilityKey) {
      // Stability AI exige l'anglais — traduction automatique via Google Translate (gratuit, sans clé)
      let englishPrompt = fullPrompt;
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(fullPrompt)}`;
        const r = await fetch(url);
        if (r.ok) {
          const data = await r.json() as [[string, string][]];
          englishPrompt = data[0].map((chunk) => chunk[0]).join("") || fullPrompt;
        }
      } catch { /* si traduction échoue, on tente quand même */ }

      // Stability AI — stable-image/generate/core (v2beta)
      const aspectMap: Record<string, string> = { "1:1": "1:1", "9:16": "9:16", "16:9": "16:9" };
      const aspect = aspectMap[ratioRaw] || "1:1";
      const form = new FormData();
      form.append("prompt", englishPrompt);
      form.append("aspect_ratio", aspect);
      form.append("output_format", "png");
      const res = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
        method: "POST",
        headers: { Authorization: `Bearer ${stabilityKey}`, Accept: "image/*" },
        body: form,
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Stability AI: ${res.status} ${err}`);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      // Stocker l'image en DB pour avoir une vraie URL publique (email-friendly)
      try {
        const pool = (await import("@/lib/db")).default;
        await pool.query(`
          CREATE TABLE IF NOT EXISTS temp_images (
            id TEXT PRIMARY KEY,
            data BYTEA NOT NULL,
            mime TEXT NOT NULL DEFAULT 'image/png',
            created_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        const imgId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await pool.query("INSERT INTO temp_images (id, data, mime) VALUES ($1, $2, $3)", [imgId, buf, "image/png"]);
        const appUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        const imageUrl = `${appUrl}/api/images/${imgId}`;
        return { message: "Image générée via Stability AI", image_url: imageUrl, prompt: englishPrompt };
      } catch {
        // fallback base64 si DB indisponible
        return { message: "Image générée via Stability AI", image_url: `data:image/png;base64,${buf.toString("base64")}`, prompt: englishPrompt };
      }
    }

    if (geminiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instances: [{ prompt: fullPrompt }], parameters: { sampleCount: 1, aspectRatio: ratioRaw } }),
        }
      );
      if (!res.ok) throw new Error(`Gemini Imagen: ${res.status} ${await res.text()}`);
      const data = (await res.json()) as { predictions?: { bytesBase64Encoded?: string }[] };
      const b64 = data.predictions?.[0]?.bytesBase64Encoded || "";
      return { message: "Image générée via Gemini", image_url: b64 ? `data:image/png;base64,${b64}` : "", prompt: fullPrompt };
    }

    return { message: "Aucune clé configurée — ajoutez une clé Stability AI (recommandé EU) ou Gemini dans Paramètres → Connexions", image_url: "" };
  }

  // IA GÉNÉRER VOIX — ElevenLabs (clé user > clé Loopflo)
  if (label.includes("générer voix") || label.includes("generer voix")) {
    const apiKey = connections.elevenlabs?.api_key || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return { message: "ElevenLabs non configuré — ajoutez votre clé dans Paramètres → Connexions", audio_url: "" };
    const text = interpolate(config.text || config.prompt || "Bonjour", triggerData);
    const voiceMap: Record<string, string> = {
      "Française — féminine": "EXAVITQu4vr4xnSDxMaL",
      "Française — masculine": "ErXwobaYiN019PkySvjV",
      "Anglais — féminin": "21m00Tcm4TlvDq8ikWAM",
      "Anglais — masculin": "VR6AewLTigWG4xSOukaG",
    };
    const voiceId = voiceMap[config.voice || ""] || "EXAVITQu4vr4xnSDxMaL";
    const stabilityVal = parseInt(config.stability || "50") / 100;

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: stabilityVal, similarity_boost: 0.75 } }),
    });
    if (!res.ok) throw new Error(`ElevenLabs: ${res.status} ${await res.text()}`);
    const audioBuf = Buffer.from(await res.arrayBuffer());
    return { message: "Audio généré via ElevenLabs", audio_url: `data:audio/mpeg;base64,${audioBuf.toString("base64")}`, text };
  }

  // IA GÉNÉRER VIDÉO — placeholder (Runway/Luma — coûteux, non implémenté en exécution réelle)
  if (label.includes("générer vidéo") || label.includes("generer video") || label.includes("générer video")) {
    return {
      message: "Génération vidéo IA — bientôt disponible. Intégration Runway/Luma en cours.",
      video_url: "",
      prompt: interpolate(config.prompt || "", triggerData),
    };
  }

  // COMPOSITE — Vidéo virale courte (script IA + voix + image)
  if (label.includes("vidéo virale") || label.includes("video virale")) {
    const topic = interpolate(config.topic || config.prompt || "Un sujet viral", triggerData);
    const style = config.style || "Divertissant";
    const duration = config.duration || "30 secondes";

    // 1) Script via Groq
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const scriptRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: `Tu écris des scripts courts pour vidéos virales TikTok/Reels en français. Style: ${style.toLowerCase()}. Durée cible: ${duration}. Sois accrocheur dès la 1ère seconde. Réponds uniquement avec le texte du script (max 80 mots).` },
        { role: "user", content: topic },
      ],
      max_tokens: 200,
    });
    const script = scriptRes.choices[0]?.message?.content?.trim() || "";

    // 2) Voix via ElevenLabs (si dispo) — clé user en priorité
    let audio_url = "";
    const elevenKey = connections.elevenlabs?.api_key || process.env.ELEVENLABS_API_KEY;
    if (elevenKey && script) {
      try {
        const voiceMap: Record<string, string> = {
          "Française — féminine": "EXAVITQu4vr4xnSDxMaL",
          "Française — masculine": "ErXwobaYiN019PkySvjV",
        };
        const voiceId = voiceMap[config.voice || ""] || "EXAVITQu4vr4xnSDxMaL";
        const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: { "xi-api-key": elevenKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
          body: JSON.stringify({ text: script, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
        });
        if (r.ok) {
          const buf = Buffer.from(await r.arrayBuffer());
          audio_url = `data:audio/mpeg;base64,${buf.toString("base64")}`;
        }
      } catch { /* skip voice */ }
    }

    // 3) Image de couverture — Stability AI (priorité EU) puis Gemini fallback
    let image_url = "";
    const stbKey = connections.stability?.api_key || process.env.STABILITY_API_KEY;
    const gemKey = connections.gemini?.api_key || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const imgPrompt = `Cover image for a viral short video about: ${topic}, style ${style.toLowerCase()}, vibrant, eye-catching`;
    if (stbKey) {
      try {
        const form = new FormData();
        form.append("prompt", imgPrompt);
        form.append("aspect_ratio", "9:16");
        form.append("output_format", "png");
        const r = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
          method: "POST",
          headers: { Authorization: `Bearer ${stbKey}`, Accept: "image/*" },
          body: form,
        });
        if (r.ok) {
          const buf = Buffer.from(await r.arrayBuffer());
          image_url = `data:image/png;base64,${buf.toString("base64")}`;
        }
      } catch { /* skip image */ }
    } else if (gemKey) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${gemKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ instances: [{ prompt: imgPrompt }], parameters: { sampleCount: 1, aspectRatio: "9:16" } }),
          }
        );
        if (r.ok) {
          const d = (await r.json()) as { predictions?: { bytesBase64Encoded?: string }[] };
          const b64 = d.predictions?.[0]?.bytesBase64Encoded || "";
          if (b64) image_url = `data:image/png;base64,${b64}`;
        }
      } catch { /* skip image */ }
    }

    return {
      message: "Vidéo virale générée (script + voix + image)",
      script,
      audio_url,
      image_url,
      topic,
    };
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

    const generatedText = completion.choices[0]?.message?.content;
    // Détecter si l'IA signale une fonctionnalité manquante → alerter Colin
    if (generatedText && detectsImpossible(generatedText)) {
      sendFeatureSuggestionToAdmin(
        workflowMeta.name || "Inconnu",
        workflowMeta.userEmail || "inconnu",
        node.data?.label || "Générer texte",
        prompt,
        generatedText
      ).catch(() => {});
    }
    return { text: generatedText };
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

    const maxCount = Math.min(parseInt(config.max_count || "5"), 20);
    const folder = config.folder || "INBOX";
    const filterType = config.filter || "Tous";
    const subjectFilter = (config.subject_filter || "").trim();

    // PRIORITÉ 1 : Gmail OAuth (1-clic, sans mot de passe d'application)
    if (connections.gmail_oauth?.access_token) {
      const accessToken = await getValidGoogleAccessToken(connections.gmail_oauth);
      if (accessToken) {
        // Construire la requête de recherche Gmail
        const queryParts: string[] = [];
        if (folder && folder !== "INBOX") queryParts.push(`in:${folder.toLowerCase()}`);
        else queryParts.push("in:inbox");
        if (filterType === "Non lus seulement") queryParts.push("is:unread");
        if (subjectFilter) queryParts.push(`subject:${subjectFilter}`);
        const q = encodeURIComponent(queryParts.join(" "));

        const listRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxCount}&q=${q}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!listRes.ok) {
          throw new Error(`Gmail API list: ${listRes.status} ${await listRes.text()}`);
        }
        const listData = (await listRes.json()) as { messages?: { id: string }[] };
        const ids = (listData.messages || []).map(m => m.id);

        const messages: Array<{ uid: string; subject: string; from: string; date: string }> = [];
        for (const id of ids) {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!detailRes.ok) continue;
          const detail = (await detailRes.json()) as {
            id: string;
            payload?: { headers?: { name: string; value: string }[] };
            internalDate?: string;
          };
          const headers = detail.payload?.headers || [];
          const getH = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || "";
          const dateIso = detail.internalDate
            ? new Date(parseInt(detail.internalDate)).toISOString().split("T")[0]
            : "";
          messages.push({
            uid: detail.id,
            subject: getH("Subject") || "(sans sujet)",
            from: getH("From"),
            date: dateIso,
          });
        }

        const latest = messages[0] || { subject: "", from: "", date: "" };
        return {
          emails: messages,
          email_count: messages.length,
          email_subject: latest.subject || "",
          email_from: latest.from || "",
          email_date: latest.date || "",
        };
      }
    }

    // PRIORITÉ 2 : Gmail IMAP (mot de passe d'application — legacy)
    const gmailConn = connections.gmail;
    if (!gmailConn?.email || !gmailConn?.app_password) {
      return { message: "Gmail non configuré — connectez votre compte Gmail (1-clic) ou ajoutez un mot de passe d'application dans Paramètres → Connexions" };
    }

    const { ImapFlow } = await import("imapflow");

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

  // WHATSAPP via Twilio
  if (label.includes("whatsapp")) {
    const sid = config.account_sid;
    const token = config.auth_token;
    const fromRaw = config.from_number;
    const toRaw = interpolate(config.to_number || "", triggerData);
    if (!sid || !token || !fromRaw || !toRaw) return { message: "WhatsApp non configuré — ajoutez les identifiants Twilio" };
    const from = fromRaw.startsWith("whatsapp:") ? fromRaw : `whatsapp:${fromRaw}`;
    const to = toRaw.startsWith("whatsapp:") ? toRaw : `whatsapp:${toRaw}`;
    const body = interpolate(config.message || "Notification : {{message}}", triggerData);
    const creds = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { "Authorization": `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
    });
    if (!res.ok) throw new Error(`Twilio WhatsApp error ${res.status}`);
    const data = await res.json() as { sid: string };
    return { message: `Message WhatsApp envoyé à ${toRaw}`, sms_sid: data.sid };
  }

  // GOOGLE CALENDAR
  if (label === "google calendar" || label.includes("google calendar")) {
    const clientId = config.client_id || process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = config.client_secret || process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    const refreshToken = config.refresh_token || process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
    if (!clientId || !clientSecret || !refreshToken) return { message: "Google Calendar non configuré — ajoutez client_id, client_secret et refresh_token" };

    // Obtenir un access token via refresh token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }).toString(),
    });
    if (!tokenRes.ok) throw new Error(`Google Calendar token error ${tokenRes.status}`);
    const { access_token } = await tokenRes.json() as { access_token: string };

    const calendarId = config.calendar_id || "primary";
    const summary = interpolate(config.title || "Événement Loopflo", triggerData);
    const description = interpolate(config.description || "{{message}}", triggerData);
    const startTime = config.start_time ? interpolate(config.start_time, triggerData) : new Date().toISOString();
    const endTime = config.end_time ? interpolate(config.end_time, triggerData) : new Date(Date.now() + 3600000).toISOString();

    const eventRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ summary, description, start: { dateTime: startTime }, end: { dateTime: endTime } }),
    });
    if (!eventRes.ok) throw new Error(`Google Calendar error ${eventRes.status}`);
    const event = await eventRes.json() as { id: string; htmlLink: string };
    return { message: `Événement créé : ${summary}`, event_id: event.id, event_link: event.htmlLink };
  }

  // TRANSFORMER
  if (label === "transformer") {
    try {
      const mapping = JSON.parse(config.mapping || "{}") as Record<string, string>;
      const output: Record<string, unknown> = {};
      for (const [key, tpl] of Object.entries(mapping)) {
        output[key] = interpolate(String(tpl), triggerData);
      }
      return { message: `${Object.keys(output).length} champ(s) transformé(s)`, ...output };
    } catch {
      return { message: "Transformer — mapping JSON invalide" };
    }
  }

  // TWITTER / X
  if (label.includes("twitter") || label.includes(" x ") || label === "x") {
    const consumerKey = config.consumer_key;
    const consumerSecret = config.consumer_secret;
    const accessToken = config.access_token;
    const accessSecret = config.access_secret;
    if (!consumerKey || !consumerSecret || !accessToken || !accessSecret) return { message: "Twitter non configuré — ajoutez les clés OAuth" };

    const text = interpolate(config.tweet || config.message || "{{message}}", triggerData).slice(0, 280);
    const url = "https://api.twitter.com/2/tweets";
    const nonce = crypto.randomBytes(16).toString("hex");
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_token: accessToken,
      oauth_version: "1.0",
    };

    const paramStr = Object.entries(oauthParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    const base = `POST&${encodeURIComponent(url)}&${encodeURIComponent(paramStr)}`;
    const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessSecret)}`;
    const signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

    const authHeader = "OAuth " + Object.entries({ ...oauthParams, oauth_signature: signature })
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ");

    const tweetRes = await fetch(url, {
      method: "POST",
      headers: { "Authorization": authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!tweetRes.ok) {
      const err = await tweetRes.json() as { detail?: string };
      throw new Error(`Twitter error ${tweetRes.status}: ${err.detail || ""}`);
    }
    const tweet = await tweetRes.json() as { data?: { id: string } };
    return { message: `Tweet publié`, tweet_id: tweet.data?.id };
  }

  // LINKEDIN
  if (label.includes("linkedin")) {
    const accessToken = config.access_token;
    if (!accessToken) return { message: "LinkedIn non configuré — ajoutez votre access token" };

    // Récupérer l'URN de l'utilisateur
    const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    if (!meRes.ok) throw new Error(`LinkedIn auth error ${meRes.status}`);
    const me = await meRes.json() as { sub: string };
    const authorUrn = `urn:li:person:${me.sub}`;

    const text = interpolate(config.message || "{{message}}", triggerData);
    const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    if (!postRes.ok) {
      const err = await postRes.json() as { message?: string };
      throw new Error(`LinkedIn error ${postRes.status}: ${err.message || ""}`);
    }
    return { message: `Publication LinkedIn créée` };
  }

  return { message: `Nœud exécuté`, label };
}
