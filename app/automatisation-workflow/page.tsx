import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Automatisation de workflow no-code en français — Loopflo",
  description: "Automatisez vos workflows sans coder avec Loopflo. Connectez Gmail, Slack, Notion, Airtable, Stripe et créez des automatisations puissantes en quelques minutes. Plan gratuit, 100 tâches/mois.",
  keywords: [
    "automatisation workflow", "automatiser taches repetitives", "no-code france",
    "workflow automatique", "automatisation gmail slack notion", "outil automation france",
    "automatiser sans coder", "workflow ia france", "automatisation entreprise france",
    "connecter applications automatiquement", "automation no-code gratuit"
  ],
  alternates: { canonical: "https://loopflo.app/automatisation-workflow" },
  openGraph: {
    title: "Automatisation de workflow no-code — Loopflo",
    description: "Créez des workflows automatiques sans coder. Plan gratuit disponible, 100 tâches/mois offertes.",
    url: "https://loopflo.app/automatisation-workflow",
    images: [{ url: "https://loopflo.app/og-image.png" }],
  },
};

const useCases = [
  { icon: "📧", title: "Automatiser vos emails", desc: "Recevez un formulaire → l'IA génère une réponse personnalisée → Gmail envoie automatiquement." },
  { icon: "📊", title: "Remplir Google Sheets", desc: "Chaque nouveau lead ou commande est enregistré dans votre tableau de bord automatiquement." },
  { icon: "💬", title: "Notifications Slack", desc: "Alertez votre équipe sur Slack dès qu'un paiement arrive, un ticket s'ouvre ou un formulaire est soumis." },
  { icon: "🤖", title: "Workflows IA complets", desc: "Analysez, filtrez et générez du texte avec l'IA. Inclus dès le plan Pro à 19€/mois." },
  { icon: "📅", title: "Automatisations planifiées", desc: "Rapport quotidien à 9h, nettoyage hebdomadaire, newsletter mensuelle — tout se fait sans vous." },
  { icon: "🔗", title: "Webhooks & HTTP", desc: "Connectez n'importe quelle app via webhooks entrants et sortants, même sans intégration native." },
];

const tools = ["Gmail", "Slack", "Notion", "Google Sheets", "Airtable", "Stripe", "Discord", "Telegram", "HubSpot", "WhatsApp", "RSS Feed", "HTTP Request"];

