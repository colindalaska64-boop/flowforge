"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

type BlockResult = {
  node: string;
  status: "success" | "error" | "skipped";
  result?: unknown;
  error?: string;
};

type Execution = {
  id: number;
  workflow_id: number;
  workflow_name: string;
  status: "success" | "error";
  trigger_data: Record<string, unknown>;
  results: BlockResult[] | null;
  created_at: string;
};

type Workflow = { id: number; name: string };

export default function ExecutionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWorkflow, setFilterWorkflow] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/executions?limit=100").then(r => r.json()),
      fetch("/api/workflows").then(r => r.json()),
    ])
      .then(([execs, wfs]) => {
        setExecutions(Array.isArray(execs) ? execs : []);
        setWorkflows(Array.isArray(wfs) ? wfs : []);
        setLoading(false);
      })
      .catch(() => {
        setFetchError(true);
        setLoading(false);
      });
  }, [status]);

  const filtered = executions.filter(e => {
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (filterWorkflow !== "all" && String(e.workflow_id) !== filterWorkflow) return false;
    return true;
  });

  const successCount = executions.filter(e => e.status === "success").length;
  const errorCount = executions.filter(e => e.status === "error").length;

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return "il y a quelques secondes";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  if (status === "loading") return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
        .exec-row { transition: background .12s; cursor: pointer; }
        .exec-row:hover { background: #F9FAFB !important; }
        .filter-btn { transition: all .15s; cursor: pointer; border: 1px solid #E5E7EB; background: #fff; font-family: inherit; font-size: .82rem; font-weight: 600; padding: .4rem .85rem; border-radius: 8px; color: #6B7280; }
        .filter-btn.active { background: #EEF2FF; border-color: #C7D2FE; color: #4F46E5; }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 400px 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
        pre { white-space: pre-wrap; word-break: break-all; }
        @media (max-width: 768px) {
          .exec-main { padding: 1.5rem 1rem !important; }
          .exec-nav-links { display: none !important; }
          .exec-row { flex-direction: column !important; align-items: flex-start !important; gap: .5rem !important; }
          .exec-details { flex-direction: column !important; align-items: flex-start !important; gap: .25rem !important; }
        }
      `}</style>

      <nav className="glass-nav" style={{ padding:"1rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"2rem" }}>
          <Logo />
          <div className="exec-nav-links" style={{ display:"flex", gap:".25rem" }}>
            {[
              { label:"Dashboard", href:"/dashboard" },
              { label:"Historique", href:"/dashboard/executions" },
              { label:"Paramètres", href:"/dashboard/settings" },
            ].map((item) => (
              <a key={item.label} href={item.href} style={{ fontSize:".85rem", color: item.href === "/dashboard/executions" ? "#4F46E5" : "#6B7280", textDecoration:"none", padding:".4rem .75rem", borderRadius:"8px", fontWeight: item.href === "/dashboard/executions" ? 700 : 500, background: item.href === "/dashboard/executions" ? "#EEF2FF" : "transparent" }}>{item.label}</a>
            ))}
          </div>
        </div>
        <span style={{ fontSize:".82rem", color:"#9CA3AF" }}>{session?.user?.email}</span>
      </nav>

      <main className="exec-main" style={{ maxWidth:"1080px", margin:"0 auto", padding:"3rem 2rem" }}>
        <div style={{ marginBottom:"2rem" }}>
          <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".4rem" }}>
            Historique des exécutions
          </h1>
          <p style={{ fontSize:".95rem", color:"#6B7280" }}>Toutes les exécutions de vos workflows, en temps réel.</p>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"2rem" }}>
          {loading ? (
            [0,1,2].map(i => (
              <div key={i} className="glass-card" style={{ borderRadius:12, padding:"1.5rem" }}>
                <div className="skeleton" style={{ height:12, width:"60%", marginBottom:".75rem" }} />
                <div className="skeleton" style={{ height:32, width:"40%" }} />
              </div>
            ))
          ) : (
            [
              { label:"Total exécutions", value: executions.length, color:"#0A0A0A" },
              { label:"Réussies", value: successCount, color:"#059669" },
              { label:"Erreurs", value: errorCount, color: errorCount > 0 ? "#DC2626" : "#9CA3AF" },
            ].map((s, i) => (
              <div key={i} className="glass-card" style={{ borderRadius:12, padding:"1.5rem" }}>
                <p style={{ fontSize:".78rem", color:"#9CA3AF", marginBottom:".5rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>{s.label}</p>
                <p style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", color: s.color }}>{s.value}</p>
              </div>
            ))
          )}
        </div>

        {/* Filtres */}
        {!loading && !fetchError && (
          <div style={{ display:"flex", gap:".75rem", marginBottom:"1.5rem", flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ display:"flex", gap:".4rem" }}>
              {[
                { label:"Tous", value:"all" },
                { label:"Réussies", value:"success" },
                { label:"Erreurs", value:"error" },
              ].map(f => (
                <button key={f.value} className={`filter-btn${filterStatus === f.value ? " active" : ""}`} onClick={() => setFilterStatus(f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
            {workflows.length > 0 && (
              <select value={filterWorkflow} onChange={e => setFilterWorkflow(e.target.value)} style={{ padding:".4rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", fontWeight:600, color:"#6B7280", outline:"none", background:"#fff", cursor:"pointer" }}>
                <option value="all">Tous les workflows</option>
                {workflows.map(w => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
              </select>
            )}
            <span style={{ fontSize:".8rem", color:"#9CA3AF", marginLeft:"auto" }}>
              {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Table */}
        <div className="glass-card" style={{ borderRadius:14, overflow:"hidden" }}>

          {/* Header */}
          {!loading && !fetchError && filtered.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 140px 120px 100px", padding:".75rem 1.5rem", borderBottom:"1px solid #F3F4F6", background:"#FAFAFA" }}>
              {["Workflow", "Statut", "Date", ""].map((h, i) => (
                <p key={i} style={{ fontSize:".72rem", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".06em" }}>{h}</p>
              ))}
            </div>
          )}

          {/* Skeleton */}
          {loading && [0,1,2,3,4].map(i => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 140px 120px 100px", padding:"1rem 1.5rem", borderBottom:"1px solid #F9FAFB", alignItems:"center", gap:"1rem" }}>
              <div className="skeleton" style={{ height:14, width:"55%" }} />
              <div className="skeleton" style={{ height:22, width:80, borderRadius:100 }} />
              <div className="skeleton" style={{ height:12, width:90 }} />
              <div className="skeleton" style={{ height:28, width:70, borderRadius:8 }} />
            </div>
          ))}

          {/* Erreur */}
          {!loading && fetchError && (
            <div style={{ padding:"3rem", textAlign:"center" }}>
              <p style={{ fontWeight:600, color:"#DC2626", marginBottom:".5rem" }}>Impossible de charger l&apos;historique</p>
              <button onClick={() => window.location.reload()} style={{ fontSize:".85rem", fontWeight:600, background:"#4F46E5", color:"#fff", border:"none", padding:".6rem 1.2rem", borderRadius:8, cursor:"pointer", fontFamily:"inherit" }}>Recharger</button>
            </div>
          )}

          {/* Vide */}
          {!loading && !fetchError && filtered.length === 0 && (
            <div style={{ padding:"4rem 2rem", textAlign:"center" }}>
              <div style={{ width:48, height:48, borderRadius:12, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <p style={{ fontWeight:700, fontSize:"1rem", marginBottom:".4rem" }}>
                {filterStatus !== "all" || filterWorkflow !== "all" ? "Aucun résultat pour ces filtres" : "Aucune exécution pour l'instant"}
              </p>
              <p style={{ fontSize:".875rem", color:"#9CA3AF" }}>
                {filterStatus !== "all" || filterWorkflow !== "all" ? "Essayez de changer les filtres." : "Activez un workflow et déclenchez-le pour voir les exécutions ici."}
              </p>
            </div>
          )}

          {/* Lignes */}
          {!loading && !fetchError && filtered.map((exec) => (
            <div key={exec.id}>
              <div
                className="exec-row"
                onClick={() => setExpanded(expanded === exec.id ? null : exec.id)}
                style={{ display:"grid", gridTemplateColumns:"1fr 140px 120px 100px", padding:"1rem 1.5rem", borderBottom:"1px solid #F9FAFB", alignItems:"center" }}
              >
                {/* Nom workflow */}
                <div style={{ display:"flex", alignItems:"center", gap:".75rem" }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background: exec.status === "success" ? "#10B981" : "#EF4444", flexShrink:0 }} />
                  <div>
                    <p style={{ fontSize:".875rem", fontWeight:600, color:"#0A0A0A" }}>{exec.workflow_name}</p>
                    <p style={{ fontSize:".72rem", color:"#9CA3AF", marginTop:".15rem" }}>#{exec.id}</p>
                  </div>
                </div>

                {/* Statut */}
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:".35rem",
                  fontSize:".72rem", fontWeight:700, textTransform:"uppercase", padding:".25rem .7rem",
                  borderRadius:"100px",
                  background: exec.status === "success" ? "#ECFDF5" : "#FEF2F2",
                  color: exec.status === "success" ? "#059669" : "#DC2626",
                  width:"fit-content"
                }}>
                  {exec.status === "success" ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="#DC2626" strokeWidth="3" strokeLinecap="round"/></svg>
                  )}
                  {exec.status === "success" ? "Succès" : "Erreur"}
                </span>

                {/* Date */}
                <p style={{ fontSize:".78rem", color:"#9CA3AF" }}>{formatDate(exec.created_at)}</p>

                {/* Expand */}
                <button style={{ fontSize:".75rem", fontWeight:600, color: expanded === exec.id ? "#4F46E5" : "#9CA3AF", background: expanded === exec.id ? "#EEF2FF" : "#F9FAFB", border:`1px solid ${expanded === exec.id ? "#C7D2FE" : "#E5E7EB"}`, padding:".3rem .7rem", borderRadius:6, cursor:"pointer", fontFamily:"inherit", width:"fit-content" }}>
                  {expanded === exec.id ? "Fermer" : "Détails"}
                </button>
              </div>

              {/* Données expandées */}
              {expanded === exec.id && (
                <div style={{ padding:"1rem 1.5rem 1.5rem", background:"#FAFAFA", borderBottom:"1px solid #F3F4F6" }}>

                  {/* Per-block results */}
                  {exec.results && exec.results.length > 0 && (
                    <div style={{ marginBottom:"1rem" }}>
                      <p style={{ fontSize:".72rem", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".06em", marginBottom:".6rem" }}>
                        Résultats par bloc
                      </p>
                      <div style={{ display:"flex", flexDirection:"column", gap:".4rem" }}>
                        {exec.results.map((r, i) => (
                          <div key={i} style={{
                            display:"flex", alignItems:"flex-start", gap:".75rem",
                            background:"#fff", border:`1px solid ${r.status === "error" ? "#FECACA" : r.status === "skipped" ? "#E5E7EB" : "#D1FAE5"}`,
                            borderRadius:8, padding:".6rem .9rem"
                          }}>
                            <div style={{ marginTop:2, width:8, height:8, borderRadius:"50%", flexShrink:0, background: r.status === "error" ? "#EF4444" : r.status === "skipped" ? "#9CA3AF" : "#10B981" }} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:".5rem", flexWrap:"wrap" }}>
                                <span style={{ fontSize:".8rem", fontWeight:700, color:"#111827" }}>{r.node}</span>
                                <span style={{
                                  fontSize:".65rem", fontWeight:700, textTransform:"uppercase", padding:".15rem .5rem", borderRadius:100,
                                  background: r.status === "error" ? "#FEF2F2" : r.status === "skipped" ? "#F9FAFB" : "#ECFDF5",
                                  color: r.status === "error" ? "#DC2626" : r.status === "skipped" ? "#9CA3AF" : "#059669"
                                }}>
                                  {r.status === "success" ? "Succès" : r.status === "skipped" ? "Ignoré" : "Erreur"}
                                </span>
                              </div>
                              {r.error && (
                                <p style={{ fontSize:".75rem", color:"#DC2626", marginTop:".2rem" }}>{r.error}</p>
                              )}
                              {r.status === "success" && r.result != null && (
                                <p style={{ fontSize:".75rem", color:"#6B7280", marginTop:".2rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                  {typeof r.result === "string" ? r.result : JSON.stringify(r.result)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trigger data */}
                  <p style={{ fontSize:".72rem", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".06em", marginBottom:".6rem" }}>
                    Données reçues
                  </p>
                  <pre style={{ fontSize:".78rem", color:"#374151", background:"#fff", border:"1px solid #E5E7EB", borderRadius:8, padding:".75rem 1rem", lineHeight:1.6, maxHeight:160, overflowY:"auto" }}>
                    {JSON.stringify(exec.trigger_data, null, 2)}
                  </pre>
                  <p style={{ fontSize:".72rem", color:"#9CA3AF", marginTop:".6rem" }}>
                    {new Date(exec.created_at).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit" })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
