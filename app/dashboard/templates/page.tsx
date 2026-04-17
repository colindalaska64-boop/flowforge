"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Logo from "@/components/Logo";
import { templates } from "@/lib/templates";

// ---------------------------------------------------------------------------
// Couleurs
// ---------------------------------------------------------------------------
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
  "Marketing":     { bg: "#FFF1F2", color: "#E11D48" },
  "E-commerce":    { bg: "#ECFDF5", color: "#059669" },
  "Productivité":  { bg: "#F0F9FF", color: "#0284C7" },
  "Autre":         { bg: "#F9FAFB", color: "#6B7280" },
};

const CATEGORIES = ["Toutes", "Notifications", "Données", "IA", "Logique", "Marketing", "E-commerce", "Productivité", "Autre"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type CommunityTemplate = {
  id: number;
  user_name: string;
  name: string;
  description: string;
  category: string;
  keywords: string[];
  tools: string[];
  config_time: number;
  downloads: number;
  likes: number;
  share_token: string;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function TemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<"officiel" | "communaute">("officiel");
  const [userPlan, setUserPlan] = useState("free");

  // Communauté state
  const [comTemplates, setComTemplates] = useState<CommunityTemplate[]>([]);
  const [comLoading, setComLoading] = useState(false);
  const [comTotal, setComTotal]   = useState(0);
  const [comPage, setComPage]     = useState(1);
  const [comPages, setComPages]   = useState(1);
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory]   = useState("Toutes");
  const [sort, setSort]           = useState<"recent" | "popular" | "downloads">("recent");
  const [likedIds, setLikedIds]   = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState<number | null>(null);
  const [toast, setToast]         = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/plan").then(r => r.json()).then(d => setUserPlan(d.plan || "free")).catch(() => {});
    }
  }, [status]);

  const fetchCommunity = useCallback(async (pg: number) => {
    setComLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), sort });
      if (search) params.set("q", search);
      if (category !== "Toutes") params.set("category", category);

      const res = await fetch(`/api/community-templates?${params}`);
      const data = await res.json();
      setComTemplates(data.templates || []);
      setComTotal(data.total || 0);
      setComPages(data.pages || 1);
    } catch {
      // silencieux
    } finally {
      setComLoading(false);
    }
  }, [search, category, sort]);

  // Debounce : met à jour `search` 400ms après la dernière frappe (pas besoin d'appuyer Entrée)
  useEffect(() => {
    if (tab !== "communaute") return;
    const t = setTimeout(() => {
      setSearch(searchInput);
      setComPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, tab]);

  // Reset to page 1 whenever filters/sort/tab change
  useEffect(() => {
    if (tab === "communaute") {
      setComPage(1);
      fetchCommunity(1);
    }
  }, [tab, search, category, sort, fetchCommunity]);

  // Fetch when page changes (pagination buttons)
  useEffect(() => {
    if (tab === "communaute" && comPage > 1) {
      fetchCommunity(comPage);
    }
  }, [comPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImport = async (id: number) => {
    setImporting(id);
    try {
      const res = await fetch(`/api/community-templates/${id}/import`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Erreur."); return; }
      showToast("Workflow ajouté ! Retrouvez-le dans votre dashboard.");
      router.prefetch("/dashboard");
    } catch {
      showToast("Erreur réseau.");
    } finally {
      setImporting(null);
    }
  };

  const handleLike = async (id: number) => {
    if (!session) { showToast("Connectez-vous pour liker."); return; }
    try {
      const res = await fetch(`/api/community-templates/${id}/like`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) return;
      setLikedIds(prev => {
        const next = new Set(prev);
        data.liked ? next.add(id) : next.delete(id);
        return next;
      });
      setComTemplates(prev =>
        prev.map(t => t.id === id ? { ...t, likes: data.likes } : t)
      );
    } catch { /* silencieux */ }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  if (status === "loading") return null;
  const canUseAI = userPlan === "pro" || userPlan === "business";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
        .template-card { transition: transform .15s, box-shadow .15s; cursor:pointer; }
        .template-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.08)!important; }
        .use-btn:hover { background:#4338CA!important; }
        .import-btn:hover { background:#059669!important; }
        .like-btn { background:none; border:1px solid #E5E7EB; border-radius:8px; padding:.3rem .6rem; cursor:pointer; display:flex; align-items:center; gap:.3rem; font-size:.75rem; color:#6B7280; transition:all .15s; }
        .like-btn:hover, .like-btn.liked { border-color:#F43F5E; color:#F43F5E; background:#FFF1F2; }
        .search-input { border:1px solid #E5E7EB; border-radius:10px; padding:.55rem 1rem; font-size:.875rem; outline:none; width:100%; max-width:360px; font-family:inherit; transition:border-color .15s; }
        .search-input:focus { border-color:#4F46E5; }
        .cat-chip { border:1px solid #E5E7EB; background:#fff; border-radius:100px; padding:.3rem .8rem; font-size:.78rem; cursor:pointer; font-weight:600; transition:all .15s; white-space:nowrap; }
        .cat-chip.active { background:#4F46E5; color:#fff; border-color:#4F46E5; }
        .cat-chip:hover:not(.active) { border-color:#4F46E5; color:#4F46E5; }
        .tab-btn { padding:.5rem 1.25rem; border-radius:10px; border:none; cursor:pointer; font-size:.875rem; font-weight:700; font-family:inherit; transition:all .15s; }
        .tab-btn.active { background:#4F46E5; color:#fff; }
        .tab-btn:not(.active) { background:transparent; color:#6B7280; }
        .tab-btn:not(.active):hover { background:#F3F4F6; color:#0A0A0A; }
        .sort-select { border:1px solid #E5E7EB; border-radius:8px; padding:.4rem .75rem; font-size:.8rem; font-family:inherit; cursor:pointer; outline:none; background:#fff; }
        @media (max-width:768px) {
          .templates-grid { grid-template-columns:1fr!important; }
          .templates-main { padding:1.5rem 1rem!important; }
          .templates-nav-links { display:none!important; }
          .com-filters { flex-wrap:wrap; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:"1.5rem", left:"50%", transform:"translateX(-50%)", background:"#0A0A0A", color:"#fff", padding:".75rem 1.5rem", borderRadius:12, fontSize:".875rem", fontWeight:600, zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,.2)", fontFamily:"Plus Jakarta Sans,sans-serif" }}>
          {toast}
        </div>
      )}

      {/* Nav */}
      <nav className="glass-nav" style={{ padding:"1rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"2rem" }}>
          <Logo />
          <div className="templates-nav-links" style={{ display:"flex", gap:".25rem" }}>
            {[
              { label:"Dashboard", href:"/dashboard" },
              { label:"Templates", href:"/dashboard/templates" },
              { label:"Historique", href:"/dashboard/executions" },
              { label:"Parametres", href:"/dashboard/settings" },
            ].map(item => (
              <a key={item.label} href={item.href} style={{ fontSize:".85rem", color:item.href==="/dashboard/templates"?"#4F46E5":"#6B7280", textDecoration:"none", padding:".4rem .75rem", borderRadius:"8px", fontWeight:item.href==="/dashboard/templates"?700:500, background:item.href==="/dashboard/templates"?"#EEF2FF":"transparent" }}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
        <span style={{ fontSize:".82rem", color:"#9CA3AF" }}>{session?.user?.email}</span>
      </nav>

      <main className="templates-main" style={{ maxWidth:"1200px", margin:"0 auto", padding:"3rem 2rem" }}>

        {/* Header */}
        <div style={{ marginBottom:"2rem", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".4rem" }}>
              Templates
            </h1>
            <p style={{ fontSize:".95rem", color:"#6B7280" }}>
              Officiels ou créés par la communauté — prêts en quelques minutes.
            </p>
          </div>
          {tab === "communaute" && (
            <a href="/dashboard/templates/publish" style={{ display:"inline-flex", alignItems:"center", gap:".4rem", background:"#4F46E5", color:"#fff", fontSize:".875rem", fontWeight:700, padding:".6rem 1.25rem", borderRadius:10, textDecoration:"none", flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
              Publier un template
            </a>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:".5rem", marginBottom:"2rem", background:"#F9FAFB", padding:".3rem", borderRadius:12, width:"fit-content" }}>
          <button className={`tab-btn${tab==="officiel"?" active":""}`} onClick={() => setTab("officiel")}>
            Officiels
          </button>
          <button className={`tab-btn${tab==="communaute"?" active":""}`} onClick={() => setTab("communaute")}>
            Communaute
            {comTotal > 0 && tab === "communaute" && (
              <span style={{ marginLeft:".4rem", background:"rgba(255,255,255,.3)", borderRadius:100, padding:".05rem .45rem", fontSize:".7rem" }}>
                {comTotal}
              </span>
            )}
          </button>
        </div>

        {/* ================================================================
            TAB : OFFICIELS
        ================================================================ */}
        {tab === "officiel" && (
          <>
            <div className="templates-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.25rem" }}>
              {templates.map((tpl) => {
                const cat = categoryColors[tpl.category] || { bg: "#F9FAFB", color: "#6B7280" };
                const needsPro = tpl.tools.some(t => AI_TOOLS.includes(t));
                const locked = needsPro && !canUseAI;
                return (
                  <div key={tpl.slug} className="template-card glass-card" style={{ border:`1px solid ${locked?"#DDD6FE":undefined}`, borderRadius:16, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.04)", display:"flex", flexDirection:"column", opacity:locked?.85:1 }}>
                    <div style={{ background:"#FAFAFA", borderBottom:"1px solid #F3F4F6", padding:"1.25rem 1.5rem", display:"flex", alignItems:"center", gap:".5rem", flexWrap:"wrap", position:"relative" }}>
                      {needsPro && <span style={{ position:"absolute", top:10, right:10, fontSize:".65rem", fontWeight:700, background:"#4F46E5", color:"#fff", padding:".2rem .55rem", borderRadius:100 }}>PRO</span>}
                      {tpl.tools.map((tool, i) => {
                        const s = toolColors[tool] || { bg:"#F3F4F6", color:"#6B7280", border:"#E5E7EB" };
                        return (
                          <div key={tool} style={{ display:"flex", alignItems:"center", gap:".4rem" }}>
                            <span style={{ fontSize:".75rem", fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}`, padding:".25rem .6rem", borderRadius:100 }}>{tool}</span>
                            {i < tpl.tools.length-1 && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}><path d="M5 12H19M13 6l6 6-6 6" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
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
                        <a href="/pricing" style={{ display:"block", textAlign:"center", background:"#EEF2FF", color:"#4F46E5", fontSize:".85rem", fontWeight:700, padding:".6rem", borderRadius:9, textDecoration:"none" }}>Passer en Pro</a>
                      ) : (
                        <a href={`/dashboard/workflows/new?template=${tpl.slug}`} className="use-btn" style={{ display:"block", textAlign:"center", background:"#4F46E5", color:"#fff", fontSize:".85rem", fontWeight:700, padding:".6rem", borderRadius:9, textDecoration:"none", transition:"background .15s" }}>Utiliser ce template</a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop:"3rem", background:"#EEF2FF", border:"1px solid #C7D2FE", borderRadius:16, padding:"2rem", textAlign:"center" }}>
              <p style={{ fontWeight:700, fontSize:"1rem", color:"#3730A3", marginBottom:".4rem" }}>Vous preferez partir de zero ?</p>
              <p style={{ fontSize:".875rem", color:"#6B7280", marginBottom:"1.25rem" }}>Creez un workflow vide et construisez votre automatisation bloc par bloc.</p>
              <a href="/dashboard/workflows/new" style={{ display:"inline-block", background:"#4F46E5", color:"#fff", fontSize:".875rem", fontWeight:700, padding:".65rem 1.5rem", borderRadius:9, textDecoration:"none" }}>Creer un workflow vide</a>
            </div>
          </>
        )}

        {/* ================================================================
            TAB : COMMUNAUTE
        ================================================================ */}
        {tab === "communaute" && (
          <>
            {/* Filtres */}
            <div className="com-filters" style={{ display:"flex", gap:"1rem", marginBottom:"1.5rem", alignItems:"center", flexWrap:"wrap" }}>
              {/* Recherche */}
              <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setComPage(1); }} style={{ position:"relative", flex:"1 1 260px", maxWidth:360 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", color:"#9CA3AF" }}>
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input
                  className="search-input"
                  style={{ paddingLeft:"2.2rem" }}
                  placeholder="Rechercher un template..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
              </form>

              {/* Tri */}
              <select className="sort-select" value={sort} onChange={e => setSort(e.target.value as never)}>
                <option value="recent">Plus recent</option>
                <option value="popular">Plus aime</option>
                <option value="downloads">Plus utilise</option>
              </select>
            </div>

            {/* Categories */}
            <div style={{ display:"flex", gap:".5rem", marginBottom:"1.75rem", flexWrap:"wrap" }}>
              {CATEGORIES.map(cat => (
                <button key={cat} className={`cat-chip${category===cat?" active":""}`} onClick={() => { setCategory(cat); setComPage(1); }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Grille */}
            {comLoading ? (
              <div style={{ textAlign:"center", padding:"4rem", color:"#9CA3AF", fontSize:".9rem" }}>Chargement...</div>
            ) : comTemplates.length === 0 ? (
              <div style={{ textAlign:"center", padding:"4rem 2rem" }}>
                <div style={{ fontSize:"2.5rem", marginBottom:"1rem" }}>—</div>
                <p style={{ fontWeight:700, fontSize:"1rem", marginBottom:".5rem" }}>Aucun template trouve</p>
                <p style={{ fontSize:".875rem", color:"#6B7280", marginBottom:"1.5rem" }}>Soyez le premier a publier dans cette categorie !</p>
                <a href="/dashboard/templates/publish" style={{ display:"inline-block", background:"#4F46E5", color:"#fff", fontSize:".875rem", fontWeight:700, padding:".65rem 1.5rem", borderRadius:9, textDecoration:"none" }}>Publier un template</a>
              </div>
            ) : (
              <>
                <div className="templates-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.25rem", marginBottom:"2rem" }}>
                  {comTemplates.map(tpl => {
                    const cat = categoryColors[tpl.category] || { bg:"#F9FAFB", color:"#6B7280" };
                    const isLiked = likedIds.has(tpl.id);
                    return (
                      <div key={tpl.id} className="template-card glass-card" style={{ borderRadius:16, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.04)", display:"flex", flexDirection:"column" }}>
                        {/* Outils */}
                        <div style={{ background:"#FAFAFA", borderBottom:"1px solid #F3F4F6", padding:"1rem 1.5rem", display:"flex", alignItems:"center", gap:".4rem", flexWrap:"wrap", minHeight:"52px" }}>
                          {(tpl.tools || []).slice(0, 4).map((tool, i) => {
                            const s = toolColors[tool] || { bg:"#F3F4F6", color:"#6B7280", border:"#E5E7EB" };
                            return (
                              <div key={i} style={{ display:"flex", alignItems:"center", gap:".3rem" }}>
                                <span style={{ fontSize:".72rem", fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}`, padding:".2rem .55rem", borderRadius:100 }}>{tool}</span>
                                {i < Math.min(tpl.tools.length, 4)-1 && <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M13 6l6 6-6 6" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </div>
                            );
                          })}
                          {tpl.tools.length > 4 && <span style={{ fontSize:".7rem", color:"#9CA3AF" }}>+{tpl.tools.length-4}</span>}
                        </div>

                        {/* Contenu */}
                        <div style={{ padding:"1.25rem 1.5rem", flex:1, display:"flex", flexDirection:"column" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:".6rem" }}>
                            <span style={{ fontSize:".7rem", fontWeight:700, background:cat.bg, color:cat.color, padding:".2rem .55rem", borderRadius:100, textTransform:"uppercase", letterSpacing:".06em" }}>{tpl.category}</span>
                            <span style={{ fontSize:".72rem", color:"#9CA3AF" }}>· ~{tpl.config_time} min</span>
                          </div>
                          <h3 style={{ fontSize:".95rem", fontWeight:700, color:"#0A0A0A", marginBottom:".35rem", lineHeight:1.3 }}>{tpl.name}</h3>
                          <p style={{ fontSize:".8rem", color:"#6B7280", lineHeight:1.55, flex:1, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{tpl.description}</p>

                          {/* Keywords */}
                          {tpl.keywords?.length > 0 && (
                            <div style={{ display:"flex", gap:".3rem", flexWrap:"wrap", marginTop:".75rem" }}>
                              {tpl.keywords.slice(0, 3).map(kw => (
                                <span key={kw} style={{ fontSize:".68rem", color:"#6B7280", background:"#F3F4F6", padding:".15rem .45rem", borderRadius:6 }}>{kw}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div style={{ padding:".75rem 1.5rem", borderTop:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:".75rem" }}>
                            <button className={`like-btn${isLiked?" liked":""}`} onClick={() => handleLike(tpl.id)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill={isLiked?"currentColor":"none"}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              {tpl.likes}
                            </button>
                            <span style={{ fontSize:".72rem", color:"#9CA3AF" }}>{tpl.downloads} utilisation{tpl.downloads !== 1 ? "s" : ""}</span>
                          </div>
                          <span style={{ fontSize:".72rem", color:"#9CA3AF" }}>par {tpl.user_name}</span>
                        </div>

                        {/* CTA */}
                        <div style={{ padding:"0 1.5rem 1rem" }}>
                          <button
                            className="import-btn"
                            disabled={importing === tpl.id}
                            onClick={() => handleImport(tpl.id)}
                            style={{ width:"100%", background:"#059669", color:"#fff", border:"none", fontSize:".85rem", fontWeight:700, padding:".6rem", borderRadius:9, cursor:"pointer", transition:"background .15s", fontFamily:"inherit", opacity:importing===tpl.id?.6:1 }}
                          >
                            {importing === tpl.id ? "Import..." : "Utiliser ce template"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {comPages > 1 && (
                  <div style={{ display:"flex", justifyContent:"center", gap:".5rem", alignItems:"center" }}>
                    <button onClick={() => { setComPage(p => Math.max(1, p-1)); fetchCommunity(comPage-1); }} disabled={comPage===1} style={{ padding:".45rem .9rem", border:"1px solid #E5E7EB", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:".85rem", fontFamily:"inherit", opacity:comPage===1?.4:1 }}>
                      Precedent
                    </button>
                    <span style={{ fontSize:".85rem", color:"#6B7280" }}>Page {comPage} / {comPages}</span>
                    <button onClick={() => { setComPage(p => Math.min(comPages, p+1)); fetchCommunity(comPage+1); }} disabled={comPage===comPages} style={{ padding:".45rem .9rem", border:"1px solid #E5E7EB", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:".85rem", fontFamily:"inherit", opacity:comPage===comPages?.4:1 }}>
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}
