"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) return;
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
        .input { width:100%; padding:.75rem 1rem; padding-right:2.5rem; border:1.5px solid #E5E7EB; border-radius:10px; font-size:.9rem; font-family:inherit; outline:none; background:#fff; color:#0A0A0A; }
        .input:focus { border-color:#4F46E5; box-shadow:0 0 0 3px #EEF2FF; }
        @media (max-width: 480px) {
          .login-wrap { padding: 1rem !important; }
          .login-card { padding: 1.5rem !important; }
          .login-title { font-size: 1.15rem !important; }
        }
      `}</style>

      <div className="login-wrap" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem", background:"transparent" }}>
        <div style={{ width:"100%", maxWidth:400 }}>
          <div style={{ textAlign:"center", marginBottom:"2rem" }}>
            <Logo />
          </div>

          <div className="glass-panel glass-shimmer login-card" style={{ padding:"2rem" }}>
            <h1 className="login-title" style={{ fontSize:"1.3rem", fontWeight:800, marginBottom:".25rem", letterSpacing:"-0.02em", color:"#0A0A0A" }}>
              Connexion
            </h1>
            <p style={{ fontSize:".875rem", color:"#6B7280", marginBottom:"1.5rem" }}>
              Bon retour sur Loopflo !
            </p>

            <div style={{ marginBottom:"1rem" }}>
              <label style={{ fontSize:".82rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".4rem" }}>
                Email
              </label>
              <input
                type="email"
                className="input glass-input"
                placeholder="votre@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>

            <div style={{ marginBottom:"1.25rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:".4rem" }}>
                <label style={{ fontSize:".82rem", fontWeight:600, color:"#374151" }}>
                  Mot de passe
                </label>
                <a href="/forgot-password" style={{ fontSize:".78rem", color:"#4F46E5", textDecoration:"none", fontWeight:600 }}>
                  Mot de passe oublié ?
                </a>
              </div>
              <div style={{ position:"relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input glass-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position:"absolute", right:".75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", alignItems:"center" }}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {error && (
              <p style={{ fontSize:".82rem", color:"#DC2626", marginBottom:"1rem", background:"#FEF2F2", padding:".6rem .75rem", borderRadius:8, border:"1px solid #FECACA" }}>
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !email || !password}
              className="btn-primary"
              style={{ width:"100%", padding:".85rem", fontSize:".9rem", fontFamily:"inherit", marginBottom:"1.25rem" }}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>

            <p style={{ textAlign:"center", fontSize:".85rem", color:"#6B7280" }}>
              Pas encore de compte ?{" "}
              <a href="/register" style={{ color:"#4F46E5", fontWeight:700, textDecoration:"none" }}>
                S&apos;inscrire
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}