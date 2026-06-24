"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const BG = "#0A0A0A";
const LINE = "#9CA3AF";          // traits gris
const BOOK_SOLID = "#6B7280";    // livres pleins (gris moyen)
const BOOK_BRIGHT = "#E5E7EB";   // quelques livres clairs pour le contraste
const TEXT = "#E5E7EB";
const MUTED = "#9CA3AF";

const XS = [392, 411, 430, 449, 468, 487, 506, 525, 544];
const ROWS = [
  { baseline: 130, h: [44, 52, 38, 48, 42, 50, 36, 46, 40] },
  { baseline: 187, h: [50, 40, 46, 54, 38, 48, 42, 52, 44] },
  { baseline: 244, h: [42, 50, 44, 38, 52, 40, 48, 46, 36] },
  { baseline: 296, h: [48, 42, 52, 40, 46, 50, 38, 44, 54] },
];

function bookFill(r: number, i: number): string {
  if ((r === 0 && i === 1) || (r === 1 && i === 3) || (r === 3 && i === 2)) return BOOK_BRIGHT;
  if ((r + i) % 4 === 0) return BOOK_SOLID;
  return "none";
}

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

  const rainBooks = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: Math.round(Math.random() * 100),
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      bright: i % 3 === 0,
      rot: Math.round(Math.random() * 360),
    })),
    []
  );

  return (
    <main style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "2rem 1.25rem", position: "relative", overflow: "hidden",
      fontFamily: "'Plus Jakarta Sans', sans-serif", background: BG, color: TEXT,
    }}>
      <style>{`
        @keyframes ff-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes ff-glass { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
        @keyframes ff-fall { 0% { transform: translateY(-20vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 1; } }
        @keyframes ff-wobble { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-2deg); } 75% { transform: rotate(2deg); } }
        .ff-glass { transform-origin: 280px 160px; animation: ff-glass 2.6s ease-in-out infinite; }
        .ff-char { animation: ff-bob 3s ease-in-out infinite; }
        .ff-shelf.wobble { animation: ff-wobble 1.2s ease-in-out infinite; transform-origin: 480px 300px; }
        .ff-link { transition: transform .15s ease, opacity .15s ease; }
        .ff-link:hover { transform: translateY(-2px); }
        @media (prefers-reduced-motion: reduce) { .ff-glass, .ff-char, .ff-shelf { animation: none !important; } }
      `}</style>

      {/* Pluie de livres (Konami) */}
      {bookRain && rainBooks.map(b => (
        <div key={b.id} aria-hidden="true" style={{
          position: "fixed", top: 0, left: `${b.left}%`, zIndex: 2, width: 14, height: 20, borderRadius: 1,
          background: b.bright ? BOOK_BRIGHT : "transparent", border: `1.5px solid ${LINE}`,
          transform: `rotate(${b.rot}deg)`, animation: `ff-fall ${b.duration}s linear ${b.delay}s forwards`,
        }} />
      ))}

      {/* 404 */}
      <h1 style={{ fontSize: "clamp(4.5rem, 18vw, 9rem)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.06em", margin: 0, color: TEXT, position: "relative", zIndex: 3 }}>404</h1>

      {/* Scène : bonhomme bâton + étagère */}
      <svg width="600" height="320" viewBox="120 60 480 250" style={{ maxWidth: "94vw", height: "auto", position: "relative", zIndex: 3, marginTop: ".25rem" }}
        role="img" aria-label="Un personnage cherche une page avec une loupe devant une étagère de livres">
        {/* sol */}
        <line x1="150" y1="300" x2="585" y2="300" stroke={LINE} strokeWidth="2.5" strokeLinecap="round" />

        {/* Étagère */}
        <g className={`ff-shelf${konami ? " wobble" : ""}`}>
          <rect x="380" y="72" width="200" height="228" rx="5" fill="none" stroke={LINE} strokeWidth="2.5" />
          <line x1="380" y1="130" x2="580" y2="130" stroke={LINE} strokeWidth="2" />
          <line x1="380" y1="187" x2="580" y2="187" stroke={LINE} strokeWidth="2" />
          <line x1="380" y1="244" x2="580" y2="244" stroke={LINE} strokeWidth="2" />
          {ROWS.map((row, r) =>
            XS.map((x, i) => (
              <rect key={`${r}-${i}`} x={x} y={row.baseline - row.h[i]} width={16} height={row.h[i]} rx={1}
                fill={bookFill(r, i)} stroke={LINE} strokeWidth="1.6" />
            ))
          )}
        </g>

        {/* Échelle */}
        <g stroke={LINE} strokeWidth="2" fill="none" strokeLinecap="round">
          <line x1="498" y1="300" x2="520" y2="80" />
          <line x1="516" y1="300" x2="538" y2="80" />
          <line x1="516" y1="120" x2="534" y2="120" />
          <line x1="511" y1="170" x2="529" y2="170" />
          <line x1="506" y1="220" x2="524" y2="220" />
          <line x1="501" y1="270" x2="519" y2="270" />
        </g>

        {/* Livres au sol */}
        <g stroke={LINE} strokeWidth="1.6" strokeLinejoin="round">
          <rect x="178" y="288" width="36" height="12" fill="none" />
          <rect x="184" y="276" width="30" height="12" fill={BOOK_SOLID} />
        </g>

        {/* Bonhomme bâton avec loupe */}
        <g className="ff-char">
          <ellipse cx="254" cy="304" rx="40" ry="5" fill={LINE} opacity="0.14" />
          <g stroke={LINE} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="254" cy="164" r="17" fill={BG} />
            <line x1="254" y1="181" x2="254" y2="236" />
            <line x1="254" y1="236" x2="238" y2="300" />
            <line x1="254" y1="236" x2="272" y2="300" />
            <line x1="254" y1="192" x2="231" y2="216" />
            <line x1="254" y1="189" x2="291" y2="169" />
          </g>
          <circle cx="248" cy="162" r="2.1" fill={LINE} />
          <circle cx="259" cy="162" r="2.1" fill={LINE} />
          <path d="M248 170 Q254 174 260 170" fill="none" stroke={LINE} strokeWidth="2" strokeLinecap="round" />
          {/* loupe */}
          <g className="ff-glass">
            <circle cx="308" cy="160" r="15" fill={BG} stroke={LINE} strokeWidth="3.5" />
            <line x1="297" y1="171" x2="288" y2="180" stroke={LINE} strokeWidth="5" strokeLinecap="round" />
            <path d="M302 152 Q308 149 315 153" fill="none" stroke={LINE} strokeWidth="2" opacity="0.4" />
          </g>
        </g>
      </svg>

      {/* Titre minimal */}
      <h2 style={{ fontSize: "clamp(1.05rem, 4vw, 1.4rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: "1rem 0 0", textAlign: "center", zIndex: 3, position: "relative", color: TEXT }}>
        Page introuvable
      </h2>

      {/* Actions */}
      <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap", justifyContent: "center", marginTop: "1.4rem", zIndex: 3, position: "relative" }}>
        <Link href="/" className="ff-link" style={{
          padding: ".7rem 1.4rem", borderRadius: 10, fontSize: ".9rem", fontWeight: 700, textDecoration: "none",
          color: BG, background: TEXT, border: `1.5px solid ${TEXT}`,
        }}>Retour à l&apos;accueil</Link>
        <Link href="/dashboard" className="ff-link" style={{
          padding: ".7rem 1.4rem", borderRadius: 10, fontSize: ".9rem", fontWeight: 700, textDecoration: "none",
          color: TEXT, background: "transparent", border: `1.5px solid ${MUTED}`,
        }}>Mon tableau de bord</Link>
      </div>
    </main>
  );
}
