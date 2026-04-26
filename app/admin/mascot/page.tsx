"use client";
import { useState } from "react";

/**
 * Mascotte Loopflo — première version, accessible via /admin/mascot
 *
 * Personnage : "Loopy"
 *  - Un blob rond violet/indigo, mignon et expressif
 *  - Antenne en forme de loop avec checkmark
 *  - Yeux ronds avec étincelles de connexion
 *  - 6 poses pour différents états (par défaut, content, fier, surpris, fatigué, en cours)
 *
 * 100% SVG, animé en CSS, scalable à n'importe quelle taille.
 * À terme : exporter PNG/WebP pour les emojis Discord/Slack, le marketing, etc.
 */

type Mood = "default" | "happy" | "proud" | "surprised" | "tired" | "working";

const MOODS: { id: Mood; label: string; emoji: string; desc: string }[] = [
  { id: "default",   label: "Hello",     emoji: "👋", desc: "Pose par défaut, regard amical" },
  { id: "happy",     label: "Workflow OK", emoji: "🎉", desc: "Quand un workflow s'exécute avec succès" },
  { id: "proud",     label: "Fier",      emoji: "✨", desc: "Quand tu termines un workflow complexe" },
  { id: "surprised", label: "Oh !",      emoji: "❗", desc: "Erreur ou nouveau message inattendu" },
  { id: "tired",     label: "Sieste",    emoji: "😴", desc: "Quand l'app est en mode maintenance" },
  { id: "working",   label: "En cours",  emoji: "⚙️", desc: "Pendant qu'un workflow tourne" },
];

