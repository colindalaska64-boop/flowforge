"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { templates } from "@/lib/templates";

const AI_TOOLS = ["Filtre IA", "Générer texte"];

const toolColors: Record<string, { bg: string; color: string; border: string }> = {
  "Webhook":       { bg: "#FFF7ED", color: "#D97706", border: "#FDE68A" },
  "Gmail":         { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  "Slack":         { bg: "#FDF4FF", color: "#7C3AED", border: "#E9D5FF" },
  "Google Sheets": { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
  "Notion":        { bg: "#F9FAFB", color: "#374151", border: "#E5E7EB" },
  "Filtre IA":     { bg: "#EEF2FF", color: "#4F46E5", border: "#C7D2FE" },
  "Générer texte": { bg: "#EEF2FF", color: "#4F46E5", border: "#C7D2FE" },
  "Planifié":      { bg: "#EEF2FF", color: "#4F46E5", border: "#C7D2FE" },
  "Condition":     { bg: "#FDF4FF", color: "#7C3AED", border: "#E9D5FF" },
};

const categoryColors: Record<string, { bg: string; color: string }> = {
  "Notifications": { bg: "#FFF7ED", color: "#D97706" },
  "Données":       { bg: "#F0FDF4", color: "#16A34A" },
  "Logique":       { bg: "#FDF4FF", color: "#7C3AED" },
  "IA":            { bg: "#EEF2FF", color: "#4F46E5" },
};

export default function TemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userPlan, setUserPlan] = useState<string>("free");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/plan").then(r => r.json()).then(d => setUserPlan(d.plan || "free")).catch(() => {});
    }
  }, [status]);

  if (status === "loading") return null;

  const canUseAI = userPlan === "pro" || userPlan === "business";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
        .template-card { transition: transform .15s, box-shadow .15s; cursor: pointer; }
        .template-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.08) !important; }
        .use-btn:hover { background: #4338CA !important; }
        @media (max-width: 768px) {
          .templates-grid { grid-template-columns: 1fr !important; }
          .templates-main { padding: 1.5rem 1rem !important; }
          .templates-nav-links { display: none !important; }
        }
      `}</style>

      <nav className="glass-nav" style={{ padding:"1rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"2rem" }}>
          <Logo />
          <div className="templates-nav-links" style={{ display:"flex", gap:".25rem" }}>
            {[
              { label:"Dashboard", href:"/dashboard" },
              { label:"Templates", href:"/dashboard/templates" },
              { label:"Historique", href:"/dashboard/executions" },
              { label:"Paramètres", href:"/dashboard/settings" },
            ].map((item) => (
              <a key={item.label} href={item.href} style={{ fontSize:".85rem", color: item.href === "/dashboard/templates" ? "#4F46E5" : "#6B7280", textDecoration:"none", padding:".4rem .75rem", borderRadius:"8px", fontWeight: item.href === "/dashboard/templates" ? 700 : 500, background: item.href === "/dashboard/templates" ? "#EEF2FF" : "transparent" }}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
        <span style={{ fontSize:".82rem", color:"#9CA3AF" }}>{session?.user?.email}</span>
      </nav>

      <main className="templates-main" style={{ maxWidth:"1100px", margin:"0 auto", padding:"3rem 2rem" }}>
        <div style={{ marginBottom:"2.5rem" }}>
          <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".5rem" }}>
            Templates prêts à l&apos;emploi
          </h1>
          <p style={{ fontSize:".95rem", color:"#6B7280" }}>
            Choisissez un template, configurez les blocs en 2 minutes et activez.
          </p>
        </div>

        <div className="templates-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.25rem" }}>
          {templates.map((tpl) => {
            const cat = categoryColors[tpl.category] || { bg: "#F9FAFB", color: "#6B7280" };
            const needsPro = tpl.tools.some(t => AI_TOOLS.includes(t));
            const locked = needsPro && !canUseAI;
            return (
              <div
                key={tpl.slug}
                className="template-card glass-card"
                style={{ border:`1px solid ${locked?"#DDD6FE":undefined}`, borderRadius:16, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.04)", display:"flex", flexDirection:"column", opacity: locked ? 0.85 : 1 }}
              >
                {/* Preview visuelle */}
                <div style={{ background:"#FAFAFA", borderBottom:"1px solid #F3F4F6", padding:"1.25rem 1.5rem", display:"flex", alignItems:"center", gap:".5rem", flexWrap:"wrap", position:"relative" }}>
                  {needsPro && (
                    <span style={{ position:"absolute", top:10, right:10, fontSize:".65rem", fontWeight:700, background:"#4F46E5", color:"#fff", padding:".2rem .55rem", borderRadius:100 }}>PRO</span>
                  )}
                  {tpl.tools.map((tool, i) => {
                    const s = toolColors[tool] || { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
                    return (
                      <div key={tool} style={{ display:"flex", alignItems:"center", gap:.5 > 0 ? ".4rem" : 0 }}>
                        <span style={{ fontSize:".75rem", fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}`, padding:".25rem .6rem", borderRadius:100 }}>
                          {tool}
                        </span>
                        {i < tpl.tools.length - 1 && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}>
                            <path d="M5 12H19M13 6l6 6-6 6" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Contenu */}
                <div style={{ padding:"1.25rem 1.5rem", flex:1, display:"flex", flexDirection:"column" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:".6rem" }}>
                    <span style={{ fontSize:".7rem", fontWeight:700, background:cat.bg, color:cat.color, padding:".2rem .55rem", borderRadius:100, textTransform:"uppercase", letterSpacing:".06em" }}>
                      {tpl.category}
                    </span>
                    <span style={{ fontSize:".72rem", color:"#9CA3AF" }}>· {tpl.setup} de config</span>
                  </div>
                  <h3 style={{ fontSize:".95rem", fontWeight:700, color:"#0A0A0A", marginBottom:".4rem", lineHeight:1.3 }}>
                    {tpl.name}
                  </h3>
                  <p style={{ fontSize:".8rem", color:"#6B7280", lineHeight:1.6, flex:1 }}>
                    {tpl.description}
                  </p>
                </div>

                {/* CTA */}
                <div style={{ padding:"1rem 1.5rem", borderTop:"1px solid #F3F4F6" }}>
                  {locked ? (
                    <a
                      href="/pricing"
                      style={{ display:"block", textAlign:"center", background:"#EEF2FF", color:"#4F46E5", fontSize:".85rem", fontWeight:700, padding:".6rem", borderRadius:9, textDecoration:"none" }}
                    >
                      Passer en Pro pour utiliser
                    </a>
                  ) : (
                    <a
                      href={`/dashboard/workflows/new?template=${tpl.slug}`}
                      className="use-btn"
                      style={{ display:"block", textAlign:"center", background:"#4F46E5", color:"#fff", fontSize:".85rem", fontWeight:700, padding:".6rem", borderRadius:9, textDecoration:"none", transition:"background .15s" }}
                    >
                      Utiliser ce template
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA bas de page */}
        <div style={{ marginTop:"3rem", background:"#EEF2FF", border:"1px solid #C7D2FE", borderRadius:16, padding:"2rem", textAlign:"center" }}>
          <p style={{ fontWeight:700, fontSize:"1rem", color:"#3730A3", marginBottom:".4rem" }}>
            Vous préférez partir de zéro ?
          </p>
          <p style={{ fontSize:".875rem", color:"#6B7280", marginBottom:"1.25rem" }}>
            Créez un workflow vide et construisez votre automatisation bloc par bloc.
          </p>
          <a href="/dashboard/workflows/new" style={{ display:"inline-block", background:"#4F46E5", color:"#fff", fontSize:".875rem", fontWeight:700, padding:".65rem 1.5rem", borderRadius:9, textDecoration:"none" }}>
            Créer un workflow vide
          </a>
        </div>
      </main>
    </>
  );
}
