import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Automatisation de workflow no-code en France — Loopflo",
  description: "Automatisez vos workflows sans coder avec Loopflo. Connectez Gmail, Slack, Notion, Airtable, Stripe et créez des automatisations puissantes en quelques minutes. Outil no-code français.",
  keywords: [
    "automatisation workflow", "automatiser taches repetitives", "no-code france",
    "workflow automatique", "automatisation gmail slack notion", "outil automation france",
    "automatiser sans coder", "workflow ia france", "automatisation entreprise france",
    "connecter applications automatiquement", "automation no-code gratuit"
  ],
  alternates: { canonical: "https://loopflo.app/automatisation-workflow" },
  openGraph: {
    title: "Automatisation de workflow no-code — Loopflo",
    description: "Créez des workflows automatiques sans coder. Connectez vos outils et gagnez des heures chaque semaine.",
    url: "https://loopflo.app/automatisation-workflow",
    images: [{ url: "https://loopflo.app/og-image.png" }],
  },
};

const useCases = [
  { icon: "📧", title: "Automatiser vos emails", desc: "Recevez un formulaire → l'IA génère une réponse personnalisée → Gmail envoie automatiquement." },
  { icon: "📊", title: "Remplir Google Sheets automatiquement", desc: "Chaque nouveau lead ou commande est enregistré dans votre tableau de bord automatiquement." },
  { icon: "💬", title: "Notifications Slack instantanées", desc: "Alertez votre équipe sur Slack dès qu'un paiement arrive, un ticket s'ouvre ou un formulaire est soumis." },
  { icon: "🤖", title: "Workflows IA complets", desc: "Analysez, filtrez et répondez avec l'IA. Loopflo intègre GPT-like nativement dans vos automatisations." },
  { icon: "📅", title: "Automatisations planifiées", desc: "Rapport quotidien à 9h, nettoyage hebdomadaire, newsletter mensuelle — tout se fait sans vous." },
  { icon: "🔗", title: "Connecter n'importe quelle app", desc: "Webhooks entrants et sortants pour connecter n'importe quel outil, même sans intégration native." },
];

const tools = ["Gmail", "Slack", "Notion", "Google Sheets", "Airtable", "Stripe", "Discord", "Telegram", "HubSpot", "Webhook", "RSS Feed", "HTTP Request"];

