export const dynamic = "force-dynamic";

import Link from "next/link";
import pool from "@/lib/db";
import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { getRecentBugCount } from "@/lib/adminStats";

const PAGE_SIZE = 40;

function planBadgeClass(plan: string) {
  if (plan === "business") return "badge badge-ok";
  if (plan === "pro") return "badge badge-info";
  if (plan === "starter") return "badge badge-accent";
  return "badge badge-neutral";
}

type UserRow = {
  id: number;
  name: string | null;
  email: string;
  plan: string;
  banned: boolean;
  created_at: string;
  workflow_count: number;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; status?: string; page?: string }>;
}) {
  const adminEmail = await requireAdmin();
  const bugCount = await getRecentBugCount();

  const sp = await searchParams;
  const search = sp.q?.trim() || "";
  const plan = sp.plan && ["free", "starter", "pro", "business"].includes(sp.plan) ? sp.plan : "";
  const status = sp.status === "banned" || sp.status === "active" ? sp.status : "";
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  // ── Filtres SQL (toujours paramétrés) ──────────────────────────────────────
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (search) {
    conditions.push(`(u.name ILIKE $${i} OR u.email ILIKE $${i})`);
    values.push(`%${search}%`);
    i++;
  }
  if (plan) {
    conditions.push(`u.plan = $${i++}`);
    values.push(plan);
  }
  if (status) {
    conditions.push(status === "banned" ? "u.banned = true" : "u.banned = false");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [usersRes, countRes] = await Promise.all([
    pool.query(
      `SELECT u.id, u.name, u.email, u.plan, u.banned, u.created_at,
              (SELECT COUNT(*) FROM workflows w WHERE w.user_id = u.id)::int AS workflow_count
       FROM users u
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, PAGE_SIZE, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS n FROM users u ${where}`, values),
  ]);

  const users = usersRes.rows as UserRow[];
  const total = countRes.rows[0]?.n ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Conserve les filtres actifs dans les liens de pagination
  const pageHref = (p: number) => {
    const qs = new URLSearchParams();
    if (search) qs.set("q", search);
    if (plan) qs.set("plan", plan);
    if (status) qs.set("status", status);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/admin/users?${s}` : "/admin/users";
  };

  const hasFilters = Boolean(search || plan || status);

  return (
    <AdminShell
      email={adminEmail}
      bugCount={bugCount}
      title="Utilisateurs"
      subtitle={`${total.toLocaleString("fr-FR")} compte${total > 1 ? "s" : ""}${hasFilters ? " correspondant aux filtres" : " au total"}`}
      actions={<Link href="/admin" className="btn">Dashboard</Link>}
    >
      {/* ── Filtres ── */}
      <form method="GET" className="toolbar">
        <input
          name="q"
          defaultValue={search}
          className="field"
          placeholder="Rechercher un nom ou un email…"
          autoComplete="off"
          style={{ flex: 1, minWidth: 220 }}
        />
        <select name="plan" defaultValue={plan} className="field">
          <option value="">Tous les plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
        </select>
        <select name="status" defaultValue={status} className="field">
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="banned">Bannis</option>
        </select>
        <button type="submit" className="btn btn-primary">Filtrer</button>
        {hasFilters && <Link href="/admin/users" className="btn">Réinitialiser</Link>}
      </form>

      {/* ── Tableau ── */}
      <div className="card mb">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Statut</th>
                <th style={{ textAlign: "center" }}>Workflows</th>
                <th>Inscrit le</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <p className="empty-title">Aucun utilisateur</p>
                      <p className="empty-sub">
                        {hasFilters ? "Aucun compte ne correspond à ces filtres." : "Personne ne s'est encore inscrit."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                      <span className="avatar">{(u.name || u.email).charAt(0).toUpperCase()}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: "var(--a-text)" }}>{u.name || "Sans nom"}</p>
                        <p style={{ fontSize: ".72rem", color: "var(--a-text-3)" }}>#{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><span className={planBadgeClass(u.plan)}>{u.plan}</span></td>
                  <td>
                    <span className={`badge ${u.banned ? "badge-err" : "badge-ok"}`}>
                      {u.banned ? "Banni" : "Actif"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>{u.workflow_count}</td>
                  <td>{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                  <td style={{ textAlign: "right" }}>
                    <Link href={`/admin/users/${u.id}`} className="btn btn-sm">Gérer</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
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
