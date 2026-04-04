"use client";
import { useState, useEffect } from "react";

type SpotlightDef = {
  top: number;
  left?: number | string;
  right?: number | string;
  width?: number | string;
  bottom?: number | string;
  height?: number;
};

type StepDef = {
  title: string;
  text: string;
  spotlight: SpotlightDef | null;
  bubble: { top?: number | string; left?: number | string; right?: number | string; bottom?: number | string; transform?: string };
  arrow?: "left" | "right" | "top" | "bottom";
  autoComplete?: (p: AutoProps) => boolean;
  bravoText?: string;
};

type AutoProps = {
  hasTrigger: boolean;
  hasAction: boolean;
  edgesCount: number;
  configOpenedCount: number;
};

const STEPS: StepDef[] = [
  {
    title: "Salut, je suis Kixi !",
    text: "Je vais te guider pour créer ton premier workflow en quelques étapes. Clique sur Suivant pour commencer !",
    spotlight: null,
    bubble: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  },
  {
    title: "Ajoute un déclencheur",
    text: "Clique sur un bloc déclencheur dans le panneau de gauche pour l'ajouter au canvas. Essaie avec Webhook ou Planifié !",
    spotlight: { top: 52, left: 0, width: 220, bottom: 0 },
    bubble: { top: 80, left: 240 },
    arrow: "left",
    autoComplete: (p) => p.hasTrigger,
    bravoText: "Super ! Déclencheur ajouté !",
  },
  {
    title: "Ajoute une action",
    text: "Maintenant clique sur une action dans le panneau (Gmail, Slack, Sheets...) pour l'ajouter au canvas.",
    spotlight: { top: 52, left: 0, width: 220, bottom: 0 },
    bubble: { top: 240, left: 240 },
    arrow: "left",
    autoComplete: (p) => p.hasAction,
    bravoText: "Parfait ! Action ajoutée !",
  },
  {
    title: "Connecte les blocs",
    text: "Tire un fil depuis le point bleu à droite du premier bloc vers le point bleu à gauche du deuxième.",
    spotlight: { top: 52, left: 220, right: 0, bottom: 0 },
    bubble: { top: 90, left: "50%", transform: "translateX(-30%)" },
    arrow: "bottom",
    autoComplete: (p) => p.edgesCount > 0,
    bravoText: "Excellent ! Blocs connectés !",
  },
  {
    title: "Configure un bloc",
    text: "Clique sur l'engrenage ⚙️ en haut à gauche d'un bloc pour ouvrir son panneau de configuration et remplir les paramètres.",
    spotlight: { top: 52, left: 220, right: 0, bottom: 0 },
    bubble: { top: 230, left: "50%", transform: "translateX(-30%)" },
    arrow: "bottom",
    autoComplete: (p) => p.configOpenedCount > 0,
    bravoText: "Bien joué ! Tu peux remplir les paramètres dans le panneau.",
  },
  {
    title: "Sauvegarde et active !",
    text: "Clique sur \"Sauvegarder\" puis sur \"Activer\" en haut à droite. Ton workflow tournera automatiquement !",
    spotlight: { top: 0, right: 0, width: 440, height: 52 },
    bubble: { top: 65, right: 20 },
    arrow: "top",
  },
];

const ARROW_STYLES: Record<string, React.CSSProperties> = {
  left:   { position:"absolute", left:-10,  top:22, width:0, height:0, borderTop:"10px solid transparent", borderBottom:"10px solid transparent", borderRight:"10px solid rgba(255,255,255,0.98)" },
  right:  { position:"absolute", right:-10, top:22, width:0, height:0, borderTop:"10px solid transparent", borderBottom:"10px solid transparent", borderLeft:"10px solid rgba(255,255,255,0.98)" },
  top:    { position:"absolute", top:-10,   right:40, width:0, height:0, borderLeft:"10px solid transparent", borderRight:"10px solid transparent", borderBottom:"10px solid rgba(255,255,255,0.98)" },
  bottom: { position:"absolute", bottom:-10, left:40, width:0, height:0, borderLeft:"10px solid transparent", borderRight:"10px solid transparent", borderTop:"10px solid rgba(255,255,255,0.98)" },
};

