"use client";

import { useEffect, useState, useCallback } from "react";
import AdminNavLinks from "@/components/AdminNavLinks";

type SystemSettings = {
  maintenance_mode: boolean;
  maintenance_message: string;
  maintenance_eta: string;
  global_banner_enabled: boolean;
  global_banner_text: string;
  global_banner_type: "info" | "warning" | "error";
  disabled_integrations: string[];
};

const ALL_INTEGRATIONS = [
  { id: "gmail",        label: "Gmail",         icon: "📧" },
  { id: "gmail_oauth",  label: "Gmail OAuth",   icon: "📧" },
  { id: "slack",        label: "Slack",         icon: "💬" },
  { id: "notion",       label: "Notion",        icon: "📝" },
  { id: "airtable",     label: "Airtable",      icon: "📊" },
  { id: "sheets",       label: "Google Sheets", icon: "📈" },
  { id: "discord",      label: "Discord",       icon: "🎮" },
  { id: "telegram",     label: "Telegram",      icon: "✈️" },
  { id: "hubspot",      label: "HubSpot",       icon: "🔶" },
  { id: "whatsapp",     label: "WhatsApp",      icon: "🟢" },
  { id: "stripe",       label: "Stripe",        icon: "💳" },
  { id: "resend",       label: "Resend Email",  icon: "📨" },
  { id: "stability",    label: "Stability AI",  icon: "🎨" },
  { id: "gemini",       label: "Gemini AI",     icon: "✨" },
  { id: "elevenlabs",   label: "ElevenLabs",    icon: "🎙️" },
  { id: "groq",         label: "Groq (IA)",     icon: "🤖" },
  { id: "http",         label: "HTTP Request",  icon: "🌐" },
  { id: "webhook",      label: "Webhook",       icon: "🔗" },
  { id: "rss",          label: "RSS Feed",      icon: "📡" },
  { id: "github",       label: "GitHub",        icon: "🐙" },
  { id: "typeform",     label: "Typeform",      icon: "📋" },
  { id: "twitter",      label: "Twitter / X",   icon: "🐦" },
];

