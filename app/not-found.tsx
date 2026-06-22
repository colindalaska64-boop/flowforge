"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const INK = "#0A0A0A";

export default function NotFound() {
  const [konami, setKonami] = useState(false);
  const [bookRain, setBookRain] = useState(false);

  // Seul easter egg conservé — code Konami : ↑ ↑ ↓ ↓ ← → ← → B A
  useEffect(() => {
    const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let pos = 0;
    function onKey(e: KeyboardEvent) {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = k === seq[pos] ? pos + 1 : (k === seq[0] ? 1 : 0);
      if (pos === seq.length) {
        pos = 0;
        setKonami(true);
        setBookRain(true);
        setTimeout(() => setBookRain(false), 6000);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Herbes folles qui roulent (en gris, monochrome)
  const weeds = useMemo(
    () => Array.from({ length: 4 }, (_, i) => ({
      id: i,
      bottom: 16 + Math.round(Math.random() * 90),
      duration: 8 + Math.round(Math.random() * 9),
      delay: Math.round(Math.random() * 12),
      size: 20 + Math.round(Math.random() * 24),
    })),
    []
  );

  // Livres pour la pluie Konami
  const rainBooks = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: Math.round(Math.random() * 100),
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      filled: i % 2 === 0,
      rot: Math.round(Math.random() * 360),
    })),
    []
  );

  // Étagère stylisée : livres en line-art, hauteurs variées, quelques-uns pleins
  const shelves = useMemo(
    () => Array.from({ length: 4 }, (_, si) =>
      Array.from({ length: 14 }, (_, bi) => ({
        w: 9 + ((bi * 5 + si * 3) % 9),
        h: 30 + ((bi * 11 + si * 7) % 20),
        filled: (bi + si) % 5 === 0,
        tilted: (bi + si) % 7 === 3,
      }))
    ),
    []
  );

  return (
    <main style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "2rem 1.25rem", position: "relative", overflow: "hidden",
      fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#FFFFFF", color: INK,
    }}>
      <style>{`
        @keyframes ff-roll { 0% { transform: translateX(-12vw) rotate(0deg); opacity: 0; } 8% { opacity: .5; } 92% { opacity: .5; } 100% { transform: translateX(112vw) rotate(900deg); opacity: 0; } }
        @keyframes ff-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes ff-glass { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
        @keyframes ff-fall { 0% { transform: translateY(-20vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 1; } }
        @keyframes ff-wobble { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-2deg); } 75% { transform: rotate(2deg); } }
        @keyframes ff-draw { to { stroke-dashoffset: 0; } }
        .ff-weed { position: fixed; left: 0; z-index: 1; pointer-events: none; color: #C7CBD1; will-change: transform; }
        .ff-glass { transform-origin: 132px 150px; animation: ff-glass 2.6s ease-in-out infinite; }
        .ff-shelf.wobble { animation: ff-wobble 1.2s ease-in-out infinite; transform-origin: center bottom; }
        .ff-link { transition: transform .15s ease, background .15s ease, color .15s ease; }
        .ff-link:hover { transform: translateY(-2px); }
        @media (prefers-reduced-motion: reduce) { .ff-weed, .ff-glass, .ff-char { animation: none !important; } }
      `}</style>

      {/* Herbes folles */}
      {weeds.map(w => (
        <svg key={w.id} className="ff-weed" width={w.size} height={w.size} viewBox="0 0 50 50"
          style={{ bottom: w.bottom, animation: `ff-roll ${w.duration}s linear ${w.delay}s infinite` }} aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="25" cy="25" r="18" />
            <path d="M25 7 L25 43 M7 25 L43 25 M12 12 L38 38 M38 12 L12 38" />
            <path d="M14 18 Q25 25 36 16 M14 34 Q25 25 37 33" />
          </g>
        </svg>
      ))}

      {/* Pluie de livres (Konami) — monochrome */}
      {bookRain && rainBooks.map(b => (
        <div key={b.id} aria-hidden="true" style={{
          position: "fixed", top: 0, left: `${b.left}%`, zIndex: 2, width: 14, height: 20, borderRadius: 1,
          background: b.filled ? INK : "#FFFFFF", border: `1.5px solid ${INK}`,
          transform: `rotate(${b.rot}deg)`, animation: `ff-fall ${b.duration}s linear ${b.delay}s forwards`,
        }} />
      ))}

      {/* 404 */}
      <h1 style={{ fontSize: "clamp(4.5rem, 18vw, 9rem)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.06em", margin: 0, color: INK, position: "relative", zIndex: 3 }}>404</h1>

      {/* Scène : bonhomme bâton + étagère */}
      <svg width="380" height="280" viewBox="0 0 380 280" style={{ maxWidth: "92vw", height: "auto", position: "relative", zIndex: 3, marginTop: ".5rem" }}
        role="img" aria-label="Un personnage cherche une page avec une loupe devant une étagère de livres">
        {/* sol */}
        <line x1="20" y1="258" x2="360" y2="258" stroke={INK} strokeWidth="2" strokeLinecap="round" />

        {/* Étagère stylisée */}
        <g className={`ff-shelf${konami ? " wobble" : ""}`}>
          <rect x="175" y="28" width="180" height="230" rx="4" fill="none" stroke={INK} strokeWidth="2.5" />
          {shelves.map((shelf, si) => {
            const baseY = 40 + si * 55;
            let x = 184;
            return (
              <g key={si}>
                {shelf.map((b, bi) => {
                  const bx = x; x += b.w + 3;
                  if (x > 346) return null;
                  const y = baseY + (46 - b.h);
                  return (
                    <rect key={bi} x={bx} y={y} width={b.w} height={b.h} rx={1}
                      fill={b.filled ? INK : "none"} stroke={INK} strokeWidth="1.6"
                      transform={b.tilted ? `rotate(8 ${bx} ${baseY + 46})` : undefined} />
                  );
                })}
                <line x1="177" y1={baseY + 48} x2="353" y2={baseY + 48} stroke={INK} strokeWidth="2" />
              </g>
            );
          })}
        </g>

        {/* Bonhomme bâton avec loupe */}
        <g className="ff-char" style={{ animation: "ff-bob 3s ease-in-out infinite" }}>
          {/* ombre */}
          <ellipse cx="86" cy="256" rx="34" ry="5" fill={INK} opacity=".12" />
          <g fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            {/* tête */}
            <circle cx="86" cy="120" r="20" fill="#FFFFFF" />
            {/* corps */}
            <line x1="86" y1="140" x2="86" y2="200" />
            {/* jambes */}
            <line x1="86" y1="200" x2="70" y2="252" />
            <line x1="86" y1="200" x2="102" y2="252" />
            {/* bras gauche */}
            <line x1="86" y1="158" x2="62" y2="178" />
            {/* bras droit tenant la loupe */}
            <line x1="86" y1="156" x2="116" y2="150" />
          </g>
          {/* visage minimal */}
          <circle cx="80" cy="118" r="2.2" fill={INK} />
          <circle cx="92" cy="118" r="2.2" fill={INK} />
          <path d="M80 127 Q86 131 92 127" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          {/* loupe */}
          <g className="ff-glass">
            <circle cx="132" cy="150" r="18" fill="#FFFFFF" stroke={INK} strokeWidth="3.5" />
            <line x1="120" y1="162" x2="108" y2="174" stroke={INK} strokeWidth="5" strokeLinecap="round" />
            <path d="M126 143 Q132 140 139 144" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity=".5" />
          </g>
        </g>
      </svg>

      {/* Titre minimal */}
      <h2 style={{ fontSize: "clamp(1.05rem, 4vw, 1.4rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: "1rem 0 0", textAlign: "center", zIndex: 3, position: "relative", color: INK }}>
        Page introuvable
      </h2>

      {/* Actions */}
      <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap", justifyContent: "center", marginTop: "1.4rem", zIndex: 3, position: "relative" }}>
        <Link href="/" className="ff-link" style={{
          padding: ".7rem 1.4rem", borderRadius: 10, fontSize: ".9rem", fontWeight: 700, textDecoration: "none",
          color: "#FFFFFF", background: INK, border: `1.5px solid ${INK}`,
        }}>Retour à l&apos;accueil</Link>
        <Link href="/dashboard" className="ff-link" style={{
          padding: ".7rem 1.4rem", borderRadius: 10, fontSize: ".9rem", fontWeight: 700, textDecoration: "none",
          color: INK, background: "#FFFFFF", border: `1.5px solid ${INK}`,
        }}>Mon tableau de bord</Link>
      </div>
    </main>
  );
}
