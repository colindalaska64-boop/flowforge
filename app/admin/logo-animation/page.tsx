"use client";
import { useState, useEffect } from "react";

/**
 * Page admin — animation plein écran du logo Loopflo
 * Conçue pour être enregistrée pour les réseaux sociaux (capture vidéo de l'écran).
 *
 * 4 thèmes (clair, sombre, gradient, néon) + 4 vitesses + boucle infinie.
 * Touche F11 pour passer en plein écran avant de capturer.
 */

type Theme = "light" | "dark" | "gradient" | "neon";
type Speed = "slow" | "normal" | "fast" | "very-fast";

const THEMES: Record<Theme, { bg: string; primary: string; secondary: string; text: string; textAccent: string }> = {
  light:    { bg: "linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 100%)", primary: "#6366F1", secondary: "#8B5CF6", text: "#0A0A0A", textAccent: "#6366F1" },
  dark:     { bg: "linear-gradient(135deg,#0F0A28 0%,#1E1B4B 100%)", primary: "#818CF8", secondary: "#A78BFA", text: "#FFFFFF", textAccent: "#A78BFA" },
  gradient: { bg: "linear-gradient(135deg,#6366F1 0%,#8B5CF6 50%,#EC4899 100%)", primary: "#FFFFFF", secondary: "#FFFFFF", text: "#FFFFFF", textAccent: "#FFFFFF" },
  neon:     { bg: "#000000", primary: "#A78BFA", secondary: "#22D3EE", text: "#FFFFFF", textAccent: "#A78BFA" },
};

const SPEED_MAP: Record<Speed, number> = {
  "slow": 5,
  "normal": 3.5,
  "fast": 2.2,
  "very-fast": 1.4,
};

