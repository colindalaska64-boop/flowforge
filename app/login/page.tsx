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
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(searchParams?.get("verified") === "1" ? "Email vérifié ! Vous pouvez vous connecter." : "");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) return;
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error === "email_not_verified") {
      setError("Vérifiez votre email avant de vous connecter. Consultez votre boîte mail.");
      setLoading(false);
    } else if (res?.error) {
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
            <p style={{ fontSize:".875rem", color:"#6B7280", marginBottom:"1.25rem" }}>
              Bon retour sur Loopflo !
            </p>

            <button
              onClick={() => { setGoogleLoading(true); signIn("google", { callbackUrl: "/dashboard" }); }}
              disabled={googleLoading}
              style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:".6rem", padding:".75rem", borderRadius:10, fontSize:".875rem", fontWeight:600, background:"#fff", border:"1.5px solid #E5E7EB", color:"#374151", cursor: googleLoading ? "wait" : "pointer", fontFamily:"inherit", transition:"border-color .15s, box-shadow .15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.27l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Connexion..." : "Continuer avec Google"}
            </button>

            <div style={{ display:"flex", alignItems:"center", gap:".75rem", margin:"1.25rem 0" }}>
              <div style={{ flex:1, height:1, background:"#E5E7EB" }} />
              <span style={{ fontSize:".75rem", color:"#9CA3AF", fontWeight:500 }}>ou</span>
              <div style={{ flex:1, height:1, background:"#E5E7EB" }} />
            </div>

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

            {success && (
              <p style={{ fontSize:".82rem", color:"#059669", marginBottom:"1rem", background:"#ECFDF5", padding:".6rem .75rem", borderRadius:8, border:"1px solid #A7F3D0" }}>
                {success}
              </p>
            )}

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