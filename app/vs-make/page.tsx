import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Loopflo vs Make (Integromat) — Alternative française moins chère",
  description: "Comparez Loopflo et Make.com. Loopflo est l'alternative no-code française à Make : interface en français, IA intégrée, tarifs 2x moins chers. Créez vos workflows gratuitement.",
  keywords: ["alternative make", "loopflo vs make", "integromat alternative", "make.com alternative francais", "remplacer make", "workflow no-code france"],
  alternates: { canonical: "https://loopflo.app/vs-make" },
  openGraph: {
    title: "Loopflo vs Make — L'alternative française",
    description: "Pourquoi choisir Loopflo plutôt que Make.com ? Interface française, IA intégrée, prix plus bas.",
    url: "https://loopflo.app/vs-make",
    images: [{ url: "https://loopflo.app/og-image.png" }],
  },
};

const compareRows = [
  { feature: "Interface en français",        loopflo: true,  make: false },
  { feature: "IA intégrée (génération texte)", loopflo: true, make: false },
  { feature: "Plan gratuit",                 loopflo: true,  make: true  },
  { feature: "Prix plan Pro (mensuel)",      loopflo: "19€", make: "9€ (500 ops)" },
  { feature: "Opérations illimitées",        loopflo: true,  make: false },
  { feature: "Webhooks",                     loopflo: true,  make: true  },
  { feature: "Planification cron",           loopflo: true,  make: true  },
  { feature: "RSS Feed natif",               loopflo: true,  make: false },
  { feature: "Support français",             loopflo: true,  make: false },
  { feature: "Hébergement Europe",           loopflo: true,  make: false },
  { feature: "Variables globales",           loopflo: true,  make: false },
  { feature: "Historique 30 jours",          loopflo: true,  make: true  },
];

export default function VsMakePage() {
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
          Loopflo vs Make.com
        </span>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, margin: "1.25rem 0 1rem", lineHeight: 1.15 }}>
          L&apos;alternative française à Make<br />
          <span style={{ color: "#4F46E5" }}>plus simple, moins chère, en français</span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#6B7280", lineHeight: 1.7, marginBottom: "2rem" }}>
          Vous utilisez Make.com mais vous cherchez une solution avec une interface en français,
          une IA intégrée et des tarifs plus accessibles ? Loopflo est fait pour vous.
        </p>
        <Link href="/register" style={{ display: "inline-block", background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff", padding: ".9rem 2rem", borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>
          Migrer de Make vers Loopflo — Gratuit
        </Link>
      </section>

      {/* Tableau comparatif */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 2rem 5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, textAlign: "center", marginBottom: "2rem" }}>
          Comparaison détaillée
        </h2>
        <div style={{ border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th style={{ padding: "1rem 1.25rem", textAlign: "left", fontSize: ".85rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".05em" }}>Fonctionnalité</th>
                <th style={{ padding: "1rem 1.25rem", textAlign: "center", fontSize: ".95rem", fontWeight: 800, color: "#4F46E5" }}>Loopflo</th>
                <th style={{ padding: "1rem 1.25rem", textAlign: "center", fontSize: ".95rem", fontWeight: 700, color: "#6B7280" }}>Make</th>
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
                    {typeof row.make === "boolean"
                      ? row.make
                        ? <span style={{ color: "#059669", fontSize: "1.1rem" }}>✓</span>
                        : <span style={{ color: "#DC2626", fontSize: "1.1rem" }}>✗</span>
                      : <span style={{ color: "#6B7280", fontSize: ".9rem" }}>{row.make}</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pourquoi migrer */}
      <section style={{ background: "#F9FAFB", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, textAlign: "center", marginBottom: "3rem" }}>
            Pourquoi passer de Make à Loopflo ?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
            {[
              { title: "Interface 100% française", desc: "Fini les traductions approximatives. Loopflo est conçu et traduit nativement en français pour les entrepreneurs français." },
              { title: "IA intégrée sans surcoût", desc: "Générez du texte, filtrez vos données avec l'IA, créez des réponses automatiques — inclus dans tous les plans Pro." },
              { title: "Tarifs transparents", desc: "Pas de comptage d'opérations compliqué. Un abonnement simple avec des workflows illimités." },
              { title: "Données hébergées en Europe", desc: "Vos données restent en Europe, conformément au RGPD. Idéal pour les entreprises françaises." },
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
          Prêt à migrer vos workflows Make vers Loopflo ?
        </h2>
        <p style={{ fontSize: "1rem", color: "#6B7280", marginBottom: "2rem", lineHeight: 1.7 }}>
          Créez votre compte gratuitement et recréez vos automatisations en quelques minutes.
          Aucune carte bancaire requise.
        </p>
        <Link href="/register" style={{ display: "inline-block", background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff", padding: "1rem 2.5rem", borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>
          Commencer gratuitement
        </Link>
      </section>

      {/* Footer minimal */}
      <footer style={{ borderTop: "1px solid #F3F4F6", padding: "2rem", textAlign: "center", fontSize: ".8rem", color: "#9CA3AF" }}>
        <Link href="/" style={{ color: "#9CA3AF", textDecoration: "none" }}>Loopflo</Link>
        {" · "}
        <Link href="/vs-zapier" style={{ color: "#9CA3AF", textDecoration: "none" }}>Loopflo vs Zapier</Link>
        {" · "}
        <Link href="/automatisation-workflow" style={{ color: "#9CA3AF", textDecoration: "none" }}>Automatisation workflow</Link>
        {" · "}
        <Link href="/register" style={{ color: "#4F46E5", textDecoration: "none" }}>Créer un compte</Link>
      </footer>
    </main>
  );
}
