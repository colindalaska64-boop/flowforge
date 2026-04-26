"use client";
import { useState, useEffect, useRef } from "react";

/**
 * Page admin — animation plein écran du logo Loopflo
 * Pour capture vidéo / image réseaux sociaux.
 *
 * Réglages :
 *  - 4 thèmes (clair, sombre, gradient, néon)
 *  - 3 timings indépendants : vitesse anim, délai texte, pause finale
 *  - Tagline activable / désactivable
 *
 * Exports :
 *  - SVG (vectoriel, animations CSS embarquées)
 *  - PNG haute résolution (frame finale, 4x)
 *  - Vidéo WebM (capture d'écran via getDisplayMedia, qualité native)
 */

type Theme = "light" | "dark" | "gradient" | "neon";

const THEMES: Record<Theme, { bg: string; text: string; textAccent: string }> = {
  light:    { bg: "linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 100%)", text: "#0A0A0A", textAccent: "#6366F1" },
  dark:     { bg: "linear-gradient(135deg,#0F0A28 0%,#1E1B4B 100%)", text: "#FFFFFF", textAccent: "#A78BFA" },
  gradient: { bg: "linear-gradient(135deg,#6366F1 0%,#8B5CF6 50%,#EC4899 100%)", text: "#FFFFFF", textAccent: "#FFFFFF" },
  neon:     { bg: "#000000", text: "#FFFFFF", textAccent: "#A78BFA" },
};

