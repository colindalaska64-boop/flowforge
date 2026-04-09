"use client";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Logo from "@/components/Logo";

const faqs = [
  { q: "Comment créer mon premier workflow ?", a: "Allez dans 'Nouveau workflow', glissez un déclencheur depuis la barre latérale (ex: Webhook ou Planifié), ajoutez des actions (Gmail, Slack, etc.) et reliez-les. Cliquez sur 'Activer' pour le mettre en marche." },
  { q: "Pourquoi mon workflow ne s'exécute pas ?", a: "Vérifiez que le workflow est bien activé. Pour les webhooks, assurez-vous d'envoyer une requête à l'URL affichée dans l'éditeur. Pour les workflows planifiés, la vérification se fait une fois par heure." },
  { q: "Comment utiliser les variables entre blocs ?", a: "Utilisez la syntaxe {{nom_variable}} dans les champs. Cliquez sur le bouton '{}' à côté d'un champ pour voir toutes les variables disponibles depuis les blocs précédents." },
  { q: "Les blocs IA ne fonctionnent pas sur mon plan Free.", a: "Les blocs IA (Filtre IA, Générer texte) sont réservés au plan Pro et supérieur. Passez en Pro depuis la page Tarifs pour débloquer ces fonctionnalités." },
  { q: "Comment connecter Gmail / Slack / Notion ?", a: "Allez dans Paramètres → section Connexions. Pour Gmail, entrez votre adresse et un mot de passe d'application Google. Pour Slack, entrez l'URL de votre webhook entrant. Pour Notion, entrez votre token d'intégration." },
  { q: "Mes données sont-elles sécurisées ?", a: "Oui. Toutes les données sont chiffrées en transit (TLS 1.3) et stockées de façon sécurisée. Nous sommes conformes RGPD et ne revendons aucune donnée." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(o => !o)} style={{ borderBottom:"1px solid rgba(243,244,246,0.8)", cursor:"pointer", transition:"background .2s" }}>
      <div style={{ padding:"1rem 0", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem" }}>
        <span style={{ fontSize:".9rem", fontWeight:600, color:"#0A0A0A" }}>{q}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, transform:open?"rotate(180deg)":"rotate(0deg)", transition:"transform .2s" }}>
          <path d="M3 6l5 5 5-5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {open && <div style={{ paddingBottom:"1rem", paddingLeft:".5rem", fontSize:".875rem", color:"#4B5563", lineHeight:1.75, borderLeft:"2px solid rgba(99,102,241,0.25)", marginLeft:".25rem" }}>{a}</div>}
    </div>
  );
}

