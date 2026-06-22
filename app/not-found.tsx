"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── Palette Loopflo ──────────────────────────────────────────────────────────
const INDIGO = "#4F46E5";
const VIOLET = "#8B5CF6";
const BOOK_COLORS = ["#6366F1", "#8B5CF6", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6"];

// Phrases du bonhomme — cliquer sur le personnage les fait défiler (easter egg #1)
const PHRASES = [
  "Hmm… cette page n'est pas sur cette étagère.",
  "J'ai cherché partout, même la section Z.",
  "Elle était là hier, pourtant.",
  "404 livres parcourus, toujours rien.",
  "Bon. On va dire qu'elle est partie en vacances.",
  "Tu es sûr de l'adresse ? Moi je doute, là.",
];

// ── Étagère de livres (générée) ──────────────────────────────────────────────
type Book = { w: number; h: number; color: string; tilted: boolean; secret: boolean };

function buildShelf(count: number, secret: boolean): Book[] {
  const books: Book[] = [];
  for (let i = 0; i < count; i++) {
    books.push({
      w: 10 + ((i * 7) % 12),
      h: 60 + ((i * 13) % 34),
      color: BOOK_COLORS[i % BOOK_COLORS.length],
      tilted: i % 9 === 4,
      secret: false,
    });
  }
  // Un seul livre "secret" sur toute la bibliothèque (easter egg #2)
  if (secret && books.length > 3) books[2].secret = true;
  return books;
}

export default function NotFound() {
  const [phrase, setPhrase] = useState(PHRASES[0]);
  const [bubble, setBubble] = useState(false);
  const phraseIdx = useRef(0);

  const [eggs, setEggs] = useState<Set<string>>(new Set());
  const [konami, setKonami] = useState(false);
  const [bookRain, setBookRain] = useState(false);

  const foundEgg = useCallback((id: string) => {
    setEggs(prev => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  // Bonhomme cliqué → phrase suivante + bulle
  function onCharacterClick() {
    phraseIdx.current = (phraseIdx.current + 1) % PHRASES.length;
    setPhrase(PHRASES[phraseIdx.current]);
    setBubble(true);
    foundEgg("parle");
  }

  // Livre secret trouvé
  function onSecretBook() {
    foundEgg("livre");
    setPhrase("Tu as trouvé le livre caché. Mais pas ta page, désolé.");
    setBubble(true);
  }

  // Konami code : ↑ ↑ ↓ ↓ ← → ← → B A (easter egg #3)
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
        foundEgg("konami");
        setTimeout(() => setBookRain(false), 6000);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [foundEgg]);

  // Herbes folles (tumbleweeds) qui roulent à intervalles aléatoires
  const weeds = useMemo(
    () => Array.from({ length: 4 }, (_, i) => ({
      id: i,
      bottom: 18 + Math.round(Math.random() * 90),
      duration: 7 + Math.round(Math.random() * 9),
      delay: Math.round(Math.random() * 12),
      size: 22 + Math.round(Math.random() * 26),
    })),
    []
  );

  const shelves = useMemo(() => [buildShelf(22, false), buildShelf(20, true), buildShelf(24, false), buildShelf(18, false)], []);

  const rainBooks = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: Math.round(Math.random() * 100),
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      color: BOOK_COLORS[i % BOOK_COLORS.length],
      rot: Math.round(Math.random() * 360),
    })),
    []
  );

  return (
    <main style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "2rem 1.25rem", position: "relative", overflow: "hidden",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: "radial-gradient(1200px 600px at 50% -10%, #EEF2FF 0%, #F8FAFC 45%, #F1F5F9 100%)",
      color: "#0F172A",
    }}>
      <style>{`
        @keyframes ff-roll {
          0%   { transform: translateX(-12vw) rotate(0deg); opacity: 0; }
          6%   { opacity: .85; }
          94%  { opacity: .85; }
          100% { transform: translateX(112vw) rotate(1080deg); opacity: 0; }
        }
        @keyframes ff-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes ff-glass { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(8deg); } }
        @keyframes ff-pop { 0% { transform: scale(.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes ff-fall { 0% { transform: translateY(-20vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 1; } }
        @keyframes ff-wobble { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-2.5deg); } 75% { transform: rotate(2.5deg); } }
        .ff-weed { position: fixed; left: 0; z-index: 1; pointer-events: none; color: #B7935B; will-change: transform; }
        .ff-char { cursor: pointer; transition: transform .15s ease; }
        .ff-char:active { transform: scale(.97); }
        .ff-glass { transform-origin: 70px 150px; animation: ff-glass 2.4s ease-in-out infinite; }
        .ff-shelf.wobble { animation: ff-wobble 1.2s ease-in-out infinite; }
        .ff-link { transition: transform .15s ease, box-shadow .15s ease; }
        .ff-link:hover { transform: translateY(-2px); }
        @media (prefers-reduced-motion: reduce) { .ff-weed, .ff-glass, .ff-char { animation: none !important; } }
      `}</style>

      {/* Herbes folles qui roulent */}
      {weeds.map(w => (
        <svg key={w.id} className="ff-weed" width={w.size} height={w.size} viewBox="0 0 50 50"
          style={{ bottom: w.bottom, animation: `ff-roll ${w.duration}s linear ${w.delay}s infinite` }} aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="25" cy="25" r="18" opacity=".55" />
            <path d="M25 7 L25 43 M7 25 L43 25 M12 12 L38 38 M38 12 L12 38" opacity=".7" />
            <path d="M14 18 Q25 25 36 16 M14 34 Q25 25 37 33" opacity=".5" />
          </g>
        </svg>
      ))}

      {/* Pluie de livres (Konami) */}
      {bookRain && rainBooks.map(b => (
        <div key={b.id} aria-hidden="true" style={{
          position: "fixed", top: 0, left: `${b.left}%`, zIndex: 2, width: 16, height: 22, borderRadius: 2,
          background: b.color, boxShadow: "inset -3px 0 0 rgba(0,0,0,.18)",
          transform: `rotate(${b.rot}deg)`, animation: `ff-fall ${b.duration}s linear ${b.delay}s forwards`,
        }} />
      ))}

      {/* 404 */}
      <h1 style={{
        fontSize: "clamp(4.5rem, 18vw, 9rem)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.05em", margin: 0,
        background: `linear-gradient(135deg, ${INDIGO}, ${VIOLET})`, WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent", backgroundClip: "text", position: "relative", zIndex: 3,
      }}>404</h1>

      {/* Scène : bonhomme + immense bibliothèque */}
      <div style={{ position: "relative", zIndex: 3, marginTop: ".5rem" }}>
        {bubble && (
          <div onClick={() => setBubble(false)} style={{
            position: "absolute", top: -14, left: "50%", transform: "translateX(-30%)", zIndex: 5, cursor: "pointer",
            background: "#fff", border: `1.5px solid ${INDIGO}33`, borderRadius: 14, padding: ".6rem .9rem",
            fontSize: ".82rem", fontWeight: 600, color: "#1E293B", maxWidth: 260, boxShadow: "0 12px 30px rgba(79,70,229,.18)",
            animation: "ff-pop .18s ease",
          }}>
            {phrase}
            <span style={{ position: "absolute", bottom: -7, left: 34, width: 14, height: 14, background: "#fff", borderRight: `1.5px solid ${INDIGO}33`, borderBottom: `1.5px solid ${INDIGO}33`, transform: "rotate(45deg)" }} />
          </div>
        )}

        <svg width="360" height="300" viewBox="0 0 360 300" style={{ maxWidth: "92vw", height: "auto" }} role="img" aria-label="Un personnage cherche une page avec une loupe devant une immense bibliothèque">
          {/* Bibliothèque */}
          <g className={`ff-shelf${konami ? " wobble" : ""}`}>
            <rect x="150" y="20" width="200" height="250" rx="8" fill="#fff" stroke="#E2E8F0" strokeWidth="2" />
            {shelves.map((shelf, si) => {
              const shelfY = 32 + si * 60;
              let x = 160;
              return (
                <g key={si}>
                  {shelf.map((b, bi) => {
                    const bx = x; x += b.w + 1;
                    if (x > 338) return null;
                    return (
                      <rect
                        key={bi}
                        x={bx} y={shelfY + (52 - b.h)} width={b.w} height={b.h} rx={1.5}
                        fill={b.secret ? "#0F172A" : b.color}
                        opacity={b.secret ? 0.92 : 0.9}
                        transform={b.tilted ? `rotate(7 ${bx} ${shelfY + 52})` : undefined}
                        onClick={b.secret ? onSecretBook : undefined}
                        style={{ cursor: b.secret ? "pointer" : "default" }}
                      />
                    );
                  })}
                  <rect x="152" y={shelfY + 54} width="196" height="4" fill="#CBD5E1" />
                </g>
              );
            })}
          </g>

          {/* Échelle */}
          <g stroke="#94A3B8" strokeWidth="3" strokeLinecap="round">
            <line x1="300" y1="40" x2="288" y2="265" />
            <line x1="322" y1="40" x2="316" y2="265" />
            <line x1="298" y1="90" x2="320" y2="90" />
            <line x1="296" y1="140" x2="318" y2="140" />
            <line x1="294" y1="190" x2="316" y2="190" />
            <line x1="291" y1="240" x2="314" y2="240" />
          </g>

          {/* Bonhomme avec loupe */}
          <g className="ff-char" onClick={onCharacterClick} style={{ animation: "ff-bob 3s ease-in-out infinite" }}>
            {/* ombre */}
            <ellipse cx="80" cy="272" rx="42" ry="7" fill="#0F172A" opacity=".08" />
            {/* corps */}
            <path d="M58 268 Q60 210 80 208 Q100 210 102 268 Z" fill={INDIGO} />
            {/* bras tenant la loupe */}
            <path d="M92 228 Q120 220 128 200" fill="none" stroke={INDIGO} strokeWidth="9" strokeLinecap="round" />
            {/* tête */}
            <circle cx="80" cy="190" r="22" fill="#FCD9B6" />
            <path d="M59 184 Q80 162 101 184 Q92 176 80 176 Q68 176 59 184 Z" fill="#3B2F2F" />
            {/* yeux + sourire */}
            <circle cx="73" cy="190" r="2.4" fill="#1E293B" />
            <circle cx="87" cy="190" r="2.4" fill="#1E293B" />
            <path d="M73 199 Q80 204 87 199" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
            {/* loupe */}
            <g className="ff-glass">
              <circle cx="138" cy="178" r="20" fill="#BFDBFE" opacity=".45" stroke={VIOLET} strokeWidth="5" />
              <line x1="124" y1="192" x2="112" y2="206" stroke={VIOLET} strokeWidth="7" strokeLinecap="round" />
              <path d="M130 170 Q138 166 146 172" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".9" />
            </g>
          </g>
        </svg>
      </div>

      {/* Texte */}
      <h2 style={{ fontSize: "clamp(1.1rem, 4vw, 1.5rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: ".75rem 0 .35rem", textAlign: "center", zIndex: 3, position: "relative" }}>
        Cette page est introuvable
      </h2>
      <p style={{ fontSize: ".92rem", color: "#64748B", textAlign: "center", maxWidth: 440, lineHeight: 1.6, margin: 0, zIndex: 3, position: "relative" }}>
        On a fouillé toute la bibliothèque, mais la page que tu cherches n&apos;existe pas (ou plus).
        {konami && <><br /><strong style={{ color: INDIGO }}>Mode développeur activé — tu connais tes classiques.</strong></>}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", justifyContent: "center", marginTop: "1.5rem", zIndex: 3, position: "relative" }}>
        <Link href="/" className="ff-link" style={{
          padding: ".7rem 1.4rem", borderRadius: 11, fontSize: ".9rem", fontWeight: 700, textDecoration: "none", color: "#fff",
          background: `linear-gradient(135deg, ${INDIGO}, ${VIOLET})`, boxShadow: "0 8px 24px rgba(79,70,229,.32)",
        }}>Retour à l&apos;accueil</Link>
        <Link href="/dashboard" className="ff-link" style={{
          padding: ".7rem 1.4rem", borderRadius: 11, fontSize: ".9rem", fontWeight: 700, textDecoration: "none", color: INDIGO,
          background: "#fff", border: "1.5px solid #E2E8F0", boxShadow: "0 4px 14px rgba(15,23,42,.06)",
        }}>Mon tableau de bord</Link>
      </div>

      {/* Compteur d'easter eggs (apparaît dès le premier trouvé) */}
      {eggs.size > 0 && (
        <div style={{
          position: "fixed", bottom: 14, right: 14, zIndex: 6, background: "#0F172A", color: "#fff",
          padding: ".45rem .8rem", borderRadius: 100, fontSize: ".72rem", fontWeight: 700, letterSpacing: ".02em",
          boxShadow: "0 8px 24px rgba(15,23,42,.28)", animation: "ff-pop .2s ease",
        }}>
          Easter eggs : {eggs.size} / 3
          {eggs.size === 3 && <span style={{ color: "#A5B4FC" }}> — bien joué !</span>}
        </div>
      )}

      {/* Indice discret pour les curieux */}
      <p style={{ position: "fixed", bottom: 12, left: 14, zIndex: 4, fontSize: ".68rem", color: "#94A3B8", margin: 0 }}>
        Astuce : il y a 3 secrets sur cette page.
      </p>
    </main>
  );
}