export default function LogoAnimationPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [iconSpeed, setIconSpeed] = useState(1.5);     // durée animation icône
  const [textDelay, setTextDelay] = useState(0.4);     // délai texte après icône
  const [pauseAfter, setPauseAfter] = useState(1.5);   // pause finale avant restart
  const [showTagline, setShowTagline] = useState(true);
  const [hideUI, setHideUI] = useState(false);
  const [tick, setTick] = useState(0);
  const [recording, setRecording] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const t = THEMES[theme];
  // Total cycle = icon + text reveal (0.4s) + pause + 0.2s buffer
  const textRevealDuration = 0.5;
  const totalDuration = iconSpeed + textDelay + textRevealDuration + pauseAfter;

  // Boucle l'animation
  useEffect(() => {
    const id = setInterval(() => setTick(v => v + 1), totalDuration * 1000);
    return () => clearInterval(id);
  }, [totalDuration]);

  // ── Export SVG ──────────────────────────────────────────────────────────
  function downloadSvg() {
    const svg = buildExportSvg(theme, iconSpeed, textDelay, pauseAfter, showTagline, totalDuration);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `loopflo-logo-${theme}.svg`);
    URL.revokeObjectURL(url);
  }

  // ── Export PNG (frame finale, haute res via canvas) ─────────────────────
  async function downloadPng() {
    const SCALE = 4; // 4x = ~3000px de large
    const W = 1200 * SCALE, H = 800 * SCALE;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fond
    paintBg(ctx, W, H, theme);

    // Logo carré centré (taille relative)
    const sqSize = 360 * SCALE;
    const sqX = W / 2 - sqSize / 2;
    const sqY = H / 2 - sqSize / 2 - 120 * SCALE;
    paintLogoSquare(ctx, sqX, sqY, sqSize, theme);

    // Wordmark Loopflo
    ctx.font = `900 ${190 * SCALE}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const wmY = sqY + sqSize + 130 * SCALE;
    ctx.fillStyle = t.text;
    ctx.fillText("Loop", W / 2 - 80 * SCALE, wmY);
    ctx.fillStyle = t.textAccent;
    ctx.fillText("flo", W / 2 + 110 * SCALE, wmY);

    // Tagline
    if (showTagline) {
      ctx.font = `500 ${42 * SCALE}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.fillStyle = t.text;
      ctx.globalAlpha = 0.7;
      ctx.fillText("L'automatisation, sans coder.", W / 2, wmY + 130 * SCALE);
      ctx.globalAlpha = 1;
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `loopflo-logo-${theme}-${W}x${H}.png`);
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  // ── Enregistrement vidéo via getDisplayMedia ────────────────────────────
  async function recordVideo() {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 60 },
        audio: false,
      });
      // Petite pause pour cadrer
      setHideUI(true);
      setTick(v => v + 1); // restart anim
      await new Promise(r => setTimeout(r, 800));

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `loopflo-logo-${theme}.webm`);
        URL.revokeObjectURL(url);
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
      };

      setRecording(true);
      recorder.start();
      // Enregistre 2 cycles complets pour avoir une boucle propre
      const recordingTime = totalDuration * 2 * 1000 + 200;
      setTimeout(() => recorder.stop(), recordingTime);
    } catch {
      setRecording(false);
      // utilisateur a annulé la sélection
    }
  }

  return (
    <div
      ref={stageRef}
      style={{
        position: "fixed",
        inset: 0,
        background: t.bg,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        overflow: "hidden",
        zIndex: 9999,
        cursor: hideUI ? "none" : "default",
      }}
      onClick={() => hideUI && !recording && setHideUI(false)}
    >
      {/* Particules de fond */}
      <div className="bg-particles">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              background: theme === "neon" ? "#A78BFA" : "#6366F1",
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
        {/* Carré + logo : un seul SVG, content fait 50% du carré comme le vrai logo */}
        <div
          className="logo-square"
          style={{
            width: 280, height: 280, borderRadius: 62,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
            background: theme === "neon"
              ? "radial-gradient(circle at 30% 30%, #A78BFA, #4F46E5)"
              : theme === "gradient"
              ? "rgba(255,255,255,0.18)"
              : "linear-gradient(135deg,#6366F1,#8B5CF6)",
            backdropFilter: theme === "gradient" ? "blur(20px)" : "none",
            border: theme === "gradient" ? "1px solid rgba(255,255,255,0.3)" : "none",
            boxShadow: theme === "neon"
              ? "0 0 100px rgba(167,139,250,0.55), 0 0 200px rgba(99,102,241,0.3)"
              : "0 30px 80px rgba(99,102,241,0.45), 0 0 0 1px rgba(255,255,255,0.1)",
          }}
        >
          {/* SVG identique au vrai logo (viewBox 0 0 56 56), taille 280 → content occupe 50% */}
          <svg width="280" height="280" viewBox="0 0 56 56" fill="none" style={{ overflow: "visible" }}>
            {/* Arc supérieur plein */}
            <path
              d="M14 28 C14 20 20 14 28 14 C36 14 42 20 42 28"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              className="loop-arc-top"
            />
            {/* Arc inférieur pointillé */}
            <path
              d="M42 28 C42 36 36 42 28 42 C20 42 14 36 14 28"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="4 3"
              fill="none"
              className="loop-arc-bot"
            />
            <circle cx="14" cy="28" r="3.5" fill="#fff" className="loop-dot-left" />
            <circle cx="42" cy="28" r="3.5" fill="#A5B4FC" className="loop-dot-right" />
            <path
              d="M38 22 L42 28 L46 22"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              className="loop-arrow"
            />
          </svg>
        </div>

        {/* Wordmark */}
        <h1
          className="wordmark"
          style={{
            fontSize: "5.5rem", fontWeight: 900, letterSpacing: "-0.05em",
            margin: 0, opacity: 0,
          }}
        >
          <span style={{ color: t.text }}>Loop</span>
          <span style={{ color: t.textAccent }}>flo</span>
        </h1>

        {/* Tagline */}
        {showTagline && (
          <p
            className="tagline"
            style={{
              fontSize: "1.2rem", fontWeight: 500,
              color: t.text, opacity: 0,
              letterSpacing: ".02em",
            }}
          >
            L&apos;automatisation, sans coder.
          </p>
        )}
      </div>

      {/* PANNEAU DE CONTRÔLE */}
      {!hideUI && !recording && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem", left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 18,
            padding: "1rem 1.25rem",
            display: "flex", flexDirection: "column", gap: ".85rem",
            zIndex: 10000,
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            maxWidth: "92vw",
          }}
        >
          {/* Ligne 1 : thème + tagline + cacher UI */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <ControlGroup label="Thème">
              {(["light", "dark", "gradient", "neon"] as Theme[]).map(th => (
                <Btn key={th} active={theme === th} onClick={() => setTheme(th)}>{th}</Btn>
              ))}
            </ControlGroup>

            <Sep />

            <ControlGroup label="Tagline">
              <Btn active={showTagline} onClick={() => setShowTagline(true)}>Oui</Btn>
              <Btn active={!showTagline} onClick={() => setShowTagline(false)}>Non</Btn>
            </ControlGroup>

            <Sep />

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
              Plein écran
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

          {/* Ligne 2 : timings */}
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <Slider label="Vitesse anim" value={iconSpeed} onChange={setIconSpeed} min={0.6} max={4} step={0.1} unit="s" />
            <Slider label="Délai texte" value={textDelay} onChange={setTextDelay} min={0} max={2} step={0.1} unit="s" />
            <Slider label="Pause finale" value={pauseAfter} onChange={setPauseAfter} min={0.3} max={5} step={0.1} unit="s" />
            <span style={{ fontSize: ".7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
              cycle = {totalDuration.toFixed(1)}s
            </span>
          </div>

          {/* Ligne 3 : exports */}
          <div style={{ display: "flex", gap: ".55rem", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: ".75rem" }}>
            <span style={{ fontSize: ".7rem", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>Télécharger</span>
            <button onClick={downloadSvg} style={btnStyle("#10B981")}>SVG vectoriel</button>
            <button onClick={downloadPng} style={btnStyle("#F59E0B")}>PNG 4x (4800px)</button>
            <button onClick={recordVideo} style={btnStyle("#EC4899")} disabled={recording}>
              {recording ? "Enregistrement…" : "Vidéo WebM"}
            </button>
          </div>
        </div>
      )}

      {/* Indicateur d'enregistrement */}
      {recording && (
        <div style={{
          position: "fixed", top: "1.25rem", right: "1.25rem",
          background: "rgba(220,38,38,0.95)", color: "#fff",
          padding: ".55rem 1rem", borderRadius: 100,
          fontSize: ".8rem", fontWeight: 700,
          display: "flex", alignItems: "center", gap: ".5rem",
          zIndex: 10001,
          boxShadow: "0 10px 30px rgba(220,38,38,0.4)",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", animation: "rec-blink 1s infinite" }} />
          REC — capture en cours ({Math.round(totalDuration * 2)}s)
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
          from { stroke-dashoffset: 50; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes drawArrow {
          from { stroke-dashoffset: 20; }
          to   { stroke-dashoffset: 0; }
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
          0%   { opacity: 0; }
          100% { opacity: 0.7; }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translate(0,0); opacity: 0; }
          50%      { opacity: 0.5; }
          100%     { transform: translate(40px,-80px); opacity: 0; }
        }
        @keyframes rec-blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }

        .logo-square {
          animation: squarePop ${iconSpeed * 0.45}s cubic-bezier(.34,1.56,.64,1) backwards;
        }
        .loop-arc-top {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: drawCircle ${iconSpeed * 0.35}s cubic-bezier(.65,0,.35,1) ${iconSpeed * 0.18}s forwards;
        }
        .loop-arc-bot {
          stroke-dashoffset: 50;
          animation: drawCircle ${iconSpeed * 0.35}s cubic-bezier(.65,0,.35,1) ${iconSpeed * 0.42}s forwards;
        }
        .loop-dot-left {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: dotPop ${iconSpeed * 0.18}s cubic-bezier(.34,1.56,.64,1) ${iconSpeed * 0.32}s forwards;
        }
        .loop-dot-right {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: dotPop ${iconSpeed * 0.18}s cubic-bezier(.34,1.56,.64,1) ${iconSpeed * 0.6}s forwards;
        }
        .loop-arrow {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: drawArrow ${iconSpeed * 0.18}s cubic-bezier(.65,0,.35,1) ${iconSpeed * 0.7}s forwards;
        }
        .wordmark {
          animation: wordReveal ${textRevealDuration}s cubic-bezier(.65,0,.35,1) ${iconSpeed + textDelay}s forwards;
        }
        .tagline {
          animation: taglineFade ${textRevealDuration}s ease-out ${iconSpeed + textDelay + 0.2}s forwards;
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

// ── COMPOSANTS DU PANEL ─────────────────────────────────────────────────────

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: ".4rem", alignItems: "center" }}>
      <span style={{ fontSize: ".7rem", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginRight: ".25rem" }}>{label}</span>
      {children}
    </div>
  );
}

function Btn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: ".4rem .75rem",
        fontSize: ".75rem", fontWeight: 600,
        background: active ? "rgba(129,140,248,0.3)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.6)",
        border: active ? "1px solid #818CF8" : "1px solid rgba(255,255,255,0.15)",
        borderRadius: 10, cursor: "pointer",
        fontFamily: "inherit", textTransform: "capitalize",
      }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />;
}

function Slider({ label, value, onChange, min, max, step, unit }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".55rem" }}>
      <span style={{ fontSize: ".7rem", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", minWidth: 80 }}>
        {label}
      </span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: 120, accentColor: "#818CF8" }}
      />
      <span style={{ fontSize: ".75rem", color: "#fff", fontWeight: 600, minWidth: 36, textAlign: "right" }}>
        {value.toFixed(1)}{unit}
      </span>
    </div>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return {
    padding: ".5rem .85rem",
    fontSize: ".75rem", fontWeight: 700,
    background: `${color}22`,
    color,
    border: `1px solid ${color}66`,
    borderRadius: 10, cursor: "pointer",
    fontFamily: "inherit",
  };
}

