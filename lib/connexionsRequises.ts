import type { UserConnections } from "./executor";

/**
 * Quels blocs d'un workflow exigent une connexion configurée par l'utilisateur.
 *
 * Sert à prévenir dès la génération plutôt qu'à l'exécution : Kixi peut très
 * bien produire un workflow qui envoie sur Slack alors que l'utilisateur n'a
 * jamais renseigné son webhook. Sans avertissement, il découvre le problème
 * seulement quand le workflow échoue.
 */

type Exigence = {
  /** Clé dans users.connections. */
  cle: keyof UserConnections;
  /** Nom affiché à l'utilisateur. */
  nom: string;
  /** Vrai si le bloc correspond à cette exigence (libellé en minuscules). */
  correspond: (libelle: string) => boolean;
  /** Vrai si la connexion est réellement utilisable. */
  configuree: (c: UserConnections) => boolean;
};

const EXIGENCES: Exigence[] = [
  {
    cle: "slack",
    nom: "Slack",
    correspond: l => l.includes("slack"),
    configuree: c => Boolean(c.slack?.webhook_url || c.slack?.bot_token),
  },
  {
    cle: "notion",
    nom: "Notion",
    correspond: l => l.includes("notion"),
    configuree: c => Boolean(c.notion?.token),
  },
  {
    cle: "airtable",
    nom: "Airtable",
    correspond: l => l.includes("airtable"),
    configuree: c => Boolean(c.airtable?.api_key),
  },
  {
    cle: "sheets",
    nom: "Google Sheets",
    correspond: l => l.includes("sheets") || l.includes("feuille"),
    configuree: c => Boolean(c.sheets?.service_email && c.sheets?.private_key),
  },
  {
    cle: "gmail",
    nom: "Gmail",
    // Un bloc « email » générique passe par Resend, pas par Gmail : on ne
    // réclame Gmail que si le bloc le nomme explicitement.
    correspond: l => l.includes("gmail"),
    configuree: c =>
      Boolean((c.gmail?.email && c.gmail?.app_password) || c.gmail_oauth?.access_token),
  },
  {
    cle: "resend",
    nom: "Resend",
    correspond: l => l.includes("resend"),
    configuree: c => Boolean(c.resend?.api_key),
  },
  {
    cle: "stability",
    nom: "Stability AI",
    correspond: l => l.includes("image") || l.includes("stability"),
    configuree: c => Boolean(c.stability?.api_key),
  },
  {
    cle: "elevenlabs",
    nom: "ElevenLabs",
    correspond: l => l.includes("voix") || l.includes("elevenlabs"),
    configuree: c => Boolean(c.elevenlabs?.api_key),
  },
];

type BlocGenere = { type?: string; label?: string };

/**
 * Retourne les noms des services utilisés par le workflow que l'utilisateur
 * n'a pas encore connectés. Tableau vide si tout est en place.
 */
export function connexionsManquantes(
  blocs: BlocGenere[],
  connexions: UserConnections
): string[] {
  const manquantes = new Set<string>();

  for (const bloc of blocs) {
    const libelle = `${bloc.label || ""} ${bloc.type || ""}`.toLowerCase();
    for (const exigence of EXIGENCES) {
      if (exigence.correspond(libelle) && !exigence.configuree(connexions)) {
        manquantes.add(exigence.nom);
      }
    }
  }

  return [...manquantes];
}