export default function LogoAnimationPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [speed, setSpeed] = useState<Speed>("normal");
  const [hideUI, setHideUI] = useState(false);
  const [tick, setTick] = useState(0);

  const t = THEMES[theme];
  const duration = SPEED_MAP[speed];

  // Boucle l'animation en remontant la clé (force le redémarrage CSS)
  useEffect(() => {
    const id = setInterval(() => setTick(v => v + 1), duration * 1000);
    return () => clearInterval(id);
  }, [duration]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: t.bg,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        overflow: "hidden",
        zIndex: 9999,
        cursor: hideUI ? "none" : "default",
      }}
      onClick={() => hideUI && setHideUI(false)}
    >
      {/* Particules de fond (effet ambiance) */}
      <div className="bg-particles">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              background: t.primary,
            }}
          />
        ))}
      </div>

      {/* LOGO ANIMÉ */}
      <div
        key={tick}
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "2rem",
        }}
      >
        {/* Square rounded avec le logo SVG */}
        <div
          className="logo-square"
          style={{
            width: 200, height: 200, borderRadius: 44,
            background: theme === "neon"
              ? `radial-gradient(circle at 30% 30%, ${t.primary}, ${t.secondary})`
              : theme === "gradient"
              ? "rgba(255,255,255,0.18)"
              : `linear-gradient(135deg,${t.primary},${t.secondary})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
            backdropFilter: theme === "gradient" ? "blur(20px)" : "none",
            border: theme === "gradient" ? "1px solid rgba(255,255,255,0.3)" : "none",
            boxShadow: theme === "neon"
              ? `0 0 80px ${t.primary}88, 0 0 160px ${t.primary}44`
              : "0 30px 80px rgba(99,102,241,0.45), 0 0 0 1px rgba(255,255,255,0.1)",
          }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ overflow: "visible" }}>
            {/* Cercle principal */}
            <circle
              cx="60" cy="60" r="46"
              fill="none"
              stroke="#fff"
              strokeWidth="6"
              strokeLinecap="round"
              className="loop-circle"
              strokeDasharray="289"
              strokeDashoffset="289"
            />
            {/* Petits points autour du cercle */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const cx = 60 + 46 * Math.cos(rad);
              const cy = 60 + 46 * Math.sin(rad);
              return (
                <circle
                  key={i}
                  cx={cx} cy={cy} r="5"
                  fill="#fff"
                  className="loop-dot"
                  style={{ animationDelay: `${0.5 + i * 0.08}s` }}
                />
              );
            })}
            {/* Checkmark */}
            <path
              d="M42 62 L55 75 L80 48"
              fill="none"
              stroke="#fff"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="loop-check"
              strokeDasharray="60"
              strokeDashoffset="60"
            />
          </svg>
        </div>

        {/* Wordmark Loopflo */}
        <h1
          className="wordmark"
          style={{
            fontSize: "5rem", fontWeight: 900, letterSpacing: "-0.05em",
            margin: 0, opacity: 0,
          }}
        >
          <span style={{ color: t.text }}>Loop</span>
          <span style={{ color: t.textAccent }}>flo</span>
        </h1>

        {/* Tagline */}
        <p
          className="tagline"
          style={{
            fontSize: "1.1rem", fontWeight: 500,
            color: t.text, opacity: 0,
            letterSpacing: ".02em",
          }}
        >
          L&apos;automatisation, sans coder.
        </p>
      </div>

      {/* PANNEAU DE CONTRÔLE */}
      {!hideUI && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem", left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 18,
            padding: "1rem 1.25rem",
            display: "flex", gap: "1.25rem", alignItems: "center",
            zIndex: 10000,
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          {/* Thèmes */}
          <div style={{ display: "flex", gap: ".4rem", alignItems: "center" }}>
            <span style={{ fontSize: ".7rem", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginRight: ".25rem" }}>Thème</span>
            {(["light", "dark", "gradient", "neon"] as Theme[]).map(th => (
              <button
                key={th}
                onClick={() => setTheme(th)}
                style={{
                  padding: ".4rem .75rem",
                  fontSize: ".75rem", fontWeight: 600,
                  background: theme === th ? "rgba(129,140,248,0.3)" : "transparent",
                  color: theme === th ? "#fff" : "rgba(255,255,255,0.6)",
                  border: theme === th ? "1px solid #818CF8" : "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10, cursor: "pointer",
                  fontFamily: "inherit", textTransform: "capitalize",
                }}
              >
                {th}
              </button>
            ))}
          </div>

          {/* Séparateur */}
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />

          {/* Vitesse */}
          <div style={{ display: "flex", gap: ".4rem", alignItems: "center" }}>
            <span style={{ fontSize: ".7rem", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginRight: ".25rem" }}>Vitesse</span>
            {(["slow", "normal", "fast", "very-fast"] as Speed[]).map(sp => (
              <button
                key={sp}
                onClick={() => setSpeed(sp)}
                style={{
                  padding: ".4rem .75rem",
                  fontSize: ".75rem", fontWeight: 600,
                  background: speed === sp ? "rgba(129,140,248,0.3)" : "transparent",
                  color: speed === sp ? "#fff" : "rgba(255,255,255,0.6)",
                  border: speed === sp ? "1px solid #818CF8" : "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {sp === "very-fast" ? "très rapide" : sp === "slow" ? "lente" : sp === "fast" ? "rapide" : "normale"}
              </button>
            ))}
          </div>

          {/* Séparateur */}
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />

          {/* Cacher UI pour la capture */}
          <button
            onClick={() => setHideUI(true)}
            style={{
              padding: ".5rem 1rem",
              fontSize: ".75rem", fontWeight: 700,
              background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
              color: "#fff", border: "none",
              borderRadius: 10, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Plein écran (clic pour ressortir)
          </button>

          <a
            href="/admin"
            style={{
              padding: ".5rem .85rem",
              fontSize: ".75rem", fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10, textDecoration: "none",
              fontFamily: "inherit",
            }}
          >
            ← Admin
          </a>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes squarePop {
          0%   { transform: scale(0) rotate(-180deg); opacity: 0; }
          60%  { transform: scale(1.08) rotate(0deg); opacity: 1; }
          80%  { transform: scale(0.96); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes drawCircle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }
        @keyframes dotPop {
          0%   { transform: scale(0); opacity: 0; }
          50%  { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes wordReveal {
          0%   { opacity: 0; transform: translateY(20px); letter-spacing: 0.1em; }
          100% { opacity: 1; transform: translateY(0); letter-spacing: -0.05em; }
        }
        @keyframes taglineFade {
          0%, 50% { opacity: 0; }
          100%    { opacity: 0.7; }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translate(0,0); opacity: 0; }
          50%      { opacity: 0.5; }
          100%     { transform: translate(40px,-80px); opacity: 0; }
        }

        .logo-square {
          animation: squarePop ${duration * 0.3}s cubic-bezier(.34,1.56,.64,1) backwards;
        }
        .loop-circle {
          animation: drawCircle ${duration * 0.35}s cubic-bezier(.65,0,.35,1) ${duration * 0.15}s forwards;
          transform-origin: 60px 60px;
          transform: rotate(-90deg);
        }
        .loop-dot {
          opacity: 0;
          animation: dotPop ${duration * 0.15}s cubic-bezier(.34,1.56,.64,1) forwards;
          transform-origin: center;
        }
        .loop-check {
          animation: drawCheck ${duration * 0.25}s cubic-bezier(.65,0,.35,1) ${duration * 0.55}s forwards;
        }
        .wordmark {
          animation: wordReveal ${duration * 0.4}s cubic-bezier(.65,0,.35,1) ${duration * 0.5}s forwards;
        }
        .tagline {
          animation: taglineFade ${duration * 0.5}s ease-out ${duration * 0.7}s forwards;
        }
        .bg-particles {
          position: absolute; inset: 0; pointer-events: none;
        }
        .particle {
          position: absolute;
          width: 4px; height: 4px;
          border-radius: 50%;
          opacity: 0;
          animation: floatParticle 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
