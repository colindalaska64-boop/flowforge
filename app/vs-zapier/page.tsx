import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Loopflo vs Zapier — Alternative française à Zapier dès 7€/mois",
  description: "Comparez Loopflo et Zapier. Loopflo est l'alternative no-code française à Zapier : plan Starter à 7€/mois, interface en français, IA générative incluse dès le plan Pro. Gratuit pour commencer.",
  keywords: ["alternative zapier", "loopflo vs zapier", "zapier alternative francais", "remplacer zapier", "zapier moins cher france", "automatisation gratuite france"],
  alternates: { canonical: "https://loopflo.app/vs-zapier" },
  openGraph: {
    title: "Loopflo vs Zapier — L'alternative française",
    description: "Pourquoi choisir Loopflo plutôt que Zapier ? Interface française, IA intégrée, plan Starter à 7€/mois.",
    url: "https://loopflo.app/vs-zapier",
    images: [{ url: "https://loopflo.app/og-image.png" }],
  },
};

const compareRows = [
  { feature: "Interface en français",           loopflo: true,             zapier: false },
  { feature: "IA générative intégrée",          loopflo: "Pro 19€/mois",   zapier: false },
  { feature: "Plan gratuit",                    loopflo: true,             zapier: true  },
  { feature: "Tâches plan gratuit",             loopflo: "100 tâches/mois", zapier: "100 tâches/mois" },
  { feature: "Plan Starter",                    loopflo: "7€/mois",        zapier: "~20€/mois" },
  { feature: "Tâches plan Starter",             loopflo: "2 000/mois",     zapier: "750/mois" },
  { feature: "Plan Pro",                        loopflo: "19€/mois",       zapier: "~49€/mois" },
  { feature: "Tâches plan Pro",                 loopflo: "10 000/mois",    zapier: "2 000/mois" },
  { feature: "Webhooks",                        loopflo: true,             zapier: true  },
  { feature: "Planification cron",              loopflo: true,             zapier: true  },
  { feature: "RSS Feed natif",                  loopflo: true,             zapier: false },
  { feature: "Support en français",             loopflo: true,             zapier: false },
  { feature: "Variables globales",              loopflo: true,             zapier: false },
  { feature: "Export données RGPD",             loopflo: true,             zapier: false },
  { feature: "Hébergement Europe",              loopflo: true,             zapier: false },
];

