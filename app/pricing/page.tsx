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
    notIncluded: ["Kixi IA", "Slack, Notion, HTTP", "Support prioritaire"],
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
    features: ["2 000 tâches / mois", "Workflows illimités", "Toutes les intégrations", "Kixi IA incluse", "Support email prioritaire"],
    notIncluded: ["Kixi IA illimitée", "Blocs IA avancés", "Support chat en direct"],
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
    features: ["10 000 tâches / mois", "Workflows illimités", "Toutes les intégrations", "Kixi IA illimitée", "Blocs IA avancés inclus", "Historique 30 jours", "Support chat en direct"],
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
    features: ["50 000 tâches / mois", "Workflows illimités", "Toutes les intégrations", "Kixi IA illimitée + priorité", "Blocs IA avancés illimités", "Historique 90 jours", "Support dédié < 4h", "Onboarding personnalisé"],
    notIncluded: [],
    cta: "Contacter l'équipe",
    href: "mailto:loopflo.contact@gmail.com?subject=Plan Business Loopflo",
    featured: false,
  },
];

const faqs = [
  { q: "Puis-je changer de plan à tout moment ?", a: "Oui, upgrader ou downgrader prend effet immédiatement. Aucun frais caché." },
  { q: "Qu'est-ce que Kixi IA ?", a: "Kixi est notre assistant IA en français qui génère et améliore vos workflows automatiquement. Sur les plans Starter et supérieurs, il crée vos automatisations en quelques secondes." },
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
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; color:#0A0A0A; }
        .plan-card { transition: transform .2s, box-shadow .2s; }
        .plan-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,.1) !important; }
        .faq-item { border-bottom: 1px solid #F3F4F6; }
        .toggle-bg { transition: background .2s; }
        @media (max-width: 768px) {
          .plans-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 1.8rem !important; }
          .section-wrap { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
          .pricing-nav { padding: 1rem 1rem !important; }
          .pricing-nav-links { display: none !important; }
          .compare-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .compare-grid { min-width: 480px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="pricing-nav" style={{ position:"sticky", top:0, zIndex:100, background:"rgba(250,250,250,0.9)", backdropFilter:"blur(20px)", borderBottom:"1px solid #EBEBEB", padding:"1rem 3rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <a href="/" style={{ fontWeight:800, fontSize:"1.1rem", letterSpacing:"-0.03em", textDecoration:"none", color:"#0A0A0A" }}>
          Loop<span style={{ color:"#4F46E5" }}>flo</span>
        </a>
        <div className="pricing-nav-links" style={{ display:"flex", gap:".75rem" }}>
          <a href="/login" style={{ fontSize:".875rem", color:"#6B7280", padding:".5rem 1rem", borderRadius:8, textDecoration:"none" }}>Se connecter</a>
          <a href="/register" style={{ fontSize:".875rem", fontWeight:600, background:"#0A0A0A", color:"#fff", padding:".55rem 1.25rem", borderRadius:8, textDecoration:"none" }}>Commencer</a>
        </div>
      </nav>

      <div style={{ position:"relative", overflow:"hidden" }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />

      {/* PLANS */}
      <section className="section-wrap" style={{ padding:"0 2rem 5rem", maxWidth:1080, margin:"0 auto" }}>
        <div className="plans-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem" }}>
          {plans.map((plan, i) => (
            <div key={i} className="plan-card" style={{ background:"#fff", border:`1.5px solid ${plan.featured ? plan.border : "#E5E7EB"}`, borderRadius:16, padding:"1.75rem", position:"relative", boxShadow: plan.featured ? `0 0 0 1px ${plan.border}, 0 8px 32px rgba(79,70,229,.1)` : "0 1px 4px rgba(0,0,0,.04)" }}>
              {plan.featured && (
                <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", fontSize:".68rem", fontWeight:700, color:"#fff", background:"#4F46E5", padding:".25rem .85rem", borderRadius:"100px", whiteSpace:"nowrap" }}>Le plus populaire</div>
              )}
              <p style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:plan.color, marginBottom:".75rem" }}>{plan.name}</p>
              <div style={{ marginBottom:".25rem" }}>
                <span style={{ fontSize:"2.4rem", fontWeight:800, letterSpacing:"-0.04em" }}>{yearly ? plan.yearly : plan.monthly}€</span>
                <span style={{ fontSize:".9rem", color:"#9CA3AF", fontWeight:400 }}> / mois</span>
              </div>
              {yearly && plan.monthly > 0 && (
                <p style={{ fontSize:".75rem", color:"#059669", fontWeight:600, marginBottom:".5rem" }}>
                  Soit {(plan.yearly * 12).toFixed(0)}€/an — économisez {((plan.monthly - plan.yearly) * 12).toFixed(0)}€
                </p>
              )}
              <p style={{ fontSize:".82rem", color:"#9CA3AF", marginBottom:"1.25rem", lineHeight:1.5 }}>{plan.desc}</p>
              <div style={{ height:1, background:"#F3F4F6", marginBottom:"1.25rem" }} />
              <ul style={{ listStyle:"none", marginBottom:"1.5rem", display:"flex", flexDirection:"column", gap:".4rem" }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ fontSize:".82rem", color:"#374151", display:"flex", alignItems:"flex-start", gap:".5rem" }}>
                    <span style={{ width:16, height:16, borderRadius:"50%", background:"#ECFDF5", border:"1px solid #A7F3D0", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:1 }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </span>
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map((f, j) => (
                  <li key={j} style={{ fontSize:".82rem", color:"#D1D5DB", display:"flex", alignItems:"flex-start", gap:".5rem" }}>
                    <span style={{ width:16, height:16, borderRadius:"50%", background:"#F9FAFB", border:"1px solid #E5E7EB", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:1 }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2 2l4 4M6 2l-4 4" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              {plan.monthly === 0 ? (
                <a href={plan.href} style={{ display:"block", width:"100%", padding:".75rem", borderRadius:9, fontSize:".875rem", fontWeight:700, background:"#F9FAFB", border:`1px solid ${plan.border}`, color:plan.color, textAlign:"center", textDecoration:"none" }}>
                  {plan.cta}
                </a>
              ) : (
                <button onClick={() => setBetaModal(plan.name)} style={{ display:"block", width:"100%", padding:".75rem", borderRadius:9, fontSize:".875rem", fontWeight:700, background: plan.featured ? "#4F46E5" : plan.bg, border: plan.featured ? "none" : `1px solid ${plan.border}`, color: plan.featured ? "#fff" : plan.color, textAlign:"center", cursor:"pointer", fontFamily:"inherit" }}>
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* COMPARATIF */}
      <section className="section-wrap" style={{ padding:"0 2rem 5rem", maxWidth:860, margin:"0 auto" }}>
        <h2 style={{ fontSize:"1.5rem", fontWeight:800, letterSpacing:"-0.03em", marginBottom:".5rem", textAlign:"center" }}>Loopflo vs Make.com</h2>
        <p style={{ fontSize:".9rem", color:"#6B7280", textAlign:"center", marginBottom:"2rem" }}>Pourquoi Loopflo est le meilleur choix pour les équipes françaises.</p>
        <div className="compare-wrap" style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, overflow:"hidden" }}>
          <div className="compare-grid">
          {[
            { feature:"IA intégrée en français", loopflo:"10/10", make:"2/10", win:true },
            { feature:"Facilité d'utilisation", loopflo:"9/10", make:"6/10", win:true },
            { feature:"Prix de départ", loopflo:"0€", make:"9€", win:true },
            { feature:"Interface en français", loopflo:"Oui", make:"Non", win:true },
            { feature:"Nombre d'intégrations", loopflo:"9+", make:"1000+", win:false },
            { feature:"Support en français", loopflo:"Oui", make:"Non", win:true },
            { feature:"Configuration en langage naturel", loopflo:"Oui", make:"Non", win:true },
          ].map((row, i) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", padding:".85rem 1.25rem", borderBottom:"1px solid #F9FAFB", background: i % 2 === 0 ? "#fff" : "#FAFAFA", alignItems:"center" }}>
              <span style={{ fontSize:".85rem", color:"#374151", fontWeight:500 }}>{row.feature}</span>
              <span style={{ fontSize:".85rem", fontWeight:700, color: row.win ? "#059669" : "#374151", textAlign:"center" }}>{row.win && "✓ "}{row.loopflo}</span>
              <span style={{ fontSize:".85rem", color:"#9CA3AF", textAlign:"center" }}>{row.make}</span>
            </div>
          ))}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", padding:".6rem 1.25rem", background:"#F9FAFB", borderTop:"1px solid #E5E7EB" }}>
            <span style={{ fontSize:".75rem", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase" }}>Score global</span>
            <span style={{ fontSize:"1rem", fontWeight:800, color:"#4F46E5", textAlign:"center" }}>9.1/10</span>
            <span style={{ fontSize:"1rem", fontWeight:800, color:"#9CA3AF", textAlign:"center" }}>7.7/10</span>
          </div>
          </div>
        </div>
      </section>

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
              { feature:"IA (Kixi) intégrée en français", loopflo:"Oui — dès Starter", make:"Non", win:true },
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
