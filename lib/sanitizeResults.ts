/**
 * Nettoie les résultats d'exécution avant de les stocker en DB.
 * - Remplace les strings base64 (images, audio) par un placeholder
 * - Tronque les strings > 2 KB pour éviter de gonfler la DB Supabase
 */

const MAX_STRING_BYTES = 2048; // 2 KB par champ texte

function sanitizeValue(val: unknown, depth = 0): unknown {
  if (depth > 10) return "[truncated]";

  if (typeof val === "string") {
    // Base64 data URI (images, audio, fichiers)
    if (val.startsWith("data:")) {
      const mime = val.slice(5, val.indexOf(";")) || "unknown";
      return `[${mime} base64 non stocké]`;
    }
    // Strings très longues (ex: HTML complet, JSON énorme, audio brut)
    if (val.length > MAX_STRING_BYTES) {
      return val.slice(0, MAX_STRING_BYTES) + `… [tronqué, ${val.length} chars]`;
    }
    return val;
  }

  if (Array.isArray(val)) {
    return val.slice(0, 50).map((item) => sanitizeValue(item, depth + 1));
  }

  if (val !== null && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      out[k] = sanitizeValue(v, depth + 1);
    }
    return out;
  }

  return val;
}

export function sanitizeResults(results: unknown[]): unknown[] {
  return results.map((r) => sanitizeValue(r));
}
