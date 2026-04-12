export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { checkAdminCookie } from "@/lib/adminAuth";
import AdminNav from "@/components/AdminNav";

export default async function AdminExecutionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; user?: string }>;
}) {
  const session = await getServerSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) redirect("/dashboard");
  const verified = await checkAdminCookie();
  if (!verified) redirect("/admin/login");

  const params = await searchParams;
  const page   = Math.max(1, parseInt(params.page || "1"));
  const status = params.status || "all";
  const user   = params.user   || "";
  const limit  = 50;
  const offset = (page - 1) * limit;

  // Build WHERE clause
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (status !== "all") {
    conditions.push(`e.status = $${idx++}`);
    values.push(status);
  }
  if (user.trim()) {
    conditions.push(`u.email ILIKE $${idx++}`);
    values.push(`%${user.trim()}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [execsRes, countRes, statsRes] = await Promise.all([
    pool.query(
      `SELECT e.id, e.status, e.created_at,
        w.name as wf_name, w.id as wf_id,
        u.email as user_email, u.plan as user_plan,
        jsonb_array_length(CASE WHEN e.results IS NOT NULL AND jsonb_typeof(e.results) = 'array' THEN e.results ELSE '[]'::jsonb END) as steps
      FROM executions e
      LEFT JOIN workflows w ON e.workflow_id = w.id
      LEFT JOIN users u ON w.user_id = u.id
      ${where}
      ORDER BY e.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM executions e
      LEFT JOIN workflows w ON e.workflow_id = w.id
      LEFT JOIN users u ON w.user_id = u.id
      ${where}`,
      values
    ),
    pool.query(
      `SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE e.status='success') as success,
        COUNT(*) FILTER (WHERE e.status='error') as errors
      FROM executions e
      LEFT JOIN workflows w ON e.workflow_id = w.id
      LEFT JOIN users u ON w.user_id = u.id
      ${where}`,
      values
    ),
  ]);

  const total     = Number(countRes.rows[0].count);
  const totalPages = Math.ceil(total / limit);
  const stats     = statsRes.rows[0];

  type ExecRow = {
    id: number; status: string; created_at: string;
    wf_name: string; wf_id: number;
    user_email: string; user_plan: string; steps: number;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--c-bg)}
        .tag{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:.2rem .6rem;border-radius:100px}
        tr:hover td{background:var(--c-hover)}
      `}</style>

      <AdminNav email={session.user?.email ?? ""} />

      <main style={{ maxWidth:1240, margin:"0 auto", padding:"2rem 1.5rem" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.75rem" }}>
          <div>
            <h1 style={{ fontSize:"1.5rem", fontWeight:800, letterSpacing:"-.03em", marginBottom:".3rem" }}>Exécutions</h1>
            <p style={{ fontSize:".82rem", color:"#6B7280" }}>{total.toLocaleString()} exécutions trouvées</p>
          </div>
          <a href="/admin" style={{ textDecoration:"none", padding:".5rem 1rem", borderRadius:8, fontSize:".82rem", fontWeight:600, background:"var(--c-hover)", border:"1px solid var(--c-border)", color:"var(--c-text)" }}>
            ← Dashboard
          </a>
        </div>

        {/* Stats Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
          {[
            { label:"Total",   value: Number(stats.total),   color:"#6366F1", bg:"#EEF2FF", border:"#C7D2FE" },
            { label:"Succès",  value: Number(stats.success), color:"#059669", bg:"#ECFDF5", border:"#A7F3D0" },
            { label:"Erreurs", value: Number(stats.errors),  color:"#DC2626", bg:"#FEF2F2", border:"#FECACA" },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:"1.25rem 1.5rem" }}>
              <p style={{ fontSize:".72rem", fontWeight:700, color:s.color, textTransform:"uppercase", letterSpacing:".06em", marginBottom:".4rem" }}>{s.label}</p>
              <p style={{ fontSize:"2rem", fontWeight:800, color:s.color }}>{Number(s.value).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <form method="GET" style={{ display:"flex", gap:".75rem", marginBottom:"1.25rem", alignItems:"center", flexWrap:"wrap" }}>
          <input
            name="user"
            defaultValue={user}
            placeholder="Filtrer par email…"
            style={{ padding:".55rem .9rem", borderRadius:8, border:"1px solid var(--c-border)", fontSize:".85rem", background:"var(--c-card)", color:"var(--c-text)", width:240, fontFamily:"inherit", outline:"none" }}
          />
          <select name="status" defaultValue={status} style={{ padding:".55rem .9rem", borderRadius:8, border:"1px solid var(--c-border)", fontSize:".85rem", background:"var(--c-card)", color:"var(--c-text)", fontFamily:"inherit", cursor:"pointer" }}>
            <option value="all">Tous les statuts</option>
            <option value="success">Succès</option>
            <option value="error">Erreurs</option>
          </select>
          <button type="submit" style={{ padding:".55rem 1.25rem", borderRadius:8, fontSize:".85rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
            Filtrer
          </button>
          {(status !== "all" || user) && (
            <a href="/admin/executions" style={{ fontSize:".82rem", color:"#6B7280", textDecoration:"none" }}>
              × Réinitialiser
            </a>
          )}
        </form>

        {/* Table */}
        <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:14, overflow:"hidden", marginBottom:"1.25rem" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".82rem" }}>
              <thead>
                <tr style={{ background:"var(--c-hover)", borderBottom:"1px solid var(--c-border)" }}>
                  {["ID","Workflow","Utilisateur","Plan","Statut","Étapes","Date"].map(h => (
                    <th key={h} style={{ padding:".7rem 1rem", textAlign:"left", fontWeight:600, color:"#6B7280", fontSize:".72rem", textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {execsRes.rows.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding:"3rem", textAlign:"center", color:"#9CA3AF" }}>Aucune exécution trouvée</td></tr>
                ) : execsRes.rows.map((e: ExecRow) => (
                  <tr key={e.id} style={{ borderBottom:"1px solid var(--c-border)" }}>
                    <td style={{ padding:".65rem 1rem", color:"#9CA3AF", fontFamily:"monospace", fontSize:".75rem" }}>#{e.id}</td>
                    <td style={{ padding:".65rem 1rem" }}>
                      <p style={{ fontWeight:600, color:"var(--c-text)", whiteSpace:"nowrap" }}>{e.wf_name || "—"}</p>
                    </td>
                    <td style={{ padding:".65rem 1rem", color:"#6B7280", whiteSpace:"nowrap" }}>{e.user_email || "—"}</td>
                    <td style={{ padding:".65rem 1rem" }}>
                      <span className="tag" style={{
                        background: e.user_plan==="business" ? "#ECFDF5" : e.user_plan==="pro" ? "#EFF9FF" : e.user_plan==="starter" ? "#EEF2FF" : "#F3F4F6",
                        color:      e.user_plan==="business" ? "#059669" : e.user_plan==="pro" ? "#0284C7" : e.user_plan==="starter" ? "#4F46E5" : "#6B7280",
                        border:     `1px solid ${e.user_plan==="business" ? "#A7F3D0" : e.user_plan==="pro" ? "#BAE6FD" : e.user_plan==="starter" ? "#C7D2FE" : "#E5E7EB"}`,
                      }}>{e.user_plan || "—"}</span>
                    </td>
                    <td style={{ padding:".65rem 1rem" }}>
                      <span className="tag" style={{
                        background: e.status==="success" ? "#ECFDF5" : e.status==="error" ? "#FEF2F2" : "#F3F4F6",
                        color:      e.status==="success" ? "#059669" : e.status==="error" ? "#DC2626" : "#9CA3AF",
                        border:     `1px solid ${e.status==="success" ? "#A7F3D0" : e.status==="error" ? "#FECACA" : "#E5E7EB"}`,
                      }}>{e.status}</span>
                    </td>
                    <td style={{ padding:".65rem 1rem", color:"#6B7280", textAlign:"center" }}>{e.steps ?? "—"}</td>
                    <td style={{ padding:".65rem 1rem", color:"#9CA3AF", whiteSpace:"nowrap" }}>
                      {new Date(e.created_at).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:"flex", gap:".5rem", justifyContent:"center", alignItems:"center" }}>
            {page > 1 && (
              <a href={`/admin/executions?page=${page-1}&status=${status}&user=${user}`} style={{ textDecoration:"none", padding:".45rem .9rem", borderRadius:7, border:"1px solid var(--c-border)", fontSize:".82rem", fontWeight:600, color:"var(--c-text)", background:"var(--c-card)" }}>
                ← Préc.
              </a>
            )}
            <span style={{ fontSize:".82rem", color:"#6B7280", padding:"0 .5rem" }}>
              Page {page} / {totalPages}
            </span>
            {page < totalPages && (
              <a href={`/admin/executions?page=${page+1}&status=${status}&user=${user}`} style={{ textDecoration:"none", padding:".45rem .9rem", borderRadius:7, border:"1px solid var(--c-border)", fontSize:".82rem", fontWeight:600, color:"var(--c-text)", background:"var(--c-card)" }}>
                Suiv. →
              </a>
            )}
          </div>
        )}

      </main>
    </>
  );
}
