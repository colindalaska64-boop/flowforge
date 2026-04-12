export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { checkAdminCookie } from "@/lib/adminAuth";
import AdminNav from "@/components/AdminNav";

type FeatureRequest = {
  id: number;
  workflow_id: number | null;
  workflow_name: string;
  user_email: string;
  node_label: string;
  ai_response: string;
  created_at: string;
};

export default async function AdminFeatureRequestsPage() {
  const session = await getServerSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) redirect("/dashboard");
  const verified = await checkAdminCookie();
  if (!verified) redirect("/admin/login");

  const res = await pool.query(
    "SELECT * FROM feature_requests ORDER BY created_at DESC LIMIT 200"
  ).catch(() => ({ rows: [] }));

  const requests = res.rows as FeatureRequest[];

  // Group by node_label to see most requested features
  const byFeature: Record<string, number> = {};
  for (const r of requests) {
    const key = r.node_label || "Inconnu";
    byFeature[key] = (byFeature[key] || 0) + 1;
  }
  const topFeatures = Object.entries(byFeature)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--c-bg)}
        .tag{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:.2rem .6rem;border-radius:100px}
        details summary{cursor:pointer;list-style:none}
        details summary::-webkit-details-marker{display:none}
        details[open] .chevron{transform:rotate(90deg)}
        .chevron{transition:transform .2s;display:inline-block}
      `}</style>

      <AdminNav email={session.user?.email ?? ""} />

      <main style={{ maxWidth:960, margin:"0 auto", padding:"2rem 1.5rem" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.75rem" }}>
          <div>
            <h1 style={{ fontSize:"1.5rem", fontWeight:800, letterSpacing:"-.03em", marginBottom:".3rem" }}>💡 Feature Requests</h1>
            <p style={{ fontSize:".82rem", color:"#6B7280" }}>
              {requests.length} demande{requests.length !== 1 ? "s" : ""} détectée{requests.length !== 1 ? "s" : ""} automatiquement par l&apos;IA
            </p>
          </div>
          <a href="/admin" style={{ textDecoration:"none", padding:".5rem 1rem", borderRadius:8, fontSize:".82rem", fontWeight:600, background:"var(--c-hover)", border:"1px solid var(--c-border)", color:"var(--c-text)" }}>
            ← Dashboard
          </a>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
          <div style={{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:12, padding:"1.25rem 1.5rem" }}>
            <p style={{ fontSize:".72rem", fontWeight:700, color:"#0284C7", textTransform:"uppercase", letterSpacing:".06em", marginBottom:".4rem" }}>Total</p>
            <p style={{ fontSize:"2rem", fontWeight:800, color:"#0284C7" }}>{requests.length}</p>
          </div>
          <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:12, padding:"1.25rem 1.5rem" }}>
            <p style={{ fontSize:".72rem", fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:".06em", marginBottom:".4rem" }}>Aujourd&apos;hui</p>
            <p style={{ fontSize:"2rem", fontWeight:800, color:"var(--c-text)" }}>
              {requests.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
          <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:12, padding:"1.25rem 1.5rem" }}>
            <p style={{ fontSize:".72rem", fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:".06em", marginBottom:".4rem" }}>Utilisateurs uniques</p>
            <p style={{ fontSize:"2rem", fontWeight:800, color:"var(--c-text)" }}>
              {new Set(requests.map(r => r.user_email)).size}
            </p>
          </div>
        </div>

        {/* Top requested features */}
        {topFeatures.length > 0 && (
          <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:14, padding:"1.5rem", marginBottom:"1.5rem" }}>
            <p style={{ fontSize:".75rem", fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:".05em", marginBottom:"1rem" }}>
              Fonctionnalités les plus demandées
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:".6rem" }}>
              {topFeatures.map(([label, count], i) => {
                const maxCount = topFeatures[0][1];
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={i}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:".3rem" }}>
                      <span style={{ fontSize:".85rem", fontWeight:600, color:"var(--c-text)" }}>{label}</span>
                      <span style={{ fontSize:".82rem", color:"#6B7280" }}>{count}×</span>
                    </div>
                    <div style={{ height:6, background:"var(--c-hover)", borderRadius:100, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:"linear-gradient(90deg,#6366F1,#8B5CF6)", borderRadius:100 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:14, padding:"4rem 2rem", textAlign:"center" }}>
            <p style={{ fontSize:"2rem", marginBottom:"1rem" }}>✅</p>
            <p style={{ fontWeight:700, color:"var(--c-text)", marginBottom:".5rem" }}>Aucune feature request détectée</p>
            <p style={{ fontSize:".85rem", color:"#9CA3AF" }}>Les demandes de fonctionnalités apparaîtront ici automatiquement quand l&apos;IA dit qu&apos;une feature n&apos;est pas disponible.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            {requests.map((r) => (
              <details key={r.id} style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:14, overflow:"hidden" }}>
                <summary style={{ padding:"1rem 1.25rem", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:".75rem", minWidth:0 }}>
                    <span style={{ fontSize:"1.1rem" }}>💡</span>
                    <div style={{ minWidth:0 }}>
                      <p style={{ fontWeight:700, fontSize:".9rem", color:"var(--c-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {r.node_label || "Bloc inconnu"}
                      </p>
                      <p style={{ fontSize:".75rem", color:"#6B7280" }}>
                        {r.user_email}
                        {r.workflow_name && <span style={{ marginLeft:".5rem" }}>· {r.workflow_name}</span>}
                      </p>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:".75rem", flexShrink:0 }}>
                    <span style={{ fontSize:".75rem", color:"#9CA3AF" }}>
                      {new Date(r.created_at).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                    </span>
                    <span className="chevron" style={{ color:"#9CA3AF", fontSize:".85rem" }}>›</span>
                  </div>
                </summary>

                <div style={{ borderTop:"1px solid var(--c-border)", padding:"1.25rem" }}>
                  <p style={{ fontSize:".75rem", fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:".05em", marginBottom:".6rem" }}>
                    Réponse de l&apos;IA (contient un indicateur de fonctionnalité manquante)
                  </p>
                  <div style={{ background:"var(--c-hover)", border:"1px solid var(--c-border)", borderRadius:8, padding:".85rem 1rem" }}>
                    <p style={{ fontSize:".82rem", color:"var(--c-text)", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
                      {r.ai_response}
                    </p>
                  </div>
                  {r.workflow_id && (
                    <p style={{ fontSize:".72rem", color:"#9CA3AF", marginTop:".75rem" }}>
                      Workflow ID : #{r.workflow_id}
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}

      </main>
    </>
  );
}
