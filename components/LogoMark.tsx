import {
  VUE,
  FOND_CARRE,
  RAYON_CARRE,
  PALETTES,
  EPAISSEUR,
  TRAITS,
  POINTS,
  CENTRE,
  type Variante,
} from "@/lib/marque";

/**
 * La marque Loopflo, seule — sans le mot ni le lien.
 *
 * Le dessin vient de lib/marque.ts, l'unique endroit où le logo est défini.
 *
 * Par défaut la marque est posée sur sa pastille indigo, et c'est important :
 * l'application entière s'affiche sur un dégradé lavande et violet
 * (app/globals.css), sur lequel une marque en traits indigo disparaît. La
 * pastille lui donne son propre fond, donc un contraste identique partout —
 * page de connexion, tableau de bord, éditeur, navigation sombre de l'accueil.
 *
 * `pastille={false}` ne sert qu'aux endroits qui fournissent déjà un fond
 * contrasté ; il faut alors choisir `variante` en conséquence.
 */
export default function LogoMark({
  size = 28,
  pastille = true,
  variante = "blanc",
}: {
  size?: number;
  /** Pose la marque sur le carré indigo. Vrai par défaut. */
  pastille?: boolean;
  /** Couleurs du dessin quand il n'y a pas de pastille. */
  variante?: Variante;
}) {
  // Sur la pastille indigo, seule la variante blanche est lisible.
  const palette = PALETTES[pastille ? "blanc" : variante];

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
      {pastille && <rect width="56" height="56" rx={RAYON_CARRE} fill={FOND_CARRE} />}

      <g strokeWidth={EPAISSEUR} strokeLinecap="round" fill="none">
        {TRAITS.map((trait, i) => (
          <path
            key={i}
            d={trait.d}
            stroke={palette[trait.teinte]}
            strokeDasharray={trait.pointille}
            transform={
              trait.rotation === undefined
                ? undefined
                : `rotate(${trait.rotation} ${CENTRE} ${CENTRE})`
            }
          />
        ))}
      </g>

      {POINTS.map((point, i) => (
        <circle key={i} cx={point.cx} cy={point.cy} r={point.r} fill={palette[point.teinte]} />
      ))}
    </svg>
  );
}
