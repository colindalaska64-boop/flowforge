"use client";
import { useState } from "react";

type Step = {
  title: string;
  text: string;
  spotlight: { top: number; left?: number; right?: number; width?: number; bottom?: number; height?: number } | null;
  bubble: { top?: number | string; left?: number | string; right?: number | string; bottom?: number | string; transform?: string };
  arrow?: "left" | "right" | "top" | "bottom";
};

const STEPS: Step[] = [
  {
    title: "Salut, je suis Kixi !",
    text: "Je vais te guider pour créer ton premier workflow en 5 étapes. C'est facile, promis !",
    spotlight: null,
    bubble: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  },
  {
    title: "Le panneau des blocs",
    text: "À gauche tu as tous tes blocs. Les déclencheurs lancent le workflow, les actions font quelque chose (envoyer un email, écrire dans Sheets...).",
    spotlight: { top: 52, left: 0, width: 220, bottom: 0 },
    bubble: { top: 80, left: 240 },
    arrow: "left",
  },
  {
    title: "Glisse un déclencheur !",
    text: "Prends un bloc depuis le panneau (ex: Webhook ou Planifié) et glisse-le sur le canvas à droite. Vas-y, essaie !",
    spotlight: { top: 52, left: 0, width: 220, bottom: 0 },
    bubble: { top: 220, left: 240 },
    arrow: "left",
  },
  {
    title: "Ajoute une action",
    text: "Maintenant glisse une action depuis le panneau — ex: Gmail pour envoyer un email. Puis connecte-les en tirant le fil depuis le point de sortie du premier bloc.",
    spotlight: { top: 52, left: 220, right: 0, bottom: 0 },
    bubble: { top: 80, left: "50%", transform: "translateX(-30%)" },
    arrow: "bottom",
  },
  {
    title: "Configure tes blocs",
    text: "Double-clique sur n'importe quel bloc pour ouvrir son panneau de configuration. Tu peux utiliser {{email}}, {{message}} pour insérer des données dynamiques.",
    spotlight: { top: 52, left: 220, right: 0, bottom: 0 },
    bubble: { top: 200, left: "50%", transform: "translateX(-30%)" },
    arrow: "bottom",
  },
  {
    title: "Sauvegarde et active !",
    text: "Clique sur \"Sauvegarder\" puis sur \"Activer\" — ton workflow tournera automatiquement. C'est tout, tu es prêt !",
    spotlight: { top: 0, right: 0, width: 440, height: 52 },
    bubble: { top: 65, right: 20 },
    arrow: "top",
  },
];

const ARROW_STYLE: Record<string, React.CSSProperties> = {
  left: {
    position: "absolute", left: -10, top: 20,
    width: 0, height: 0,
    borderTop: "10px solid transparent", borderBottom: "10px solid transparent",
    borderRight: "10px solid rgba(255,255,255,0.98)",
  },
  right: {
    position: "absolute", right: -10, top: 20,
    width: 0, height: 0,
    borderTop: "10px solid transparent", borderBottom: "10px solid transparent",
    borderLeft: "10px solid rgba(255,255,255,0.98)",
  },
  top: {
    position: "absolute", top: -10, right: 40,
    width: 0, height: 0,
    borderLeft: "10px solid transparent", borderRight: "10px solid transparent",
    borderBottom: "10px solid rgba(255,255,255,0.98)",
  },
  bottom: {
    position: "absolute", bottom: -10, left: 40,
    width: 0, height: 0,
    borderLeft: "10px solid transparent", borderRight: "10px solid transparent",
    borderTop: "10px solid rgba(255,255,255,0.98)",
  },
};

export default function TutorialOverlay({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, pointerEvents: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Spotlight — box-shadow trick: creates dark overlay with transparent cutout */}
      {current.spotlight ? (
        <div style={{
          position: "fixed",
          top: current.spotlight.top,
          left: current.spotlight.left ?? "auto",
          right: current.spotlight.right ?? "auto",
          width: current.spotlight.width ?? "auto",
          height: current.spotlight.height ?? "auto",
          bottom: current.spotlight.bottom ?? "auto",
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.62)",
          borderRadius: 12,
          border: "2px solid rgba(99,102,241,0.9)",
          outline: "none",
          pointerEvents: "none",
          zIndex: 401,
          transition: "all .35s cubic-bezier(.4,0,.2,1)",
        }} />
      ) : (
        /* Full screen dim when no spotlight */
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", pointerEvents: "none", zIndex: 401 }} />
      )}

      {/* Kixi Bubble */}
      <div style={{
        position: "fixed",
        ...current.bubble,
        pointerEvents: "auto",
        zIndex: 402,
        maxWidth: 300,
        width: 280,
      }}>
        <div style={{
          background: "rgba(255,255,255,0.98)",
          borderRadius: 16,
          padding: "1.1rem 1.25rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(99,102,241,0.15)",
          border: "1.5px solid rgba(99,102,241,0.2)",
          position: "relative",
        }}>
          {/* Arrow */}
          {current.arrow && <div style={ARROW_STYLE[current.arrow]} />}

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".65rem" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 3H9a2 2 0 00-2 2v14l5-3 5 3V5a2 2 0 00-2-2z" fill="white"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: ".8rem", fontWeight: 800, color: "#0A0A0A", margin: 0 }}>{current.title}</p>
              <p style={{ fontSize: ".65rem", color: "#9CA3AF", margin: 0 }}>Kixi · étape {step + 1}/{STEPS.length}</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#D1D5DB", padding: 2, lineHeight: 1 }}>✕</button>
          </div>

          {/* Text */}
          <p style={{ fontSize: ".82rem", color: "#374151", lineHeight: 1.65, marginBottom: ".9rem" }}>{current.text}</p>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: ".3rem", marginBottom: ".75rem" }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i <= step ? "#6366F1" : "#E5E7EB", transition: "background .2s" }} />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: ".5rem" }}>
            {!isFirst && (
              <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: ".5rem", borderRadius: 8, fontSize: ".78rem", fontWeight: 600, background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#6B7280", cursor: "pointer", fontFamily: "inherit" }}>
                ← Retour
              </button>
            )}
            <button
              onClick={() => isLast ? onClose() : setStep(s => s + 1)}
              style={{ flex: 2, padding: ".5rem", borderRadius: 8, fontSize: ".78rem", fontWeight: 700, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}
            >
              {isLast ? "Terminer !" : "Suivant →"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
