"use client";
import { useEffect, useRef, useState } from "react";

const FULL_TEXT =
  "Quand quelqu'un remplit mon formulaire → l'IA génère un email personnalisé → envoie automatiquement via Resend";

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.10, rootMargin: "0px 0px -30px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function useCounter(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return { count, ref };
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-dark" style={{ borderRadius:"14px", cursor:"pointer", overflow:"hidden" }} onClick={() => setOpen(o => !o)}>
      <div style={{ padding:"1.25rem 1.6rem", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem" }}>
        <span style={{ fontSize:".9rem", fontWeight:600, color:"#fff" }}>{q}</span>
        <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(99,102,241,0.15)", border:"1px solid rgba(129,140,248,0.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"transform .2s", transform:open?"rotate(180deg)":"rotate(0deg)" }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 6l5 5 5-5" stroke="#A5B4FC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
      {open && <div style={{ padding:"0 1.6rem 1.25rem", fontSize:".875rem", color:"rgba(255,255,255,0.55)", lineHeight:1.75 }}>{a}</div>}
    </div>
  );
}

export default function Home() {
  const aiTextRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const replayRef = useRef<HTMLButtonElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const connRefs = useRef<(SVGGElement | null)[]>([]);

  const [email, setEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [betaModal, setBetaModal] = useState<string | null>(null);
  const [waitlistMsg, setWaitlistMsg] = useState("");
  const [billing, setBilling] = useState<"monthly"|"annual">("monthly");

  useScrollReveal();

  useEffect(() => {
    (window as unknown as Record<string, unknown>).googleTranslateElementInit = () => {
      new (window as unknown as { google: { translate: { TranslateElement: new (opts: unknown, id: string) => void } } }).google.translate.TranslateElement(
        { pageLanguage: "fr", includedLanguages: "fr,en,es,de,it,pt,nl,ar,zh-CN,ja", autoDisplay: false },
        "google_translate_element"
      );
      const browserLang = navigator.language || "";
      if (!browserLang.toLowerCase().startsWith("fr")) {
        const langMap: Record<string, string> = { en:"en", es:"es", de:"de", it:"it", pt:"pt", nl:"nl", ar:"ar", zh:"zh-CN", ja:"ja" };
        const code = browserLang.split("-")[0].toLowerCase();
        const target = langMap[code] || "en";
        setTimeout(() => {
          const select = document.querySelector("#google_translate_element select") as HTMLSelectElement | null;
          if (select) { select.value = target; select.dispatchEvent(new Event("change")); }
        }, 800);
      }
    };
    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  async function handleWaitlist() {
    if (!email || !email.includes("@")) { setWaitlistStatus("error"); setWaitlistMsg("Entrez un email valide."); return; }
    setWaitlistStatus("loading");
    const res = await fetch("/api/waitlist", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email }) });
    const data = await res.json();
    if (res.ok) { setWaitlistStatus("success"); setWaitlistMsg(data.message); setEmail(""); }
    else { setWaitlistStatus("error"); setWaitlistMsg(data.error); }
  }

  function resetAll() {
    nodeRefs.current.forEach((n, i) => { if (!n) return; n.style.opacity = i===0?"1":"0"; n.style.transform="translateY(8px)"; });
    connRefs.current.forEach((c) => { if (!c) return; c.style.opacity="0"; });
    if (statusRef.current) statusRef.current.style.opacity="0";
    if (replayRef.current) replayRef.current.style.display="none";
  }

  function showEl(el: Element | null, delay: number) {
    if (!el) return;
    const s = (el as HTMLElement).style;
    setTimeout(() => { s.opacity="1"; s.transform="translateY(0)"; s.transition="opacity 0.35s ease, transform 0.35s ease"; }, delay);
  }

  function typeText(cb: () => void) {
    if (!aiTextRef.current) return;
    aiTextRef.current.textContent = "";
    let i = 0;
    function tick() {
      if (!aiTextRef.current) return;
      if (i < FULL_TEXT.length) { aiTextRef.current.textContent = FULL_TEXT.slice(0, ++i); setTimeout(tick, 26); }
      else { if (cursorRef.current) cursorRef.current.style.display="none"; cb(); }
    }
    if (cursorRef.current) cursorRef.current.style.display="inline-block";
    tick();
  }

  function startAnimation() {
    resetAll();
    if (cursorRef.current) cursorRef.current.style.display="none";
    if (aiTextRef.current) aiTextRef.current.textContent="";
    setTimeout(() => {
      typeText(() => {
        showEl(nodeRefs.current[1], 150); showEl(connRefs.current[0], 150);
        showEl(nodeRefs.current[2], 500); showEl(connRefs.current[1], 500);
        showEl(nodeRefs.current[3], 850); showEl(connRefs.current[2], 850);
        setTimeout(() => {
          if (statusRef.current) statusRef.current.style.opacity="1";
          if (replayRef.current) replayRef.current.style.display="inline-block";
        }, 1300);
      });
    }, 400);
  }

  useEffect(() => { setTimeout(startAnimation, 800); }, []); // eslint-disable-line

  function toggleMenu() { document.getElementById("nav-mobile")?.classList.toggle("open"); }

  const nodes = [
    { label:"Webhook", iconBg:"#FFF7ED", icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label:"Générer texte", iconBg:"#EEF2FF", icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill="#4F46E5"/></svg> },
    { label:"Gmail", iconBg:"#FEF2F2", icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#DC2626" strokeWidth="1.5"/><path d="M2 6L12 13L22 6" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { label:"Slack", iconBg:"#FDF4FF", icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="8.5" cy="5.5" r="2.5" fill="#7C3AED" opacity="0.8"/><circle cx="8.5" cy="18.5" r="2.5" fill="#7C3AED" opacity="0.5"/><line x1="8.5" y1="8" x2="8.5" y2="16" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"/><line x1="11" y1="12" x2="13" y2="12" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"/></svg> },
  ];

  const plans = [
    { name:"Free", monthly:"0€", annual:"0€", desc:"Pour découvrir l'automatisation.", features:["100 tâches / mois","5 workflows actifs","Webhook, Gmail, Sheets","Support communauté"], featured:false, cta:"Commencer gratuitement", ctaHref:"/register" },
    { name:"Starter", monthly:"7€", annual:"5€", desc:"Pour les freelances et solopreneurs.", features:["2 000 tâches / mois","Workflows illimités","Toutes les intégrations","Kixi IA incluse","Support email prioritaire"], featured:true, cta:"Commencer →", ctaHref:"/register" },
    { name:"Pro", monthly:"19€", annual:"15€", desc:"Pour les PME et équipes en croissance.", features:["10 000 tâches / mois","Workflows illimités","Kixi IA illimitée","Blocs IA avancés inclus","Support chat en direct"], featured:false, cta:"Commencer →", ctaHref:"/register" },
    { name:"Business", monthly:"49€", annual:"39€", desc:"Pour les équipes et agences.", features:["50 000 tâches / mois","Workflows illimités","Kixi IA illimitée + priorité","Support dédié < 4h","Onboarding personnalisé"], featured:false, cta:"Nous contacter", ctaHref:"mailto:loopflo.contact@gmail.com?subject=Plan Business LoopFlo" },
  ];

  const faq = [
    { q:"C'est quoi une \"tâche\" ?", a:"Une tâche = une action exécutée par un bloc dans un workflow. Envoyer un email, filtrer avec l'IA, écrire dans Sheets — chaque action compte comme une tâche." },
    { q:"Quelle est la différence avec Zapier ou Make ?", a:"LoopFlo est 3× moins cher, entièrement en français, et intègre de l'IA générative nativement. Pas de code, pas de complexité inutile." },
    { q:"Faut-il des compétences techniques ?", a:"Non. L'interface drag & drop et la génération par IA permettent à n'importe qui de créer des automations puissantes en quelques minutes." },
    { q:"Puis-je annuler à tout moment ?", a:"Oui, sans engagement. Annulez en un clic depuis votre tableau de bord. Vous conservez l'accès jusqu'à la fin de la période payée." },
    { q:"Mes données sont-elles sécurisées ?", a:"Oui. Toutes les données sont chiffrées en transit (TLS 1.3) et au repos. Nous sommes conformes RGPD et ne revendons aucune donnée." },
    { q:"Comment fonctionne la facturation annuelle ?", a:"En choisissant le plan annuel, vous économisez l'équivalent de 2 mois. Vous êtes facturé en une fois pour 12 mois d'accès." },
  ];

  const c1 = useCounter(10000, 1800);
  const c2 = useCounter(50, 1200);
  const c3 = useCounter(99, 1500);
  const c4 = useCounter(200, 1400);
  const counters = [c1, c2, c3, c4];

  const integrations = [
    { name:"Gmail", color:"#FCA5A5", size:"lg" },
    { name:"Slack", color:"#C4B5FD", size:"sm" },
    { name:"Notion", color:"rgba(255,255,255,0.7)", size:"sm" },
    { name:"Google Sheets", color:"#6EE7B7", size:"lg" },
    { name:"Stripe", color:"#A5B4FC", size:"sm" },
    { name:"Airtable", color:"#7DD3FC", size:"sm" },
    { name:"HTTP", color:"rgba(255,255,255,0.5)", size:"sm" },
    { name:"Discord", color:"#818CF8", size:"lg" },
    { name:"Telegram", color:"#67E8F9", size:"sm" },
    { name:"GitHub", color:"rgba(255,255,255,0.6)", size:"sm" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#07001a; color:#fff; }
        a { text-decoration:none; color:inherit; }

        /* REVEAL */
        .reveal { opacity:0; transform:translateY(28px); transition:opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1); }
        .reveal.revealed { opacity:1; transform:translateY(0); }
        .reveal-left { opacity:0; transform:translateX(-32px); transition:opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1); }
        .reveal-left.revealed { opacity:1; transform:translateX(0); }
        .reveal-right { opacity:0; transform:translateX(32px); transition:opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1); }
        .reveal-right.revealed { opacity:1; transform:translateX(0); }
        .reveal-delay-1 { transition-delay:0.08s; }
        .reveal-delay-2 { transition-delay:0.16s; }
        .reveal-delay-3 { transition-delay:0.24s; }
        .reveal-delay-4 { transition-delay:0.32s; }
        .reveal-delay-5 { transition-delay:0.40s; }
        .reveal-delay-6 { transition-delay:0.48s; }

        /* GLASS */
        .glass-dark {
          background:rgba(255,255,255,0.05);
          backdrop-filter:blur(40px) saturate(180%);
          -webkit-backdrop-filter:blur(40px) saturate(180%);
          border:1px solid rgba(255,255,255,0.10) !important;
          box-shadow:0 8px 40px rgba(0,0,0,0.35), 0 1.5px 0 rgba(255,255,255,0.13) inset !important;
        }
        .glass-shimmer { overflow:hidden; position:relative; }
        .glass-shimmer::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.06) 50%,transparent 100%); animation:shimmerSweep 8s ease-in-out infinite; pointer-events:none; border-radius:inherit; z-index:1; }
        @keyframes shimmerSweep { 0%{transform:translateX(-100%) skewX(-12deg)} 100%{transform:translateX(250%) skewX(-12deg)} }

        /* ORBS */
        @keyframes liquidFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,-70px) scale(1.12)} 66%{transform:translate(-35px,40px) scale(0.92)} }
        @keyframes liquidFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-60px,50px) scale(1.08)} 66%{transform:translate(30px,-40px) scale(0.95)} }
        @keyframes liquidFloat3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(25px,-50px) scale(1.1)} }
        .orb { position:absolute; border-radius:50%; pointer-events:none; }

        /* MISC */
        .ai-cursor { display:inline-block; width:2px; height:13px; background:#4F46E5; margin-left:1px; vertical-align:middle; animation:blink .8s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .status-dot { width:6px; height:6px; border-radius:50%; background:#10B981; animation:pulse 2s infinite; }
        .badge-dot { width:6px; height:6px; border-radius:50%; background:#4F46E5; display:inline-block; animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        .moving-dot { position:absolute; top:50%; transform:translateY(-50%); width:5px; height:5px; border-radius:50%; background:#4F46E5; animation:moveDot 2.2s ease-in-out infinite; }
        .moving-dot:nth-child(2) { animation-delay:.7s; }
        @keyframes moveDot { 0%{left:0;opacity:0} 15%{opacity:1} 85%{opacity:1} 100%{left:100%;opacity:0} }
        .node-el { transition:opacity .35s ease, transform .35s ease; }
        .conn-el { transition:opacity .3s ease; }
        .gradient-text { background:linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .waitlist-input { flex:1; padding:.75rem 1rem; border:1px solid rgba(255,255,255,0.15); border-radius:10px; font-size:.9rem; font-family:inherit; outline:none; background:rgba(255,255,255,0.08); color:#fff; backdrop-filter:blur(10px); transition:border-color .15s; }
        .waitlist-input::placeholder { color:rgba(255,255,255,0.35); }
        .waitlist-input:focus { border-color:rgba(129,140,248,0.7); box-shadow:0 0 0 3px rgba(99,102,241,0.2); }
        .waitlist-btn { padding:.75rem 1.5rem; background:linear-gradient(135deg,#6366F1,#8B5CF6); color:#fff; border:none; border-radius:10px; font-size:.875rem; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap; transition:opacity .15s, transform .1s; }
        .waitlist-btn:hover { opacity:.9; transform:translateY(-1px); }
        .waitlist-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .waitlist-success { display:flex; align-items:center; gap:.5rem; font-size:.85rem; color:#059669; background:rgba(5,150,105,0.1); border:1px solid rgba(5,150,105,0.3); padding:.6rem 1rem; border-radius:8px; margin-top:.75rem; animation:slideUp .3s ease; }
        .waitlist-error { font-size:.82rem; color:#F87171; margin-top:.5rem; }

        /* NAV */
        .nav-burger { display:none; flex-direction:column; gap:5px; cursor:pointer; background:none; border:none; padding:4px; }
        .nav-burger span { width:22px; height:2px; background:rgba(255,255,255,0.7); border-radius:2px; display:block; }
        .nav-mobile { display:none; flex-direction:column; position:fixed; top:57px; left:0; right:0; background:rgba(7,0,26,0.97); backdrop-filter:blur(20px); border-bottom:1px solid rgba(255,255,255,0.07); padding:1rem 1.5rem; gap:.75rem; z-index:99; }
        .nav-mobile.open { display:flex; }
        .nav-mobile a { font-size:.95rem; color:rgba(255,255,255,0.7); font-weight:500; padding:.6rem 0; border-bottom:1px solid rgba(255,255,255,0.06); }

        /* PRICING */
        .pricing-card { transition:transform .2s, box-shadow .2s; }
        .pricing-card:hover { transform:translateY(-4px); }
        .cta-btn { transition:opacity .15s, transform .1s; }
        .cta-btn:hover { opacity:.88; transform:translateY(-1px); }

        /* GOOGLE TRANSLATE */
        .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame { display:none !important; }
        body { top:0 !important; }
        .skiptranslate { display:none !important; }
        #google_translate_element select { font-family:'Plus Jakarta Sans',sans-serif; font-size:.78rem; font-weight:600; color:rgba(255,255,255,0.5); background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); border-radius:7px; padding:.3rem .5rem; cursor:pointer; outline:none; }

        /* DIVIDER */
        .section-divider { width:100%; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent); }

        @media (max-width:1024px) {
          .hero-split { flex-direction:column !important; }
          .hero-canvas { max-width:100% !important; }
          .features-bento { grid-template-columns:1fr !important; }
          .feat-main-row { flex-direction:column !important; }
          .tpl-row-inner { flex-direction:column !important; }
        }
        @media (max-width:768px) {
          .nav-links-desktop, .nav-cta-desktop { display:none !important; }
          .nav-burger { display:flex !important; }
          .hero-title { font-size:2.4rem !important; }
          .pricing-grid { grid-template-columns:1fr !important; }
          .stats-row { grid-template-columns:repeat(2,1fr) !important; }
          .contact-grid { grid-template-columns:1fr !important; }
          .faq-cols { flex-direction:column !important; }
          .integ-grid { grid-template-columns:repeat(2,1fr) !important; }
          /* Padding sections */
          .hero-section { padding: 7rem 1.25rem 9rem !important; }
          .features-section, .tpl-section, .pricing-section, .faq-section, .cta-section { padding: 5rem 1.25rem !important; }
          .contact-section { padding: 3.5rem 1.25rem 3rem !important; }
          .integ-strip { padding: 1.25rem 1.25rem !important; }
          /* Templates : 1 colonne */
          .tpl-preview-grid { grid-template-columns: 1fr !important; }
          /* Bento IA : annuler span 2 */
          .feat-ia-card { grid-row: span 1 !important; min-height: 300px !important; }
        }
        /* Canvas inner scaling — démarre quand le canvas 510px dépasse la largeur dispo */
        @media (max-width:560px) {
          .canvas-inner { transform: scale(0.86); transform-origin: top left; }
          .canvas-viewport { height: 224px !important; }
        }
        @media (max-width:430px) {
          .hero-title { font-size:2rem !important; }
          .canvas-inner { transform: scale(0.74); transform-origin: top left; }
          .canvas-viewport { height: 192px !important; }
        }
        @media (max-width:380px) {
          .hero-title { font-size:1.8rem !important; }
          .canvas-inner { transform: scale(0.64); transform-origin: top left; }
          .canvas-viewport { height: 166px !important; }
        }
      `}</style>

      {/* ===================== NAV ===================== */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, padding:"1rem 3rem", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(7,0,26,0.7)", backdropFilter:"blur(24px) saturate(180%)", WebkitBackdropFilter:"blur(24px) saturate(180%)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontWeight:900, fontSize:"1.2rem", letterSpacing:"-0.04em", color:"#fff" }}>
          Loop<span style={{ color:"#818CF8" }}>flo</span>
        </div>
        <ul className="nav-links-desktop" style={{ display:"flex", gap:"2.5rem", listStyle:"none" }}>
          {[["Fonctionnalités","#fonctionnalites"],["Tarifs","#pricing"],["Templates","#templates"],["FAQ","#faq"],["Support","#contact"]].map(([label, href]) => (
            <li key={label}><a href={href} style={{ fontSize:".875rem", color:"rgba(255,255,255,0.5)", transition:"color .15s" }} onMouseEnter={e=>(e.currentTarget.style.color="#fff")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.5)")}>{label}</a></li>
          ))}
        </ul>
        <div className="nav-cta-desktop" style={{ display:"flex", gap:".75rem", alignItems:"center" }}>
          <div id="google_translate_element" />
          <a href="/login" style={{ fontSize:".875rem", color:"rgba(255,255,255,0.5)", padding:".5rem 1rem", borderRadius:"8px", transition:"color .15s" }} onMouseEnter={e=>(e.currentTarget.style.color="#fff")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.5)")}>Connexion</a>
          <a href="/register" className="cta-btn" style={{ fontSize:".875rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", padding:".55rem 1.25rem", borderRadius:"8px", boxShadow:"0 4px 14px rgba(99,102,241,.4)" }}>Commencer</a>
        </div>
        <button className="nav-burger" onClick={toggleMenu}><span/><span/><span/></button>
      </nav>
      <div className="nav-mobile" id="nav-mobile">
        {[["Fonctionnalités","#fonctionnalites"],["Tarifs","#pricing"],["Templates","#templates"],["FAQ","#faq"],["Support","#contact"]].map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        <div style={{ display:"flex", flexDirection:"column", gap:".75rem", marginTop:".25rem" }}>
          <a href="/login" style={{ fontSize:".95rem", fontWeight:600, color:"rgba(255,255,255,0.7)", padding:".75rem", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.1)", textAlign:"center" }}>Connexion</a>
          <a href="/register" style={{ fontSize:".95rem", fontWeight:700, color:"#fff", background:"#4F46E5", padding:".75rem", borderRadius:"10px", textAlign:"center" }}>Commencer</a>
        </div>
      </div>

      {/* ===================== HERO — ASYMÉTRIQUE ===================== */}
      <section className="hero-section" style={{ minHeight:"100vh", padding:"8rem 4rem 5rem", position:"relative", overflow:"hidden", display:"flex", alignItems:"center" }}>
        {/* Orbes */}
        <div className="orb" style={{ width:800, height:800, background:"radial-gradient(circle,rgba(99,102,241,0.6) 0%,rgba(139,92,246,0.25) 45%,transparent 70%)", filter:"blur(80px)", animation:"liquidFloat1 14s ease-in-out infinite", top:"-250px", left:"40%" }}/>
        <div className="orb" style={{ width:500, height:500, background:"radial-gradient(circle,rgba(167,139,250,0.5) 0%,rgba(99,102,241,0.18) 50%,transparent 70%)", filter:"blur(90px)", animation:"liquidFloat2 18s ease-in-out infinite", top:"200px", left:"-5%" }}/>
        <div className="orb" style={{ width:350, height:350, background:"radial-gradient(circle,rgba(79,70,229,0.4) 0%,rgba(196,181,253,0.15) 55%,transparent 70%)", filter:"blur(70px)", animation:"liquidFloat3 11s ease-in-out infinite", bottom:"10%", right:"5%" }}/>

        <div className="hero-split" style={{ maxWidth:"1200px", margin:"0 auto", width:"100%", display:"flex", alignItems:"center", gap:"5rem", position:"relative", zIndex:1 }}>

          {/* GAUCHE — texte */}
          <div style={{ flex:"0 0 auto", maxWidth:"560px" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:".5rem", fontSize:".73rem", fontWeight:700, color:"#A5B4FC", background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.3)", padding:".3rem .9rem", borderRadius:"100px", marginBottom:"2.5rem", animation:"slideUp .5s ease .1s both", backdropFilter:"blur(10px)", letterSpacing:".06em", textTransform:"uppercase" }}>
              <span className="badge-dot"/>
              Bêta ouverte
            </div>

            <h1 className="hero-title" style={{ fontSize:"clamp(2.8rem,5vw,5rem)", fontWeight:900, lineHeight:1.04, letterSpacing:"-0.05em", animation:"slideUp .6s ease .15s both", color:"#fff", marginBottom:"1.75rem" }}>
              Automatisez tout,<br />
              <span style={{ background:"linear-gradient(135deg,#818CF8,#C4B5FD,#818CF8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                sans une ligne
              </span><br />
              de code.
            </h1>

            <p style={{ fontSize:"1.1rem", color:"rgba(255,255,255,0.55)", lineHeight:1.75, animation:"slideUp .6s ease .25s both", marginBottom:"2.5rem", maxWidth:"440px" }}>
              Décrivez votre workflow en français. L&apos;IA le construit pour vous — webhooks, emails, IA, tout connecté en quelques secondes.
            </p>

            {/* Waitlist */}
            <div style={{ animation:"slideUp .6s ease .35s both" }}>
              <div style={{ display:"flex", gap:".5rem", marginBottom:".75rem" }}>
                <input type="email" className="waitlist-input" placeholder="votre@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleWaitlist()} disabled={waitlistStatus==="loading"||waitlistStatus==="success"} />
                <button className="waitlist-btn" onClick={handleWaitlist} disabled={waitlistStatus==="loading"||waitlistStatus==="success"}>
                  {waitlistStatus==="loading"?"Envoi...":"Rejoindre →"}
                </button>
              </div>
              {waitlistStatus==="success" && <div className="waitlist-success"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5 6.5-6.5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/></svg>{waitlistMsg}</div>}
              {waitlistStatus==="error" && <p className="waitlist-error">{waitlistMsg}</p>}
              <p style={{ marginTop:".6rem", fontSize:".75rem", color:"rgba(255,255,255,0.3)" }}>Gratuit · Aucune carte bancaire · <a href="/login" style={{ color:"rgba(255,255,255,0.4)", textDecoration:"underline" }}>Déjà inscrit ?</a></p>
            </div>

            {/* Stats inline */}
            <div style={{ display:"flex", gap:"2rem", marginTop:"3rem", flexWrap:"wrap", animation:"slideUp .6s ease .45s both" }}>
              {[
                { ref:counters[1].ref, val:counters[1].count, suffix:"+ intégrations" },
                { ref:counters[0].ref, val:counters[0].count >= 10000 ? "10k" : counters[0].count, suffix:"+ workflows" },
                { ref:counters[2].ref, val:counters[2].count, suffix:".9% uptime" },
              ].map((s, i) => (
                <div key={i} ref={s.ref}>
                  <span style={{ fontSize:"1.5rem", fontWeight:800, letterSpacing:"-0.04em", background:"linear-gradient(135deg,#A5B4FC,#DDD6FE)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{s.val}</span>
                  <span style={{ fontSize:".78rem", color:"rgba(255,255,255,0.4)", marginLeft:".2rem" }}>{s.suffix}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DROITE — éditeur workflow redesigné */}
          <div className="hero-canvas" style={{ flex:1, minWidth:0, animation:"slideUp .7s ease .3s both" }}>
            <div className="glass-dark" style={{ borderRadius:"20px", overflow:"hidden" }}>

              {/* Barre titre */}
              <div style={{ padding:".6rem 1.1rem", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.02)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:".45rem" }}>
                  {["#FC6058","#FEC02F","#29C940"].map(c=><div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }}/>)}
                  <span style={{ marginLeft:".4rem", fontSize:".62rem", fontWeight:700, color:"rgba(255,255,255,0.2)", letterSpacing:".08em", textTransform:"uppercase" }}>Loopflo — Éditeur</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:".5rem" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:".3rem", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.22)", borderRadius:6, padding:".18rem .5rem" }}>
                    <span className="status-dot" style={{ width:5, height:5 }}/>
                    <span style={{ fontSize:".6rem", fontWeight:800, color:"#10B981", letterSpacing:".05em" }}>ACTIF</span>
                  </div>
                  <span style={{ fontSize:".6rem", fontWeight:600, color:"rgba(255,255,255,0.18)", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:5, padding:".18rem .42rem" }}>100%</span>
                  <span style={{ fontSize:".6rem", fontWeight:600, color:"rgba(255,255,255,0.18)", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:5, padding:".18rem .42rem" }}>3 blocs</span>
                </div>
              </div>

              {/* Barre prompt IA */}
              <div style={{ padding:".55rem 1rem", borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(79,70,229,0.05)", display:"flex", alignItems:"flex-start", gap:".6rem" }}>
                <div style={{ width:20, height:20, borderRadius:6, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"1px" }}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill="#fff"/></svg>
                </div>
                <span style={{ fontSize:".74rem", color:"#A5B4FC", fontWeight:500, lineHeight:1.55, flex:1 }}>
                  <span ref={aiTextRef}/>
                  <span ref={cursorRef} className="ai-cursor" style={{ display:"none" }}/>
                </span>
              </div>

              {/* Zone canvas 2D */}
              <div className="canvas-viewport" style={{ overflow:"hidden", position:"relative", height:260 }}>
                <div className="canvas-inner" style={{ position:"relative", width:"510px", height:"260px", backgroundImage:"radial-gradient(rgba(255,255,255,0.05) 1px,transparent 1px)", backgroundSize:"20px 20px", backgroundColor:"rgba(4,2,18,0.55)" }}>

                {/* SVG connexions courbes */}
                <svg className="canvas-svg" style={{ position:"absolute", inset:0, width:"100%", height:"100%", overflow:"visible", pointerEvents:"none" }}>
                  <defs>
                    <linearGradient id="cg0" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F97316" stopOpacity="0.6"/>
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0.9"/>
                    </linearGradient>
                    <linearGradient id="cg1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.7"/>
                      <stop offset="100%" stopColor="#EC4899" stopOpacity="0.8"/>
                    </linearGradient>
                    <linearGradient id="cg2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.7"/>
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.8"/>
                    </linearGradient>
                    <filter id="dotglow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>

                  {/* Connexion 0 : Webhook → IA */}
                  <g ref={el => { connRefs.current[0] = el; }} style={{ opacity:0 }}>
                    <path d="M 154 83 C 174 83 174 123 194 123" stroke="url(#cg0)" strokeWidth="1.5" fill="none" strokeDasharray="5 3" strokeLinecap="round"/>
                    <circle r="3.5" fill="#818CF8" filter="url(#dotglow)">
                      <animateMotion dur="1.8s" repeatCount="indefinite" path="M 154 83 C 174 83 174 123 194 123" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                    </circle>
                  </g>

                  {/* Connexion 1 : IA → Gmail */}
                  <g ref={el => { connRefs.current[1] = el; }} style={{ opacity:0 }}>
                    <path d="M 330 115 C 350 115 350 59 370 59" stroke="url(#cg1)" strokeWidth="1.5" fill="none" strokeDasharray="5 3" strokeLinecap="round"/>
                    <circle r="3.5" fill="#EC4899" filter="url(#dotglow)">
                      <animateMotion dur="2s" repeatCount="indefinite" path="M 330 115 C 350 115 350 59 370 59" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                    </circle>
                  </g>

                  {/* Connexion 2 : IA → Slack */}
                  <g ref={el => { connRefs.current[2] = el; }} style={{ opacity:0 }}>
                    <path d="M 330 131 C 350 131 350 189 370 189" stroke="url(#cg2)" strokeWidth="1.5" fill="none" strokeDasharray="5 3" strokeLinecap="round"/>
                    <circle r="3.5" fill="#A78BFA" filter="url(#dotglow)">
                      <animateMotion dur="2.2s" repeatCount="indefinite" path="M 330 131 C 350 131 350 189 370 189" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                    </circle>
                  </g>
                </svg>

                {/* Nœud 0 — Webhook (trigger, toujours visible) */}
                <div ref={el=>{nodeRefs.current[0]=el}} style={{ position:"absolute", left:16, top:58, width:138, opacity:1 }}>
                  <div style={{ background:"rgba(8,5,28,0.92)", border:"1px solid rgba(249,115,22,0.45)", borderRadius:13, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,0.55), 0 0 14px rgba(249,115,22,0.1)" }}>
                    <div style={{ height:2.5, background:"linear-gradient(90deg,#EA580C,#FB923C)" }}/>
                    <div style={{ padding:".55rem .7rem", display:"flex", alignItems:"center", gap:".5rem" }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:"rgba(249,115,22,0.14)", border:"1px solid rgba(249,115,22,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#FB923C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize:".72rem", fontWeight:800, color:"#fff", letterSpacing:"-0.02em", lineHeight:1.2 }}>Webhook</div>
                        <div style={{ fontSize:".58rem", fontWeight:700, color:"rgba(251,146,60,0.65)", letterSpacing:".05em", marginTop:2 }}>DÉCLENCHEUR</div>
                      </div>
                    </div>
                    <div style={{ padding:".3rem .7rem .45rem", borderTop:"1px solid rgba(249,115,22,0.1)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontSize:".58rem", color:"rgba(255,255,255,0.28)", fontWeight:500 }}>POST /form</span>
                      <span style={{ fontSize:".58rem", color:"#10B981", fontWeight:700 }}>● live</span>
                    </div>
                  </div>
                </div>

                {/* Nœud 1 — IA Kixi */}
                <div ref={el=>{nodeRefs.current[1]=el}} style={{ position:"absolute", left:194, top:98, width:136, opacity:0, transform:"translateY(6px)" }}>
                  <div style={{ background:"rgba(8,5,28,0.92)", border:"1px solid rgba(99,102,241,0.5)", borderRadius:13, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,0.55), 0 0 18px rgba(99,102,241,0.14)" }}>
                    <div style={{ height:2.5, background:"linear-gradient(90deg,#6366F1,#8B5CF6)" }}/>
                    <div style={{ padding:".55rem .7rem", display:"flex", alignItems:"center", gap:".5rem" }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,rgba(99,102,241,0.22),rgba(139,92,246,0.22))", border:"1px solid rgba(99,102,241,0.4)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill="#818CF8"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize:".72rem", fontWeight:800, color:"#fff", letterSpacing:"-0.02em", lineHeight:1.2 }}>Générer texte</div>
                        <div style={{ fontSize:".58rem", fontWeight:700, color:"#818CF8", letterSpacing:".05em", marginTop:2 }}>IA · KIXI</div>
                      </div>
                    </div>
                    <div style={{ padding:".3rem .7rem .45rem", borderTop:"1px solid rgba(99,102,241,0.12)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontSize:".58rem", color:"rgba(255,255,255,0.28)", fontWeight:500 }}>GPT-4o · fr</span>
                      <span style={{ fontSize:".58rem", color:"rgba(165,180,252,0.6)", fontWeight:700 }}>2 sorties →</span>
                    </div>
                  </div>
                </div>

                {/* Nœud 2 — Gmail */}
                <div ref={el=>{nodeRefs.current[2]=el}} style={{ position:"absolute", left:370, top:33, width:128, opacity:0, transform:"translateY(6px)" }}>
                  <div style={{ background:"rgba(8,5,28,0.92)", border:"1px solid rgba(239,68,68,0.38)", borderRadius:13, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,0.55), 0 0 12px rgba(239,68,68,0.08)" }}>
                    <div style={{ height:2.5, background:"linear-gradient(90deg,#DC2626,#F87171)" }}/>
                    <div style={{ padding:".55rem .7rem", display:"flex", alignItems:"center", gap:".5rem" }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.28)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#F87171" strokeWidth="1.7"/><polyline points="22,6 12,13 2,6" stroke="#F87171" strokeWidth="1.7"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize:".72rem", fontWeight:800, color:"#fff", letterSpacing:"-0.02em", lineHeight:1.2 }}>Gmail</div>
                        <div style={{ fontSize:".58rem", fontWeight:700, color:"rgba(248,113,113,0.65)", letterSpacing:".05em", marginTop:2 }}>ENVOYER →</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nœud 3 — Slack */}
                <div ref={el=>{nodeRefs.current[3]=el}} style={{ position:"absolute", left:370, top:163, width:128, opacity:0, transform:"translateY(6px)" }}>
                  <div style={{ background:"rgba(8,5,28,0.92)", border:"1px solid rgba(124,58,237,0.38)", borderRadius:13, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,0.55), 0 0 12px rgba(124,58,237,0.08)" }}>
                    <div style={{ height:2.5, background:"linear-gradient(90deg,#7C3AED,#A78BFA)" }}/>
                    <div style={{ padding:".55rem .7rem", display:"flex", alignItems:"center", gap:".5rem" }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.28)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <rect x="7" y="3" width="3" height="9" rx="1.5" fill="#A78BFA"/>
                          <rect x="14" y="12" width="3" height="9" rx="1.5" fill="#A78BFA"/>
                          <rect x="3" y="14" width="9" height="3" rx="1.5" fill="#A78BFA"/>
                          <rect x="12" y="7" width="9" height="3" rx="1.5" fill="#A78BFA"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize:".72rem", fontWeight:800, color:"#fff", letterSpacing:"-0.02em", lineHeight:1.2 }}>Slack</div>
                        <div style={{ fontSize:".58rem", fontWeight:700, color:"rgba(167,139,250,0.65)", letterSpacing:".05em", marginTop:2 }}>NOTIFIER →</div>
                      </div>
                    </div>
                  </div>
                </div>

                </div>
              </div>

              {/* Barre de statut */}
              <div style={{ padding:".55rem 1.1rem", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.01)" }}>
                <div ref={statusRef} style={{ display:"flex", alignItems:"center", gap:".45rem", fontSize:".68rem", color:"rgba(255,255,255,0.38)", opacity:0, transition:"opacity .4s" }}>
                  <span className="status-dot"/>Workflow actif — 3 exécutions aujourd&apos;hui
                </div>
                <button ref={replayRef} onClick={startAnimation} style={{ display:"none", background:"none", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"7px", padding:".28rem .7rem", fontSize:".65rem", fontWeight:700, color:"rgba(255,255,255,0.4)", cursor:"pointer", fontFamily:"inherit", letterSpacing:".02em" }}>Rejouer ↺</button>
              </div>

            </div>
          </div>
        </div>

        {/* Intégrations strip en bas */}
        <div className="integ-strip" style={{ position:"absolute", bottom:0, left:0, right:0, borderTop:"1px solid rgba(255,255,255,0.05)", padding:"1.5rem 4rem", display:"flex", alignItems:"center", gap:"1.5rem", flexWrap:"wrap", background:"rgba(7,0,26,0.4)", backdropFilter:"blur(20px)", zIndex:1 }}>
          <span style={{ fontSize:".68rem", fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:".1em", textTransform:"uppercase", whiteSpace:"nowrap" }}>Connecté à</span>
          <div style={{ display:"flex", gap:".75rem", flexWrap:"wrap" }}>
            {integrations.map(s=>(
              <span key={s.name} style={{ fontSize:".78rem", fontWeight:600, color:s.color, opacity:.8 }}>{s.name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FEATURES — BENTO ASYMÉTRIQUE ===================== */}
      <section id="fonctionnalites" className="features-section" style={{ padding:"8rem 4rem", position:"relative", overflow:"hidden" }}>
        <div className="orb" style={{ width:600, height:600, background:"radial-gradient(circle,rgba(139,92,246,0.18) 0%,transparent 70%)", filter:"blur(90px)", top:"-100px", right:"-5%", animation:"liquidFloat2 20s ease-in-out infinite" }}/>
        <div className="orb" style={{ width:400, height:400, background:"radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)", filter:"blur(70px)", bottom:"0", left:"5%", animation:"liquidFloat1 16s ease-in-out infinite" }}/>

        <div style={{ maxWidth:"1200px", margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ marginBottom:"5rem" }}>
            <p className="reveal" style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#818CF8", marginBottom:"1rem" }}>Fonctionnalités</p>
            <h2 className="reveal" style={{ fontSize:"clamp(2rem,4vw,3.5rem)", fontWeight:900, letterSpacing:"-0.05em", lineHeight:1.05, color:"#fff", maxWidth:"700px" }}>
              Tout ce dont vous avez besoin.<br />
              <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400 }}>Rien de superflu.</span>
            </h2>
          </div>

          {/* BENTO GRID */}
          <div className="features-bento" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem" }}>

            {/* Grande carte — IA */}
            <div className="glass-dark glass-shimmer reveal reveal-left feat-ia-card" style={{ borderRadius:"24px", padding:"3rem", gridRow:"span 2", display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight:"480px" }}>
              <div>
                <div style={{ width:52, height:52, borderRadius:16, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"2rem", boxShadow:"0 8px 24px rgba(99,102,241,0.4)" }}>
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill="#fff"/></svg>
                </div>
                <h3 style={{ fontSize:"1.5rem", fontWeight:800, letterSpacing:"-0.03em", color:"#fff", marginBottom:"1rem" }}>IA générative</h3>
                <p style={{ fontSize:".95rem", color:"rgba(255,255,255,0.55)", lineHeight:1.8, maxWidth:"380px" }}>
                  Décrivez ce que vous voulez automatiser en langage naturel. Loopflo comprend votre intention et génère le workflow complet — blocs, connexions, configuration.
                </p>
              </div>
              <div style={{ marginTop:"2.5rem" }}>
                <div style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)", borderRadius:12, padding:"1rem 1.25rem", fontSize:".82rem", color:"#A5B4FC", fontStyle:"italic", lineHeight:1.6 }}>
                  &ldquo;Envoie un email à chaque nouveau paiement Stripe avec le résumé de la commande&rdquo;<br/>
                  <span style={{ color:"rgba(165,180,252,0.5)", fontSize:".75rem", marginTop:".5rem", display:"block" }}>→ Workflow généré en 2 secondes</span>
                </div>
              </div>
            </div>

            {/* Petites cartes droite */}
            <div className="glass-dark reveal reveal-right reveal-delay-1" style={{ borderRadius:"20px", padding:"2.25rem" }}>
              <div style={{ width:44, height:44, borderRadius:14, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.5rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#A5B4FC" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#A5B4FC" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#A5B4FC" strokeWidth="1.8"/><path d="M17 13v8M13 17h8" stroke="#A5B4FC" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </div>
              <h3 style={{ fontSize:"1.1rem", fontWeight:800, letterSpacing:"-0.03em", color:"#fff", marginBottom:".6rem" }}>Éditeur visuel drag &amp; drop</h3>
              <p style={{ fontSize:".875rem", color:"rgba(255,255,255,0.45)", lineHeight:1.7 }}>Construisez des workflows complexes en glissant les blocs. Aucune ligne de code, jamais.</p>
            </div>

            <div className="glass-dark reveal reveal-right reveal-delay-2" style={{ borderRadius:"20px", padding:"2.25rem" }}>
              <div style={{ width:44, height:44, borderRadius:14, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.5rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 12C3 12 6 5 12 5C18 5 21 12 21 12C21 12 18 19 12 19C6 19 3 12 3 12Z" stroke="#A5B4FC" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="#A5B4FC" strokeWidth="1.8"/></svg>
              </div>
              <h3 style={{ fontSize:"1.1rem", fontWeight:800, letterSpacing:"-0.03em", color:"#fff", marginBottom:".6rem" }}>Monitoring temps réel</h3>
              <p style={{ fontSize:".875rem", color:"rgba(255,255,255,0.45)", lineHeight:1.7 }}>Chaque exécution tracée. Erreurs identifiées. Corrigez en un clic depuis l&apos;historique.</p>
            </div>

            {/* Carte large — intégrations */}
            <div className="glass-dark reveal reveal-delay-1" style={{ borderRadius:"20px", padding:"2.5rem", gridColumn:"span 2" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"2rem" }}>
                <div style={{ flex:"0 0 auto", maxWidth:"400px" }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.5rem" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#A5B4FC" strokeWidth="1.8" strokeLinejoin="round"/><path d="M2 17L12 22L22 17" stroke="#A5B4FC" strokeWidth="1.8" strokeLinejoin="round"/><path d="M2 12L12 17L22 12" stroke="#A5B4FC" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                  </div>
                  <h3 style={{ fontSize:"1.3rem", fontWeight:800, letterSpacing:"-0.03em", color:"#fff", marginBottom:".75rem" }}>50+ intégrations natives</h3>
                  <p style={{ fontSize:".9rem", color:"rgba(255,255,255,0.45)", lineHeight:1.7 }}>Gmail, Slack, Notion, Stripe, Airtable, Discord, GitHub, Telegram — tout ce que vous utilisez déjà, connecté en un clic.</p>
                </div>
                <div className="integ-grid" style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:".6rem", flex:1, minWidth:"280px" }}>
                  {integrations.map(s=>(
                    <div key={s.name} style={{ padding:".6rem .75rem", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, background:"rgba(255,255,255,0.04)", fontSize:".75rem", fontWeight:700, color:s.color, textAlign:"center", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================== TEMPLATES COMMUNAUTAIRES ===================== */}
      <section id="templates" className="tpl-section" style={{ padding:"8rem 4rem", position:"relative", overflow:"hidden" }}>
        <div className="orb" style={{ width:700, height:500, background:"radial-gradient(circle,rgba(99,102,241,0.2) 0%,rgba(139,92,246,0.1) 50%,transparent 70%)", filter:"blur(80px)", top:"0", left:"50%", transform:"translateX(-50%)", animation:"liquidFloat3 14s ease-in-out infinite" }}/>

        <div style={{ maxWidth:"1200px", margin:"0 auto", position:"relative", zIndex:1 }}>

          {/* Header asymétrique */}
          <div className="tpl-row-inner" style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:"3rem", marginBottom:"4rem", flexWrap:"wrap" }}>
            <div style={{ flex:"0 0 auto", maxWidth:"550px" }}>
              <p className="reveal" style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#818CF8", marginBottom:"1rem" }}>Templates communautaires</p>
              <h2 className="reveal" style={{ fontSize:"clamp(2rem,3.5vw,3rem)", fontWeight:900, letterSpacing:"-0.05em", lineHeight:1.07, color:"#fff" }}>
                Partagez.<br />Importez.<br />
                <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400 }}>Automatisez.</span>
              </h2>
            </div>
            <div className="reveal reveal-right" style={{ flex:"0 0 auto", maxWidth:"380px" }}>
              <p style={{ fontSize:"1rem", color:"rgba(255,255,255,0.5)", lineHeight:1.8, marginBottom:"1.5rem" }}>
                Publiez vos workflows, importez ceux de la communauté. Un template = votre workflow prêt à configurer en quelques minutes.
              </p>
              <a href="/dashboard/templates" style={{ display:"inline-flex", alignItems:"center", gap:".5rem", fontSize:".875rem", fontWeight:700, color:"#A5B4FC", border:"1px solid rgba(129,140,248,0.3)", padding:".7rem 1.5rem", borderRadius:10, background:"rgba(99,102,241,0.1)", transition:"background .15s" }}>
                Voir la communauté
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
          </div>

          {/* Preview cartes templates */}
          <div className="tpl-preview-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem" }}>
            {[
              { name:"Notification Stripe → Gmail", tools:["Stripe","Gmail"], category:"Notifications", time:"2 min", likes:24, downloads:180 },
              { name:"Lead Webhook → Notion + Slack", tools:["Webhook","Notion","Slack"], category:"Données", time:"5 min", likes:18, downloads:143 },
              { name:"Rapport IA quotidien", tools:["Planifié","IA","Gmail"], category:"IA", time:"3 min", likes:31, downloads:210 },
            ].map((tpl, i) => (
              <div key={i} className={`glass-dark reveal reveal-delay-${i+1}`} style={{ borderRadius:"18px", overflow:"hidden" }}>
                <div style={{ padding:"1rem 1.5rem", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:".4rem", flexWrap:"wrap" }}>
                  {tpl.tools.map(t=>(
                    <span key={t} style={{ fontSize:".72rem", fontWeight:700, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", padding:".2rem .55rem", borderRadius:100 }}>{t}</span>
                  ))}
                </div>
                <div style={{ padding:"1.25rem 1.5rem" }}>
                  <div style={{ display:"flex", gap:".5rem", alignItems:"center", marginBottom:".6rem" }}>
                    <span style={{ fontSize:".68rem", fontWeight:700, background:"rgba(99,102,241,0.15)", color:"#A5B4FC", padding:".15rem .5rem", borderRadius:100, textTransform:"uppercase", letterSpacing:".06em" }}>{tpl.category}</span>
                    <span style={{ fontSize:".7rem", color:"rgba(255,255,255,0.3)" }}>· {tpl.time} de config</span>
                  </div>
                  <h3 style={{ fontSize:".95rem", fontWeight:700, color:"#fff", marginBottom:"1rem", lineHeight:1.4 }}>{tpl.name}</h3>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", gap:"1rem" }}>
                      <span style={{ fontSize:".75rem", color:"rgba(255,255,255,0.35)" }}>♥ {tpl.likes}</span>
                      <span style={{ fontSize:".75rem", color:"rgba(255,255,255,0.35)" }}>↓ {tpl.downloads}</span>
                    </div>
                    <a href="/login" style={{ fontSize:".75rem", fontWeight:700, color:"#818CF8" }}>Importer →</a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA publier */}
          <div className="reveal" style={{ marginTop:"2rem", textAlign:"center" }}>
            <a href="/dashboard/templates/publish" style={{ display:"inline-flex", alignItems:"center", gap:".4rem", fontSize:".85rem", fontWeight:600, color:"rgba(255,255,255,0.5)", border:"1px solid rgba(255,255,255,0.08)", padding:".65rem 1.5rem", borderRadius:100, background:"rgba(255,255,255,0.03)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
              Publier votre premier template
            </a>
          </div>
        </div>
      </section>

      {/* ===================== PRICING ===================== */}
      <section id="pricing" className="pricing-section" style={{ padding:"8rem 4rem", position:"relative", overflow:"hidden" }}>
        <div className="orb" style={{ width:600, height:600, background:"radial-gradient(circle,rgba(99,102,241,0.22) 0%,transparent 70%)", filter:"blur(80px)", top:"-100px", left:"50%", transform:"translateX(-50%)" }}/>
        <div className="orb" style={{ width:350, height:350, background:"radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)", filter:"blur(70px)", bottom:"0", right:"10%" }}/>

        <div style={{ maxWidth:"1100px", margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ marginBottom:"4rem" }}>
            <p className="reveal" style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#818CF8", marginBottom:"1rem" }}>Tarifs</p>
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"2rem" }}>
              <h2 className="reveal" style={{ fontSize:"clamp(2rem,4vw,3rem)", fontWeight:900, letterSpacing:"-0.05em", lineHeight:1.05, color:"#fff" }}>
                Simple, transparent,<br/>
                <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400 }}>sans surprise.</span>
              </h2>
              {/* Toggle */}
              <div className="reveal" style={{ display:"inline-flex", alignItems:"center", gap:".5rem", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"100px", padding:".35rem .6rem" }}>
                <button onClick={()=>setBilling("monthly")} style={{ fontSize:".82rem", fontWeight:700, color:billing==="monthly"?"#fff":"rgba(255,255,255,0.4)", background:billing==="monthly"?"rgba(99,102,241,0.5)":"transparent", border:"none", borderRadius:"100px", padding:".3rem .8rem", cursor:"pointer", fontFamily:"inherit", transition:"all .2s" }}>Mensuel</button>
                <button onClick={()=>setBilling("annual")} style={{ fontSize:".82rem", fontWeight:700, color:billing==="annual"?"#fff":"rgba(255,255,255,0.4)", background:billing==="annual"?"rgba(99,102,241,0.5)":"transparent", border:"none", borderRadius:"100px", padding:".3rem .8rem", cursor:"pointer", fontFamily:"inherit", transition:"all .2s", display:"flex", alignItems:"center", gap:".4rem" }}>
                  Annuel <span style={{ fontSize:".65rem", fontWeight:700, color:"#6EE7B7", background:"rgba(16,185,129,0.15)", border:"1px solid rgba(16,185,129,0.3)", padding:".1rem .4rem", borderRadius:"100px" }}>-20%</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pricing-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", alignItems:"start" }}>
            {plans.map((p, i) => (
              <div key={i} className={`pricing-card reveal reveal-delay-${i+1}`} style={{
                background:p.featured?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.04)",
                border:p.featured?"1px solid rgba(129,140,248,0.5)":"1px solid rgba(255,255,255,0.08)",
                borderRadius:"20px", padding:"2rem", position:"relative",
                backdropFilter:"blur(30px)", WebkitBackdropFilter:"blur(30px)",
                boxShadow:p.featured?"0 0 0 1px rgba(129,140,248,0.25),0 24px 60px rgba(79,70,229,0.2),inset 0 1px 0 rgba(255,255,255,0.12)":"inset 0 1px 0 rgba(255,255,255,0.07)",
                transform:p.featured?"scale(1.04)":"scale(1)",
              }}>
                {p.featured && <div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)", fontSize:".65rem", fontWeight:800, color:"#fff", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", padding:".25rem .9rem", borderRadius:"100px", whiteSpace:"nowrap", boxShadow:"0 4px 12px rgba(99,102,241,0.5)" }}>Le plus populaire</div>}
                <p style={{ fontSize:".68rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:p.featured?"#A5B4FC":"rgba(255,255,255,0.4)", marginBottom:".6rem" }}>{p.name}</p>
                <div style={{ fontSize:p.featured?"2.4rem":"2rem", fontWeight:900, letterSpacing:"-0.05em", marginBottom:".15rem", color:"#fff" }}>
                  {billing==="annual"?p.annual:p.monthly}
                  {p.monthly!=="0€" && <span style={{ fontSize:".85rem", fontWeight:400, color:"rgba(255,255,255,0.35)" }}> /mois</span>}
                </div>
                {billing==="annual"&&p.monthly!=="0€" && <p style={{ fontSize:".72rem", color:"#6EE7B7", marginBottom:".3rem", fontWeight:600 }}>Facturé annuellement</p>}
                <p style={{ fontSize:".82rem", color:"rgba(255,255,255,0.4)", marginBottom:"1.5rem", lineHeight:1.5 }}>{p.desc}</p>
                <div style={{ height:"1px", background:p.featured?"rgba(129,140,248,0.2)":"rgba(255,255,255,0.06)", marginBottom:"1.25rem" }}/>
                <ul style={{ listStyle:"none", marginBottom:"2rem" }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ fontSize:".83rem", color:p.featured?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.55)", padding:".35rem 0", display:"flex", alignItems:"center", gap:".6rem" }}>
                      <span style={{ width:16, height:16, borderRadius:"50%", background:p.featured?"rgba(99,102,241,0.3)":"rgba(255,255,255,0.07)", border:p.featured?"1px solid rgba(129,140,248,0.35)":"1px solid rgba(255,255,255,0.1)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke={p.featured?"#A5B4FC":"rgba(255,255,255,0.5)"} strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                {p.name==="Free"?(
                  <a href={p.ctaHref} className="cta-btn" style={{ width:"100%", padding:".75rem", borderRadius:"10px", fontSize:".875rem", fontWeight:700, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.65)", display:"block", textAlign:"center" }}>{p.cta}</a>
                ):(
                  <button onClick={()=>setBetaModal(p.name)} className="cta-btn" style={{ width:"100%", padding:".75rem", borderRadius:"10px", fontSize:".875rem", fontWeight:700, background:p.featured?"linear-gradient(135deg,#6366F1,#8B5CF6)":p.name==="Business"?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.07)", border:p.featured?"none":"1px solid rgba(255,255,255,0.1)", color:"#fff", cursor:"pointer", fontFamily:"inherit", boxShadow:p.featured?"0 4px 20px rgba(99,102,241,0.45)":"none" }}>{p.cta}</button>
                )}
              </div>
            ))}
          </div>

          <div className="reveal" style={{ textAlign:"center", marginTop:"2.5rem", display:"flex", justifyContent:"center", gap:"2rem", flexWrap:"wrap" }}>
            {["Annulation à tout moment","Sans carte bancaire","Support réactif","Données 100% sécurisées"].map(g=>(
              <div key={g} style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".78rem", color:"rgba(255,255,255,0.3)", fontWeight:500 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 6l2.5 2.5L10.5 2" stroke="rgba(99,102,241,0.6)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {g}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section id="faq" className="faq-section" style={{ padding:"8rem 4rem", position:"relative", overflow:"hidden" }}>
        <div className="orb" style={{ width:500, height:400, background:"radial-gradient(circle,rgba(167,139,250,0.1) 0%,transparent 70%)", filter:"blur(80px)", top:"50%", left:"50%", transform:"translate(-50%,-50%)" }}/>

        <div style={{ maxWidth:"1100px", margin:"0 auto", position:"relative", zIndex:1 }}>
          <div className="faq-cols" style={{ display:"flex", gap:"6rem", alignItems:"flex-start" }}>
            <div style={{ flex:"0 0 auto", maxWidth:"280px", position:"sticky", top:"7rem" }}>
              <p className="reveal" style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#818CF8", marginBottom:"1rem" }}>FAQ</p>
              <h2 className="reveal" style={{ fontSize:"clamp(1.8rem,3vw,2.5rem)", fontWeight:900, letterSpacing:"-0.05em", lineHeight:1.1, color:"#fff", marginBottom:"1.5rem" }}>Questions fréquentes.</h2>
              <p className="reveal" style={{ fontSize:".875rem", color:"rgba(255,255,255,0.4)", lineHeight:1.75 }}>Une question non listée ? Contactez-nous directement.</p>
              <a className="reveal" href="mailto:loopflo.contact@gmail.com" style={{ display:"inline-block", marginTop:"1.5rem", fontSize:".82rem", fontWeight:700, color:"#818CF8" }}>loopflo.contact@gmail.com →</a>
            </div>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:".6rem" }}>
              {faq.map((item, i) => <FaqItem key={i} q={item.q} a={item.a}/>)}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== BIG CTA ===================== */}
      <section className="cta-section" style={{ padding:"8rem 4rem", position:"relative", overflow:"hidden", textAlign:"center" }}>
        <div className="orb" style={{ width:900, height:700, background:"radial-gradient(circle,rgba(99,102,241,0.18) 0%,rgba(139,92,246,0.08) 50%,transparent 70%)", filter:"blur(60px)", top:"50%", left:"50%", transform:"translate(-50%,-50%)" }}/>
        <div className="orb" style={{ width:300, height:300, background:"rgba(139,92,246,0.12)", filter:"blur(60px)", top:"10%", left:"5%", animation:"liquidFloat2 16s ease-in-out infinite" }}/>
        <div className="orb" style={{ width:250, height:250, background:"rgba(99,102,241,0.1)", filter:"blur(50px)", bottom:"10%", right:"8%", animation:"liquidFloat1 12s ease-in-out infinite" }}/>

        <div style={{ position:"relative", zIndex:1, maxWidth:"640px", margin:"0 auto" }}>
          <h2 className="reveal" style={{ fontSize:"clamp(2.5rem,5vw,4rem)", fontWeight:900, color:"#fff", letterSpacing:"-0.05em", lineHeight:1.07, marginBottom:"1.5rem" }}>
            Votre premier workflow<br/>
            <span style={{ background:"linear-gradient(135deg,#818CF8,#C4B5FD)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>en moins de 5 minutes.</span>
          </h2>
          <p className="reveal" style={{ fontSize:"1.05rem", color:"rgba(255,255,255,0.5)", lineHeight:1.75, marginBottom:"3rem" }}>
            Rejoignez les automatiseurs qui gagnent des heures chaque semaine. Gratuit, sans carte bancaire.
          </p>
          <div className="reveal" style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
            <a href="/register" className="cta-btn" style={{ fontSize:"1rem", fontWeight:800, background:"#fff", color:"#312e81", padding:"1rem 2.5rem", borderRadius:12, boxShadow:"0 4px 24px rgba(0,0,0,.25)", letterSpacing:"-0.02em" }}>
              Commencer gratuitement →
            </a>
            <a href="#pricing" className="cta-btn" style={{ fontSize:"1rem", fontWeight:600, color:"rgba(255,255,255,0.65)", padding:"1rem 2rem", borderRadius:12, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.04)" }}>
              Voir les tarifs
            </a>
          </div>
          <p className="reveal" style={{ marginTop:"1.5rem", fontSize:".78rem", color:"rgba(255,255,255,0.25)" }}>Aucune carte bancaire · Annulation à tout moment</p>
        </div>
      </section>

      {/* ===================== CONTACT + FOOTER ===================== */}
      <section id="contact" className="contact-section" style={{ padding:"5rem 4rem 4rem", borderTop:"1px solid rgba(255,255,255,0.05)", position:"relative" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"4rem", marginBottom:"4rem" }}>
            <div>
              <h2 className="reveal" style={{ fontSize:"1.75rem", fontWeight:900, letterSpacing:"-0.04em", color:"#fff", marginBottom:".75rem" }}>Contactez-nous</h2>
              <p className="reveal" style={{ fontSize:".9rem", color:"rgba(255,255,255,0.4)", maxWidth:380, lineHeight:1.75 }}>Question, bug, suggestion ? On répond vite.</p>
            </div>
            <div className="contact-grid reveal" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", flex:"0 0 auto" }}>
              <div className="glass-dark" style={{ borderRadius:16, padding:"1.75rem", minWidth:220 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:"rgba(79,70,229,0.15)", border:"1px solid rgba(79,70,229,0.25)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <h3 style={{ fontSize:".9rem", fontWeight:700, color:"#fff", marginBottom:".4rem" }}>Email</h3>
                <a href="mailto:loopflo.contact@gmail.com" style={{ fontSize:".8rem", fontWeight:600, color:"#818CF8" }}>loopflo.contact@gmail.com</a>
              </div>
              <div className="glass-dark" style={{ borderRadius:16, padding:"1.75rem", minWidth:220 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <h3 style={{ fontSize:".9rem", fontWeight:700, color:"#fff", marginBottom:".4rem" }}>Signaler un bug</h3>
                <a href="mailto:loopflo.contact@gmail.com?subject=Bug Loopflo" style={{ fontSize:".8rem", fontWeight:600, color:"#F87171" }}>Signaler →</a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:"2rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
            <span style={{ fontSize:"1.1rem", fontWeight:900, color:"#fff", letterSpacing:"-0.04em" }}>Loop<span style={{ color:"#6366F1" }}>flo</span></span>
            <p style={{ fontSize:".78rem", color:"rgba(255,255,255,0.25)" }}>© 2026 Loopflo. Tous droits réservés.</p>
            <div style={{ display:"flex", gap:"1.5rem" }}>
              {[["Connexion","/login"],["S'inscrire","/register"],["Tarifs","/pricing"],["Contact","mailto:loopflo.contact@gmail.com"],["Templates","/dashboard/templates"]].map(([label,href])=>(
                <a key={label} href={href} style={{ fontSize:".8rem", color:"rgba(255,255,255,0.35)", transition:"color .15s" }} onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.7)")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.35)")}>{label}</a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== MODAL BETA ===================== */}
      {betaModal && (
        <div onClick={()=>setBetaModal(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", backdropFilter:"blur(6px)" }}>
          <div onClick={e=>e.stopPropagation()} className="glass-dark" style={{ borderRadius:20, padding:"2.5rem", maxWidth:420, width:"100%", boxShadow:"0 32px 80px rgba(0,0,0,.5)", fontFamily:"'Plus Jakarta Sans',sans-serif", border:"1px solid rgba(255,255,255,0.12) !important" }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.25rem" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <h3 style={{ fontSize:"1.2rem", fontWeight:900, letterSpacing:"-0.03em", marginBottom:".5rem", color:"#fff" }}>Disponible bientôt</h3>
            <p style={{ fontSize:".9rem", color:"rgba(255,255,255,0.55)", lineHeight:1.7, marginBottom:"1.5rem" }}>
              Le paiement sera disponible au lancement. Contactez-nous pour tester le plan <strong style={{ color:"#A5B4FC" }}>{betaModal}</strong> gratuitement.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
              <a href={`mailto:loopflo.contact@gmail.com?subject=Accès bêta plan ${betaModal}&body=Bonjour, je souhaite tester le plan ${betaModal}.`} style={{ display:"block", padding:".85rem", borderRadius:12, fontSize:".9rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", textAlign:"center" }}>Contacter l&apos;équipe →</a>
              <button onClick={()=>setBetaModal(null)} style={{ padding:".85rem", borderRadius:12, fontSize:".9rem", fontWeight:600, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontFamily:"inherit" }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
