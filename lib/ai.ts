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

// Google retire ses modèles régulièrement : gemini-2.0-flash a été supprimé
// en septembre 2026. En cas de 404 « no longer available », la réponse de
// Google indique le modèle de remplacement — il suffit alors de renseigner
// GEMINI_MODEL dans Vercel, sans redéployer le code.
const DEFAUT_GEMINI = "gemini-3.6-flash";
const DEFAUT_GROQ = "llama-3.1-8b-instant";

const URL_GEMINI = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

/** Forme de réponse commune aux deux fournisseurs (compatible OpenAI). */
export type ReponseChat = {
  choices: { message?: { content?: string | null } }[];
};

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
 * Nettoie un message d'erreur avant de le montrer : on retire toute chaîne
 * ressemblant à une clé d'API, et on tronque.
 */
export function messageErreurIA(erreur: unknown): string {
  const brut = erreur instanceof Error ? erreur.message : String(erreur);
  const nettoye = brut
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, "[clé masquée]")
    .replace(/gsk_[0-9A-Za-z]{10,}/g, "[clé masquée]")
    .replace(/Bearer\s+[A-Za-z0-9._-]{10,}/gi, "Bearer [clé masquée]");
  return `[IA ${fournisseurActif()}/${modeleActif()}] ${nettoye.slice(0, 300)}`;
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

  if (fournisseur === "groq") {
    const Groq = (await import("groq-sdk")).default;
    return new Groq({ apiKey: cle });
  }

  // Client Gemini minimal, exposant la même interface que le SDK Groq.
  //
  // On ne peut pas simplement rediriger le SDK Groq vers Gemini : il code
  // « /openai/v1 » en dur dans le chemin de la requête, ce qui ajoute un
  // segment de trop à l'URL de Google et renvoie un 404 sans corps.
  // Le point d'entrée de Gemini étant compatible OpenAI, sa réponse a déjà la
  // forme attendue par les appelants : on la renvoie telle quelle.
  return {
    chat: {
      completions: {
        async create(params: Record<string, unknown>): Promise<ReponseChat> {
          const res = await fetch(URL_GEMINI, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cle}`,
            },
            body: JSON.stringify(params),
          });

          if (!res.ok) {
            const detail = await res.text().catch(() => "");
            throw new Error(`${res.status} ${detail.slice(0, 300) || "(aucun détail)"}`);
          }

          return (await res.json()) as ReponseChat;
        },
      },
    },
  };
}
