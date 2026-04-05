import type { Metadata } from "next";
import Script from "next/script";
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
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-M448SNSN');`,
          }}
        />
        {/* Google Analytics 4 */}
        <Script
          id="ga4-script"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-8JS92XXF7Y"
        />
        <Script
          id="ga4-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-8JS92XXF7Y');`,
          }}
        />
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M448SNSN"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Providers>{children}</Providers>
        <GoogleTranslate />
      </body>
    </html>
  );
}
