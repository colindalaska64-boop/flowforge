import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";

export default async function AdminUserPage({ params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [params.id]
  );

  if (result.rows.length === 0) redirect("/admin/users");

  const user = result.rows[0];

  const workflows = await pool.query(
    "SELECT id, name, active, created_at FROM workflows WHERE user_id = $1 ORDER BY created_at DESC",
    [params.id]
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; }
        .action-btn { font-family:inherit; cursor:pointer; font-weight:600; border-radius:8px; padding:.6rem 1.25rem; font-size:.85rem; border:none; transition:opacity .15s; }
        .action-btn:hover { opacity:.85; }
      `}</style>

      <nav style={{ background:"#0A0A0A", padding:"1rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1.5rem" }}>
          <div style={{ fontWeight:800, fontSize:"1.1rem", color:"#fff", letterSpacing:"-0.03em" }}>
            Flow<span style={{ color:"#818CF8" }}>Forge</span>
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

      <main style={{ maxWidth:"900px", margin:"0 auto", padding:"3rem 2rem" }}>

        <div style={{ marginBottom:"2rem" }}>
          <a href="/admin/users" style={{ fontSize:".82rem", color:"#6B7280", marginBottom:".5rem", display:"block" }}>← Retour aux utilisateurs</a>
          <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em" }}>
            {user.name || "Utilisateur sans nom"}
          </h1>
          <p style={{ fontSize:".9rem", color:"#6B7280", marginTop:".3rem" }}>{user.email}</p>
        </div>

        {/* Infos utilisateur */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"2rem" }}>
          <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"12px", padding:"1.5rem" }}>
            <p style={{ fontSize:".75rem", color:"#9CA3AF", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:"1rem" }}>Informations</p>
            {[
              { label:"ID", value:`#${user.id}` },
              { label:"Nom", value: user.name || "—" },
              { label:"Email", value: user.email },
              { label:"Inscrit le", value: new Date(user.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" }) },
            ].map((item) => (
              <div key={item.label} style={{ display:"flex", justifyContent:"space-between", padding:".5rem 0", borderBottom:"1px solid #F9FAFB" }}>
                <span style={{ fontSize:".85rem", color:"#6B7280" }}>{item.label}</span>
                <span style={{ fontSize:".85rem", fontWeight:600, color:"#0A0A0A" }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"12px", padding:"1.5rem" }}>
            <p style={{ fontSize:".75rem", color:"#9CA3AF", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:"1rem" }}>Statut actuel</p>
            <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:".85rem", color:"#6B7280" }}>Plan</span>
                <span style={{ fontSize:".75rem", fontWeight:700, textTransform:"uppercase", padding:".25rem .75rem", borderRadius:"100px", background: user.plan === "pro" ? "#EEF2FF" : user.plan === "starter" ? "#ECFDF5" : "#F3F4F6", color: user.plan === "pro" ? "#4F46E5" : user.plan === "starter" ? "#059669" : "#6B7280" }}>
                  {user.plan}
                </span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:".85rem", color:"#6B7280" }}>Statut</span>
                <span style={{ fontSize:".75rem", fontWeight:700, textTransform:"uppercase", padding:".25rem .75rem", borderRadius:"100px", background: user.banned ? "#FEF2F2" : "#ECFDF5", color: user.banned ? "#DC2626" : "#059669" }}>
                  {user.banned ? "Banni" : "Actif"}
                </span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:".85rem", color:"#6B7280" }}>Workflows</span>
                <span style={{ fontSize:".85rem", fontWeight:600 }}>{workflows.rows.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"12px", padding:"1.5rem", marginBottom:"2rem" }}>
          <p style={{ fontSize:".75rem", color:"#9CA3AF", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:"1.25rem" }}>Actions</p>

          <div style={{ display:"flex", flexWrap:"wrap", gap:".75rem" }}>
            {/* Changer le plan */}
            {["free","starter","pro","business"].map((plan) => (
              <form key={plan} action={`/api/admin/users/${user.id}/plan`} method="POST">
                <input type="hidden" name="plan" value={plan} />
                <button
                  type="submit"
                  className="action-btn"
                  disabled={user.plan === plan}
                  style={{
                    background: user.plan === plan ? "#F3F4F6" : "#EEF2FF",
                    color: user.plan === plan ? "#9CA3AF" : "#4F46E5",
                    cursor: user.plan === plan ? "not-allowed" : "pointer",
                  }}
                >
                  {user.plan === plan ? `✓ ${plan}` : `→ ${plan}`}
                </button>
              </form>
            ))}

            {/* Ban / Unban */}
            <form action={`/api/admin/users/${user.id}/ban`} method="POST">
              <button type="submit" className="action-btn" style={{ background: user.banned ? "#ECFDF5" : "#FEF2F2", color: user.banned ? "#059669" : "#DC2626" }}>
                {user.banned ? "Débannir" : "Bannir"}
              </button>
            </form>
          </div>
        </div>

        {/* Workflows */}
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"12px", overflow:"hidden" }}>
          <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid #F3F4F6" }}>
            <h2 style={{ fontSize:"1rem", fontWeight:700 }}>Workflows ({workflows.rows.length})</h2>
          </div>
          {workflows.rows.length === 0 ? (
            <div style={{ padding:"2rem", textAlign:"center", color:"#9CA3AF", fontSize:".85rem" }}>Aucun workflow créé.</div>
          ) : (
            workflows.rows.map((wf: { id: number; name: string; active: boolean; created_at: string }) => (
              <div key={wf.id} style={{ padding:"1rem 1.5rem", borderBottom:"1px solid #F9FAFB", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <p style={{ fontSize:".875rem", fontWeight:600 }}>{wf.name}</p>
                  <p style={{ fontSize:".75rem", color:"#9CA3AF" }}>{new Date(wf.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                <span style={{ fontSize:".72rem", fontWeight:700, textTransform:"uppercase", padding:".25rem .7rem", borderRadius:"100px", background: wf.active ? "#ECFDF5" : "#F3F4F6", color: wf.active ? "#059669" : "#6B7280" }}>
                  {wf.active ? "Actif" : "Inactif"}
                </span>
              </div>
            ))
          )}
        </div>

      </main>
    </>
  );
}