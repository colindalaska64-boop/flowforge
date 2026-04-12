export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { checkAdminCookie } from "@/lib/adminAuth";
import AdminNav from "@/components/AdminNav";

type BugReport = {
  id: number;
  workflow_id: number;
  user_email: string;
  workflow_name: string;
  test_data: unknown;
  results: unknown;
  description: string;
  created_at: string;
};

export default async function AdminBugReportsPage() {
  const session = await getServerSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) redirect("/dashboard");
  const verified = await checkAdminCookie();
  if (!verified) redirect("/admin/login");

  const reportsRes = await pool.query(
    "SELECT * FROM bug_reports ORDER BY created_at DESC LIMIT 100"
  ).catch(() => ({ rows: [] }));

  const reports = reportsRes.rows as BugReport[];

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
            <h1 style={{ fontSize:"1.5rem", fontWeight:800, letterSpacing:"-.03em", marginBottom:".3rem" }}>🐛 Bug Reports</h1>
            <p style={{ fontSize:".82rem", color:"#6B7280" }}>{reports.length} signalement{reports.length !== 1 ? "s" : ""} reçu{reports.length !== 1 ? "s" : ""}</p>
          </div>
          <a href="/admin" style={{ textDecoration:"none", padding:".5rem 1rem", borderRadius:8, fontSize:".82rem", fontWeight:600, background:"var(--c-hover)", border:"1px solid var(--c-border)", color:"var(--c-text)" }}>
            ← Dashboard
          </a>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
          <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, padding:"1.25rem 1.5rem" }}>
            <p style={{ fontSize:".72rem", fontWeight:700, color:"#DC2626", textTransform:"uppercase", letterSpacing:".06em", marginBottom:".4rem" }}>Total</p>
            <p style={{ fontSize:"2rem", fontWeight:800, color:"#DC2626" }}>{reports.length}</p>
          </div>
          <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:12, padding:"1.25rem 1.5rem" }}>
            <p style={{ fontSize:".72rem", fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:".06em", marginBottom:".4rem" }}>Aujourd&apos;hui</p>
            <p style={{ fontSize:"2rem", fontWeight:800, color:"var(--c-text)" }}>
              {reports.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
          <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:12, padding:"1.25rem 1.5rem" }}>
            <p style={{ fontSize:".72rem", fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:".06em", marginBottom:".4rem" }}>Utilisateurs uniques</p>
            <p style={{ fontSize:"2rem", fontWeight:800, color:"var(--c-text)" }}>
              {new Set(reports.map(r => r.user_email)).size}
            </p>
          </div>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:14, padding:"4rem 2rem", textAlign:"center" }}>
            <p style={{ fontSize:"2rem", marginBottom:"1rem" }}>✅</p>
            <p style={{ fontWeight:700, color:"var(--c-text)", marginBottom:".5rem" }}>Aucun bug reporté</p>
            <p style={{ fontSize:".85rem", color:"#9CA3AF" }}>Les signalements des utilisateurs apparaîtront ici.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            {reports.map((r) => {
              const resultsArr = Array.isArray(r.results) ? r.results as { node: string; status: string; error?: string }[] : [];
              const testDataObj = (r.test_data && typeof r.test_data === "object") ? r.test_data as Record<string, unknown> : null;
              const hasErrors = resultsArr.some(x => x.status === "error");
              return (
                <details key={r.id} style={{ background:"var(--c-card)", border:`1px solid ${hasErrors ? "#FECACA" : "var(--c-border)"}`, borderRadius:14, overflow:"hidden" }}>
                  <summary style={{ padding:"1rem 1.25rem", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:".75rem", minWidth:0 }}>
                      <span style={{ fontSize:"1.1rem" }}>🐛</span>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontWeight:700, fontSize:".9rem", color:"var(--c-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {r.workflow_name || "Workflow inconnu"}
                        </p>
                        <p style={{ fontSize:".75rem", color:"#6B7280" }}>{r.user_email}</p>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:".75rem", flexShrink:0 }}>
                      {hasErrors && (
                        <span className="tag" style={{ background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA" }}>
                          {resultsArr.filter(x => x.status === "error").length} erreur{resultsArr.filter(x => x.status === "error").length > 1 ? "s" : ""}
                        </span>
                      )}
                      <span style={{ fontSize:".75rem", color:"#9CA3AF" }}>
                        {new Date(r.created_at).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                      </span>
                      <span className="chevron" style={{ color:"#9CA3AF", fontSize:".85rem" }}>›</span>
                    </div>
                  </summary>

                  <div style={{ borderTop:"1px solid var(--c-border)", padding:"1.25rem" }}>

                    {/* Description */}
                    {r.description && (
                      <div style={{ background:"#FEF9C3", border:"1px solid #FDE68A", borderRadius:8, padding:".85rem 1rem", marginBottom:"1rem" }}>
                        <p style={{ fontSize:".78rem", fontWeight:700, color:"#92400E", marginBottom:".3rem" }}>Description du bug</p>
                        <p style={{ fontSize:".85rem", color:"#78350F", lineHeight:1.6 }}>{r.description}</p>
                      </div>
                    )}

                    {/* Results */}
                    {resultsArr.length > 0 && (
                      <div style={{ marginBottom:"1rem" }}>
                        <p style={{ fontSize:".75rem", fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:".05em", marginBottom:".6rem" }}>Résultats du test</p>
                        <div style={{ display:"flex", flexDirection:"column", gap:".4rem" }}>
                          {resultsArr.map((step, i) => (
                            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:".75rem", padding:".6rem .85rem", background:"var(--c-hover)", borderRadius:8, border:"1px solid var(--c-border)" }}>
                              <div style={{ width:8, height:8, borderRadius:"50%", background: step.status==="success" ? "#059669" : step.status==="error" ? "#DC2626" : "#9CA3AF", flexShrink:0, marginTop:4 }}/>
                              <div style={{ flex:1, minWidth:0 }}>
                                <p style={{ fontSize:".82rem", fontWeight:600, color:"var(--c-text)" }}>{step.node}</p>
                                {step.error && <p style={{ fontSize:".75rem", color:"#DC2626", marginTop:".2rem", wordBreak:"break-word" }}>{step.error}</p>}
                              </div>
                              <span className="tag" style={{
                                background: step.status==="success" ? "#ECFDF5" : step.status==="error" ? "#FEF2F2" : "#F3F4F6",
                                color:      step.status==="success" ? "#059669" : step.status==="error" ? "#DC2626" : "#9CA3AF",
                                border:     `1px solid ${step.status==="success" ? "#A7F3D0" : step.status==="error" ? "#FECACA" : "#E5E7EB"}`,
                                flexShrink: 0,
                              }}>{step.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Test Data */}
                    {testDataObj && Object.keys(testDataObj).length > 0 && (
                      <div>
                        <p style={{ fontSize:".75rem", fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:".05em", marginBottom:".6rem" }}>Données de test</p>
                        <pre style={{ fontSize:".75rem", color:"var(--c-text)", background:"var(--c-hover)", border:"1px solid var(--c-border)", padding:".85rem 1rem", borderRadius:8, overflow:"auto", maxHeight:200, lineHeight:1.6 }}>
                          {JSON.stringify(testDataObj, null, 2)}
                        </pre>
                      </div>
                    )}

                  </div>
                </details>
              );
            })}
          </div>
        )}

      </main>
    </>
  );
}