// ── HELPERS EXPORT ──────────────────────────────────────────────────────────

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Construit un SVG export avec animations CSS embarquées.
 * Compatible avec le rendu animé dans les navigateurs et embedding social.
 */
function buildExportSvg(theme: Theme, iconSpeed: number, textDelay: number, pauseAfter: number, showTagline: boolean, totalDuration: number): string {
  const t = THEMES[theme];
  const textRevealDuration = 0.5;

  // Couleurs du carré selon thème
  const sqFill = theme === "neon"
    ? `url(#sqGradNeon)`
    : theme === "gradient"
    ? `url(#sqGradColor)`
    : `url(#sqGrad)`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      ${theme === "light" ? '<stop offset="0%" stop-color="#F5F3FF"/><stop offset="100%" stop-color="#EDE9FE"/>'
        : theme === "dark" ? '<stop offset="0%" stop-color="#0F0A28"/><stop offset="100%" stop-color="#1E1B4B"/>'
        : theme === "gradient" ? '<stop offset="0%" stop-color="#6366F1"/><stop offset="50%" stop-color="#8B5CF6"/><stop offset="100%" stop-color="#EC4899"/>'
        : '<stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="#000"/>'}
    </linearGradient>
    <linearGradient id="sqGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
    <radialGradient id="sqGradNeon" cx="30%" cy="30%">
      <stop offset="0%" stop-color="#A78BFA"/>
      <stop offset="100%" stop-color="#4F46E5"/>
    </radialGradient>
    <linearGradient id="sqGradColor" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.18)"/>
    </linearGradient>
    <style><![CDATA[
      @keyframes squarePop { 0%{transform:scale(0) rotate(-180deg);opacity:0} 60%{transform:scale(1.08) rotate(0);opacity:1} 80%{transform:scale(0.96)} 100%{transform:scale(1);opacity:1} }
      @keyframes drawCircle { from{stroke-dashoffset:50} to{stroke-dashoffset:0} }
      @keyframes drawArrow { from{stroke-dashoffset:20} to{stroke-dashoffset:0} }
      @keyframes dotPop { 0%{transform:scale(0);opacity:0} 50%{transform:scale(1.4);opacity:1} 100%{transform:scale(1);opacity:1} }
      @keyframes wordReveal { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
      @keyframes taglineFade { 0%{opacity:0} 100%{opacity:0.7} }
      .sq { transform-origin: 600px 320px; animation: squarePop ${iconSpeed * 0.45}s cubic-bezier(.34,1.56,.64,1) infinite; animation-duration: ${totalDuration}s; }
      .arc-top { stroke-dasharray: 50; stroke-dashoffset: 50; animation: drawCircle ${iconSpeed * 0.35}s cubic-bezier(.65,0,.35,1) ${iconSpeed * 0.18}s infinite; animation-duration: ${totalDuration}s; }
      .arc-bot { stroke-dasharray: 4 3; stroke-dashoffset: 50; animation: drawCircle ${iconSpeed * 0.35}s cubic-bezier(.65,0,.35,1) ${iconSpeed * 0.42}s infinite; animation-duration: ${totalDuration}s; }
      .dot-l, .dot-r { transform-origin: center; animation-duration: ${totalDuration}s; }
      .dot-l { opacity: 0; animation: dotPop ${iconSpeed * 0.18}s cubic-bezier(.34,1.56,.64,1) ${iconSpeed * 0.32}s infinite; }
      .dot-r { opacity: 0; animation: dotPop ${iconSpeed * 0.18}s cubic-bezier(.34,1.56,.64,1) ${iconSpeed * 0.6}s infinite; }
      .arrow { stroke-dasharray: 20; stroke-dashoffset: 20; animation: drawArrow ${iconSpeed * 0.18}s cubic-bezier(.65,0,.35,1) ${iconSpeed * 0.7}s infinite; animation-duration: ${totalDuration}s; }
      .word { opacity: 0; transform-origin: center; animation: wordReveal ${textRevealDuration}s cubic-bezier(.65,0,.35,1) ${iconSpeed + textDelay}s infinite; animation-duration: ${totalDuration}s; }
      .tag { opacity: 0; animation: taglineFade ${textRevealDuration}s ease-out ${iconSpeed + textDelay + 0.2}s infinite; animation-duration: ${totalDuration}s; }
    ]]></style>
  </defs>
  <rect width="1200" height="800" fill="url(#bgGrad)"/>
  <g transform="translate(440,180)">
    <g class="sq">
      <rect width="320" height="320" rx="70" fill="${sqFill}"/>
      <g transform="translate(0,0) scale(5.71)">
        <path class="arc-top" d="M14 28 C14 20 20 14 28 14 C36 14 42 20 42 28" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path class="arc-bot" d="M42 28 C42 36 36 42 28 42 C20 42 14 36 14 28" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>
        <circle class="dot-l" cx="14" cy="28" r="3.5" fill="#fff"/>
        <circle class="dot-r" cx="42" cy="28" r="3.5" fill="#A5B4FC"/>
        <path class="arrow" d="M38 22 L42 28 L46 22" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    </g>
  </g>
  <text class="word" x="600" y="640" text-anchor="middle" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-size="96" font-weight="900" letter-spacing="-3">
    <tspan fill="${t.text}">Loop</tspan><tspan fill="${t.textAccent}">flo</tspan>
  </text>
  ${showTagline ? `<text class="tag" x="600" y="700" text-anchor="middle" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-size="22" font-weight="500" fill="${t.text}">L'automatisation, sans coder.</text>` : ""}
</svg>`;
}

function paintBg(ctx: CanvasRenderingContext2D, W: number, H: number, theme: Theme) {
  if (theme === "neon") {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const grad = ctx.createLinearGradient(0, 0, W, H);
  if (theme === "light") {
    grad.addColorStop(0, "#F5F3FF");
    grad.addColorStop(1, "#EDE9FE");
  } else if (theme === "dark") {
    grad.addColorStop(0, "#0F0A28");
    grad.addColorStop(1, "#1E1B4B");
  } else {
    grad.addColorStop(0, "#6366F1");
    grad.addColorStop(0.5, "#8B5CF6");
    grad.addColorStop(1, "#EC4899");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function paintLogoSquare(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, theme: Theme) {
  // Carré arrondi
  const r = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + size, y, x + size, y + size, r);
  ctx.arcTo(x + size, y + size, x, y + size, r);
  ctx.arcTo(x, y + size, x, y, r);
  ctx.arcTo(x, y, x + size, y, r);
  ctx.closePath();

  // Remplissage selon thème
  if (theme === "neon") {
    const grad = ctx.createRadialGradient(x + size * 0.3, y + size * 0.3, 0, x + size / 2, y + size / 2, size);
    grad.addColorStop(0, "#A78BFA");
    grad.addColorStop(1, "#4F46E5");
    ctx.fillStyle = grad;
  } else {
    const grad = ctx.createLinearGradient(x, y, x + size, y + size);
    grad.addColorStop(0, "#6366F1");
    grad.addColorStop(1, "#8B5CF6");
    ctx.fillStyle = grad;
  }
  ctx.fill();

  // Logo content (scale 56→size)
  const s = size / 56;
  const ox = x;
  const oy = y;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 3 * s;

  // Arc supérieur plein
  ctx.beginPath();
  ctx.moveTo(ox + 14 * s, oy + 28 * s);
  ctx.bezierCurveTo(ox + 14 * s, oy + 20 * s, ox + 20 * s, oy + 14 * s, ox + 28 * s, oy + 14 * s);
  ctx.bezierCurveTo(ox + 36 * s, oy + 14 * s, ox + 42 * s, oy + 20 * s, ox + 42 * s, oy + 28 * s);
  ctx.stroke();

  // Arc inférieur pointillé
  ctx.setLineDash([4 * s, 3 * s]);
  ctx.beginPath();
  ctx.moveTo(ox + 42 * s, oy + 28 * s);
  ctx.bezierCurveTo(ox + 42 * s, oy + 36 * s, ox + 36 * s, oy + 42 * s, ox + 28 * s, oy + 42 * s);
  ctx.bezierCurveTo(ox + 20 * s, oy + 42 * s, ox + 14 * s, oy + 36 * s, ox + 14 * s, oy + 28 * s);
  ctx.stroke();
  ctx.setLineDash([]);

  // Dots
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(ox + 14 * s, oy + 28 * s, 3.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#A5B4FC";
  ctx.beginPath();
  ctx.arc(ox + 42 * s, oy + 28 * s, 3.5 * s, 0, Math.PI * 2);
  ctx.fill();

  // Flèche
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.moveTo(ox + 38 * s, oy + 22 * s);
  ctx.lineTo(ox + 42 * s, oy + 28 * s);
  ctx.lineTo(ox + 46 * s, oy + 22 * s);
  ctx.stroke();
}
