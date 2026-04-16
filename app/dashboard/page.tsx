"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut, Zap, LayoutTemplate, Clock, Settings2, Plus, TrendingUp, Activity } from "lucide-react";
import Logo from "@/components/Logo";
import { useThemeColors } from "@/lib/theme";

type Workflow = {
  id: number;
  name: string;
  active: boolean;
  created_at: string;
};

type LastExecution = {
  workflow_id: number;
  status: "success" | "error";
  created_at: string;
};

type Toast = {
  message: string;
  type: "success" | "error";
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const c = useThemeColors();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [lastExecs, setLastExecs] = useState<Record<number, LastExecution>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [duplicating, setDuplicating] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [shareLinks, setShareLinks] = useState<Record<number, string | null>>({});

  // Fermer le menu si on clique dehors — utilise click (pas mousedown) pour éviter le conflit
  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    // setTimeout pour ne pas capter le click qui vient d'ouvrir le menu
    const t = setTimeout(() => document.addEventListener("click", close), 0);
    return () => { clearTimeout(t); document.removeEventListener("click", close); };
  }, [menuOpenId]);

  const userPlan = (session?.user as { plan?: string })?.plan || "free";
  const [taskStats, setTaskStats] = useState<{ used: number; limit: number } | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/dashboard")
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(({ workflows: wfs, lastExecs: execs, limits }) => {
          setWorkflows(Array.isArray(wfs) ? wfs : []);
          if (Array.isArray(execs)) {
            const map: Record<number, LastExecution> = {};
            for (const e of execs) map[e.workflow_id] = e;
            setLastExecs(map);
          }
          if (limits && typeof limits.used === "number") setTaskStats(limits);
          setLoading(false);
        })
        .catch(() => {
          setFetchError(true);
          setLoading(false);
        });
    }
  }, [status]);

  async function duplicateWorkflow(id: number) {
    setDuplicating(id);
    try {
      const res = await fetch(`/api/workflows/${id}/duplicate`, { method: "POST" });
      const data = await res.json() as { id?: number; error?: string };
      if (res.ok && data.id) {
        showToast("Workflow dupliqué !", "success");
        router.push(`/dashboard/workflows/new?id=${data.id}`);
      } else {
        showToast(data.error || "Impossible de dupliquer.", "error");
      }
    } catch {
      showToast("Erreur réseau.", "error");
    } finally {
      setDuplicating(null);
    }
  }

  async function renameWorkflow(id: number, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        setWorkflows(wfs => wfs.map(w => w.id === id ? { ...w, name: trimmed } : w));
        showToast("Workflow renommé.", "success");
      }
    } catch { showToast("Erreur lors du renommage.", "error"); }
    setRenamingId(null);
  }

  async function moveWorkflow(id: number, direction: "up" | "down") {
    const idx = workflows.findIndex(w => w.id === id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === workflows.length - 1) return;
    const newWfs = [...workflows];
    const swap = direction === "up" ? idx - 1 : idx + 1;
    [newWfs[idx], newWfs[swap]] = [newWfs[swap], newWfs[idx]];
    setWorkflows(newWfs);
    // Sauvegarder le nouvel ordre
    await Promise.all(newWfs.map((w, i) =>
      fetch(`/api/workflows/${w.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: i }),
      })
    ));
  }

  async function shareWorkflow(id: number) {
    setMenuOpenId(null);
    // Si déjà un lien actif → copier à nouveau
    if (shareLinks[id]) {
      await navigator.clipboard.writeText(shareLinks[id]!).catch(() => {});
      showToast("Lien copié !", "success");
      return;
    }
    try {
      const res = await fetch(`/api/workflows/${id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable" }),
      });
      const d = await res.json() as { share_token?: string; error?: string };
      if (d.error) { showToast(d.error, "error"); return; }
      if (d.share_token) {
        const link = `${window.location.origin}/shared/${d.share_token}`;
        setShareLinks(prev => ({ ...prev, [id]: link }));
        await navigator.clipboard.writeText(link).catch(() => {});
        showToast("Lien de partage copié !", "success");
      }
    } catch { showToast("Erreur lors du partage.", "error"); }
  }

  async function deleteWorkflow(id: number) {
    setDeleting(id);
    setConfirmId(null);
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setWorkflows((wfs) => wfs.filter((w) => w.id !== id));
      showToast("Workflow supprimé.", "success");
    } catch {
      showToast("Impossible de supprimer le workflow. Réessayez.", "error");
    } finally {
      setDeleting(null);
    }
  }

  if (status === "loading") return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
        .wf-row { background: var(--c-card) !important; border: 1.5px solid var(--c-border) !important; backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); box-shadow: 0 4px 14px rgba(0,0,0,0.07), 0 2px 5px rgba(0,0,0,0.04) !important; transition: all .2s; }
        .wf-row:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(0,0,0,0.12), 0 3px 8px rgba(0,0,0,0.06) !important; }
        .btn-delete:hover { background:#FEF2F2 !important; color:#DC2626 !important; border-color:#FECACA !important; }
        .btn-open:hover { background:#4F46E5 !important; color:#fff !important; }
        .btn-signout:hover { color:#DC2626 !important; background:rgba(254,242,242,0.7) !important; }
        @keyframes toast-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .toast { animation: toast-in .2s ease; }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton { background: linear-gradient(90deg, var(--c-hover) 25%, var(--c-border) 50%, var(--c-hover) 75%); background-size: 400px 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-email { display: none !important; }
          .nav-wrap { padding: .75rem 1rem !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .shortcuts-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .wf-row-inner { flex-direction: column !important; align-items: flex-start !important; gap: .75rem !important; }
          .wf-actions { width: 100% !important; justify-content: flex-start !important; flex-wrap: wrap !important; }
          .main-pad { padding: 1.5rem 1rem !important; }
          .free-banner { flex-direction: column !important; align-items: flex-start !important; gap: .75rem !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 1000,
          background: toast.type === "success" ? "linear-gradient(145deg,rgba(255,255,255,0.92),rgba(236,253,245,0.88))" : "linear-gradient(145deg,rgba(255,255,255,0.92),rgba(254,242,242,0.88))",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: `1.5px solid ${toast.type === "success" ? "rgba(167,243,208,0.85)" : "rgba(254,202,202,0.85)"}`,
          boxShadow: toast.type === "success" ? "0 8px 24px rgba(16,185,129,0.12), inset 0 1.5px 0 rgba(255,255,255,1)" : "0 8px 24px rgba(220,38,38,0.10), inset 0 1.5px 0 rgba(255,255,255,1)",
          color: toast.type === "success" ? "#065F46" : "#991B1B",
          padding: ".75rem 1.25rem", borderRadius: "10px",
          fontSize: ".875rem", fontWeight: 600, fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: ".5rem"
        }}>
          {toast.type === "success" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/></svg>
          )}
          {toast.message}
        </div>
      )}

      {/* Modal de confirmation */}
      {confirmId !== null && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 500,
          display: "flex", alignItems: "center", justifyContent: "center"
        }} onClick={() => setConfirmId(null)}>
          <div className="glass-panel" style={{
            borderRadius: "16px", padding: "2rem",
            maxWidth: "380px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,.15)"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: "#FEF2F2",
              border: "1px solid #FECACA", display: "flex", alignItems: "center",
              justifyContent: "center", marginBottom: "1.25rem"
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: ".5rem" }}>
              Supprimer ce workflow ?
            </h3>
            <p style={{ fontSize: ".875rem", color: "#6B7280", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              Cette action est irréversible. Toutes les exécutions associées seront également supprimées.
            </p>
            <div style={{ display: "flex", gap: ".75rem" }}>
              <button onClick={() => setConfirmId(null)} style={{
                flex: 1, padding: ".6rem", borderRadius: "8px", border: "1px solid #E5E7EB",
                background: "#fff", fontSize: ".875rem", fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", color: "#374151"
              }}>
                Annuler
              </button>
              <button onClick={() => deleteWorkflow(confirmId)} style={{
                flex: 1, padding: ".6rem", borderRadius: "8px", border: "none",
                background: "#DC2626", color: "#fff", fontSize: ".875rem", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit"
              }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="nav-wrap glass-nav" style={{ padding:"1rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"2rem" }}>
          <Logo />
          <div className="nav-links" style={{ display:"flex", gap:".25rem" }}>
            {[
              { label:"Dashboard", href:"/dashboard" },
              { label:"Templates", href:"/dashboard/templates" },
              { label:"Historique", href:"/dashboard/executions" },
              { label:"Paramètres", href:"/dashboard/settings" },
              { label:"Support", href:"/dashboard/support" },
            ].map((item) => (
              <a key={item.label} href={item.href} style={{ fontSize:".85rem", color:c.text2, textDecoration:"none", padding:".4rem .75rem", borderRadius:"8px", fontWeight:500 }}>{item.label}</a>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <span className="nav-email" style={{ fontSize:".82rem", color:c.muted }}>{session?.user?.email}</span>
          <div style={{ background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", fontSize:".72rem", fontWeight:700, padding:".25rem .7rem", borderRadius:"100px", textTransform:"uppercase", letterSpacing:".05em" }}>
            {userPlan}
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} title="Se déconnecter" className="btn-signout" style={{ background:"none", border:"none", cursor:"pointer", color:c.muted, padding:".4rem", borderRadius:"8px", display:"flex", alignItems:"center", fontFamily:"inherit", transition:"all .2s" }}>
            <LogOut size={16} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      <main className="main-pad" style={{ maxWidth:"1080px", margin:"0 auto", padding:"3rem 2rem" }}>
        <div style={{ marginBottom:"2.5rem", display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <p style={{ fontSize:".8rem", fontWeight:600, color:c.muted, marginBottom:".3rem", letterSpacing:".04em" }}>
              {new Date().getHours() < 12 ? "Bonjour" : new Date().getHours() < 18 ? "Bon après-midi" : "Bonsoir"} 👋
            </p>
            <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".3rem", color:c.text }}>
              {session?.user?.name || session?.user?.email?.split("@")[0]}
            </h1>
            <p style={{ fontSize:".9rem", color:c.muted }}>
              {new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })}
            </p>
          </div>
          <a href="/dashboard/workflows/new" style={{ display:"flex", alignItems:"center", gap:".5rem", fontSize:".88rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", textDecoration:"none", padding:".6rem 1.25rem", borderRadius:10, boxShadow:"0 4px 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)", flexShrink:0 }}>
            <Plus size={15} strokeWidth={2.5} /> Nouveau workflow
          </a>
        </div>

        {/* Bannière plan Free */}
        {userPlan === "free" && !loading && (
          <div className="free-banner" style={{ background:"linear-gradient(145deg, rgba(255,255,255,0.90) 0%, rgba(255,247,237,0.85) 100%)", backdropFilter:"blur(24px) saturate(180%)", WebkitBackdropFilter:"blur(24px) saturate(180%)", border:"1.5px solid rgba(255,255,255,0.92)", borderLeft:"3px solid #D97706", borderRadius:12, padding:"1rem 1.5rem", marginBottom:"2rem", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 4px 16px rgba(217,119,6,0.08), inset 0 1.5px 0 rgba(255,255,255,1)" }}>
            <div>
              <p style={{ fontSize:".875rem", fontWeight:600, color:"#D97706", marginBottom:".2rem" }}>
                Plan Free — {workflows.length}/5 workflows utilisés
              </p>
              <p style={{ fontSize:".8rem", color:"#92400E" }}>
                Passez en Starter pour des workflows illimités et l&apos;IA générative.
              </p>
            </div>
            <a href="/pricing" style={{ fontSize:".82rem", fontWeight:700, background:"#D97706", color:"#fff", textDecoration:"none", padding:".5rem 1rem", borderRadius:8, whiteSpace:"nowrap", flexShrink:0 }}>
              Upgrader
            </a>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"2.5rem" }}>
          {loading ? (
            [0,1,2].map((i) => (
              <div key={i} className="glass-card" style={{ borderRadius:"12px", padding:"1.5rem" }}>
                <div className="skeleton" style={{ height:12, width:"60%", marginBottom:".75rem" }} />
                <div className="skeleton" style={{ height:32, width:"40%" }} />
              </div>
            ))
          ) : (
            <>
              {/* Stat 1 — Workflows actifs */}
              <div className="glass-card" style={{ borderRadius:"14px", padding:"1.5rem", position:"relative", overflow:"hidden" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:".75rem" }}>
                  <p style={{ fontSize:".72rem", color:c.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em" }}>Workflows actifs</p>
                  <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08))", border:"1px solid rgba(16,185,129,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Activity size={14} color="#059669" strokeWidth={2} />
                  </div>
                </div>
                <p style={{ fontSize:"2rem", fontWeight:800, letterSpacing:"-0.04em", color:c.text }}>{workflows.filter(w => w.active).length}</p>
                <p style={{ fontSize:".75rem", color:c.muted, marginTop:".3rem" }}>{workflows.length} workflow{workflows.length > 1 ? "s" : ""} au total</p>
              </div>

              {/* Stat 2 — Tâches */}
              <div className="glass-card" style={{ borderRadius:"14px", padding:"1.5rem", position:"relative", overflow:"hidden" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:".75rem" }}>
                  <p style={{ fontSize:".72rem", color:c.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em" }}>Tâches ce mois</p>
                  <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(79,70,229,0.08))", border:"1px solid rgba(99,102,241,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <TrendingUp size={14} color="#4F46E5" strokeWidth={2} />
                  </div>
                </div>
                {taskStats ? (
                  <>
                    <p style={{ fontSize:"2rem", fontWeight:800, letterSpacing:"-0.04em", color: taskStats.used >= taskStats.limit ? "#DC2626" : "#0A0A0A" }}>
                      {taskStats.used.toLocaleString("fr-FR")}
                      <span style={{ fontSize:".9rem", fontWeight:600, color:c.muted }}>/{taskStats.limit.toLocaleString("fr-FR")}</span>
                    </p>
                    <div style={{ marginTop:".6rem", height:4, borderRadius:100, background:"rgba(0,0,0,0.06)", overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:100, width:`${Math.min((taskStats.used / taskStats.limit) * 100, 100)}%`, background: taskStats.used >= taskStats.limit * 0.9 ? "linear-gradient(90deg,#F59E0B,#EF4444)" : "linear-gradient(90deg,#6366F1,#8B5CF6)", transition:"width .6s ease" }} />
                    </div>
                    <p style={{ fontSize:".72rem", color:c.muted, marginTop:".35rem" }}>{Math.round((taskStats.used / taskStats.limit) * 100)}% utilisé</p>
                  </>
                ) : (
                  <p style={{ fontSize:"2rem", fontWeight:800, letterSpacing:"-0.04em", color:c.muted }}>—</p>
                )}
              </div>

              {/* Stat 3 — Plan */}
              <div className="glass-card" style={{ borderRadius:"14px", padding:"1.5rem", position:"relative", overflow:"hidden" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:".75rem" }}>
                  <p style={{ fontSize:".72rem", color:c.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em" }}>Mon plan</p>
                  <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))", border:"1px solid rgba(99,102,241,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Zap size={14} color="#6366F1" strokeWidth={2} />
                  </div>
                </div>
                <p style={{ fontSize:"2rem", fontWeight:800, letterSpacing:"-0.04em", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{userPlan.toUpperCase()}</p>
                {userPlan === "free" ? (
                  <a href="/pricing" style={{ fontSize:".72rem", color:"#6366F1", fontWeight:600, textDecoration:"none", marginTop:".35rem", display:"block" }}>Passer à Starter →</a>
                ) : (
                  <p style={{ fontSize:".75rem", color:c.muted, marginTop:".3rem" }}>Actif</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Accès rapide */}
        {!loading && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:".75rem", marginBottom:"2rem" }} className="shortcuts-grid">
            {[
              { label:"Nouveau workflow", sub:"Créer une automatisation", href:"/dashboard/workflows/new", icon:Plus, color:"#6366F1", bg:"rgba(238,242,255,0.9)", border:"rgba(199,210,254,0.8)" },
              { label:"Templates", sub:"Partir d'un modèle", href:"/dashboard/templates", icon:LayoutTemplate, color:"#7C3AED", bg:"rgba(253,244,255,0.9)", border:"rgba(233,213,255,0.8)" },
              { label:"Historique", sub:"Voir les exécutions", href:"/dashboard/executions", icon:Clock, color:"#0284C7", bg:"rgba(240,249,255,0.9)", border:"rgba(186,230,253,0.8)" },
              { label:"Paramètres", sub:"Gérer mon compte", href:"/dashboard/settings", icon:Settings2, color:"#059669", bg:"rgba(236,253,245,0.9)", border:"rgba(167,243,208,0.8)" },
            ].map(item => (
              <a key={item.label} href={item.href} style={{ textDecoration:"none", display:"flex", alignItems:"center", gap:".75rem", padding:".85rem 1rem", background:`linear-gradient(145deg,rgba(255,255,255,0.90) 0%,${item.bg} 100%)`, backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)", border:`1.5px solid ${item.border}`, borderRadius:12, boxShadow:"0 3px 12px rgba(0,0,0,0.06), inset 0 1.5px 0 rgba(255,255,255,1)", transition:"all .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.10), inset 0 1.5px 0 rgba(255,255,255,1)`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "none"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 3px 12px rgba(0,0,0,0.06), inset 0 1.5px 0 rgba(255,255,255,1)"; }}
              >
                <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${item.color}22,${item.color}12)`, border:`1px solid ${item.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <item.icon size={14} color={item.color} strokeWidth={2} />
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:".8rem", fontWeight:700, color:c.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.label}</p>
                  <p style={{ fontSize:".7rem", color:c.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.sub}</p>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="glass-card" style={{ borderRadius:"14px", overflow:"visible" }}>
          <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid rgba(243,244,246,0.8)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <h2 style={{ fontSize:"1rem", fontWeight:700 }}>Mes workflows</h2>
            {!loading && userPlan === "free" && workflows.length >= 5 && (
              <a href="/pricing" style={{ fontSize:".82rem", fontWeight:700, background:"linear-gradient(145deg,rgba(255,255,255,0.90),rgba(255,247,237,0.85))", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:"1.5px solid rgba(253,230,138,0.8)", color:"#D97706", textDecoration:"none", padding:".4rem .9rem", borderRadius:9, boxShadow:"0 2px 8px rgba(217,119,6,0.10), inset 0 1.5px 0 rgba(255,255,255,1)" }}>
                Limite atteinte — Upgrader →
              </a>
            )}
          </div>

          {/* Skeleton loading */}
          {loading && (
            [0,1,2].map((i) => (
              <div key={i} style={{ padding:"1rem 1.5rem", borderBottom:"1px solid #F9FAFB", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div className="skeleton" style={{ height:14, width:180, marginBottom:".5rem" }} />
                  <div className="skeleton" style={{ height:11, width:120 }} />
                </div>
                <div style={{ display:"flex", gap:".75rem" }}>
                  <div className="skeleton" style={{ height:26, width:60, borderRadius:100 }} />
                  <div className="skeleton" style={{ height:26, width:60, borderRadius:6 }} />
                  <div className="skeleton" style={{ height:26, width:80, borderRadius:6 }} />
                </div>
              </div>
            ))
          )}

          {/* Erreur de chargement */}
          {!loading && fetchError && (
            <div style={{ padding:"3rem 2rem", textAlign:"center" }}>
              <p style={{ fontWeight:600, fontSize:"1rem", marginBottom:".4rem", color:"#DC2626" }}>
                Impossible de charger les workflows
              </p>
              <p style={{ fontSize:".875rem", color:c.muted, marginBottom:"1.5rem" }}>
                Vérifiez votre connexion et rechargez la page.
              </p>
              <button onClick={() => window.location.reload()} style={{
                fontSize:".9rem", fontWeight:600, background:"#4F46E5", color:"#fff",
                border:"none", padding:".75rem 1.5rem", borderRadius:"10px", cursor:"pointer", fontFamily:"inherit"
              }}>
                Recharger
              </button>
            </div>
          )}

          {/* Liste vide */}
          {!loading && !fetchError && workflows.length === 0 && (
            <div style={{ padding:"4rem 2rem", textAlign:"center" }}>
              <div style={{ width:48, height:48, borderRadius:12, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <p style={{ fontWeight:700, fontSize:"1rem", marginBottom:".4rem" }}>Aucun workflow pour l&apos;instant</p>
              <p style={{ fontSize:".875rem", color:c.muted, marginBottom:"1.5rem" }}>Créez votre premier workflow pour commencer à automatiser.</p>
              <a href="/dashboard/workflows/new" style={{ fontSize:".9rem", fontWeight:600, background:"#4F46E5", color:"#fff", textDecoration:"none", padding:".75rem 1.5rem", borderRadius:"10px" }}>
                Créer mon premier workflow
              </a>
            </div>
          )}

          {/* Liste des workflows */}
          {!loading && !fetchError && workflows.map((wf, idx) => (
            <div key={wf.id} className="wf-row" style={{ padding:"1rem 1.5rem", borderBottom:`1px solid ${c.border}` }}>
              <div className="wf-row-inner" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem" }}>

                {/* Gauche : flèches + nom */}
                <div style={{ display:"flex", alignItems:"center", gap:".6rem", minWidth:0, flex:1 }}>
                  {/* Flèches ordre */}
                  <div style={{ display:"flex", flexDirection:"column", gap:1, flexShrink:0, opacity:.5 }}>
                    <button onClick={() => moveWorkflow(wf.id, "up")} disabled={idx === 0} style={{ background:"none", border:"none", cursor: idx===0?"default":"pointer", padding:"1px 3px", lineHeight:1, color: idx===0?"#D1D5DB":"#9CA3AF" }}>
                      <svg width="10" height="7" viewBox="0 0 10 7" fill="currentColor"><path d="M5 0L10 7H0L5 0Z"/></svg>
                    </button>
                    <button onClick={() => moveWorkflow(wf.id, "down")} disabled={idx===workflows.length-1} style={{ background:"none", border:"none", cursor: idx===workflows.length-1?"default":"pointer", padding:"1px 3px", lineHeight:1, color: idx===workflows.length-1?"#D1D5DB":"#9CA3AF" }}>
                      <svg width="10" height="7" viewBox="0 0 10 7" fill="currentColor"><path d="M5 7L0 0H10L5 7Z"/></svg>
                    </button>
                  </div>

                  {/* Nom */}
                  <div style={{ minWidth:0, flex:1 }}>
                    {renamingId === wf.id ? (
                      <div style={{ display:"flex", gap:".4rem", alignItems:"center" }}>
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => { if (e.key==="Enter") renameWorkflow(wf.id, renameValue); if (e.key==="Escape") setRenamingId(null); }}
                          style={{ fontSize:".9rem", fontWeight:600, color:c.text, border:`1.5px solid #6366F1`, borderRadius:6, padding:".2rem .5rem", fontFamily:"inherit", background:"transparent", outline:"none", width:200, maxWidth:"100%" }}
                        />
                        <button onClick={() => renameWorkflow(wf.id, renameValue)} style={{ fontSize:".72rem", fontWeight:700, color:"#fff", background:"#6366F1", border:"none", borderRadius:5, padding:".25rem .6rem", cursor:"pointer", fontFamily:"inherit" }}>OK</button>
                        <button onClick={() => setRenamingId(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", padding:"2px", display:"flex", alignItems:"center" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setRenamingId(wf.id); setRenameValue(wf.name); }}
                        title="Cliquer pour renommer"
                        style={{ background:"none", border:"none", cursor:"text", padding:0, fontFamily:"inherit", textAlign:"left", display:"block", maxWidth:"100%" }}
                      >
                        <p style={{ fontSize:".9rem", fontWeight:600, color:c.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{wf.name}</p>
                      </button>
                    )}
                    <div style={{ display:"flex", alignItems:"center", gap:".4rem", marginTop:".15rem" }}>
                      <p style={{ fontSize:".72rem", color:c.muted }}>
                        {new Date(wf.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}
                      </p>
                      {lastExecs[wf.id] && (
                        <>
                          <span style={{ color:c.border }}>·</span>
                          <span style={{ fontSize:".72rem", fontWeight:600, color: lastExecs[wf.id].status==="success" ? "#059669" : "#DC2626" }}>
                            {lastExecs[wf.id].status==="success" ? "Dernière exéc. réussie" : "Erreur"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Droite : statut + Ouvrir + menu "…" */}
                <div style={{ display:"flex", alignItems:"center", gap:".5rem", flexShrink:0 }}>
                  <span style={{ fontSize:".68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".04em", padding:".2rem .6rem", borderRadius:100, background: wf.active?"#ECFDF5":"#F3F4F6", color: wf.active?"#059669":"#9CA3AF" }}>
                    {wf.active ? "Actif" : "Inactif"}
                  </span>

                  <a href={`/dashboard/workflows/new?id=${wf.id}`} className="btn-open" style={{ fontSize:".78rem", fontWeight:600, color:"#4F46E5", background:"#EEF2FF", border:"1px solid #C7D2FE", padding:".35rem .85rem", borderRadius:7, textDecoration:"none", transition:"all .15s" }}>
                    Ouvrir
                  </a>

                  {/* Menu "…" */}
                  <div style={{ position:"relative" }}>
                    <button
                      onClick={e => {
                        e.stopPropagation(); // empêche le listener document de fermer immédiatement
                        if (menuOpenId === wf.id) { setMenuOpenId(null); return; }
                        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                        setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                        setMenuOpenId(wf.id);
                      }}
                      style={{ background:"none", border:`1px solid ${c.border}`, borderRadius:7, padding:".35rem .6rem", cursor:"pointer", color:c.muted, display:"flex", alignItems:"center", lineHeight:1 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                    </button>

                    {menuOpenId===wf.id && menuPos && (
                      <div onMouseDown={e => e.stopPropagation()} style={{ position:"fixed", top:menuPos.top, right:menuPos.right, background:"var(--c-card)", border:`1px solid ${c.border}`, borderRadius:10, boxShadow:"0 8px 32px rgba(0,0,0,0.18)", zIndex:9999, minWidth:170, overflow:"hidden" }}>
                        {/* Renommer */}
                        <button onClick={() => { setMenuOpenId(null); setRenamingId(wf.id); setRenameValue(wf.name); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:".6rem", padding:".6rem .9rem", background:"none", border:"none", cursor:"pointer", fontSize:".82rem", fontWeight:500, color:c.text, fontFamily:"inherit", textAlign:"left" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Renommer
                        </button>
                        {/* Partager */}
                        <button onClick={() => shareWorkflow(wf.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:".6rem", padding:".6rem .9rem", background:"none", border:"none", cursor:"pointer", fontSize:".82rem", fontWeight:500, color: shareLinks[wf.id]?"#6366F1":c.text, fontFamily:"inherit", textAlign:"left", borderTop:`1px solid ${c.border}` }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                          {shareLinks[wf.id] ? "Copier le lien" : "Partager"}
                        </button>
                        {/* Dupliquer */}
                        <button onClick={() => { setMenuOpenId(null); duplicateWorkflow(wf.id); }} disabled={duplicating===wf.id} style={{ width:"100%", display:"flex", alignItems:"center", gap:".6rem", padding:".6rem .9rem", background:"none", border:"none", cursor:"pointer", fontSize:".82rem", fontWeight:500, color:c.text, fontFamily:"inherit", textAlign:"left", borderTop:`1px solid ${c.border}` }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          {duplicating===wf.id ? "Duplication…" : "Dupliquer"}
                        </button>
                        {/* Supprimer */}
                        <button onClick={() => { setMenuOpenId(null); setConfirmId(wf.id); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:".6rem", padding:".6rem .9rem", background:"none", border:"none", cursor:"pointer", fontSize:".82rem", fontWeight:500, color:"#DC2626", fontFamily:"inherit", textAlign:"left", borderTop:`1px solid ${c.border}` }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
