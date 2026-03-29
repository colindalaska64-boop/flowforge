"use client";
import { useState, useEffect, useRef, useCallback } from "react";

type Format = "youtube" | "tiktok";

// ─── Fixed coordinate space: 1280 × 720 (YouTube) / 720 × 1280 (TikTok) ───

const YT = { W: 1280, H: 720 };

// Sidebar blocks (center coords inside 1280×720 space)
const SIDEBAR = [
  { id: "webhook", label: "Webhook",   desc: "Déclencheur HTTP", color: "#D97706", bg: "rgba(253,230,138,0.18)", border: "rgba(253,230,138,0.55)", cy: 112 },
  { id: "filtre",  label: "Filtre IA", desc: "Analyser le lead",  color: "#4F46E5", bg: "rgba(199,210,254,0.18)", border: "rgba(199,210,254,0.55)", cy: 173 },
  { id: "gmail",   label: "Gmail",     desc: "Envoyer un email",  color: "#DC2626", bg: "rgba(254,202,202,0.18)", border: "rgba(254,202,202,0.55)", cy: 228 },
  { id: "slack",   label: "Slack",     desc: "Notifier l'équipe", color: "#7C3AED", bg: "rgba(233,213,255,0.18)", border: "rgba(233,213,255,0.55)", cy: 283 },
];

// Canvas nodes (center x, y in 1280×720 space)
const NODES = [
  { id: "webhook", label: "Webhook",   desc: "Nouveau lead reçu", color: "#D97706", border: "rgba(253,230,138,0.6)", cx: 390, cy: 350 },
  { id: "filtre",  label: "Filtre IA", desc: "Lead urgent ?",     color: "#4F46E5", border: "rgba(199,210,254,0.6)", cx: 600, cy: 350 },
  { id: "gmail",   label: "Gmail",     desc: "Email VIP client",  color: "#DC2626", border: "rgba(254,202,202,0.6)", cx: 820, cy: 270 },
  { id: "slack",   label: "Slack",     desc: "Alerte #ventes",    color: "#7C3AED", border: "rgba(233,213,255,0.6)", cx: 820, cy: 430 },
];

// SVG paths for connections
const CONN_PATHS: Record<string, { path: string; color: string; label?: string; lx?: number; ly?: number }> = {
  "w-fi":  { path: "M 472 350 L 518 350",                               color: "#818CF8" },
  "fi-g":  { path: "M 682 350 C 720 350 720 270 748 270",               color: "#10B981", label: "OUI", lx: 700, ly: 308 },
  "fi-s":  { path: "M 682 350 C 720 350 720 430 748 430",               color: "#EF4444", label: "NON", lx: 700, ly: 395 },
};

// Node icon SVGs
function NodeIcon({ id, color }: { id: string; color: string }) {
  if (id === "webhook") return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (id === "filtre")  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill={color}/></svg>;
  if (id === "gmail")   return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke={color} strokeWidth="1.5"/><path d="M2 6l10 7 10-7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>;
  if (id === "slack")   return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="8.5" cy="5.5" r="2.5" fill={color} opacity="0.8"/><circle cx="8.5" cy="18.5" r="2.5" fill={color} opacity="0.5"/><line x1="8.5" y1="8" x2="8.5" y2="16" stroke={color} strokeWidth="2.5" strokeLinecap="round"/><line x1="11" y1="12" x2="13" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round"/></svg>;
  return null;
}

