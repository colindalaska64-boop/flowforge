import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Loopflo vs Zapier — Alternative française gratuite à Zapier",
  description: "Comparez Loopflo et Zapier. Loopflo est l'alternative no-code française à Zapier : moins cher, interface en français, IA intégrée, plan gratuit. Automatisez sans coder.",
  keywords: ["alternative zapier", "loopflo vs zapier", "zapier alternative francais", "remplacer zapier", "zapier moins cher", "automatisation gratuite france"],
  alternates: { canonical: "https://loopflo.app/vs-zapier" },
  openGraph: {
    title: "Loopflo vs Zapier — L'alternative française",
    description: "Pourquoi choisir Loopflo plutôt que Zapier ? Interface française, IA intégrée, prix bien plus bas.",
    url: "https://loopflo.app/vs-zapier",
    images: [{ url: "https://loopflo.app/og-image.png" }],
  },
};

const compareRows = [
  { feature: "Interface en français",           loopflo: true,   zapier: false },
  { feature: "IA intégrée (génération texte)",  loopflo: true,   zapier: false },
  { feature: "Plan gratuit",                    loopflo: true,   zapier: true  },
  { feature: "Tâches plan gratuit",             loopflo: "500/mois", zapier: "100/mois" },
  { feature: "Prix plan Pro (mensuel)",         loopflo: "19€",  zapier: "49€" },
  { feature: "Webhooks",                        loopflo: true,   zapier: true  },
  { feature: "Planification cron",              loopflo: true,   zapier: true  },
  { feature: "RSS Feed natif",                  loopflo: true,   zapier: false },
  { feature: "Support en français",             loopflo: true,   zapier: false },
  { feature: "Hébergement Europe / RGPD",       loopflo: true,   zapier: false },
  { feature: "Variables globales",              loopflo: true,   zapier: false },
  { feature: "Export données RGPD",             loopflo: true,   zapier: false },
];

export default function VsZapierPage() {
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
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "5rem 2rem 3rem", textAlign: "center" }}>
        <span style={{ background: "#EEF2FF", color: "#4F46E5", padding: ".35rem .9rem", borderRadius: 100, fontSize: ".8rem", fontWeight: 700 }}>
          Loopflo vs Zapier
        </span>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, margin: "1.25rem 0 1rem", lineHeight: 1.15 }}>
          L&apos;alternative française à Zapier<br />
          <span style={{ color: "#4F46E5" }}>5x moins cher, en français, avec l&apos;IA</span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#6B7280", lineHeight: 1.7, marginBottom: "2rem" }}>
          Zapier coûte jusqu&apos;à 49€/mois pour des fonctionnalités basiques. Loopflo offre
          la même puissance avec une interface en français, une IA intégrée et des tarifs pensés
          pour les entrepreneurs français.
        </p>
        <Link href="/register" style={{ display: "inline-block", background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff", padding: ".9rem 2rem", borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>
          Migrer de Zapier vers Loopflo — Gratuit
        </Link>
      </section>

      {/* Tableau comparatif */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 2rem 5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, textAlign: "center", marginBottom: "2rem" }}>
          Comparaison détaillée Loopflo vs Zapier
        </h2>
        <div style={{ border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th style={{ padding: "1rem 1.25rem", textAlign: "left", fontSize: ".85rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".05em" }}>Fonctionnalité</th>
                <th style={{ padding: "1rem 1.25rem", textAlign: "center", fontSize: ".95rem", fontWeight: 800, color: "#4F46E5" }}>Loopflo</th>
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
                      : <span style={{ color: "#4F46E5", fontSize: ".9rem" }}>{row.loopflo}</span>
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
      </section>

      {/* Arguments */}
      <section style={{ background: "#F9FAFB", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, textAlign: "center", marginBottom: "3rem" }}>
            Pourquoi Loopflo est meilleur que Zapier pour les entrepreneurs français ?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
            {[
              { title: "Prix 5x moins cher", desc: "Zapier facture 49€/mois pour 2 000 tâches. Loopflo Pro à 19€/mois offre des tâches illimitées." },
              { title: "Tout en français", desc: "Interface, support, documentation : tout est pensé pour les utilisateurs francophones dès le départ." },
              { title: "IA intégrée nativement", desc: "Génération de texte, filtres intelligents, réponses automatiques — l'IA est incluse sans plugin payant." },
              { title: "Conforme RGPD", desc: "Données hébergées en Europe, export et suppression de compte inclus, conformité CNIL assurée." },
            ].map((item, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: ".5rem" }}>{item.title}</h3>
                <p style={{ fontSize: ".875rem", color: "#6B7280", lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 600, margin: "0 auto", padding: "5rem 2rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "1rem" }}>
          Arrêtez de payer Zapier trop cher
        </h2>
        <p style={{ fontSize: "1rem", color: "#6B7280", marginBottom: "2rem", lineHeight: 1.7 }}>
          Migrez vos Zaps vers Loopflo en quelques minutes. Plan gratuit disponible,
          aucune carte bancaire requise.
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
        <Link href="/automatisation-workflow" style={{ color: "#9CA3AF", textDecoration: "none" }}>Automatisation workflow</Link>
        {" · "}
        <Link href="/register" style={{ color: "#4F46E5", textDecoration: "none" }}>Créer un compte</Link>
      </footer>
    </main>
  );
}
