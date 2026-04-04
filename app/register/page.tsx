"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
      `}</style>

      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
        <div style={{ width:"100%", maxWidth:"400px" }}>

          <div style={{ textAlign:"center", marginBottom:"2rem" }}>
            <Logo size="lg" />
            <p style={{ marginTop:"0.5rem", fontSize:"0.9rem", color:"#6B7280" }}>
              Créez votre compte gratuitement
            </p>
          </div>

          <div className="glass-panel glass-shimmer" style={{ padding:"2rem" }}>
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