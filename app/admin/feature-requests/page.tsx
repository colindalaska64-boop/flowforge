export const dynamic = "force-dynamic";

import Link from "next/link";
import pool from "@/lib/db";
import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { getRecentBugCount } from "@/lib/adminStats";

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
  const adminEmail = await requireAdmin();
  const bugCount = await getRecentBugCount();

  const res = await pool.query(
    "SELECT * FROM feature_requests ORDER BY created_at DESC LIMIT 200"
  ).catch(() => ({ rows: [] }));

  const requests = res.rows as FeatureRequest[];

  // Regroupement par bloc demandé, pour voir ce qui revient le plus
  const byFeature: Record<string, number> = {};
  for (const r of requests) {
    const key = r.node_label || "Inconnu";
    byFeature[key] = (byFeature[key] || 0) + 1;
  }
  const topFeatures = Object.entries(byFeature).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const todayCount = requests.filter(
    r => new Date(r.created_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <AdminShell
      email={adminEmail}
      bugCount={bugCount}
      title="Demandes de fonctionnalités"
      subtitle={`${requests.length} demande${requests.length !== 1 ? "s" : ""} détectée${requests.length !== 1 ? "s" : ""} automatiquement par l'IA`}
      actions={<Link href="/admin" className="btn">Dashboard</Link>}
    >
      <div className="kpi-grid">
        <div className="kpi">
          <p className="kpi-label">Total</p>
          <p className="kpi-value" style={{ color: "var(--a-info)" }}>{requests.length}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Aujourd&apos;hui</p>
          <p className="kpi-value">{todayCount}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Utilisateurs uniques</p>
          <p className="kpi-value">{new Set(requests.map(r => r.user_email)).size}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Blocs concernés</p>
          <p className="kpi-value">{Object.keys(byFeature).length}</p>
        </div>
      </div>

      {topFeatures.length > 0 && (
        <div className="card mb">
          <div className="card-head"><p className="card-title">Fonctionnalités les plus demandées</p></div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: ".8rem" }}>
            {topFeatures.map(([label, count]) => {
              const pct = Math.round((count / topFeatures[0][1]) * 100);
              return (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".3rem" }}>
                    <span style={{ fontSize: ".84rem", fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: ".8rem", color: "var(--a-text-3)" }}>{count} demande{count > 1 ? "s" : ""}</span>
                  </div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="card">
          <div className="empty">
            <p className="empty-title">Aucune demande détectée</p>
            <p className="empty-sub">
              Une demande est enregistrée quand l&apos;IA répond qu&apos;une fonctionnalité n&apos;existe pas encore.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {requests.map(r => (
            <details key={r.id} className="acc">
              <summary>
                <div className="row-main">
                  <span className="dot dot-idle" />
                  <div style={{ minWidth: 0 }}>
                    <p className="row-title">{r.node_label || "Bloc inconnu"}</p>
                    <p className="row-sub">
                      {r.user_email}{r.workflow_name ? ` — ${r.workflow_name}` : ""}
                    </p>
                  </div>
                </div>
                <div className="row-side">
                  <span>
                    {new Date(r.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <svg className="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </summary>

              <div className="acc-body">
                <p className="section-label">Réponse de l&apos;IA</p>
                <pre className="code">{r.ai_response}</pre>
                {r.workflow_id && (
                  <p style={{ fontSize: ".73rem", color: "var(--a-text-3)", marginTop: ".9rem" }}>
                    Workflow #{r.workflow_id}
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