export default function DemoPage() {
  const [format, setFormat] = useState<Format>("youtube");
  const [scale, setScale] = useState(1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);

  // Animation state
  const [aiText, setAiText]               = useState("");
  const [aiTyping, setAiTyping]           = useState(false);
  const [curX, setCurX]                   = useState(640);
  const [curY, setCurY]                   = useState(380);
  const [clicking, setClicking]           = useState(false);
  const [visNodes, setVisNodes]           = useState<Set<string>>(new Set());
  const [visConns, setVisConns]           = useState<Set<string>>(new Set());
  const [flowConns, setFlowConns]         = useState<Set<string>>(new Set());
  const [successNodes, setSuccessNodes]   = useState<Set<string>>(new Set());
  const [testerActive, setTesterActive]   = useState(false);
  const [activerActive, setActiverActive] = useState(false);
  const [showToast, setShowToast]         = useState(false);
  const [isActive, setIsActive]           = useState(false);
  const [flowKey, setFlowKey]             = useState(0);
  const [isRunning, setIsRunning]         = useState(false);
  const [highlightSidebar, setHighlightSidebar] = useState<string | null>(null);

  // Scale to fit screen
  useEffect(() => {
    const update = () => {
      const el = wrapRef.current;
      if (!el) return;
      const W = format === "youtube" ? YT.W : 720;
      const H = format === "youtube" ? YT.H : 1280;
      const scaleX = (window.innerWidth - 32) / W;
      const scaleY = (window.innerHeight - 32) / H;
      setScale(Math.min(scaleX, scaleY, 1));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [format]);

  const resetState = useCallback(() => {
    setAiText(""); setAiTyping(false);
    setCurX(640); setCurY(380); setClicking(false);
    setVisNodes(new Set()); setVisConns(new Set());
    setFlowConns(new Set()); setSuccessNodes(new Set());
    setTesterActive(false); setActiverActive(false);
    setShowToast(false); setIsActive(false);
    setHighlightSidebar(null);
  }, []);

  const play = useCallback(async () => {
    cancelRef.current = false;
    setIsRunning(true);
    resetState();

    const d = (ms: number) => new Promise<void>(r => {
      const t = setTimeout(r, ms);
      const orig = r;
      void orig; void t;
    });
    const check = () => { if (cancelRef.current) throw new Error("cancelled"); };

    const move = (x: number, y: number) => { setCurX(x); setCurY(y); };

    const doClick = async (x: number, y: number, pause = 700) => {
      check();
      move(x, y);
      await d(pause);
      check();
      setClicking(true);
      await d(140);
      setClicking(false);
    };

    try {
      // ── 0. AI prompt typing ──
      const prompt = "Nouveau lead → filtrer urgence IA → Gmail + Slack";
      setAiTyping(true);
      for (let i = 0; i <= prompt.length; i++) {
        check();
        setAiText(prompt.slice(0, i));
        await d(28);
      }
      setAiTyping(false);
      await d(700);

      // ── 1. Add Webhook ──
      setHighlightSidebar("webhook");
      await doClick(105, 112, 800);
      setHighlightSidebar(null);
      setVisNodes(s => new Set([...s, "webhook"]));
      await d(600);

      // ── 2. Add Filtre IA ──
      setHighlightSidebar("filtre");
      await doClick(105, 173, 750);
      setHighlightSidebar(null);
      setVisNodes(s => new Set([...s, "filtre"]));
      await d(500);

      // ── 3. Add Gmail ──
      setHighlightSidebar("gmail");
      await doClick(105, 228, 700);
      setHighlightSidebar(null);
      setVisNodes(s => new Set([...s, "gmail"]));
      await d(500);

      // ── 4. Add Slack ──
      setHighlightSidebar("slack");
      await doClick(105, 283, 700);
      setHighlightSidebar(null);
      setVisNodes(s => new Set([...s, "slack"]));
      await d(800);

      // ── 5. Connect Webhook → Filtre IA ──
      move(472, 350);
      await d(500);
      check();
      setClicking(true);
      move(518, 350);
      await d(350);
      setClicking(false);
      setVisConns(s => new Set([...s, "w-fi"]));
      await d(600);

      // ── 6. Connect Filtre IA → Gmail (OUI) ──
      move(682, 350);
      await d(450);
      check();
      setClicking(true);
      move(748, 270);
      await d(450);
      setClicking(false);
      setVisConns(s => new Set([...s, "fi-g"]));
      await d(500);

      // ── 7. Connect Filtre IA → Slack (NON) ──
      move(682, 350);
      await d(400);
      check();
      setClicking(true);
      move(748, 430);
      await d(450);
      setClicking(false);
      setVisConns(s => new Set([...s, "fi-s"]));
      await d(800);

      // ── 8. Save ──
      await doClick(860, 27, 600);
      await d(300);

      // ── 9. Tester ──
      await doClick(976, 27, 600);
      setTesterActive(true);
      await d(500);
      setFlowKey(k => k + 1);

      // ── 10. Data flows ──
      setFlowConns(new Set(["w-fi"]));
      await d(600);
      setSuccessNodes(s => new Set([...s, "webhook"]));
      await d(300);

      setFlowConns(new Set(["fi-g", "fi-s"]));
      await d(500);
      setSuccessNodes(s => new Set([...s, "filtre"]));
      await d(600);

      setSuccessNodes(s => new Set([...s, "gmail"]));
      await d(300);
      setSuccessNodes(s => new Set([...s, "slack"]));
      await d(700);

      // ── 11. Toast ──
      setShowToast(true);
      await d(2200);
      setShowToast(false);
      await d(500);

      // ── 12. Activer ──
      await doClick(1090, 27, 700);
      setActiverActive(true);
      setIsActive(true);
      await d(3500);

      setIsRunning(false);
      // auto-loop
      setTimeout(() => play(), 1800);

    } catch {
      setIsRunning(false);
    }
  }, [resetState]);

  useEffect(() => {
    const t = setTimeout(() => play(), 1200);
    return () => { cancelRef.current = true; clearTimeout(t); };
  }, [play]);

  const W = format === "youtube" ? YT.W : 720;
  const H = format === "youtube" ? YT.H : 1280;

  return (
    <div style={{ minHeight: "100vh", background: "#07001a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans',sans-serif", padding: 16, userSelect: "none" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        @keyframes nodeIn   { 0%{opacity:0;transform:scale(0.7) translateY(14px)} 60%{transform:scale(1.04) translateY(-2px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes connDraw { 0%{stroke-dashoffset:600} 100%{stroke-dashoffset:0} }
        @keyframes ripple   { 0%{transform:scale(0);opacity:1} 100%{transform:scale(2.5);opacity:0} }
        @keyframes successPop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @keyframes toastIn  { 0%{transform:translateY(30px) translateX(-50%);opacity:0} 100%{transform:translateY(0) translateX(-50%);opacity:1} }
        @keyframes activePulse { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.5)} 50%{box-shadow:0 0 0 10px rgba(16,185,129,0)} }
        @keyframes glowPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes sidebarPulse { 0%,100%{background:rgba(99,102,241,0.08)} 50%{background:rgba(99,102,241,0.22)} }
        .demo-node-enter { animation: nodeIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .conn-path { stroke-dasharray: 600; animation: connDraw 0.55s cubic-bezier(0.4,0,0.2,1) forwards; }
        .success-badge { animation: successPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .toast-enter { animation: toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* Format toggle */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8, zIndex: 10 }}>
        {(["youtube", "tiktok"] as Format[]).map(f => (
          <button key={f} onClick={() => setFormat(f)}
            style={{ padding: ".45rem 1.1rem", borderRadius: 8, border: `1.5px solid ${format === f ? "#6366F1" : "rgba(255,255,255,0.15)"}`, background: format === f ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)", color: format === f ? "#A5B4FC" : "rgba(255,255,255,0.45)", fontSize: ".82rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(10px)", transition: "all .2s" }}>
            {f === "youtube" ? "▶ YouTube 16:9" : "📱 TikTok 9:16"}
          </button>
        ))}
        <button onClick={() => { cancelRef.current = true; setTimeout(() => play(), 100); }}
          style={{ padding: ".45rem 1.1rem", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", fontSize: ".82rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(10px)" }}>
          ↺ Rejouer
        </button>
      </div>

      {/* Main container */}
      <div ref={wrapRef} style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top center", position: "relative", overflow: "hidden", borderRadius: 18, boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 40px 120px rgba(0,0,0,0.8), 0 0 80px rgba(99,102,241,0.15)" }}>

        {/* Background */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0a001e 0%, #0e0230 55%, #110535 100%)" }}>
          <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.30) 0%, transparent 70%)", filter: "blur(80px)", top: -200, left: "40%", transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.20) 0%, transparent 70%)", filter: "blur(70px)", top: 200, right: 80 }} />
        </div>

        {/* ─── NAV BAR ─── */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 54, background: "rgba(10,0,30,0.75)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, zIndex: 20 }}>
          {/* Logo */}
          <div style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.03em", color: "#fff", flexShrink: 0 }}>
            Loop<span style={{ color: "#818CF8" }}>flo</span>
          </div>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
          {/* Workflow name */}
          <div style={{ fontSize: ".8rem", color: "rgba(255,255,255,0.55)", fontWeight: 600, flexShrink: 0 }}>
            Demo — Qualification de leads
          </div>
          {isActive && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".7rem", fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", padding: ".2rem .6rem", borderRadius: 100, animation: "activePulse 2s infinite" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
              ACTIF
            </div>
          )}
          <div style={{ flex: 1 }} />
          {/* Buttons */}
          {[
            { label: "Sauvegarder", x: 860, color: "rgba(255,255,255,0.18)", textColor: "rgba(255,255,255,0.7)" },
            { label: "Tester ▶", x: 976, color: testerActive ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.12)", textColor: testerActive ? "#10B981" : "rgba(255,255,255,0.6)" },
            { label: "Activer ⚡", x: 1090, color: activerActive ? "rgba(99,102,241,0.35)" : "rgba(99,102,241,0.12)", textColor: activerActive ? "#A5B4FC" : "rgba(255,255,255,0.6)" },
          ].map(btn => (
            <div key={btn.label} style={{ padding: ".35rem .9rem", borderRadius: 8, background: btn.color, border: `1px solid rgba(255,255,255,0.1)`, color: btn.textColor, fontSize: ".78rem", fontWeight: 700, backdropFilter: "blur(10px)", transition: "all .3s" }}>
              {btn.label}
            </div>
          ))}
        </div>

        {/* ─── SIDEBAR ─── */}
        <div style={{ position: "absolute", top: 54, left: 0, width: 210, bottom: 0, background: "rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", zIndex: 10, padding: "16px 10px" }}>
          <p style={{ fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,0.3)", marginBottom: 8, paddingLeft: 6 }}>Déclencheurs</p>
          {SIDEBAR.slice(0, 1).map(b => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 9, marginBottom: 4, border: `1px solid ${highlightSidebar === b.id ? b.border : "rgba(255,255,255,0.08)"}`, background: highlightSidebar === b.id ? b.bg : "rgba(255,255,255,0.04)", transition: "all .2s", cursor: "default" }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: b.bg, border: `1px solid ${b.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <NodeIcon id={b.id} color={b.color} />
              </div>
              <div>
                <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#fff" }}>{b.label}</div>
                <div style={{ fontSize: ".62rem", color: "rgba(255,255,255,0.4)" }}>{b.desc}</div>
              </div>
            </div>
          ))}
          <p style={{ fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,0.3)", margin: "12px 0 8px", paddingLeft: 6 }}>Actions</p>
          {SIDEBAR.slice(1).map(b => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 9, marginBottom: 4, border: `1px solid ${highlightSidebar === b.id ? b.border : "rgba(255,255,255,0.08)"}`, background: highlightSidebar === b.id ? b.bg : "rgba(255,255,255,0.04)", transition: "all .2s", cursor: "default" }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: b.bg, border: `1px solid ${b.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <NodeIcon id={b.id} color={b.color} />
              </div>
              <div>
                <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#fff" }}>{b.label}</div>
                <div style={{ fontSize: ".62rem", color: "rgba(255,255,255,0.4)" }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── CANVAS ─── */}
        <div style={{ position: "absolute", top: 54, left: 210, right: 0, bottom: 0, overflow: "hidden" }}>
          {/* Dot grid */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.6 }} />

          {/* AI prompt bar */}
          <div style={{ position: "absolute", top: 16, left: 16, right: 16, height: 44, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, padding: "0 14px" }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill="white"/></svg>
            </div>
            <span style={{ fontSize: ".78rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
              {aiText}
              {aiTyping && <span style={{ display: "inline-block", width: 2, height: 12, background: "#818CF8", marginLeft: 1, verticalAlign: "middle", animation: "glowPulse 0.8s infinite" }} />}
            </span>
          </div>

          {/* SVG connections layer */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {Object.entries(CONN_PATHS).map(([id, conn]) => {
              if (!visConns.has(id)) return null;
              // Offset by canvas position (left=210, top=54) but we're inside the canvas div, so no offset needed
              return (
                <g key={id}>
                  {/* Glow track */}
                  <path d={conn.path} stroke={conn.color} strokeWidth="8" fill="none" opacity="0.10" />
                  {/* Main path */}
                  <path d={conn.path} stroke={conn.color} strokeWidth="2" fill="none" opacity="0.7" className="conn-path" filter="url(#glow)" />
                  {/* Arrow head */}
                  <circle r="3.5" fill={conn.color} opacity="0.8">
                    <animateMotion dur="0.01s" fill="freeze" path={conn.path} />
                  </circle>
                  {/* OUI / NON label */}
                  {conn.label && conn.lx && conn.ly && (
                    <text x={conn.lx} y={conn.ly} fontSize="10" fontWeight="800" fill={conn.color} opacity="0.9" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{conn.label}</text>
                  )}
                  {/* Flowing particles */}
                  {flowConns.has(id) && (
                    <g key={`flow-${id}-${flowKey}`}>
                      {[0, 0.4, 0.8].map((delay, i) => (
                        <circle key={i} r="4" fill={conn.color} filter="url(#glow)">
                          <animateMotion dur="0.9s" begin={`${delay}s`} repeatCount="3" path={conn.path} />
                        </circle>
                      ))}
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Canvas nodes */}
          {NODES.map(node => {
            const visible = visNodes.has(node.id);
            const success = successNodes.has(node.id);
            // Adjust cx,cy: subtract canvas offset (x=210, y=54) since we're inside canvas
            const nx = node.cx - 210;
            const ny = node.cy - 54;
            return (
              <div key={node.id} className={visible ? "demo-node-enter" : ""}
                style={{ position: "absolute", left: nx - 80, top: ny - 26, width: 160, height: 52, opacity: visible ? 1 : 0, pointerEvents: "none" }}>
                <div style={{ width: "100%", height: "100%", background: success ? `linear-gradient(135deg, rgba(255,255,255,0.10) 0%, ${node.color}18 100%)` : "rgba(255,255,255,0.07)", backdropFilter: "blur(24px) saturate(180%)", border: `1.5px solid ${success ? node.color : "rgba(255,255,255,0.16)"}`, borderRadius: 13, display: "flex", alignItems: "center", padding: "0 12px", gap: 9, boxShadow: success ? `0 0 24px ${node.color}30, 0 6px 24px rgba(0,0,0,0.4), inset 0 1.5px 0 rgba(255,255,255,0.15)` : "0 6px 24px rgba(0,0,0,0.4), inset 0 1.5px 0 rgba(255,255,255,0.08)", transition: "border .3s, box-shadow .3s" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: `${node.color}22`, border: `1px solid ${node.color}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <NodeIcon id={node.id} color={node.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#fff" }}>{node.label}</div>
                    <div style={{ fontSize: ".62rem", color: "rgba(255,255,255,0.45)" }}>{node.desc}</div>
                  </div>
                  {success && (
                    <div className="success-badge" style={{ width: 18, height: 18, borderRadius: "50%", background: node.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Toast */}
          {showToast && (
            <div className="toast-enter" style={{ position: "absolute", bottom: 28, left: "50%", background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.10))", backdropFilter: "blur(24px)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 14, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 0 40px rgba(16,185,129,0.20), 0 8px 32px rgba(0,0,0,0.4)", zIndex: 30 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(16,185,129,0.2)", border: "1.5px solid rgba(16,185,129,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5 6.5-6.5" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#fff" }}>Workflow exécuté avec succès !</div>
                <div style={{ fontSize: ".68rem", color: "rgba(255,255,255,0.5)", marginTop: 1 }}>4 blocs · 2 emails envoyés · 1 notification Slack</div>
              </div>
            </div>
          )}
        </div>

        {/* ─── CURSOR ─── */}
        <div style={{ position: "absolute", left: curX - 210 + 210, top: curY, zIndex: 9999, pointerEvents: "none", transition: "left 0.75s cubic-bezier(0.25,0.46,0.45,0.94), top 0.75s cubic-bezier(0.25,0.46,0.45,0.94)", transform: "translate(-4px, -4px)" }}
          // need to account for canvas offset. curX/curY are in 1280×720 space directly
        >
        </div>

        {/* Cursor (absolute in whole container, not canvas) */}
        <div style={{ position: "absolute", left: curX, top: curY, zIndex: 9999, pointerEvents: "none", transition: "left 0.72s cubic-bezier(0.25,0.46,0.45,0.94), top 0.72s cubic-bezier(0.25,0.46,0.45,0.94)", transform: "translate(-4px, -3px)" }}>
          <svg width="22" height="26" viewBox="0 0 22 26" fill="none" style={{ filter: "drop-shadow(0 2px 8px rgba(99,102,241,0.6))" }}>
            <path d="M2 2L20 11L12.5 13.5L9 23L2 2Z" fill="url(#curGrad)" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="curGrad" x1="2" y1="2" x2="20" y2="23" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6366F1"/>
                <stop offset="100%" stopColor="#A855F7"/>
              </linearGradient>
            </defs>
          </svg>
          {/* Click ripple */}
          {clicking && (
            <div style={{ position: "absolute", top: -12, left: -12, width: 44, height: 44, borderRadius: "50%", border: "2.5px solid #818CF8", animation: "ripple 0.35s ease-out forwards", pointerEvents: "none" }} />
          )}
        </div>

      </div>

      {/* Recording tip */}
      <p style={{ marginTop: 14, fontSize: ".72rem", color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
        Utilisez OBS ou QuickTime pour enregistrer · {format === "youtube" ? "1280×720 — YouTube 16:9" : "720×1280 — TikTok 9:16"}
      </p>
    </div>
  );
}