export default function MascotPage() {
  const [mood, setMood] = useState<Mood>("default");
  const [size, setSize] = useState(280);
  const [bg, setBg] = useState<"light" | "dark" | "gradient">("light");

  const bgStyles = {
    light:    { background: "linear-gradient(135deg,#FAFAFC 0%,#F5F3FF 100%)", text: "#0A0A0A" },
    dark:     { background: "#0A0816", text: "#FFFFFF" },
    gradient: { background: "linear-gradient(135deg,#6366F1 0%,#8B5CF6 50%,#EC4899 100%)", text: "#FFFFFF" },
  }[bg];

  return (
    <div style={{
      minHeight: "100vh",
      background: bgStyles.background,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      color: bgStyles.text,
      padding: "3rem 2rem",
    }}>
      {/* Header */}
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: ".5rem" }}>
          <a href="/admin" style={{ fontSize: ".85rem", color: bg === "light" ? "#6B7280" : "rgba(255,255,255,0.6)", textDecoration: "none" }}>← Admin</a>
          <span style={{
            fontSize: ".65rem", fontWeight: 800,
            color: "#A78BFA", background: "rgba(167,139,250,0.18)",
            border: "1px solid rgba(167,139,250,0.4)",
            padding: ".25rem .65rem", borderRadius: 100,
            letterSpacing: ".1em", textTransform: "uppercase",
          }}>v0.1 — Brouillon</span>
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 .35rem" }}>
          Loopy — la mascotte Loopflo
        </h1>
        <p style={{ fontSize: "1rem", color: bg === "light" ? "#6B7280" : "rgba(255,255,255,0.65)", margin: "0 0 2.5rem", maxWidth: 680 }}>
          Première itération du personnage. Pensé pour être rond, expressif, mignon — utilisable en emojis,
          stickers, écrans de chargement et illustrations marketing.
        </p>

        {/* Showcase principale */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "2rem",
          marginBottom: "3rem",
        }}>
          {/* Stage */}
          <div style={{
            background: bg === "light" ? "#FFFFFF" : bg === "dark" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)",
            border: `1px solid ${bg === "light" ? "#E5E7EB" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 24,
            minHeight: 480,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
            backdropFilter: bg === "gradient" ? "blur(20px)" : "none",
          }}>
            {/* Ground shadow */}
            <div style={{
              position: "absolute",
              bottom: "8%",
              width: size * 0.55,
              height: 12,
              background: "rgba(99,102,241,0.18)",
              borderRadius: "50%",
              filter: "blur(8px)",
              animation: "shadow-bob 3s ease-in-out infinite",
            }} />

            {/* Mascotte */}
            <Loopy mood={mood} size={size} />
          </div>

          {/* Panneau de contrôle */}
          <div>
            {/* Humeurs */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: ".7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: bg === "light" ? "#6B7280" : "rgba(255,255,255,0.5)", margin: "0 0 .75rem" }}>
                Humeur
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".4rem" }}>
                {MOODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    title={m.desc}
                    style={{
                      padding: ".6rem .65rem",
                      fontSize: ".75rem", fontWeight: 600,
                      background: mood === m.id
                        ? "linear-gradient(135deg,#6366F1,#8B5CF6)"
                        : bg === "light" ? "#fff" : "rgba(255,255,255,0.05)",
                      color: mood === m.id ? "#fff" : bg === "light" ? "#374151" : "rgba(255,255,255,0.8)",
                      border: `1px solid ${mood === m.id ? "transparent" : bg === "light" ? "#E5E7EB" : "rgba(255,255,255,0.12)"}`,
                      borderRadius: 10, cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex", alignItems: "center", gap: ".4rem",
                      textAlign: "left",
                    }}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Taille */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: ".7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: bg === "light" ? "#6B7280" : "rgba(255,255,255,0.5)", margin: "0 0 .5rem" }}>
                Taille — {size}px
              </h3>
              <input
                type="range"
                min={120}
                max={480}
                step={20}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#6366F1" }}
              />
            </div>

            {/* Fond */}
            <div>
              <h3 style={{ fontSize: ".7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: bg === "light" ? "#6B7280" : "rgba(255,255,255,0.5)", margin: "0 0 .5rem" }}>
                Fond
              </h3>
              <div style={{ display: "flex", gap: ".4rem" }}>
                {(["light", "dark", "gradient"] as const).map(b => (
                  <button
                    key={b}
                    onClick={() => setBg(b)}
                    style={{
                      flex: 1,
                      padding: ".5rem",
                      fontSize: ".75rem", fontWeight: 600,
                      background: bg === b
                        ? "linear-gradient(135deg,#6366F1,#8B5CF6)"
                        : bg === "light" ? "#fff" : "rgba(255,255,255,0.05)",
                      color: bg === b ? "#fff" : bg === "light" ? "#374151" : "rgba(255,255,255,0.8)",
                      border: `1px solid ${bg === b ? "transparent" : bg === "light" ? "#E5E7EB" : "rgba(255,255,255,0.12)"}`,
                      borderRadius: 10, cursor: "pointer",
                      fontFamily: "inherit", textTransform: "capitalize",
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Galerie de toutes les humeurs */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1rem" }}>
            Toutes les expressions
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
            gap: "1rem",
          }}>
            {MOODS.map(m => (
              <div
                key={m.id}
                onClick={() => setMood(m.id)}
                style={{
                  background: bg === "light" ? "#FFFFFF" : bg === "dark" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)",
                  border: `1px solid ${mood === m.id ? "#818CF8" : bg === "light" ? "#E5E7EB" : "rgba(255,255,255,0.12)"}`,
                  borderRadius: 16,
                  padding: "1.25rem",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: ".5rem",
                  cursor: "pointer",
                  transition: "transform .18s, border-color .18s",
                  transform: mood === m.id ? "scale(1.03)" : "scale(1)",
                }}
              >
                <Loopy mood={m.id} size={120} />
                <p style={{ margin: ".5rem 0 0", fontSize: ".85rem", fontWeight: 700 }}>{m.label}</p>
                <p style={{ margin: 0, fontSize: ".7rem", color: bg === "light" ? "#9CA3AF" : "rgba(255,255,255,0.5)", textAlign: "center" }}>
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Notes design */}
        <div style={{
          background: bg === "light" ? "#FFFFFF" : "rgba(255,255,255,0.05)",
          border: `1px solid ${bg === "light" ? "#E5E7EB" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 16,
          padding: "1.5rem",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 .75rem" }}>Notes design</h3>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: ".85rem", lineHeight: 1.8, color: bg === "light" ? "#374151" : "rgba(255,255,255,0.75)" }}>
            <li>• <strong>Forme</strong> — corps en goutte arrondie, plus large que haut, ressemble à une bulle de chat ou un blob amical</li>
            <li>• <strong>Antenne loop</strong> — rappel direct du logo (cercle + checkmark), c&apos;est l&apos;élément qui rend Loopy reconnaissable</li>
            <li>• <strong>Yeux</strong> — ronds, bien noirs, avec une étoile/spark de connexion (l&apos;automatisation = lien entre les choses)</li>
            <li>• <strong>Couleurs</strong> — gradient indigo→violet du logo, jamais d&apos;autre couleur sur le corps</li>
            <li>• <strong>À éviter</strong> — bouche réaliste, dents, doigts détaillés. Garder simple et plat (style flat illustration)</li>
            <li>• <strong>Inspiration</strong> — Wumpus de Discord pour la simplicité, blobs Slack pour les variations, Duolingo Owl pour la personnalité</li>
          </ul>
        </div>

        <p style={{ fontSize: ".8rem", color: bg === "light" ? "#9CA3AF" : "rgba(255,255,255,0.5)", marginTop: "2rem", textAlign: "center" }}>
          Pour exporter en PNG transparent : clic-droit sur le SVG → enregistrer, ou utiliser Figma pour rasteriser.
        </p>
      </div>

      <style>{`
        @keyframes shadow-bob {
          0%, 100% { transform: scaleX(1); opacity: 0.18; }
          50%      { transform: scaleX(0.85); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}

// ── COMPOSANT MASCOTTE ───────────────────────────────────────────────────────

function Loopy({ mood, size = 240 }: { mood: Mood; size?: number }) {
  // Couleurs de base
  const bodyGradId = `loopy-body-${mood}`;
  const eyeGradId = `loopy-eye-${mood}`;

  // Yeux selon humeur
  const eyes = (() => {
    switch (mood) {
      case "happy":     return { type: "smile-eyes", l: "M40,55 Q50,42 60,55", r: "M90,55 Q100,42 110,55" };
      case "proud":     return { type: "closed",    l: "M40,52 L60,52",       r: "M90,52 L110,52" };
      case "surprised": return { type: "circle-big" };
      case "tired":     return { type: "tired",     l: "M38,55 L62,55",       r: "M88,55 L112,55" };
      case "working":   return { type: "circle" };
      default:          return { type: "circle" };
    }
  })();

  // Bouche selon humeur
  const mouth = (() => {
    switch (mood) {
      case "happy":     return <path d="M55,90 Q75,108 95,90" stroke="#3D2A6E" strokeWidth="5" strokeLinecap="round" fill="none" />;
      case "proud":     return <path d="M58,92 Q75,82 92,92" stroke="#3D2A6E" strokeWidth="5" strokeLinecap="round" fill="none" />;
      case "surprised": return <ellipse cx="75" cy="92" rx="6" ry="9" fill="#3D2A6E" />;
      case "tired":     return <path d="M62,93 Q75,98 88,93" stroke="#3D2A6E" strokeWidth="4" strokeLinecap="round" fill="none" />;
      case "working":   return <path d="M58,92 Q75,98 92,92" stroke="#3D2A6E" strokeWidth="5" strokeLinecap="round" fill="none" />;
      default:          return <path d="M62,90 Q75,98 88,90" stroke="#3D2A6E" strokeWidth="5" strokeLinecap="round" fill="none" />;
    }
  })();

  // Joues roses pour happy/proud
  const blush = (mood === "happy" || mood === "proud") && (
    <>
      <ellipse cx="32" cy="80" rx="9" ry="5" fill="#F472B6" opacity="0.55" />
      <ellipse cx="118" cy="80" rx="9" ry="5" fill="#F472B6" opacity="0.55" />
    </>
  );

  // Z's au-dessus pour la sieste
  const sleepZs = mood === "tired" && (
    <g style={{ animation: "loopy-zfloat 2.5s ease-in-out infinite" }}>
      <text x="125" y="18" fontSize="14" fontWeight="800" fill="#A78BFA" fontFamily="system-ui, sans-serif">z</text>
      <text x="135" y="32" fontSize="18" fontWeight="800" fill="#A78BFA" fontFamily="system-ui, sans-serif">Z</text>
    </g>
  );

  // Roue/engrenage tournante pour working
  const gearWorking = mood === "working" && (
    <g transform="translate(115, 25)" style={{ animation: "loopy-spin 2s linear infinite", transformOrigin: "115px 25px" } as React.CSSProperties}>
      <circle r="10" fill="#FBBF24" />
      <circle r="4" fill="#fff" />
      {[0, 60, 120, 180, 240, 300].map(deg => {
        const rad = (deg * Math.PI) / 180;
        return (
          <rect
            key={deg}
            x={-2.5}
            y={-13}
            width={5}
            height={5}
            fill="#FBBF24"
            transform={`rotate(${deg})`}
          />
        );
      })}
    </g>
  );

  // Animation idle (bobble) ou plus rapide pour happy
  const idleAnim = mood === "happy" ? "loopy-jump 0.9s ease-in-out infinite"
                  : mood === "surprised" ? "loopy-shake 0.5s ease-in-out infinite"
                  : mood === "tired" ? "loopy-breathe 4s ease-in-out infinite"
                  : "loopy-idle 3s ease-in-out infinite";

  return (
    <svg
      width={size}
      height={size * 1.1}
      viewBox="0 0 150 165"
      style={{ animation: idleAnim }}
    >
      <defs>
        <linearGradient id={bodyGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <radialGradient id={eyeGradId} cx="35%" cy="30%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Antenne loop (l'élément qui rappelle le logo) */}
      <g style={{ animation: mood === "working" ? "none" : "loopy-antenna 4s ease-in-out infinite", transformOrigin: "75px 25px" } as React.CSSProperties}>
        <line x1="75" y1="35" x2="75" y2="20" stroke="url(#antenna-grad)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="75" cy="14" r="9" fill="none" stroke="#6366F1" strokeWidth="3" />
        {/* Petits points autour */}
        <circle cx="75" cy="5" r="1.6" fill="#6366F1" />
        <circle cx="83" cy="14" r="1.6" fill="#6366F1" />
        <circle cx="75" cy="23" r="1.6" fill="#6366F1" />
        <circle cx="67" cy="14" r="1.6" fill="#6366F1" />
        {/* Mini check */}
        <path d="M71,14 L74,17 L80,11" stroke="#6366F1" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Corps blob */}
      <path
        d="M75,40 C30,40 22,75 22,100 C22,135 45,150 75,150 C105,150 128,135 128,100 C128,75 120,40 75,40 Z"
        fill={`url(#${bodyGradId})`}
      />

      {/* Reflet brillant en haut gauche */}
      <ellipse cx="50" cy="60" rx="18" ry="12" fill="rgba(255,255,255,0.25)" transform="rotate(-25 50 60)" />

      {blush}

      {/* Yeux */}
      {eyes.type === "circle" && (
        <>
          <circle cx="50" cy="78" r="11" fill="#1B1136" />
          <circle cx="100" cy="78" r="11" fill="#1B1136" />
          <circle cx="54" cy="74" r="3.5" fill="#fff" />
          <circle cx="104" cy="74" r="3.5" fill="#fff" />
        </>
      )}
      {eyes.type === "circle-big" && (
        <>
          <circle cx="50" cy="76" r="14" fill="#fff" stroke="#1B1136" strokeWidth="2" />
          <circle cx="100" cy="76" r="14" fill="#fff" stroke="#1B1136" strokeWidth="2" />
          <circle cx="50" cy="76" r="6" fill="#1B1136" />
          <circle cx="100" cy="76" r="6" fill="#1B1136" />
        </>
      )}
      {eyes.type === "smile-eyes" && (
        <>
          <path d={eyes.l} stroke="#1B1136" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d={eyes.r} stroke="#1B1136" strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      )}
      {eyes.type === "closed" && (
        <>
          <path d={eyes.l} stroke="#1B1136" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d={eyes.r} stroke="#1B1136" strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      )}
      {eyes.type === "tired" && (
        <>
          <path d={eyes.l} stroke="#1B1136" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d={eyes.r} stroke="#1B1136" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* Bouche */}
      {mouth}

      {/* Bras flottants */}
      <ellipse cx="22" cy="105" rx="9" ry="14" fill={`url(#${bodyGradId})`} />
      <ellipse cx="128" cy="105" rx="9" ry="14" fill={`url(#${bodyGradId})`} />

      {/* Petits pieds */}
      <ellipse cx="55" cy="151" rx="11" ry="7" fill="#5A3FD8" />
      <ellipse cx="95" cy="151" rx="11" ry="7" fill="#5A3FD8" />

      {sleepZs}
      {gearWorking}

      <defs>
        <linearGradient id="antenna-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes loopy-idle {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes loopy-jump {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          40%      { transform: translateY(-14px) scale(0.97, 1.03); }
          60%      { transform: translateY(-10px) scale(1, 1); }
          80%      { transform: translateY(0) scale(1.03, 0.97); }
        }
        @keyframes loopy-shake {
          0%, 100% { transform: rotate(0deg); }
          25%      { transform: rotate(-3deg); }
          75%      { transform: rotate(3deg); }
        }
        @keyframes loopy-breathe {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          50%      { transform: translateY(2px) scale(1.02, 0.98); }
        }
        @keyframes loopy-antenna {
          0%, 100% { transform: rotate(0deg); }
          25%      { transform: rotate(-6deg); }
          75%      { transform: rotate(6deg); }
        }
        @keyframes loopy-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes loopy-zfloat {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          50%      { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </svg>
  );
}
