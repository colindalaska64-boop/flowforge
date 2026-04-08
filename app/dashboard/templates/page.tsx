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
  "TikTok":        { bg: "#F9FAFB", color: "#0A0A0A", border: "#E5E7EB" },
  "YouTube":       { bg: "#FFF5F5", color: "#CC0000", border: "#FFBDBD" },
  "Instagram":     { bg: "#FFF0F5", color: "#E1306C", border: "#FFB3C6" },
};

const categoryColors: Record<string, { bg: string; color: string }> = {
  "Notifications": { bg: "#FFF7ED", color: "#D97706" },
  "Données":       { bg: "#F0FDF4", color: "#16A34A" },
  "Logique":       { bg: "#FDF4FF", color: "#7C3AED" },
  "IA":            { bg: "#EEF2FF", color: "#4F46E5" },
  "Créateurs":     { bg: "#FFF0F5", color: "#E1306C" },
  "Autre":         { bg: "#F9FAFB", color: "#6B7280" },
};

type CommunityTemplate = {
  id: number;
  user_name: string;
  name: string;
  description: string;
  category: string;
  tools: string[];
  created_at: string;
};

export default function TemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userPlan, setUserPlan] = useState<string>("free");
  const [tab, setTab] = useState<"official" | "community">("official");
  const [communityTpls, setCommunityTpls] = useState<CommunityTemplate[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishForm, setPublishForm] = useState({ name: "", description: "", category: "Autre" });
  const [publishStatus, setPublishStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [publishMsg, setPublishMsg] = useState("");
  const [myCount, setMyCount] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/plan").then(r => r.json()).then(d => setUserPlan(d.plan || "free")).catch(() => {});
    }
  }, [status]);

  useEffect(() => {
    if (tab === "community") loadCommunity();
  }, [tab]);

  async function loadCommunity() {
    setCommunityLoading(true);
    try {
      const data = await fetch("/api/community-templates").then(r => r.json());
      setCommunityTpls(Array.isArray(data) ? data : []);
      const mine = Array.isArray(data) ? data.filter((t: CommunityTemplate) => t.user_name === session?.user?.name).length : 0;
      setMyCount(mine);
    } catch { setCommunityTpls([]); }
    setCommunityLoading(false);
  }

  async function publishTemplate() {
    if (!publishForm.name || !publishForm.description) {
      setPublishMsg("Remplissez le nom et la description.");
      setPublishStatus("error");
      return;
    }
    setPublishStatus("loading");
    try {
      const res = await fetch("/api/community-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: publishForm.name,
          description: publishForm.description,
          category: publishForm.category,
          tools: [],
          nodes: [],
          edges: [],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPublishStatus("success");
        setPublishMsg("Template publié ! Il apparaîtra dans la liste communautaire.");
        loadCommunity();
        setTimeout(() => { setShowPublishModal(false); setPublishStatus("idle"); setPublishForm({ name: "", description: "", category: "Autre" }); }, 2000);
      } else {
        setPublishStatus("error");
        setPublishMsg(data.error || "Erreur lors de la publication.");
      }
    } catch {
      setPublishStatus("error");
      setPublishMsg("Erreur réseau.");
    }
  }

  async function deleteTemplate(id: number) {
    setDeleting(id);
    try {
      await fetch("/api/community-templates", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      loadCommunity();
    } catch { /* silencieux */ }
    setDeleting(null);
  }

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
        .tab-btn { padding:.55rem 1.1rem; border-radius:9px; font-size:.875rem; font-weight:600; border:none; cursor:pointer; font-family:inherit; transition:all .15s; }
        .tab-btn.active { background:#4F46E5; color:#fff; }
        .tab-btn:not(.active) { background:transparent; color:#6B7280; border:1px solid #E5E7EB; }
        .tab-btn:not(.active):hover { background:#F9FAFB; }
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
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem", marginBottom:"2rem" }}>
          <div>
            <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".4rem" }}>Templates</h1>
            <p style={{ fontSize:".95rem", color:"#6B7280" }}>
              {tab === "official" ? "Templates officiels prêts à l'emploi — configurez en 2 minutes." : "Templates créés par la communauté Loopflo."}
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:".75rem" }}>
            {tab === "community" && (
              <button
                onClick={() => setShowPublishModal(true)}
                disabled={myCount >= 10}
                style={{ fontSize:".875rem", fontWeight:700, background:"#4F46E5", color:"#fff", border:"none", padding:".6rem 1.25rem", borderRadius:9, cursor: myCount >= 10 ? "not-allowed" : "pointer", fontFamily:"inherit", opacity: myCount >= 10 ? 0.5 : 1, display:"flex", alignItems:"center", gap:".4rem" }}
                title={myCount >= 10 ? "Limite de 10 templates atteinte" : ""}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
                Publier un template
                {myCount >= 10 && <span style={{ fontSize:".65rem", background:"rgba(255,255,255,0.25)", padding:".1rem .4rem", borderRadius:4 }}>Limite atteinte</span>}
              </button>
            )}
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:"flex", gap:".5rem", marginBottom:"2rem" }}>
          <button className={`tab-btn${tab === "official" ? " active" : ""}`} onClick={() => setTab("official")}>
            Officiels ({templates.length})
          </button>
          <button className={`tab-btn${tab === "community" ? " active" : ""}`} onClick={() => setTab("community")}>
            Communauté {communityTpls.length > 0 && `(${communityTpls.length})`}
          </button>
        </div>

        {/* TAB OFFICIEL */}
        {tab === "official" && (
          <div className="templates-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.25rem" }}>
            {templates.map((tpl) => {
              const cat = categoryColors[tpl.category] || { bg: "#F9FAFB", color: "#6B7280" };
              const needsPro = tpl.tools.some(t => AI_TOOLS.includes(t));
              const locked = needsPro && !canUseAI;
              return (
                <div key={tpl.slug} className="template-card glass-card" style={{ border:`1px solid ${locked?"#DDD6FE":undefined}`, borderRadius:16, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.04)", display:"flex", flexDirection:"column", opacity: locked ? 0.85 : 1 }}>
                  <div style={{ background:"#FAFAFA", borderBottom:"1px solid #F3F4F6", padding:"1.25rem 1.5rem", display:"flex", alignItems:"center", gap:".5rem", flexWrap:"wrap", position:"relative" }}>
                    {needsPro && (
                      <span style={{ position:"absolute", top:10, right:10, fontSize:".65rem", fontWeight:700, background:"#4F46E5", color:"#fff", padding:".2rem .55rem", borderRadius:100 }}>PRO</span>
                    )}
                    {tpl.tools.map((tool, i) => {
                      const s = toolColors[tool] || { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
                      return (
                        <div key={tool} style={{ display:"flex", alignItems:"center", gap:".4rem" }}>
                          <span style={{ fontSize:".75rem", fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}`, padding:".25rem .6rem", borderRadius:100 }}>{tool}</span>
                          {i < tpl.tools.length - 1 && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}>
                              <path d="M5 12H19M13 6l6 6-6 6" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding:"1.25rem 1.5rem", flex:1, display:"flex", flexDirection:"column" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:".6rem" }}>
                      <span style={{ fontSize:".7rem", fontWeight:700, background:cat.bg, color:cat.color, padding:".2rem .55rem", borderRadius:100, textTransform:"uppercase", letterSpacing:".06em" }}>{tpl.category}</span>
                      <span style={{ fontSize:".72rem", color:"#9CA3AF" }}>· {tpl.setup} de config</span>
                    </div>
                    <h3 style={{ fontSize:".95rem", fontWeight:700, color:"#0A0A0A", marginBottom:".4rem", lineHeight:1.3 }}>{tpl.name}</h3>
                    <p style={{ fontSize:".8rem", color:"#6B7280", lineHeight:1.6, flex:1 }}>{tpl.description}</p>
                  </div>
                  <div style={{ padding:"1rem 1.5rem", borderTop:"1px solid #F3F4F6" }}>
                    {locked ? (
                      <a href="/pricing" style={{ display:"block", textAlign:"center", background:"#EEF2FF", color:"#4F46E5", fontSize:".85rem", fontWeight:700, padding:".6rem", borderRadius:9, textDecoration:"none" }}>
                        Passer en Pro pour utiliser
                      </a>
                    ) : (
                      <a href={`/dashboard/workflows/new?template=${tpl.slug}`} className="use-btn" style={{ display:"block", textAlign:"center", background:"#4F46E5", color:"#fff", fontSize:".85rem", fontWeight:700, padding:".6rem", borderRadius:9, textDecoration:"none", transition:"background .15s" }}>
                        Utiliser ce template
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB COMMUNAUTÉ */}
        {tab === "community" && (
          <>
            {communityLoading ? (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.25rem" }}>
                {[1,2,3].map(i => (
                  <div key={i} className="glass-card" style={{ borderRadius:16, padding:"1.5rem", height:200 }}>
                    <div style={{ background:"#F3F4F6", height:12, borderRadius:6, width:"60%", marginBottom:".75rem" }} />
                    <div style={{ background:"#F3F4F6", height:10, borderRadius:6, width:"90%", marginBottom:".5rem" }} />
                    <div style={{ background:"#F3F4F6", height:10, borderRadius:6, width:"75%" }} />
                  </div>
                ))}
              </div>
            ) : communityTpls.length === 0 ? (
              <div style={{ padding:"5rem 2rem", textAlign:"center" }}>
                <div style={{ width:56, height:56, borderRadius:14, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1.25rem" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="#4F46E5" strokeWidth="2"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <p style={{ fontWeight:700, fontSize:"1rem", marginBottom:".4rem" }}>Aucun template communautaire</p>
                <p style={{ fontSize:".875rem", color:"#9CA3AF", marginBottom:"1.5rem" }}>Soyez le premier à publier votre workflow !</p>
                <button onClick={() => setShowPublishModal(true)} style={{ fontSize:".875rem", fontWeight:700, background:"#4F46E5", color:"#fff", border:"none", padding:".7rem 1.5rem", borderRadius:9, cursor:"pointer", fontFamily:"inherit" }}>
                  Publier mon premier template
                </button>
              </div>
            ) : (
              <>
                {myCount > 0 && (
                  <div style={{ background:"#EEF2FF", border:"1px solid #C7D2FE", borderRadius:10, padding:".65rem 1rem", fontSize:".82rem", color:"#4338CA", marginBottom:"1.25rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span>Vous avez publié <strong>{myCount}/10</strong> templates.</span>
                    {myCount >= 10 && <span style={{ fontWeight:700 }}>Supprimez-en un pour en publier un nouveau.</span>}
                  </div>
                )}
                <div className="templates-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.25rem" }}>
                  {communityTpls.map((tpl) => {
                    const cat = categoryColors[tpl.category] || { bg: "#F9FAFB", color: "#6B7280" };
                    const isOwn = tpl.user_name === session?.user?.name;
                    return (
                      <div key={tpl.id} className="glass-card" style={{ borderRadius:16, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.04)", display:"flex", flexDirection:"column", position:"relative" }}>
                        {tpl.tools.length > 0 && (
                          <div style={{ background:"#FAFAFA", borderBottom:"1px solid #F3F4F6", padding:".85rem 1.25rem", display:"flex", alignItems:"center", gap:".4rem", flexWrap:"wrap" }}>
                            {tpl.tools.slice(0, 4).map((tool) => {
                              const s = toolColors[tool] || { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
                              return <span key={tool} style={{ fontSize:".72rem", fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}`, padding:".2rem .5rem", borderRadius:100 }}>{tool}</span>;
                            })}
                          </div>
                        )}
                        <div style={{ padding:"1.25rem 1.5rem", flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:".6rem" }}>
                            <span style={{ fontSize:".7rem", fontWeight:700, background:cat.bg, color:cat.color, padding:".2rem .55rem", borderRadius:100, textTransform:"uppercase", letterSpacing:".06em" }}>{tpl.category}</span>
                            <span style={{ fontSize:".72rem", color:"#9CA3AF" }}>· {tpl.user_name}</span>
                          </div>
                          <h3 style={{ fontSize:".95rem", fontWeight:700, color:"#0A0A0A", marginBottom:".4rem", lineHeight:1.3 }}>{tpl.name}</h3>
                          <p style={{ fontSize:".8rem", color:"#6B7280", lineHeight:1.6 }}>{tpl.description}</p>
                        </div>
                        <div style={{ padding:".85rem 1.5rem", borderTop:"1px solid #F3F4F6", display:"flex", gap:".5rem" }}>
                          <a href="/dashboard/workflows/new" style={{ flex:1, display:"block", textAlign:"center", background:"#4F46E5", color:"#fff", fontSize:".82rem", fontWeight:700, padding:".55rem", borderRadius:8, textDecoration:"none" }}>
                            Utiliser
                          </a>
                          {isOwn && (
                            <button onClick={() => deleteTemplate(tpl.id)} disabled={deleting === tpl.id} style={{ fontSize:".82rem", fontWeight:600, background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA", padding:".55rem .75rem", borderRadius:8, cursor:"pointer", fontFamily:"inherit", opacity: deleting === tpl.id ? 0.5 : 1 }}>
                              {deleting === tpl.id ? "..." : "Supprimer"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* CTA bas de page */}
        {tab === "official" && (
          <div style={{ marginTop:"3rem", background:"#EEF2FF", border:"1px solid #C7D2FE", borderRadius:16, padding:"2rem", textAlign:"center" }}>
            <p style={{ fontWeight:700, fontSize:"1rem", color:"#3730A3", marginBottom:".4rem" }}>Vous préférez partir de zéro ?</p>
            <p style={{ fontSize:".875rem", color:"#6B7280", marginBottom:"1.25rem" }}>Créez un workflow vide et construisez votre automatisation bloc par bloc.</p>
            <a href="/dashboard/workflows/new" style={{ display:"inline-block", background:"#4F46E5", color:"#fff", fontSize:".875rem", fontWeight:700, padding:".65rem 1.5rem", borderRadius:9, textDecoration:"none" }}>
              Créer un workflow vide
            </a>
          </div>
        )}
      </main>

      {/* MODAL PUBLIER */}
      {showPublishModal && (
        <div onClick={() => { if (publishStatus !== "loading") setShowPublishModal(false); }} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div onClick={e => e.stopPropagation()} className="glass-card" style={{ background:"#fff", borderRadius:18, padding:"2rem", maxWidth:460, width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,.15)" }}>
            <h3 style={{ fontSize:"1.1rem", fontWeight:800, marginBottom:".4rem" }}>Publier un template</h3>
            <p style={{ fontSize:".85rem", color:"#6B7280", marginBottom:"1.25rem" }}>
              Partagez votre workflow avec la communauté. Limite : <strong>{myCount}/10</strong> templates publiés.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:".85rem" }}>
              <div>
                <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Nom du template *</label>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="ex: Notifier Slack quand un formulaire est soumis"
                  value={publishForm.name}
                  onChange={e => setPublishForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width:"100%", padding:".65rem .85rem", border:"1px solid #E5E7EB", borderRadius:9, fontSize:".85rem", fontFamily:"inherit", outline:"none" }}
                />
              </div>
              <div>
                <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Description * (max 300 caractères)</label>
                <textarea
                  maxLength={300}
                  rows={3}
                  placeholder="Décrivez ce que fait votre workflow et dans quel cas l'utiliser."
                  value={publishForm.description}
                  onChange={e => setPublishForm(f => ({ ...f, description: e.target.value }))}
                  style={{ width:"100%", padding:".65rem .85rem", border:"1px solid #E5E7EB", borderRadius:9, fontSize:".85rem", fontFamily:"inherit", outline:"none", resize:"vertical" }}
                />
              </div>
              <div>
                <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Catégorie</label>
                <select
                  value={publishForm.category}
                  onChange={e => setPublishForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width:"100%", padding:".65rem .85rem", border:"1px solid #E5E7EB", borderRadius:9, fontSize:".85rem", fontFamily:"inherit", outline:"none", background:"#fff" }}
                >
                  {["Notifications", "Données", "Logique", "IA", "Créateurs", "Autre"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {publishStatus === "error" && (
              <p style={{ fontSize:".8rem", color:"#DC2626", marginTop:".75rem" }}>{publishMsg}</p>
            )}
            {publishStatus === "success" && (
              <p style={{ fontSize:".8rem", color:"#059669", marginTop:".75rem", display:"flex", alignItems:"center", gap:".35rem" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {publishMsg}
              </p>
            )}

            <div style={{ display:"flex", gap:".75rem", marginTop:"1.5rem" }}>
              <button onClick={() => setShowPublishModal(false)} style={{ flex:1, padding:".7rem", borderRadius:9, fontSize:".875rem", fontWeight:600, background:"none", border:"1px solid #E5E7EB", color:"#6B7280", cursor:"pointer", fontFamily:"inherit" }}>
                Annuler
              </button>
              <button
                onClick={publishTemplate}
                disabled={publishStatus === "loading" || myCount >= 10}
                style={{ flex:2, padding:".7rem", borderRadius:9, fontSize:".875rem", fontWeight:700, background:"#4F46E5", color:"#fff", border:"none", cursor:"pointer", fontFamily:"inherit", opacity: publishStatus === "loading" ? 0.7 : 1 }}
              >
                {publishStatus === "loading" ? "Publication..." : "Publier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
