import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { checkAdminCookie } from "@/lib/adminAuth";

export default async function AdminUsersPage() {
  const session = await getServerSession();

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const verified = await checkAdminCookie();
  if (!verified) redirect("/admin/login");

  const users = await pool.query(
    "SELECT id, name, email, plan, banned, created_at FROM users ORDER BY created_at DESC"
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
      `}</style>

      <nav className="glass-nav" style={{ padding:"1rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1.5rem" }}>
          <div style={{ fontWeight:800, fontSize:"1.1rem", color:"#fff", letterSpacing:"-0.03em" }}>
            Loop<span style={{ color:"#818CF8" }}>flo</span>
            <span style={{ marginLeft:".5rem", fontSize:".65rem", fontWeight:700, color:"#818CF8", background:"rgba(129,140,248,0.15)", border:"1px solid rgba(129,140,248,0.3)", padding:".2rem .6rem", borderRadius:"100px", letterSpacing:".08em", textTransform:"uppercase" }}>Admin</span>
          </div>
          <div style={{ display:"flex", gap:".25rem" }}>
            {[
              { label:"Dashboard", href:"/admin" },
              { label:"Utilisateurs", href:"/admin/users" },
              { label:"Waitlist", href:"/admin/waitlist" },
            ].map((item) => (
              <a key={item.label} href={item.href} style={{ fontSize:".82rem", color:"rgba(255,255,255,0.6)", padding:".4rem .75rem", borderRadius:"8px", fontWeight:500 }}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
        <a href="/api/auth/signout" style={{ fontSize:".78rem", color:"rgba(255,255,255,0.6)", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", padding:".35rem .8rem", borderRadius:"8px" }}>
          Déconnexion
        </a>
      </nav>

      <main style={{ maxWidth:"1200px", margin:"0 auto", padding:"3rem 2rem" }}>

        <div style={{ marginBottom:"2rem" }}>
          <a href="/admin" style={{ fontSize:".82rem", color:"#6B7280", marginBottom:".5rem", display:"block" }}>← Retour</a>
          <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em" }}>Utilisateurs</h1>
          <p style={{ fontSize:".9rem", color:"#6B7280", marginTop:".3rem" }}>
            {users.rows.length} utilisateur{users.rows.length > 1 ? "s" : ""} au total
          </p>
        </div>

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