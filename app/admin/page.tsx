export const dynamic = "force-dynamic";

import Link from "next/link";
import pool from "@/lib/db";
import AdminAnnounce from "@/components/AdminAnnounce";
import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";

// ── Helpers graphiques (rendus côté serveur) ─────────────────────────────────

function buildSparkline(values: number[], W: number, H: number) {
  if (values.length < 2) return { line: "", area: "" };
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    H - 4 - (v / max) * (H - 8),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line}L${W},${H}L0,${H}Z`;
  return { line, area };
}

function buildDonut(
  data: { value: number; color: string }[],
  cx: number, cy: number, R: number, r: number
) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -Math.PI / 2;
  const segs: { path: string; color: string }[] = [];
  for (const d of data) {
    const sweep = (d.value / total) * 2 * Math.PI;
    if (sweep < 0.01) { angle += sweep; continue; }
    const x1 = cx + R * Math.cos(angle);
    const y1 = cy + R * Math.sin(angle);
    const x2 = cx + R * Math.cos(angle + sweep);
    const y2 = cy + R * Math.sin(angle + sweep);
    const ix1 = cx + r * Math.cos(angle + sweep);
    const iy1 = cy + r * Math.sin(angle + sweep);
    const ix2 = cx + r * Math.cos(angle);
    const iy2 = cy + r * Math.sin(angle);
    const lg = sweep > Math.PI ? 1 : 0;
    segs.push({
      path: `M${x1.toFixed(2)},${y1.toFixed(2)}A${R},${R} 0 ${lg},1 ${x2.toFixed(2)},${y2.toFixed(2)}L${ix1.toFixed(2)},${iy1.toFixed(2)}A${r},${r} 0 ${lg},0 ${ix2.toFixed(2)},${iy2.toFixed(2)}Z`,
      color: d.color,
    });
    angle += sweep;
  }
  return segs;
}

function fillDays(rows: { day: string; count: string }[], days: number) {
  const map: Record<string, number> = {};
  for (const r of rows) map[r.day] = Number(r.count);
  const result: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(map[d.toISOString().slice(0, 10)] || 0);
  }
  return result;
}

function dayLabel(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function planBadgeClass(plan: string) {
  if (plan === "business") return "badge badge-ok";
  if (plan === "pro") return "badge badge-info";
  if (plan === "starter") return "badge badge-accent";
  return "badge badge-neutral";
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const adminEmail = await requireAdmin();

  // ── Requêtes principales ───────────────────────────────────────────────────
  const [usersRes, workflowsRes, execRes, plansRes] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM users"),
    pool.query("SELECT COUNT(*) FROM workflows WHERE active = true"),
    pool.query(`SELECT COUNT(*) as total,
      COUNT(*) FILTER (WHERE status='success') as success,
      COUNT(*) FILTER (WHERE status='error') as errors
      FROM executions`),
    pool.query("SELECT plan, COUNT(*) as count FROM users GROUP BY plan"),
  ]);

  const [todayUsersRes, todayExecsRes, recentUsersRes, recentExecsRes] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE"),
    pool.query("SELECT COUNT(*) FROM executions WHERE DATE(created_at) = CURRENT_DATE"),
    pool.query("SELECT id, name, email, plan, created_at FROM users ORDER BY created_at DESC LIMIT 8"),
    pool.query(`SELECT e.id, e.status, e.created_at, w.name as wf_name, u.email as user_email
      FROM executions e
      LEFT JOIN workflows w ON e.workflow_id = w.id
      LEFT JOIN users u ON w.user_id = u.id
      ORDER BY e.created_at DESC LIMIT 10`),
  ]);

  // ── Séries temporelles (30 jours) ──────────────────────────────────────────
  const [signupsSeriesRes, execsSeriesRes] = await Promise.all([
    pool.query(`SELECT DATE(created_at)::text as day, COUNT(*) as count
      FROM users WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at) ORDER BY day`),
    pool.query(`SELECT DATE(created_at)::text as day, COUNT(*) as count,
      COUNT(*) FILTER (WHERE status='error') as errors
      FROM executions WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at) ORDER BY day`),
  ]);

  // ── Boîte de réception ─────────────────────────────────────────────────────
  const [bugReportsRes, supportRes, loginAuditRes, bugWeekRes] = await Promise.all([
    pool.query("SELECT * FROM bug_reports ORDER BY created_at DESC LIMIT 5").catch(() => ({ rows: [] })),
    pool.query("SELECT * FROM support_messages ORDER BY created_at DESC LIMIT 5").catch(() => ({ rows: [] })),
    pool.query("SELECT * FROM login_audit ORDER BY created_at DESC LIMIT 8").catch(() => ({ rows: [] })),
    pool.query("SELECT COUNT(*)::int AS n FROM bug_reports WHERE created_at >= NOW() - INTERVAL '7 days'")
      .catch(() => ({ rows: [{ n: 0 }] })),
  ]);

  // ── Calculs ────────────────────────────────────────────────────────────────
  const planMap: Record<string, number> = {};
  for (const p of plansRes.rows) planMap[p.plan] = Number(p.count);

  const PRICES: Record<string, number> = { free: 0, starter: 7, pro: 19, business: 49 };
  const mrr = Object.entries(planMap).reduce((s, [plan, cnt]) => s + (PRICES[plan] || 0) * cnt, 0);

  const totalExecs = Number(execRes.rows[0].total);
  const totalErrors = Number(execRes.rows[0].errors);
  const errRate = totalExecs > 0 ? ((totalErrors / totalExecs) * 100).toFixed(1) : "0.0";
  const okRate = totalExecs > 0 ? (100 - Number(errRate)).toFixed(1) : "100.0";

  const signupsData = fillDays(signupsSeriesRes.rows, 30);
  const execsData = fillDays(execsSeriesRes.rows, 30);
  const errorsData = fillDays(
    execsSeriesRes.rows.map((r: { day: string; errors: string }) => ({ day: r.day, count: r.errors })),
    30
  );

  const { line: signupLine, area: signupArea } = buildSparkline(signupsData, 420, 90);
  const { line: execLine, area: execArea } = buildSparkline(execsData, 420, 90);
  const maxExecs = Math.max(...execsData, 1);

  const PLAN_COLORS = { free: "#9CA3AF", starter: "#6366F1", pro: "#0EA5E9", business: "#10B981" };
  const donutSegs = buildDonut([
    { value: planMap.free || 0, color: PLAN_COLORS.free },
    { value: planMap.starter || 0, color: PLAN_COLORS.starter },
    { value: planMap.pro || 0, color: PLAN_COLORS.pro },
    { value: planMap.business || 0, color: PLAN_COLORS.business },
  ], 75, 75, 64, 44);

  const totalUsers = Number(usersRes.rows[0].count);
  const todayUsers = Number(todayUsersRes.rows[0].count);
  const todayExecs = Number(todayExecsRes.rows[0].count);
  const bugCount = bugWeekRes.rows[0]?.n ?? 0;

  const xLabels = [29, 22, 15, 8, 1].map(dayLabel);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <AdminShell
      email={adminEmail}
      bugCount={bugCount}
      title="Control Center"
      subtitle={today.charAt(0).toUpperCase() + today.slice(1)}
      actions={
        <>
          <span className="badge badge-ok"><span className="dot dot-ok" /> En ligne</span>
          <Link href="/admin/executions" className="btn btn-primary">Voir les exécutions</Link>
        </>
      }
    >
      {/* ── KPI ── */}
      <div className="kpi-grid">
        <div className="kpi">
          <p className="kpi-label">Utilisateurs</p>
          <p className="kpi-value" style={{ color: "var(--a-accent)" }}>{totalUsers.toLocaleString("fr-FR")}</p>
          <p className={`kpi-meta${todayUsers > 0 ? " up" : ""}`}>
            {todayUsers > 0 ? `+${todayUsers} aujourd'hui` : "aucune inscription aujourd'hui"}
          </p>
        </div>

        <div className="kpi">
          <p className="kpi-label">MRR estimé</p>
          <p className="kpi-value" style={{ color: "var(--a-ok)" }}>{mrr.toLocaleString("fr-FR")} €</p>
          <p className="kpi-meta">par mois</p>
        </div>

        <div className="kpi">
          <p className="kpi-label">Exécutions</p>
          <p className="kpi-value" style={{ color: "var(--a-info)" }}>{totalExecs.toLocaleString("fr-FR")}</p>
          <p className="kpi-meta">{todayExecs > 0 ? `+${todayExecs} aujourd'hui` : "aucune aujourd'hui"}</p>
        </div>

        <div className="kpi">
          <p className="kpi-label">Taux de succès</p>
          <p className="kpi-value" style={{ color: Number(okRate) >= 95 ? "var(--a-ok)" : "var(--a-warn)" }}>{okRate} %</p>
          <p className={`kpi-meta${Number(errRate) > 0 ? " down" : ""}`}>{errRate} % d&apos;erreurs</p>
        </div>

        <div className="kpi">
          <p className="kpi-label">Workflows actifs</p>
          <p className="kpi-value" style={{ color: "var(--a-warn)" }}>{Number(workflowsRes.rows[0].count).toLocaleString("fr-FR")}</p>
          <p className="kpi-meta">en production</p>
        </div>
      </div>

      {/* ── Courbes + répartition ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: "1.15rem", marginBottom: "1.15rem" }} className="dash-charts">
        <div className="card">
          <div className="card-head">
            <p className="card-title">Activité — 30 derniers jours</p>
            <div className="chart-legend">
              <span><i className="swatch" style={{ background: "#6366F1" }} /> Inscriptions</span>
              <span><i className="swatch" style={{ background: "#0EA5E9" }} /> Exécutions</span>
            </div>
          </div>
          <div className="card-body">
            <p className="section-label">
              Nouvelles inscriptions · pic {Math.max(...signupsData)}/jour
            </p>
            <svg viewBox="0 0 420 90" style={{ width: "100%", height: 90, display: "block" }} role="img" aria-label="Inscriptions sur 30 jours">
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 25, 50, 75, 100].map(p => (
                <line key={p} x1="0" y1={90 - (p / 100) * 82} x2="420" y2={90 - (p / 100) * 82} stroke="var(--a-border-2)" strokeWidth="1" />
              ))}
              {signupArea && <path d={signupArea} fill="url(#sg)" />}
              {signupLine && <path d={signupLine} stroke="#6366F1" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
              {xLabels.map((lbl, i) => (
                <text key={i} x={(i / 4) * 420} y={89} fontSize="9" fill="var(--a-text-3)" textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>{lbl}</text>
              ))}
            </svg>

            <div style={{ height: 1, background: "var(--a-border-2)", margin: "1.15rem 0" }} />

            <p className="section-label">
              Exécutions · pic {Math.max(...execsData)}/jour
            </p>
            <svg viewBox="0 0 420 90" style={{ width: "100%", height: 90, display: "block" }} role="img" aria-label="Exécutions sur 30 jours">
              <defs>
                <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 25, 50, 75, 100].map(p => (
                <line key={p} x1="0" y1={90 - (p / 100) * 82} x2="420" y2={90 - (p / 100) * 82} stroke="var(--a-border-2)" strokeWidth="1" />
              ))}
              {execArea && <path d={execArea} fill="url(#eg)" />}
              {execLine && <path d={execLine} stroke="#0EA5E9" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
              {xLabels.map((lbl, i) => (
                <text key={i} x={(i / 4) * 420} y={89} fontSize="9" fill="var(--a-text-3)" textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>{lbl}</text>
              ))}
            </svg>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head"><p className="card-title">Répartition des plans</p></div>
            <div className="card-body" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <svg viewBox="0 0 150 150" width={132} height={132} style={{ flexShrink: 0 }} role="img" aria-label="Répartition des utilisateurs par plan">
                {donutSegs.length > 0
                  ? donutSegs.map((s, i) => <path key={i} d={s.path} fill={s.color} />)
                  : <circle cx="75" cy="75" r="54" fill="none" stroke="var(--a-border)" strokeWidth="20" />}
                <text x="75" y="71" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--a-text)">{totalUsers}</text>
                <text x="75" y="88" textAnchor="middle" fontSize="8.5" letterSpacing="1" fill="var(--a-text-3)">USERS</text>
              </svg>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: ".45rem" }}>
                {[
                  { label: "Free", count: planMap.free || 0, color: PLAN_COLORS.free },
                  { label: "Starter", count: planMap.starter || 0, color: PLAN_COLORS.starter },
                  { label: "Pro", count: planMap.pro || 0, color: PLAN_COLORS.pro },
                  { label: "Business", count: planMap.business || 0, color: PLAN_COLORS.business },
                ].map(p => (
                  <div key={p.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: ".4rem", fontSize: ".78rem", color: "var(--a-text-2)" }}>
                      <i className="swatch" style={{ background: p.color }} /> {p.label}
                    </span>
                    <span style={{ fontSize: ".82rem", fontWeight: 700 }}>{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <p className="card-title">Détail du MRR</p>
              <span style={{ fontSize: ".9rem", fontWeight: 800, color: "var(--a-ok)" }}>{mrr} €</span>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: ".7rem" }}>
              {[
                { label: "Starter", count: planMap.starter || 0, price: 7 },
                { label: "Pro", count: planMap.pro || 0, price: 19 },
                { label: "Business", count: planMap.business || 0, price: 49 },
              ].map(p => {
                const contrib = p.count * p.price;
                const pct = mrr > 0 ? (contrib / mrr) * 100 : 0;
                return (
                  <div key={p.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".3rem" }}>
                      <span style={{ fontSize: ".78rem", color: "var(--a-text-2)" }}>{p.label} × {p.count}</span>
                      <span style={{ fontSize: ".78rem", fontWeight: 700 }}>{contrib} €</span>
                    </div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
              {mrr === 0 && <p style={{ fontSize: ".78rem", color: "var(--a-text-3)" }}>Aucun abonnement payant pour l&apos;instant.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Exécutions par jour ── */}
      <div className="card mb">
        <div className="card-head">
          <p className="card-title">Exécutions par jour</p>
          <div className="chart-legend">
            <span><i className="swatch" style={{ background: "#10B981" }} /> Succès</span>
            <span><i className="swatch" style={{ background: "#EF4444" }} /> Erreurs</span>
          </div>
        </div>
        <div className="card-body">
          <svg viewBox="0 0 900 80" style={{ width: "100%", height: 80, display: "block" }} role="img" aria-label="Exécutions réussies et en erreur par jour">
            {execsData.map((total, i) => {
              const err = errorsData[i];
              const ok = Math.max(0, total - err);
              const bw = 900 / 30;
              const bx = i * bw + 1.5;
              const scale = 66 / maxExecs;
              const hOk = ok * scale;
              const hErr = err * scale;
              return (
                <g key={i}>
                  <rect x={bx} y={70 - hOk - hErr} width={bw - 3} height={hOk} fill="#10B981" rx="2" />
                  <rect x={bx} y={70 - hErr} width={bw - 3} height={hErr} fill="#EF4444" rx="2" />
                </g>
              );
            })}
            {xLabels.map((lbl, i) => (
              <text key={i} x={(i / 4) * 900} y={79} fontSize="10" fill="var(--a-text-3)" textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>{lbl}</text>
            ))}
          </svg>
        </div>
      </div>

      {/* ── Bug reports + support ── */}
      <div className="grid-2 mb">
        <div className="card">
          <div className="card-head">
            <p className="card-title">Bug reports</p>
            <Link href="/admin/bug-reports" className="card-link">Tout voir</Link>
          </div>
          {bugReportsRes.rows.length === 0 ? (
            <div className="empty"><p className="empty-title">Aucun bug signalé</p><p className="empty-sub">Rien à traiter pour le moment.</p></div>
          ) : (bugReportsRes.rows as { id: number; user_email: string; workflow_name: string; description: string; created_at: string }[]).map(r => (
            <a key={r.id} href="/admin/bug-reports" className="row">
              <div className="row-main">
                <span className="dot dot-err" />
                <div style={{ minWidth: 0 }}>
                  <p className="row-title">{r.workflow_name || "Workflow inconnu"}</p>
                  <p className="row-sub">{r.user_email}{r.description ? ` — ${r.description}` : ""}</p>
                </div>
              </div>
              <span className="row-side">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
            </a>
          ))}
        </div>

        <div className="card">
          <div className="card-head"><p className="card-title">Messages support</p></div>
          {supportRes.rows.length === 0 ? (
            <div className="empty"><p className="empty-title">Aucun message</p><p className="empty-sub">La boîte support est vide.</p></div>
          ) : (supportRes.rows as { id: number; email: string; subject: string; message: string; created_at: string }[]).map(r => (
            <div key={r.id} className="row">
              <div className="row-main">
                <span className="dot dot-idle" />
                <div style={{ minWidth: 0 }}>
                  <p className="row-title">{r.subject || "Sans objet"}</p>
                  <p className="row-sub">{r.email} — {r.message?.slice(0, 70)}</p>
                </div>
              </div>
              <span className="row-side">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Inscriptions + exécutions récentes ── */}
      <div className="grid-2 mb">
        <div className="card">
          <div className="card-head">
            <p className="card-title">Dernières inscriptions</p>
            <Link href="/admin/users" className="card-link">Gérer</Link>
          </div>
          {recentUsersRes.rows.length === 0 ? (
            <div className="empty"><p className="empty-title">Aucun utilisateur</p></div>
          ) : (recentUsersRes.rows as { id: number; name: string; email: string; plan: string; created_at: string }[]).map(u => (
            <Link key={u.id} href={`/admin/users/${u.id}`} className="row">
              <div className="row-main">
                <span className="avatar">{(u.name || u.email).charAt(0).toUpperCase()}</span>
                <div style={{ minWidth: 0 }}>
                  <p className="row-title">{u.name || "Sans nom"}</p>
                  <p className="row-sub">{u.email}</p>
                </div>
              </div>
              <div className="row-side">
                <span className={planBadgeClass(u.plan)}>{u.plan}</span>
                {new Date(u.created_at).toLocaleDateString("fr-FR")}
              </div>
            </Link>
          ))}
        </div>

        <div className="card">
          <div className="card-head">
            <p className="card-title">Exécutions récentes</p>
            <Link href="/admin/executions" className="card-link">Tout voir</Link>
          </div>
          {recentExecsRes.rows.length === 0 ? (
            <div className="empty"><p className="empty-title">Aucune exécution</p></div>
          ) : (recentExecsRes.rows as { id: number; status: string; created_at: string; wf_name: string; user_email: string }[]).map(e => (
            <div key={e.id} className="row">
              <div className="row-main">
                <span className={`dot ${e.status === "success" ? "dot-ok" : e.status === "error" ? "dot-err" : "dot-idle"}`} />
                <div style={{ minWidth: 0 }}>
                  <p className="row-title">{e.wf_name || "Workflow supprimé"}</p>
                  <p className="row-sub">{e.user_email || "—"}</p>
                </div>
              </div>
              <span className="row-side">
                {new Date(e.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Audit de connexion ── */}
      {loginAuditRes.rows.length > 0 && (
        <div className="card mb">
          <div className="card-head"><p className="card-title">Audit de connexion</p></div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>{["Email", "IP", "Statut", "Raison", "Date"].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {(loginAuditRes.rows as { id: number; email: string; ip: string; success: boolean; reason: string; created_at: string }[]).map(r => (
                  <tr key={r.id}>
                    <td className="strong">{r.email}</td>
                    <td className="mono">{r.ip}</td>
                    <td>
                      <span className={`badge ${r.success ? "badge-ok" : "badge-err"}`}>{r.success ? "OK" : "Échec"}</span>
                    </td>
                    <td>{r.reason || "—"}</td>
                    <td>{new Date(r.created_at).toLocaleString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Annonce ── */}
      <AdminAnnounce />
    </AdminShell>
  );
}
