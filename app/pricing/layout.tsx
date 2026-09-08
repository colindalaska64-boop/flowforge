import type { Metadata } from "next";

/**
 * Métadonnées de la page tarifs.
 *
 * app/pricing/page.tsx est un composant client : il ne peut pas exporter de
 * metadata, donc la page héritait de celles du layout racine — le titre de
 * l'accueil, et surtout sa canonique. Elle se déclarait ainsi doublon de la
 * page d'accueil, ce qui la rendait inindexable pour elle-même. Ce layout
 * n'existe que pour lui rendre son identité.
 */
export const metadata: Metadata = {
  title: "Tarifs — Loopflo",
  description:
    "Les tarifs de Loopflo : un plan gratuit permanent sans carte bancaire, puis Starter à 7 €, Pro à 19 € et Business à 49 € par mois. Quotas d'exécutions et d'IA détaillés.",
  keywords: ["loopflo tarifs", "prix loopflo", "automatisation no-code prix", "alternative make prix"],
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Tarifs — Loopflo",
    description: "Plan gratuit permanent, puis 7 € par mois. Sans carte bancaire pour commencer.",
    url: "/pricing",
    type: "website",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
