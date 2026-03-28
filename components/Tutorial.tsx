"use client";
import { useState, useEffect } from "react";
import {
  X, ArrowRight, ArrowLeft, Plus, Settings, Play, Link2,
  CheckCircle2, Mail, MessageSquare, Clock, Webhook, Save,
  Zap, Sparkles, Hash,
} from "lucide-react";

/* ─── données blocs ─── */
const BLOCKS = [
  { type: "webhook",  label: "Webhook",  color: "#D97706", bg: "#FFF7ED", border: "#FDE68A", Icon: Webhook },
  { type: "gmail",    label: "Gmail",    color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", Icon: Mail },
  { type: "slack",    label: "Slack",    color: "#7C3AED", bg: "#FDF4FF", border: "#E9D5FF", Icon: MessageSquare },
  { type: "schedule", label: "Planifié", color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE", Icon: Clock },
  { type: "discord",  label: "Discord",  color: "#5865F2", bg: "#EEF0FF", border: "#C7CBFF", Icon: Hash },
];
const VARS = ["{{email}}", "{{message}}", "{{date}}", "{{source}}", "{{name}}"];

/* ─── ÉTAPE 1 : Bienvenue ─── */
function StepWelcome() {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => (p + 1) % 3), 900);
    return () => clearInterval(t);
  }, []);
  const shown = BLOCKS.slice(0, 3);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1rem", alignItems:"center" }}>
      <div style={{ display:"flex", alignItems:"center", gap:".6rem", flexWrap:"wrap", justifyContent:"center" }}>
        {shown.map((b, i) => (
          <div key={b.label} style={{
            background: `linear-gradient(145deg, rgba(255,255,255,0.94) 0%, ${b.bg}70 100%)`,
            backdropFilter: "blur(20px) saturate(180%)",
            border: `1.5px solid ${pulse === i ? b.color : "rgba(255,255,255,0.92)"}`,
            borderRadius: 11, padding: ".65rem 1rem",
            display: "flex", alignItems: "center", gap: ".5rem",
            boxShadow: pulse === i
              ? `0 12px 32px rgba(0,0,0,0.13), inset 0 1.5px 0 rgba(255,255,255,1)`
              : `0 4px 14px rgba(0,0,0,0.07), inset 0 1.5px 0 rgba(255,255,255,0.9)`,
            transform: pulse === i ? "translateY(-6px) scale(1.06)" : "none",
            transition: "all .55s cubic-bezier(.34,1.56,.64,1)",
          }}>
            <b.Icon size={14} color={b.color} strokeWidth={2} />
            <span style={{ fontSize:".82rem", fontWeight:700, color:"#0A0A0A" }}>{b.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:".3rem" }}>
        {[1,0,1,0,1].map((thick, i) => (
          <div key={i} style={{ width: thick ? 24 : 8, height: 2, borderRadius: 2, background: thick ? "linear-gradient(90deg,#6366F1,#8B5CF6)" : "rgba(199,210,254,0.7)", transition:"all .3s" }} />
        ))}
        <Zap size={13} color="#6366F1" strokeWidth={2} />
        <div style={{ width:24, height:2, borderRadius:2, background:"linear-gradient(90deg,#8B5CF6,#6366F1)" }} />
      </div>
      <p style={{ fontSize:".8rem", color:"#6B7280", lineHeight:1.65, textAlign:"center", maxWidth:300 }}>
        Connecte tes outils et automatise tes tâches — sans une seule ligne de code.
      </p>
    </div>
  );
}

