import Link from "next/link";
import Logo from "./Logo";

/**
 * Layout commun pour toutes les pages légales / institutionnelles.
 * Header sticky avec logo + lien retour, sommaire latéral optionnel, footer minimal.
 */
export default function LegalLayout({
  title,
  subtitle,
  lastUpdate,
  children,
}: {
  title: string;
  subtitle?: string;
  lastUpdate?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .legal-prose h2 { font-size: 1.35rem; font-weight: 800; letter-spacing: -0.02em; margin: 2.5rem 0 1rem; color: #0A0A0A; }
        .legal-prose h2:first-child { margin-top: 0; }
        .legal-prose h3 { font-size: 1.05rem; font-weight: 700; margin: 1.75rem 0 .6rem; color: #0A0A0A; }
        .legal-prose p { font-size: .94rem; line-height: 1.75; color: #374151; margin-bottom: 1rem; }
        .legal-prose ul, .legal-prose ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        .legal-prose li { font-size: .94rem; line-height: 1.75; color: #374151; margin-bottom: .35rem; }
        .legal-prose strong { color: #0A0A0A; font-weight: 700; }
        .legal-prose a { color: #4F46E5; text-decoration: underline; text-underline-offset: 2px; }
        .legal-prose a:hover { color: #3730A3; }
        .legal-prose code { font-family: 'SF Mono', Menlo, monospace; font-size: .85rem; background: #F3F4F6; padding: .15rem .4rem; border-radius: 4px; }
        .legal-prose hr { border: none; border-top: 1px solid #E5E7EB; margin: 2.5rem 0; }
        .legal-prose .placeholder { background: #FEF9C3; border: 1px dashed #FACC15; padding: .6rem .85rem; border-radius: 8px; font-size: .85rem; color: #854D0E; margin: .5rem 0; display: block; }
        .legal-prose table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: .88rem; }
        .legal-prose th, .legal-prose td { padding: .65rem .85rem; border: 1px solid #E5E7EB; text-align: left; vertical-align: top; }
        .legal-prose th { background: #F9FAFB; font-weight: 700; color: #0A0A0A; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        {/* Nav header */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #E5E7EB",
          padding: ".9rem 2rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Logo size="md" />
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <Link href="/" style={{ fontSize: ".85rem", color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>Accueil</Link>
            <Link href="/pricing" style={{ fontSize: ".85rem", color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>Tarifs</Link>
            <Link href="/login" style={{ fontSize: ".85rem", color: "#0A0A0A", textDecoration: "none", fontWeight: 600 }}>Connexion</Link>
            <Link href="/register" style={{
              fontSize: ".85rem", fontWeight: 700,
              padding: ".5rem 1rem",
              background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
              color: "#fff", borderRadius: 10,
              textDecoration: "none",
            }}>Commencer →</Link>
          </div>
        </nav>

        {/* Header de la page */}
        <header style={{ maxWidth: 820, margin: "0 auto", padding: "4rem 2rem 1rem" }}>
          <Link href="/" style={{ fontSize: ".82rem", color: "#6B7280", textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}>← Retour à l&apos;accueil</Link>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 .5rem", color: "#0A0A0A" }}>{title}</h1>
          {subtitle && <p style={{ fontSize: "1rem", color: "#6B7280", margin: "0 0 .35rem" }}>{subtitle}</p>}
          {lastUpdate && <p style={{ fontSize: ".82rem", color: "#9CA3AF", margin: 0 }}>Dernière mise à jour : {lastUpdate}</p>}
        </header>

        {/* Contenu */}
        <main style={{ maxWidth: 820, margin: "0 auto", padding: "2rem 2rem 6rem" }}>
          <article className="legal-prose" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: "3rem 3rem" }}>
            {children}
          </article>
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: "1px solid #E5E7EB",
          padding: "2rem",
          background: "#FFFFFF",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: ".82rem", color: "#9CA3AF", margin: 0 }}>© 2026 Loopflo. Tous droits réservés.</p>
            <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
              {[
                ["Mentions légales", "/mentions-legales"],
                ["Confidentialité", "/confidentialite"],
                ["CGU", "/cgu"],
                ["CGV", "/cgv"],
                ["Cookies", "/cookies"],
                ["Contact", "/contact"],
                ["FAQ", "/faq"],
              ].map(([label, href]) => (
                <Link key={label} href={href} style={{ fontSize: ".82rem", color: "#6B7280", textDecoration: "none" }}>{label}</Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
