"use client";
import { useEffect, useRef } from "react";

const FULL_TEXT =
  "Quand je reçois un email avec une facture → enregistre dans Sheets → notifie l'équipe sur Slack";

export default function Home() {
  const aiTextRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const replayRef = useRef<HTMLButtonElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const connRefs = useRef<(HTMLDivElement | null)[]>([]);

  function resetAll() {
    nodeRefs.current.forEach((n, i) => {
      if (!n) return;
      n.style.opacity = i === 0 ? "1" : "0";
      n.style.transform = "translateY(8px)";
    });
    connRefs.current.forEach((c) => {
      if (!c) return;
      c.style.opacity = "0";
    });
    if (statusRef.current) statusRef.current.style.opacity = "0";
    if (replayRef.current) replayRef.current.style.display = "none";
  }

  function showEl(el: HTMLElement | null, delay: number, opacity = "1") {
    if (!el) return;
    setTimeout(() => {
      el.style.opacity = opacity;
      el.style.transform = "translateY(0)";
      el.style.transition = "opacity 0.35s ease, transform 0.35s ease";
    }, delay);
  }

  function typeText(cb: () => void) {
    if (!aiTextRef.current) return;
    aiTextRef.current.textContent = "";
    let i = 0;
    function tick() {
      if (!aiTextRef.current) return;
      if (i < FULL_TEXT.length) {
        aiTextRef.current.textContent = FULL_TEXT.slice(0, ++i);
        setTimeout(tick, 26);
      } else {
        if (cursorRef.current) cursorRef.current.style.display = "none";
        cb();
      }
    }
    if (cursorRef.current) cursorRef.current.style.display = "inline-block";
    tick();
  }

  function startAnimation() {
    resetAll();
    if (cursorRef.current) cursorRef.current.style.display = "none";
    if (aiTextRef.current) aiTextRef.current.textContent = "";

    setTimeout(() => {
      typeText(() => {
        showEl(nodeRefs.current[1], 150);
        showEl(connRefs.current[0], 150);
        showEl(nodeRefs.current[2], 500);
        showEl(connRefs.current[1], 500);
        showEl(nodeRefs.current[3], 850);
        showEl(connRefs.current[2], 850);
        setTimeout(() => {
          if (statusRef.current) statusRef.current.style.opacity = "1";
          if (replayRef.current) replayRef.current.style.display = "inline-block";
        }, 1300);
      });
    }, 400);
  }

  useEffect(() => {
    setTimeout(startAnimation, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nodes = [
    {
      label: "Gmail",
      iconBg: "#FEF2F2",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#DC2626" strokeWidth="1.5"/>
          <path d="M2 6L12 13L22 6" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: "Filtre IA",
      iconBg: "#EEF2FF",
      icon: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill="#4F46E5"/>
        </svg>
      ),
    },
    {
      label: "Sheets",
      iconBg: "#F0FDF4",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="#16A34A" strokeWidth="1.5"/>
          <path d="M3 9H21M3 15H21M9 3V21" stroke="#16A34A" strokeWidth="1.5"/>
        </svg>
      ),
    },
    {
      label: "Slack",
      iconBg: "#FDF4FF",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="8.5" cy="5.5" r="2.5" fill="#7C3AED" opacity="0.8"/>
          <circle cx="15.5" cy="5.5" r="2.5" fill="#7C3AED" opacity="0.5"/>
          <circle cx="8.5" cy="18.5" r="2.5" fill="#7C3AED" opacity="0.5"/>
          <circle cx="15.5" cy="18.5" r="2.5" fill="#7C3AED" opacity="0.8"/>
          <line x1="8.5" y1="8" x2="8.5" y2="16" stroke="#7C3AED" strokeWidth="2" opacity="0.7"/>
          <line x1="11" y1="12" x2="13" y2="12" stroke="#7C3AED" strokeWidth="2" opacity="0.7"/>
        </svg>
      ),
    },
  ];

  const features = [
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill="#4F46E5"/></svg>, title: "IA générative", desc: "Décrivez votre automatisation en langage naturel. FlowForge la construit en quelques secondes." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#4F46E5" strokeWidth="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#4F46E5" strokeWidth="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#4F46E5" strokeWidth="1.5"/><path d="M17 13V21M13 17H21" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: "Éditeur visuel", desc: "Drag & drop intuitif. Construisez des workflows complexes sans jamais ouvrir un éditeur de code." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10 13C10.5523 13 11 12.5523 11 12C11 11.4477 10.5523 11 10 11C9.44772 11 9 11.4477 9 12C9 12.5523 9.44772 13 10 13Z" fill="#4F46E5"/><path d="M3 12C3 12 6 5 12 5C18 5 21 12 21 12C21 12 18 19 12 19C6 19 3 12 3 12Z" stroke="#4F46E5" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="#4F46E5" strokeWidth="1.5"/></svg>, title: "Monitoring temps réel", desc: "Suivez chaque exécution, identifiez les erreurs et corrigez-les instantanément." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#4F46E5" strokeWidth="1.5" strokeLinejoin="round"/><path d="M2 17L12 22L22 17" stroke="#4F46E5" strokeWidth="1.5" strokeLinejoin="round"/><path d="M2 12L12 17L22 12" stroke="#4F46E5" strokeWidth="1.5" strokeLinejoin="round"/></svg>, title: "50+ intégrations", desc: "Gmail, Slack, Notion, Stripe, Sheets — tout ce que vous utilisez déjà, connecté en un clic." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#4F46E5" strokeWidth="1.5"/><path d="M7 11V7C7 4.79 9.24 3 12 3C14.76 3 17 4.79 17 7V11" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: "Sécurité enterprise", desc: "Chiffrement bout-en-bout, conformité RGPD, SSO et logs d'audit pour les équipes exigeantes." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#4F46E5" strokeWidth="1.5"/><path d="M2 12H22M12 2C9.33 5.33 8 8.67 8 12C8 15.33 9.33 18.67 12 22C14.67 18.67 16 15.33 16 12C16 8.67 14.67 5.33 12 2Z" stroke="#4F46E5" strokeWidth="1.5"/></svg>, title: "Marketplace (v2)", desc: "Des milliers de workflows prêts à l'emploi créés et partagés par la communauté FlowForge." },
  ];

  const plans = [
    { name: "Free", price: "0€", desc: "Pour découvrir l'automatisation.", features: ["100 tâches / mois", "5 workflows actifs", "Intégrations de base", "Support communauté"], featured: false },
    { name: "Starter", price: "7€", desc: "Pour les freelances et solopreneurs.", features: ["2 000 tâches / mois", "Workflows illimités", "Toutes les intégrations", "Support email prioritaire"], featured: true },
    { name: "Pro", price: "19€", desc: "Pour les PME et équipes en croissance.", features: ["10 000 tâches / mois", "Workflows illimités", "IA générative incluse", "Support chat en direct"], featured: false },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; color:#0A0A0A; }
        a { text-decoration:none; color:inherit; }

        .nav-link { font-size:.875rem; color:#6B7280; transition:color .15s; }
        .nav-link:hover { color:#0A0A0A; }

        .node-el { transition:opacity .35s ease, transform .35s ease; }

        .conn-el { transition:opacity .3s ease; }
        .conn-el::after {
          content:''; position:absolute; right:-4px; top:50%;
          transform:translateY(-50%);
          border:4px solid transparent; border-left-color:#9CA3AF;
        }

        .moving-dot {
          position:absolute; top:50%; transform:translateY(-50%);
          width:5px; height:5px; border-radius:50%; background:#4F46E5;
          animation:moveDot 2.2s ease-in-out infinite;
        }
        .moving-dot:nth-child(2) { animation-delay:.7s; }

        @keyframes moveDot {
          0%   { left:0;    opacity:0; }
          15%  { opacity:1; }
          85%  { opacity:1; }
          100% { left:100%; opacity:0; }
        }

        .ai-cursor {
          display:inline-block; width:2px; height:13px;
          background:#4F46E5; margin-left:1px; vertical-align:middle;
          animation:blink .8s infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        .feature-card:hover { background:#FAFAFA !important; }
        .pricing-card:hover { box-shadow:0 8px 32px rgba(0,0,0,.08) !important; transform:translateY(-3px); }

        .btn-plan:hover { opacity:.88; }

        .status-dot { width:6px; height:6px; border-radius:50%; background:#10B981; animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

        .badge-dot { width:6px; height:6px; border-radius:50%; background:#4F46E5; display:inline-block; animation:pulse 2s infinite; }
      `}</style>

      {/* NAV */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"1rem 3rem", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(250,250,250,0.88)", backdropFilter:"blur(20px)", borderBottom:"1px solid #EBEBEB" }}>
        <div style={{ fontWeight:800, fontSize:"1.2rem", letterSpacing:"-0.03em" }}>
          Flow<span style={{ color:"#4F46E5" }}>Forge</span>
        </div>
        <ul style={{ display:"flex", gap:"2.5rem", listStyle:"none" }}>
          {["Fonctionnalités","Intégrations","Pricing","Docs"].map((item) => (
            <li key={item}><a href="#" className="nav-link">{item}</a></li>
          ))}
        </ul>
        <div style={{ display:"flex", gap:".75rem", alignItems:"center" }}>
          <a href="/login" style={{ fontSize:".875rem", color:"#6B7280", background:"none", textDecoration:"none", padding:".5rem 1rem", borderRadius:"8px", fontFamily:"inherit" }}>
            Se connecter
          </a>
          <a href="/register" style={{ fontSize:".875rem", fontWeight:600, background:"#0A0A0A", color:"#fff", textDecoration:"none", padding:".55rem 1.25rem", borderRadius:"8px", fontFamily:"inherit" }}>
            Commencer gratuitement
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"8rem 2rem 5rem" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:".5rem", fontSize:".75rem", fontWeight:600, color:"#4F46E5", background:"#EEF2FF", border:"1px solid #C7D2FE", padding:".3rem .9rem", borderRadius:"100px", marginBottom:"2rem" }}>
          <span className="badge-dot"></span>
          Bêta ouverte — Rejoignez la waitlist
        </div>

        <h1 style={{ fontSize:"clamp(2.6rem,5.5vw,4.4rem)", fontWeight:800, lineHeight:1.1, letterSpacing:"-0.035em", maxWidth:"760px" }}>
          Automatisez tout,<br />sans <span style={{ color:"#4F46E5" }}>écrire une ligne.</span>
        </h1>

        <p style={{ marginTop:"1.25rem", fontSize:"1rem", color:"#6B7280", maxWidth:"460px", lineHeight:1.75 }}>
          Décrivez votre workflow en français. L&apos;IA le construit pour vous en quelques secondes.
        </p>

        <div style={{ marginTop:"2rem", display:"flex", gap:".75rem" }}>
          <a href="/register" style={{ fontSize:".9rem", fontWeight:600, background:"#0A0A0A", color:"#fff", textDecoration:"none", padding:".75rem 1.6rem", borderRadius:"10px", fontFamily:"inherit" }}>
            Commencer gratuitement →
          </a>
          <a href="/login" style={{ fontSize:".9rem", fontWeight:500, background:"#fff", color:"#374151", border:"1px solid #E5E7EB", textDecoration:"none", padding:".75rem 1.6rem", borderRadius:"10px", fontFamily:"inherit" }}>
            Se connecter
          </a>
        </div>

        <p style={{ marginTop:".85rem", fontSize:".75rem", color:"#9CA3AF" }}>
          Aucune carte bancaire requise · Plan gratuit à vie
        </p>

        {/* CANVAS */}
        <div style={{ marginTop:"3.5rem", width:"100%", maxWidth:"820px" }}>
          <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.06), 0 16px 48px rgba(0,0,0,.07)" }}>

            {/* titlebar */}
            <div style={{ padding:".75rem 1.25rem", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", gap:".5rem", background:"#FAFAFA" }}>
              {["#FCA5A5","#FCD34D","#6EE7B7"].map((c) => (
                <div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }} />
              ))}
              <span style={{ marginLeft:".5rem", fontSize:".72rem", fontWeight:600, color:"#9CA3AF", letterSpacing:".04em", textTransform:"uppercase" }}>
                FlowForge — Éditeur de workflow
              </span>
            </div>

            {/* body */}
            <div style={{ padding:"2rem", backgroundImage:"radial-gradient(#E9EAEC 1px, transparent 1px)", backgroundSize:"22px 22px" }}>

              {/* AI bar */}
              <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:"12px", padding:".75rem 1rem", marginBottom:"2rem", display:"flex", alignItems:"center", gap:".75rem" }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"#4F46E5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill="white"/>
                  </svg>
                </div>
                <span style={{ fontSize:".82rem", color:"#4F46E5", fontWeight:500 }}>
                  <span ref={aiTextRef}></span>
                  <span ref={cursorRef} className="ai-cursor" style={{ display:"none" }}></span>
                </span>
              </div>

              {/* nodes */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
                {nodes.map((node, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center" }}>
                    <div
                      ref={(el) => { nodeRefs.current[i] = el; }}
                      className="node-el"
                      style={{
                        background:"#fff", border:`1px solid ${i === 0 ? "#818CF8" : "#E5E7EB"}`,
                        borderRadius:"10px", padding:".6rem .9rem",
                        display:"flex", alignItems:"center", gap:".5rem",
                        fontSize:".8rem", fontWeight:600, color:"#1F2937",
                        boxShadow: i === 0 ? "0 0 0 3px #EEF2FF" : "0 1px 3px rgba(0,0,0,.06)",
                        opacity: i === 0 ? 1 : 0,
                        transform: i === 0 ? "none" : "translateY(8px)",
                        whiteSpace:"nowrap",
                      }}
                    >
                      <div style={{ width:28, height:28, borderRadius:7, background:node.iconBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {node.icon}
                      </div>
                      {node.label}
                    </div>
                    {i < nodes.length - 1 && (
                      <div
                        ref={(el) => { connRefs.current[i] = el; }}
                        className="conn-el"
                        style={{ width:32, height:1, background:"#D1D5DB", position:"relative", flexShrink:0, opacity:0 }}
                      >
                        <div className="moving-dot"></div>
                        <div className="moving-dot"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* status */}
              <div style={{ marginTop:"1.5rem", display:"flex", alignItems:"center", gap:"1rem" }}>
                <div ref={statusRef} style={{ display:"flex", alignItems:"center", gap:".5rem", fontSize:".75rem", color:"#6B7280", opacity:0, transition:"opacity .4s" }}>
                  <span className="status-dot"></span>
                  Workflow actif — 3 exécutions aujourd&apos;hui
                </div>
                <button
                  ref={replayRef}
                  onClick={startAnimation}
                  style={{ display:"none", background:"none", border:"1px solid #E5E7EB", borderRadius:"8px", padding:".35rem .85rem", fontSize:".72rem", fontWeight:600, color:"#6B7280", cursor:"pointer", fontFamily:"inherit" }}
                >
                  Rejouer
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding:"0 3rem 5rem", maxWidth:"1080px", margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", border:"1px solid #E5E7EB", borderRadius:"14px", overflow:"hidden", background:"#fff" }}>
          {[{n:"10k+",l:"Workflows créés"},{n:"50+",l:"Intégrations"},{n:"99.9%",l:"Uptime garanti"},{n:"<200ms",l:"Temps d'exécution"}].map((s,i) => (
            <div key={i} style={{ padding:"2rem", textAlign:"center", borderRight: i<3 ? "1px solid #E5E7EB" : "none" }}>
              <div style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em" }}>{s.n}</div>
              <div style={{ fontSize:".78rem", color:"#9CA3AF", marginTop:".25rem" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding:"0 3rem 5rem", maxWidth:"1080px", margin:"0 auto" }}>
        <p style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#4F46E5", marginBottom:".75rem" }}>Fonctionnalités</p>
        <h2 style={{ fontSize:"clamp(1.6rem,3vw,2.3rem)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".75rem" }}>Tout ce dont vous avez besoin.</h2>
        <p style={{ fontSize:".95rem", color:"#6B7280", maxWidth:"440px", lineHeight:1.75, marginBottom:"2.5rem" }}>Une interface pensée pour aller vite, sans sacrifier la puissance.</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1px", background:"#E5E7EB", border:"1px solid #E5E7EB", borderRadius:"14px", overflow:"hidden" }}>
          {features.map((f,i) => (
            <div key={i} className="feature-card" style={{ padding:"2rem", background:"#fff", cursor:"default" }}>
              <div style={{ width:36, height:36, borderRadius:9, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.25rem" }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize:".95rem", fontWeight:700, marginBottom:".5rem" }}>{f.title}</h3>
              <p style={{ fontSize:".84rem", color:"#6B7280", lineHeight:1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding:"0 3rem 6rem", maxWidth:"1080px", margin:"0 auto" }}>
        <p style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#4F46E5", marginBottom:".75rem" }}>Pricing</p>
        <h2 style={{ fontSize:"clamp(1.6rem,3vw,2.3rem)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".75rem" }}>Simple et transparent.</h2>
        <p style={{ fontSize:".95rem", color:"#6B7280", maxWidth:"440px", lineHeight:1.75, marginBottom:"2.5rem" }}>Commencez gratuitement, évoluez selon vos besoins. Annulez à tout moment.</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem" }}>
          {plans.map((p,i) => (
            <div key={i} className="pricing-card" style={{ background:"#fff", border:`1px solid ${p.featured ? "#818CF8" : "#E5E7EB"}`, borderRadius:"14px", padding:"2rem", position:"relative", boxShadow: p.featured ? "0 0 0 1px #818CF8, 0 8px 32px rgba(79,70,229,.1)" : "none", transition:"box-shadow .2s, transform .2s", cursor:"default" }}>
              {p.featured && (
                <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", fontSize:".68rem", fontWeight:700, color:"#fff", background:"#4F46E5", padding:".25rem .85rem", borderRadius:"100px", whiteSpace:"nowrap" }}>
                  Le plus populaire
                </div>
              )}
              <p style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:".75rem" }}>{p.name}</p>
              <div style={{ fontSize:"2.4rem", fontWeight:800, letterSpacing:"-0.04em", marginBottom:".2rem" }}>
                {p.price} <span style={{ fontSize:".95rem", fontWeight:400, color:"#9CA3AF" }}>/ mois</span>
              </div>
              <p style={{ fontSize:".82rem", color:"#9CA3AF", marginBottom:"1.5rem" }}>{p.desc}</p>
              <div style={{ height:1, background:"#F3F4F6", marginBottom:"1.25rem" }}></div>
              <ul style={{ listStyle:"none", marginBottom:"1.75rem" }}>
                {p.features.map((f,j) => (
                  <li key={j} style={{ fontSize:".84rem", color:"#374151", padding:".35rem 0", display:"flex", alignItems:"center", gap:".6rem" }}>
                    <span style={{ width:16, height:16, borderRadius:"50%", background:"#EEF2FF", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5l2.5 2.5 4-4" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/register" className="btn-plan" style={{ width:"100%", padding:".75rem", borderRadius:"8px", fontSize:".875rem", fontWeight:600, cursor:"pointer", background: p.featured ? "#4F46E5" : "#F9FAFB", border: p.featured ? "none" : "1px solid #E5E7EB", color: p.featured ? "#fff" : "#374151", fontFamily:"inherit", transition:"opacity .15s", textDecoration:"none", display:"block", textAlign:"center" }}>
                Commencer →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid #E5E7EB", padding:"2rem 3rem", display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:".78rem", color:"#9CA3AF" }}>
        <div style={{ fontWeight:800, fontSize:"1rem", color:"#0A0A0A" }}>
          Flow<span style={{ color:"#4F46E5" }}>Forge</span>
        </div>
        <div style={{ display:"flex", gap:"1.5rem" }}>
          {["Mentions légales","Confidentialité","Contact"].map((l) => (
            <a key={l} href="#" style={{ color:"#9CA3AF" }}>{l}</a>
          ))}
        </div>
        <span>© 2025 FlowForge</span>
      </footer>
    </>
  );
}