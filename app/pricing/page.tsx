"use client";
import { useState } from "react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    desc: "Pour découvrir l'automatisation.",
    color: "#6B7280",
    bg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.1)",
    accent: "#9CA3AF",
    features: ["100 tâches / mois", "5 workflows actifs", "Webhook, Gmail, Sheets", "Support communauté"],
    notIncluded: ["IA générative", "Slack, Notion, HTTP", "Support prioritaire"],
    cta: "Commencer gratuitement",
    href: "/register",
    featured: false,
  },
  {
    name: "Starter",
    monthly: 7,
    yearly: 5,
    desc: "Pour les freelances et solopreneurs.",
    color: "#818CF8",
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(129,140,248,0.5)",
    accent: "#6366F1",
    features: ["2 000 tâches / mois", "Workflows illimités", "Toutes les intégrations", "Support email prioritaire"],
    notIncluded: ["IA générative", "Support chat en direct"],
    cta: "Commencer en Starter",
    href: "/register",
    featured: true,
  },
  {
    name: "Pro",
    monthly: 19,
    yearly: 15,
    desc: "Pour les PME et équipes en croissance.",
    color: "#38BDF8",
    bg: "rgba(14,165,233,0.08)",
    border: "rgba(56,189,248,0.35)",
    accent: "#0284C7",
    features: ["10 000 tâches / mois", "Workflows illimités", "Toutes les intégrations", "IA générative incluse", "Historique 30 jours", "Support chat en direct"],
    notIncluded: [],
    cta: "Commencer en Pro",
    href: "/register",
    featured: false,
  },
  {
    name: "Business",
    monthly: 49,
    yearly: 39,
    desc: "Pour les équipes et agences.",
    color: "#34D399",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(52,211,153,0.35)",
    accent: "#059669",
    features: ["50 000 tâches / mois", "Workflows illimités", "Toutes les intégrations", "IA générative avancée", "Historique 90 jours", "Support dédié < 4h", "Onboarding personnalisé"],
    notIncluded: [],
    cta: "Contacter l'équipe",
    href: "mailto:loopflo.contact@gmail.com?subject=Plan Business Loopflo",
    featured: false,
  },
];

