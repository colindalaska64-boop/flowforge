/**
 * Client unique pour la génération de texte.
 *
 * Le fournisseur et le modèle se changent par variables d'environnement, sans
 * toucher au code ni redéployer :
 *
 *   AI_PROVIDER   "gemini" (défaut) ou "groq"
 *   GEMINI_MODEL  défaut "gemini-2.0-flash"
 *   GROQ_MODEL    défaut "llama-3.1-8b-instant"
 *
 * Le modèle était auparavant écrit en dur à six endroits. Le jour où un
 * fournisseur retire un modèle, tous les blocs IA tombent d'un coup et il faut
 * corriger six fichiers en urgence — c'est exactement ce qui vient d'arriver
 * avec llama-3.3-70b-versatile.
 *
 * Gemini expose un point d'entrée compatible OpenAI, et le SDK Groq suit la
 * même interface. On garde donc le même client et la même forme d'appel pour
 * les deux fournisseurs : seuls l'URL de base, la clé et le modèle changent.
 */

const DEFAUT_GEMINI = "gemini-2.0-flash";
const DEFAUT_GROQ = "llama-3.1-8b-instant";

const BASE_GEMINI = "https://generativelanguage.googleapis.com/v1beta/openai";

export function fournisseurActif(): "gemini" | "groq" {
  return process.env.AI_PROVIDER === "groq" ? "groq" : "gemini";
}

/** Modèle utilisé pour la génération de texte, selon le fournisseur actif. */
export function modeleActif(): string {
  return fournisseurActif() === "groq"
    ? process.env.GROQ_MODEL || DEFAUT_GROQ
    : process.env.GEMINI_MODEL || DEFAUT_GEMINI;
}

/**
 * Client de génération de texte, prêt à l'emploi.
 *
 * S'utilise exactement comme le client Groq d'origine :
 *   const ia = await aiClient();
 *   await ia.chat.completions.create({ model: modeleActif(), messages: [...] });
 */
export async function aiClient() {
  const fournisseur = fournisseurActif();

  const cle =
    fournisseur === "groq"
      ? process.env.GROQ_API_KEY
      : process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!cle) {
    throw new Error(
      fournisseur === "groq"
        ? "[IA] GROQ_API_KEY manquante."
        : "[IA] GEMINI_API_KEY manquante."
    );
  }

  const Groq = (await import("groq-sdk")).default;

  return new Groq({
    apiKey: cle,
    ...(fournisseur === "gemini" ? { baseURL: BASE_GEMINI } : {}),
  });
}