export default function SupportPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const userPlan = (session?.user as { plan?: string })?.plan || "free";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const supportLevels = [
    { plan:"Free", title:"Support communauté", desc:"Accès aux FAQ et documentation.", time:"", color:"#6B7280", bg:"#F9FAFB", border:"#E5E7EB" },
    { plan:"Starter", title:"Email prioritaire", desc:"Réponse sous 24h par email.", time:"< 24h", color:"#6366F1", bg:"#EEF2FF", border:"#C7D2FE" },
    { plan:"Pro", title:"Chat en direct", desc:"Réponse rapide via chat.", time:"< 4h", color:"#0284C7", bg:"#F0F9FF", border:"#BAE6FD" },
    { plan:"Business", title:"Support dédié", desc:"Un interlocuteur dédié et un SLA garanti.", time:"< 1h", color:"#059669", bg:"#ECFDF5", border:"#A7F3D0" },
  ];

  const currentLevel = supportLevels.find(s => s.plan.toLowerCase() === userPlan) || supportLevels[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
        .support-input:focus { border-color:#6366F1 !important; box-shadow:0 0 0 3px rgba(99,102,241,.1); outline:none; }
        .burger-btn { display:none; background:none; border:none; cursor:pointer; color:#0A0A0A; padding:.4rem; border-radius:8px; }
        .mobile-menu { display:none; position:fixed; top:57px; left:0; right:0; bottom:0; z-index:99; flex-direction:column; }
        .mobile-menu.open { display:flex; }
        .mobile-menu-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.3); }
        .mobile-menu-panel { position:relative; background:#fff; border-bottom:1px solid #E5E7EB; padding:.75rem; display:flex; flex-direction:column; gap:.25rem; box-shadow:0 8px 32px rgba(0,0,0,.12); }
        .mobile-menu-panel a, .mobile-menu-panel button { display:block; font-size:.9rem; font-weight:500; color:#0A0A0A; text-decoration:none; padding:.7rem .85rem; border-radius:10px; border:none; background:none; cursor:pointer; font-family:inherit; width:100%; text-align:left; }
        .mobile-menu-panel a:hover, .mobile-menu-panel button:hover { background:rgba(99,102,241,.06); }
        @media (max-width:768px) {
          .support-nav-links { display:none !important; }
          .support-nav { padding:.75rem 1rem !important; }
          .support-nav-right { display:none !important; }
          .burger-btn { display:flex !important; align-items:center; }
          .support-grid { grid-template-columns:repeat(2,1fr) !important; }
          .support-main { padding:1.5rem 1rem !important; }
          .support-level-bar { flex-direction:column !important; align-items:flex-start !important; }
        }
        @media (max-width:480px) {
          .support-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav className="support-nav glass-nav" style={{ padding:"1rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"2rem" }}>
          <Logo />
          <div className="support-nav-links" style={{ display:"flex", gap:".25rem" }}>
            {[
              { label:"Dashboard", href:"/dashboard" },
              { label:"Templates", href:"/dashboard/templates" },
              { label:"Historique", href:"/dashboard/executions" },
              { label:"Paramètres", href:"/dashboard/settings" },
              { label:"Support", href:"/dashboard/support" },
            ].map((item) => (
              <a key={item.label} href={item.href} style={{ fontSize:".85rem", color: item.label === "Support" ? "#6366F1" : "#6B7280", textDecoration:"none", padding:".4rem .75rem", borderRadius:"8px", fontWeight: item.label === "Support" ? 700 : 500, background: item.label === "Support" ? "#EEF2FF" : "none" }}>{item.label}</a>
            ))}
          </div>
        </div>
        <div className="support-nav-right" style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <div style={{ background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", fontSize:".72rem", fontWeight:700, padding:".25rem .7rem", borderRadius:"100px", textTransform:"uppercase", letterSpacing:".05em" }}>
            {userPlan}
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ fontSize:".82rem", fontWeight:600, color:"#DC2626", background:"linear-gradient(145deg,rgba(255,255,255,0.90),rgba(254,242,242,0.85))", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:"1.5px solid rgba(254,202,202,0.85)", padding:".4rem .9rem", borderRadius:"9px", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 8px rgba(220,38,38,0.08), inset 0 1.5px 0 rgba(255,255,255,1)" }}>
            Déconnexion
          </button>
        </div>
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

      <main className="support-main" style={{ maxWidth:860, margin:"0 auto", padding:"2.5rem 2rem" }}>

        {/* Header */}
        <div style={{ marginBottom:"2rem" }}>
          <p style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"#6366F1", marginBottom:".5rem" }}>Centre d&apos;aide</p>
          <h1 style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".4rem" }}>Comment pouvons-nous vous aider ?</h1>
          <p style={{ fontSize:".95rem", color:"#6B7280" }}>FAQ, contact et informations sur votre niveau de support.</p>
        </div>

        {/* Niveau de support actuel */}
        <div style={{ background:`${currentLevel.bg}`, border:`1px solid ${currentLevel.border}`, borderRadius:14, padding:"1.25rem 1.5rem", marginBottom:"2rem", display:"flex", alignItems:"center", gap:"1rem" }}>
          <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:".8rem", fontWeight:600, color:currentLevel.color, marginBottom:".15rem" }}>Votre niveau de support — Plan {currentLevel.plan}</p>
            <p style={{ fontSize:".9rem", fontWeight:700, color:"#0A0A0A" }}>{currentLevel.title} {currentLevel.time && <span style={{ fontSize:".78rem", fontWeight:600, color:currentLevel.color }}>({currentLevel.time})</span>}</p>
            <p style={{ fontSize:".82rem", color:"#6B7280" }}>{currentLevel.desc}</p>
          </div>
          {userPlan === "free" && (
            <a href="/pricing" style={{ fontSize:".8rem", fontWeight:700, color:"#fff", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", padding:".5rem 1rem", borderRadius:8, textDecoration:"none", whiteSpace:"nowrap", flexShrink:0 }}>
              Upgrader
            </a>
          )}
        </div>

        {/* Niveaux de support */}
        <div className="support-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", marginBottom:"2.5rem" }}>
          {supportLevels.map((s) => (
            <div key={s.plan} className="glass-card" style={{ background: `linear-gradient(145deg, rgba(255,255,255,0.90) 0%, ${s.bg}70 100%)`, backdropFilter:"blur(24px) saturate(180%)", WebkitBackdropFilter:"blur(24px) saturate(180%)", border:"1.5px solid rgba(255,255,255,0.92)", borderLeft:`3px solid ${s.color}`, borderRadius:12, padding:"1.25rem", position:"relative", boxShadow:"0 4px 16px rgba(0,0,0,0.07), inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.03)" }}>
              {s.plan.toLowerCase() === userPlan && (
                <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", fontSize:".62rem", fontWeight:700, color:"#fff", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", padding:".2rem .7rem", borderRadius:100, whiteSpace:"nowrap" }}>Votre plan</div>
              )}
              <p style={{ fontSize:".72rem", fontWeight:700, color:s.color, textTransform:"uppercase", letterSpacing:".08em", marginBottom:".5rem" }}>{s.plan}</p>
              <p style={{ fontSize:".85rem", fontWeight:700, color:"#0A0A0A", marginBottom:".25rem" }}>{s.title}</p>
              {s.time && <p style={{ fontSize:".75rem", fontWeight:600, color:s.color }}>{s.time}</p>}
              <p style={{ fontSize:".78rem", color:"#9CA3AF", marginTop:".25rem", lineHeight:1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginBottom:"2.5rem" }}>
          <h2 style={{ fontSize:"1.1rem", fontWeight:800, marginBottom:"1.25rem", letterSpacing:"-0.02em" }}>Questions fréquentes</h2>
          <div className="glass-card" style={{ borderRadius:14, padding:"0 1.5rem" }}>
            {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>

        {/* Contact */}
        <div className="glass-card" style={{ borderRadius:14, padding:"2rem" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1.5rem", gap:"1rem" }}>
            <div>
              <h2 style={{ fontSize:"1.1rem", fontWeight:800, letterSpacing:"-0.02em", marginBottom:".25rem" }}>Contacter le support</h2>
              <p style={{ fontSize:".85rem", color:"#6B7280" }}>Réponse sous 24h — prioritaire pour les plans Starter, Pro et Business.</p>
            </div>
            <a href="mailto:loopflo.contact@gmail.com" style={{ fontSize:".8rem", fontWeight:600, color:"#6366F1", textDecoration:"none", background:"#EEF2FF", padding:".4rem .85rem", borderRadius:8, whiteSpace:"nowrap", flexShrink:0, border:"1px solid #C7D2FE" }}>
              loopflo.contact@gmail.com
            </a>
          </div>

          {sent ? (
            <div style={{ background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:10, padding:"1rem 1.25rem", color:"#065F46", fontSize:".875rem", fontWeight:600, display:"flex", alignItems:"center", gap:".5rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Message envoyé ! On vous répond sous 24h.
            </div>
          ) : (
            <form onSubmit={async e => {
              e.preventDefault();
              setSending(true);
              setSendError("");
              try {
                const res = await fetch("/api/support", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(form),
                });
                if (res.ok) { setSent(true); }
                else { const d = await res.json(); setSendError(d.error || "Erreur lors de l'envoi."); }
              } catch { setSendError("Erreur réseau."); }
              finally { setSending(false); }
            }}>
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                <div>
                  <label style={{ fontSize:".8rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".35rem" }}>Sujet</label>
                  <input className="support-input" type="text" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Ex: Problème avec mon workflow Gmail" style={{ width:"100%", padding:".65rem 1rem", border:"1.5px solid rgba(0,0,0,0.08)", borderRadius:9, fontSize:".875rem", background:"rgba(255,255,255,0.82)", backdropFilter:"blur(12px)", fontFamily:"inherit", transition:"border-color .15s" }} />
                </div>
                <div>
                  <label style={{ fontSize:".8rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".35rem" }}>Message</label>
                  <textarea className="support-input" required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Décrivez votre problème en détail..." rows={5} style={{ width:"100%", padding:".65rem 1rem", border:"1.5px solid rgba(0,0,0,0.08)", borderRadius:9, fontSize:".875rem", background:"rgba(255,255,255,0.82)", backdropFilter:"blur(12px)", fontFamily:"inherit", resize:"vertical", transition:"border-color .15s" }} />
                </div>
                {sendError && <p style={{ fontSize:".82rem", color:"#DC2626", fontWeight:600 }}>{sendError}</p>}
                <button type="submit" disabled={sending} style={{ alignSelf:"flex-start", background: sending ? "#9CA3AF" : "linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", border:"none", borderRadius:9, padding:".7rem 1.75rem", fontSize:".875rem", fontWeight:700, cursor: sending ? "not-allowed" : "pointer", fontFamily:"inherit", boxShadow: sending ? "none" : "0 4px 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.25)" }}>
                  {sending ? "Envoi..." : "Envoyer le message"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