const faqs = [
  { q: "Puis-je changer de plan à tout moment ?", a: "Oui, upgrader ou downgrader prend effet immédiatement. Aucun frais caché." },
  { q: "Qu'est-ce qu'une tâche ?", a: "Une tâche = une exécution complète d'un workflow. Chaque déclenchement (webhook, planifié, test) compte comme une tâche." },
  { q: "Que se passe-t-il si je dépasse ma limite ?", a: "Vos workflows s'arrêtent jusqu'au prochain mois. Mettez à niveau pour continuer à automatiser." },
  { q: "Y a-t-il un engagement ?", a: "Aucun engagement. Annulez à tout moment sans frais, depuis votre tableau de bord." },
  { q: "Comment fonctionne la facturation annuelle ?", a: "En choisissant l'annuel, vous économisez l'équivalent de 2 mois, facturé en une fois pour 12 mois d'accès." },
  { q: "Proposez-vous des réductions pour les associations ?", a: "Oui ! Contactez-nous à loopflo.contact@gmail.com pour un tarif associatif ou étudiant." },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [betaModal, setBetaModal] = useState<string | null>(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html { scroll-behavior:smooth; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#07001A; color:#fff; min-height:100vh; }

        /* Glassmorphism */
        .glass { background:rgba(255,255,255,0.04); backdrop-filter:blur(24px) saturate(180%); -webkit-backdrop-filter:blur(24px) saturate(180%); border:1px solid rgba(255,255,255,0.08); }
        .glass-card { background:rgba(255,255,255,0.035); backdrop-filter:blur(32px) saturate(180%); -webkit-backdrop-filter:blur(32px) saturate(180%); border:1px solid rgba(255,255,255,0.09); }

        /* Orbes déco */
        .orb { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; }
        .orb-1 { width:500px; height:500px; background:radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%); top:-100px; right:10%; }
        .orb-2 { width:400px; height:400px; background:radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%); bottom:0; left:5%; }

        .plan-card { transition:transform .2s, box-shadow .2s; }
        .plan-card:hover { transform:translateY(-5px); }
        .plan-featured { box-shadow:0 0 0 1.5px rgba(129,140,248,0.6), 0 20px 60px rgba(99,102,241,0.2) !important; }

        .toggle-btn { transition:background .2s; }
        .faq-btn { width:100%; display:flex; align-items:center; justify-content:space-between; padding:1.1rem 1.4rem; background:none; border:none; cursor:pointer; font-family:inherit; text-align:left; }
        .faq-item { border-bottom:1px solid rgba(255,255,255,0.06); }
        .faq-item:last-child { border-bottom:none; }

        .nav-link { font-size:.875rem; color:rgba(255,255,255,0.6); text-decoration:none; padding:.45rem .85rem; border-radius:8px; transition:color .15s,background .15s; }
        .nav-link:hover { color:#fff; background:rgba(255,255,255,0.07); }

        .cta-primary { display:inline-block; padding:.75rem; border-radius:10px; font-size:.875rem; font-weight:700; text-align:center; text-decoration:none; font-family:'Plus Jakarta Sans',sans-serif; cursor:pointer; transition:opacity .15s, transform .1s; }
        .cta-primary:hover { opacity:.85; transform:translateY(-1px); }

        @media (max-width:900px) { .plans-grid { grid-template-columns:repeat(2,1fr) !important; } }
        @media (max-width:600px) { .plans-grid { grid-template-columns:1fr !important; } .hero-title { font-size:2rem !important; } .section-px { padding-left:1.25rem !important; padding-right:1.25rem !important; } }
      `}</style>

      {/* NAV */}
      <nav className="glass" style={{ position:"sticky", top:0, zIndex:100, padding:".9rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <Link href="/" style={{ fontWeight:800, fontSize:"1.05rem", letterSpacing:"-0.03em", textDecoration:"none", color:"#fff" }}>
          Loop<span style={{ color:"#818CF8" }}>flo</span>
        </Link>
        <div style={{ display:"flex", gap:".5rem", alignItems:"center" }}>
          <Link href="/login" className="nav-link">Se connecter</Link>
          <Link href="/register" style={{ fontSize:".875rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", padding:".5rem 1.2rem", borderRadius:9, textDecoration:"none" }}>
            Commencer
          </Link>
        </div>
      </nav>

      <div style={{ position:"relative", overflow:"hidden" }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />

        {/* HERO */}
        <section className="section-px" style={{ textAlign:"center", padding:"5rem 2rem 3.5rem", position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:".5rem", fontSize:".75rem", fontWeight:600, color:"#A5B4FC", background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.35)", padding:".35rem 1rem", borderRadius:"100px", marginBottom:"1.75rem" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#818CF8", display:"inline-block" }} />
            Simple et transparent
          </div>
          <h1 className="hero-title" style={{ fontSize:"clamp(2rem,4.5vw,3.4rem)", fontWeight:800, letterSpacing:"-0.04em", marginBottom:"1rem", lineHeight:1.1 }}>
            Le bon plan pour<br /><span style={{ background:"linear-gradient(135deg,#818CF8,#C084FC)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>chaque besoin.</span>
          </h1>
          <p style={{ fontSize:"1rem", color:"rgba(255,255,255,0.5)", maxWidth:440, margin:"0 auto 2.5rem", lineHeight:1.75 }}>
            Commencez gratuitement. Évoluez selon vos besoins. Annulez à tout moment.
          </p>

          {/* Toggle mensuel / annuel */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:".75rem", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"100px", padding:".4rem .85rem" }}>
            <span style={{ fontSize:".85rem", fontWeight: yearly ? 400 : 700, color: yearly ? "rgba(255,255,255,0.4)" : "#fff" }}>Mensuel</span>
            <button onClick={() => setYearly(!yearly)} className="toggle-btn" style={{ width:44, height:24, borderRadius:"100px", background: yearly ? "#6366F1" : "rgba(255,255,255,0.15)", border:"none", cursor:"pointer", position:"relative", flexShrink:0 }}>
              <div style={{ position:"absolute", top:2, left: yearly ? 22 : 2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,.3)" }} />
            </button>
            <span style={{ fontSize:".85rem", fontWeight: yearly ? 700 : 400, color: yearly ? "#fff" : "rgba(255,255,255,0.4)" }}>
              Annuel
              <span style={{ marginLeft:".4rem", fontSize:".7rem", fontWeight:700, background:"rgba(16,185,129,0.2)", color:"#34D399", padding:".15rem .5rem", borderRadius:"100px", border:"1px solid rgba(52,211,153,0.3)" }}>-20%</span>
            </span>
          </div>
        </section>

        {/* PLANS */}
        <section className="section-px" style={{ padding:"0 2rem 5rem", maxWidth:1100, margin:"0 auto", position:"relative", zIndex:1 }}>
          <div className="plans-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem" }}>
            {plans.map((plan, i) => (
              <div key={i} className={`plan-card glass-card${plan.featured ? " plan-featured" : ""}`} style={{ background:plan.bg, border:`1.5px solid ${plan.border}`, borderRadius:18, padding:"1.75rem", position:"relative" }}>
                {plan.featured && (
                  <div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)", fontSize:".68rem", fontWeight:700, color:"#fff", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", padding:".25rem .9rem", borderRadius:"100px", whiteSpace:"nowrap" }}>
                    Le plus populaire
                  </div>
                )}
                <p style={{ fontSize:".7rem", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:plan.color, marginBottom:".75rem" }}>{plan.name}</p>
                <div style={{ marginBottom:".25rem" }}>
                  <span style={{ fontSize:"2.4rem", fontWeight:800, letterSpacing:"-0.04em", color:"#fff" }}>{yearly ? plan.yearly : plan.monthly}€</span>
                  <span style={{ fontSize:".875rem", color:"rgba(255,255,255,0.4)", fontWeight:400 }}> / mois</span>
                </div>
                {yearly && plan.monthly > 0 && (
                  <p style={{ fontSize:".75rem", color:"#34D399", fontWeight:600, marginBottom:".5rem" }}>
                    Soit {(plan.yearly * 12)}€/an — économisez {((plan.monthly - plan.yearly) * 12)}€
                  </p>
                )}
                <p style={{ fontSize:".82rem", color:"rgba(255,255,255,0.45)", marginBottom:"1.25rem", lineHeight:1.5 }}>{plan.desc}</p>
                <div style={{ height:1, background:"rgba(255,255,255,0.07)", marginBottom:"1.25rem" }} />
                <ul style={{ listStyle:"none", marginBottom:"1.5rem", display:"flex", flexDirection:"column", gap:".45rem" }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ fontSize:".82rem", color:"rgba(255,255,255,0.8)", display:"flex", alignItems:"flex-start", gap:".5rem" }}>
                      <span style={{ width:16, height:16, borderRadius:"50%", background:"rgba(52,211,153,0.15)", border:"1px solid rgba(52,211,153,0.4)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:1 }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </span>
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f, j) => (
                    <li key={j} style={{ fontSize:".82rem", color:"rgba(255,255,255,0.2)", display:"flex", alignItems:"flex-start", gap:".5rem" }}>
                      <span style={{ width:16, height:16, borderRadius:"50%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:1 }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2 2l4 4M6 2l-4 4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.monthly === 0 ? (
                  <Link href={plan.href} className="cta-primary" style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.9)" }}>
                    {plan.cta}
                  </Link>
                ) : plan.name === "Business" ? (
                  <a href={plan.href} className="cta-primary" style={{ background:`rgba(16,185,129,0.15)`, border:`1px solid rgba(52,211,153,0.3)`, color:"#34D399" }}>
                    {plan.cta}
                  </a>
                ) : (
                  <button onClick={() => setBetaModal(plan.name)} className="cta-primary" style={{ width:"100%", background: plan.featured ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : `rgba(255,255,255,0.08)`, border: plan.featured ? "none" : `1px solid ${plan.border}`, color:"#fff" }}>
                    {plan.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* COMPARATIF */}
        <section className="section-px" style={{ padding:"0 2rem 5rem", maxWidth:860, margin:"0 auto", position:"relative", zIndex:1 }}>
          <h2 style={{ fontSize:"1.6rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".5rem", textAlign:"center" }}>Loopflo vs Make.com</h2>
          <p style={{ fontSize:".9rem", color:"rgba(255,255,255,0.45)", textAlign:"center", marginBottom:"2rem" }}>Pourquoi Loopflo est le meilleur choix pour les créateurs et équipes françaises.</p>
          <div className="glass-card" style={{ borderRadius:16, overflow:"hidden" }}>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", padding:".65rem 1.25rem", background:"rgba(255,255,255,0.04)", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              {["Fonctionnalité", "Loopflo", "Make.com"].map((h, i) => (
                <p key={i} style={{ fontSize:".72rem", fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:".06em", textAlign: i > 0 ? "center" : "left" }}>{h}</p>
              ))}
            </div>
            {[
              { feature:"IA intégrée en français", loopflo:"Oui", make:"Non", win:true },
              { feature:"Interface en français", loopflo:"Oui", make:"Non", win:true },
              { feature:"Prix de départ", loopflo:"0€", make:"9€", win:true },
              { feature:"Blocs créateurs de contenu", loopflo:"Oui (TikTok, YT, IG...)", make:"Partiel", win:true },
              { feature:"Facilité d'utilisation", loopflo:"9/10", make:"6/10", win:true },
              { feature:"Nombre d'intégrations", loopflo:"30+", make:"1 000+", win:false },
              { feature:"Support en français", loopflo:"Oui", make:"Non", win:true },
            ].map((row, i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", padding:".85rem 1.25rem", borderBottom:"1px solid rgba(255,255,255,0.04)", alignItems:"center" }}>
                <span style={{ fontSize:".85rem", color:"rgba(255,255,255,0.7)", fontWeight:500 }}>{row.feature}</span>
                <span style={{ fontSize:".85rem", fontWeight:700, color: row.win ? "#34D399" : "rgba(255,255,255,0.8)", textAlign:"center" }}>{row.win && "✓ "}{row.loopflo}</span>
                <span style={{ fontSize:".85rem", color:"rgba(255,255,255,0.35)", textAlign:"center" }}>{row.make}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="section-px" style={{ padding:"0 2rem 6rem", maxWidth:680, margin:"0 auto", position:"relative", zIndex:1 }}>
          <h2 style={{ fontSize:"1.6rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:"2rem", textAlign:"center" }}>Questions fréquentes</h2>
          <div className="glass-card" style={{ borderRadius:16, overflow:"hidden" }}>
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span style={{ fontSize:".9rem", fontWeight:600, color:"rgba(255,255,255,0.9)" }}>{faq.q}</span>
                  <span style={{ fontSize:18, color:"rgba(255,255,255,0.4)", transition:"transform .2s", transform: openFaq === i ? "rotate(45deg)" : "none", flexShrink:0, marginLeft:".5rem" }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding:"0 1.4rem 1.1rem" }}>
                    <p style={{ fontSize:".875rem", color:"rgba(255,255,255,0.5)", lineHeight:1.75 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={{ padding:"5rem 2rem", textAlign:"center", position:"relative", zIndex:1 }}>
          <div style={{ maxWidth:520, margin:"0 auto" }}>
            <h2 style={{ fontSize:"2rem", fontWeight:800, letterSpacing:"-0.035em", marginBottom:".75rem", lineHeight:1.15 }}>
              Prêt à automatiser<br />sans coder ?
            </h2>
            <p style={{ fontSize:"1rem", color:"rgba(255,255,255,0.45)", marginBottom:"2rem" }}>Commencez gratuitement — sans carte bancaire.</p>
            <Link href="/register" style={{ display:"inline-block", padding:".95rem 2.25rem", borderRadius:12, fontSize:"1rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", textDecoration:"none", boxShadow:"0 8px 32px rgba(99,102,241,0.35)" }}>
              Commencer gratuitement →
            </Link>
          </div>
        </section>
      </div>

      {/* MODAL BETA */}
      {betaModal && (
        <div onClick={() => setBetaModal(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", backdropFilter:"blur(6px)" }}>
          <div onClick={e => e.stopPropagation()} className="glass-card" style={{ borderRadius:20, padding:"2.5rem", maxWidth:420, width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,.4)" }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"rgba(99,102,241,0.2)", border:"1px solid rgba(129,140,248,0.4)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.25rem" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <h3 style={{ fontSize:"1.2rem", fontWeight:800, letterSpacing:"-0.02em", marginBottom:".5rem", color:"#fff" }}>
              Disponible bientôt
            </h3>
            <p style={{ fontSize:".9rem", color:"rgba(255,255,255,0.5)", lineHeight:1.7, marginBottom:"1.5rem" }}>
              Le système de paiement arrive lors du lancement officiel. En attendant, testez le plan <strong style={{ color:"#fff" }}>{betaModal}</strong> gratuitement en contactant l&apos;équipe.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
              <a href={`mailto:loopflo.contact@gmail.com?subject=Accès bêta plan ${betaModal}&body=Bonjour, je souhaite tester le plan ${betaModal} en accès bêta.`} style={{ display:"block", padding:".85rem", borderRadius:11, fontSize:".9rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", textAlign:"center", textDecoration:"none" }}>
                Contacter l&apos;équipe →
              </a>
              <button onClick={() => setBetaModal(null)} style={{ padding:".85rem", borderRadius:11, fontSize:".9rem", fontWeight:600, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontFamily:"inherit" }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
