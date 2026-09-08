import type { Metadata } from "next";

/**
 * Métadonnées de la page d'inscription.
 *
 * Même raison que pour la connexion : composant client, donc titre et
 * canonique hérités de l'accueil. Celle-ci reste indexable — c'est une porte
 * d'entrée légitime depuis une recherche.
 */
export const metadata: Metadata = {
  title: "Créer un compte gratuit — Loopflo",
  description:
    "Créez votre compte Loopflo en trente secondes. Plan gratuit permanent, sans carte bancaire.",
  alternates: { canonical: "/register" },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
