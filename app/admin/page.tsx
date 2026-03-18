import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";

export default async function AdminPage() {
  const session = await getServerSession();

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  // Stats globales
  const usersCount = await pool.query("SELECT COUNT(*) FROM users");
  const waitlistCount = await pool.query("SELECT COUNT(*) FROM waitlist");
  const plansCount = await pool.query(
    "SELECT plan, COUNT(*) as count FROM users GROUP BY plan"
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; }
      `}</style>

      {/* NAV ADMIN */}
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
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <span style={{ fontSize:".78rem", color:"rgba(255,255,255,0.4)" }}>{session.user?.email}</span>
          <a href="/api/auth/signout" style={{ fontSize:".78rem", color:"rgba(255,255,255,0.6)", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", padding:".35rem .8rem", borderRadius:"8px" }}>
            Déconnexion
          </a>
        </div>
      </nav>

      <main style={{ maxWidth:"1080px", margin:"0 auto", padding:"3rem 2rem" }}>

        {/* Header */}
        <div style={{ marginBottom:"2.5rem" }}>
          <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".4rem" }}>
            Panel Admin
          </h1>
          <p style={{ fontSize:".9rem", color:"#6B7280" }}>
            Vue globale de FlowForge — accès restreint.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"2.5rem" }}>
          {[
            { label:"Utilisateurs total", value: usersCount.rows[0].count, color:"#4F46E5" },
            { label:"Emails waitlist", value: waitlistCount.rows[0].count, color:"#059669" },
            { label:"Plans actifs", value: plansCount.rows.length, color:"#D97706" },
          ].map((s,i) => (
            <div key={i} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"12px", padding:"1.5rem" }}>
              <p style={{ fontSize:".75rem", color:"#9CA3AF", marginBottom:".5rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>{s.label}</p>
              <p style={{ fontSize:"2.2rem", fontWeight:800, letterSpacing:"-0.03em", color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Plans breakdown */}
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"14px", overflow:"hidden", marginBottom:"2rem" }}>
          <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid #F3F4F6" }}>
            <h2 style={{ fontSize:"1rem", fontWeight:700 }}>Répartition des plans</h2>
          </div>
          <div style={{ padding:"1.5rem", display:"flex", gap:"1rem", flexWrap:"wrap" }}>
            {plansCount.rows.map((p: { plan: string; count: string }) => (
              <div key={p.plan} style={{ background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:"10px", padding:"1rem 1.5rem", textAlign:"center", minWidth:"120px" }}>
                <p style={{ fontSize:".72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#9CA3AF", marginBottom:".4rem" }}>{p.plan}</p>
                <p style={{ fontSize:"1.6rem", fontWeight:800, color:"#0A0A0A" }}>{p.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Liens rapides */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"1rem" }}>
          <a href="/admin/users" style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"12px", padding:"1.5rem", display:"flex", alignItems:"center", gap:"1rem", textDecoration:"none" }}>
            <div style={{ width:40, height:40, borderRadius:10, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#4F46E5" strokeWidth="1.5"/><path d="M4 20C4 17 7.58 15 12 15C16.42 15 20 17 20 20" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div>
              <p style={{ fontWeight:700, fontSize:".95rem", color:"#0A0A0A" }}>Gérer les utilisateurs</p>
              <p style={{ fontSize:".8rem", color:"#9CA3AF", marginTop:".2rem" }}>Voir, bannir, changer les plans</p>
            </div>
          </a>
          <a href="/admin/waitlist" style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"12px", padding:"1.5rem", display:"flex", alignItems:"center", gap:"1rem", textDecoration:"none" }}>
            <div style={{ width:40, height:40, borderRadius:10, background:"#ECFDF5", border:"1px solid #A7F3D0", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#059669" strokeWidth="1.5"/><path d="M2 6L12 13L22 6" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div>
              <p style={{ fontWeight:700, fontSize:".95rem", color:"#0A0A0A" }}>Voir la waitlist</p>
              <p style={{ fontSize:".8rem", color:"#9CA3AF", marginTop:".2rem" }}>Tous les emails inscrits</p>
            </div>
          </a>
        </div>

      </main>
    </>
  );
}