"use client";
import { useState, useEffect } from "react";

const STEPS = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="#EEF2FF" stroke="#818CF8" strokeWidth="1.5"/>
        <path d="M12 8v8M8 12h8" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Créez votre workflow",
    desc: "Cliquez sur \"Nouveau workflow\" et glissez-déposez des blocs sur le canvas pour construire votre automatisation.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="1.5"/>
        <path d="M9 12l2 2 4-4" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Configurez chaque bloc",
    desc: "Double-cliquez sur un bloc pour le configurer — remplissez les champs et utilisez {{variables}} pour des données dynamiques.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" fill="#ECFDF5" stroke="#34D399" strokeWidth="1.5"/>
        <path d="M10 8l6 4-6 4V8z" fill="#059669"/>
      </svg>
    ),
    title: "Activez et c'est parti",
    desc: "Cliquez sur \"Activer\" — votre workflow tourne en automatique. Suivez les exécutions dans l'Historique.",
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("loopflo-onboarded")) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem("loopflo-onboarded", "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={dismiss}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:20, padding:"2rem", maxWidth:440, width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,0.15)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem" }}>
          <div>
            <p style={{ fontSize:".72rem", fontWeight:700, color:"#4F46E5", textTransform:"uppercase", letterSpacing:".08em", marginBottom:".25rem" }}>
              Bienvenue sur Loopflo
            </p>
            <h2 style={{ fontSize:"1.25rem", fontWeight:800, letterSpacing:"-0.02em", color:"#0A0A0A" }}>
              Créez votre première automatisation
            </h2>
          </div>
          <button onClick={dismiss} style={{ background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:8, cursor:"pointer", padding:".35rem .5rem", color:"#9CA3AF", fontSize:".8rem", fontFamily:"inherit" }}>
            Passer
          </button>
        </div>

        {/* Steps */}
        <div style={{ display:"flex", flexDirection:"column", gap:".75rem", marginBottom:"1.5rem" }}>
          {STEPS.map((s, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              style={{ display:"flex", alignItems:"flex-start", gap:".85rem", padding:".85rem 1rem", borderRadius:12, border:`1.5px solid ${step === i ? "#C7D2FE" : "#F3F4F6"}`, background: step === i ? "#F5F3FF" : "#FAFAFA", cursor:"pointer", transition:"all .15s" }}
            >
              <div style={{ flexShrink:0, marginTop:1 }}>{s.icon}</div>
              <div>
                <p style={{ fontSize:".875rem", fontWeight:700, color: step === i ? "#4F46E5" : "#0A0A0A", marginBottom:".2rem" }}>
                  {i + 1}. {s.title}
                </p>
                <p style={{ fontSize:".78rem", color:"#6B7280", lineHeight:1.6 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Kixi tip */}
        <div style={{ background:"linear-gradient(135deg,#EEF2FF,#F5F3FF)", border:"1px solid #C7D2FE", borderRadius:10, padding:".75rem 1rem", marginBottom:"1.25rem", display:"flex", alignItems:"flex-start", gap:".6rem" }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"#4F46E5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M15 3H9a2 2 0 00-2 2v14l5-3 5 3V5a2 2 0 00-2-2z" fill="white"/></svg>
          </div>
          <p style={{ fontSize:".78rem", color:"#4338CA", lineHeight:1.6 }}>
            <strong>Astuce :</strong> utilisez le bouton <strong>"Générer avec l&apos;IA"</strong> pour décrire votre workflow en français — Kixi le crée pour vous en quelques secondes.
          </p>
        </div>

        {/* CTA */}
        <a
          href="/dashboard/workflows/new"
          onClick={dismiss}
          style={{ display:"block", width:"100%", padding:".85rem", borderRadius:10, fontSize:".9rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", textAlign:"center", textDecoration:"none", boxShadow:"0 4px 16px rgba(99,102,241,0.35)" }}
        >
          Créer mon premier workflow →
        </a>
      </div>
    </div>
  );
}
