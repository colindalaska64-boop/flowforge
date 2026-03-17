"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import Input from "@/components/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true); setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
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
      `}</style>

      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
        <div style={{ width:"100%", maxWidth:"400px" }}>

          <div style={{ textAlign:"center", marginBottom:"2rem" }}>
            <Logo size="lg" />
            <p style={{ marginTop:"0.5rem", fontSize:"0.9rem", color:"#6B7280" }}>
              Connectez-vous à votre compte
            </p>
          </div>

          <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"16px", padding:"2rem", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
            {error && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:"8px", padding:"0.75rem 1rem", marginBottom:"1.25rem", fontSize:"0.85rem", color:"#DC2626" }}>
                {error}
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" />
              <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              <Button fullWidth disabled={loading} onClick={handleSubmit} size="lg">
                {loading ? "Connexion..." : "Se connecter →"}
              </Button>
            </div>
            <p style={{ textAlign:"center", marginTop:"1.5rem", fontSize:"0.85rem", color:"#6B7280" }}>
              Pas encore de compte ?{" "}
              <a href="/register" style={{ color:"#4F46E5", fontWeight:600, textDecoration:"none" }}>S&apos;inscrire</a>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}