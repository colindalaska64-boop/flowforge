import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import NavApp from "@/components/NavApp";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; }
      `}</style>

      <NavApp />

      <main style={{ maxWidth:"1080px", margin:"0 auto", padding:"3rem 2rem" }}>

        <div style={{ marginBottom:"2.5rem" }}>
          <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:"0.4rem" }}>
            Bonjour, {session.user?.name || session.user?.email} 👋
          </h1>
          <p style={{ fontSize:"0.95rem", color:"#6B7280" }}>
            Gérez vos workflows et automatisations.
          </p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"2.5rem" }}>
          {[
            { label:"Workflows actifs", value:"0" },
            { label:"Tâches ce mois", value:"0" },
            { label:"Plan actuel", value:"Free" },
          ].map((s,i) => (
            <div key={i} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"12px", padding:"1.5rem" }}>
              <p style={{ fontSize:"0.78rem", color:"#9CA3AF", marginBottom:"0.5rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</p>
              <p style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em" }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"14px", overflow:"hidden" }}>
          <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <h2 style={{ fontSize:"1rem", fontWeight:700 }}>Mes workflows</h2>
            <a href="/dashboard/workflows/new" style={{ fontSize:"0.85rem", fontWeight:600, background:"#4F46E5", color:"#fff", textDecoration:"none", padding:"0.5rem 1.1rem", borderRadius:"8px" }}>
              + Nouveau workflow
            </a>
          </div>
          <div style={{ padding:"4rem 2rem", textAlign:"center" }}>
            <div style={{ width:48, height:48, borderRadius:12, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ fontWeight:700, fontSize:"1rem", marginBottom:"0.4rem" }}>Aucun workflow pour l&apos;instant</p>
            <p style={{ fontSize:"0.875rem", color:"#9CA3AF" }}>Créez votre premier workflow pour commencer à automatiser.</p>
          </div>
        </div>

      </main>
    </>
  );
}