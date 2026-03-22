"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("Lien invalide ou expiré.");
  }, [token]);

  async function handleSubmit() {
    if (!password || password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    setLoading(true);
    setError("");
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; }
        .input { width:100%; padding:.75rem 1rem; border:1.5px solid #E5E7EB; border-radius:10px; font-size:.9rem; font-family:inherit; outline:none; background:#fff; }
        .input:focus { border-color:#4F46E5; box-shadow:0 0 0 3px #EEF2FF; }
      `}</style>

      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
        <div style={{ width:"100%", maxWidth:400 }}>
          <div style={{ textAlign:"center", marginBottom:"2rem" }}>
            <Logo />
          </div>

          {done ? (
            <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:16, padding:"2rem", textAlign:"center" }}>
              <div style={{ width:48, height:48, borderRadius:12, background:"#ECFDF5", border:"1px solid #A7F3D0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
                <span style={{ fontSize:20 }}>✅</span>
              </div>
              <h2 style={{ fontSize:"1.1rem", fontWeight:800, marginBottom:".5rem" }}>Mot de passe modifié !</h2>
              <p style={{ fontSize:".875rem", color:"#6B7280", marginBottom:"1.5rem" }}>
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <a href="/login" style={{ display:"block", padding:".85rem", borderRadius:10, fontSize:".9rem", fontWeight:700, background:"#4F46E5", color:"#fff", textDecoration:"none", textAlign:"center" }}>
                Se connecter →
              </a>
            </div>
          ) : (
            <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:16, padding:"2rem" }}>
              <h1 style={{ fontSize:"1.3rem", fontWeight:800, marginBottom:".5rem", letterSpacing:"-0.02em" }}>
                Nouveau mot de passe
              </h1>
              <p style={{ fontSize:".875rem", color:"#6B7280", marginBottom:"1.5rem" }}>
                Choisissez un nouveau mot de passe pour votre compte.
              </p>

              <div style={{ marginBottom:"1rem" }}>
                <label style={{ fontSize:".82rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".4rem" }}>
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Min. 6 caractères"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div style={{ marginBottom:"1rem" }}>
                <label style={{ fontSize:".82rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".4rem" }}>
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Répétez le mot de passe"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
              </div>

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
                {loading ? "Modification..." : "Modifier le mot de passe →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}