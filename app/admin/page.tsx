export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import AdminAnnounce from "@/components/AdminAnnounce";
import { checkAdminCookie } from "@/lib/adminAuth";
import AdminNav from "@/components/AdminNav";

export default async function AdminPage() {
  const session = await getServerSession();

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const verified = await checkAdminCookie();
  if (!verified) redirect("/admin/login");

  const usersCount = await pool.query("SELECT COUNT(*) FROM users");
  const waitlistCount = await pool.query("SELECT COUNT(*) FROM waitlist");
  const plansCount = await pool.query(
    "SELECT plan, COUNT(*) as count FROM users GROUP BY plan"
  );
  const execStats = await pool.query(
    "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'success') as success, COUNT(*) FILTER (WHERE status = 'error') as errors FROM executions"
  );
  const workflowsCount = await pool.query("SELECT COUNT(*) FROM workflows");
  const recentUsers = await pool.query(
    "SELECT id, name, email, plan, created_at FROM users ORDER BY created_at DESC LIMIT 5"
  );
  const recentSupport = await pool.query(
    "SELECT * FROM support_messages ORDER BY created_at DESC LIMIT 10"
  ).catch(() => ({ rows: [] }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
      `}</style>

      <AdminNav email={session.user?.email ?? ""} />

      <main style={{ maxWidth:"1080px", margin:"0 auto", padding:"3rem 2rem" }}>
        <div style={{ marginBottom:"2.5rem" }}>
          <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".4rem" }}>Panel Admin</h1>
          <p style={{ fontSize:".9rem", color:"#6B7280" }}>Vue globale de Loopflo — accès restreint.</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1rem" }}>
          {[
            { label:"Utilisateurs total", value: usersCount.rows[0].count, color:"#4F46E5" },
            { label:"Emails waitlist", value: waitlistCount.rows[0].count, color:"#059669" },
            { label:"Workflows créés", value: workflowsCount.rows[0].count, color:"#D97706" },
          ].map((s,i) => (
            <div key={i} className="glass-card" style={{ borderRadius:"12px", padding:"1.5rem" }}>
              <p style={{ fontSize:".75rem", color:"#9CA3AF", marginBottom:".5rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>{s.label}</p>
              <p style={{ fontSize:"2.2rem", fontWeight:800, letterSpacing:"-0.03em", color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"2.5rem" }}>
          {[
            { label:"Exécutions total", value: execStats.rows[0].total, color:"#0891B2" },
            { label:"Succès", value: execStats.rows[0].success, color:"#059669" },
            { label:"Erreurs", value: execStats.rows[0].errors, color:"#DC2626" },
          ].map((s,i) => (
            <div key={i} className="glass-card" style={{ borderRadius:"12px", padding:"1.5rem" }}>
              <p style={{ fontSize:".75rem", color:"#9CA3AF", marginBottom:".5rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>{s.label}</p>
              <p style={{ fontSize:"2.2rem", fontWeight:800, letterSpacing:"-0.03em", color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ borderRadius:"14px", overflow:"hidden", marginBottom:"2rem" }}>
          <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid #F3F4F6" }}>
            <h2 style={{ fontSize:"1rem", fontWeight:700 }}>Répartition des plans</h2>
          </div>
          <div style={{ padding:"1.5rem", display:"flex", gap:"1rem", flexWrap:"wrap" }}>
            {plansCount.rows.map((p: { plan: string; count: string }) => (
              <div key={p.plan} className="glass-card" style={{ borderRadius:"10px", padding:"1rem 1.5rem", textAlign:"center", minWidth:"120px" }}>
                <p style={{ fontSize:".72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#9CA3AF", marginBottom:".4rem" }}>{p.plan}</p>
                <p style={{ fontSize:"1.6rem", fontWeight:800, color:"#0A0A0A" }}>{p.count}</p>
              </div>
            ))}
          </div>
        </div>

        <AdminAnnounce />

        {/* Dernières inscriptions */}
        <div className="glass-card" style={{ borderRadius:"14px", overflow:"hidden", marginBottom:"2rem" }}>
          <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid #F3F4F6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h2 style={{ fontSize:"1rem", fontWeight:700 }}>Dernières inscriptions</h2>
            <a href="/admin/users" style={{ fontSize:".78rem", fontWeight:600, color:"#4F46E5" }}>Voir tout →</a>
          </div>
          {recentUsers.rows.map((u: { id: number; name: string; email: string; plan: string; created_at: string }) => (
            <div key={u.id} style={{ padding:"1rem 1.5rem", borderBottom:"1px solid #F9FAFB", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <p style={{ fontSize:".875rem", fontWeight:600, color:"#0A0A0A" }}>{u.name || "—"}</p>
                <p style={{ fontSize:".78rem", color:"#6B7280" }}>{u.email}</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:".75rem" }}>
                <span style={{ fontSize:".7rem", fontWeight:700, textTransform:"uppercase", padding:".2rem .6rem", borderRadius:"100px", background: u.plan === "pro" ? "#EEF2FF" : u.plan === "starter" ? "#ECFDF5" : "#F3F4F6", color: u.plan === "pro" ? "#4F46E5" : u.plan === "starter" ? "#059669" : "#6B7280" }}>{u.plan}</span>
                <span style={{ fontSize:".75rem", color:"#9CA3AF" }}>{new Date(u.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Messages support */}
        {recentSupport.rows.length > 0 && (
          <div className="glass-card" style={{ borderRadius:"14px", overflow:"hidden", marginBottom:"2rem" }}>
            <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid #F3F4F6" }}>
              <h2 style={{ fontSize:"1rem", fontWeight:700 }}>Messages support récents</h2>
            </div>
            {recentSupport.rows.map((m: { id: number; email: string; subject: string; message: string; created_at: string }, i: number) => (
              <div key={i} style={{ padding:"1rem 1.5rem", borderBottom:"1px solid #F9FAFB" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:".3rem" }}>
                  <p style={{ fontSize:".82rem", fontWeight:700, color:"#0A0A0A" }}>{m.subject}</p>
                  <span style={{ fontSize:".72rem", color:"#9CA3AF" }}>{new Date(m.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <p style={{ fontSize:".78rem", color:"#6B7280" }}>{m.email}</p>
                <p style={{ fontSize:".8rem", color:"#374151", marginTop:".25rem" }}>{m.message?.slice(0, 120)}{m.message?.length > 120 ? "..." : ""}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"1rem", marginTop:"2rem" }}>
          <a href="/admin/users" className="glass-card" style={{ borderRadius:"12px", padding:"1.5rem", display:"flex", alignItems:"center", gap:"1rem", textDecoration:"none" }}>
            <div style={{ width:40, height:40, borderRadius:10, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#4F46E5" strokeWidth="1.5"/><path d="M4 20C4 17 7.58 15 12 15C16.42 15 20 17 20 20" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div>
              <p style={{ fontWeight:700, fontSize:".95rem", color:"#0A0A0A" }}>Gérer les utilisateurs</p>
              <p style={{ fontSize:".8rem", color:"#9CA3AF", marginTop:".2rem" }}>Voir, bannir, changer les plans</p>
            </div>
          </a>
          <a href="/admin/waitlist" className="glass-card" style={{ borderRadius:"12px", padding:"1.5rem", display:"flex", alignItems:"center", gap:"1rem", textDecoration:"none" }}>
            <div style={{ width:40, height:40, borderRadius:10, background:"#ECFDF5", border:"1px solid #A7F3D0", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#059669" strokeWidth="1.5"/><path d="M2 6L12 13L22 6" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div>
              <p style={{ fontWeight:700, fontSize:".95rem", color:"#0A0A0A" }}>Voir la waitlist</p>
              <p style={{ fontSize:".8rem", color:"#9CA3AF", marginTop:".2rem" }}>Tous les emails inscrits</p>
            </div>
          </a>
          <a href="/admin/demo" className="glass-card" style={{ borderRadius:"12px", padding:"1.5rem", display:"flex", alignItems:"center", gap:"1rem", textDecoration:"none", gridColumn:"span 2" }}>
            <div style={{ width:40, height:40, borderRadius:10, background:"linear-gradient(135deg,#EEF2FF,#FDF4FF)", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="5,3 19,12 5,21" fill="#6366F1"/></svg>
            </div>
            <div>
              <p style={{ fontWeight:700, fontSize:".95rem", color:"#0A0A0A" }}>Demo cinématique</p>
              <p style={{ fontSize:".8rem", color:"#9CA3AF", marginTop:".2rem" }}>Animation workflow pour YouTube / TikTok — enregistrez avec OBS</p>
            </div>
          </a>
        </div>
      </main>
    </>
  );
}