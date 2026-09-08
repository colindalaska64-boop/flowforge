/**
 * LE LOGO LOOPFLO — le seul endroit où il est dessiné.
 *
 * Pour changer de logo, il n'y a que ce fichier à modifier : TRAITS, POINTS,
 * EPAISSEUR et PALETTES. Tout le reste suit automatiquement — le favicon, les
 * navigations publiques, le tableau de bord, les pages de connexion, le panel
 * admin et l'en-tête des emails.
 *
 * Ce qui consomme ce fichier :
 *   components/LogoMark.tsx    la marque seule
 *   components/Logo.tsx        la marque + le mot « Loopflo »
 *   app/logo.svg/route.ts      le favicon
 *   app/logo.png/route.tsx     la version PNG, pour les emails
 *   lib/email.ts               l'en-tête des emails
 *
 * Le module est volontairement pur : pas de React, pas de base de données. Il
 * peut donc être lu aussi bien par un composant client que par une route
 * serveur ou un script.
 *
 * Le dessin actuel : la boucle. Un arc plein en haut, un arc pointillé en bas,
 * un nœud à chaque extrémité — le cycle d'un workflow qui repart de lui-même.
 * Les traits font 4.5 et non 3 comme le dessin d'origine : en dessous, la
 * marque devient illisible en 16x16 dans un onglet de navigateur.
 */

/** Repère de dessin. Toutes les coordonnées ci-dessous s'y rapportent. */
export const VUE = "0 0 56 56";

/** Centre du repère, pour les rotations éventuelles. */
export const CENTRE = 28;

/** Fond du carré, quand la marque est posée en pastille (favicon, app mobile). */
export const FOND_CARRE = "#4F46E5";
export const RAYON_CARRE = 14;

export type Teinte = "principale" | "secondaire" | "tertiaire";

/**
 * Deux variantes de couleurs. « couleur » sur fond clair, « blanc » quand la
 * marque est posée sur le carré indigo ou sur un fond sombre.
 *
 * Sur fond clair les teintes secondaires sont assombries : celles qui passent
 * sur l'indigo du carré s'effacent sur du blanc.
 */
export const PALETTES: Record<"couleur" | "blanc", Record<Teinte, string>> = {
  couleur: { principale: "#4F46E5", secondaire: "#818CF8", tertiaire: "#8B5CF6" },
  blanc: { principale: "#FFFFFF", secondaire: "#C7D2FE", tertiaire: "#A5B4FC" },
};

export type Variante = keyof typeof PALETTES;

/** Épaisseur commune à tous les traits. */
export const EPAISSEUR = 4.5;

/** Un trait. `rotation` tourne autour du centre, `pointille` suit stroke-dasharray. */
export type Trait = { d: string; teinte: Teinte; rotation?: number; pointille?: string };

/** Un nœud plein. */
export type Point = { cx: number; cy: number; r: number; teinte: Teinte };

export const TRAITS: Trait[] = [
  // Arc supérieur, plein : le chemin parcouru.
  { d: "M14 28 C14 20.3 20.3 14 28 14 C35.7 14 42 20.3 42 28", teinte: "principale" },
  // Arc inférieur, pointillé : le retour, la boucle qui se referme.
  {
    d: "M42 28 C42 35.7 35.7 42 28 42 C20.3 42 14 35.7 14 28",
    teinte: "secondaire",
    pointille: "6.5 6",
  },
];

export const POINTS: Point[] = [
  { cx: 14, cy: 28, r: 4.6, teinte: "principale" },
  { cx: 42, cy: 28, r: 4.6, teinte: "tertiaire" },
];

/**
 * La marque en SVG, sous forme de chaîne.
 *
 * Sert aux surfaces qui ne peuvent pas rendre du React : la route du favicon
 * et celle du PNG des emails. Les composants React lisent TRAITS et POINTS
 * directement.
 */
export function marqueSvg({
  taille = 56,
  variante = "couleur",
  carre = false,
}: { taille?: number; variante?: Variante; carre?: boolean } = {}): string {
  const palette = PALETTES[variante];

  const fond = carre
    ? `<rect width="56" height="56" rx="${RAYON_CARRE}" fill="${FOND_CARRE}"/>`
    : "";

  const traits = TRAITS.map(t => {
    const rotation =
      t.rotation === undefined ? "" : ` transform="rotate(${t.rotation} ${CENTRE} ${CENTRE})"`;
    const pointille = t.pointille ? ` stroke-dasharray="${t.pointille}"` : "";
    return `<path d="${t.d}" stroke="${palette[t.teinte]}"${pointille}${rotation}/>`;
  }).join("");

  const points = POINTS.map(
    p => `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${palette[p.teinte]}"/>`
  ).join("");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VUE}" width="${taille}" height="${taille}" fill="none">` +
    fond +
    `<g stroke-width="${EPAISSEUR}" stroke-linecap="round" fill="none">${traits}</g>` +
    points +
    `</svg>`
  );
}
