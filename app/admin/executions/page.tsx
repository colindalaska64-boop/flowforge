export const dynamic = "force-dynamic";

import Link from "next/link";
import pool from "@/lib/db";
import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { getRecentBugCount } from "@/lib/adminStats";

const PAGE_SIZE = 50;

function planBadgeClass(plan: string) {
  if (plan === "business") return "badge badge-ok";
  if (plan === "pro") return "badge badge-info";
  if (plan === "starter") return "badge badge-accent";
  return "badge badge-neutral";
}

type ExecRow = {
  id: number; status: string; created_at: string;
  wf_name: string; wf_id: number;
  user_email: string; user_plan: string; steps: number;
};

export default async function AdminExecutionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; user?: string }>;
}) {
  const adminEmail = await requireAdmin();
  const bugCount = await getRecentBugCount();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const status = params.status === "success" || params.status === "error" ? params.status : "all";
  const user = (params.user || "").trim();
  const offset = (page - 1) * PAGE_SIZE;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (status !== "all") {
    conditions.push(`e.status = $${idx++}`);
    values.push(status);
  }
  if (user) {
    conditions.push(`u.email ILIKE $${idx++}`);
    values.push(`%${user}%`);
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
      [...values, PAGE_SIZE, offset]
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

  const total = Number(countRes.rows[0].count);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const stats = statsRes.rows[0];
  const successRate = Number(stats.total) > 0
    ? ((Number(stats.success) / Number(stats.total)) * 100).toFixed(1)
    : "100.0";

  // Encodage correct des filtres dans les liens de pagination
  const pageHref = (p: number) => {
    const qs = new URLSearchParams();
    if (status !== "all") qs.set("status", status);
    if (user) qs.set("user", user);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/admin/executions?${s}` : "/admin/executions";
  };

  const hasFilters = status !== "all" || Boolean(user);

  return (
    <AdminShell
      email={adminEmail}
      bugCount={bugCount}
      title="Exécutions"
      subtitle={`${total.toLocaleString("fr-FR")} exécution${total > 1 ? "s" : ""}${hasFilters ? " correspondant aux filtres" : ""}`}
      actions={<Link href="/admin" className="btn">Dashboard</Link>}
    >
      <div className="kpi-grid">
        <div className="kpi">
          <p className="kpi-label">Total</p>
          <p className="kpi-value" style={{ color: "var(--a-accent)" }}>{Number(stats.total).toLocaleString("fr-FR")}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Succès</p>
          <p className="kpi-value" style={{ color: "var(--a-ok)" }}>{Number(stats.success).toLocaleString("fr-FR")}</p>
          <p className="kpi-meta up">{successRate} % de réussite</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Erreurs</p>
          <p className="kpi-value" style={{ color: "var(--a-err)" }}>{Number(stats.errors).toLocaleString("fr-FR")}</p>
        </div>
      </div>

      <form method="GET" className="toolbar">
        <input
          name="user"
          defaultValue={user}
          className="field"
          placeholder="Filtrer par email…"
          autoComplete="off"
          style={{ width: 260 }}
        />
        <select name="status" defaultValue={status} className="field">
          <option value="all">Tous les statuts</option>
          <option value="success">Succès</option>
          <option value="error">Erreurs</option>
        </select>
        <button type="submit" className="btn btn-primary">Filtrer</button>
        {hasFilters && <Link href="/admin/executions" className="btn">Réinitialiser</Link>}
      </form>

      <div className="card mb">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>ID</th>
                <th>Workflow</th>
                <th>Utilisateur</th>
                <th>Plan</th>
                <th>Statut</th>
                <th style={{ textAlign: "center" }}>Étapes</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {execsRes.rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <p className="empty-title">Aucune exécution</p>
                      <p className="empty-sub">
                        {hasFilters ? "Aucun run ne correspond à ces filtres." : "Aucun workflow n'a encore tourné."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : execsRes.rows.map((e: ExecRow) => (
                <tr key={e.id}>
                  <td className="mono">#{e.id}</td>
                  <td className="strong">{e.wf_name || "Workflow supprimé"}</td>
                  <td>{e.user_email || "—"}</td>
                  <td><span className={planBadgeClass(e.user_plan)}>{e.user_plan || "—"}</span></td>
                  <td>
                    <span className={`badge ${e.status === "success" ? "badge-ok" : e.status === "error" ? "badge-err" : "badge-neutral"}`}>
                      {e.status === "success" ? "Succès" : e.status === "error" ? "Erreur" : e.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>{e.steps ?? "—"}</td>
                  <td>{new Date(e.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {page > 1 && <Link href={pageHref(page - 1)} className="btn btn-sm">Précédent</Link>}
          <span>Page {page} sur {totalPages}</span>
          {page < totalPages && <Link href={pageHref(page + 1)} className="btn btn-sm">Suivant</Link>}
        </div>
      )}
    </AdminShell>
  );
}