export default function AutomatisationWorkflowPage() {
  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans', 'Helvetica Neue', sans-serif", color: "#0A0A0A", background: "#fff" }}>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #E5E7EB", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1100, margin: "0 auto" }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: "1.2rem", textDecoration: "none", color: "#0A0A0A" }}>
          Loop<span style={{ color: "#6366F1" }}>flo</span>
        </Link>
        <Link href="/register" style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", padding: ".5rem 1.25rem", borderRadius: 10, fontWeight: 700, fontSize: ".875rem", textDecoration: "none", boxShadow: "0 4px 16px rgba(99,102,241,0.30)" }}>
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
          <span style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            sans écrire une seule ligne de code
          </span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#6B7280", lineHeight: 1.7, marginBottom: "2rem", maxWidth: 640, margin: "0 auto 2rem" }}>
          Loopflo est l&apos;outil d&apos;automatisation no-code français. Connectez vos applications,
          automatisez vos tâches répétitives et gagnez des heures chaque semaine.
          Plan gratuit disponible — 100 tâches/mois offertes.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{ display: "inline-block", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", padding: ".9rem 2rem", borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none", boxShadow: "0 4px 16px rgba(99,102,241,0.30)" }}>
            Commencer gratuitement
          </Link>
          <Link href="/pricing" style={{ display: "inline-block", background: "#F3F4F6", color: "#374151", padding: ".9rem 2rem", borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>
            Voir les tarifs
          </Link>
        </div>
      </section>

      {/* Outils */}
      <section style={{ background: "#F2EEFF", padding: "3rem 2rem" }}>
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

      {/* Tarifs résumé */}
      <section style={{ background: "#F2EEFF", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: ".75rem" }}>
            Des tarifs accessibles pour tous
          </h2>
          <p style={{ color: "#6B7280", marginBottom: "3rem", fontSize: ".95rem" }}>
            Du plan gratuit au plan Business — sans engagement, sans carte bancaire pour commencer.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {[
              { name: "Free", price: "0€", tasks: "100 tâches/mois", color: "#6B7280", bg: "#fff", border: "#E5E7EB" },
              { name: "Starter", price: "7€/mois", tasks: "2 000 tâches/mois", color: "#4F46E5", bg: "#EEF2FF", border: "#818CF8", popular: true },
              { name: "Pro", price: "19€/mois", tasks: "10 000 tâches + IA", color: "#0284C7", bg: "#F0F9FF", border: "#38BDF8" },
              { name: "Business", price: "49€/mois", tasks: "50 000 tâches/mois", color: "#059669", bg: "#ECFDF5", border: "#34D399" },
            ].map((plan, i) => (
              <div key={i} style={{ background: plan.bg, border: `1px solid ${plan.border}`, borderRadius: 12, padding: "1.25rem", position: "relative" }}>
                {plan.popular && (
                  <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontSize: ".65rem", fontWeight: 700, padding: ".2rem .6rem", borderRadius: 100, whiteSpace: "nowrap" }}>
                    Populaire
                  </span>
                )}
                <p style={{ fontWeight: 800, color: plan.color, margin: "0 0 .2rem", fontSize: ".9rem" }}>{plan.name}</p>
                <p style={{ fontWeight: 900, fontSize: "1.3rem", color: "#0A0A0A", margin: "0 0 .2rem" }}>{plan.price}</p>
                <p style={{ fontSize: ".75rem", color: "#9CA3AF", margin: 0 }}>{plan.tasks}</p>
              </div>
            ))}
          </div>
          <Link href="/pricing" style={{ color: "#6366F1", fontWeight: 600, fontSize: ".9rem", textDecoration: "none" }}>
            Voir tous les détails des plans →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, textAlign: "center", marginBottom: "3rem" }}>
            Questions fréquentes sur l&apos;automatisation de workflow
          </h2>
          {[
            {
              q: "Qu'est-ce qu'un workflow automatisé ?",
              a: "Un workflow automatisé est une série d'actions qui se déclenchent automatiquement selon des règles que vous définissez. Par exemple : quand un email arrive → l'IA l'analyse → une ligne est ajoutée dans Google Sheets → une notification Slack est envoyée."
            },
            {
              q: "Faut-il savoir coder pour automatiser ses tâches avec Loopflo ?",
              a: "Non. Loopflo est un outil no-code : vous créez vos workflows par glisser-déposer, sans écrire une seule ligne de code. En quelques minutes, vous pouvez connecter vos applications et créer vos premières automatisations."
            },
            {
              q: "Combien coûte Loopflo ?",
              a: "Loopflo propose 4 plans : Free (0€, 100 tâches/mois), Starter (7€/mois, 2 000 tâches), Pro (19€/mois, 10 000 tâches + IA générative incluse), Business (49€/mois, 50 000 tâches). Aucune carte bancaire requise pour commencer."
            },
            {
              q: "Quelle est la différence avec Zapier ou Make ?",
              a: "Loopflo est une alternative française : interface entièrement en français, données hébergées en Europe (RGPD), IA générative intégrée sans surcoût, et un plan Starter à 7€/mois. Zapier et Make sont en anglais et plus chers pour des fonctionnalités équivalentes."
            },
            {
              q: "Quelles applications peut-on connecter ?",
              a: "Loopflo s'intègre avec Gmail, Slack, Discord, Notion, Google Sheets, Airtable, Stripe, Telegram, HubSpot, WhatsApp, Google Calendar, Twitter/X, LinkedIn, YouTube, TikTok, Instagram, RSS Feed, et plus de 30 autres outils via webhooks et HTTP."
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
      <section style={{ background: "#F2EEFF", padding: "5rem 2rem", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "1rem" }}>
            Automatisez vos workflows dès aujourd&apos;hui
          </h2>
          <p style={{ fontSize: "1rem", color: "#6B7280", marginBottom: "2rem", lineHeight: 1.7 }}>
            Plan gratuit disponible, sans carte bancaire. 100 tâches offertes chaque mois.
          </p>
          <Link href="/register" style={{ display: "inline-block", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", padding: "1rem 2.5rem", borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none", boxShadow: "0 4px 16px rgba(99,102,241,0.30)" }}>
            Commencer gratuitement
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #F3F4F6", padding: "2rem", textAlign: "center", fontSize: ".8rem", color: "#9CA3AF" }}>
        <Link href="/" style={{ color: "#9CA3AF", textDecoration: "none" }}>Loopflo</Link>
        {" · "}
        <Link href="/vs-make" style={{ color: "#9CA3AF", textDecoration: "none" }}>Loopflo vs Make</Link>
        {" · "}
        <Link href="/vs-zapier" style={{ color: "#9CA3AF", textDecoration: "none" }}>Loopflo vs Zapier</Link>
        {" · "}
        <Link href="/pricing" style={{ color: "#6366F1", textDecoration: "none" }}>Tarifs</Link>
      </footer>
    </main>
  );
}
