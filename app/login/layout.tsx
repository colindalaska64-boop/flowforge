import type { Metadata } from "next";

/**
 * Métadonnées de la page de connexion.
 *
 * La page est un composant client, elle héritait donc du titre et de la
 * canonique de l'accueil. Une page de connexion n'a pas vocation à être
 * indexée, mais elle ne doit surtout pas se déclarer doublon de l'accueil.
 */
export const metadata: Metadata = {
  title: "Connexion — Loopflo",
  description: "Connectez-vous à votre compte Loopflo.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
