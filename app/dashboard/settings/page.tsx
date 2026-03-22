"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
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

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const userPlan = (session?.user as { plan?: string })?.plan || "free";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  async function handleUpdateProfile() {
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileSuccess("Profil mis à jour !");
        await update({ name, email });
        setTimeout(() => setProfileSuccess(""), 3000);
      } else {
        setProfileError(data.error || "Erreur serveur.");
      }
    } catch {
      setProfileError("Erreur réseau.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleUpdatePassword() {
    setPasswordError("");
    setPasswordSuccess("");
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess("Mot de passe modifié !");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(""), 3000);
      } else {
        setPasswordError(data.error || "Erreur serveur.");
      }
    } catch {
      setPasswordError("Erreur réseau.");
    } finally {
      setPasswordLoading(false);
    }
  }

  if (status === "loading") return null;

  const inputStyle = {
    width:"100%", padding:".75rem 1rem",
    border:"1.5px solid #E5E7EB", borderRadius:10,
    fontSize:".9rem", fontFamily:"inherit",
    outline:"none", background:"#fff", color:"#0A0A0A",
  };

  const inputWithEyeStyle = { ...inputStyle, paddingRight:"2.5rem" };

  const planColors: Record<string, { bg: string; color: string; border: string }> = {
    free: { bg:"#F3F4F6", color:"#6B7280", border:"#E5E7EB" },
    starter: { bg:"#ECFDF5", color:"#059669", border:"#A7F3D0" },
    pro: { bg:"#EEF2FF", color:"#4F46E5", border:"#C7D2FE" },
    business: { bg:"#FFF7ED", color:"#D97706", border:"#FDE68A" },
  };
  const planStyle = planColors[userPlan] || planColors.free;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; }
        input:focus { border-color:#4F46E5 !important; box-shadow:0 0 0 3px #EEF2FF !important; }
      `}</style>

      <nav style={{ background:"#fff", borderBottom:"1px solid #E5E7EB", padding:"1rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"2rem" }}>
          <Logo />
          <div style={{ display:"flex", gap:".25rem" }}>
            {[{ label:"Dashboard", href:"/dashboard" }, { label:"Paramètres", href:"/dashboard/settings" }].map(item => (
              <a key={item.label} href={item.href} style={{ fontSize:".85rem", color: item.href === "/dashboard/settings" ? "#4F46E5" : "#6B7280", textDecoration:"none", padding:".4rem .75rem", borderRadius:"8px", fontWeight: item.href === "/dashboard/settings" ? 700 : 500, background: item.href === "/dashboard/settings" ? "#EEF2FF" : "none" }}>{item.label}</a>
            ))}
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ fontSize:".82rem", fontWeight:600, color:"#DC2626", background:"#FEF2F2", border:"1px solid #FECACA", padding:".4rem .9rem", borderRadius:"8px", cursor:"pointer", fontFamily:"inherit" }}>
          Déconnexion
        </button>
      </nav>

      <main style={{ maxWidth:"640px", margin:"0 auto", padding:"3rem 2rem" }}>
        <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:"2rem" }}>Paramètres</h1>

        {/* Plan actuel */}
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, padding:"1.5rem", marginBottom:"1.5rem" }}>
          <p style={{ fontSize:".75rem", color:"#9CA3AF", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:"1rem" }}>Plan actuel</p>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
              <span style={{ fontSize:".8rem", fontWeight:700, textTransform:"uppercase", padding:".3rem .9rem", borderRadius:"100px", background:planStyle.bg, color:planStyle.color, border:`1px solid ${planStyle.border}` }}>
                {userPlan}
              </span>
              <span style={{ fontSize:".875rem", color:"#6B7280" }}>
                {userPlan === "free" ? "0€/mois" : userPlan === "starter" ? "7€/mois" : userPlan === "pro" ? "19€/mois" : "49€/mois"}
              </span>
            </div>
            {userPlan === "free" && (
              <a href="/pricing" style={{ fontSize:".82rem", fontWeight:700, background:"#4F46E5", color:"#fff", textDecoration:"none", padding:".5rem 1rem", borderRadius:8 }}>
                Upgrader
              </a>
            )}
          </div>
        </div>

        {/* Profil */}
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, padding:"1.5rem", marginBottom:"1.5rem" }}>
          <p style={{ fontSize:".75rem", color:"#9CA3AF", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:"1.25rem" }}>Informations du profil</p>

          <div style={{ marginBottom:"1rem" }}>
            <label style={{ fontSize:".82rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".4rem" }}>Nom</label>
            <input type="text" style={inputStyle} placeholder="Votre nom" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div style={{ marginBottom:"1.25rem" }}>
            <label style={{ fontSize:".82rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".4rem" }}>Email</label>
            <input type="email" style={inputStyle} placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          {profileError && <p style={{ fontSize:".82rem", color:"#DC2626", marginBottom:"1rem", background:"#FEF2F2", padding:".6rem .75rem", borderRadius:8, border:"1px solid #FECACA" }}>{profileError}</p>}
          {profileSuccess && <p style={{ fontSize:".82rem", color:"#059669", marginBottom:"1rem", background:"#ECFDF5", padding:".6rem .75rem", borderRadius:8, border:"1px solid #A7F3D0" }}>{profileSuccess}</p>}

          <button onClick={handleUpdateProfile} disabled={profileLoading} style={{ padding:".7rem 1.5rem", borderRadius:9, fontSize:".875rem", fontWeight:700, background: profileLoading ? "#9CA3AF" : "#4F46E5", color:"#fff", border:"none", cursor: profileLoading ? "not-allowed" : "pointer", fontFamily:"inherit" }}>
            {profileLoading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>

        {/* Mot de passe */}
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, padding:"1.5rem", marginBottom:"1.5rem" }}>
          <p style={{ fontSize:".75rem", color:"#9CA3AF", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:"1.25rem" }}>Changer le mot de passe</p>

          <div style={{ marginBottom:"1rem" }}>
            <label style={{ fontSize:".82rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".4rem" }}>Mot de passe actuel</label>
            <div style={{ position:"relative" }}>
              <input type={showCurrent ? "text" : "password"} style={inputWithEyeStyle} placeholder="••••••••" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setPasswordError(""); }} />
              <button onClick={() => setShowCurrent(!showCurrent)} style={{ position:"absolute", right:".75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0, display:"flex" }}>
                <EyeIcon open={showCurrent} />
              </button>
            </div>
          </div>

          <div style={{ marginBottom:"1rem" }}>
            <label style={{ fontSize:".82rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".4rem" }}>Nouveau mot de passe</label>
            <div style={{ position:"relative" }}>
              <input type={showNew ? "text" : "password"} style={inputWithEyeStyle} placeholder="Min. 6 caractères" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordError(""); }} />
              <button onClick={() => setShowNew(!showNew)} style={{ position:"absolute", right:".75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0, display:"flex" }}>
                <EyeIcon open={showNew} />
              </button>
            </div>
          </div>

          <div style={{ marginBottom:"1.25rem" }}>
            <label style={{ fontSize:".82rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".4rem" }}>Confirmer le mot de passe</label>
            <div style={{ position:"relative" }}>
              <input type={showConfirm ? "text" : "password"} style={inputWithEyeStyle} placeholder="Répétez le mot de passe" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordError(""); }} />
              <button onClick={() => setShowConfirm(!showConfirm)} style={{ position:"absolute", right:".75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0, display:"flex" }}>
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          </div>

          {passwordError && <p style={{ fontSize:".82rem", color:"#DC2626", marginBottom:"1rem", background:"#FEF2F2", padding:".6rem .75rem", borderRadius:8, border:"1px solid #FECACA" }}>{passwordError}</p>}
          {passwordSuccess && <p style={{ fontSize:".82rem", color:"#059669", marginBottom:"1rem", background:"#ECFDF5", padding:".6rem .75rem", borderRadius:8, border:"1px solid #A7F3D0" }}>{passwordSuccess}</p>}

          <button onClick={handleUpdatePassword} disabled={passwordLoading} style={{ padding:".7rem 1.5rem", borderRadius:9, fontSize:".875rem", fontWeight:700, background: passwordLoading ? "#9CA3AF" : "#4F46E5", color:"#fff", border:"none", cursor: passwordLoading ? "not-allowed" : "pointer", fontFamily:"inherit" }}>
            {passwordLoading ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </div>

        {/* Danger zone */}
        <div style={{ background:"#fff", border:"1px solid #FECACA", borderRadius:14, padding:"1.5rem" }}>
          <p style={{ fontSize:".75rem", color:"#DC2626", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:"1rem" }}>Zone dangereuse</p>
          <p style={{ fontSize:".875rem", color:"#6B7280", marginBottom:"1rem" }}>
            Se déconnecter de tous les appareils.
          </p>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ padding:".7rem 1.5rem", borderRadius:9, fontSize:".875rem", fontWeight:700, background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA", cursor:"pointer", fontFamily:"inherit" }}>
            Se déconnecter
          </button>
        </div>
      </main>
    </>
  );
}