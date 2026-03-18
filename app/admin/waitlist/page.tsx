import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";

export default async function AdminWaitlistPage() {
  const session = await getServerSession();

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const waitlist = await pool.query(
    "SELECT * FROM waitlist ORDER BY created_at DESC"
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; }
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

      <main style={{ maxWidth:"1080px", margin:"0 auto", padding:"3rem 2rem" }}>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"2rem" }}>
          <div>
            <a href="/admin" style={{ fontSize:".82rem", color:"#6B7280", marginBottom:".5rem", display:"block" }}>← Retour</a>
            <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em" }}>Waitlist</h1>
            <p style={{ fontSize:".9rem", color:"#6B7280", marginTop:".3rem" }}>
              {waitlist.rows.length} email{waitlist.rows.length > 1 ? "s" : ""} inscrit{waitlist.rows.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"14px", overflow:"hidden" }}>
          <div style={{ padding:"1rem 1.5rem", borderBottom:"1px solid #F3F4F6", display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:"1rem" }}>
            <span style={{ fontSize:".75rem", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".06em" }}>Email</span>
            <span style={{ fontSize:".75rem", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".06em" }}>Date d&apos;inscription</span>
            <span style={{ fontSize:".75rem", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".06em" }}>ID</span>
          </div>

          {waitlist.rows.length === 0 ? (
            <div style={{ padding:"3rem", textAlign:"center", color:"#9CA3AF", fontSize:".9rem" }}>
              Aucun email pour l&apos;instant.
            </div>
          ) : (
            waitlist.rows.map((row: { id: number; email: string; created_at: string }) => (
              <div key={row.id} style={{ padding:"1rem 1.5rem", borderBottom:"1px solid #F9FAFB", display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:"1rem", alignItems:"center" }}>
                <span style={{ fontSize:".875rem", fontWeight:500, color:"#0A0A0A" }}>{row.email}</span>
                <span style={{ fontSize:".82rem", color:"#6B7280" }}>
                  {new Date(row.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                </span>
                <span style={{ fontSize:".75rem", color:"#D1D5DB", fontWeight:600 }}>#{row.id}</span>
              </div>
            ))
          )}
        </div>

      </main>
    </>
  );
}