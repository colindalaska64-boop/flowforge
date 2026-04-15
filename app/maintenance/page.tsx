import { getSystemSettings } from "@/lib/systemSettings";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const settings = await getSystemSettings();

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)",
      fontFamily: "'Plus Jakarta Sans', 'Helvetica Neue', sans-serif",
      padding: "2rem",
    }}>
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        {/* Logo */}
        <div style={{ marginBottom: "2.5rem" }}>
          <Link href="/" style={{ textDecoration: "none", fontSize: "1.5rem", fontWeight: 900, color: "#fff", letterSpacing: "-.03em" }}>
            Loop<span style={{ color: "#818CF8" }}>flo</span>
          </Link>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 20,
          padding: "3rem 2.5rem",
          backdropFilter: "blur(12px)",
        }}>
          {/* Icône sans emoji — cercle animé */}
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(245,158,11,0.15)",
            border: "1.5px solid rgba(245,158,11,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>

          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", marginBottom: ".75rem", lineHeight: 1.3 }}>
            Maintenance en cours
          </h1>
          <p style={{ fontSize: ".95rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 0 }}>
            {settings.maintenance_message}
          </p>

          {settings.maintenance_eta && (
            <div style={{
              marginTop: "1.5rem",
              display: "inline-flex",
              alignItems: "center",
              gap: ".5rem",
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 100,
              padding: ".45rem 1rem",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span style={{ fontSize: ".8rem", fontWeight: 600, color: "#818CF8" }}>
                Retour estimé : {settings.maintenance_eta}
              </span>
            </div>
          )}

          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontSize: ".8rem", color: "rgba(255,255,255,0.35)" }}>
              Des questions ?{" "}
              <a href="mailto:contact@loopflo.app" style={{ color: "#818CF8", textDecoration: "none", fontWeight: 600 }}>
                contact@loopflo.app
              </a>
            </p>
          </div>
        </div>

        {/* Status dot */}
        <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B", display: "inline-block", boxShadow: "0 0 8px #F59E0B" }} />
          <span style={{ fontSize: ".75rem", color: "rgba(255,255,255,0.35)" }}>Maintenance en cours</span>
        </div>
      </div>
    </main>
  );
}
