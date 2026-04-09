"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import Input from "@/components/Input";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit() {
    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    setLoading(true); setError("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Une erreur est survenue.");
      setLoading(false);
    } else {
      localStorage.setItem("loopflo-new-user", "1");
      router.push("/login");
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
        @media (max-width: 480px) {
          .register-wrap { padding: 1rem !important; }
          .register-card { padding: 1.5rem !important; }
        }
      `}</style>

      <div className="register-wrap" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
        <div style={{ width:"100%", maxWidth:"400px" }}>

          <div style={{ textAlign:"center", marginBottom:"2rem" }}>
            <Logo size="lg" />
            <p style={{ marginTop:"0.5rem", fontSize:"0.9rem", color:"#6B7280" }}>
              Créez votre compte gratuitement
            </p>
          </div>

          <div className="glass-panel glass-shimmer register-card" style={{ padding:"2rem" }}>
            <button
              onClick={() => { setGoogleLoading(true); signIn("google", { callbackUrl: "/dashboard" }); }}
              disabled={googleLoading}
              style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:".6rem", padding:".75rem", borderRadius:10, fontSize:".875rem", fontWeight:600, background:"#fff", border:"1.5px solid #E5E7EB", color:"#374151", cursor: googleLoading ? "wait" : "pointer", fontFamily:"inherit", marginBottom:"1.25rem", transition:"border-color .15s, box-shadow .15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.27l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Connexion..." : "S'inscrire avec Google"}
            </button>

            <div style={{ display:"flex", alignItems:"center", gap:".75rem", marginBottom:"1.25rem" }}>
              <div style={{ flex:1, height:1, background:"#E5E7EB" }} />
              <span style={{ fontSize:".75rem", color:"#9CA3AF", fontWeight:500 }}>ou</span>
              <div style={{ flex:1, height:1, background:"#E5E7EB" }} />
            </div>

            {error && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:"8px", padding:"0.75rem 1rem", marginBottom:"1.25rem", fontSize:"0.85rem", color:"#DC2626" }}>
                {error}
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
              <Input label="Prénom" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre prénom" />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" />
              <div>
                <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                <p style={{ fontSize:".75rem", color:"#9CA3AF", marginTop:".35rem", marginLeft:".1rem" }}>Minimum 8 caractères</p>
              </div>
              <Button fullWidth disabled={loading} onClick={handleSubmit} size="lg">
                {loading ? "Création..." : "Créer mon compte →"}
              </Button>
            </div>
            <p style={{ textAlign:"center", marginTop:"1.5rem", fontSize:"0.85rem", color:"#6B7280" }}>
              Déjà un compte ?{" "}
              <a href="/login" style={{ color:"#4F46E5", fontWeight:600, textDecoration:"none" }}>Se connecter</a>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}