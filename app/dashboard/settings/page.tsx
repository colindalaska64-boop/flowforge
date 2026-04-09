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

  // Connexions
  type Connections = {
    resend?: { api_key: string };
    gmail?: { email: string; app_password: string };
    slack?: { webhook_url: string };
    notion?: { token: string };
    airtable?: { api_key: string };
    discord?: { webhook_url: string };
    hubspot?: { api_key: string };
  };
  const [connections, setConnections] = useState<Connections>({});
  const [connSaving, setConnSaving] = useState(false);
  const [connSuccess, setConnSuccess] = useState("");
  const [gmailTestStatus, setGmailTestStatus] = useState<"idle"|"loading"|"ok"|"error">("idle");
  const [gmailTestMsg, setGmailTestMsg] = useState("");

  const userPlan = (session?.user as { plan?: string })?.plan || "free";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/user/connections").then(r => r.ok ? r.json() : {}).then(setConnections).catch(() => {});
  }, []);

  async function testGmailConnection() {
    setGmailTestStatus("loading");
    setGmailTestMsg("");
    // Sauvegarder d'abord pour tester les dernières valeurs
    await fetch("/api/user/connections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(connections),
    });
    const res = await fetch("/api/user/connections/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: "gmail" }),
    });
    const data = await res.json() as { ok: boolean; message?: string; error?: string };
    setGmailTestStatus(data.ok ? "ok" : "error");
    setGmailTestMsg(data.ok ? (data.message || "Connexion réussie !") : (data.error || "Échec"));
  }

  async function saveConnections() {
    setConnSaving(true);
    await fetch("/api/user/connections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(connections),
    });
    setConnSaving(false);
    setConnSuccess("Connexions sauvegardées !");
    setTimeout(() => setConnSuccess(""), 3000);
  }

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
    border:"1.5px solid rgba(0,0,0,0.08)", borderRadius:10,
    fontSize:".9rem", fontFamily:"inherit",
    outline:"none", background:"rgba(255,255,255,0.82)", color:"#0A0A0A",
    backdropFilter:"blur(12px)",
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
        body { font-family:'Plus Jakarta Sans',sans-serif; }
        input:focus { border-color:#4F46E5 !important; box-shadow:0 0 0 3px #EEF2FF !important; }
        .burger-btn { display:none; background:none; border:none; cursor:pointer; color:#0A0A0A; padding:.4rem; border-radius:8px; }
        .mobile-menu { display:none; position:fixed; top:57px; left:0; right:0; bottom:0; z-index:99; flex-direction:column; }
        .mobile-menu.open { display:flex; }
        .mobile-menu-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.3); }
        .mobile-menu-panel { position:relative; background:#fff; border-bottom:1px solid #E5E7EB; padding:.75rem; display:flex; flex-direction:column; gap:.25rem; box-shadow:0 8px 32px rgba(0,0,0,.12); }
        .mobile-menu-panel a, .mobile-menu-panel button { display:block; font-size:.9rem; font-weight:500; color:#0A0A0A; text-decoration:none; padding:.7rem .85rem; border-radius:10px; border:none; background:none; cursor:pointer; font-family:inherit; width:100%; text-align:left; }
        .mobile-menu-panel a:hover, .mobile-menu-panel button:hover { background:rgba(99,102,241,.06); }
        @media (max-width: 768px) {
          .settings-main { padding: 1.5rem 1rem !important; }
          .settings-grid { grid-template-columns: 1fr !important; }
          .settings-nav { padding: .75rem 1rem !important; }
          .settings-nav-links { display: none !important; }
          .settings-logout-desktop { display: none !important; }
          .burger-btn { display:flex !important; align-items:center; }
        }
      `}</style>

      <nav className="settings-nav glass-nav" style={{ padding:"1rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"2rem" }}>
          <Logo />
          <div className="settings-nav-links" style={{ display:"flex", gap:".25rem" }}>
            {[{ label:"Dashboard", href:"/dashboard" }, { label:"Paramètres", href:"/dashboard/settings" }].map(item => (
              <a key={item.label} href={item.href} style={{ fontSize:".85rem", color: item.href === "/dashboard/settings" ? "#4F46E5" : "#6B7280", textDecoration:"none", padding:".4rem .75rem", borderRadius:"8px", fontWeight: item.href === "/dashboard/settings" ? 700 : 500, background: item.href === "/dashboard/settings" ? "#EEF2FF" : "none" }}>{item.label}</a>
            ))}
          </div>
        </div>
        <button className="settings-logout-desktop" onClick={() => signOut({ callbackUrl: "/login" })} style={{ fontSize:".82rem", fontWeight:600, color:"#DC2626", background:"linear-gradient(145deg,rgba(255,255,255,0.90),rgba(254,242,242,0.85))", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:"1.5px solid rgba(254,202,202,0.85)", padding:".4rem .9rem", borderRadius:"9px", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 8px rgba(220,38,38,0.08), inset 0 1.5px 0 rgba(255,255,255,1)" }}>
          Déconnexion
        </button>
        <button className="burger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg> : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>}
        </button>
      </nav>
      {mobileMenuOpen && (
        <div className="mobile-menu open">
          <div className="mobile-menu-backdrop" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-menu-panel">
            {[{ label:"Dashboard", href:"/dashboard" }, { label:"Templates", href:"/dashboard/templates" }, { label:"Historique", href:"/dashboard/executions" }, { label:"Paramètres", href:"/dashboard/settings" }, { label:"Support", href:"/dashboard/support" }].map(item => (
              <a key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)}>{item.label}</a>
            ))}
            <div style={{ height:1, background:"#E5E7EB", margin:".25rem 0" }} />
            <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ color:"#DC2626" }}>Déconnexion</button>
          </div>
        </div>
      )}

      <main className="settings-main" style={{ maxWidth:"640px", margin:"0 auto", padding:"3rem 2rem" }}>
        <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:"2rem" }}>Paramètres</h1>

        {/* Plan actuel */}
        <div className="glass-card" style={{ borderRadius:14, padding:"1.5rem", marginBottom:"1.5rem" }}>
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
        <div className="glass-card" style={{ borderRadius:14, padding:"1.5rem", marginBottom:"1.5rem" }}>
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

          <button onClick={handleUpdateProfile} disabled={profileLoading} style={{ padding:".7rem 1.5rem", borderRadius:9, fontSize:".875rem", fontWeight:700, background: profileLoading ? "#9CA3AF" : "linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", border:"none", cursor: profileLoading ? "not-allowed" : "pointer", fontFamily:"inherit", boxShadow: profileLoading ? "none" : "0 4px 16px rgba(99,102,241,0.35)" }}>
            {profileLoading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>

        {/* Mot de passe */}
        <div className="glass-card" style={{ borderRadius:14, padding:"1.5rem", marginBottom:"1.5rem" }}>
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

          <button onClick={handleUpdatePassword} disabled={passwordLoading} style={{ padding:".7rem 1.5rem", borderRadius:9, fontSize:".875rem", fontWeight:700, background: passwordLoading ? "#9CA3AF" : "linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", border:"none", cursor: passwordLoading ? "not-allowed" : "pointer", fontFamily:"inherit", boxShadow: passwordLoading ? "none" : "0 4px 16px rgba(99,102,241,0.35)" }}>
            {passwordLoading ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </div>

        {/* Connexions */}
        <div className="glass-card" style={{ borderRadius:14, padding:"1.5rem" }}>
          <h2 style={{ fontSize:"1rem", fontWeight:700, marginBottom:".3rem" }}>Connexions</h2>
          <p style={{ fontSize:".85rem", color:"#6B7280", marginBottom:"1.5rem" }}>
            Connectez vos services pour que Loopflo les utilise automatiquement dans vos workflows.
          </p>

          {/* Resend — envoi email recommandé */}
          <div style={{ marginBottom:"1.5rem", paddingBottom:"1.5rem", borderBottom:"1px solid #F3F4F6" }}>
            <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:".75rem" }}>
              <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#000,#1a1a1a)", border:"1px solid #333", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p style={{ fontWeight:700, fontSize:".9rem" }}>Resend</p>
              <span style={{ fontSize:".68rem", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", padding:".15rem .55rem", borderRadius:100, fontWeight:700 }}>Recommandé</span>
              {connections.resend?.api_key && <span style={{ fontSize:".7rem", background:"#ECFDF5", color:"#059669", border:"1px solid #A7F3D0", padding:".15rem .5rem", borderRadius:100, fontWeight:700 }}>Connecté</span>}
            </div>
            <input
              style={inputStyle}
              type="password"
              placeholder="Clé API Resend (re_xxxxxxxxxxxxxxxx)"
              value={connections.resend?.api_key || ""}
              onChange={e => setConnections(c => ({ ...c, resend: { api_key: e.target.value } }))}
            />
            <p style={{ fontSize:".72rem", color:"#6B7280", marginTop:".4rem", lineHeight:1.6 }}>
              <strong>3000 emails/mois gratuits.</strong> Obtenez votre clé en 30 secondes sur{" "}
              <a href="https://resend.com" target="_blank" rel="noopener noreferrer" style={{ color:"#4F46E5", fontWeight:600 }}>resend.com</a>{" "}
              → Dashboard → API Keys → Create API Key.
            </p>
          </div>

          {/* Gmail */}
          <div style={{ marginBottom:"1.5rem", paddingBottom:"1.5rem", borderBottom:"1px solid #F3F4F6" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:".75rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:".5rem" }}>
                <div style={{ width:28, height:28, borderRadius:7, background:"#FEF2F2", border:"1px solid #FECACA", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#DC2626" strokeWidth="1.5"/><path d="M22 6l-10 7L2 6" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <p style={{ fontWeight:700, fontSize:".9rem" }}>Gmail</p>
                <span style={{ fontSize:".68rem", color:"#6B7280", background:"#F3F4F6", padding:".15rem .55rem", borderRadius:100, fontWeight:600 }}>Optionnel</span>
                {connections.gmail?.email && <span style={{ fontSize:".7rem", background:"#ECFDF5", color:"#059669", border:"1px solid #A7F3D0", padding:".15rem .5rem", borderRadius:100, fontWeight:700 }}>Connecté</span>}
              </div>
              {connections.gmail?.email && connections.gmail?.app_password && (
                <button
                  onClick={testGmailConnection}
                  disabled={gmailTestStatus === "loading"}
                  style={{ fontSize:".75rem", fontWeight:600, padding:".3rem .75rem", borderRadius:7, border:"1.5px solid rgba(99,102,241,0.3)", background:"linear-gradient(145deg,rgba(255,255,255,0.92),rgba(238,242,255,0.85))", backdropFilter:"blur(12px)", color:"#4F46E5", cursor: gmailTestStatus === "loading" ? "not-allowed" : "pointer", fontFamily:"inherit" }}
                >
                  {gmailTestStatus === "loading" ? "Test en cours…" : "Tester la connexion"}
                </button>
              )}
            </div>
            {gmailTestStatus !== "idle" && (
              <div style={{ marginBottom:".75rem", padding:".5rem .75rem", borderRadius:8, fontSize:".78rem", fontWeight:600, background: gmailTestStatus === "ok" ? "#ECFDF5" : "#FEF2F2", color: gmailTestStatus === "ok" ? "#059669" : "#DC2626", border: `1px solid ${gmailTestStatus === "ok" ? "#A7F3D0" : "#FECACA"}` }}>
                {gmailTestStatus === "ok" ? "✓ " : "✗ "}{gmailTestMsg}
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:".6rem" }}>
              <input style={inputStyle} placeholder="Votre adresse Gmail (ex: vous@gmail.com)" value={connections.gmail?.email || ""} onChange={e => { setGmailTestStatus("idle"); setConnections(c => ({ ...c, gmail: { ...c.gmail, email: e.target.value, app_password: c.gmail?.app_password || "" } })); }} />
              <input style={inputStyle} type="password" placeholder="Mot de passe d'application (16 caractères)" value={connections.gmail?.app_password || ""} onChange={e => { setGmailTestStatus("idle"); setConnections(c => ({ ...c, gmail: { email: c.gmail?.email || "", app_password: e.target.value } })); }} />
              <div style={{ fontSize:".72rem", color:"#6B7280", lineHeight:1.7 }}>
                Uniquement pour <strong>lire vos emails</strong> (bloc Lire emails) via IMAP. Pour l&apos;envoi, utilisez <strong>Resend</strong> ci-dessus.<br/>
                <span style={{ color:"#DC2626", fontWeight:600 }}>Étape 1 —</span> Activez l&apos;accès IMAP : <strong>Gmail → Paramètres → Voir tous les paramètres → Transfert et POP/IMAP → Activer IMAP</strong><br/>
                <span style={{ color:"#DC2626", fontWeight:600 }}>Étape 2 —</span> Créez un mot de passe d&apos;application (16 caractères) : <strong>myaccount.google.com → Sécurité → Mots de passe des applications</strong>
              </div>
            </div>
          </div>

          {/* Slack */}
          <div style={{ marginBottom:"1.5rem", paddingBottom:"1.5rem", borderBottom:"1px solid #F3F4F6" }}>
            <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:".75rem" }}>
              <div style={{ width:28, height:28, borderRadius:7, background:"#FDF4FF", border:"1px solid #E9D5FF", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="#7C3AED" strokeWidth="1.5"/><path d="M8 12h8M12 8v8" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <p style={{ fontWeight:700, fontSize:".9rem" }}>Slack</p>
              {connections.slack?.webhook_url && <span style={{ fontSize:".7rem", background:"#ECFDF5", color:"#059669", border:"1px solid #A7F3D0", padding:".15rem .5rem", borderRadius:100, fontWeight:700 }}>Connecté</span>}
            </div>
            <input style={inputStyle} placeholder="URL Webhook Slack (https://hooks.slack.com/services/...)" value={connections.slack?.webhook_url || ""} onChange={e => setConnections(c => ({ ...c, slack: { webhook_url: e.target.value } }))} />
            <p style={{ fontSize:".72rem", color:"#9CA3AF", marginTop:".4rem" }}>Créez un webhook sur api.slack.com → Your apps → Incoming Webhooks</p>
          </div>

          {/* Notion */}
          <div style={{ marginBottom:"1.5rem", paddingBottom:"1.5rem", borderBottom:"1px solid #F3F4F6" }}>
            <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:".75rem" }}>
              <div style={{ width:28, height:28, borderRadius:7, background:"#F9FAFB", border:"1px solid #E5E7EB", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#0A0A0A" strokeWidth="1.5"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <p style={{ fontWeight:700, fontSize:".9rem" }}>Notion</p>
              {connections.notion?.token && <span style={{ fontSize:".7rem", background:"#ECFDF5", color:"#059669", border:"1px solid #A7F3D0", padding:".15rem .5rem", borderRadius:100, fontWeight:700 }}>Connecté</span>}
            </div>
            <input style={inputStyle} placeholder="Token d'intégration Notion (secret_...)" value={connections.notion?.token || ""} onChange={e => setConnections(c => ({ ...c, notion: { token: e.target.value } }))} />
            <p style={{ fontSize:".72rem", color:"#9CA3AF", marginTop:".4rem" }}>Créez une intégration sur notion.so/my-integrations et partagez vos bases avec elle</p>
          </div>

          {/* Airtable */}
          <div style={{ marginBottom:"1.5rem", paddingBottom:"1.5rem", borderBottom:"1px solid #F3F4F6" }}>
            <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:".75rem" }}>
              <div style={{ width:28, height:28, borderRadius:7, background:"#EFF9FF", border:"1px solid #BAE9FF", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="4" rx="1" stroke="#18BFFF" strokeWidth="1.5"/><rect x="3" y="10" width="8" height="4" rx="1" stroke="#18BFFF" strokeWidth="1.5"/><rect x="3" y="17" width="12" height="4" rx="1" stroke="#18BFFF" strokeWidth="1.5"/></svg>
              </div>
              <p style={{ fontWeight:700, fontSize:".9rem" }}>Airtable</p>
              {connections.airtable?.api_key && <span style={{ fontSize:".7rem", background:"#ECFDF5", color:"#059669", border:"1px solid #A7F3D0", padding:".15rem .5rem", borderRadius:100, fontWeight:700 }}>Connecté</span>}
            </div>
            <input style={inputStyle} placeholder="Personal Access Token (patXXXXXXXX...)" value={connections.airtable?.api_key || ""} onChange={e => setConnections(c => ({ ...c, airtable: { api_key: e.target.value } }))} />
            <p style={{ fontSize:".72rem", color:"#9CA3AF", marginTop:".4rem" }}>Générez un token sur airtable.com/create/tokens</p>
          </div>

          {/* Discord */}
          <div style={{ marginBottom:"1.5rem", paddingBottom:"1.5rem", borderBottom:"1px solid #F3F4F6" }}>
            <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:".75rem" }}>
              <div style={{ width:28, height:28, borderRadius:7, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037 13.84 13.84 0 00-.605 1.245 18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.245.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" fill="#5865F2"/></svg>
              </div>
              <p style={{ fontWeight:700, fontSize:".9rem" }}>Discord</p>
              {connections.discord?.webhook_url && <span style={{ fontSize:".7rem", background:"#ECFDF5", color:"#059669", border:"1px solid #A7F3D0", padding:".15rem .5rem", borderRadius:100, fontWeight:700 }}>Connecté</span>}
            </div>
            <input style={inputStyle} placeholder="URL Webhook Discord (https://discord.com/api/webhooks/...)" value={connections.discord?.webhook_url || ""} onChange={e => setConnections(c => ({ ...c, discord: { webhook_url: e.target.value } }))} />
            <p style={{ fontSize:".72rem", color:"#9CA3AF", marginTop:".4rem" }}>Paramètres du salon Discord → Intégrations → Webhooks</p>
          </div>

          {/* HubSpot */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:".75rem" }}>
              <div style={{ width:28, height:28, borderRadius:7, background:"#FFF7ED", border:"1px solid #FED7AA", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#F97316" strokeWidth="1.5"/><path d="M8 12h8M12 8v8" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <p style={{ fontWeight:700, fontSize:".9rem" }}>HubSpot</p>
              {connections.hubspot?.api_key && <span style={{ fontSize:".7rem", background:"#ECFDF5", color:"#059669", border:"1px solid #A7F3D0", padding:".15rem .5rem", borderRadius:100, fontWeight:700 }}>Connecté</span>}
            </div>
            <input style={inputStyle} placeholder="Clé API HubSpot (Private App Token)" value={connections.hubspot?.api_key || ""} onChange={e => setConnections(c => ({ ...c, hubspot: { api_key: e.target.value } }))} />
            <p style={{ fontSize:".72rem", color:"#9CA3AF", marginTop:".4rem" }}>Créez une Private App sur app.hubspot.com → Paramètres → Intégrations</p>
          </div>

          <div style={{ marginTop:"1.5rem", display:"flex", alignItems:"center", gap:"1rem" }}>
            <button onClick={saveConnections} disabled={connSaving} style={{ padding:".7rem 1.5rem", borderRadius:9, fontSize:".875rem", fontWeight:700, background: connSaving ? "#9CA3AF" : "linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", border:"none", cursor: connSaving ? "not-allowed" : "pointer", fontFamily:"inherit", boxShadow: connSaving ? "none" : "0 4px 16px rgba(99,102,241,0.35)" }}>
              {connSaving ? "Sauvegarde..." : "Sauvegarder les connexions"}
            </button>
            {connSuccess && <span style={{ fontSize:".85rem", color:"#059669", fontWeight:600 }}>{connSuccess}</span>}
          </div>
        </div>

        {/* Danger zone */}
        <div className="glass-card" style={{ border:"1px solid #FECACA", borderRadius:14, padding:"1.5rem" }}>
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