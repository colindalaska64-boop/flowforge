/**
 * La boucle Loopflo, seule — sans le mot ni le lien.
 *
 * components/Logo.tsx reste le logo complet (marque + texte + lien) utilisé
 * dans le tableau de bord. Ici on ne veut que le symbole, à poser à côté d'un
 * mot « Loopflo » déjà stylé par la page qui l'appelle : les navs publiques ont
 * chacune leur fond, leur taille et leur couleur.
 *
 * Le carré indigo tient aussi bien sur fond clair que sur fond sombre, donc un
 * seul dessin suffit pour toutes les pages.
 */
export default function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect width="56" height="56" rx="14" fill="#4F46E5" />
      <path
        d="M14 28 C14 20.3 20.3 14 28 14 C35.7 14 42 20.3 42 28"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M42 28 C42 35.7 35.7 42 28 42 C20.3 42 14 35.7 14 28"
        stroke="#C7D2FE"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray="6.5 6"
      />
      <circle cx="14" cy="28" r="4.6" fill="white" />
      <circle cx="42" cy="28" r="4.6" fill="#A5B4FC" />
    </svg>
  );
}
