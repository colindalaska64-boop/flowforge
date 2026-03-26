"use client";
import { useEffect, useRef, useState } from "react";

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, overflow:"hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.25rem", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", textAlign:"left", gap:"1rem" }}>
        <span style={{ fontSize:".9rem", fontWeight:600, color:"#0A0A0A" }}>{q}</span>
        <span style={{ fontSize:"1.2rem", color:"#9CA3AF", flexShrink:0, transition:"transform .2s", transform: open ? "rotate(45deg)" : "none", lineHeight:1 }}>+</span>
      </button>
      {open && (
        <div style={{ padding:"0 1.25rem 1rem" }}>
          <p style={{ fontSize:".85rem", color:"#6B7280", lineHeight:1.75 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

const FULL_TEXT =
  "Quand je reçois un email avec une facture → enregistre dans Sheets → notifie l'équipe sur Slack";

// Hook pour les animations au scroll
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
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// Hook pour le compteur animé
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

export default function Home() {
  const aiTextRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const replayRef = useRef<HTMLButtonElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const connRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [email, setEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitlistMsg, setWaitlistMsg] = useState("");

  useScrollReveal();

  async function handleWaitlist() {
    if (!email || !email.includes("@")) {
      setWaitlistStatus("error");
      setWaitlistMsg("Entrez un email valide.");
      return;
    }
    setWaitlistStatus("loading");
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      setWaitlistStatus("success");
      setWaitlistMsg(data.message);
      setEmail("");
    } else {
      setWaitlistStatus("error");
      setWaitlistMsg(data.error);
    }
  }

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

  function showEl(el: HTMLElement | null, delay: number) {
    if (!el) return;
    setTimeout(() => {
      el.style.opacity = "1";
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

  function toggleMenu() {
    const menu = document.getElementById("nav-mobile");
    menu?.classList.toggle("open");
  }

  const nodes = [
    { label: "Gmail", iconBg: "#FEF2F2", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#DC2626" strokeWidth="1.5"/><path d="M2 6L12 13L22 6" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { label: "Filtre IA", iconBg: "#EEF2FF", icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill="#4F46E5"/></svg> },
    { label: "Sheets", iconBg: "#F0FDF4", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#16A34A" strokeWidth="1.5"/><path d="M3 9H21M3 15H21M9 3V21" stroke="#16A34A" strokeWidth="1.5"/></svg> },
    { label: "Slack", iconBg: "#FDF4FF", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="8.5" cy="5.5" r="2.5" fill="#7C3AED" opacity="0.8"/><circle cx="15.5" cy="5.5" r="2.5" fill="#7C3AED" opacity="0.5"/><circle cx="8.5" cy="18.5" r="2.5" fill="#7C3AED" opacity="0.5"/><circle cx="15.5" cy="18.5" r="2.5" fill="#7C3AED" opacity="0.8"/><line x1="8.5" y1="8" x2="8.5" y2="16" stroke="#7C3AED" strokeWidth="2" opacity="0.7"/><line x1="11" y1="12" x2="13" y2="12" stroke="#7C3AED" strokeWidth="2" opacity="0.7"/></svg> },
  ];

  const features = [
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill="#4F46E5"/></svg>, title: "IA générative", desc: "Décrivez votre automatisation en langage naturel. LoopFlo la construit en quelques secondes." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#4F46E5" strokeWidth="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#4F46E5" strokeWidth="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#4F46E5" strokeWidth="1.5"/><path d="M17 13V21M13 17H21" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: "Éditeur visuel", desc: "Drag & drop intuitif. Construisez des workflows complexes sans jamais ouvrir un éditeur de code." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 12C3 12 6 5 12 5C18 5 21 12 21 12C21 12 18 19 12 19C6 19 3 12 3 12Z" stroke="#4F46E5" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="#4F46E5" strokeWidth="1.5"/></svg>, title: "Monitoring temps réel", desc: "Suivez chaque exécution, identifiez les erreurs et corrigez-les instantanément." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#4F46E5" strokeWidth="1.5" strokeLinejoin="round"/><path d="M2 17L12 22L22 17" stroke="#4F46E5" strokeWidth="1.5" strokeLinejoin="round"/><path d="M2 12L12 17L22 12" stroke="#4F46E5" strokeWidth="1.5" strokeLinejoin="round"/></svg>, title: "9+ intégrations", desc: "Gmail, Slack, Notion, Stripe, Airtable, Discord, Sheets — tout ce que vous utilisez déjà, connecté en un clic." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#4F46E5" strokeWidth="1.5"/><path d="M7 11V7C7 4.79 9.24 3 12 3C14.76 3 17 4.79 17 7V11" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: "Données sécurisées", desc: "Vos connexions sont chiffrées. Hébergé sur Supabase et Vercel, conformité RGPD en cours." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#4F46E5" strokeWidth="1.5"/><path d="M2 12H22M12 2C9.33 5.33 8 8.67 8 12C8 15.33 9.33 18.67 12 22C14.67 18.67 16 15.33 16 12C16 8.67 14.67 5.33 12 2Z" stroke="#4F46E5" strokeWidth="1.5"/></svg>, title: "Marketplace (bientôt)", desc: "Des workflows prêts à l'emploi créés et partagés par la communauté Loopflo. En cours de développement." },
  ];

  const [yearly, setYearly] = useState(false);

  const plans = [
    { name: "Free", monthly: 0, yearly: 0, desc: "Pour découvrir l'automatisation.", features: ["100 tâches / mois", "5 workflows actifs", "Webhook, Gmail, Sheets", "Support communauté"], featured: false },
    { name: "Starter", monthly: 7, yearly: 5.6, desc: "Pour les freelances et solopreneurs.", features: ["2 000 tâches / mois", "Workflows illimités", "Toutes les intégrations + IA", "Support email prioritaire"], featured: true },
    { name: "Pro", monthly: 19, yearly: 15.2, desc: "Pour les PME et équipes en croissance.", features: ["10 000 tâches / mois", "Workflows illimités", "IA générative incluse", "Support chat en direct"], featured: false },
  ];

  const stats = [
    { value: 9, suffix: "+", label: "Intégrations natives" },
    { value: 5, suffix: " min", label: "Pour créer votre 1er workflow" },
    { value: 99, suffix: "%", label: "Uptime Vercel garanti" },
    { value: 0, suffix: "€", label: "Pour commencer", prefix: "" },
  ];

  const c1 = useCounter(9, 800);
  const c2 = useCounter(5, 800);
  const c3 = useCounter(99, 1500);
  const c4 = useCounter(0, 500);
  const counters = [c1, c2, c3, c4];

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
        .conn-el::after { content:''; position:absolute; right:-4px; top:50%; transform:translateY(-50%); border:4px solid transparent; border-left-color:#9CA3AF; }
        .moving-dot { position:absolute; top:50%; transform:translateY(-50%); width:5px; height:5px; border-radius:50%; background:#4F46E5; animation:moveDot 2.2s ease-in-out infinite; }
        .moving-dot:nth-child(2) { animation-delay:.7s; }
        @keyframes moveDot { 0%{left:0;opacity:0} 15%{opacity:1} 85%{opacity:1} 100%{left:100%;opacity:0} }
        .ai-cursor { display:inline-block; width:2px; height:13px; background:#4F46E5; margin-left:1px; vertical-align:middle; animation:blink .8s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .status-dot { width:6px; height:6px; border-radius:50%; background:#10B981; animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        .badge-dot { width:6px; height:6px; border-radius:50%; background:#4F46E5; display:inline-block; animation:pulse 2s infinite; }
        .nav-burger { display:none; flex-direction:column; gap:5px; cursor:pointer; background:none; border:none; padding:4px; }
        .nav-burger span { width:22px; height:2px; background:#0A0A0A; border-radius:2px; display:block; }
        .nav-mobile { display:none; flex-direction:column; position:fixed; top:57px; left:0; right:0; background:#fff; border-bottom:1px solid #E5E7EB; padding:1rem 1.5rem; gap:.75rem; z-index:99; box-shadow:0 8px 24px rgba(0,0,0,.08); }
        .nav-mobile.open { display:flex; }
        .nav-mobile a { font-size:.95rem; color:#374151; font-weight:500; padding:.6rem 0; border-bottom:1px solid #F3F4F6; }
        .nav-mobile-cta { display:flex; flex-direction:column; gap:.75rem; margin-top:.25rem; }
        .waitlist-form { display:flex; gap:.5rem; width:100%; max-width:440px; margin-top:2rem; }
        .waitlist-input { flex:1; padding:.75rem 1rem; border:1px solid #E5E7EB; border-radius:10px; font-size:.9rem; font-family:inherit; outline:none; background:#fff; transition:border-color .15s; }
        .waitlist-input:focus { border-color:#818CF8; box-shadow:0 0 0 3px #EEF2FF; }
        .waitlist-btn { padding:.75rem 1.25rem; background:#4F46E5; color:#fff; border:none; border-radius:10px; font-size:.875rem; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; transition:background .15s, transform .1s; }
        .waitlist-btn:hover { background:#4338CA; transform:translateY(-1px); }
        .waitlist-btn:active { transform:translateY(0); }
        .waitlist-btn:disabled { background:#9CA3AF; cursor:not-allowed; transform:none; }
        .waitlist-success { display:flex; align-items:center; gap:.5rem; font-size:.85rem; color:#059669; background:#ECFDF5; border:1px solid #A7F3D0; padding:.6rem 1rem; border-radius:8px; margin-top:.75rem; animation:slideUp .3s ease; }
        .waitlist-error { font-size:.82rem; color:#DC2626; margin-top:.5rem; animation:shake .3s ease; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        
        /* ===== SCROLL REVEAL ===== */
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        /* Délais en cascade pour les grilles */
        .reveal-delay-1 { transition-delay: 0.08s; }
        .reveal-delay-2 { transition-delay: 0.16s; }
        .reveal-delay-3 { transition-delay: 0.24s; }
        .reveal-delay-4 { transition-delay: 0.32s; }
        .reveal-delay-5 { transition-delay: 0.40s; }
        .reveal-delay-6 { transition-delay: 0.48s; }

        /* Variante slide depuis la gauche */
        .reveal-left {
          opacity: 0;
          transform: translateX(-24px);
          transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal-left.revealed { opacity:1; transform:translateX(0); }

        /* Variante scale */
        .reveal-scale {
          opacity: 0;
          transform: scale(0.96) translateY(16px);
          transition: opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal-scale.revealed { opacity:1; transform:scale(1) translateY(0); }

        .feature-card { transition:background .15s, box-shadow .2s, transform .2s; }
        .feature-card:hover { background:#FAFAFA !important; transform:translateY(-2px); box-shadow:0 4px 20px rgba(0,0,0,.06) !important; }
        .pricing-card { transition:box-shadow .2s, transform .2s; }
        .pricing-card:hover { box-shadow:0 8px 32px rgba(0,0,0,.08) !important; transform:translateY(-3px); }
        .cta-btn { transition:background .15s, transform .1s, box-shadow .15s; }
        .cta-btn:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(79,70,229,.3); }
        .cta-btn:active { transform:translateY(0); }

        @media (max-width:768px) {
          .nav-links-desktop { display:none !important; }
          .nav-cta-desktop { display:none !important; }
          .nav-burger { display:flex !important; }
          .nav-wrap { padding:.9rem 1.25rem !important; }
          .hero-section { padding:6rem 1.25rem 3rem !important; }
          .hero-title { font-size:2.2rem !important; }
          .hero-sub { font-size:.95rem !important; }
          .waitlist-form { flex-direction:column !important; }
          .waitlist-btn { width:100% !important; }
          .stats-grid { grid-template-columns:repeat(2,1fr) !important; }
          .features-grid { grid-template-columns:1fr !important; }
          .pricing-grid { grid-template-columns:1fr !important; }
          .section-wrap { padding-left:1.25rem !important; padding-right:1.25rem !important; }
          .canvas-nodes { flex-wrap:wrap !important; gap:.5rem !important; }
          .conn-el { display:none !important; }
          .contact-grid { grid-template-columns:1fr !important; }
        }
        @media (max-width:480px) {
          .hero-title { font-size:1.8rem !important; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav-wrap" style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"1rem 3rem", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(250,250,250,0.88)", backdropFilter:"blur(20px)", borderBottom:"1px solid #EBEBEB" }}>
        <div style={{ fontWeight:800, fontSize:"1.2rem", letterSpacing:"-0.03em" }}>
          Loop<span style={{ color:"#4F46E5" }}>flo</span>
        </div>
        <ul className="nav-links-desktop" style={{ display:"flex", gap:"2.5rem", listStyle:"none" }}>
          {["Fonctionnalités","Intégrations","Pricing","Docs"].map((item) => (
            <li key={item}><a href="#" className="nav-link">{item}</a></li>
          ))}
        </ul>
        <div className="nav-cta-desktop" style={{ display:"flex", gap:".75rem", alignItems:"center" }}>
          <a href="/login" style={{ fontSize:".875rem", color:"#6B7280", padding:".5rem 1rem", borderRadius:"8px" }}>Se connecter</a>
          <a href="/register" className="cta-btn" style={{ fontSize:".875rem", fontWeight:600, background:"#0A0A0A", color:"#fff", padding:".55rem 1.25rem", borderRadius:"8px" }}>Commencer gratuitement</a>
        </div>
        <button className="nav-burger" onClick={toggleMenu}>
          <span></span><span></span><span></span>
        </button>
      </nav>

      {/* MENU MOBILE */}
      <div className="nav-mobile" id="nav-mobile">
        {["Fonctionnalités","Intégrations","Pricing","Docs"].map((item) => (
          <a key={item} href="#">{item}</a>
        ))}
        <div className="nav-mobile-cta">
          <a href="/login" style={{ fontSize:".95rem", fontWeight:600, color:"#374151", padding:".75rem", borderRadius:"10px", border:"1px solid #E5E7EB", textAlign:"center" }}>Se connecter</a>
          <a href="/register" style={{ fontSize:".95rem", fontWeight:600, color:"#fff", background:"#4F46E5", padding:".75rem", borderRadius:"10px", textAlign:"center" }}>Commencer gratuitement</a>
        </div>
      </div>

      {/* HERO */}
      <section className="hero-section section-wrap" style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"8rem 2rem 5rem" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:".5rem", fontSize:".75rem", fontWeight:600, color:"#4F46E5", background:"#EEF2FF", border:"1px solid #C7D2FE", padding:".3rem .9rem", borderRadius:"100px", marginBottom:"2rem", animation:"slideUp .5s ease .1s both" }}>
          <span className="badge-dot"></span>
          Bêta ouverte — Rejoignez la waitlist
        </div>

        <h1 className="hero-title" style={{ fontSize:"clamp(2.6rem,5.5vw,4.4rem)", fontWeight:800, lineHeight:1.1, letterSpacing:"-0.035em", maxWidth:"760px", animation:"slideUp .6s ease .2s both" }}>
          Automatisez tout,<br />sans <span style={{ color:"#4F46E5" }}>écrire une ligne.</span>
        </h1>

        <p className="hero-sub" style={{ marginTop:"1.25rem", fontSize:"1rem", color:"#6B7280", maxWidth:"460px", lineHeight:1.75, animation:"slideUp .6s ease .3s both" }}>
          Décrivez votre workflow en français. L&apos;IA le construit pour vous en quelques secondes.
        </p>

        {/* WAITLIST */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"100%", animation:"slideUp .6s ease .4s both" }}>
          <div className="waitlist-form">
            <input type="email" className="waitlist-input" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleWaitlist()} disabled={waitlistStatus === "loading" || waitlistStatus === "success"} />
            <button className="waitlist-btn" onClick={handleWaitlist} disabled={waitlistStatus === "loading" || waitlistStatus === "success"}>
              {waitlistStatus === "loading" ? "Envoi..." : "Rejoindre →"}
            </button>
          </div>
          {waitlistStatus === "success" && (
            <div className="waitlist-success">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5 6.5-6.5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {waitlistMsg}
            </div>
          )}
          {waitlistStatus === "error" && <p className="waitlist-error">{waitlistMsg}</p>}
        </div>

        <p style={{ marginTop:".75rem", fontSize:".75rem", color:"#9CA3AF", animation:"slideUp .6s ease .5s both" }}>
          Gratuit, sans spam
        </p>

        {/* CANVAS */}
        <div className="reveal reveal-scale" style={{ marginTop:"3.5rem", width:"100%", maxWidth:"820px" }}>
          <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.06), 0 16px 48px rgba(0,0,0,.07)" }}>
            <div style={{ padding:".75rem 1.25rem", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", gap:".5rem", background:"#FAFAFA" }}>
              {["#FCA5A5","#FCD34D","#6EE7B7"].map((c) => (<div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }} />))}
              <span style={{ marginLeft:".5rem", fontSize:".72rem", fontWeight:600, color:"#9CA3AF", letterSpacing:".04em", textTransform:"uppercase" }}>LoopFlo — Éditeur de workflow</span>
            </div>
            <div style={{ padding:"2rem", backgroundImage:"radial-gradient(#E9EAEC 1px, transparent 1px)", backgroundSize:"22px 22px" }}>
              <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:"12px", padding:".75rem 1rem", marginBottom:"2rem", display:"flex", alignItems:"center", gap:".75rem" }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"#4F46E5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill="white"/></svg>
                </div>
                <span style={{ fontSize:".82rem", color:"#4F46E5", fontWeight:500 }}>
                  <span ref={aiTextRef}></span>
                  <span ref={cursorRef} className="ai-cursor" style={{ display:"none" }}></span>
                </span>
              </div>
              <div className="canvas-nodes" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
                {nodes.map((node, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center" }}>
                    <div ref={(el) => { nodeRefs.current[i] = el; }} className="node-el" style={{ background:"#fff", border:`1px solid ${i===0?"#818CF8":"#E5E7EB"}`, borderRadius:"10px", padding:".6rem .9rem", display:"flex", alignItems:"center", gap:".5rem", fontSize:".8rem", fontWeight:600, color:"#1F2937", boxShadow:i===0?"0 0 0 3px #EEF2FF":"0 1px 3px rgba(0,0,0,.06)", opacity:i===0?1:0, transform:i===0?"none":"translateY(8px)", whiteSpace:"nowrap" }}>
                      <div style={{ width:28, height:28, borderRadius:7, background:node.iconBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{node.icon}</div>
                      {node.label}
                    </div>
                    {i < nodes.length - 1 && (
                      <div ref={(el) => { connRefs.current[i] = el; }} className="conn-el" style={{ width:32, height:1, background:"#D1D5DB", position:"relative", flexShrink:0, opacity:0 }}>
                        <div className="moving-dot"></div>
                        <div className="moving-dot"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop:"1.5rem", display:"flex", alignItems:"center", gap:"1rem" }}>
                <div ref={statusRef} style={{ display:"flex", alignItems:"center", gap:".5rem", fontSize:".75rem", color:"#6B7280", opacity:0, transition:"opacity .4s" }}>
                  <span className="status-dot"></span>
                  Workflow actif — 3 exécutions aujourd&apos;hui
                </div>
                <button ref={replayRef} onClick={startAnimation} style={{ display:"none", background:"none", border:"1px solid #E5E7EB", borderRadius:"8px", padding:".35rem .85rem", fontSize:".72rem", fontWeight:600, color:"#6B7280", cursor:"pointer", fontFamily:"inherit" }}>
                  Rejouer
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="section-wrap" style={{ padding:"0 3rem 5rem", maxWidth:"1080px", margin:"0 auto" }}>
        <div className="stats-grid reveal" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", border:"1px solid #E5E7EB", borderRadius:"14px", overflow:"hidden", background:"#fff" }}>
          {stats.map((s, i) => (
            <div key={i} ref={counters[i].ref} style={{ padding:"2rem", textAlign:"center", borderRight:i<3?"1px solid #E5E7EB":"none" }}>
              <div style={{ fontSize:"1.8rem", fontWeight:800, letterSpacing:"-0.03em" }}>
                {s.prefix}{i === 0 ? (counters[i].count >= 10000 ? "10k" : counters[i].count >= 1000 ? `${(counters[i].count/1000).toFixed(1)}k` : counters[i].count) : counters[i].count}{s.suffix}
              </div>
              <div style={{ fontSize:".78rem", color:"#9CA3AF", marginTop:".25rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="section-wrap" style={{ padding:"0 3rem 5rem", maxWidth:"1080px", margin:"0 auto" }}>
        <p className="reveal" style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#4F46E5", marginBottom:".75rem" }}>Fonctionnalités</p>
        <h2 className="reveal" style={{ fontSize:"clamp(1.6rem,3vw,2.3rem)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".75rem" }}>Tout ce dont vous avez besoin.</h2>
        <p className="reveal" style={{ fontSize:".95rem", color:"#6B7280", maxWidth:"440px", lineHeight:1.75, marginBottom:"2.5rem" }}>Une interface pensée pour aller vite, sans sacrifier la puissance.</p>
        <div className="features-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1px", background:"#E5E7EB", border:"1px solid #E5E7EB", borderRadius:"14px", overflow:"hidden" }}>
          {features.map((f, i) => (
            <div key={i} className={`feature-card reveal reveal-delay-${i + 1}`} style={{ padding:"2rem", background:"#fff", cursor:"default" }}>
              <div style={{ width:36, height:36, borderRadius:9, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.25rem" }}>{f.icon}</div>
              <h3 style={{ fontSize:".95rem", fontWeight:700, marginBottom:".5rem" }}>{f.title}</h3>
              <p style={{ fontSize:".84rem", color:"#6B7280", lineHeight:1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="section-wrap" style={{ padding:"0 3rem 6rem", maxWidth:"1080px", margin:"0 auto" }}>
        <p className="reveal" style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#4F46E5", marginBottom:".75rem" }}>Pricing</p>
        <h2 className="reveal" style={{ fontSize:"clamp(1.6rem,3vw,2.3rem)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".75rem" }}>Simple et transparent.</h2>
        <p className="reveal" style={{ fontSize:".95rem", color:"#6B7280", maxWidth:"440px", lineHeight:1.75, marginBottom:"1.75rem" }}>Commencez gratuitement, évoluez selon vos besoins. Annulez à tout moment.</p>

        {/* Toggle mensuel / annuel */}
        <div className="reveal" style={{ display:"flex", alignItems:"center", gap:".75rem", marginBottom:"2.5rem" }}>
          <span style={{ fontSize:".85rem", fontWeight: yearly ? 500 : 700, color: yearly ? "#9CA3AF" : "#0A0A0A" }}>Mensuel</span>
          <button onClick={() => setYearly(!yearly)} style={{ width:44, height:24, borderRadius:"100px", background: yearly ? "#4F46E5" : "#E5E7EB", border:"none", cursor:"pointer", position:"relative", flexShrink:0, transition:"background .2s" }}>
            <div style={{ position:"absolute", top:2, left: yearly ? 22 : 2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,.2)" }} />
          </button>
          <span style={{ fontSize:".85rem", fontWeight: yearly ? 700 : 500, color: yearly ? "#0A0A0A" : "#9CA3AF" }}>
            Annuel
            <span style={{ marginLeft:".4rem", fontSize:".72rem", fontWeight:700, background:"#ECFDF5", color:"#059669", padding:".15rem .5rem", borderRadius:"100px", border:"1px solid #A7F3D0" }}>-20%</span>
          </span>
        </div>

        <div className="pricing-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem" }}>
          {plans.map((p, i) => {
            const price = yearly ? p.yearly : p.monthly;
            return (
              <div key={i} className={`pricing-card reveal reveal-delay-${i + 1}`} style={{ background:"#fff", border:`1px solid ${p.featured?"#818CF8":"#E5E7EB"}`, borderRadius:"14px", padding:"2rem", position:"relative", boxShadow:p.featured?"0 0 0 1px #818CF8, 0 8px 32px rgba(79,70,229,.1)":"none", cursor:"default" }}>
                {p.featured && (
                  <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", fontSize:".68rem", fontWeight:700, color:"#fff", background:"#4F46E5", padding:".25rem .85rem", borderRadius:"100px", whiteSpace:"nowrap" }}>Le plus populaire</div>
                )}
                <p style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:".75rem" }}>{p.name}</p>
                <div style={{ marginBottom:".2rem" }}>
                  <span style={{ fontSize:"2.4rem", fontWeight:800, letterSpacing:"-0.04em" }}>{price}€</span>
                  <span style={{ fontSize:".95rem", fontWeight:400, color:"#9CA3AF" }}> / mois</span>
                </div>
                {yearly && p.monthly > 0 && (
                  <p style={{ fontSize:".75rem", color:"#059669", fontWeight:600, marginBottom:".25rem" }}>
                    Soit {(p.yearly * 12).toFixed(0)}€/an — économisez {((p.monthly - p.yearly) * 12).toFixed(0)}€
                  </p>
                )}
                <p style={{ fontSize:".82rem", color:"#9CA3AF", marginBottom:"1.5rem", marginTop:".25rem" }}>{p.desc}</p>
                <div style={{ height:1, background:"#F3F4F6", marginBottom:"1.25rem" }}></div>
                <ul style={{ listStyle:"none", marginBottom:"1.75rem" }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ fontSize:".84rem", color:"#374151", padding:".35rem 0", display:"flex", alignItems:"center", gap:".6rem" }}>
                      <span style={{ width:16, height:16, borderRadius:"50%", background:"#EEF2FF", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2.5 2.5 4-4" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="/register" className="cta-btn" style={{ width:"100%", padding:".75rem", borderRadius:"8px", fontSize:".875rem", fontWeight:600, background:p.featured?"#4F46E5":"#F9FAFB", border:p.featured?"none":"1px solid #E5E7EB", color:p.featured?"#fff":"#374151", display:"block", textAlign:"center" }}>
                  Commencer →
                </a>
              </div>
            );
          })}
        </div>
        <p className="reveal" style={{ textAlign:"center", marginTop:"1.25rem", fontSize:".82rem", color:"#9CA3AF" }}>
          Besoin de plus ? <a href="/pricing" style={{ color:"#4F46E5", fontWeight:600 }}>Voir tous les plans →</a>
        </p>
      </section>

      {/* FAQ */}
      <section className="section-wrap" style={{ padding:"0 3rem 6rem", maxWidth:"760px", margin:"0 auto" }}>
        <p className="reveal" style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#4F46E5", marginBottom:".75rem", textAlign:"center" }}>FAQ</p>
        <h2 className="reveal" style={{ fontSize:"clamp(1.6rem,3vw,2.3rem)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:"2.5rem", textAlign:"center" }}>Questions fréquentes.</h2>
        <div className="reveal" style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
          {[
            { q:"C'est quoi Loopflo ?", a:"Loopflo est un outil d'automatisation no-code en français. Vous décrivez ce que vous voulez automatiser, l'IA construit le workflow pour vous. Pas besoin de coder." },
            { q:"C'est quoi une tâche ?", a:"Une tâche correspond à une exécution complète d'un workflow. Chaque déclenchement (via webhook, planification, ou test) compte comme une tâche." },
            { q:"Que se passe-t-il si je dépasse ma limite ?", a:"Vos workflows s'arrêtent jusqu'au début du mois suivant. Vous pouvez passer à un plan supérieur à tout moment pour continuer." },
            { q:"Puis-je changer de plan à tout moment ?", a:"Oui, vous pouvez upgrader ou downgrader à tout moment. Le changement est immédiat." },
            { q:"Mes données sont-elles sécurisées ?", a:"Oui. Vos connexions (mots de passe d'apps, tokens API) sont stockées dans Supabase avec chiffrement. Nous ne partageons jamais vos données avec des tiers." },
            { q:"Y a-t-il un engagement ?", a:"Non, aucun engagement. Vous pouvez annuler à tout moment sans frais." },
          ].map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section style={{ background:"#0A0A0A", padding:"5rem 2rem" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto" }}>
          <div className="reveal" style={{ textAlign:"center", marginBottom:"3rem" }}>
            <h2 style={{ fontSize:"2rem", fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:".75rem" }}>Contactez-nous</h2>
            <p style={{ fontSize:"1rem", color:"rgba(255,255,255,0.5)", maxWidth:480, margin:"0 auto" }}>Une question, un bug, une suggestion ? On vous répond rapidement.</p>
          </div>
          <div className="contact-grid reveal" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
            <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"2rem" }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"rgba(79,70,229,0.15)", border:"1px solid rgba(79,70,229,0.3)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <h3 style={{ fontSize:"1rem", fontWeight:700, color:"#fff", marginBottom:".5rem" }}>Email</h3>
              <p style={{ fontSize:".875rem", color:"rgba(255,255,255,0.5)", marginBottom:"1rem", lineHeight:1.6 }}>Pour toute question générale ou commerciale.</p>
              <a href="mailto:loopflo.contact@gmail.com" style={{ fontSize:".875rem", fontWeight:600, color:"#818CF8" }}>loopflo.contact@gmail.com</a>
            </div>
            <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"2rem" }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 style={{ fontSize:"1rem", fontWeight:700, color:"#fff", marginBottom:".5rem" }}>Signaler un bug</h3>
              <p style={{ fontSize:".875rem", color:"rgba(255,255,255,0.5)", marginBottom:"1rem", lineHeight:1.6 }}>Vous avez trouvé un problème ? Aidez-nous à l&apos;améliorer.</p>
              <a href="mailto:loopflo.contact@gmail.com?subject=Bug Loopflo&body=Décrivez le bug ici..." style={{ fontSize:".875rem", fontWeight:600, color:"#F87171" }}>Signaler un bug</a>
            </div>
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", marginTop:"3rem", paddingTop:"2rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
            <span style={{ fontSize:"1.1rem", fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>Loop<span style={{ color:"#4F46E5" }}>flo</span></span>
            <p style={{ fontSize:".8rem", color:"rgba(255,255,255,0.3)" }}>© 2026 Loopflo. Tous droits réservés.</p>
            <div style={{ display:"flex", gap:"1.5rem" }}>
              <a href="/login" style={{ fontSize:".82rem", color:"rgba(255,255,255,0.4)" }}>Connexion</a>
              <a href="/register" style={{ fontSize:".82rem", color:"rgba(255,255,255,0.4)" }}>S&apos;inscrire</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}