import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { checkAdminCookie } from "@/lib/adminAuth";
import AdminNav from "@/components/AdminNav";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getServerSession();

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const verified = await checkAdminCookie();
  if (!verified) redirect("/admin/login");

  const { q } = await searchParams;
  const search = q?.trim() || "";

  const users = search
    ? await pool.query(
        "SELECT id, name, email, plan, banned, created_at FROM users WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY created_at DESC",
        [`%${search}%`]
      )
    : await pool.query(
        "SELECT id, name, email, plan, banned, created_at FROM users ORDER BY created_at DESC"
      );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
        .search-input { flex:1; padding:.65rem 1rem; border:1.5px solid #E5E7EB; border-radius:10px; font-size:.875rem; font-family:inherit; outline:none; color:#0A0A0A; }
        .search-input:focus { border-color:#4F46E5; box-shadow:0 0 0 3px #EEF2FF; }
      `}</style>

      <AdminNav />

      <main style={{ maxWidth:"1200px", margin:"0 auto", padding:"3rem 2rem" }}>

        <div style={{ marginBottom:"2rem" }}>
          <a href="/admin" style={{ fontSize:".82rem", color:"#6B7280", marginBottom:".5rem", display:"block" }}>← Retour</a>
          <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em" }}>Utilisateurs</h1>
          <p style={{ fontSize:".9rem", color:"#6B7280", marginTop:".3rem" }}>
            {users.rows.length} utilisateur{users.rows.length > 1 ? "s" : ""}{search ? ` pour "${search}"` : " au total"}
          </p>
        </div>

        {/* Recherche */}
        <form method="GET" style={{ display:"flex", gap:".75rem", marginBottom:"1.5rem" }}>
          <input
            name="q"
            defaultValue={search}
            className="search-input"
            placeholder="Rechercher par nom ou email..."
            autoComplete="off"
          />
          <button type="submit" style={{ padding:".65rem 1.25rem", borderRadius:10, fontSize:".875rem", fontWeight:700, background:"#4F46E5", color:"#fff", border:"none", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
            Rechercher
          </button>
          {search && (
            <a href="/admin/users" style={{ padding:".65rem 1rem", borderRadius:10, fontSize:".875rem", fontWeight:600, background:"#F3F4F6", color:"#6B7280", border:"1px solid #E5E7EB", textDecoration:"none", display:"flex", alignItems:"center" }}>
              Effacer
            </a>
          )}
        </form>

        <div className="glass-card" style={{ borderRadius:"14px", overflow:"hidden" }}>
          {/* Header */}
          <div style={{ padding:"1rem 1.5rem", borderBottom:"1px solid #F3F4F6", display:"grid", gridTemplateColumns:"2fr 2fr 1fr 1fr 1fr", gap:"1rem", alignItems:"center" }}>
            {["Nom", "Email", "Plan", "Statut", "Actions"].map((h) => (
              <span key={h} style={{ fontSize:".75rem", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".06em" }}>{h}</span>
            ))}
          </div>

          {users.rows.length === 0 ? (
            <div style={{ padding:"3rem", textAlign:"center", color:"#9CA3AF" }}>Aucun utilisateur.</div>
          ) : (
            users.rows.map((user: { id: number; name: string; email: string; plan: string; banned: boolean; created_at: string }) => (
              <div key={user.id} className="user-row" style={{ padding:"1rem 1.5rem", borderBottom:"1px solid #F9FAFB", display:"grid", gridTemplateColumns:"2fr 2fr 1fr 1fr 1fr", gap:"1rem", alignItems:"center" }}>

                {/* Nom */}
                <div>
                  <p style={{ fontSize:".875rem", fontWeight:600, color:"#0A0A0A" }}>{user.name || "—"}</p>
                  <p style={{ fontSize:".75rem", color:"#9CA3AF" }}>#{user.id}</p>
                </div>

                {/* Email */}
                <span style={{ fontSize:".85rem", color:"#374151" }}>{user.email}</span>

                {/* Plan */}
                <span style={{
                  fontSize:".72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em",
                  padding:".25rem .7rem", borderRadius:"100px", display:"inline-block",
                  background: user.plan === "pro" ? "#EEF2FF" : user.plan === "starter" ? "#ECFDF5" : "#F3F4F6",
                  color: user.plan === "pro" ? "#4F46E5" : user.plan === "starter" ? "#059669" : "#6B7280",
                }}>
                  {user.plan}
                </span>

                {/* Statut */}
                <span style={{
                  fontSize:".72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em",
                  padding:".25rem .7rem", borderRadius:"100px", display:"inline-block",
                  background: user.banned ? "#FEF2F2" : "#ECFDF5",
                  color: user.banned ? "#DC2626" : "#059669",
                }}>
                  {user.banned ? "Banni" : "Actif"}
                </span>

                {/* Actions */}
                <div style={{ display:"flex", gap:".5rem" }}>
                  <a href={`/admin/users/${user.id}`} style={{ fontSize:".75rem", fontWeight:600, color:"#4F46E5", background:"#EEF2FF", border:"1px solid #C7D2FE", padding:".3rem .7rem", borderRadius:"6px" }}>
                    Gérer
                  </a>
                </div>

              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}