"use client";
import { useSession } from "next-auth/react";

export default function SupportPage() {
  const { data: session } = useSession();
  const userPlan = (session?.user as { plan?: string })?.plan || "free";

  const planColors: Record<string, string> = {
    free: "#6B7280",
    starter: "#4F46E5",
    pro: "#0284C7",
    business: "#059669",
  };

  const planColor = planColors[userPlan] || "#6B7280";

  const subject = encodeURIComponent(`[Support ${userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}] Demande d'aide`);
  const body = encodeURIComponent(`Bonjour,\n\nEmail du compte : ${session?.user?.email}\nPlan : ${userPlan}\n\nDescription du problème :\n\n`);
  const mailtoLink = `mailto:loopflo.contact@gmail.com?subject=${subject}&body=${body}`;

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", padding: "2rem" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: ".5rem" }}>Support</h1>
        <p style={{ color: "#6B7280", fontSize: ".9rem", marginBottom: "2rem" }}>
          Nous sommes là pour vous aider.
        </p>

        {/* Plan badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: ".5rem 1rem", marginBottom: "2rem" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: planColor }} />
          <span style={{ fontSize: ".85rem", fontWeight: 600, color: planColor }}>Plan {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* FAQ */}
          <a href="https://loopflo.fr/#faq" target="_blank" rel="noopener noreferrer"
            style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "1.5rem", textDecoration: "none", display: "flex", alignItems: "flex-start", gap: "1rem", transition: "box-shadow .15s" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#4F46E5" strokeWidth="1.5"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="17" r=".5" fill="#4F46E5" stroke="#4F46E5"/></svg>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: ".95rem", color: "#0A0A0A", marginBottom: ".25rem" }}>FAQ — Questions fréquentes</p>
              <p style={{ fontSize: ".85rem", color: "#6B7280", lineHeight: 1.6 }}>Trouvez rapidement une réponse à votre question dans notre FAQ.</p>
            </div>
          </a>

          {/* Email support */}
          {userPlan === "free" ? (
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "1.5rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#9CA3AF" strokeWidth="1.5"/><path d="M2 6L12 13L22 6" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: ".95rem", color: "#9CA3AF", marginBottom: ".25rem" }}>Support email prioritaire</p>
                <p style={{ fontSize: ".85rem", color: "#9CA3AF", lineHeight: 1.6 }}>Disponible à partir du plan <strong>Starter</strong>. Passez à un plan supérieur pour accéder au support prioritaire.</p>
                <a href="/pricing" style={{ display: "inline-block", marginTop: ".75rem", fontSize: ".82rem", fontWeight: 600, color: "#4F46E5", textDecoration: "none" }}>Voir les plans →</a>
              </div>
            </div>
          ) : (
            <a href={mailtoLink}
              style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "1.5rem", textDecoration: "none", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#059669" strokeWidth="1.5"/><path d="M2 6L12 13L22 6" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".25rem" }}>
                  <p style={{ fontWeight: 700, fontSize: ".95rem", color: "#0A0A0A" }}>Support email prioritaire</p>
                  <span style={{ fontSize: ".7rem", fontWeight: 700, background: "#ECFDF5", color: "#059669", padding: ".15rem .5rem", borderRadius: 100, border: "1px solid #A7F3D0" }}>Actif</span>
                </div>
                <p style={{ fontSize: ".85rem", color: "#6B7280", lineHeight: 1.6 }}>Envoyez-nous un email avec votre question. Nous répondons sous <strong>24h ouvrées</strong> pour les plans Starter, <strong>4h</strong> pour Pro et Business.</p>
                <p style={{ fontSize: ".82rem", color: "#4F46E5", fontWeight: 600, marginTop: ".5rem" }}>loopflo.contact@gmail.com →</p>
              </div>
            </a>
          )}

          {/* Discord/Community */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "1.5rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" fill="#4F46E5"/></svg>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: ".95rem", color: "#0A0A0A", marginBottom: ".25rem" }}>Communauté Discord</p>
              <p style={{ fontSize: ".85rem", color: "#6B7280", lineHeight: 1.6 }}>Rejoignez la communauté Loopflo pour échanger avec d'autres utilisateurs et obtenir de l'aide rapidement.</p>
              <span style={{ display: "inline-block", marginTop: ".5rem", fontSize: ".82rem", color: "#9CA3AF" }}>Bientôt disponible</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
