import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import AdminNav from "@/components/AdminNav";

async function changePlan(id: string, formData: FormData) {
  "use server";
  const session = await getServerSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) redirect("/dashboard");

  const plan = formData.get("plan") as string;
  const validPlans = ["free", "starter", "pro", "business"];
  if (!validPlans.includes(plan)) return;

  await pool.query("UPDATE users SET plan = $1 WHERE id = $2", [plan, id]);
  redirect(`/admin/users/${id}`);
}

async function toggleBan(id: string, banned: boolean) {
  "use server";
  const session = await getServerSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) redirect("/dashboard");

  await pool.query("UPDATE users SET banned = $1 WHERE id = $2", [!banned, id]);
  redirect(`/admin/users/${id}`);
}

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession();

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  if (result.rows.length === 0) redirect("/admin/users");

  const user = result.rows[0];

  const workflows = await pool.query(
    "SELECT id, name, active, created_at FROM workflows WHERE user_id = $1 ORDER BY created_at DESC",
    [id]
  );

  const planOptions = [
    { key: "free", label: "Free", price: "0€", color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB" },
    { key: "starter", label: "Starter", price: "7€/mois", color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
    { key: "pro", label: "Pro", price: "19€/mois", color: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD" },
    { key: "business", label: "Business", price: "49€/mois", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; }
        .plan-btn:hover { opacity:.85; transform:translateY(-1px); }
        .plan-btn { transition: all .15s; }
      `}</style>

      <AdminNav />

      <main style={{ maxWidth:"900px", margin:"0 auto", padding:"3rem 2rem" }}>

        <div style={{ marginBottom:"2rem" }}>
          <a href="/admin/users" style={{ fontSize:".82rem", color:"#6B7280", marginBottom:".5rem", display:"block", textDecoration:"none" }}>← Retour aux utilisateurs</a>
          <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em" }}>{user.name || "Utilisateur sans nom"}</h1>
          <p style={{ fontSize:".9rem", color:"#6B7280", marginTop:".3rem" }}>{user.email}</p>
        </div>

        {/* Infos + Statut */}
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
                <span style={{ fontSize:".75rem", fontWeight:700, textTransform:"uppercase", padding:".25rem .75rem", borderRadius:"100px", background: user.plan === "pro" ? "#EEF2FF" : user.plan === "starter" ? "#ECFDF5" : user.plan === "business" ? "#FFF7ED" : "#F3F4F6", color: user.plan === "pro" ? "#4F46E5" : user.plan === "starter" ? "#059669" : user.plan === "business" ? "#D97706" : "#6B7280" }}>
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

        {/* UPGRADE PLAN */}
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"12px", padding:"1.5rem", marginBottom:"2rem" }}>
          <p style={{ fontSize:".75rem", color:"#9CA3AF", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:"1.25rem" }}>Changer le plan</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:".75rem" }}>
            {planOptions.map((plan) => (
              <form key={plan.key} action={changePlan.bind(null, id)}>
                <input type="hidden" name="plan" value={plan.key} />
                <button
                  type="submit"
                  className="plan-btn"
                  disabled={user.plan === plan.key}
                  style={{
                    width:"100%",
                    fontFamily:"inherit",
                    cursor: user.plan === plan.key ? "default" : "pointer",
                    fontWeight:700,
                    borderRadius:10,
                    padding:".75rem .5rem",
                    fontSize:".8rem",
                    border:`2px solid ${user.plan === plan.key ? plan.color : plan.border}`,
                    background: user.plan === plan.key ? plan.bg : "#fff",
                    color: user.plan === plan.key ? plan.color : "#6B7280",
                    display:"flex",
                    flexDirection:"column",
                    alignItems:"center",
                    gap:".25rem",
                  }}
                >
                  {user.plan === plan.key && (
                    <span style={{ fontSize:".65rem", fontWeight:700, background:plan.color, color:"#fff", padding:".1rem .5rem", borderRadius:"100px", marginBottom:".25rem" }}>ACTUEL</span>
                  )}
                  <span>{plan.label}</span>
                  <span style={{ fontSize:".72rem", fontWeight:500, color: user.plan === plan.key ? plan.color : "#9CA3AF" }}>{plan.price}</span>
                </button>
              </form>
            ))}
          </div>
        </div>

        {/* BAN / UNBAN */}
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"12px", padding:"1.5rem", marginBottom:"2rem" }}>
          <p style={{ fontSize:".75rem", color:"#9CA3AF", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:"1.25rem" }}>Actions</p>
          <form action={toggleBan.bind(null, id, user.banned)}>
            <button type="submit" style={{ fontFamily:"inherit", cursor:"pointer", fontWeight:600, borderRadius:8, padding:".6rem 1.25rem", fontSize:".85rem", border:"none", background: user.banned ? "#ECFDF5" : "#FEF2F2", color: user.banned ? "#059669" : "#DC2626" }}>
              {user.banned ? "Débannir cet utilisateur" : "Bannir cet utilisateur"}
            </button>
          </form>
        </div>

        {/* WORKFLOWS */}
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