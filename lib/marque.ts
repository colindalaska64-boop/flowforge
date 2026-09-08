/**
 * LE LOGO LOOPFLO — le seul endroit où il est dessiné.
 *
 * Pour changer de logo, il n'y a que ce fichier à modifier : remplace TRAITS
 * (et POINTS si le nouveau dessin en a). Tout le reste suit automatiquement —
 * le favicon, les navigations publiques, le tableau de bord, les pages de
 * connexion, les emails.
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
 * Le dessin actuel : un rotor à trois pales. Une seule pale est décrite, les
 * deux autres sont la même tournée de 120° et 240° — c'est ce qui garantit que
 * le rotor reste parfaitement symétrique. Les versions dessinées à la main
 * l'étaient toutes légèrement de travers.
 */

/** Repère de dessin. Toutes les coordonnées ci-dessous s'y rapportent. */
export const VUE = "0 0 56 56";

/** Fond du carré, quand la marque est posée en pastille (favicon, app mobile). */
export const FOND_CARRE = "#4F46E5";
export const RAYON_CARRE = 14;

export type Teinte = "principale" | "secondaire" | "tertiaire";

/**
 * Deux variantes de couleurs. « couleur » sur fond clair, « blanc » quand la
 * marque est posée sur le carré indigo ou sur un fond sombre.
 */
export const PALETTES: Record<"couleur" | "blanc", Record<Teinte, string>> = {
  // Sur fond clair la troisieme pale doit rester lisible : #A5B4FC, la teinte
  // utilisee sur le carre indigo, s'efface sur du blanc ou du lavande.
  couleur: { principale: "#4F46E5", secondaire: "#7C3AED", tertiaire: "#818CF8" },
  blanc: { principale: "#FFFFFF", secondaire: "#C7D2FE", tertiaire: "#A5B4FC" },
};

export type Variante = keyof typeof PALETTES;

export const EPAISSEUR = 7.5;

/** Une pale. `rotation` est appliquée autour du centre du repère. */
export type Trait = { d: string; teinte: Teinte; rotation?: number };

const PALE = "M28 21.5 C28 16.5 30.5 13 35 11.5";

export const TRAITS: Trait[] = [
  { d: PALE, teinte: "principale" },
  { d: PALE, teinte: "secondaire", rotation: 120 },
  { d: PALE, teinte: "tertiaire", rotation: 240 },
];

/** Centre du repère, pour les rotations. */
export const CENTRE = 28;

/**
 * La marque en SVG, sous forme de chaîne.
 *
 * Sert aux surfaces qui ne peuvent pas rendre du React : la route du favicon
 * et les emails. Les composants React, eux, lisent TRAITS directement.
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
    return `<path d="${t.d}" stroke="${palette[t.teinte]}"${rotation}/>`;
  }).join("");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VUE}" width="${taille}" height="${taille}" fill="none">` +
    fond +
    `<g stroke-width="${EPAISSEUR}" stroke-linecap="round" fill="none">${traits}</g>` +
    `</svg>`
  );
}
