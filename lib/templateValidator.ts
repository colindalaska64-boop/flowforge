/**
 * templateValidator.ts
 * Valide un template avant publication :
 * - Structure du workflow (trigger présent, noeuds valides)
 * - Taille JSON < 150 KB
 * - Métadonnées (nom, description, catégorie)
 * - Détection de mots grossiers (FR/EN/ES/DE/IT/PT) — sans IA, liste statique
 */

// ---------------------------------------------------------------------------
// Liste de mots interdits multilingue (minuscule, sans accents pour matching)
// Volontairement limitée : mots très graves uniquement (pas les gros mots légers)
// ---------------------------------------------------------------------------
const BAD_WORDS: string[] = [
  // FR
  "connard","connarde","salope","pute","enculé","enculee","fdp","ntm","batard","batarde",
  "nique","niquer","pédo","pedophile","raciste","nazisme","terroriste",
  // EN
  "fuck","fucker","fucking","bitch","asshole","cunt","faggot","nigger","nigga",
  "nazi","pedophile","terrorist","rape","rapist","kys","kill yourself",
  // ES
  "puta","coño","gilipollas","maricón","maricon","bastardo","pedofilo","terrorista",
  // DE
  "scheiße","scheisse","hurensohn","arschloch","nazi","pädophil","terrorist",
  // IT
  "cazzo","stronzo","bastardo","pedofilo","terrorista","nazi",
  // PT
  "porra","caralho","filhoda","puta","pedofilo","terrorista",
];

// Normalise le texte pour le matching (enlève accents, passe en minuscule)
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");
}

function containsBadWord(text: string): string | null {
  const normalized = normalize(text);
  for (const word of BAD_WORDS) {
    // word boundary : espace ou début/fin de chaîne
    const re = new RegExp(`(^|\\s)${word}(\\s|$)`);
    if (re.test(normalized)) return word;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Types de noeuds valides dans Loopflo
// ---------------------------------------------------------------------------
const VALID_NODE_TYPES = new Set([
  "webhook","planifié","rss feed","gmail","outlook","slack","discord","telegram",
  "notion","google sheets","airtable","stripe","github","twitter","linkedin",
  "http","filtre ia","générer texte","condition","delay","loop","transform",
  "openai","anthropic","twilio","sendgrid","ftp","database","s3",
  "trigger","action","filter","output",
]);

const TRIGGER_TYPES = new Set([
  "webhook","planifié","rss feed","trigger",
]);

// ---------------------------------------------------------------------------
// Résultat de validation
// ---------------------------------------------------------------------------
export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Validation principale
// ---------------------------------------------------------------------------
export function validateTemplate(params: {
  name: string;
  description: string;
  category: string;
  keywords: string[];
  workflowData: { nodes?: unknown[]; edges?: unknown[] };
  configurableBlocks?: unknown[];
}): ValidationResult {
  const { name, description, category, keywords, workflowData, configurableBlocks } = params;

  // --- Métadonnées ---
  if (!name || name.trim().length < 3)
    return { ok: false, error: "Le nom doit faire au moins 3 caractères." };
  if (name.trim().length > 80)
    return { ok: false, error: "Le nom ne peut pas dépasser 80 caractères." };

  if (!description || description.trim().length < 20)
    return { ok: false, error: "La description doit faire au moins 20 caractères." };
  if (description.trim().length > 500)
    return { ok: false, error: "La description ne peut pas dépasser 500 caractères." };

  if (!category || category.trim().length === 0)
    return { ok: false, error: "Veuillez choisir une catégorie." };

  if (!Array.isArray(keywords) || keywords.length > 10)
    return { ok: false, error: "Maximum 10 mots-clés." };
  for (const kw of keywords) {
    if (typeof kw !== "string" || kw.length > 30)
      return { ok: false, error: "Chaque mot-clé doit faire max 30 caractères." };
  }

  // --- Mots grossiers ---
  const badInName = containsBadWord(name);
  if (badInName) return { ok: false, error: "Le nom contient un mot interdit." };

  const badInDesc = containsBadWord(description);
  if (badInDesc) return { ok: false, error: "La description contient un mot interdit." };

  for (const kw of keywords) {
    if (containsBadWord(kw)) return { ok: false, error: "Un mot-clé contient un mot interdit." };
  }

  // --- Structure du workflow ---
  if (!workflowData || typeof workflowData !== "object")
    return { ok: false, error: "Données de workflow invalides." };

  const nodes = workflowData.nodes;
  if (!Array.isArray(nodes) || nodes.length === 0)
    return { ok: false, error: "Le workflow doit contenir au moins un bloc." };

  if (nodes.length > 50)
    return { ok: false, error: "Le workflow ne peut pas dépasser 50 blocs." };

  // Trigger requis
  const hasTrigger = nodes.some((n: unknown) => {
    if (typeof n !== "object" || n === null) return false;
    const node = n as { type?: string; data?: { label?: string } };
    const typeStr = (node.type || "").toLowerCase();
    const labelStr = (node.data?.label || "").toLowerCase();
    return TRIGGER_TYPES.has(typeStr) || TRIGGER_TYPES.has(labelStr);
  });

  if (!hasTrigger)
    return { ok: false, error: "Le workflow doit contenir un déclencheur (webhook, planifié, RSS...)." };

  // --- Taille JSON ---
  const jsonSize = JSON.stringify(workflowData).length;
  if (jsonSize > 150_000)
    return { ok: false, error: "Le workflow est trop lourd (max 150 Ko). Simplifiez-le avant de publier." };

  // --- ConfigurableBlocks (optionnel mais validé) ---
  if (configurableBlocks !== undefined) {
    if (!Array.isArray(configurableBlocks))
      return { ok: false, error: "configurableBlocks doit être un tableau." };
    if (configurableBlocks.length > 20)
      return { ok: false, error: "Trop de blocs configurables (max 20)." };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Catégories valides
// ---------------------------------------------------------------------------
export const TEMPLATE_CATEGORIES = [
  "Notifications",
  "Données",
  "IA",
  "Logique",
  "Marketing",
  "E-commerce",
  "Productivité",
  "Autre",
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];