export default function VsZapierPage() {
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
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "5rem 2rem 3rem", textAlign: "center" }}>
        <span style={{ background: "#EEF2FF", color: "#4F46E5", padding: ".35rem .9rem", borderRadius: 100, fontSize: ".8rem", fontWeight: 700 }}>
          Loopflo vs Zapier
        </span>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, margin: "1.25rem 0 1rem", lineHeight: 1.15 }}>
          L&apos;alternative française à Zapier<br />
          <span style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Starter à 7€, plus de tâches, tout en français
          </span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#6B7280", lineHeight: 1.7, marginBottom: "2rem" }}>
          Zapier facture cher pour peu de tâches et uniquement en anglais. Loopflo offre
          plus de tâches pour moins cher, une interface entièrement en français,
          et une IA générative incluse dès le plan Pro à 19€/mois.
        </p>
        <Link href="/register" style={{ display: "inline-block", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", padding: ".9rem 2rem", borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none", boxShadow: "0 4px 16px rgba(99,102,241,0.30)" }}>
          Commencer gratuitement
        </Link>
      </section>

      {/* Tableau comparatif */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 2rem 5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, textAlign: "center", marginBottom: "2rem" }}>
          Comparaison Loopflo vs Zapier
        </h2>
        <div style={{ border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th style={{ padding: "1rem 1.25rem", textAlign: "left", fontSize: ".85rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".05em" }}>Fonctionnalité</th>
                <th style={{ padding: "1rem 1.25rem", textAlign: "center", fontSize: ".95rem", fontWeight: 800, color: "#6366F1" }}>Loopflo</th>
                <th style={{ padding: "1rem 1.25rem", textAlign: "center", fontSize: ".95rem", fontWeight: 700, color: "#6B7280" }}>Zapier</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row, i) => (
                <tr key={i} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: ".85rem 1.25rem", fontSize: ".9rem", color: "#374151" }}>{row.feature}</td>
                  <td style={{ padding: ".85rem 1.25rem", textAlign: "center", fontWeight: 700 }}>
                    {typeof row.loopflo === "boolean"
                      ? row.loopflo
                        ? <span style={{ color: "#059669", fontSize: "1.1rem" }}>✓</span>
                        : <span style={{ color: "#DC2626", fontSize: "1.1rem" }}>✗</span>
                      : <span style={{ color: "#6366F1", fontSize: ".9rem" }}>{row.loopflo}</span>
                    }
                  </td>
                  <td style={{ padding: ".85rem 1.25rem", textAlign: "center", fontWeight: 600 }}>
                    {typeof row.zapier === "boolean"
                      ? row.zapier
                        ? <span style={{ color: "#059669", fontSize: "1.1rem" }}>✓</span>
                        : <span style={{ color: "#DC2626", fontSize: "1.1rem" }}>✗</span>
                      : <span style={{ color: "#6B7280", fontSize: ".9rem" }}>{row.zapier}</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: ".75rem", color: "#9CA3AF", marginTop: ".75rem", textAlign: "center" }}>
          * Tarifs Zapier indicatifs — vérifiez sur zapier.com pour les prix actuels.
        </p>
      </section>

      {/* Plans Loopflo */}
      <section style={{ background: "#F2EEFF", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, textAlign: "center", marginBottom: "3rem" }}>
            Les plans Loopflo
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
            {[
              { name: "Free", price: "0€", tasks: "100 tâches/mois", color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", desc: "Pour découvrir l'automatisation." },
              { name: "Starter", price: "7€/mois", tasks: "2 000 tâches/mois", color: "#4F46E5", bg: "#EEF2FF", border: "#818CF8", popular: true, desc: "Pour les freelances et solopreneurs." },
              { name: "Pro", price: "19€/mois", tasks: "10 000 tâches/mois", color: "#0284C7", bg: "#F0F9FF", border: "#38BDF8", desc: "IA générative incluse." },
              { name: "Business", price: "49€/mois", tasks: "50 000 tâches/mois", color: "#059669", bg: "#ECFDF5", border: "#34D399", desc: "Pour les équipes et agences." },
            ].map((plan, i) => (
              <div key={i} style={{ background: plan.bg, border: `1px solid ${plan.border}`, borderRadius: 12, padding: "1.5rem", position: "relative" }}>
                {plan.popular && (
                  <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontSize: ".7rem", fontWeight: 700, padding: ".2rem .75rem", borderRadius: 100, whiteSpace: "nowrap" }}>
                    Le plus populaire
                  </span>
                )}
                <p style={{ fontWeight: 800, fontSize: "1rem", color: plan.color, margin: "0 0 .25rem" }}>{plan.name}</p>
                <p style={{ fontWeight: 900, fontSize: "1.5rem", color: "#0A0A0A", margin: "0 0 .25rem" }}>{plan.price}</p>
                <p style={{ fontSize: ".8rem", color: "#6B7280", margin: "0 0 .25rem" }}>{plan.tasks}</p>
                <p style={{ fontSize: ".75rem", color: "#9CA3AF", margin: 0 }}>{plan.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link href="/pricing" style={{ color: "#6366F1", fontWeight: 600, fontSize: ".9rem", textDecoration: "none" }}>
              Voir tous les détails des plans →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 600, margin: "0 auto", padding: "5rem 2rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "1rem" }}>
          Essayez Loopflo gratuitement
        </h2>
        <p style={{ fontSize: "1rem", color: "#6B7280", marginBottom: "2rem", lineHeight: 1.7 }}>
          100 tâches/mois offertes sur le plan Free. Sans carte bancaire, sans engagement.
        </p>
        <Link href="/register" style={{ display: "inline-block", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", padding: "1rem 2.5rem", borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none", boxShadow: "0 4px 16px rgba(99,102,241,0.30)" }}>
          Créer mon compte gratuit
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #F3F4F6", padding: "2rem", textAlign: "center", fontSize: ".8rem", color: "#9CA3AF" }}>
        <Link href="/" style={{ color: "#9CA3AF", textDecoration: "none" }}>Loopflo</Link>
        {" · "}
        <Link href="/vs-make" style={{ color: "#9CA3AF", textDecoration: "none" }}>Loopflo vs Make</Link>
        {" · "}
        <Link href="/automatisation-workflow" style={{ color: "#9CA3AF", textDecoration: "none" }}>Automatisation workflow</Link>
        {" · "}
        <Link href="/pricing" style={{ color: "#6366F1", textDecoration: "none" }}>Voir tous les tarifs</Link>
      </footer>
    </main>
  );
}
