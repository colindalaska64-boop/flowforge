"use client";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Logo from "@/components/Logo";

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #F3F4F6" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: ".9rem 0", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", gap: "1rem" }}>
        <span style={{ fontSize: ".875rem", fontWeight: 600, color: "#0A0A0A" }}>{q}</span>
        <span style={{ fontSize: "1.1rem", color: "#9CA3AF", flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(45deg)" : "none", lineHeight: 1 }}>+</span>
      </button>
      {open && (
        <div style={{ paddingBottom: ".9rem" }}>
          <p style={{ fontSize: ".85rem", color: "#6B7280", lineHeight: 1.75 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

const faqs = [
  { q: "Comment créer mon premier workflow ?", a: "Allez dans Dashboard → Nouveau workflow. Vous pouvez partir de zéro avec l'éditeur visuel, ou utiliser l'IA pour décrire votre automatisation en langage naturel." },
  { q: "Comment connecter Gmail / Slack / Notion ?", a: "Dans Paramètres → Connexions, entrez vos identifiants pour chaque service. Pour Gmail, vous avez besoin d'un mot de passe d'application (pas votre mot de passe habituel)." },
  { q: "Mes workflows s'exécutent-ils en temps réel ?", a: "Les workflows déclenchés par webhook s'exécutent en temps réel. Les workflows planifiés s'exécutent une fois par jour (limitation du plan gratuit Vercel)." },
  { q: "Qu'est-ce qu'une tâche ?", a: "Une tâche = une exécution complète de workflow. Chaque déclenchement (webhook, planifié, test) compte comme une tâche. Votre compteur se remet à zéro le 1er de chaque mois." },
  { q: "Pourquoi mon bloc IA affiche une erreur ?", a: "Les blocs IA (Filtre IA, Générer texte) sont réservés aux plans Starter et supérieurs. En plan Free, ces blocs retournent une erreur." },
  { q: "Comment upgrader mon plan ?", a: "Allez dans Paramètres, section 'Plan actuel', puis cliquez sur 'Passer à Starter' ou 'Voir les plans'. Pour le plan Business, contactez-nous directement." },
  { q: "Que faire si mon workflow ne se déclenche pas ?", a: "Vérifiez que le workflow est bien activé (bouton vert dans le dashboard). Pour les webhooks, assurez-vous d'envoyer la requête à la bonne URL. Consultez l'historique d'exécutions pour voir les erreurs." },
];

export default function SupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userPlan = (session?.user as { plan?: string })?.plan || "free";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") return null;

  const planColors: Record<string, { bg: string; color: string; border: string }> = {
    free: { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
    starter: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
    pro: { bg: "#EEF2FF", color: "#4F46E5", border: "#C7D2FE" },
    business: { bg: "#FFF7ED", color: "#D97706", border: "#FDE68A" },
  };
  const planStyle = planColors[userPlan] || planColors.free;

  const subject = encodeURIComponent(`[Support ${userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}] Demande d'aide`);
  const body = encodeURIComponent(`Bonjour,\n\nEmail : ${session?.user?.email}\nPlan : ${userPlan}\n\nDescription du problème :\n\n`);
  const mailtoLink = `mailto:loopflo.contact@gmail.com?subject=${subject}&body=${body}`;

  const responseTime = userPlan === "business" || userPlan === "pro" ? "sous 4h" : "sous 24h ouvrées";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; }
        .support-card { transition: box-shadow .15s, transform .15s; }
        .support-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.08) !important; transform: translateY(-1px); }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "1rem 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Logo />
          <div style={{ display: "flex", gap: ".25rem" }}>
            {[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Support", href: "/dashboard/support" },
            ].map(item => (
              <a key={item.label} href={item.href} style={{ fontSize: ".85rem", color: item.href === "/dashboard/support" ? "#4F46E5" : "#6B7280", textDecoration: "none", padding: ".4rem .75rem", borderRadius: "8px", fontWeight: item.href === "/dashboard/support" ? 700 : 500, background: item.href === "/dashboard/support" ? "#EEF2FF" : "none" }}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ fontSize: ".82rem", fontWeight: 600, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", padding: ".4rem .9rem", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" }}>
          Déconnexion
        </button>
      </nav>

      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "3rem 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Support</h1>
          <span style={{ fontSize: ".8rem", fontWeight: 700, textTransform: "uppercase", padding: ".3rem .9rem", borderRadius: "100px", background: planStyle.bg, color: planStyle.color, border: `1px solid ${planStyle.border}` }}>
            Plan {userPlan}
          </span>
        </div>

        {/* Contacter l'équipe */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "1.5rem", marginBottom: "1rem" }}>
          <p style={{ fontSize: ".75rem", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "1.25rem" }}>Contacter l&apos;équipe</p>

          {userPlan === "free" ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F9FAFB", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#9CA3AF" strokeWidth="1.5"/><path d="M2 6L12 13L22 6" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: ".95rem", color: "#9CA3AF", marginBottom: ".4rem" }}>Support email prioritaire</p>
                <p style={{ fontSize: ".85rem", color: "#9CA3AF", lineHeight: 1.65, marginBottom: ".75rem" }}>
                  Le support prioritaire est disponible à partir du plan <strong>Starter</strong>.
                </p>
                <a href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", fontSize: ".82rem", fontWeight: 700, color: "#4F46E5", textDecoration: "none", background: "#EEF2FF", border: "1px solid #C7D2FE", padding: ".4rem .9rem", borderRadius: 8 }}>
                  Voir les plans →
                </a>
              </div>
            </div>
          ) : (
            <a href={mailtoLink} className="support-card" style={{ display: "flex", alignItems: "flex-start", gap: "1rem", textDecoration: "none", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ECFDF5", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#059669" strokeWidth="1.5"/><path d="M2 6L12 13L22 6" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".4rem" }}>
                  <p style={{ fontWeight: 700, fontSize: ".95rem", color: "#0A0A0A" }}>Envoyer un email</p>
                  <span style={{ fontSize: ".7rem", fontWeight: 700, background: "#ECFDF5", color: "#059669", padding: ".15rem .5rem", borderRadius: 100, border: "1px solid #A7F3D0" }}>Prioritaire</span>
                </div>
                <p style={{ fontSize: ".85rem", color: "#6B7280", lineHeight: 1.65, marginBottom: ".5rem" }}>
                  Réponse garantie <strong>{responseTime}</strong>. Votre plan et email sont automatiquement inclus.
                </p>
                <p style={{ fontSize: ".82rem", color: "#059669", fontWeight: 600 }}>loopflo.contact@gmail.com →</p>
              </div>
            </a>
          )}
        </div>

        {/* Ressources */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "1.5rem", marginBottom: "2rem" }}>
          <p style={{ fontSize: ".75rem", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "1.25rem" }}>Ressources</p>
          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            <a href="/pricing" className="support-card" style={{ display: "flex", alignItems: "center", gap: "1rem", textDecoration: "none", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "1rem 1.25rem" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: ".875rem", color: "#0A0A0A" }}>Plans & tarifs</p>
                <p style={{ fontSize: ".8rem", color: "#9CA3AF" }}>Comparez les plans et upgradez</p>
              </div>
            </a>
            <a href="/dashboard/templates" className="support-card" style={{ display: "flex", alignItems: "center", gap: "1rem", textDecoration: "none", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "1rem 1.25rem" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#4F46E5" strokeWidth="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#4F46E5" strokeWidth="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#4F46E5" strokeWidth="1.5"/><path d="M17 13v8M13 17h8" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: ".875rem", color: "#0A0A0A" }}>Templates</p>
                <p style={{ fontSize: ".8rem", color: "#9CA3AF" }}>Workflows prêts à l&apos;emploi pour démarrer vite</p>
              </div>
            </a>
            <a href="mailto:loopflo.contact@gmail.com?subject=Bug Loopflo&body=Décrivez le bug ici..." className="support-card" style={{ display: "flex", alignItems: "center", gap: "1rem", textDecoration: "none", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "1rem 1.25rem" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="1.5"/><line x1="12" y1="8" x2="12" y2="12" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="16" r=".5" fill="#DC2626" stroke="#DC2626"/></svg>
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: ".875rem", color: "#0A0A0A" }}>Signaler un bug</p>
                <p style={{ fontSize: ".8rem", color: "#9CA3AF" }}>Aidez-nous à améliorer Loopflo</p>
              </div>
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "1.5rem" }}>
          <p style={{ fontSize: ".75rem", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "1rem" }}>Questions fréquentes</p>
          <div>
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
