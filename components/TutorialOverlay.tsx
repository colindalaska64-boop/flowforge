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
    bubble: { top: 380, left: 240 },
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
    text: "Clique sur le petit engrenage gris en haut à gauche de n'importe quel bloc pour ouvrir le panneau de configuration.",
    spotlight: { top: 52, left: 220, right: 0, bottom: 0 },
    bubble: { top: 80, right: 30 },
    arrow: "left",
    autoComplete: (p) => p.configOpenedCount > 0,
    bravoText: "Bien joué ! Remplis les paramètres dans le panneau.",
  },
  {
    title: "Sauvegarde et active !",
    text: "Clique sur \"Sauvegarder\" puis sur \"Activer\" en haut à droite. Ton workflow tournera automatiquement !",
    spotlight: { top: 0, right: 0, width: 440, height: 52 },
    bubble: { top: 65, right: 20 },
    arrow: "top",
  },
];

const ARROW: Record<string, React.CSSProperties> = {
  left:   { position:"absolute", left:-10,  top:22, width:0, height:0, borderTop:"10px solid transparent", borderBottom:"10px solid transparent", borderRight:"10px solid #fff" },
  right:  { position:"absolute", right:-10, top:22, width:0, height:0, borderTop:"10px solid transparent", borderBottom:"10px solid transparent", borderLeft:"10px solid #fff" },
  top:    { position:"absolute", top:-10,   right:40, width:0, height:0, borderLeft:"10px solid transparent", borderRight:"10px solid transparent", borderBottom:"10px solid #fff" },
  bottom: { position:"absolute", bottom:-10, left:40, width:0, height:0, borderLeft:"10px solid transparent", borderRight:"10px solid transparent", borderTop:"10px solid #fff" },
};

function IconKixi() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l1.5 5h5l-4 3 1.5 5L12 12l-4 3 1.5-5-4-3h5z" fill="white" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#10B981" />
      <path d="M12 20l6 6 10-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

  // Effect 1: detect when the user has completed the current step's action
  useEffect(() => {
    const s = STEPS[step];
    if (!s.autoComplete || bravo) return;
    if (s.autoComplete({ hasTrigger, hasAction, edgesCount, configOpenedCount })) {
      setBravo(true);
    }
  }, [hasTrigger, hasAction, edgesCount, configOpenedCount, step, bravo]);

  // Effect 2: advance to next step after bravo animation
  // Kept separate so the timer is NOT cancelled by hasTrigger/hasAction re-renders
  useEffect(() => {
    if (!bravo) return;
    const t = setTimeout(() => {
      setBravo(false);
      setStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }, 1600);
    return () => clearTimeout(t);
  }, [bravo]);

  // Using a fragment so each element is independently fixed in the viewport
  // — avoids the parent pointerEvents:none blocking child clicks bug
  return (
    <>
      {/* Spotlight / dark overlay — no pointer events */}
      {current.spotlight ? (
        <div style={{
          position: "fixed",
          top:    current.spotlight.top,
          left:   current.spotlight.left   ?? "auto",
          right:  current.spotlight.right  ?? "auto",
          width:  current.spotlight.width  ?? "auto",
          height: current.spotlight.height ?? "auto",
          bottom: current.spotlight.bottom ?? "auto",
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.60)",
          borderRadius: 10,
          border: `2px solid ${bravo ? "#10B981" : "#6366F1"}`,
          pointerEvents: "none",
          zIndex: 9997,
          transition: "top .3s, left .3s, right .3s, width .3s, height .3s, bottom .3s, border-color .2s",
        }} />
      ) : (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.58)", pointerEvents:"none", zIndex:9997 }} />
      )}

      {/* Kixi bubble — fully interactive, on top of everything */}
      <div style={{
        position: "fixed",
        ...current.bubble,
        zIndex: 9999,
        width: 292,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{
          background: bravo ? "#F0FDF4" : "#fff",
          borderRadius: 14,
          padding: "1rem 1.15rem 1.1rem",
          boxShadow: bravo
            ? "0 8px 32px rgba(16,185,129,0.22), 0 2px 8px rgba(16,185,129,0.10)"
            : "0 12px 40px rgba(0,0,0,0.24), 0 2px 8px rgba(99,102,241,0.12)",
          border: `1.5px solid ${bravo ? "#6EE7B7" : "#E0E7FF"}`,
          position: "relative",
          transition: "background .25s, border-color .25s, box-shadow .25s",
        }}>

          {/* Arrow pointer */}
          {current.arrow && !bravo && <div style={ARROW[current.arrow]} />}

          {bravo ? (
            /* Success state */
            <div style={{ textAlign:"center", padding:".6rem 0 .4rem" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:".55rem" }}>
                <IconCheck />
              </div>
              <p style={{ fontSize:".88rem", fontWeight:800, color:"#059669", margin:"0 0 .2rem" }}>
                {current.bravoText || "Bravo !"}
              </p>
              <p style={{ fontSize:".7rem", color:"#6EE7B7", margin:0 }}>Passage à l&apos;étape suivante…</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:".55rem", marginBottom:".6rem" }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <IconKixi />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:".78rem", fontWeight:800, color:"#111827", margin:0, lineHeight:1.3 }}>{current.title}</p>
                  <p style={{ fontSize:".62rem", color:"#9CA3AF", margin:0 }}>Kixi · {step + 1} / {STEPS.length}</p>
                </div>
                <button
                  onClick={onClose}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"#D1D5DB", padding:"2px", display:"flex", alignItems:"center", flexShrink:0 }}
                  aria-label="Fermer le tutoriel"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Body text */}
              <p style={{ fontSize:".8rem", color:"#374151", lineHeight:1.65, marginBottom:".8rem" }}>
                {current.text}
              </p>

              {/* Waiting indicator */}
              {current.autoComplete && (
                <div style={{ display:"flex", alignItems:"center", gap:".45rem", padding:".32rem .6rem", background:"#EEF2FF", borderRadius:6, marginBottom:".75rem", border:"1px solid #C7D2FE" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#818CF8", flexShrink:0, animation:"kxpulse 1.4s ease-in-out infinite", display:"inline-block" }} />
                  <span style={{ fontSize:".7rem", color:"#4F46E5", fontWeight:600 }}>En attente de ton action…</span>
                </div>
              )}

              {/* Progress bar */}
              <div style={{ display:"flex", gap:3, marginBottom:".75rem" }}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{ height:3, flex:1, borderRadius:2, background: i < step ? "#10B981" : i === step ? "#6366F1" : "#E5E7EB", transition:"background .25s" }} />
                ))}
              </div>

              {/* Action buttons — only shown on manual steps */}
              {!current.autoComplete && (
                <div style={{ display:"flex", gap:6 }}>
                  {!isFirst && (
                    <button
                      onClick={() => setStep(s => s - 1)}
                      style={{ flex:1, padding:".45rem", borderRadius:8, fontSize:".76rem", fontWeight:600, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#6B7280", cursor:"pointer", fontFamily:"inherit" }}
                    >
                      ← Retour
                    </button>
                  )}
                  <button
                    onClick={() => isLast ? onClose() : setStep(s => s + 1)}
                    style={{ flex:2, padding:".45rem", borderRadius:8, fontSize:".76rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", border:"none", color:"#fff", cursor:"pointer", fontFamily:"inherit" }}
                  >
                    {isLast ? "Terminer !" : "Suivant →"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes kxpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}`}</style>
    </>
  );
}
