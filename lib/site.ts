/**
 * L'ADRESSE PUBLIQUE DU SITE — le seul endroit où elle est écrite.
 *
 * Elle était recopiée quarante-deux fois dans neuf fichiers : les canoniques,
 * le sitemap, robots.txt, les données structurées, les emails. Toutes
 * annonçaient « https://loopflo.app », alors que le serveur redirige cette
 * adresse (307) vers « https://www.loopflo.app ».
 *
 * Une URL canonique qui redirige ailleurs est contradictoire : Google la traite
 * comme un simple indice et choisit lui-même l'adresse à indexer. On déclare
 * donc l'adresse réellement servie.
 *
 * POUR CHANGER DE DOMAINE — ou pour abandonner le « www » : modifie SITE
 * ci-dessous, et règle Vercel pour qu'il redirige dans le même sens. Les deux
 * doivent rester d'accord, sinon le problème réapparaît.
 */
export const SITE = "https://www.loopflo.app";

/** Le domaine seul, sans protocole — pour l'afficher dans un texte. */
export const DOMAINE = SITE.replace(/^https?:\/\//, "");

/** L'image de partage (aperçu sur LinkedIn, X, WhatsApp, Slack…). */
export const IMAGE_PARTAGE = `${SITE}/og-image.png`;

/** Construit une URL absolue à partir d'un chemin. */
export function url(chemin = "/"): string {
  return chemin === "/" ? SITE : `${SITE}${chemin.startsWith("/") ? chemin : `/${chemin}`}`;
}
