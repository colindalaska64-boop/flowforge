"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

type Workflow = {
  id: number;
  name: string;
  active: boolean;
  created_at: string;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);

  const userPlan = (session?.user as { plan?: string })?.plan || "free";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/workflows")
        .then((r) => r.json())
        .then((data) => setWorkflows(Array.isArray(data) ? data : []));
    }
  }, [status]);

  async function deleteWorkflow(id: number) {
    setDeleting(id);
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    setWorkflows((wfs) => wfs.filter((w) => w.id !== id));
    setDeleting(null);
  }

  if (status === "loading") return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; }
        .wf-row:hover { background:#FAFAFA !important; }
        .btn-delete:hover { background:#FEF2F2 !important; color:#DC2626 !important; border-color:#FECACA !important; }
        .btn-open:hover { background:#4F46E5 !important; color:#fff !important; }
      `}</style>

      <nav style={{ background:"#fff", borderBottom:"1px solid #E5E7EB", padding:"1rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"2rem" }}>
          <Logo />
          <div style={{ display:"flex", gap:".25rem" }}>
            {[
              { label:"Dashboard", href:"/dashboard" },
              { label:"Paramètres", href:"/dashboard/settings" },
            ].map((item) => (
              <a key={item.label} href={item.href} style={{ fontSize:".85rem", color:"#6B7280", textDecoration:"none", padding:".4rem .75rem", borderRadius:"8px", fontWeight:500 }}>{item.label}</a>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <span style={{ fontSize:".82rem", color:"#9CA3AF" }}>{session?.user?.email}</span>
          <div style={{ background:"#EEF2FF", color:"#4F46E5", fontSize:".72rem", fontWeight:700, padding:".25rem .7rem", borderRadius:"100px", border:"1px solid #C7D2FE", textTransform:"uppercase" }}>
            {userPlan}
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ fontSize:".82rem", fontWeight:600, color:"#DC2626", background:"#FEF2F2", border:"1px solid #FECACA", padding:".4rem .9rem", borderRadius:"8px", cursor:"pointer", fontFamily:"inherit" }}>
            Déconnexion
          </button>
        </div>
      </nav>

      <main style={{ maxWidth:"1080px", margin:"0 auto", padding:"3rem 2rem" }}>
        <div style={{ marginBottom:"2.5rem" }}>
          <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".4rem" }}>
            Bonjour, {session?.user?.name || session?.user?.email} !
          </h1>
          <p style={{ fontSize:".95rem", color:"#6B7280" }}>Gérez vos workflows et automatisations.</p>
        </div>

        {/* Bannière plan Free */}
        {userPlan === "free" && (
          <div style={{ background:"#FFF7ED", border:"1px solid #FDE68A", borderRadius:12, padding:"1rem 1.5rem", marginBottom:"2rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <p style={{ fontSize:".875rem", fontWeight:600, color:"#D97706", marginBottom:".2rem" }}>
                Plan Free — {workflows.length}/5 workflows utilisés
              </p>
              <p style={{ fontSize:".8rem", color:"#92400E" }}>
                Passez en Starter pour des workflows illimités et l&apos;IA générative.
              </p>
            </div>
            <a href="/pricing" style={{ fontSize:".82rem", fontWeight:700, background:"#D97706", color:"#fff", textDecoration:"none", padding:".5rem 1rem", borderRadius:8, whiteSpace:"nowrap", flexShrink:0 }}>
              Upgrader
            </a>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"2.5rem" }}>
          {[
            { label:"Workflows actifs", value: workflows.filter(w => w.active).length },
            { label:"Workflows total", value: `${workflows.length}${userPlan === "free" ? "/5" : ""}` },
            { label:"Plan actuel", value: userPlan.toUpperCase() },
          ].map((s, i) => (
            <div key={i} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"12px", padding:"1.5rem" }}>
              <p style={{ fontSize:".78rem", color:"#9CA3AF", marginBottom:".5rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>{s.label}</p>
              <p style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em" }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"14px", overflow:"hidden" }}>
          <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <h2 style={{ fontSize:"1rem", fontWeight:700 }}>Mes workflows</h2>
            {(userPlan !== "free" || workflows.length < 5) && (
              <a href="/dashboard/workflows/new" style={{ fontSize:".85rem", fontWeight:600, background:"#4F46E5", color:"#fff", textDecoration:"none", padding:".5rem 1.1rem", borderRadius:"8px" }}>
                + Nouveau workflow
              </a>
            )}
            {userPlan === "free" && workflows.length >= 5 && (
              <a href="/pricing" style={{ fontSize:".85rem", fontWeight:600, background:"#D97706", color:"#fff", textDecoration:"none", padding:".5rem 1.1rem", borderRadius:"8px" }}>
                Limite atteinte — Upgrader
              </a>
            )}
          </div>

          {workflows.length === 0 ? (
            <div style={{ padding:"4rem 2rem", textAlign:"center" }}>
              <div style={{ width:48, height:48, borderRadius:12, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <p style={{ fontWeight:700, fontSize:"1rem", marginBottom:".4rem" }}>Aucun workflow pour l&apos;instant</p>
              <p style={{ fontSize:".875rem", color:"#9CA3AF", marginBottom:"1.5rem" }}>Créez votre premier workflow pour commencer à automatiser.</p>
              <a href="/dashboard/workflows/new" style={{ fontSize:".9rem", fontWeight:600, background:"#4F46E5", color:"#fff", textDecoration:"none", padding:".75rem 1.5rem", borderRadius:"10px" }}>
                Créer mon premier workflow
              </a>
            </div>
          ) : (
            workflows.map((wf) => (
              <div key={wf.id} className="wf-row" style={{ padding:"1rem 1.5rem", borderBottom:"1px solid #F9FAFB", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#fff" }}>
                <div>
                  <p style={{ fontSize:".9rem", fontWeight:600, color:"#0A0A0A" }}>{wf.name}</p>
                  <p style={{ fontSize:".75rem", color:"#9CA3AF", marginTop:".2rem" }}>
                    {new Date(wf.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}
                  </p>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:".75rem" }}>
                  <span style={{ fontSize:".72rem", fontWeight:700, textTransform:"uppercase", padding:".25rem .7rem", borderRadius:"100px", background: wf.active ? "#ECFDF5" : "#F3F4F6", color: wf.active ? "#059669" : "#6B7280" }}>
                    {wf.active ? "Actif" : "Inactif"}
                  </span>
                  <a href={`/dashboard/workflows/new?id=${wf.id}`} className="btn-open" style={{ fontSize:".78rem", fontWeight:600, color:"#4F46E5", background:"#EEF2FF", border:"1px solid #C7D2FE", padding:".3rem .7rem", borderRadius:"6px", textDecoration:"none", transition:"all .15s" }}>
                    Ouvrir
                  </a>
                  <button className="btn-delete" onClick={() => deleteWorkflow(wf.id)} disabled={deleting === wf.id} style={{ fontSize:".78rem", fontWeight:600, color:"#9CA3AF", background:"none", border:"1px solid #E5E7EB", padding:".3rem .7rem", borderRadius:"6px", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>
                    {deleting === wf.id ? "..." : "Supprimer"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}