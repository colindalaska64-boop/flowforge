"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; }
        .input { width:100%; padding:.75rem 1rem; border:1.5px solid #E5E7EB; border-radius:10px; font-size:.9rem; font-family:inherit; outline:none; background:#fff; color:#0A0A0A; }
        .input:focus { border-color:#4F46E5; box-shadow:0 0 0 3px #EEF2FF; }
      `}</style>

      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
        <div style={{ width:"100%", maxWidth:400 }}>
          <div style={{ textAlign:"center", marginBottom:"2rem" }}>
            <Logo />
          </div>

          <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:16, padding:"2rem" }}>
            <h1 style={{ fontSize:"1.3rem", fontWeight:800, marginBottom:".25rem", letterSpacing:"-0.02em" }}>
              Connexion
            </h1>
            <p style={{ fontSize:".875rem", color:"#6B7280", marginBottom:"1.5rem" }}>
              Bon retour sur Loopflo ! 👋
            </p>

            <div style={{ marginBottom:"1rem" }}>
              <label style={{ fontSize:".82rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".4rem" }}>
                Email
              </label>
              <input
                type="email"
                className="input"
                placeholder="votre@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>

            <div style={{ marginBottom:"1rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:".4rem" }}>
                <label style={{ fontSize:".82rem", fontWeight:600, color:"#374151" }}>
                  Mot de passe
                </label>
                <a href="/forgot-password" style={{ fontSize:".78rem", color:"#4F46E5", textDecoration:"none", fontWeight:600 }}>
                  Mot de passe oublié ?
                </a>
              </div>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
              disabled={loading || !email || !password}
              style={{ width:"100%", padding:".85rem", borderRadius:10, fontSize:".9rem", fontWeight:700, background: loading ? "#9CA3AF" : "#4F46E5", color:"#fff", border:"none", cursor: loading ? "not-allowed" : "pointer", fontFamily:"inherit", marginBottom:"1.25rem" }}
            >
              {loading ? "Connexion..." : "Se connecter →"}
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