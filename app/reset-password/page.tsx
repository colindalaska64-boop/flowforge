"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("Lien invalide ou expiré.");
  }, [token]);

  async function handleSubmit() {
    setError("");
    if (!password || password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        setError(data.error || "Erreur serveur.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width:"100%", padding:".75rem 1rem", paddingRight:"2.5rem",
    border:"1.5px solid #E5E7EB", borderRadius:10, fontSize:".9rem",
    fontFamily:"inherit", outline:"none", background:"#fff", color:"#0A0A0A",
  };

  return (
    <div style={{ width:"100%", maxWidth:400 }}>
      <div style={{ textAlign:"center", marginBottom:"2rem" }}>
        <Logo />
      </div>

      {done ? (
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:16, padding:"2rem", textAlign:"center" }}>
          <div style={{ width:48, height:48, borderRadius:12, background:"#ECFDF5", border:"1px solid #A7F3D0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ fontSize:"1.1rem", fontWeight:800, marginBottom:".5rem", color:"#0A0A0A" }}>Mot de passe modifié !</h2>
          <p style={{ fontSize:".875rem", color:"#6B7280", marginBottom:"1.5rem" }}>
            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </p>
          <a href="/login" style={{ display:"block", padding:".85rem", borderRadius:10, fontSize:".9rem", fontWeight:700, background:"#4F46E5", color:"#fff", textDecoration:"none", textAlign:"center" }}>
            Se connecter
          </a>
        </div>
      ) : (
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:16, padding:"2rem" }}>
          <h1 style={{ fontSize:"1.3rem", fontWeight:800, marginBottom:".5rem", letterSpacing:"-0.02em", color:"#0A0A0A" }}>
            Nouveau mot de passe
          </h1>
          <p style={{ fontSize:".875rem", color:"#6B7280", marginBottom:"1.5rem" }}>
            Choisissez un nouveau mot de passe pour votre compte.
          </p>

          {/* Mot de passe */}
          <div style={{ marginBottom:"1rem" }}>
            <label style={{ fontSize:".82rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".4rem" }}>
              Nouveau mot de passe
            </label>
            <div style={{ position:"relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                style={inputStyle}
                placeholder="Min. 6 caractères"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{ position:"absolute", right:".75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", alignItems:"center" }}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {/* Confirmer */}
          <div style={{ marginBottom:"1.25rem" }}>
            <label style={{ fontSize:".82rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".4rem" }}>
              Confirmer le mot de passe
            </label>
            <div style={{ position:"relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                style={inputStyle}
                placeholder="Répétez le mot de passe"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
              <button
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position:"absolute", right:".75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", alignItems:"center" }}
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          </div>

          {/* Erreur — seulement si il y en a une */}
          {error && (
            <p style={{ fontSize:".82rem", color:"#DC2626", marginBottom:"1rem", background:"#FEF2F2", padding:".6rem .75rem", borderRadius:8, border:"1px solid #FECACA" }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !password || !confirm}
            style={{ width:"100%", padding:".85rem", borderRadius:10, fontSize:".9rem", fontWeight:700, background: loading ? "#9CA3AF" : "#4F46E5", color:"#fff", border:"none", cursor: loading ? "not-allowed" : "pointer", fontFamily:"inherit" }}
          >
            {loading ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; }
      `}</style>
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
        <Suspense fallback={<div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#9CA3AF" }}>Chargement...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </>
  );
}