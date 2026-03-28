"use client";
import { useEffect, useRef, useState } from "react";

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

function FaqItem({ q, a, delay }: { q: string; a: string; delay: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`card reveal reveal-delay-${delay + 1}`} style={{ borderRadius:"14px", cursor:"pointer", overflow:"hidden" }} onClick={() => setOpen(o => !o)}>
      <div style={{ padding:"1.25rem 1.6rem", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem" }}>
        <span style={{ fontSize:".9rem", fontWeight:600, color:"#0A0A0A" }}>{q}</span>
        <div style={{ width:26, height:26, borderRadius:"50%", background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"transform .2s", transform:open?"rotate(180deg)":"rotate(0deg)" }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 6l5 5 5-5" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
      {open && <div style={{ padding:"0 1.6rem 1.25rem", fontSize:".875rem", color:"#6B7280", lineHeight:1.75 }}>{a}</div>}
    </div>
  );
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
  const [betaModal, setBetaModal] = useState<string | null>(null);
  const [waitlistMsg, setWaitlistMsg] = useState("");
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  useScrollReveal();

  useEffect(() => {
    (window as unknown as Record<string, unknown>).googleTranslateElementInit = () => {
      new (window as unknown as { google: { translate: { TranslateElement: new (opts: unknown, id: string) => void } } }).google.translate.TranslateElement(
        { pageLanguage: "fr", includedLanguages: "fr,en,es,de,it,pt,nl,ar,zh-CN,ja", autoDisplay: false },
        "google_translate_element"
      );
      // Détection automatique de la langue du navigateur
      const browserLang = navigator.language || "";
      if (!browserLang.toLowerCase().startsWith("fr")) {
        // Mapper la langue du navigateur vers le code Google Translate
        const langMap: Record<string, string> = {
          en: "en", es: "es", de: "de", it: "it", pt: "pt",
          nl: "nl", ar: "ar", zh: "zh-CN", ja: "ja",
        };
        const code = browserLang.split("-")[0].toLowerCase();
        const target = langMap[code] || "en";
        // Attendre que le widget soit prêt puis déclencher la traduction
        setTimeout(() => {
          const select = document.querySelector("#google_translate_element select") as HTMLSelectElement | null;
          if (select) {
            select.value = target;
            select.dispatchEvent(new Event("change"));
          }
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
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill="#fff"/></svg>, title: "IA générative", desc: "Décrivez votre automatisation en langage naturel. LoopFlo la construit en quelques secondes." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.5"/><path d="M17 13V21M13 17H21" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: "Éditeur visuel", desc: "Drag & drop intuitif. Construisez des workflows complexes sans jamais ouvrir un éditeur de code." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 12C3 12 6 5 12 5C18 5 21 12 21 12C21 12 18 19 12 19C6 19 3 12 3 12Z" stroke="#fff" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="#fff" strokeWidth="1.5"/></svg>, title: "Monitoring temps réel", desc: "Suivez chaque exécution, identifiez les erreurs et corrigez-les instantanément." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/><path d="M2 17L12 22L22 17" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/><path d="M2 12L12 17L22 12" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/></svg>, title: "50+ intégrations", desc: "Gmail, Slack, Notion, Stripe, Sheets — tout ce que vous utilisez déjà, connecté en un clic." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#fff" strokeWidth="1.5"/><path d="M7 11V7C7 4.79 9.24 3 12 3C14.76 3 17 4.79 17 7V11" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: "Sécurité enterprise", desc: "Chiffrement bout-en-bout, conformité RGPD, SSO et logs d'audit pour les équipes exigeantes." },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.5"/><path d="M2 12H22M12 2C9.33 5.33 8 8.67 8 12C8 15.33 9.33 18.67 12 22C14.67 18.67 16 15.33 16 12C16 8.67 14.67 5.33 12 2Z" stroke="#fff" strokeWidth="1.5"/></svg>, title: "Marketplace (v2)", desc: "Des milliers de workflows prêts à l'emploi créés et partagés par la communauté LoopFlo." },
  ];

  const plans = [
    { name: "Free", monthly: "0€", annual: "0€", desc: "Pour découvrir l'automatisation.", features: ["100 tâches / mois", "5 workflows actifs", "Webhook, Gmail, Sheets", "Support communauté"], featured: false, cta: "Commencer gratuitement", ctaHref: "/register" },
    { name: "Starter", monthly: "7€", annual: "5€", desc: "Pour les freelances et solopreneurs.", features: ["2 000 tâches / mois", "Workflows illimités", "Toutes les intégrations", "Support email prioritaire"], featured: true, cta: "Commencer →", ctaHref: "/register" },
    { name: "Pro", monthly: "19€", annual: "15€", desc: "Pour les PME et équipes en croissance.", features: ["10 000 tâches / mois", "Workflows illimités", "IA générative incluse", "Support chat en direct"], featured: false, cta: "Commencer →", ctaHref: "/register" },
    { name: "Business", monthly: "49€", annual: "39€", desc: "Pour les grandes équipes et entreprises.", features: ["Tâches illimitées", "Workflows illimités", "IA générative incluse", "Support dédié & SLA garanti"], featured: false, cta: "Nous contacter", ctaHref: "mailto:loopflo.contact@gmail.com?subject=Plan Business LoopFlo" },
  ];

  const faq = [
    { q: "C'est quoi une \"tâche\" ?", a: "Une tâche = une action exécutée par un bloc dans un workflow. Envoyer un email, filtrer avec l'IA, écrire dans Sheets — chaque action compte comme une tâche." },
    { q: "Quelle est la différence avec Zapier ou Make ?", a: "LoopFlo est 3× moins cher, entièrement en français, et intègre de l'IA générative nativement. Pas de code, pas de complexité inutile." },
    { q: "Faut-il des compétences techniques ?", a: "Non. L'interface drag & drop et la génération par IA permettent à n'importe qui de créer des automations puissantes en quelques minutes." },
    { q: "Puis-je annuler à tout moment ?", a: "Oui, sans engagement. Annulez en un clic depuis votre tableau de bord. Vous conservez l'accès jusqu'à la fin de la période payée." },
    { q: "Mes données sont-elles sécurisées ?", a: "Oui. Toutes les données sont chiffrées en transit (TLS 1.3) et au repos. Nous sommes conformes RGPD et ne revendons aucune donnée." },
    { q: "Comment fonctionne la facturation annuelle ?", a: "En choisissant le plan annuel, vous économisez l'équivalent de 2 mois. Vous êtes facturé en une fois pour 12 mois d'accès." },
  ];

  const stats = [
    { value: 10000, suffix: "+", label: "Workflows créés" },
    { value: 50, suffix: "+", label: "Intégrations" },
    { value: 99, suffix: ".9%", label: "Uptime garanti" },
    { value: 200, suffix: "ms", label: "Temps d'exécution", prefix: "<" },
  ];

  const c1 = useCounter(10000, 1800);
  const c2 = useCounter(50, 1200);
  const c3 = useCounter(99, 1500);
  const c4 = useCounter(200, 1400);
  const counters = [c1, c2, c3, c4];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#fff; color:#0A0A0A; }
        a { text-decoration:none; color:inherit; }

        /* ===== CARD ===== */
        .card {
          background: #fff;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03);
          transition: box-shadow .22s, transform .22s;
        }
        .card:hover {
          box-shadow: 0 8px 32px rgba(0,0,0,0.10);
          transform: translateY(-3px);
        }

        /* ===== TAG ===== */
        .tag {
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          font-size: .72rem;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: #6366F1;
          background: #EEF2FF;
          border: 1px solid #C7D2FE;
          padding: .3rem .85rem;
          border-radius: 100px;
        }

        /* ===== HERO GLOW ===== */
        .hero-glow {
          position: absolute;
          width: 900px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%);
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
          filter: blur(40px);
        }

        /* ===== SECTIONS ===== */
        .section-white { background: #fff; }
        .section-soft { background: #F9FAFB; }
        .section-indigo-light { background: linear-gradient(180deg, #EEF2FF 0%, #F5F3FF 100%); }
        .cta-section { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%); padding: 7rem 2rem; text-align: center; position: relative; overflow: hidden; }

        /* ===== NAV ===== */
        .nav-link { font-size:.875rem; color:#6B7280; transition:color .15s; }
        .nav-link:hover { color:#0A0A0A; }
        .nav-burger { display:none; flex-direction:column; gap:5px; cursor:pointer; background:none; border:none; padding:4px; }
        .nav-burger span { width:22px; height:2px; background:#0A0A0A; border-radius:2px; display:block; }
        .nav-mobile { display:none; flex-direction:column; position:fixed; top:57px; left:0; right:0; background:#fff; backdrop-filter:blur(20px); border-bottom:1px solid #F0F0F5; padding:1rem 1.5rem; gap:.75rem; z-index:99; }
        .nav-mobile.open { display:flex; }
        .nav-mobile a { font-size:.95rem; color:#374151; font-weight:500; padding:.6rem 0; border-bottom:1px solid #F0F0F5; }
        .nav-mobile-cta { display:flex; flex-direction:column; gap:.75rem; margin-top:.25rem; }

        /* ===== WAITLIST ===== */
        .waitlist-form { display:flex; gap:.5rem; width:100%; max-width:440px; margin-top:2rem; }
        .waitlist-input { flex:1; padding:.75rem 1rem; border:1px solid #E5E7EB; border-radius:10px; font-size:.9rem; font-family:inherit; outline:none; background:#fff; color:#0A0A0A; transition:border-color .15s; }
        .waitlist-input::placeholder { color:#9CA3AF; }
        .waitlist-input:focus { border-color:#818CF8; box-shadow:0 0 0 3px rgba(99,102,241,0.10); }
        .waitlist-btn { padding:.75rem 1.25rem; background:linear-gradient(135deg,#6366F1,#8B5CF6); color:#fff; border:none; border-radius:10px; font-size:.875rem; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; transition:background .15s, transform .1s; }
        .waitlist-btn:hover { background:linear-gradient(135deg,#4F46E5,#7C3AED); transform:translateY(-1px); }
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
        .reveal-delay-1 { transition-delay: 0.08s; }
        .reveal-delay-2 { transition-delay: 0.16s; }
        .reveal-delay-3 { transition-delay: 0.24s; }
        .reveal-delay-4 { transition-delay: 0.32s; }
        .reveal-delay-5 { transition-delay: 0.40s; }
        .reveal-delay-6 { transition-delay: 0.48s; }
        .reveal-left {
          opacity: 0;
          transform: translateX(-24px);
          transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal-left.revealed { opacity:1; transform:translateX(0); }
        .reveal-scale {
          opacity: 0;
          transform: scale(0.96) translateY(16px);
          transition: opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal-scale.revealed { opacity:1; transform:scale(1) translateY(0); }

        /* ===== MISC ===== */
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
        .badge-dot { width:6px; height:6px; border-radius:50%; background:#6366F1; display:inline-block; animation:pulse 2s infinite; }
        .gradient-text { background:linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .integrations-strip { display:flex; align-items:center; justify-content:center; gap:1rem; flex-wrap:wrap; padding:1.5rem 2rem; border-top:1px solid #F3F4F6; margin-top:2.5rem; }
        .cta-btn { transition:background .15s, transform .1s, box-shadow .15s; }
        .cta-btn:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(79,70,229,.3); }
        .cta-btn:active { transform:translateY(0); }
        .feature-card { transition:box-shadow .22s, transform .22s; }
        .feature-card:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(99,102,241,.08) !important; }
        .pricing-card { transition:box-shadow .2s, transform .2s; }
        .pricing-card:hover { box-shadow:0 8px 32px rgba(0,0,0,.08) !important; transform:translateY(-3px); }

        /* ===== RESPONSIVE ===== */
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
          #pricing { padding-left:1.25rem !important; padding-right:1.25rem !important; }
          .section-wrap { padding-left:1.25rem !important; padding-right:1.25rem !important; }
          .canvas-nodes { flex-wrap:wrap !important; gap:.5rem !important; }
          .conn-el { display:none !important; }
          .contact-grid { grid-template-columns:1fr !important; }
        }
        @media (max-width:480px) {
          .hero-title { font-size:1.8rem !important; }
        }

        /* ===== GOOGLE TRANSLATE ===== */
        .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame { display:none !important; }
        body { top:0 !important; }
        .skiptranslate { display:none !important; }
        #google_translate_element select {
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:.78rem;
          font-weight:600;
          color:#6B7280;
          background:#F9FAFB;
          border:1px solid #E5E7EB;
          border-radius:7px;
          padding:.3rem .5rem;
          cursor:pointer;
          outline:none;
        }
        #google_translate_element .goog-te-gadget-simple {
          border:none;
          background:none;
          font-size:.78rem;
        }
      `}</style>

      {/* NAV */}
      <nav className="nav-wrap" style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"1rem 3rem", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.85)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:"1px solid #F0F0F5" }}>
        <div style={{ fontWeight:800, fontSize:"1.2rem", letterSpacing:"-0.03em", color:"#0A0A0A" }}>
          Loop<span style={{ color:"#6366F1" }}>flo</span>
        </div>
        <ul className="nav-links-desktop" style={{ display:"flex", gap:"2.5rem", listStyle:"none" }}>
          {[["Fonctionnalités","#fonctionnalites"],["Tarifs","#pricing"],["FAQ","#faq"],["Support","#contact"]].map(([label, href]) => (
            <li key={label}><a href={href} style={{ fontSize:".875rem", color:"#6B7280", transition:"color .15s", textDecoration:"none" }} onMouseEnter={e=>(e.currentTarget.style.color="#0A0A0A")} onMouseLeave={e=>(e.currentTarget.style.color="#6B7280")}>{label}</a></li>
          ))}
        </ul>
        <div className="nav-cta-desktop" style={{ display:"flex", gap:".75rem", alignItems:"center" }}>
          <div id="google_translate_element" />
          <a href="/login" style={{ fontSize:".875rem", color:"#6B7280", padding:".5rem 1rem", borderRadius:"8px" }}>Se connecter</a>
          <a href="/register" className="cta-btn" style={{ fontSize:".875rem", fontWeight:600, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", padding:".55rem 1.25rem", borderRadius:"8px", boxShadow:"0 4px 14px rgba(99,102,241,.25)" }}>Commencer gratuitement</a>
        </div>
        <button className="nav-burger" onClick={toggleMenu}>
          <span></span><span></span><span></span>
        </button>
      </nav>

      {/* MENU MOBILE */}
      <div className="nav-mobile" id="nav-mobile">
        {[["Fonctionnalités","#fonctionnalites"],["Tarifs","#pricing"],["FAQ","#faq"],["Support","#contact"]].map(([label, href]) => (
          <a key={label} href={href}>{label}</a>
        ))}
        <div className="nav-mobile-cta">
          <a href="/login" style={{ fontSize:".95rem", fontWeight:600, color:"#374151", padding:".75rem", borderRadius:"10px", border:"1px solid #E5E7EB", textAlign:"center" }}>Se connecter</a>
          <a href="/register" style={{ fontSize:".95rem", fontWeight:600, color:"#fff", background:"#4F46E5", padding:".75rem", borderRadius:"10px", textAlign:"center" }}>Commencer gratuitement</a>
        </div>
      </div>

      {/* HERO */}
      <section className="hero-section section-wrap section-white" style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"8rem 2rem 5rem", position:"relative", overflow:"hidden" }}>
        <div className="hero-glow"></div>

        <div className="tag" style={{ marginBottom:"2rem", animation:"slideUp .5s ease .1s both" }}>
          <span className="badge-dot"></span>
          Bêta ouverte — Rejoignez la waitlist
        </div>

        <h1 className="hero-title" style={{ fontSize:"clamp(3rem,6vw,5rem)", fontWeight:800, lineHeight:1.08, letterSpacing:"-0.045em", maxWidth:"780px", animation:"slideUp .6s ease .2s both", color:"#0A0A0A" }}>
          Automatisez tout,<br />sans <span className="gradient-text">une ligne de code.</span>
        </h1>

        <p className="hero-sub" style={{ marginTop:"1.35rem", fontSize:"1.05rem", color:"#6B7280", maxWidth:"460px", lineHeight:1.75, animation:"slideUp .6s ease .3s both" }}>
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
          Gratuit, sans spam · Aucune carte bancaire
        </p>

        {/* CANVAS */}
        <div className="reveal reveal-scale" style={{ marginTop:"3.5rem", width:"100%", maxWidth:"820px" }}>
          <div style={{ borderRadius:"18px", overflow:"hidden", position:"relative", background:"#fff", border:"1px solid #E5E7EB", boxShadow:"0 2px 8px rgba(0,0,0,0.06), 0 20px 60px rgba(0,0,0,0.10)" }}>
            <div style={{ padding:".75rem 1.25rem", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", gap:".5rem", background:"#FAFAFA" }}>
              {["#FCA5A5","#FCD34D","#6EE7B7"].map((c) => (<div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }} />))}
              <span style={{ marginLeft:".5rem", fontSize:".72rem", fontWeight:600, color:"#9CA3AF", letterSpacing:".04em", textTransform:"uppercase" }}>LoopFlo — Éditeur de workflow</span>
            </div>
            <div style={{ padding:"2rem", backgroundImage:"radial-gradient(#E5E7EB 1px, transparent 1px)", backgroundSize:"22px 22px", background:"#FAFAFA" }}>
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

        {/* Intégrations */}
        <div className="reveal" style={{ marginTop:"3rem", textAlign:"center" }}>
          <p style={{ fontSize:".72rem", fontWeight:600, color:"#9CA3AF", letterSpacing:".1em", textTransform:"uppercase", marginBottom:"1.25rem" }}>Connectez vos outils préférés</p>
          <div className="integrations-strip">
            {[
              { name:"Gmail", color:"#DC2626" },
              { name:"Slack", color:"#7C3AED" },
              { name:"Notion", color:"#374151" },
              { name:"Sheets", color:"#16A34A" },
              { name:"Stripe", color:"#6366F1" },
              { name:"Airtable", color:"#0EA5E9" },
              { name:"HTTP", color:"#6B7280" },
              { name:"Discord", color:"#4F46E5" },
            ].map((s) => (
              <div key={s.name} style={{ display:"flex", alignItems:"center", gap:".5rem", padding:".4rem .9rem", borderRadius:100, border:"1px solid #E5E7EB", background:"#fff", fontSize:".8rem", fontWeight:600, color:s.color }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:s.color }}></div>
                {s.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="section-indigo-light" style={{ padding:"5rem 2rem" }}>
        <div style={{ maxWidth:"1080px", margin:"0 auto" }}>
          <div className="stats-grid reveal" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", borderRadius:"20px", overflow:"hidden", border:"1px solid #C7D2FE", background:"#fff", boxShadow:"0 1px 4px rgba(99,102,241,0.06), 0 4px 24px rgba(99,102,241,0.07)" }}>
            {stats.map((s, i) => (
              <div key={i} ref={counters[i].ref} style={{ padding:"2.5rem 2rem", textAlign:"center", borderRight:i<3?"1px solid #E0E7FF":"none" }}>
                <div style={{ fontSize:"2rem", fontWeight:800, letterSpacing:"-0.04em", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  {s.prefix}{i === 0 ? (counters[i].count >= 10000 ? "10k" : counters[i].count >= 1000 ? `${(counters[i].count/1000).toFixed(1)}k` : counters[i].count) : counters[i].count}{s.suffix}
                </div>
                <div style={{ fontSize:".8rem", color:"#6B7280", marginTop:".3rem", fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-white" style={{ padding:"6rem 2rem" }}>
        <div style={{ maxWidth:"1080px", margin:"0 auto" }}>
          <p className="reveal" style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#6366F1", marginBottom:".75rem" }}>Comment ça marche</p>
          <h2 className="reveal" style={{ fontSize:"clamp(1.8rem,3.5vw,2.8rem)", fontWeight:800, letterSpacing:"-0.04em", marginBottom:"3rem", color:"#0A0A0A" }}>Automatisé en <span className="gradient-text">3 étapes.</span></h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.25rem" }}>
            {[
              { step:"01", title:"Décrivez", desc:"Expliquez ce que vous voulez automatiser en français. L'IA comprend votre intention et génère le workflow." },
              { step:"02", title:"Personnalisez", desc:"Ajustez les blocs dans l'éditeur visuel. Glissez, connectez, configurez — sans écrire une ligne de code." },
              { step:"03", title:"Activez", desc:"Cliquez sur Activer. Votre workflow tourne 24h/24, 7j/7. Suivez chaque exécution en temps réel." },
            ].map((s, i) => (
              <div key={i} className={`card reveal reveal-delay-${i+1}`} style={{ padding:"2.25rem", position:"relative" }}>
                <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:34, height:34, borderRadius:"50%", background:"#EEF2FF", border:"1px solid #C7D2FE", fontSize:".7rem", fontWeight:800, color:"#6366F1", marginBottom:"1.5rem" }}>{s.step}</div>
                <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.25rem", boxShadow:"0 6px 20px rgba(99,102,241,0.25)" }}>
                  {i===0 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M8 12h8M8 8h5M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                  {i===1 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.8"/><path d="M17 13v8M13 17h8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                  {i===2 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <h3 style={{ fontSize:"1.05rem", fontWeight:700, marginBottom:".6rem", color:"#0A0A0A" }}>{s.title}</h3>
                <p style={{ fontSize:".86rem", color:"#6B7280", lineHeight:1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="fonctionnalites" className="section-soft" style={{ padding:"6rem 2rem" }}>
        <div style={{ maxWidth:"1080px", margin:"0 auto" }}>
          <p className="reveal" style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#6366F1", marginBottom:".75rem" }}>Fonctionnalités</p>
          <h2 className="reveal" style={{ fontSize:"clamp(1.8rem,3.5vw,2.8rem)", fontWeight:800, letterSpacing:"-0.04em", marginBottom:".75rem", color:"#0A0A0A" }}>Tout ce dont vous avez besoin.</h2>
          <p className="reveal" style={{ fontSize:".95rem", color:"#6B7280", maxWidth:"440px", lineHeight:1.75, marginBottom:"2.5rem" }}>Une interface pensée pour aller vite, sans sacrifier la puissance.</p>
          <div className="features-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem" }}>
            {features.map((f, i) => (
              <div key={i} className={`card feature-card reveal reveal-delay-${i + 1}`} style={{ padding:"2rem", cursor:"default" }}>
                <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.25rem", boxShadow:"0 6px 18px rgba(99,102,241,0.25)" }}>{f.icon}</div>
                <h3 style={{ fontSize:".95rem", fontWeight:700, marginBottom:".5rem", color:"#0A0A0A" }}>{f.title}</h3>
                <p style={{ fontSize:".84rem", color:"#6B7280", lineHeight:1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section-white" style={{ padding:"6rem 2rem 8rem", position:"relative", overflow:"hidden" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"3rem" }}>
            <p className="reveal" style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#6366F1", marginBottom:".75rem" }}>Tarifs</p>
            <h2 className="reveal" style={{ fontSize:"clamp(1.8rem,3.5vw,2.8rem)", fontWeight:800, letterSpacing:"-0.04em", marginBottom:"1rem", color:"#0A0A0A" }}>
              Simple, transparent,<br /><span className="gradient-text">sans surprise.</span>
            </h2>
            <p className="reveal" style={{ fontSize:"1rem", color:"#6B7280", maxWidth:"420px", lineHeight:1.75, margin:"0 auto 2rem" }}>
              Commencez gratuitement. Évoluez quand vous êtes prêt. Annulez à tout moment.
            </p>
            {/* Toggle */}
            <div className="reveal" style={{ display:"inline-flex", alignItems:"center", gap:".75rem", background:"#F3F4F6", border:"1px solid #E5E7EB", borderRadius:"100px", padding:".4rem .8rem" }}>
              <button onClick={() => setBilling("monthly")} style={{ fontSize:".82rem", fontWeight:600, color:billing==="monthly"?"#fff":"#6B7280", background:billing==="monthly"?"#6366F1":"transparent", border:"none", borderRadius:"100px", padding:".35rem .85rem", cursor:"pointer", fontFamily:"inherit", transition:"all .2s" }}>Mensuel</button>
              <button onClick={() => setBilling("annual")} style={{ fontSize:".82rem", fontWeight:600, color:billing==="annual"?"#fff":"#6B7280", background:billing==="annual"?"#6366F1":"transparent", border:"none", borderRadius:"100px", padding:".35rem .85rem", cursor:"pointer", fontFamily:"inherit", transition:"all .2s", display:"flex", alignItems:"center", gap:".5rem" }}>
                Annuel
                <span style={{ fontSize:".68rem", fontWeight:700, color:"#059669", background:"#ECFDF5", border:"1px solid #A7F3D0", padding:".1rem .45rem", borderRadius:"100px" }}>-28%</span>
              </button>
            </div>
          </div>

          <div className="pricing-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", alignItems:"start" }}>
            {plans.map((p, i) => (
              <div key={i} className={`pricing-card reveal reveal-delay-${i + 1}`} style={{
                background: "#fff",
                border: p.featured ? "1px solid #818CF8" : "1px solid rgba(0,0,0,0.07)",
                borderRadius:"18px",
                padding: p.featured ? "2rem" : "1.75rem",
                position:"relative",
                boxShadow: p.featured ? "0 0 0 1px #818CF8, 0 8px 32px rgba(99,102,241,0.12)" : "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
                transform: p.featured ? "scale(1.03)" : "scale(1)",
                cursor:"default",
              }}>
                {p.featured && (
                  <div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)", fontSize:".68rem", fontWeight:700, color:"#fff", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", padding:".28rem .9rem", borderRadius:"100px", whiteSpace:"nowrap", boxShadow:"0 4px 12px rgba(99,102,241,0.4)" }}>
                    ✦ Le plus populaire
                  </div>
                )}
                <p style={{ fontSize:".7rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color: p.featured ? "#6366F1" : "#9CA3AF", marginBottom:".6rem" }}>{p.name}</p>
                <div style={{ fontSize: p.featured ? "2.6rem" : "2.2rem", fontWeight:800, letterSpacing:"-0.04em", marginBottom:".15rem", color:"#0A0A0A" }}>
                  {billing === "annual" ? p.annual : p.monthly}
                  {p.monthly !== "0€" && <span style={{ fontSize:".9rem", fontWeight:400, color:"#9CA3AF" }}> /mois</span>}
                </div>
                {billing === "annual" && p.monthly !== "0€" && (
                  <p style={{ fontSize:".75rem", color:"#059669", marginBottom:".3rem", fontWeight:600 }}>Facturé annuellement</p>
                )}
                <p style={{ fontSize:".82rem", color:"#6B7280", marginBottom:"1.5rem", lineHeight:1.5 }}>{p.desc}</p>
                <div style={{ height:"1px", background: p.featured ? "#C7D2FE" : "#F3F4F6", marginBottom:"1.25rem" }}></div>
                <ul style={{ listStyle:"none", marginBottom:"2rem" }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ fontSize:".84rem", color:"#374151", padding:".4rem 0", display:"flex", alignItems:"center", gap:".65rem" }}>
                      <span style={{ width:18, height:18, borderRadius:"50%", background: p.featured ? "#EEF2FF" : "#F9FAFB", border: p.featured ? "1px solid #C7D2FE" : "1px solid #E5E7EB", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2.5 2.5 4-4" stroke={p.featured?"#6366F1":"#9CA3AF"} strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                {p.name === "Free" ? (
                  <a href={p.ctaHref} className="cta-btn" style={{ width:"100%", padding:".8rem", borderRadius:"10px", fontSize:".875rem", fontWeight:600, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#374151", display:"block", textAlign:"center" }}>
                    {p.cta}
                  </a>
                ) : (
                  <button onClick={() => setBetaModal(p.name)} className="cta-btn" style={{ width:"100%", padding:".8rem", borderRadius:"10px", fontSize:".875rem", fontWeight:700, background: p.featured ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : p.name==="Business" ? "#F9FAFB" : "#F9FAFB", border: p.featured ? "none" : "1px solid #E5E7EB", color: p.featured ? "#fff" : "#374151", cursor:"pointer", fontFamily:"inherit", boxShadow: p.featured ? "0 4px 20px rgba(99,102,241,0.35)" : "none" }}>
                    {p.cta}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Garantie */}
          <div className="reveal" style={{ textAlign:"center", marginTop:"2.5rem", display:"flex", justifyContent:"center", gap:"2rem", flexWrap:"wrap" }}>
            {["Annulation à tout moment","Sans carte bancaire requise","Support réactif inclus","Données 100% sécurisées"].map((g) => (
              <div key={g} style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".8rem", color:"#6B7280", fontWeight:500 }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {g}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODAL BETA */}
      {betaModal && (
        <div onClick={() => setBetaModal(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:18, padding:"2.5rem", maxWidth:420, width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,.15)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <div style={{ width:48, height:48, borderRadius:12, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.25rem" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <h3 style={{ fontSize:"1.2rem", fontWeight:800, letterSpacing:"-0.02em", marginBottom:".5rem" }}>Disponible bientôt</h3>
            <p style={{ fontSize:".9rem", color:"#6B7280", lineHeight:1.7, marginBottom:"1.5rem" }}>
              Le système de paiement sera disponible lors du lancement officiel. En attendant, contactez-nous pour tester le plan <strong>{betaModal}</strong> gratuitement.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
              <a href={`mailto:loopflo.contact@gmail.com?subject=Accès bêta plan ${betaModal}&body=Bonjour, je souhaite tester le plan ${betaModal} en accès bêta.`} style={{ display:"block", padding:".8rem", borderRadius:10, fontSize:".9rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", textAlign:"center", textDecoration:"none" }}>
                Contacter l&apos;équipe →
              </a>
              <button onClick={() => setBetaModal(null)} style={{ padding:".8rem", borderRadius:10, fontSize:".9rem", fontWeight:600, background:"none", border:"1px solid #E5E7EB", color:"#6B7280", cursor:"pointer", fontFamily:"inherit" }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BIG CTA */}
      <section className="cta-section">
        <div style={{ position:"relative", zIndex:1, maxWidth:600, margin:"0 auto" }}>
          <p style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"rgba(165,180,252,0.8)", marginBottom:"1rem" }}>Prêt à automatiser ?</p>
          <h2 style={{ fontSize:"clamp(2rem,4vw,3rem)", fontWeight:800, color:"#fff", letterSpacing:"-0.04em", lineHeight:1.1, marginBottom:"1.25rem" }}>
            Votre premier workflow<br />en moins de 5 minutes.
          </h2>
          <p style={{ fontSize:"1rem", color:"rgba(255,255,255,0.55)", lineHeight:1.75, marginBottom:"2.5rem", maxWidth:440, margin:"0 auto 2.5rem" }}>
            Rejoignez les automatiseurs qui gagnent des heures chaque semaine. Gratuit, sans carte bancaire.
          </p>
          <div style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
            <a href="/register" style={{ fontSize:".95rem", fontWeight:700, background:"#fff", color:"#312e81", padding:".85rem 2rem", borderRadius:10, textDecoration:"none", boxShadow:"0 4px 20px rgba(0,0,0,.2)" }}>
              Commencer gratuitement →
            </a>
            <a href="#pricing" style={{ fontSize:".95rem", fontWeight:600, color:"rgba(255,255,255,0.7)", padding:".85rem 2rem", borderRadius:10, textDecoration:"none", border:"1px solid rgba(255,255,255,0.15)" }}>
              Voir les tarifs
            </a>
          </div>
          <p style={{ marginTop:"1.5rem", fontSize:".78rem", color:"rgba(255,255,255,0.3)" }}>Aucune carte bancaire requise · Annulation à tout moment</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section-soft" style={{ padding:"6rem 2rem" }}>
        <div style={{ maxWidth:"760px", margin:"0 auto" }}>
          <p className="reveal" style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#6366F1", marginBottom:".75rem" }}>FAQ</p>
          <h2 className="reveal" style={{ fontSize:"clamp(1.8rem,3.5vw,2.8rem)", fontWeight:800, letterSpacing:"-0.04em", marginBottom:"2.5rem", color:"#0A0A0A" }}>Questions fréquentes.</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:".6rem" }}>
            {faq.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} delay={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ background:"#0A0A0A", padding:"6rem 2rem 5rem", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto" }}>
          <div className="reveal" style={{ textAlign:"center", marginBottom:"3rem" }}>
            <h2 style={{ fontSize:"2rem", fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:".75rem" }}>Contactez-nous</h2>
            <p style={{ fontSize:"1rem", color:"rgba(255,255,255,0.5)", maxWidth:480, margin:"0 auto" }}>Une question, un bug, une suggestion ? On vous répond rapidement.</p>
          </div>
          <div className="contact-grid reveal" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
            <div style={{ borderRadius:18, padding:"2rem", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"rgba(79,70,229,0.15)", border:"1px solid rgba(79,70,229,0.3)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <h3 style={{ fontSize:"1rem", fontWeight:700, color:"#fff", marginBottom:".5rem" }}>Email</h3>
              <p style={{ fontSize:".875rem", color:"rgba(255,255,255,0.5)", marginBottom:"1rem", lineHeight:1.6 }}>Pour toute question générale ou commerciale.</p>
              <a href="mailto:loopflo.contact@gmail.com" style={{ fontSize:".875rem", fontWeight:600, color:"#818CF8" }}>loopflo.contact@gmail.com</a>
            </div>
            <div style={{ borderRadius:18, padding:"2rem", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 style={{ fontSize:"1rem", fontWeight:700, color:"#fff", marginBottom:".5rem" }}>Signaler un bug</h3>
              <p style={{ fontSize:".875rem", color:"rgba(255,255,255,0.5)", marginBottom:"1rem", lineHeight:1.6 }}>Vous avez trouvé un problème ? Aidez-nous à l&apos;améliorer.</p>
              <a href="mailto:loopflo.contact@gmail.com?subject=Bug Loopflo&body=Décrivez le bug ici..." style={{ fontSize:".875rem", fontWeight:600, color:"#F87171" }}>Signaler un bug</a>
            </div>
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", marginTop:"3rem", paddingTop:"2rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
            <span style={{ fontSize:"1.1rem", fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>Loop<span style={{ color:"#6366F1" }}>flo</span></span>
            <p style={{ fontSize:".8rem", color:"rgba(255,255,255,0.3)" }}>© 2026 Loopflo. Tous droits réservés.</p>
            <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap" }}>
              <a href="/login" style={{ fontSize:".82rem", color:"rgba(255,255,255,0.4)" }}>Connexion</a>
              <a href="/register" style={{ fontSize:".82rem", color:"rgba(255,255,255,0.4)" }}>S&apos;inscrire</a>
              <a href="/pricing" style={{ fontSize:".82rem", color:"rgba(255,255,255,0.4)" }}>Tarifs</a>
              <a href="mailto:loopflo.contact@gmail.com" style={{ fontSize:".82rem", color:"rgba(255,255,255,0.4)" }}>Contact</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
