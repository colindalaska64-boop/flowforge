export const dynamic = "force-dynamic";

import Link from "next/link";
import pool from "@/lib/db";
import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";

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
  const adminEmail = await requireAdmin();

  const reportsRes = await pool.query(
    "SELECT * FROM bug_reports ORDER BY created_at DESC LIMIT 100"
  ).catch(() => ({ rows: [] }));

  const reports = reportsRes.rows as BugReport[];
  const todayCount = reports.filter(
    r => new Date(r.created_at).toDateString() === new Date().toDateString()
  ).length;
  const weekCount = reports.filter(
    r => Date.now() - new Date(r.created_at).getTime() < 7 * 24 * 3600 * 1000
  ).length;

  return (
    <AdminShell
      email={adminEmail}
      bugCount={weekCount}
      title="Bug reports"
      subtitle={`${reports.length} signalement${reports.length !== 1 ? "s" : ""} reçu${reports.length !== 1 ? "s" : ""}`}
      actions={<Link href="/admin" className="btn">Dashboard</Link>}
    >
      <div className="kpi-grid">
        <div className="kpi">
          <p className="kpi-label">Total</p>
          <p className="kpi-value" style={{ color: "var(--a-err)" }}>{reports.length}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Aujourd&apos;hui</p>
          <p className="kpi-value">{todayCount}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">7 derniers jours</p>
          <p className="kpi-value">{weekCount}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Utilisateurs uniques</p>
          <p className="kpi-value">{new Set(reports.map(r => r.user_email)).size}</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="card">
          <div className="empty">
            <p className="empty-title">Aucun bug signalé</p>
            <p className="empty-sub">Les signalements envoyés depuis l&apos;éditeur apparaîtront ici.</p>
          </div>
        </div>
      ) : (
        <div>
          {reports.map(r => {
            const resultsArr = Array.isArray(r.results)
              ? r.results as { node: string; status: string; error?: string }[]
              : [];
            const testDataObj = (r.test_data && typeof r.test_data === "object")
              ? r.test_data as Record<string, unknown>
              : null;
            const errorCount = resultsArr.filter(x => x.status === "error").length;

            return (
              <details key={r.id} className="acc">
                <summary>
                  <div className="row-main">
                    <span className={`dot ${errorCount > 0 ? "dot-err" : "dot-idle"}`} />
                    <div style={{ minWidth: 0 }}>
                      <p className="row-title">{r.workflow_name || "Workflow inconnu"}</p>
                      <p className="row-sub">{r.user_email}</p>
                    </div>
                  </div>
                  <div className="row-side">
                    {errorCount > 0 && (
                      <span className="badge badge-err">{errorCount} erreur{errorCount > 1 ? "s" : ""}</span>
                    )}
                    <span>
                      {new Date(r.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <svg className="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </summary>

                <div className="acc-body">
                  {r.description && (
                    <div className="note note-warn" style={{ marginBottom: "1.15rem" }}>
                      <strong>Description du bug</strong>
                      <br />
                      {r.description}
                    </div>
                  )}

                  {resultsArr.length > 0 && (
                    <div style={{ marginBottom: "1.15rem" }}>
                      <p className="section-label">Résultats du test</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
                        {resultsArr.map((step, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex", alignItems: "flex-start", gap: ".7rem",
                              padding: ".6rem .85rem", background: "var(--a-surface-2)",
                              border: "1px solid var(--a-border-2)", borderRadius: 9,
                            }}
                          >
                            <span
                              className={`dot ${step.status === "success" ? "dot-ok" : step.status === "error" ? "dot-err" : "dot-idle"}`}
                              style={{ marginTop: 5 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: ".82rem", fontWeight: 600 }}>{step.node}</p>
                              {step.error && (
                                <p style={{ fontSize: ".76rem", color: "var(--a-err)", marginTop: ".2rem", wordBreak: "break-word" }}>
                                  {step.error}
                                </p>
                              )}
                            </div>
                            <span className={`badge ${step.status === "success" ? "badge-ok" : step.status === "error" ? "badge-err" : "badge-neutral"}`}>
                              {step.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {testDataObj && Object.keys(testDataObj).length > 0 && (
                    <div>
                      <p className="section-label">Données de test</p>
                      <pre className="code">{JSON.stringify(testDataObj, null, 2)}</pre>
                    </div>
                  )}

                  {r.workflow_id && (
                    <p style={{ fontSize: ".73rem", color: "var(--a-text-3)", marginTop: ".9rem" }}>
                      Workflow #{r.workflow_id}
                    </p>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