export default function TutorialOverlay({
  onClose,
  hasTrigger,
  hasAction,
  edgesCount,
  configOpenedCount,
}: {
  onClose: () => void;
  hasTrigger: boolean;
  hasAction: boolean;
  edgesCount: number;
  configOpenedCount: number;
}) {
  const [step, setStep] = useState(0);
  const [bravo, setBravo] = useState(false);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  // Auto-advance when user performs the expected action
  useEffect(() => {
    const s = STEPS[step];
    if (!s.autoComplete || bravo) return;
    if (s.autoComplete({ hasTrigger, hasAction, edgesCount, configOpenedCount })) {
      setBravo(true);
      const t = setTimeout(() => {
        setBravo(false);
        setStep(prev => Math.min(prev + 1, STEPS.length - 1));
      }, 1600);
      return () => clearTimeout(t);
    }
  }, [hasTrigger, hasAction, edgesCount, configOpenedCount, step, bravo]);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400, pointerEvents:"none", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>

      {/* Spotlight overlay */}
      {current.spotlight ? (
        <div style={{
          position: "fixed",
          top:    current.spotlight.top,
          left:   current.spotlight.left   ?? "auto",
          right:  current.spotlight.right  ?? "auto",
          width:  current.spotlight.width  ?? "auto",
          height: current.spotlight.height ?? "auto",
          bottom: current.spotlight.bottom ?? "auto",
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.58)",
          borderRadius: 12,
          border: `2px solid ${bravo ? "#10B981" : "rgba(99,102,241,0.85)"}`,
          pointerEvents: "none",
          zIndex: 401,
          transition: "all .35s cubic-bezier(.4,0,.2,1), border-color .2s",
        }} />
      ) : (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", pointerEvents:"none", zIndex:401 }} />
      )}

      {/* Kixi bubble */}
      <div style={{ position:"fixed", ...current.bubble, pointerEvents:"auto", zIndex:402, width:290 }}>
        <div style={{
          background: bravo ? "rgba(236,253,245,0.99)" : "rgba(255,255,255,0.98)",
          borderRadius: 16,
          padding: "1.1rem 1.25rem",
          boxShadow: bravo
            ? "0 8px 32px rgba(16,185,129,0.28), 0 2px 8px rgba(16,185,129,0.12)"
            : "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(99,102,241,0.10)",
          border: `1.5px solid ${bravo ? "rgba(16,185,129,0.45)" : "rgba(99,102,241,0.18)"}`,
          position: "relative",
          transition: "background .2s, border-color .2s, box-shadow .2s",
        }}>
          {/* Arrow pointer */}
          {current.arrow && !bravo && <div style={ARROW_STYLES[current.arrow]} />}

          {bravo ? (
            /* ✅ Bravo state */
            <div style={{ textAlign:"center", padding:".5rem 0" }}>
              <div style={{ fontSize:"2.2rem", marginBottom:".4rem" }}>✅</div>
              <p style={{ fontSize:".9rem", fontWeight:800, color:"#059669", margin:0 }}>
                {current.bravoText || "Bravo !"}
              </p>
              <p style={{ fontSize:".72rem", color:"#6EE7B7", marginTop:".3rem" }}>Passage à l&apos;étape suivante...</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:".6rem", marginBottom:".65rem" }}>
                <div style={{ width:30, height:30, borderRadius:9, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="white" fillOpacity=".25"/>
                    <path d="M12 8v4l3 3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="2.5" fill="white"/>
                  </svg>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:".8rem", fontWeight:800, color:"#0A0A0A", margin:0 }}>{current.title}</p>
                  <p style={{ fontSize:".63rem", color:"#9CA3AF", margin:0 }}>Kixi · étape {step + 1}/{STEPS.length}</p>
                </div>
                <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#D1D5DB", padding:2, lineHeight:1, fontSize:"1rem", fontFamily:"inherit" }}>✕</button>
              </div>

              {/* Step text */}
              <p style={{ fontSize:".82rem", color:"#374151", lineHeight:1.65, marginBottom:".85rem" }}>{current.text}</p>

              {/* Waiting indicator for auto-complete steps */}
              {current.autoComplete && (
                <div style={{ display:"flex", alignItems:"center", gap:".5rem", padding:".35rem .6rem", background:"#EEF2FF", borderRadius:7, marginBottom:".75rem", border:"1px solid #C7D2FE" }}>
                  <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:"#818CF8", animation:"kixipulse 1.4s ease-in-out infinite" }} />
                  <p style={{ fontSize:".72rem", color:"#6366F1", fontWeight:600, margin:0 }}>En attente de ton action...</p>
                </div>
              )}

              {/* Progress bar */}
              <div style={{ display:"flex", gap:".25rem", marginBottom:".75rem" }}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{ height:3, flex:1, borderRadius:2, background: i < step ? "#10B981" : i === step ? "#6366F1" : "#E5E7EB", transition:"background .2s" }} />
                ))}
              </div>

              {/* Buttons — only on manual steps (no autoComplete) */}
              {!current.autoComplete && (
                <div style={{ display:"flex", gap:".5rem" }}>
                  {!isFirst && (
                    <button onClick={() => setStep(s => s - 1)} style={{ flex:1, padding:".5rem", borderRadius:8, fontSize:".78rem", fontWeight:600, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#6B7280", cursor:"pointer", fontFamily:"inherit" }}>
                      ← Retour
                    </button>
                  )}
                  <button
                    onClick={() => isLast ? onClose() : setStep(s => s + 1)}
                    style={{ flex:2, padding:".5rem", borderRadius:8, fontSize:".78rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", border:"none", color:"#fff", cursor:"pointer", fontFamily:"inherit" }}
                  >
                    {isLast ? "Terminer !" : "Suivant →"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes kixipulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }`}</style>
    </div>
  );
}
