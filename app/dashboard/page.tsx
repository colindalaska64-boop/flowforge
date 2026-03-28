"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

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
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [lastExecs, setLastExecs] = useState<Record<number, LastExecution>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

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
      Promise.all([
        fetch("/api/workflows").then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch("/api/executions?limit=200").then(r => r.ok ? r.json() : []),
        fetch("/api/limits").then(r => r.ok ? r.json() : null),
      ])
        .then(([wfs, execs, limits]) => {
          setWorkflows(Array.isArray(wfs) ? wfs : []);
          if (Array.isArray(execs)) {
            const map: Record<number, LastExecution> = {};
            for (const e of execs) {
              if (!map[e.workflow_id]) map[e.workflow_id] = e;
            }
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
        .wf-row { background: linear-gradient(145deg, rgba(255,255,255,0.90) 0%, rgba(242,238,255,0.65) 100%) !important; border: 1.5px solid rgba(255,255,255,0.92) !important; backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); box-shadow: 0 4px 14px rgba(0,0,0,0.07), 0 2px 5px rgba(0,0,0,0.04), inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.03) !important; transition: all .2s; }
        .wf-row:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(0,0,0,0.10), 0 3px 8px rgba(0,0,0,0.05), inset 0 1.5px 0 rgba(255,255,255,1) !important; }
        .btn-delete:hover { background:#FEF2F2 !important; color:#DC2626 !important; border-color:#FECACA !important; }
        .btn-open:hover { background:#4F46E5 !important; color:#fff !important; }
        @keyframes toast-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .toast { animation: toast-in .2s ease; }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 400px 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-email { display: none !important; }
          .nav-wrap { padding: .75rem 1rem !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
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
          boxShadow: "0 4px 16px rgba(0,0,0,.08)",
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
              <a key={item.label} href={item.href} style={{ fontSize:".85rem", color:"#6B7280", textDecoration:"none", padding:".4rem .75rem", borderRadius:"8px", fontWeight:500 }}>{item.label}</a>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <span className="nav-email" style={{ fontSize:".82rem", color:"#9CA3AF" }}>{session?.user?.email}</span>
          <div style={{ background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", fontSize:".72rem", fontWeight:700, padding:".25rem .7rem", borderRadius:"100px", textTransform:"uppercase", letterSpacing:".05em" }}>
            {userPlan}
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ fontSize:".82rem", fontWeight:600, color:"#DC2626", background:"linear-gradient(145deg,rgba(255,255,255,0.90),rgba(254,242,242,0.85))", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:"1.5px solid rgba(254,202,202,0.85)", padding:".4rem .9rem", borderRadius:"9px", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 8px rgba(220,38,38,0.08), inset 0 1.5px 0 rgba(255,255,255,1)" }}>
            Déconnexion
          </button>
        </div>
      </nav>

      <main className="main-pad" style={{ maxWidth:"1080px", margin:"0 auto", padding:"3rem 2rem" }}>
        <div style={{ marginBottom:"2.5rem" }}>
          <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".4rem" }}>
            Bonjour, {session?.user?.name || session?.user?.email} !
          </h1>
          <p style={{ fontSize:".95rem", color:"#6B7280" }}>Gérez vos workflows et automatisations.</p>
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
              <div className="glass-card" style={{ borderRadius:"12px", padding:"1.5rem" }}>
                <p style={{ fontSize:".78rem", color:"#9CA3AF", marginBottom:".5rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>Workflows actifs</p>
                <p style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em" }}>{workflows.filter(w => w.active).length}</p>
              </div>
              <div className="glass-card" style={{ borderRadius:"12px", padding:"1.5rem" }}>
                <p style={{ fontSize:".78rem", color:"#9CA3AF", marginBottom:".5rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>Tâches ce mois</p>
                {taskStats ? (
                  <>
                    <p style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", color: taskStats.used >= taskStats.limit ? "#DC2626" : "#0A0A0A" }}>
                      {taskStats.used.toLocaleString("fr-FR")}
                      <span style={{ fontSize:".95rem", fontWeight:600, color:"#9CA3AF" }}>/{taskStats.limit.toLocaleString("fr-FR")}</span>
                    </p>
                    <div style={{ marginTop:".5rem", height:4, borderRadius:100, background:"#F3F4F6", overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:100, width:`${Math.min((taskStats.used / taskStats.limit) * 100, 100)}%`, background: taskStats.used >= taskStats.limit * 0.9 ? "#EF4444" : "#4F46E5", transition:"width .3s" }} />
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", color:"#9CA3AF" }}>—</p>
                )}
              </div>
              <div className="glass-card" style={{ borderRadius:"12px", padding:"1.5rem" }}>
                <p style={{ fontSize:".78rem", color:"#9CA3AF", marginBottom:".5rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>Plan actuel</p>
                <p style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em" }}>{userPlan.toUpperCase()}</p>
              </div>
            </>
          )}
        </div>

        <div className="glass-card" style={{ borderRadius:"14px", overflow:"hidden" }}>
          <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <h2 style={{ fontSize:"1rem", fontWeight:700 }}>Mes workflows</h2>
            {!loading && (userPlan !== "free" || workflows.length < 5) && (
              <a href="/dashboard/workflows/new" style={{ fontSize:".85rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", textDecoration:"none", padding:".5rem 1.1rem", borderRadius:"9px", boxShadow:"0 4px 16px rgba(99,102,241,.35), inset 0 1px 0 rgba(255,255,255,0.25)" }}>
                + Nouveau workflow
              </a>
            )}
            {!loading && userPlan === "free" && workflows.length >= 5 && (
              <a href="/pricing" style={{ fontSize:".85rem", fontWeight:600, background:"#D97706", color:"#fff", textDecoration:"none", padding:".5rem 1.1rem", borderRadius:"8px" }}>
                Limite atteinte — Upgrader
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
              <p style={{ fontSize:".875rem", color:"#9CA3AF", marginBottom:"1.5rem" }}>
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
              <p style={{ fontSize:".875rem", color:"#9CA3AF", marginBottom:"1.5rem" }}>Créez votre premier workflow pour commencer à automatiser.</p>
              <a href="/dashboard/workflows/new" style={{ fontSize:".9rem", fontWeight:600, background:"#4F46E5", color:"#fff", textDecoration:"none", padding:".75rem 1.5rem", borderRadius:"10px" }}>
                Créer mon premier workflow
              </a>
            </div>
          )}

          {/* Liste des workflows */}
          {!loading && !fetchError && workflows.map((wf) => (
            <div key={wf.id} className="wf-row" style={{ padding:"1rem 1.5rem", borderBottom:"1px solid #F9FAFB" }}>
              <div className="wf-row-inner" style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <p style={{ fontSize:".9rem", fontWeight:600, color:"#0A0A0A" }}>{wf.name}</p>
                <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginTop:".25rem" }}>
                  <p style={{ fontSize:".75rem", color:"#9CA3AF" }}>
                    Créé le {new Date(wf.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}
                  </p>
                  {lastExecs[wf.id] && (
                    <>
                      <span style={{ color:"#E5E7EB" }}>·</span>
                      <span style={{ fontSize:".72rem", fontWeight:600, color: lastExecs[wf.id].status === "success" ? "#059669" : "#DC2626" }}>
                        {lastExecs[wf.id].status === "success" ? "Dernière exéc. réussie" : "Dernière exéc. en erreur"}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="wf-actions" style={{ display:"flex", alignItems:"center", gap:".75rem" }}>
                <span style={{ fontSize:".72rem", fontWeight:700, textTransform:"uppercase", padding:".25rem .7rem", borderRadius:"100px", background: wf.active ? "#ECFDF5" : "#F3F4F6", color: wf.active ? "#059669" : "#6B7280" }}>
                  {wf.active ? "Actif" : "Inactif"}
                </span>
                <a href={`/dashboard/workflows/new?id=${wf.id}`} className="btn-open" style={{ fontSize:".78rem", fontWeight:600, color:"#4F46E5", background:"#EEF2FF", border:"1px solid #C7D2FE", padding:".3rem .7rem", borderRadius:"6px", textDecoration:"none", transition:"all .15s" }}>
                  Ouvrir
                </a>
                <button
                  className="btn-delete"
                  onClick={() => setConfirmId(wf.id)}
                  disabled={deleting === wf.id}
                  style={{ fontSize:".78rem", fontWeight:600, color:"#9CA3AF", background:"none", border:"1px solid #E5E7EB", padding:".3rem .7rem", borderRadius:"6px", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}
                >
                  {deleting === wf.id ? "..." : "Supprimer"}
                </button>
              </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