export default function AutomatisationWorkflowPage() {
  return (
    <main style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif", color: "#0A0A0A", background: "#fff" }}>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #F3F4F6", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1100, margin: "0 auto" }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: "1.2rem", textDecoration: "none", color: "#0A0A0A" }}>
          Loop<span style={{ color: "#4F46E5" }}>flo</span>
        </Link>
        <Link href="/register" style={{ background: "#4F46E5", color: "#fff", padding: ".5rem 1.25rem", borderRadius: 8, fontWeight: 700, fontSize: ".875rem", textDecoration: "none" }}>
          Essayer gratuitement
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "5rem 2rem 3rem", textAlign: "center" }}>
        <span style={{ background: "#EEF2FF", color: "#4F46E5", padding: ".35rem .9rem", borderRadius: 100, fontSize: ".8rem", fontWeight: 700 }}>
          Automatisation no-code
        </span>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, margin: "1.25rem 0 1rem", lineHeight: 1.15 }}>
          Automatisez vos workflows<br />
          <span style={{ color: "#4F46E5" }}>sans écrire une seule ligne de code</span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#6B7280", lineHeight: 1.7, marginBottom: "2rem", maxWidth: 640, margin: "0 auto 2rem" }}>
          Loopflo est l&apos;outil d&apos;automatisation no-code français qui connecte vos applications
          et automatise vos tâches répétitives. Gagnez des heures chaque semaine sans écrire
          une seule ligne de code.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{ display: "inline-block", background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff", padding: ".9rem 2rem", borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>
            Commencer gratuitement
          </Link>
          <Link href="/pricing" style={{ display: "inline-block", background: "#F3F4F6", color: "#374151", padding: ".9rem 2rem", borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>
            Voir les tarifs
          </Link>
        </div>
      </section>

      {/* Outils connectés */}
      <section style={{ background: "#F9FAFB", padding: "3rem 2rem" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: ".85rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "1.5rem" }}>
            Connectez vos outils préférés
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", justifyContent: "center" }}>
            {tools.map(tool => (
              <span key={tool} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: ".4rem .9rem", fontSize: ".875rem", fontWeight: 600, color: "#374151" }}>
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Cas d'usage */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "5rem 2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, textAlign: "center", marginBottom: "3rem" }}>
          Qu&apos;est-ce qu&apos;on peut automatiser avec Loopflo ?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
          {useCases.map((uc, i) => (
            <div key={i} style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: "1.5rem" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: ".75rem" }}>{uc.icon}</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: ".5rem" }}>{uc.title}</h3>
              <p style={{ fontSize: ".875rem", color: "#6B7280", lineHeight: 1.7, margin: 0 }}>{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ SEO */}
      <section style={{ background: "#F9FAFB", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, textAlign: "center", marginBottom: "3rem" }}>
            Questions fréquentes sur l&apos;automatisation de workflow
          </h2>
          {[
            {
              q: "Qu'est-ce qu'un workflow automatisé ?",
              a: "Un workflow automatisé est une série d'actions qui se déclenchent automatiquement selon des règles que vous définissez. Par exemple : quand un email arrive → l'IA l'analyse → une ligne est ajoutée dans Google Sheets → une notification est envoyée sur Slack."
            },
            {
              q: "Faut-il savoir coder pour automatiser ses tâches ?",
              a: "Non. Loopflo est un outil no-code : vous créez vos workflows par glisser-déposer, sans écrire une seule ligne de code. En quelques minutes, vous pouvez connecter vos applications et créer vos premières automatisations."
            },
            {
              q: "Quelle est la différence entre Loopflo et Zapier ou Make ?",
              a: "Loopflo est une alternative française à Zapier et Make, avec une interface entièrement en français, une IA intégrée sans surcoût, et des tarifs 2 à 5 fois moins chers. Les données sont hébergées en Europe et conformes au RGPD."
            },
            {
              q: "Combien coûte l'automatisation de workflows avec Loopflo ?",
              a: "Loopflo propose un plan gratuit avec 500 tâches par mois. Le plan Pro est à 19€/mois avec des tâches illimitées et l'IA intégrée. Aucune carte bancaire n'est nécessaire pour commencer."
            },
            {
              q: "Quelles applications peut-on connecter avec Loopflo ?",
              a: "Loopflo s'intègre avec Gmail, Slack, Discord, Notion, Google Sheets, Airtable, Stripe, Telegram, HubSpot, WhatsApp, Google Calendar, Twitter/X, LinkedIn, YouTube, TikTok, Instagram, et plus de 30 autres outils."
            },
          ].map((faq, i) => (
            <div key={i} style={{ borderBottom: "1px solid #E5E7EB", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: ".5rem" }}>{faq.q}</h3>
              <p style={{ fontSize: ".9rem", color: "#6B7280", lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 600, margin: "0 auto", padding: "5rem 2rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "1rem" }}>
          Automatisez vos workflows dès aujourd&apos;hui
        </h2>
        <p style={{ fontSize: "1rem", color: "#6B7280", marginBottom: "2rem", lineHeight: 1.7 }}>
          Rejoignez les entrepreneurs qui gagnent des heures chaque semaine grâce à l&apos;automatisation.
          Plan gratuit disponible, sans carte bancaire.
        </p>
        <Link href="/register" style={{ display: "inline-block", background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff", padding: "1rem 2.5rem", borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>
          Commencer gratuitement
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #F3F4F6", padding: "2rem", textAlign: "center", fontSize: ".8rem", color: "#9CA3AF" }}>
        <Link href="/" style={{ color: "#9CA3AF", textDecoration: "none" }}>Loopflo</Link>
        {" · "}
        <Link href="/vs-make" style={{ color: "#9CA3AF", textDecoration: "none" }}>Loopflo vs Make</Link>
        {" · "}
        <Link href="/vs-zapier" style={{ color: "#9CA3AF", textDecoration: "none" }}>Loopflo vs Zapier</Link>
        {" · "}
        <Link href="/register" style={{ color: "#4F46E5", textDecoration: "none" }}>Créer un compte</Link>
      </footer>
    </main>
  );
}
