export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import AdminAnnounce from "@/components/AdminAnnounce";
import { checkAdminCookie } from "@/lib/adminAuth";
import AdminNav from "@/components/AdminNav";

// ── SVG Chart Helpers (server-side) ──────────────────────────────────────────

function buildSparkline(values: number[], W: number, H: number) {
  if (values.length < 2) return { line: "", area: "" };
  const max = Math.max(...values, 1);
  const min = 0;
  const range = max - min;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    H - 4 - ((v - min) / range) * (H - 8),
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

function fillDays(rows: { day: string; count: string }[], days: number): number[] {
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const session = await getServerSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) redirect("/dashboard");
  const verified = await checkAdminCookie();
  if (!verified) redirect("/admin/login");

  // ── Core queries ────────────────────────────────────────────────────────────
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
      ORDER BY e.created_at DESC LIMIT 12`),
  ]);

  // ── Time-series (30 days) ───────────────────────────────────────────────────
  const [signupsSeriesRes, execsSeriesRes] = await Promise.all([
    pool.query(`SELECT DATE(created_at)::text as day, COUNT(*) as count
      FROM users WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at) ORDER BY day`),
    pool.query(`SELECT DATE(created_at)::text as day, COUNT(*) as count,
      COUNT(*) FILTER (WHERE status='error') as errors
      FROM executions WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at) ORDER BY day`),
  ]);

  // ── Inbox ───────────────────────────────────────────────────────────────────
  const [bugReportsRes, supportRes, loginAuditRes] = await Promise.all([
    pool.query("SELECT * FROM bug_reports ORDER BY created_at DESC LIMIT 6").catch(() => ({ rows: [] })),
    pool.query("SELECT * FROM support_messages ORDER BY created_at DESC LIMIT 6").catch(() => ({ rows: [] })),
    pool.query("SELECT * FROM login_audit ORDER BY created_at DESC LIMIT 10").catch(() => ({ rows: [] })),
  ]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const planMap: Record<string, number> = {};
  for (const p of plansRes.rows) planMap[p.plan] = Number(p.count);

  const PRICES: Record<string, number> = { free: 0, starter: 7, pro: 19, business: 49 };
  const mrr = Object.entries(planMap).reduce((s, [plan, cnt]) => s + (PRICES[plan] || 0) * cnt, 0);

  const totalExecs = Number(execRes.rows[0].total);
  const totalErrors = Number(execRes.rows[0].errors);
  const errRate = totalExecs > 0 ? ((totalErrors / totalExecs) * 100).toFixed(1) : "0.0";
  const okRate = totalExecs > 0 ? (100 - Number(errRate)).toFixed(1) : "100.0";

  // ── Chart data ──────────────────────────────────────────────────────────────
  const signupsData = fillDays(signupsSeriesRes.rows, 30);
  const execsData   = fillDays(execsSeriesRes.rows, 30);
  const errorsData  = fillDays(
    execsSeriesRes.rows.map((r: { day: string; errors: string }) => ({ day: r.day, count: r.errors })),
    30
  );

  const { line: signupLine, area: signupArea } = buildSparkline(signupsData, 420, 90);
  const { line: execLine,   area: execArea   } = buildSparkline(execsData,   420, 90);
  const maxExecs = Math.max(...execsData, 1);

  const donutSegs = buildDonut([
    { value: planMap.free     || 0, color: "#9CA3AF" },
    { value: planMap.starter  || 0, color: "#6366F1" },
    { value: planMap.pro      || 0, color: "#0284C7" },
    { value: planMap.business || 0, color: "#059669" },
  ], 75, 75, 64, 42);

  const totalUsers  = Number(usersRes.rows[0].count);
  const todayUsers  = Number(todayUsersRes.rows[0].count);
  const todayExecs  = Number(todayExecsRes.rows[0].count);
  const bugCount    = bugReportsRes.rows.length;

  const xLabels = [29, 22, 15, 8, 1].map(d => dayLabel(d));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--c-bg)}
        .ac{background:var(--c-card);border:1px solid var(--c-border);border-radius:14px}
        .ac-h{padding:.9rem 1.25rem;border-bottom:1px solid var(--c-border);display:flex;justify-content:space-between;align-items:center}
        .ac-b{padding:1.25rem}
        .kpi{background:var(--c-card);border:1px solid var(--c-border);border-radius:14px;padding:1.25rem 1.5rem}
        .tag{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:.2rem .6rem;border-radius:100px}
        a.row-link:hover{background:var(--c-hover)}
        .row-link{display:flex;align-items:center;justify-content:space-between;padding:.8rem 1.25rem;border-bottom:1px solid var(--c-border);text-decoration:none;color:inherit;transition:background .15s}
        .row-link:last-child{border-bottom:none}
      `}</style>

      <AdminNav email={session.user?.email ?? ""} />

      <main style={{ maxWidth:1240, margin:"0 auto", padding:"2rem 1.5rem" }}>

        {/* ── Header ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.75rem", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:".75rem", marginBottom:".3rem" }}>
              <h1 style={{ fontSize:"1.6rem", fontWeight:800, letterSpacing:"-.03em" }}>Control Center</h1>
              <span className="tag" style={{ background:"#ECFDF5", color:"#059669", border:"1px solid #A7F3D0" }}>
                ● ONLINE
              </span>
              {bugCount > 0 && (
                <a href="/admin/bug-reports" style={{ textDecoration:"none" }}>
                  <span className="tag" style={{ background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA", cursor:"pointer" }}>
                    🐛 {bugCount} bug{bugCount > 1 ? "s" : ""}
                  </span>
                </a>
              )}
            </div>
            <p style={{ fontSize:".82rem", color:"#6B7280" }}>
              {new Date().toLocaleDateString("fr-FR", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
            </p>
          </div>
          <div style={{ display:"flex", gap:".6rem" }}>
            <a href="/admin/bug-reports" style={{ textDecoration:"none", padding:".5rem 1rem", borderRadius:8, fontSize:".8rem", fontWeight:700, background:"var(--c-hover)", border:"1px solid var(--c-border)", color:"var(--c-text)" }}>
              🐛 Bug Reports
            </a>
            <a href="/admin/executions" style={{ textDecoration:"none", padding:".5rem 1rem", borderRadius:8, fontSize:".8rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff" }}>
              Exécutions →
            </a>
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"1rem", marginBottom:"1.25rem" }}>

          <div className="kpi">
            <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:".6rem" }}>Utilisateurs</p>
            <p style={{ fontSize:"2rem", fontWeight:800, letterSpacing:"-.03em", color:"#6366F1" }}>{totalUsers}</p>
            {todayUsers > 0 && <p style={{ fontSize:".72rem", color:"#059669", fontWeight:600, marginTop:".3rem" }}>+{todayUsers} aujourd&apos;hui</p>}
          </div>

          <div className="kpi">
            <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:".6rem" }}>MRR estimé</p>
            <p style={{ fontSize:"2rem", fontWeight:800, letterSpacing:"-.03em", color:"#059669" }}>{mrr}€</p>
            <p style={{ fontSize:".72rem", color:"#9CA3AF", marginTop:".3rem" }}>/ mois</p>
          </div>

          <div className="kpi">
            <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:".6rem" }}>Exécutions</p>
            <p style={{ fontSize:"2rem", fontWeight:800, letterSpacing:"-.03em", color:"#0891B2" }}>{totalExecs.toLocaleString()}</p>
            {todayExecs > 0 && <p style={{ fontSize:".72rem", color:"#6B7280", marginTop:".3rem" }}>+{todayExecs} aujourd&apos;hui</p>}
          </div>

          <div className="kpi">
            <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:".6rem" }}>Taux succès</p>
            <p style={{ fontSize:"2rem", fontWeight:800, letterSpacing:"-.03em", color: Number(okRate) >= 95 ? "#059669" : "#D97706" }}>{okRate}%</p>
            <p style={{ fontSize:".72rem", color:"#DC2626", marginTop:".3rem" }}>{errRate}% erreurs</p>
          </div>

          <div className="kpi">
            <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:".6rem" }}>Workflows actifs</p>
            <p style={{ fontSize:"2rem", fontWeight:800, letterSpacing:"-.03em", color:"#D97706" }}>{workflowsRes.rows[0].count}</p>
            <p style={{ fontSize:".72rem", color:"#9CA3AF", marginTop:".3rem" }}>en production</p>
          </div>

        </div>

        {/* ── Charts Row ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 310px", gap:"1.25rem", marginBottom:"1.25rem" }}>

          {/* Line Charts */}
          <div className="ac">
            <div className="ac-h">
              <p style={{ fontWeight:700, fontSize:".9rem" }}>Activité — 30 derniers jours</p>
              <div style={{ display:"flex", gap:"1rem" }}>
                <span style={{ fontSize:".72rem", display:"flex", alignItems:"center", gap:".35rem", color:"#6366F1", fontWeight:600 }}>
                  <svg width="16" height="3"><line x1="0" y1="1.5" x2="16" y2="1.5" stroke="#6366F1" strokeWidth="2.5" strokeDasharray="4,2"/></svg>
                  Inscriptions
                </span>
                <span style={{ fontSize:".72rem", display:"flex", alignItems:"center", gap:".35rem", color:"#0891B2", fontWeight:600 }}>
                  <svg width="16" height="3"><line x1="0" y1="1.5" x2="16" y2="1.5" stroke="#0891B2" strokeWidth="2.5"/></svg>
                  Exécutions
                </span>
              </div>
            </div>
            <div style={{ padding:"1.25rem" }}>

              {/* Signups chart */}
              <p style={{ fontSize:".72rem", fontWeight:600, color:"#9CA3AF", marginBottom:".5rem", textTransform:"uppercase", letterSpacing:".06em" }}>
                Nouvelles inscriptions · max {Math.max(...signupsData)}/j
              </p>
              <svg viewBox="0 0 420 90" style={{ width:"100%", height:90, display:"block" }}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {[0,25,50,75,100].map(p => (
                  <line key={p} x1="0" y1={90 - (p/100)*82} x2="420" y2={90 - (p/100)*82} stroke="var(--c-border)" strokeWidth="0.5"/>
                ))}
                {signupArea && <path d={signupArea} fill="url(#sg)"/>}
                {signupLine && <path d={signupLine} stroke="#6366F1" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
                {/* Day labels */}
                {xLabels.map((lbl, i) => (
                  <text key={i} x={(i/4)*420} y={89} fontSize="9" fill="#9CA3AF" textAnchor="middle">{lbl}</text>
                ))}
              </svg>

              <div style={{ height:"1px", background:"var(--c-border)", margin:"1rem 0" }}/>

              {/* Executions chart */}
              <p style={{ fontSize:".72rem", fontWeight:600, color:"#9CA3AF", marginBottom:".5rem", textTransform:"uppercase", letterSpacing:".06em" }}>
                Exécutions · max {Math.max(...execsData)}/j
              </p>
              <svg viewBox="0 0 420 90" style={{ width:"100%", height:90, display:"block" }}>
                <defs>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0891B2" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#0891B2" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {[0,25,50,75,100].map(p => (
                  <line key={p} x1="0" y1={90 - (p/100)*82} x2="420" y2={90 - (p/100)*82} stroke="var(--c-border)" strokeWidth="0.5"/>
                ))}
                {execArea && <path d={execArea} fill="url(#eg)"/>}
                {execLine && <path d={execLine} stroke="#0891B2" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
                {/* Error bars */}
                {errorsData.map((v, i) => {
                  if (!v) return null;
                  const bw = 420 / 30;
                  const bx = i * bw;
                  const bh = (v / maxExecs) * 82;
                  return <rect key={i} x={bx+1} y={90-bh-4} width={bw-2} height={bh} fill="#EF444430" rx="1"/>;
                })}
                {xLabels.map((lbl, i) => (
                  <text key={i} x={(i/4)*420} y={89} fontSize="9" fill="#9CA3AF" textAnchor="middle">{lbl}</text>
                ))}
              </svg>

            </div>
          </div>

          {/* Right column: Donut + Plans + MRR */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

            {/* Donut Chart */}
            <div className="ac">
              <div className="ac-h">
                <p style={{ fontWeight:700, fontSize:".9rem" }}>Plans</p>
              </div>
              <div style={{ padding:"1.25rem", display:"flex", alignItems:"center", gap:"1rem" }}>
                <svg viewBox="0 0 150 150" width={150} height={150} style={{ flexShrink:0 }}>
                  {donutSegs.length > 0
                    ? donutSegs.map((s, i) => <path key={i} d={s.path} fill={s.color}/>)
                    : <circle cx="75" cy="75" r="64" fill="none" stroke="var(--c-border)" strokeWidth="22"/>
                  }
                  <text x="75" y="71" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--c-text)" fontFamily="Plus Jakarta Sans">{totalUsers}</text>
                  <text x="75" y="87" textAnchor="middle" fontSize="9" fill="#9CA3AF" fontFamily="Plus Jakarta Sans">USERS</text>
                </svg>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:".5rem" }}>
                  {[
                    { label:"Free",     count: planMap.free     || 0, color:"#9CA3AF" },
                    { label:"Starter",  count: planMap.starter  || 0, color:"#6366F1" },
                    { label:"Pro",      count: planMap.pro      || 0, color:"#0284C7" },
                    { label:"Business", count: planMap.business || 0, color:"#059669" },
                  ].map(p => (
                    <div key={p.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:".4rem" }}>
                        <div style={{ width:8, height:8, borderRadius:2, background:p.color, flexShrink:0 }}/>
                        <span style={{ fontSize:".78rem", color:"#6B7280" }}>{p.label}</span>
                      </div>
                      <span style={{ fontSize:".82rem", fontWeight:700, color:"var(--c-text)" }}>{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* MRR Breakdown */}
            <div className="ac">
              <div className="ac-h">
                <p style={{ fontWeight:700, fontSize:".9rem" }}>MRR Breakdown</p>
                <span style={{ fontSize:"1rem", fontWeight:800, color:"#059669" }}>{mrr}€/mois</span>
              </div>
              <div style={{ padding:"1rem 1.25rem", display:"flex", flexDirection:"column", gap:".6rem" }}>
                {[
                  { label:"Starter", count: planMap.starter  || 0, price:7,  color:"#6366F1" },
                  { label:"Pro",     count: planMap.pro      || 0, price:19, color:"#0284C7" },
                  { label:"Business",count: planMap.business || 0, price:49, color:"#059669" },
                ].map(p => {
                  const contrib = p.count * p.price;
                  const pct = mrr > 0 ? (contrib / mrr) * 100 : 0;
                  return (
                    <div key={p.label}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:".25rem" }}>
                        <span style={{ fontSize:".78rem", color:"#6B7280" }}>{p.label} × {p.count}</span>
                        <span style={{ fontSize:".78rem", fontWeight:700, color:"var(--c-text)" }}>{contrib}€</span>
                      </div>
                      <div style={{ height:5, background:"var(--c-border)", borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:p.color, borderRadius:3, transition:"width .3s" }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* ── Bar chart exécutions par jour ── */}
        <div className="ac" style={{ marginBottom:"1.25rem" }}>
          <div className="ac-h">
            <p style={{ fontWeight:700, fontSize:".9rem" }}>Exécutions par jour — 30j</p>
            <div style={{ display:"flex", gap:"1rem" }}>
              <span style={{ fontSize:".72rem", display:"flex", alignItems:"center", gap:".35rem", color:"#059669", fontWeight:600 }}>
                <div style={{ width:10, height:10, background:"#059669", borderRadius:2 }}/> Succès
              </span>
              <span style={{ fontSize:".72rem", display:"flex", alignItems:"center", gap:".35rem", color:"#DC2626", fontWeight:600 }}>
                <div style={{ width:10, height:10, background:"#DC2626", borderRadius:2 }}/> Erreurs
              </span>
            </div>
          </div>
          <div style={{ padding:"1rem 1.25rem" }}>
            <svg viewBox="0 0 900 70" style={{ width:"100%", height:70, display:"block" }}>
              {execsData.map((total, i) => {
                const err   = errorsData[i];
                const ok    = total - err;
                const bw    = 900 / 30;
                const bx    = i * bw + 1;
                const scale = maxExecs > 0 ? 62 / maxExecs : 0;
                const hOk   = ok  * scale;
                const hErr  = err * scale;
                return (
                  <g key={i}>
                    <rect x={bx} y={70 - hOk - hErr} width={bw - 2} height={hOk} fill="#059669" rx="1.5"/>
                    <rect x={bx} y={70 - hErr}        width={bw - 2} height={hErr} fill="#DC2626" rx="1.5"/>
                  </g>
                );
              })}
              {xLabels.map((lbl, i) => (
                <text key={i} x={(i/4)*900} y={69} fontSize="9" fill="#9CA3AF" textAnchor="middle">{lbl}</text>
              ))}
            </svg>
          </div>
        </div>

        {/* ── Inbox Row: Bug Reports + Support ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", marginBottom:"1.25rem" }}>

          {/* Bug Reports */}
          <div className="ac">
            <div className="ac-h">
              <p style={{ fontWeight:700, fontSize:".9rem" }}>🐛 Bug Reports</p>
              <a href="/admin/bug-reports" style={{ fontSize:".75rem", fontWeight:600, color:"#6366F1", textDecoration:"none" }}>Voir tout →</a>
            </div>
            {bugReportsRes.rows.length === 0 ? (
              <div style={{ padding:"2rem", textAlign:"center", color:"#9CA3AF", fontSize:".85rem" }}>Aucun bug reporté</div>
            ) : (bugReportsRes.rows as { id: number; user_email: string; workflow_name: string; description: string; created_at: string }[]).map(r => (
              <div key={r.id} className="row-link">
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:".82rem", fontWeight:700, color:"var(--c-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.workflow_name}</p>
                  <p style={{ fontSize:".72rem", color:"#6B7280" }}>{r.user_email}</p>
                  {r.description && <p style={{ fontSize:".72rem", color:"#9CA3AF", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:".15rem" }}>{r.description}</p>}
                </div>
                <span style={{ fontSize:".7rem", color:"#9CA3AF", flexShrink:0, marginLeft:"1rem" }}>{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
            ))}
          </div>

          {/* Support Messages */}
          <div className="ac">
            <div className="ac-h">
              <p style={{ fontWeight:700, fontSize:".9rem" }}>💬 Support</p>
            </div>
            {supportRes.rows.length === 0 ? (
              <div style={{ padding:"2rem", textAlign:"center", color:"#9CA3AF", fontSize:".85rem" }}>Aucun message</div>
            ) : (supportRes.rows as { id: number; email: string; subject: string; message: string; created_at: string }[]).map(r => (
              <div key={r.id} className="row-link">
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:".82rem", fontWeight:700, color:"var(--c-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.subject}</p>
                  <p style={{ fontSize:".72rem", color:"#6B7280" }}>{r.email}</p>
                  <p style={{ fontSize:".72rem", color:"#9CA3AF", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:".15rem" }}>{r.message?.slice(0, 80)}</p>
                </div>
                <span style={{ fontSize:".7rem", color:"#9CA3AF", flexShrink:0, marginLeft:"1rem" }}>{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
            ))}
          </div>

        </div>

        {/* ── Users + Executions Row ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", marginBottom:"1.25rem" }}>

          {/* Recent Users */}
          <div className="ac">
            <div className="ac-h">
              <p style={{ fontWeight:700, fontSize:".9rem" }}>Dernières inscriptions</p>
              <a href="/admin/users" style={{ fontSize:".75rem", fontWeight:600, color:"#6366F1", textDecoration:"none" }}>Gérer →</a>
            </div>
            {(recentUsersRes.rows as { id: number; name: string; email: string; plan: string; created_at: string }[]).map(u => (
              <a key={u.id} href={`/admin/users/${u.id}`} className="row-link">
                <div style={{ display:"flex", alignItems:"center", gap:".75rem", minWidth:0 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:"var(--c-subtle)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:".85rem", fontWeight:700, color:"#6366F1" }}>
                    {(u.name || u.email).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:".82rem", fontWeight:700, color:"var(--c-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name || "—"}</p>
                    <p style={{ fontSize:".72rem", color:"#6B7280", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</p>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:".6rem", flexShrink:0 }}>
                  <span className="tag" style={{
                    background: u.plan==="business" ? "#ECFDF5" : u.plan==="pro" ? "#EFF9FF" : u.plan==="starter" ? "#EEF2FF" : "#F3F4F6",
                    color:      u.plan==="business" ? "#059669" : u.plan==="pro" ? "#0284C7" : u.plan==="starter" ? "#4F46E5" : "#6B7280",
                    border:     `1px solid ${u.plan==="business" ? "#A7F3D0" : u.plan==="pro" ? "#BAE6FD" : u.plan==="starter" ? "#C7D2FE" : "#E5E7EB"}`,
                  }}>{u.plan}</span>
                  <span style={{ fontSize:".7rem", color:"#9CA3AF" }}>{new Date(u.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
              </a>
            ))}
          </div>

          {/* Recent Executions */}
          <div className="ac">
            <div className="ac-h">
              <p style={{ fontWeight:700, fontSize:".9rem" }}>Exécutions récentes</p>
              <a href="/admin/executions" style={{ fontSize:".75rem", fontWeight:600, color:"#6366F1", textDecoration:"none" }}>Voir tout →</a>
            </div>
            {(recentExecsRes.rows as { id: number; status: string; created_at: string; wf_name: string; user_email: string }[]).map(e => (
              <div key={e.id} className="row-link">
                <div style={{ display:"flex", alignItems:"center", gap:".75rem", minWidth:0 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0, background: e.status==="success" ? "#059669" : e.status==="error" ? "#DC2626" : "#9CA3AF" }}/>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:".82rem", fontWeight:600, color:"var(--c-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.wf_name || "workflow"}</p>
                    <p style={{ fontSize:".7rem", color:"#6B7280" }}>{e.user_email}</p>
                  </div>
                </div>
                <span style={{ fontSize:".7rem", color:"#9CA3AF", flexShrink:0, marginLeft:"1rem" }}>{new Date(e.created_at).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })}</span>
              </div>
            ))}
          </div>

        </div>

        {/* ── Login Audit ── */}
        {loginAuditRes.rows.length > 0 && (
          <div className="ac" style={{ marginBottom:"1.25rem" }}>
            <div className="ac-h">
              <p style={{ fontWeight:700, fontSize:".9rem" }}>🔐 Audit de connexion</p>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".8rem" }}>
                <thead>
                  <tr style={{ background:"var(--c-hover)" }}>
                    {["Email","IP","Statut","Raison","Date"].map(h => (
                      <th key={h} style={{ padding:".6rem 1rem", textAlign:"left", fontWeight:600, color:"#6B7280", fontSize:".72rem", textTransform:"uppercase", letterSpacing:".05em", borderBottom:"1px solid var(--c-border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(loginAuditRes.rows as { id: number; email: string; ip: string; success: boolean; reason: string; created_at: string }[]).map((r, i) => (
                    <tr key={r.id} style={{ borderBottom:"1px solid var(--c-border)", background: i % 2 === 0 ? "transparent" : "var(--c-hover)" }}>
                      <td style={{ padding:".65rem 1rem", color:"var(--c-text)" }}>{r.email}</td>
                      <td style={{ padding:".65rem 1rem", color:"#6B7280", fontFamily:"monospace", fontSize:".75rem" }}>{r.ip}</td>
                      <td style={{ padding:".65rem 1rem" }}>
                        <span className="tag" style={{ background: r.success ? "#ECFDF5" : "#FEF2F2", color: r.success ? "#059669" : "#DC2626", border: `1px solid ${r.success ? "#A7F3D0" : "#FECACA"}` }}>
                          {r.success ? "OK" : "Échec"}
                        </span>
                      </td>
                      <td style={{ padding:".65rem 1rem", color:"#9CA3AF" }}>{r.reason || "—"}</td>
                      <td style={{ padding:".65rem 1rem", color:"#9CA3AF" }}>{new Date(r.created_at).toLocaleString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Announce + Quick Links ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem" }}>
          <div className="ac">
            <div className="ac-h"><p style={{ fontWeight:700, fontSize:".9rem" }}>📣 Annonce</p></div>
            <div className="ac-b"><AdminAnnounce /></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".75rem" }}>
            {[
              { href:"/admin/users",      icon:"👥", label:"Utilisateurs",   desc:"Gérer, bannir, plans" },
              { href:"/admin/executions", icon:"⚡", label:"Exécutions",      desc:"Tous les runs" },
              { href:"/admin/bug-reports",icon:"🐛", label:"Bug Reports",     desc:"Signalements users" },
              { href:"/admin/demo",       icon:"🎬", label:"Demo",            desc:"Animation TikTok/YT", span:2 },
            ].map(l => (
              <a key={l.href} href={l.href} className="ac" style={{ padding:"1rem 1.25rem", textDecoration:"none", gridColumn: l.span ? `span ${l.span}` : undefined, display:"flex", alignItems:"center", gap:".75rem" }}>
                <span style={{ fontSize:"1.25rem" }}>{l.icon}</span>
                <div>
                  <p style={{ fontWeight:700, fontSize:".85rem", color:"var(--c-text)" }}>{l.label}</p>
                  <p style={{ fontSize:".72rem", color:"#9CA3AF" }}>{l.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

      </main>
    </>
  );
}
