import {
  VUE,
  FOND_CARRE,
  RAYON_CARRE,
  PALETTES,
  EPAISSEUR,
  TRAITS,
  CENTRE,
  type Variante,
} from "@/lib/marque";

/**
 * La marque Loopflo, seule — sans le mot ni le lien.
 *
 * Le dessin n'est pas écrit ici : il vient de lib/marque.ts, l'unique endroit
 * où le logo est défini. Ce composant ne fait que le rendre.
 *
 * `variante` : « couleur » sur fond clair, « blanc » sur fond sombre.
 * `carre`    : pose la marque sur la pastille indigo (favicon, tuiles).
 */
export default function LogoMark({
  size = 28,
  variante = "couleur",
  carre = false,
}: {
  size?: number;
  variante?: Variante;
  carre?: boolean;
}) {
  const palette = PALETTES[variante];

  return (
    <svg
      width={size}
      height={size}
      viewBox={VUE}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {carre && <rect width="56" height="56" rx={RAYON_CARRE} fill={FOND_CARRE} />}
      <g strokeWidth={EPAISSEUR} strokeLinecap="round" fill="none">
        {TRAITS.map((trait, i) => (
          <path
            key={i}
            d={trait.d}
            stroke={palette[trait.teinte]}
            transform={
              trait.rotation === undefined
                ? undefined
                : `rotate(${trait.rotation} ${CENTRE} ${CENTRE})`
            }
          />
        ))}
      </g>
    </svg>
  );
}
