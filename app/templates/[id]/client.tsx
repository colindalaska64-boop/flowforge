"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  templateId: number;
  likes: number;
};

export default function PublicTemplateClient({ templateId, likes: initialLikes }: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  const [liked, setLiked]       = useState(false);
  const [likes, setLikes]       = useState(initialLikes);
  const [importing, setImporting] = useState(false);
  const [toast, setToast]         = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting]       = useState(false);

  const showMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleImport = async () => {
    if (!session) {
      router.push(`/login?redirect=/templates/${templateId}`);
      return;
    }
    setImporting(true);
    try {
      const res = await fetch(`/api/community-templates/${templateId}/import`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { showMsg(data.error || "Erreur."); return; }
      showMsg("Workflow ajoute ! Retrouvez-le dans votre dashboard.");
      setTimeout(() => router.push("/dashboard"), 2200);
    } catch {
      showMsg("Erreur reseau.");
    } finally {
      setImporting(false);
    }
  };

  const handleLike = async () => {
    if (!session) { router.push(`/login?redirect=/templates/${templateId}`); return; }
    try {
      const res = await fetch(`/api/community-templates/${templateId}/like`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) return;
      setLiked(data.liked);
      setLikes(data.likes);
    } catch { /* silencieux */ }
  };

  const handleReport = async () => {
    if (!session) { router.push(`/login?redirect=/templates/${templateId}`); return; }
    if (!reportReason) return;
    setReporting(true);
    try {
      const res = await fetch(`/api/community-templates/${templateId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });
      const data = await res.json();
      if (!res.ok) { showMsg(data.error || "Erreur."); return; }
      showMsg("Signalement envoye. Merci !");
      setShowReport(false);
    } catch {
      showMsg("Erreur reseau.");
    } finally {
      setReporting(false);
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:"1.5rem", left:"50%", transform:"translateX(-50%)", background:"#0A0A0A", color:"#fff", padding:".75rem 1.5rem", borderRadius:12, fontSize:".875rem", fontWeight:600, zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,.2)", fontFamily:"Plus Jakarta Sans,sans-serif", whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}

      {/* CTA principal */}
      <div style={{ display:"flex", gap:"1rem", alignItems:"center", flexWrap:"wrap", marginBottom:"1rem" }}>
        <button
          onClick={handleImport}
          disabled={importing}
          style={{ flex:"1 1 200px", background:"#4F46E5", color:"#fff", border:"none", borderRadius:12, padding:".9rem 2rem", fontSize:"1rem", fontWeight:800, cursor:"pointer", fontFamily:"inherit", transition:"background .15s", opacity:importing?.6:1 }}
        >
          {importing ? "Import en cours..." : session ? "Utiliser ce template" : "Se connecter pour utiliser"}
        </button>

        <button
          onClick={handleLike}
          style={{ display:"flex", alignItems:"center", gap:".5rem", background: liked?"#FFF1F2":"#fff", color:liked?"#F43F5E":"#374151", border:`1px solid ${liked?"#F43F5E":"#E5E7EB"}`, borderRadius:12, padding:".85rem 1.25rem", fontSize:".875rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked?"currentColor":"none"}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {likes}
        </button>
      </div>

      {/* Signaler */}
      <div>
        {!showReport ? (
          <button
            onClick={() => setShowReport(true)}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:".75rem", color:"#9CA3AF", fontFamily:"inherit", padding:0 }}
          >
            Signaler ce template
          </button>
        ) : (
          <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, padding:"1rem 1.25rem", marginTop:".5rem" }}>
            <p style={{ fontSize:".82rem", fontWeight:700, color:"#DC2626", marginBottom:".75rem" }}>Pourquoi signalez-vous ce template ?</p>
            <div style={{ display:"flex", flexDirection:"column", gap:".5rem", marginBottom:"1rem" }}>
              {[
                ["contenu_inapproprie", "Contenu inapproprie"],
                ["informations_fausses", "Informations fausses"],
                ["spam", "Spam"],
                ["credentials_exposes", "Credentials exposes"],
                ["autre", "Autre"],
              ].map(([val, label]) => (
                <label key={val} style={{ display:"flex", alignItems:"center", gap:".5rem", fontSize:".82rem", cursor:"pointer" }}>
                  <input type="radio" name="reason" value={val} checked={reportReason===val} onChange={() => setReportReason(val)} style={{ accentColor:"#DC2626" }}/>
                  {label}
                </label>
              ))}
            </div>
            <div style={{ display:"flex", gap:".5rem" }}>
              <button
                onClick={handleReport}
                disabled={!reportReason || reporting}
                style={{ background:"#DC2626", color:"#fff", border:"none", borderRadius:8, padding:".5rem 1rem", fontSize:".82rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:(!reportReason||reporting)?.5:1 }}
              >
                {reporting ? "Envoi..." : "Envoyer"}
              </button>
              <button
                onClick={() => { setShowReport(false); setReportReason(""); }}
                style={{ background:"#fff", color:"#374151", border:"1px solid #E5E7EB", borderRadius:8, padding:".5rem 1rem", fontSize:".82rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
