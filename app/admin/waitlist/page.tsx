import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { checkAdminCookie } from "@/lib/adminAuth";
import AdminNav from "@/components/AdminNav";

export default async function AdminWaitlistPage() {
  const session = await getServerSession();

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const verified = await checkAdminCookie();
  if (!verified) redirect("/admin/login");

  const waitlist = await pool.query(
    "SELECT * FROM waitlist ORDER BY created_at DESC"
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
      `}</style>

      <AdminNav />

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

        <div className="glass-card" style={{ borderRadius:"14px", overflow:"hidden" }}>
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