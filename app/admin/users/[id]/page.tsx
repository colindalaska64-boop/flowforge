export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { getRecentBugCount } from "@/lib/adminStats";
import { DeleteUserButton, ApproveUnbanButton } from "@/components/AdminUserActions";

const VALID_PLANS = ["free", "starter", "pro", "business"];

async function changePlan(id: string, formData: FormData) {
  "use server";
  // Double facteur obligatoire : session admin + code OTP validé.
  await requireAdmin();

  const plan = formData.get("plan");
  if (typeof plan !== "string" || !VALID_PLANS.includes(plan)) return;

  await pool.query("UPDATE users SET plan = $1 WHERE id = $2", [plan, id]);
  redirect(`/admin/users/${id}`);
}

async function toggleBan(id: string, banned: boolean) {
  "use server";
  await requireAdmin();

  await pool.query("UPDATE users SET banned = $1 WHERE id = $2", [!banned, id]);
  redirect(`/admin/users/${id}`);
}

const PLAN_OPTIONS = [
  { key: "free", label: "Free", price: "0 €" },
  { key: "starter", label: "Starter", price: "7 €/mois" },
  { key: "pro", label: "Pro", price: "19 €/mois" },
  { key: "business", label: "Business", price: "49 €/mois" },
];

function planBadgeClass(plan: string) {
  if (plan === "business") return "badge badge-ok";
  if (plan === "pro") return "badge badge-info";
  if (plan === "starter") return "badge badge-accent";
  return "badge badge-neutral";
}

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const adminEmail = await requireAdmin();
  const { id } = await params;

  if (!/^\d+$/.test(id)) redirect("/admin/users");

  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  if (result.rows.length === 0) redirect("/admin/users");

  const user = result.rows[0];
  const bugCount = await getRecentBugCount();

  const [workflows, unbanReq, execStats] = await Promise.all([
    pool.query(
      "SELECT id, name, active, created_at FROM workflows WHERE user_id = $1 ORDER BY created_at DESC",
      [id]
    ),
    pool.query("SELECT message, created_at FROM unban_requests WHERE email = $1", [user.email])
      .catch(() => ({ rows: [] as { message: string; created_at: string }[] })),
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE e.status = 'error')::int AS errors,
              MAX(e.created_at) AS last_run
       FROM executions e
       JOIN workflows w ON e.workflow_id = w.id
       WHERE w.user_id = $1`,
      [id]
    ).catch(() => ({ rows: [{ total: 0, errors: 0, last_run: null }] })),
  ]);

  const stats = execStats.rows[0] as { total: number; errors: number; last_run: string | null };
  const activeWorkflows = workflows.rows.filter((w: { active: boolean }) => w.active).length;

  return (
    <AdminShell
      email={adminEmail}
      bugCount={bugCount}
      title={user.name || "Utilisateur sans nom"}
      subtitle={user.email}
      actions={
        <>
          <span className={planBadgeClass(user.plan)}>{user.plan}</span>
          <span className={`badge ${user.banned ? "badge-err" : "badge-ok"}`}>{user.banned ? "Banni" : "Actif"}</span>
          <Link href="/admin/users" className="btn">Retour</Link>
        </>
      }
    >
      {/* ── Chiffres clés ── */}
      <div className="kpi-grid">
        <div className="kpi">
          <p className="kpi-label">Workflows</p>
          <p className="kpi-value">{workflows.rows.length}</p>
          <p className="kpi-meta">{activeWorkflows} actif{activeWorkflows > 1 ? "s" : ""}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Exécutions</p>
          <p className="kpi-value" style={{ color: "var(--a-info)" }}>{stats.total.toLocaleString("fr-FR")}</p>
          <p className={`kpi-meta${stats.errors > 0 ? " down" : ""}`}>{stats.errors} en erreur</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Dernière activité</p>
          <p className="kpi-value" style={{ fontSize: "1.1rem" }}>
            {stats.last_run ? new Date(stats.last_run).toLocaleDateString("fr-FR") : "—"}
          </p>
          <p className="kpi-meta">
            {stats.last_run
              ? new Date(stats.last_run).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
              : "jamais exécuté"}
          </p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Inscrit le</p>
          <p className="kpi-value" style={{ fontSize: "1.1rem" }}>
            {new Date(user.created_at).toLocaleDateString("fr-FR")}
          </p>
          <p className="kpi-meta">compte #{user.id}</p>
        </div>
      </div>

      {/* ── Demande de réactivation ── */}
      {unbanReq.rows.length > 0 && (
        <div className="card mb">
          <div className="card-head">
            <p className="card-title">Demande de réactivation en attente</p>
            <span className="badge badge-warn">À traiter</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: ".88rem", lineHeight: 1.6, color: "var(--a-text-2)", marginBottom: ".5rem" }}>
              {unbanReq.rows[0].message || "Aucun message joint."}
            </p>
            <p style={{ fontSize: ".75rem", color: "var(--a-text-3)", marginBottom: "1rem" }}>
              Envoyée le {new Date(unbanReq.rows[0].created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <ApproveUnbanButton userId={parseInt(id, 10)} userEmail={user.email} />
          </div>
        </div>
      )}

      {/* ── Plan ── */}
      <div className="card mb">
        <div className="card-head"><p className="card-title">Changer le plan</p></div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: ".7rem" }}>
            {PLAN_OPTIONS.map(plan => {
              const current = user.plan === plan.key;
              return (
                <form key={plan.key} action={changePlan.bind(null, id)}>
                  <input type="hidden" name="plan" value={plan.key} />
                  <button
                    type="submit"
                    disabled={current}
                    className={`btn${current ? " btn-primary" : ""}`}
                    style={{ width: "100%", flexDirection: "column", gap: ".2rem", padding: ".7rem .5rem", opacity: 1 }}
                  >
                    <span style={{ fontWeight: 700 }}>{plan.label}</span>
                    <span style={{ fontSize: ".72rem", fontWeight: 500, opacity: 0.8 }}>
                      {current ? "Plan actuel" : plan.price}
                    </span>
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="card mb">
        <div className="card-head"><p className="card-title">Actions sur le compte</p></div>
        <div className="card-body">
          <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap" }}>
            <form action={toggleBan.bind(null, id, user.banned)}>
              <button type="submit" className={user.banned ? "btn btn-ok" : "btn btn-danger"}>
                {user.banned ? "Débannir ce compte" : "Bannir ce compte"}
              </button>
            </form>
            <DeleteUserButton userId={parseInt(id, 10)} userEmail={user.email} />
          </div>
          {user.banned && user.banned_at && (
            <p className="note note-warn" style={{ marginTop: "1rem" }}>
              Banni le {new Date(user.banned_at).toLocaleDateString("fr-FR")} — suppression automatique prévue le{" "}
              {new Date(new Date(user.banned_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR")}.
            </p>
          )}
        </div>
      </div>

      {/* ── Workflows ── */}
      <div className="card">
        <div className="card-head">
          <p className="card-title">Workflows</p>
          <span className="badge badge-neutral">{workflows.rows.length}</span>
        </div>
        {workflows.rows.length === 0 ? (
          <div className="empty">
            <p className="empty-title">Aucun workflow</p>
            <p className="empty-sub">Cet utilisateur n&apos;a rien créé pour l&apos;instant.</p>
          </div>
        ) : (
          workflows.rows.map((wf: { id: number; name: string; active: boolean; created_at: string }) => (
            <div key={wf.id} className="row">
              <div className="row-main">
                <span className={`dot ${wf.active ? "dot-ok" : "dot-idle"}`} />
                <div style={{ minWidth: 0 }}>
                  <p className="row-title">{wf.name || "Sans nom"}</p>
                  <p className="row-sub">#{wf.id} — créé le {new Date(wf.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
              <span className={`badge ${wf.active ? "badge-ok" : "badge-neutral"}`}>
                {wf.active ? "Actif" : "Inactif"}
              </span>
            </div>
          ))
        )}
      </div>
    </AdminShell>
  );
}