export default function AdminSystemPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved]   = useState<string | null>(null);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/system");
    if (res.ok) setSettings(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(key: keyof SystemSettings, value: SystemSettings[keyof SystemSettings]) {
    setSaving(key);
    setError(null);
    const res = await fetch("/api/admin/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) {
      setSettings(prev => prev ? { ...prev, [key]: value } : prev);
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } else {
      setError("Erreur lors de la sauvegarde");
    }
    setSaving(null);
  }

  function toggleIntegration(id: string) {
    if (!settings) return;
    const current = settings.disabled_integrations;
    const next = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id];
    save("disabled_integrations", next);
  }

  if (!settings) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"rgba(255,255,255,0.4)", fontSize:".9rem" }}>
        Chargement…
      </div>
    );
  }

  const sectionTitle = (title: string) => (
    <p style={{ fontSize:".72rem", fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:".06em", marginBottom:"1rem" }}>
      {title}
    </p>
  );

  const card = (children: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{ background:"var(--c-card)", border:"1px solid var(--c-border)", borderRadius:14, padding:"1.5rem", ...extra }}>
      {children}
    </div>
  );

  const savedBadge = (key: string) => saved === key ? (
    <span style={{ fontSize:".72rem", fontWeight:700, color:"#059669", background:"#ECFDF5", border:"1px solid #A7F3D0", padding:".15rem .5rem", borderRadius:100, marginLeft:".5rem" }}>
      Sauvegardé ✓
    </span>
  ) : null;

  const inputStyle: React.CSSProperties = {
    width:"100%", padding:".6rem .85rem", borderRadius:8,
    border:"1px solid var(--c-border)", fontSize:".85rem",
    background:"var(--c-bg)", color:"var(--c-text)",
    fontFamily:"inherit", outline:"none", boxSizing:"border-box",
  };

  const btnSave = (key: string, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={saving === key}
      style={{ padding:".5rem 1.25rem", borderRadius:8, fontSize:".82rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", border:"none", cursor:"pointer", fontFamily:"inherit", opacity: saving === key ? 0.6 : 1 }}
    >
      {saving === key ? "…" : "Sauvegarder"}
    </button>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--c-bg)}
        .toggle{position:relative;display:inline-block;width:44px;height:24px}
        .toggle input{opacity:0;width:0;height:0}
        .slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#374151;border-radius:24px;transition:.2s}
        .slider:before{position:absolute;content:"";height:18px;width:18px;left:3px;bottom:3px;background:white;border-radius:50%;transition:.2s}
        input:checked+.slider{background:#6366F1}
        input:checked+.slider:before{transform:translateX(20px)}
      `}</style>

      {/* Nav */}
      <nav style={{
        background:"rgba(15,10,40,0.97)", backdropFilter:"blur(16px)",
        borderBottom:"1px solid rgba(129,140,248,0.2)", padding:"0 2rem",
        display:"flex", alignItems:"stretch", justifyContent:"space-between",
        fontFamily:"'Plus Jakarta Sans',sans-serif", position:"sticky", top:0, zIndex:100,
      }}>
        <div style={{ display:"flex", alignItems:"stretch", gap:0 }}>
          <div style={{ display:"flex", alignItems:"center", paddingRight:"1.5rem", marginRight:".5rem", borderRight:"1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontWeight:900, fontSize:"1.15rem", color:"#fff", letterSpacing:"-0.03em" }}>
              Loop<span style={{ color:"#818CF8" }}>flo</span>
            </span>
            <span style={{ marginLeft:".5rem", fontSize:".6rem", fontWeight:800, color:"#818CF8", background:"rgba(129,140,248,0.2)", border:"1px solid rgba(129,140,248,0.4)", padding:".2rem .55rem", borderRadius:"100px", letterSpacing:".1em", textTransform:"uppercase" }}>Admin</span>
          </div>
          <AdminNavLinks />
        </div>
      </nav>

      <main style={{ maxWidth:960, margin:"0 auto", padding:"2rem 1.5rem", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

        <div style={{ marginBottom:"1.75rem" }}>
          <h1 style={{ fontSize:"1.5rem", fontWeight:800, letterSpacing:"-.03em", marginBottom:".3rem", color:"var(--c-text)" }}>⚙️ Contrôles Système</h1>
          <p style={{ fontSize:".82rem", color:"#6B7280" }}>Maintenance, bannière, kill switches par intégration</p>
        </div>

        {error && (
          <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:".75rem 1rem", marginBottom:"1rem", fontSize:".85rem", color:"#DC2626" }}>
            {error}
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>

          {/* ─── MAINTENANCE ─── */}
          {card(<>
            {sectionTitle("Mode Maintenance")}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" }}>
              <div>
                <p style={{ fontWeight:700, color:"var(--c-text)", marginBottom:".2rem" }}>Activer le mode maintenance</p>
                <p style={{ fontSize:".8rem", color:"#6B7280" }}>Redirige tous les utilisateurs (hors admin) vers /maintenance</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={settings.maintenance_mode} onChange={e => save("maintenance_mode", e.target.checked)} />
                <span className="slider" />
              </label>
            </div>

            {settings.maintenance_mode && (
              <div style={{ background:"#FEF9C3", border:"1px solid #FDE68A", borderRadius:8, padding:".65rem 1rem", marginBottom:"1.25rem", fontSize:".8rem", color:"#92400E", fontWeight:600 }}>
                ⚠️ Mode maintenance actif — les utilisateurs ne peuvent pas accéder au dashboard
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:".85rem" }}>
              <div>
                <label style={{ fontSize:".78rem", fontWeight:600, color:"#6B7280", display:"block", marginBottom:".35rem" }}>
                  Message affiché aux utilisateurs {savedBadge("maintenance_message")}
                </label>
                <div style={{ display:"flex", gap:".75rem" }}>
                  <input
                    style={inputStyle}
                    value={settings.maintenance_message}
                    onChange={e => setSettings(prev => prev ? {...prev, maintenance_message: e.target.value} : prev)}
                    placeholder="Maintenance en cours, nous revenons bientôt…"
                  />
                  {btnSave("maintenance_message", () => save("maintenance_message", settings.maintenance_message))}
                </div>
              </div>

              <div>
                <label style={{ fontSize:".78rem", fontWeight:600, color:"#6B7280", display:"block", marginBottom:".35rem" }}>
                  Retour estimé (optionnel, ex: &quot;30 minutes&quot;, &quot;demain 9h&quot;) {savedBadge("maintenance_eta")}
                </label>
                <div style={{ display:"flex", gap:".75rem" }}>
                  <input
                    style={inputStyle}
                    value={settings.maintenance_eta}
                    onChange={e => setSettings(prev => prev ? {...prev, maintenance_eta: e.target.value} : prev)}
                    placeholder="Ex: 30 minutes"
                  />
                  {btnSave("maintenance_eta", () => save("maintenance_eta", settings.maintenance_eta))}
                </div>
              </div>
            </div>
          </>)}

          {/* ─── GLOBAL BANNER ─── */}
          {card(<>
            {sectionTitle("Bannière Globale Dashboard")}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" }}>
              <div>
                <p style={{ fontWeight:700, color:"var(--c-text)", marginBottom:".2rem" }}>Afficher la bannière</p>
                <p style={{ fontSize:".8rem", color:"#6B7280" }}>Affiche un message en haut de toutes les pages du dashboard</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={settings.global_banner_enabled} onChange={e => save("global_banner_enabled", e.target.checked)} />
                <span className="slider" />
              </label>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:".85rem" }}>
              <div>
                <label style={{ fontSize:".78rem", fontWeight:600, color:"#6B7280", display:"block", marginBottom:".35rem" }}>
                  Message de la bannière {savedBadge("global_banner_text")}
                </label>
                <div style={{ display:"flex", gap:".75rem" }}>
                  <input
                    style={inputStyle}
                    value={settings.global_banner_text}
                    onChange={e => setSettings(prev => prev ? {...prev, global_banner_text: e.target.value} : prev)}
                    placeholder="Ex: Nouvelle fonctionnalité disponible : IA générative !"
                  />
                  {btnSave("global_banner_text", () => save("global_banner_text", settings.global_banner_text))}
                </div>
              </div>

              <div>
                <label style={{ fontSize:".78rem", fontWeight:600, color:"#6B7280", display:"block", marginBottom:".35rem" }}>
                  Type de bannière {savedBadge("global_banner_type")}
                </label>
                <div style={{ display:"flex", gap:".75rem", alignItems:"center" }}>
                  {(["info","warning","error"] as const).map(type => {
                    const colors = {
                      info:    { bg:"#EEF2FF", border:"#818CF8", text:"#4338CA", label:"Info" },
                      warning: { bg:"#FFFBEB", border:"#F59E0B", text:"#92400E", label:"Avertissement" },
                      error:   { bg:"#FEF2F2", border:"#F87171", text:"#991B1B", label:"Erreur" },
                    };
                    const c = colors[type];
                    return (
                      <button
                        key={type}
                        onClick={() => save("global_banner_type", type)}
                        style={{
                          padding:".4rem .9rem", borderRadius:8, fontSize:".8rem", fontWeight:700,
                          background: settings.global_banner_type === type ? c.bg : "var(--c-hover)",
                          border: `1px solid ${settings.global_banner_type === type ? c.border : "var(--c-border)"}`,
                          color: settings.global_banner_type === type ? c.text : "#6B7280",
                          cursor:"pointer", fontFamily:"inherit",
                        }}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              {settings.global_banner_enabled && settings.global_banner_text && (() => {
                const colors = {
                  info:    { bg:"#EEF2FF", border:"#818CF8", text:"#4338CA" },
                  warning: { bg:"#FFFBEB", border:"#F59E0B", text:"#92400E" },
                  error:   { bg:"#FEF2F2", border:"#F87171", text:"#991B1B" },
                };
                const c = colors[settings.global_banner_type];
                return (
                  <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:8, padding:".6rem 1rem", fontSize:".82rem", fontWeight:600, color:c.text, textAlign:"center" }}>
                    {settings.global_banner_text}
                  </div>
                );
              })()}
            </div>
          </>)}

          {/* ─── KILL SWITCHES ─── */}
          {card(<>
            {sectionTitle(`Kill Switches Intégrations — ${settings.disabled_integrations.length} désactivée(s)`)}
            <p style={{ fontSize:".82rem", color:"#6B7280", marginBottom:"1.25rem", lineHeight:1.6 }}>
              Désactivez une intégration globalement. Les workflows qui tentent de l&apos;utiliser recevront une erreur claire.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:".75rem" }}>
              {ALL_INTEGRATIONS.map(integ => {
                const disabled = settings.disabled_integrations.includes(integ.id);
                return (
                  <div
                    key={integ.id}
                    onClick={() => toggleIntegration(integ.id)}
                    style={{
                      display:"flex", alignItems:"center", gap:".75rem",
                      padding:".75rem 1rem", borderRadius:10, cursor:"pointer",
                      background: disabled ? "#FEF2F2" : "var(--c-hover)",
                      border: `1px solid ${disabled ? "#FECACA" : "var(--c-border)"}`,
                      transition:"all .15s",
                    }}
                  >
                    <span style={{ fontSize:"1.1rem" }}>{integ.icon}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:".82rem", fontWeight:600, color: disabled ? "#DC2626" : "var(--c-text)" }}>{integ.label}</p>
                      <p style={{ fontSize:".68rem", color: disabled ? "#F87171" : "#9CA3AF", fontWeight:600 }}>
                        {disabled ? "DÉSACTIVÉ" : "actif"}
                      </p>
                    </div>
                    <div style={{
                      width:10, height:10, borderRadius:"50%",
                      background: disabled ? "#DC2626" : "#059669",
                      flexShrink:0,
                    }} />
                  </div>
                );
              })}
            </div>
            {settings.disabled_integrations.length > 0 && (
              <div style={{ marginTop:"1rem", display:"flex", justifyContent:"flex-end" }}>
                <button
                  onClick={() => save("disabled_integrations", [])}
                  style={{ padding:".45rem 1rem", borderRadius:8, fontSize:".78rem", fontWeight:600, background:"#FEF2F2", border:"1px solid #FECACA", color:"#DC2626", cursor:"pointer", fontFamily:"inherit" }}
                >
                  Réactiver tout
                </button>
              </div>
            )}
          </>)}

        </div>
      </main>
    </>
  );
}
