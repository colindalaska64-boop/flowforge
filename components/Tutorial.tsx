"use client";
import { useState } from "react";
import { X, ArrowRight, ArrowLeft, Plus, Settings, Play, Link2, Wand2, CheckCircle2 } from "lucide-react";

interface TutorialProps {
  onClose: () => void;
}

const steps = [
  {
    icon: Plus,
    color: "#4F46E5",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    title: "Ajouter des blocs",
    subtitle: "Étape 1 / 5",
    content: "Cliquez sur un bloc dans la sidebar gauche pour l'ajouter au canvas. Les blocs sont organisés en trois catégories : Déclencheurs, Actions et IA.",
    visual: (
      <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
        {[
          { label: "Gmail", desc: "Nouvel email reçu", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
          { label: "Slack", desc: "Envoyer un message", color: "#7C3AED", bg: "#FDF4FF", border: "#E9D5FF" },
          { label: "Filtre IA", desc: "Analyser et filtrer", color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
        ].map((item) => (
          <div key={item.label} style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: 8, padding: ".55rem .75rem", display: "flex", alignItems: "center", gap: ".6rem", cursor: "default" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: ".78rem", fontWeight: 700, color: "#0A0A0A" }}>{item.label}</p>
              <p style={{ fontSize: ".7rem", color: "#9CA3AF" }}>{item.desc}</p>
            </div>
            <div style={{ marginLeft: "auto", width: 20, height: 20, borderRadius: 5, background: "#fff", border: `1px solid ${item.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={10} color={item.color} strokeWidth={2.5} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Link2,
    color: "#4F46E5",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    title: "Connecter les blocs",
    subtitle: "Étape 2 / 5",
    content: "Faites glisser depuis le point droit d'un bloc vers le point gauche d'un autre pour créer une connexion. Les données circulent de gauche à droite.",
    visual: (
      <div style={{ display: "flex", alignItems: "center", gap: ".75rem", justifyContent: "center", padding: "1rem 0" }}>
        {[
          { label: "Gmail", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
          { label: "Slack", color: "#7C3AED", bg: "#FDF4FF", border: "#E9D5FF" },
        ].map((item, i) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <div style={{ background: item.bg, border: `1.5px solid ${item.border}`, borderRadius: 10, padding: ".65rem .9rem", display: "flex", alignItems: "center", gap: ".5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", position: "relative" }}>
              <div style={{ width: 10, height: 10, background: "#4F46E5", border: "2px solid #fff", borderRadius: "50%", position: "absolute", left: -5, top: "50%", transform: "translateY(-50%)" }} />
              <div style={{ width: 22, height: 22, borderRadius: 6, background: "#fff", border: `1px solid ${item.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
              </div>
              <span style={{ fontSize: ".78rem", fontWeight: 700, color: "#0A0A0A" }}>{item.label}</span>
              <div style={{ width: 10, height: 10, background: "#4F46E5", border: "2px solid #fff", borderRadius: "50%", position: "absolute", right: -5, top: "50%", transform: "translateY(-50%)" }} />
            </div>
            {i === 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: ".25rem" }}>
                <div style={{ width: 32, height: 2, background: "linear-gradient(90deg, #818CF8, #4F46E5)", borderRadius: 2 }} />
                <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "7px solid #4F46E5" }} />
              </div>
            )}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Settings,
    color: "#4F46E5",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    title: "Configurer les blocs",
    subtitle: "Étape 3 / 5",
    content: "Cliquez sur l'icône ⚙️ en haut à gauche d'un bloc pour ouvrir le panneau de configuration. Chaque bloc a ses propres paramètres.",
    visual: (
      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: ".9rem", display: "flex", flexDirection: "column", gap: ".6rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", paddingBottom: ".6rem", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "#FEF2F2", border: "1px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626" }} />
          </div>
          <span style={{ fontSize: ".82rem", fontWeight: 700, color: "#0A0A0A" }}>Configurer — Gmail</span>
        </div>
        {[
          { label: "Destinataire", val: "client@email.com", done: true },
          { label: "Sujet", val: "Nouvelle notification", done: true },
          { label: "Corps du message", val: "", done: false },
        ].map((f) => (
          <div key={f.label}>
            <p style={{ fontSize: ".72rem", fontWeight: 600, color: "#374151", marginBottom: ".2rem" }}>{f.label}</p>
            <div style={{ background: f.done ? "#F0FDF4" : "#FAFAFA", border: `1px solid ${f.done ? "#BBF7D0" : "#E5E7EB"}`, borderRadius: 6, padding: ".4rem .65rem", fontSize: ".75rem", color: f.done ? "#059669" : "#9CA3AF" }}>
              {f.done ? f.val : "À remplir..."}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Wand2,
    color: "#4F46E5",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    title: "Utiliser les variables",
    subtitle: "Étape 4 / 5",
    content: "Insérez des données dynamiques avec la syntaxe `{{variable}}`. Ces variables sont automatiquement remplacées par les données reçues lors de l'exécution.",
    visual: (
      <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
        <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 8, padding: ".65rem .85rem", fontSize: ".8rem", color: "#4F46E5", lineHeight: 1.8 }}>
          Bonjour, vous avez reçu un message de{" "}
          <code style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{"{{email}}"}</code>
          {" "}:{" "}
          <code style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{"{{message}}"}</code>
        </div>
        <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
          {["{{email}}", "{{message}}", "{{source}}", "{{date}}"].map((v) => (
            <span key={v} style={{ background: "#EEF2FF", color: "#4F46E5", fontSize: ".72rem", fontWeight: 700, padding: ".2rem .5rem", borderRadius: "100px", border: "1px solid #C7D2FE" }}>{v}</span>
          ))}
        </div>
        <p style={{ fontSize: ".72rem", color: "#9CA3AF", lineHeight: 1.5 }}>
          💡 Utilisez le bouton <strong style={{ color: "#4F46E5" }}>Variables</strong> dans les champs de config pour insérer rapidement les variables disponibles.
        </p>
      </div>
    ),
  },
  {
    icon: Play,
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    title: "Sauvegarder et activer",
    subtitle: "Étape 5 / 5",
    content: "Sauvegardez votre workflow, puis activez-le. Une URL webhook sera générée pour les déclencheurs Webhook. Testez avec le bouton ▶ Tester.",
    visual: (
      <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
        {[
          { label: "Sauvegarder", color: "#374151", bg: "#F9FAFB", border: "#E5E7EB", icon: "💾", desc: "Enregistre les modifications" },
          { label: "Activer", color: "#fff", bg: "#059669", border: "#059669", icon: "▶", desc: "Lance le workflow en production" },
          { label: "Tester", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", icon: "🧪", desc: "Déclenche une exécution de test" },
        ].map((btn) => (
          <div key={btn.label} style={{ display: "flex", alignItems: "center", gap: ".75rem", background: "#F9FAFB", borderRadius: 8, padding: ".5rem .75rem", border: "1px solid #F3F4F6" }}>
            <div style={{ background: btn.bg, border: `1px solid ${btn.border}`, borderRadius: 7, padding: ".35rem .65rem", fontSize: ".78rem", fontWeight: 700, color: btn.color, flexShrink: 0 }}>
              {btn.icon} {btn.label}
            </div>
            <p style={{ fontSize: ".75rem", color: "#6B7280" }}>{btn.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
];

export default function Tutorial({ onClose }: TutorialProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const IconComponent = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(10,10,10,0.45)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,0.18)", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* Header */}
        <div style={{ background: current.bg, borderBottom: `1px solid ${current.border}`, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: `1.5px solid ${current.border}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <IconComponent size={16} color={current.color} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize: ".7rem", fontWeight: 700, color: current.color, textTransform: "uppercase", letterSpacing: ".08em" }}>{current.subtitle}</p>
              <p style={{ fontSize: "1rem", fontWeight: 800, color: "#0A0A0A" }}>{current.title}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem" }}>
          <p style={{ fontSize: ".875rem", color: "#374151", lineHeight: 1.7, marginBottom: "1.25rem" }}>{current.content}</p>
          <div style={{ background: "#FAFAFA", border: "1px solid #F3F4F6", borderRadius: 12, padding: "1rem" }}>
            {current.visual}
          </div>
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: ".4rem", paddingBottom: ".25rem" }}>
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 4, background: i === step ? current.color : "#E5E7EB", border: "none", cursor: "pointer", transition: "all .2s", padding: 0 }}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "1rem 1.5rem 1.25rem", display: "flex", gap: ".75rem", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            style={{ display: "flex", alignItems: "center", gap: ".4rem", fontSize: ".82rem", fontWeight: 600, color: step === 0 ? "#D1D5DB" : "#6B7280", background: "none", border: "none", cursor: step === 0 ? "default" : "pointer", fontFamily: "inherit" }}
          >
            <ArrowLeft size={13} strokeWidth={2} /> Précédent
          </button>

          {isLast ? (
            <button
              onClick={onClose}
              style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".85rem", fontWeight: 700, background: "#059669", color: "#fff", border: "none", padding: ".6rem 1.4rem", borderRadius: 9, cursor: "pointer", fontFamily: "inherit" }}
            >
              <CheckCircle2 size={14} strokeWidth={2} /> C&apos;est parti !
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".85rem", fontWeight: 700, background: "#4F46E5", color: "#fff", border: "none", padding: ".6rem 1.4rem", borderRadius: 9, cursor: "pointer", fontFamily: "inherit" }}
            >
              Suivant <ArrowRight size={13} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}