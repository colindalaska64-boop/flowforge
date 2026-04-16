/**
 * templateSanitizer.ts
 * Nettoie un workflow avant publication en template communautaire :
 * - Supprime les champs sensibles (tokens, secrets, emails perso, webhooks)
 * - Respecte les champs marqués "configurables" par l'auteur
 */

// Patterns regex pour détecter les clés sensibles (noms de champs)
const SENSITIVE_KEY_PATTERNS = [
  /token/i,
  /secret/i,
  /password/i,
  /api[_-]?key/i,
  /access[_-]?key/i,
  /private[_-]?key/i,
  /credential/i,
  /bearer/i,
  /authorization/i,
  /webhook[_-]?url/i,
  /bot[_-]?token/i,
];

// Champs sensibles par type de bloc (label toLowerCase contient la clé)
const BLOCK_SENSITIVE_FIELDS: Record<string, string[]> = {
  gmail:          ["email", "to", "from", "cc", "bcc", "reply_to"],
  outlook:        ["email", "to", "from", "cc", "bcc"],
  slack:          ["webhook_url", "channel_id", "user_id", "workspace"],
  discord:        ["webhook_url", "user_id", "server_id", "channel_id"],
  telegram:       ["chat_id", "bot_token", "user_id"],
  notion:         ["database_id", "page_id", "api_key"],
  sheets:         ["spreadsheet_id", "sheet_id"],
  airtable:       ["base_id", "table_id", "api_key"],
  stripe:         ["customer_id", "price_id", "api_key", "webhook_secret"],
  github:         ["repo", "owner", "token", "webhook_secret"],
  twitter:        ["user_id", "api_key", "api_secret", "access_token", "access_secret"],
  linkedin:       ["user_id", "access_token"],
  hubspot:        ["portal_id", "api_key", "contact_id"],
  salesforce:     ["instance_url", "access_token", "account_id"],
  zendesk:        ["subdomain", "api_key", "user_email"],
  twilio:         ["account_sid", "auth_token", "from", "to"],
  sendgrid:       ["api_key", "from", "to"],
  mailchimp:      ["api_key", "list_id", "audience_id"],
  openai:         ["api_key", "org_id"],
  anthropic:      ["api_key"],
  http:           ["url", "headers", "authorization"],
  ftp:            ["host", "port", "username", "password", "path"],
  database:       ["host", "port", "username", "password", "database", "connection_string"],
  s3:             ["bucket", "access_key", "secret_key", "region"],
};

export type ConfigurableBlock = {
  nodeId: string;  // ID du noeud react-flow
  label: string;   // label affiché (ex: "Envoyer email")
  fields: string[]; // champs que l'utilisateur devra remplir
};

type Block = {
  id: string;
  type?: string;
  data?: {
    label?: string;
    config?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some(p => p.test(key));
}

function getBlockSensitiveFields(label: string): string[] {
  const lbl = (label || "").toLowerCase();
  for (const [key, fields] of Object.entries(BLOCK_SENSITIVE_FIELDS)) {
    if (lbl.includes(key)) return fields;
  }
  return [];
}

/**
 * Sanitize le workflow pour publication :
 * - Vide les champs sensibles détectés automatiquement
 * - Vide les champs marqués comme configurables par l'auteur
 */
export function sanitizeWorkflowForTemplate(
  workflowData: { nodes?: Block[]; edges?: unknown[] },
  configurableBlocks: ConfigurableBlock[] = []
): { nodes: Block[]; edges: unknown[] } {
  const nodes = (workflowData.nodes || []).map((node) => {
    const label = node.data?.label || "";
    const config = node.data?.config;
    if (!config || typeof config !== "object") return node;

    const sensitiveFields = getBlockSensitiveFields(label);
    const configurableBlock = configurableBlocks.find(cb => cb.nodeId === node.id);
    const configurableFields = configurableBlock?.fields || [];

    const cleanConfig: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(config)) {
      const shouldClear =
        isSensitiveKey(k) ||
        sensitiveFields.includes(k) ||
        configurableFields.includes(k);
      cleanConfig[k] = shouldClear ? "" : v;
    }

    return {
      ...node,
      data: { ...node.data, config: cleanConfig },
    };
  });

  return { nodes, edges: workflowData.edges || [] };
}

/**
 * Détecte les champs sensibles dans un workflow (pour le UI de la page publish).
 * Retourne la liste des blocs avec leurs champs sensibles détectés.
 */
export function detectSensitiveFields(
  workflowData: { nodes?: Block[] }
): Array<{ nodeId: string; label: string; sensitiveFields: string[]; allFields: string[] }> {
  const result: Array<{ nodeId: string; label: string; sensitiveFields: string[]; allFields: string[] }> = [];

  for (const node of workflowData.nodes || []) {
    const label = node.data?.label || node.type || "Bloc";
    const config = node.data?.config;
    if (!config || typeof config !== "object") continue;

    const allFields = Object.keys(config);
    const blockSensitive = getBlockSensitiveFields(label);
    const sensitiveFields = allFields.filter(
      k => isSensitiveKey(k) || blockSensitive.includes(k)
    );

    if (sensitiveFields.length > 0) {
      result.push({ nodeId: node.id, label, sensitiveFields, allFields });
    }
  }

  return result;
}
