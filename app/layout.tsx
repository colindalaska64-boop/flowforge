import type { Metadata } from "next";
import Providers from "./providers";
import GoogleTranslate from "@/components/GoogleTranslate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loopflo — Automatisez tout, sans une ligne de code",
  description: "Loopflo est l'outil no-code français pour automatiser vos tâches répétitives. Connectez Gmail, Slack, Notion, Airtable, Stripe et créez des workflows puissants en quelques minutes.",
  keywords: ["automatisation", "no-code", "workflow", "automation", "zapier alternative", "make alternative", "gmail", "slack", "notion", "france"],
  authors: [{ name: "Loopflo" }],
  creator: "Loopflo",
  metadataBase: new URL("https://loopflo.app"),
  openGraph: {
    title: "Loopflo — Automatisez tout, sans une ligne de code",
    description: "L'outil no-code français pour automatiser vos tâches répétitives. Connectez vos outils et créez des workflows en quelques minutes.",
    url: "https://loopflo.app",
    siteName: "Loopflo",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loopflo — Automatisez tout, sans une ligne de code",
    description: "L'outil no-code français pour automatiser vos tâches répétitives.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://loopflo.app",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <GoogleTranslate />
      </body>
    </html>
  );
}