/* ─── ÉTAPE 2 : Ajouter des blocs ─── */
function StepAddBlocks() {
  const [added, setAdded] = useState<string[]>([]);
  const sideBlocks = BLOCKS.slice(0, 4);
  return (
    <div style={{ display:"flex", gap:".75rem" }}>
      {/* mini sidebar */}
      <div style={{ width:118, background:"rgba(245,242,255,0.90)", backdropFilter:"blur(24px)", border:"1.5px solid rgba(255,255,255,0.93)", borderRadius:10, padding:".65rem .6rem", display:"flex", flexDirection:"column", gap:".35rem", flexShrink:0, boxShadow:"0 4px 16px rgba(99,102,241,0.08), inset 0 1.5px 0 rgba(255,255,255,1)" }}>
        <p style={{ fontSize:".58rem", fontWeight:800, color:"#7C6FAE", textTransform:"uppercase", letterSpacing:".1em", marginBottom:".2rem" }}>Clique pour ajouter</p>
        {sideBlocks.map(b => {
          const done = added.includes(b.label);
          return (
            <div key={b.label}
              onClick={() => !done && setAdded(p => [...p, b.label])}
              style={{
                background: done ? "rgba(200,200,200,0.25)" : `linear-gradient(145deg,rgba(255,255,255,0.92) 0%,${b.bg}55 100%)`,
                backdropFilter:"blur(16px)", border:"1.5px solid rgba(255,255,255,0.9)",
                borderRadius:8, padding:".38rem .55rem",
                display:"flex", alignItems:"center", gap:".4rem",
                cursor: done ? "default" : "pointer",
                opacity: done ? 0.4 : 1,
                transition:"all .2s",
                boxShadow:"0 3px 10px rgba(0,0,0,0.06), inset 0 1.5px 0 rgba(255,255,255,1)",
              }}>
              <b.Icon size={9} color={done ? "#9CA3AF" : b.color} strokeWidth={2} />
              <span style={{ fontSize:".7rem", fontWeight:700, color: done ? "#9CA3AF" : "#0A0A0A" }}>{b.label}</span>
            </div>
          );
        })}
        {added.length > 0 && (
          <button onClick={() => setAdded([])} style={{ fontSize:".6rem", color:"#9CA3AF", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", marginTop:".1rem" }}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* mini canvas */}
      <div style={{ flex:1, background:"rgba(242,238,255,0.45)", border:"1.5px solid rgba(199,210,254,0.40)", borderRadius:10, minHeight:130, padding:".65rem", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(167,139,250,0.22) 1px,transparent 1px)", backgroundSize:"14px 14px" }} />
        {added.length === 0 && (
          <p style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", fontSize:".72rem", color:"#9CA3AF", textAlign:"center", pointerEvents:"none", lineHeight:1.6 }}>
            Clique sur un bloc<br />pour l&apos;ajouter ici
          </p>
        )}
        <div style={{ position:"relative", zIndex:1, display:"flex", flexWrap:"wrap", gap:".35rem" }}>
          {added.map(label => {
            const b = BLOCKS.find(bl => bl.label === label)!;
            return (
              <div key={label} style={{
                background:`linear-gradient(145deg,rgba(255,255,255,0.94) 0%,${b.bg}60 100%)`,
                backdropFilter:"blur(16px)", border:"1.5px solid rgba(255,255,255,0.93)",
                borderRadius:8, padding:".38rem .6rem",
                display:"flex", alignItems:"center", gap:".35rem",
                boxShadow:"0 5px 16px rgba(0,0,0,0.09), inset 0 1.5px 0 rgba(255,255,255,1)",
                animation:"popIn .35s cubic-bezier(.34,1.56,.64,1)",
              }}>
                <b.Icon size={9} color={b.color} strokeWidth={2} />
                <span style={{ fontSize:".7rem", fontWeight:700, color:"#0A0A0A" }}>{b.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── ÉTAPE 3 : Connecter ─── */
function StepConnect() {
  const [connected, setConnected] = useState(false);
  const A = BLOCKS[0], B = BLOCKS[1];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:".75rem", alignItems:"center" }}>
      <div style={{ display:"flex", alignItems:"center", gap:".65rem" }}>
        {/* Bloc A */}
        {[A, B].map((b, idx) => (
          <div key={b.label} style={{ display:"flex", alignItems:"center", gap:".65rem" }}>
            {idx === 1 && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:".4rem" }}>
                <div style={{ position:"relative", width:56, height:16, display:"flex", alignItems:"center" }}>
                  <div style={{ height:2, borderRadius:2, background:"linear-gradient(90deg,#6366F1,#8B5CF6)", transition:"width .6s ease", width: connected ? 56 : 0 }} />
                  {connected && <div style={{ position:"absolute", right:0, width:0, height:0, borderTop:"5px solid transparent", borderBottom:"5px solid transparent", borderLeft:"7px solid #8B5CF6" }} />}
                </div>
                {!connected && (
                  <button onClick={() => setConnected(true)} style={{ background:"linear-gradient(135deg,#6366F1,#8B5CF6)", border:"none", color:"#fff", fontSize:".68rem", fontWeight:700, padding:".3rem .7rem", borderRadius:7, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 3px 10px rgba(99,102,241,0.35)", whiteSpace:"nowrap" }}>
                    Connecter →
                  </button>
                )}
              </div>
            )}
            <div style={{
              background:`linear-gradient(145deg,rgba(255,255,255,0.94) 0%,${b.bg}60 100%)`,
              backdropFilter:"blur(20px)", border:`1.5px solid ${connected ? b.color : "rgba(255,255,255,0.92)"}`,
              borderRadius:10, padding:".65rem 1rem",
              display:"flex", alignItems:"center", gap:".5rem",
              boxShadow:"0 6px 20px rgba(0,0,0,0.08), inset 0 1.5px 0 rgba(255,255,255,1)",
              position:"relative", transition:"border-color .3s",
            }}>
              {idx === 1 && <div style={{ position:"absolute", left:-6, top:"50%", transform:"translateY(-50%)", width:12, height:12, borderRadius:"50%", background: connected ? "#4F46E5" : "#D1D5DB", border:"2px solid #fff", boxShadow: connected ? "0 0 8px rgba(79,70,229,0.5)" : "none", transition:"all .3s" }} />}
              <b.Icon size={13} color={b.color} strokeWidth={2} />
              <span style={{ fontSize:".82rem", fontWeight:700, color:"#0A0A0A" }}>{b.label}</span>
              {idx === 0 && <div style={{ position:"absolute", right:-6, top:"50%", transform:"translateY(-50%)", width:12, height:12, borderRadius:"50%", background: connected ? "#4F46E5" : "#D1D5DB", border:"2px solid #fff", boxShadow: connected ? "0 0 8px rgba(79,70,229,0.5)" : "none", transition:"all .3s" }} />}
            </div>
          </div>
        ))}
      </div>
      {connected && (
        <div style={{ display:"flex", alignItems:"center", gap:".5rem", background:"rgba(236,253,245,0.88)", border:"1.5px solid rgba(167,243,208,0.85)", borderRadius:9, padding:".45rem .9rem", animation:"popIn .3s ease" }}>
          <CheckCircle2 size={13} color="#059669" strokeWidth={2} />
          <span style={{ fontSize:".78rem", color:"#059669", fontWeight:600 }}>Connexion créée ! Les données circulent vers Gmail.</span>
        </div>
      )}
      {!connected && (
        <p style={{ fontSize:".72rem", color:"#9CA3AF", textAlign:"center" }}>
          En vrai : glisse depuis le point droit du bloc vers le point gauche du suivant.
        </p>
      )}
    </div>
  );
}

/* ─── ÉTAPE 4 : Configurer ─── */
function StepConfigure() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [saved, setSaved] = useState(false);
  const ready = to.length > 0 && subject.length > 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:".6rem" }}>
      <div style={{ background:"rgba(248,246,255,0.92)", backdropFilter:"blur(24px) saturate(180%)", border:"1.5px solid rgba(255,255,255,0.93)", borderRadius:12, padding:"1rem", boxShadow:"0 4px 16px rgba(99,102,241,0.08), inset 0 1.5px 0 rgba(255,255,255,1)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:".75rem", paddingBottom:".6rem", borderBottom:"1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ width:26, height:26, borderRadius:7, background:"#FEF2F2", border:"1.5px solid #FECACA", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Mail size={12} color="#DC2626" strokeWidth={2} />
          </div>
          <span style={{ fontSize:".85rem", fontWeight:700, color:"#0A0A0A" }}>Configurer — Gmail</span>
          <Settings size={12} color="#9CA3AF" strokeWidth={2} style={{ marginLeft:"auto" }} />
        </div>
        {[
          { label:"Destinataire", val:to, set:setTo, placeholder:"client@email.com" },
          { label:"Sujet", val:subject, set:setSubject, placeholder:"Notification — {{source}}" },
        ].map(f => (
          <div key={f.label} style={{ marginBottom:".55rem" }}>
            <p style={{ fontSize:".7rem", fontWeight:700, color:"#374151", marginBottom:".25rem" }}>{f.label}</p>
            <input
              type="text"
              placeholder={f.placeholder}
              value={f.val}
              onChange={e => { f.set(e.target.value); setSaved(false); }}
              style={{
                width:"100%", padding:".48rem .65rem",
                background: f.val ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.75)",
                backdropFilter:"blur(8px)",
                border:`1.5px solid ${f.val ? "rgba(99,102,241,0.45)" : "rgba(0,0,0,0.08)"}`,
                borderRadius:8, fontSize:".78rem", fontFamily:"inherit", outline:"none",
                boxShadow: f.val ? "0 0 0 3px rgba(99,102,241,0.10)" : "none",
                transition:"all .2s", boxSizing:"border-box",
              }}
            />
          </div>
        ))}
        <button
          disabled={!ready}
          onClick={() => ready && setSaved(true)}
          style={{
            width:"100%", padding:".52rem",
            background: saved ? "rgba(236,253,245,0.95)" : ready ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "rgba(200,200,200,0.45)",
            border: saved ? "1.5px solid rgba(167,243,208,0.9)" : "none",
            color: saved ? "#059669" : ready ? "#fff" : "#9CA3AF",
            borderRadius:9, fontSize:".8rem", fontWeight:700,
            cursor: ready ? "pointer" : "not-allowed", fontFamily:"inherit",
            boxShadow: saved ? "none" : ready ? "0 4px 14px rgba(99,102,241,0.35)" : "none",
            transition:"all .3s", display:"flex", alignItems:"center", justifyContent:"center", gap:".4rem",
          }}
        >
          {saved ? <><CheckCircle2 size={13} strokeWidth={2} /> Configuré !</> : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

/* ─── ÉTAPE 5 : Variables ─── */
function StepVariables() {
  const [text, setText] = useState("Bonjour, message de ");
  const [flash, setFlash] = useState<string | null>(null);
  function insert(v: string) {
    setText(t => t + v + " ");
    setFlash(v); setTimeout(() => setFlash(null), 600);
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
      <p style={{ fontSize:".75rem", color:"#7C6FAE", fontWeight:600 }}>Clique sur une variable pour l&apos;insérer dans le message :</p>
      <div style={{ display:"flex", gap:".4rem", flexWrap:"wrap" }}>
        {VARS.map(v => (
          <button key={v} onClick={() => insert(v)} style={{
            background: flash === v ? "rgba(99,102,241,0.18)" : "rgba(238,242,255,0.90)",
            backdropFilter:"blur(12px)",
            border:`1.5px solid ${flash === v ? "rgba(99,102,241,0.55)" : "rgba(199,210,254,0.85)"}`,
            color:"#4F46E5", fontSize:".72rem", fontWeight:700,
            padding:".28rem .65rem", borderRadius:"100px",
            cursor:"pointer", fontFamily:"monospace",
            boxShadow:"0 2px 8px rgba(99,102,241,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
            transform: flash === v ? "scale(0.93)" : "none",
            transition:"all .15s",
          }}>
            {v}
          </button>
        ))}
      </div>
      <div style={{
        background:"rgba(245,243,255,0.88)", backdropFilter:"blur(16px)",
        border:"1.5px solid rgba(221,214,254,0.85)",
        borderRadius:10, padding:".75rem .9rem",
        fontSize:".82rem", color:"#374151", lineHeight:1.75, minHeight:56,
        fontFamily:"inherit", boxShadow:"inset 0 2px 8px rgba(99,102,241,0.05)",
      }}>
        {text.split(/({{[^}]+}})/).map((part, i) =>
          /^{{.*}}$/.test(part)
            ? <code key={i} style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(199,210,254,0.8)", padding:"1px 5px", borderRadius:4, fontWeight:700, color:"#4F46E5", fontSize:".78rem" }}>{part}</code>
            : <span key={i}>{part}</span>
        )}
        <span style={{ opacity:0.25, animation:"blink 1s step-end infinite" }}>|</span>
      </div>
      <button onClick={() => setText("Bonjour, message de ")} style={{ fontSize:".68rem", color:"#9CA3AF", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", alignSelf:"flex-end" }}>
        Réinitialiser
      </button>
    </div>
  );
}

/* ─── ÉTAPE 6 : Sauvegarder & Activer ─── */
function StepSaveActivate() {
  const [phase, setPhase] = useState<"idle"|"saved"|"active"|"tested">("idle");
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
      {/* fausse navbar */}
      <div style={{ background:"rgba(255,255,255,0.88)", backdropFilter:"blur(24px) saturate(180%)", border:"1.5px solid rgba(255,255,255,0.95)", borderRadius:10, padding:".6rem .9rem", display:"flex", alignItems:"center", justifyContent:"flex-end", gap:".5rem", boxShadow:"0 4px 16px rgba(0,0,0,0.07), inset 0 1.5px 0 rgba(255,255,255,1)" }}>
        {/* Sauvegarder */}
        <button onClick={() => phase === "idle" && setPhase("saved")} style={{
          display:"flex", alignItems:"center", gap:".35rem",
          fontSize:".78rem", fontWeight:700,
          background: phase !== "idle" ? "rgba(236,253,245,0.92)" : "rgba(255,255,255,0.88)",
          backdropFilter:"blur(12px)",
          border:`1.5px solid ${phase !== "idle" ? "rgba(167,243,208,0.9)" : "rgba(255,255,255,0.95)"}`,
          color: phase !== "idle" ? "#059669" : "#374151",
          padding:".42rem .8rem", borderRadius:9, cursor: phase === "idle" ? "pointer" : "default",
          fontFamily:"inherit", boxShadow:"0 3px 10px rgba(0,0,0,0.07), inset 0 1.5px 0 rgba(255,255,255,1)",
          transform: phase === "idle" ? "scale(1.04)" : "none", transition:"all .3s",
        }}>
          <Save size={11} strokeWidth={2} />
          {phase !== "idle" ? "Sauvegardé !" : "Sauvegarder"}
        </button>
        {/* Activer */}
        <button onClick={() => phase === "saved" && setPhase("active")} style={{
          display:"flex", alignItems:"center", gap:".35rem",
          fontSize:".78rem", fontWeight:700,
          background: phase === "active" || phase === "tested" ? "linear-gradient(135deg,#059669,#10B981)" : "linear-gradient(135deg,#1e293b,#0f172a)",
          border:"none", color:"#fff",
          padding:".42rem .8rem", borderRadius:9,
          cursor: phase === "saved" ? "pointer" : "default", fontFamily:"inherit",
          boxShadow: phase === "active" || phase === "tested" ? "0 4px 14px rgba(5,150,105,0.42)" : "0 4px 14px rgba(0,0,0,0.28)",
          transform: phase === "saved" ? "scale(1.06)" : "none",
          opacity: phase === "idle" ? 0.55 : 1, transition:"all .3s",
        }}>
          <Play size={11} strokeWidth={2} />
          {phase === "active" || phase === "tested" ? "Actif" : "Activer"}
        </button>
        {/* Tester */}
        <button onClick={() => phase === "active" && setPhase("tested")} style={{
          display:"flex", alignItems:"center", gap:".35rem",
          fontSize:".78rem", fontWeight:700,
          background: phase === "tested" ? "rgba(236,253,245,0.92)" : "rgba(240,253,244,0.90)",
          backdropFilter:"blur(12px)",
          border:`1.5px solid ${phase === "tested" ? "rgba(167,243,208,0.9)" : "rgba(187,247,208,0.9)"}`,
          color: phase === "tested" ? "#059669" : "#16A34A",
          padding:".42rem .8rem", borderRadius:9,
          cursor: phase === "active" ? "pointer" : "default", fontFamily:"inherit",
          boxShadow:"0 3px 10px rgba(22,163,74,0.10), inset 0 1.5px 0 rgba(255,255,255,1)",
          opacity: phase === "active" || phase === "tested" ? 1 : 0.45,
          transform: phase === "active" ? "scale(1.06)" : "none", transition:"all .3s",
        }}>
          {phase === "tested" ? <><CheckCircle2 size={11} strokeWidth={2} /> Succès !</> : "▶ Tester"}
        </button>
      </div>
      {/* instruction */}
      <div style={{ fontSize:".8rem", lineHeight:1.65, padding:".65rem .9rem", background:"rgba(245,242,255,0.70)", borderRadius:9, border:"1px solid rgba(199,210,254,0.45)", color:"#4B5563" }}>
        {phase === "idle" && <>Commence par cliquer <strong style={{ color:"#374151" }}>Sauvegarder</strong> ci-dessus</>}
        {phase === "saved" && <><CheckCircle2 size={12} color="#059669" style={{ verticalAlign:"middle", marginRight:4 }} />Sauvegardé ! Maintenant clique <strong style={{ color:"#059669" }}>Activer</strong></>}
        {phase === "active" && <><CheckCircle2 size={12} color="#059669" style={{ verticalAlign:"middle", marginRight:4 }} />Workflow actif ! Lance un <strong style={{ color:"#16A34A" }}>Test</strong> pour vérifier</>}
        {phase === "tested" && <><CheckCircle2 size={12} color="#059669" style={{ verticalAlign:"middle", marginRight:4 }} /><strong style={{ color:"#059669" }}>Parfait !</strong> Ton workflow tourne en production. <button onClick={() => setPhase("idle")} style={{ fontSize:".68rem", color:"#9CA3AF", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Recommencer</button></>}
      </div>
    </div>
  );
}

/* ─── DÉFINITION DES ÉTAPES ─── */
const steps = [
  { icon: Zap,        color:"#6366F1", bg:"#EEF2FF", title:"Bienvenue dans l'éditeur", subtitle:"Intro",    content:"Loopflo te permet de créer des automatisations visuelles en connectant des blocs. Chaque bloc est un outil ou une action — aucun code nécessaire.", Visual: StepWelcome },
  { icon: Plus,       color:"#D97706", bg:"#FFF7ED", title:"Ajouter des blocs",         subtitle:"Étape 1", content:"La sidebar gauche contient tous les blocs disponibles : Déclencheurs, Actions, Logique et IA. Clique sur un bloc pour l'ajouter au canvas.", Visual: StepAddBlocks },
  { icon: Link2,      color:"#7C3AED", bg:"#FDF4FF", title:"Connecter les blocs",       subtitle:"Étape 2", content:"Glisse depuis le point droit d'un bloc vers le point gauche du suivant. Les données circulent de gauche à droite dans ton workflow.", Visual: StepConnect },
  { icon: Settings,   color:"#DC2626", bg:"#FEF2F2", title:"Configurer un bloc",        subtitle:"Étape 3", content:"Clique sur l'icône ⚙ en haut du bloc pour ouvrir son panneau. Chaque bloc a ses propres paramètres — destinataire, message, URL, etc.", Visual: StepConfigure },
  { icon: Sparkles,   color:"#4F46E5", bg:"#EEF2FF", title:"Variables dynamiques",      subtitle:"Étape 4", content:"Utilise {{variable}} pour injecter des données dynamiques dans tes messages. Elles sont remplacées automatiquement à chaque exécution.", Visual: StepVariables },
  { icon: Play,       color:"#059669", bg:"#ECFDF5", title:"Sauvegarder et activer",    subtitle:"Étape 5", content:"Sauvegarde, active, puis teste ton workflow. Un workflow actif tourne 24h/24 en production et s'exécute automatiquement.", Visual: StepSaveActivate },
];

/* ─── COMPOSANT PRINCIPAL ─── */
export default function Tutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const IconComponent = current.icon;
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(15,10,40,0.52)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)" }}
      onClick={onClose}
    >
      <style>{`
        @keyframes popIn    { from { transform:scale(0.65); opacity:0; } to { transform:scale(1); opacity:1; } }
        @keyframes fadeSlide { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink    { 0%,100%{opacity:0.25} 50%{opacity:0.8} }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"rgba(248,246,255,0.95)",
          backdropFilter:"blur(52px) saturate(220%)",
          WebkitBackdropFilter:"blur(52px) saturate(220%)",
          border:"1.5px solid rgba(255,255,255,0.96)",
          borderRadius:22,
          width:"100%", maxWidth:490,
          boxShadow:"0 36px 90px rgba(99,102,241,0.22), 0 8px 32px rgba(0,0,0,0.12), inset 0 1.5px 0 rgba(255,255,255,1)",
          fontFamily:"'Plus Jakarta Sans',sans-serif",
          overflow:"hidden",
        }}
      >
        {/* Progress bar */}
        <div style={{ height:3, background:"rgba(199,210,254,0.30)" }}>
          <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#6366F1,#8B5CF6)", transition:"width .45s ease", borderRadius:"0 2px 2px 0" }} />
        </div>

        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${current.bg}85,rgba(255,255,255,0.55))`, backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.82)", padding:"1.15rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:".75rem" }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"rgba(255,255,255,0.88)", backdropFilter:"blur(16px)", border:"1.5px solid rgba(255,255,255,0.96)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 16px rgba(0,0,0,0.08), 0 0 0 4px ${current.color}18` }}>
              <IconComponent size={18} color={current.color} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize:".63rem", fontWeight:800, color:current.color, textTransform:"uppercase", letterSpacing:".12em" }}>{current.subtitle} — {step+1}/{steps.length}</p>
              <p style={{ fontSize:"1.05rem", fontWeight:800, color:"#0A0A0A", letterSpacing:"-.02em" }}>{current.title}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.75)", backdropFilter:"blur(12px)", border:"1.5px solid rgba(255,255,255,0.92)", borderRadius:9, cursor:"pointer", color:"#6B7280", padding:".32rem .38rem", display:"flex", alignItems:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div key={step} style={{ padding:"1.25rem 1.5rem", animation:"fadeSlide .3s ease" }}>
          <p style={{ fontSize:".875rem", color:"#4B5563", lineHeight:1.75, marginBottom:"1.1rem" }}>{current.content}</p>
          <div style={{ background:"rgba(255,255,255,0.62)", backdropFilter:"blur(20px) saturate(160%)", WebkitBackdropFilter:"blur(20px) saturate(160%)", border:"1.5px solid rgba(255,255,255,0.93)", borderRadius:14, padding:"1.1rem", boxShadow:"0 4px 20px rgba(99,102,241,0.07), inset 0 1.5px 0 rgba(255,255,255,0.9)" }}>
            <current.Visual />
          </div>
        </div>

        {/* Step dots */}
        <div style={{ display:"flex", justifyContent:"center", gap:".35rem", paddingBottom:".1rem" }}>
          {steps.map((_, i) => (
            <button key={i} onClick={() => setStep(i)} style={{ width: i === step ? 24 : 6, height:6, borderRadius:3, background: i === step ? "linear-gradient(90deg,#6366F1,#8B5CF6)" : i < step ? "rgba(99,102,241,0.30)" : "rgba(209,213,219,0.55)", border:"none", cursor:"pointer", transition:"all .25s ease", padding:0 }} />
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding:".9rem 1.5rem 1.25rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0} style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:600, color: step === 0 ? "#D1D5DB" : "#6B7280", background: step === 0 ? "none" : "rgba(255,255,255,0.82)", backdropFilter:"blur(12px)", border: step === 0 ? "none" : "1.5px solid rgba(255,255,255,0.92)", padding: step === 0 ? 0 : ".46rem .9rem", borderRadius:9, cursor: step === 0 ? "default" : "pointer", fontFamily:"inherit", boxShadow: step === 0 ? "none" : "0 2px 8px rgba(0,0,0,0.06)" }}>
            <ArrowLeft size={13} strokeWidth={2} /> Précédent
          </button>

          {isLast ? (
            <button onClick={onClose} style={{ display:"flex", alignItems:"center", gap:".5rem", fontSize:".9rem", fontWeight:800, background:"linear-gradient(135deg,#059669,#10B981)", border:"none", color:"#fff", padding:".62rem 1.7rem", borderRadius:11, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 6px 20px rgba(5,150,105,0.40)" }}>
              <CheckCircle2 size={15} strokeWidth={2} /> C&apos;est parti !
            </button>
          ) : (
            <button onClick={() => setStep(s => s + 1)} style={{ display:"flex", alignItems:"center", gap:".5rem", fontSize:".9rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", border:"none", color:"#fff", padding:".62rem 1.7rem", borderRadius:11, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 6px 20px rgba(99,102,241,0.40)" }}>
              Suivant <ArrowRight size={13} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
