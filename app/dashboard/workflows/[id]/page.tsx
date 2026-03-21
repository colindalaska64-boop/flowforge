"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Workflow = {
  id: number;
  name: string;
  active: boolean;
  data: { nodes: unknown[]; edges: unknown[] };
  created_at: string;
};

export default function WorkflowDetailPage() {
  const params = useParams();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/workflows/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setWorkflow(data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#9CA3AF" }}>
      Chargement...
    </div>
  );

  if (!workflow) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#9CA3AF" }}>
      Workflow introuvable.
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; }
      `}</style>

      <nav style={{ background:"#fff", borderBottom:"1px solid #E5E7EB", padding:"1rem 2.5rem", display:"flex", alignItems:"center", gap:"1rem" }}>
        <Link href="/dashboard" style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", color:"#6B7280", textDecoration:"none", padding:".4rem .6rem", borderRadius:8, border:"1px solid #E5E7EB" }}>
          <ArrowLeft size={13} strokeWidth={2} />
          Retour
        </Link>
        <h1 style={{ fontSize:"1rem", fontWeight:700 }}>{workflow.name}</h1>
        <span style={{ fontSize:".72rem", fontWeight:700, textTransform:"uppercase", padding:".25rem .7rem", borderRadius:"100px", background: workflow.active ? "#ECFDF5" : "#F3F4F6", color: workflow.active ? "#059669" : "#6B7280" }}>
          {workflow.active ? "Actif" : "Inactif"}
        </span>
      </nav>

      <main style={{ maxWidth:"800px", margin:"0 auto", padding:"3rem 2rem" }}>
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"14px", padding:"2rem", marginBottom:"1.5rem" }}>
          <p style={{ fontSize:".75rem", color:"#9CA3AF", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:"1rem" }}>Informations</p>
          {[
            { label:"Nom", value: workflow.name },
            { label:"Statut", value: workflow.active ? "Actif" : "Inactif" },
            { label:"Nœuds", value: `${(workflow.data?.nodes || []).length} nœud(s)` },
            { label:"Créé le", value: new Date(workflow.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" }) },
          ].map((item) => (
            <div key={item.label} style={{ display:"flex", justifyContent:"space-between", padding:".6rem 0", borderBottom:"1px solid #F9FAFB" }}>
              <span style={{ fontSize:".85rem", color:"#6B7280" }}>{item.label}</span>
              <span style={{ fontSize:".85rem", fontWeight:600 }}>{item.value}</span>
            </div>
          ))}
        </div>

        <a href="/dashboard/workflows/new" style={{ display:"inline-flex", alignItems:"center", gap:".5rem", fontSize:".9rem", fontWeight:600, background:"#4F46E5", color:"#fff", textDecoration:"none", padding:".75rem 1.5rem", borderRadius:"10px" }}>
          Modifier dans l&apos;éditeur →
        </a>
      </main>
    </>
  );
}