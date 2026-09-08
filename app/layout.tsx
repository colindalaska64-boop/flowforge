import type { Metadata } from "next";
import Script from "next/script";
import Providers from "./providers";
import GoogleTranslate from "@/components/GoogleTranslate";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Loopflo — Automatisez tout, sans une ligne de code",
  description: "Loopflo est l'outil no-code français pour automatiser vos tâches répétitives. Connectez Gmail, Slack, Notion, Airtable, Stripe et créez des workflows puissants en quelques minutes.",
  icons: {
    icon: [
      { url: "/logo.svg?v=2", type: "image/svg+xml" },
    ],
    shortcut: "/logo.svg?v=2",
    apple: "/logo.svg?v=2",
  },
  keywords: [
    "automatisation workflow", "no-code france", "automatisation taches", "workflow automatique",
    "zapier alternative francais", "make alternative francais", "outil automation france",
    "connecter gmail slack notion", "automatiser sans code", "workflow ia",
    "loopflo", "automation gratuite", "n8n alternative", "integromat alternative",
  ],
  authors: [{ name: "Loopflo" }],
  creator: "Loopflo",
  metadataBase: new URL(SITE),
  openGraph: {
    title: "Loopflo — Automatisez tout, sans une ligne de code",
    description: "L'outil no-code français pour automatiser vos tâches répétitives. Connectez vos outils et créez des workflows en quelques minutes.",
    url: SITE,
    siteName: "Loopflo",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: `${SITE}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Loopflo — Automatisation no-code française",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Loopflo — Automatisez tout, sans une ligne de code",
    description: "L'outil no-code français pour automatiser vos tâches répétitives.",
    images: [`${SITE}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Favicon Loopflo — /logo.svg?v=2 est généré depuis lib/marque.ts, la seule
            Override explicite, aussi, pour écarter le favicon.ico de Next.js. */}
        <link rel="icon" href="/logo.svg?v=2" type="image/svg+xml" />
        <link rel="shortcut icon" href="/logo.svg?v=2" />
        <link rel="apple-touch-icon" href="/logo.svg?v=2" />
        {/* JSON-LD Structured Data — aide Google à comprendre le site */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "SoftwareApplication",
                  // Meme @id que sur /ia : sans identifiant partage, les deux
                  // blocs decrivent deux entites distinctes au lieu d'une.
                  "@id": `${SITE}/#application`,
                  "name": "Loopflo",
                  "url": SITE,
                  "description": "Loopflo est l'outil no-code français pour automatiser vos workflows. Connectez Gmail, Slack, Notion, Airtable et créez des automatisations puissantes sans coder.",
                  "applicationCategory": "BusinessApplication",
                  "operatingSystem": "Web",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "EUR",
                    "description": "Plan gratuit disponible"
                  },
                  "featureList": [
                    "Automatisation no-code",
                    "IA intégrée",
                    "Connexion Gmail, Slack, Notion, Airtable",
                    "Webhooks, planification, RSS",
                    "Interface française"
                  ]
                },
                {
                  "@type": "Organization",
                  "@id": `${SITE}/#organisation`,
                  "name": "Loopflo",
                  "url": SITE,
                  // Le logo declare a Google doit etre la marque, pas la carte
                  // de partage : /logo.png est genere depuis lib/marque.ts.
                  "logo": `${SITE}/logo.png`,
                  "foundingDate": "2026-03",
                  "founder": {
                    "@type": "Person",
                    "name": "Colin Authié"
                  },
                  "sameAs": [],
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "email": "contact@loopflo.app",
                    "contactType": "customer support",
                    "availableLanguage": "French"
                  }
                },
                {
                  "@type": "WebSite",
                  "name": "Loopflo",
                  "url": SITE,
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": `${SITE}/register`,
                    "query-input": "required name=search_term_string"
                  }
                }
              ]
            })
          }}
        />
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
