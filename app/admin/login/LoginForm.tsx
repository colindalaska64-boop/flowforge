"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ email }: { email: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"send" | "verify">("send");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/otp/send", { method: "POST" });
    const d = await res.json();
    setLoading(false);
    if (res.ok) setStep("verify");
    else setError(d.error || "Erreur lors de l'envoi.");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const d = await res.json();
    setLoading(false);
    if (res.ok) router.replace("/admin");
    else setError(d.error || "Code invalide.");
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0A0A0A", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ background:"#141414", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"2.5rem", width:"100%", maxWidth:400 }}>

        <div style={{ marginBottom:"2rem", textAlign:"center" }}>
          <div style={{ fontSize:"1.3rem", fontWeight:800, color:"#fff", marginBottom:".5rem" }}>
            Loop<span style={{ color:"#818CF8" }}>flo</span>
            <span style={{ marginLeft:".5rem", fontSize:".6rem", fontWeight:700, color:"#818CF8", background:"rgba(129,140,248,0.15)", border:"1px solid rgba(129,140,248,0.3)", padding:".2rem .6rem", borderRadius:"100px", letterSpacing:".08em", textTransform:"uppercase", verticalAlign:"middle" }}>Admin</span>
          </div>
          <p style={{ fontSize:".85rem", color:"rgba(255,255,255,0.4)" }}>Accès sécurisé par code email</p>
        </div>

        {step === "send" ? (
          <div>
            <div style={{ background:"rgba(129,140,248,0.08)", border:"1px solid rgba(129,140,248,0.2)", borderRadius:10, padding:"1rem", marginBottom:"1.5rem" }}>
              <p style={{ fontSize:".82rem", color:"rgba(255,255,255,0.6)", lineHeight:1.6 }}>
                Un code à 6 chiffres sera envoyé à<br/>
                <strong style={{ color:"#818CF8" }}>{email}</strong>
              </p>
            </div>
            {error && <p style={{ fontSize:".82rem", color:"#F87171", marginBottom:"1rem", fontWeight:600 }}>{error}</p>}
            <button onClick={sendCode} disabled={loading} style={{ width:"100%", background: loading ? "#374151" : "linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", border:"none", borderRadius:10, padding:".85rem", fontSize:".9rem", fontWeight:700, cursor: loading ? "not-allowed" : "pointer", fontFamily:"inherit" }}>
              {loading ? "Envoi en cours..." : "Envoyer le code"}
            </button>
          </div>
        ) : (
          <form onSubmit={verifyCode}>
            <div style={{ background:"rgba(5,150,105,0.08)", border:"1px solid rgba(5,150,105,0.2)", borderRadius:10, padding:"1rem", marginBottom:"1.5rem" }}>
              <p style={{ fontSize:".82rem", color:"rgba(255,255,255,0.6)" }}>
                Code envoyé à <strong style={{ color:"#34D399" }}>{email}</strong> — valable <strong style={{ color:"#34D399" }}>10 minutes</strong>
              </p>
            </div>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              autoFocus
              style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:".85rem 1rem", fontSize:"1.5rem", fontWeight:800, color:"#fff", textAlign:"center", letterSpacing:"0.3em", outline:"none", fontFamily:"monospace", marginBottom:"1rem", boxSizing:"border-box" }}
            />
            {error && <p style={{ fontSize:".82rem", color:"#F87171", marginBottom:"1rem", fontWeight:600 }}>{error}</p>}
            <button type="submit" disabled={loading || code.length !== 6} style={{ width:"100%", background: loading || code.length !== 6 ? "#374151" : "linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", border:"none", borderRadius:10, padding:".85rem", fontSize:".9rem", fontWeight:700, cursor: loading || code.length !== 6 ? "not-allowed" : "pointer", fontFamily:"inherit", marginBottom:".75rem" }}>
              {loading ? "Vérification..." : "Accéder au panel"}
            </button>
            <button type="button" onClick={() => { setStep("send"); setCode(""); setError(""); }} style={{ width:"100%", background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:".8rem", cursor:"pointer", fontFamily:"inherit" }}>
              Renvoyer un nouveau code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
