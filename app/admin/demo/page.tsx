"use client";
import { useState, useEffect, useRef, useCallback } from "react";

type Format = "youtube" | "tiktok";
type Lang = "fr" | "en";

interface NodeDef {
  id: string; label: string; descFr: string; descEn: string;
  color: string; bg: string; border: string; cx: number; cy: number; icon: string;
}
interface ConnDef {
  id: string; fromId: string; toId: string; color: string; labelFr?: string; labelEn?: string;
}
interface Scenario {
  nameFr: string; nameEn: string;
  promptFr: string; promptEn: string;
  nodes: NodeDef[];
  conns: ConnDef[];
  captionsFr: string[]; captionsEn: string[];
  sidebarIds: string[];
  zoom: { scale: number; tx: number; ty: number };
}

const SCENARIOS: Scenario[] = [
  {
    nameFr: "Qualification de leads",
    nameEn: "Lead Qualification",
    promptFr: "Nouveau lead → filtrer urgence IA → notifier l'équipe",
    promptEn: "New lead → AI urgency filter → notify the team",
    nodes: [
      { id: "webhook", label: "Webhook", descFr: "Nouveau lead reçu", descEn: "New lead received", color: "#D97706", bg: "#FEF3C7", border: "#FDE68A", cx: 400, cy: 360, icon: "webhook" },
      { id: "ai",      label: "Filtre IA", descFr: "Lead urgent ?", descEn: "Urgent lead?",       color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", cx: 620, cy: 360, icon: "ai" },
      { id: "gmail",   label: "Gmail",    descFr: "Email VIP client", descEn: "VIP client email", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", cx: 840, cy: 270, icon: "gmail" },
      { id: "slack",   label: "Slack",    descFr: "Alerte #ventes",   descEn: "Alert #sales",     color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", cx: 840, cy: 450, icon: "slack" },
    ],
    conns: [
      { id: "w-ai",  fromId: "webhook", toId: "ai",    color: "#818CF8" },
      { id: "ai-g",  fromId: "ai",      toId: "gmail", color: "#10B981", labelFr: "OUI", labelEn: "YES" },
      { id: "ai-s",  fromId: "ai",      toId: "slack", color: "#EF4444", labelFr: "NON", labelEn: "NO" },
    ],
    captionsFr: ["Créez un workflow en quelques secondes.", "L'IA analyse chaque lead automatiquement.", "Gmail, Slack — tout se connecte instantanément."],
    captionsEn: ["Build a workflow in seconds.", "AI analyzes every lead automatically.", "Gmail, Slack — everything connects instantly."],
    sidebarIds: ["webhook", "ai", "gmail", "slack"],
    zoom: { scale: 1.18, tx: -40, ty: 10 },
  },
  {
    nameFr: "Rapport hebdomadaire",
    nameEn: "Weekly Report",
    promptFr: "Chaque lundi → extraire Google Sheets → résumer IA → envoyer",
    promptEn: "Every Monday → fetch Google Sheets → AI summary → send",
    nodes: [
      { id: "schedule", label: "Schedule",      descFr: "Chaque lundi 8h",    descEn: "Every Monday 8am",    color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", cx: 360, cy: 360, icon: "schedule" },
      { id: "sheets",   label: "Google Sheets", descFr: "Données de la semaine", descEn: "Weekly data",      color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cx: 580, cy: 360, icon: "sheets" },
      { id: "ai2",      label: "Résumé IA",    descFr: "Synthèse intelligente", descEn: "Smart summary",     color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", cx: 800, cy: 360, icon: "ai" },
      { id: "slack2",   label: "Slack",        descFr: "Rapport #équipe",       descEn: "Report #team",      color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", cx: 980, cy: 270, icon: "slack" },
      { id: "notion",   label: "Notion",       descFr: "Archive rapport",       descEn: "Archive report",    color: "#374151", bg: "#F9FAFB", border: "#E5E7EB", cx: 980, cy: 450, icon: "notion" },
    ],
    conns: [
      { id: "sc-sh", fromId: "schedule", toId: "sheets", color: "#818CF8" },
      { id: "sh-ai", fromId: "sheets",   toId: "ai2",    color: "#818CF8" },
      { id: "ai-sl", fromId: "ai2",      toId: "slack2", color: "#10B981" },
      { id: "ai-no", fromId: "ai2",      toId: "notion", color: "#6366F1" },
    ],
    captionsFr: ["Automatisez vos rapports sans effort.", "L'IA synthétise vos données en un instant.", "Publiez partout — Slack, Notion, email."],
    captionsEn: ["Automate your reports effortlessly.", "AI synthesizes your data in an instant.", "Publish everywhere — Slack, Notion, email."],
    sidebarIds: ["schedule", "sheets", "ai2", "slack2", "notion"],
    zoom: { scale: 1.08, tx: -80, ty: 0 },
  },
  {
    nameFr: "Alertes e-commerce",
    nameEn: "E-commerce Alerts",
    promptFr: "Nouvelle commande → vérifier stock → email client + facture",
    promptEn: "New order → check stock → client email + invoice",
    nodes: [
      { id: "order",    label: "Nouvelle commande", descFr: "Shopify webhook",     descEn: "Shopify webhook",   color: "#D97706", bg: "#FEF3C7", border: "#FDE68A", cx: 360, cy: 360, icon: "webhook" },
      { id: "stock",    label: "Vérif. stock",      descFr: "Quantité disponible", descEn: "Check stock qty",   color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", cx: 580, cy: 360, icon: "api" },
      { id: "email2",   label: "Gmail",             descFr: "Confirmation client", descEn: "Client confirmation", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", cx: 800, cy: 280, icon: "gmail" },
      { id: "invoice",  label: "Facture PDF",       descFr: "Générer facture",     descEn: "Generate invoice",  color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cx: 800, cy: 450, icon: "notion" },
    ],
    conns: [
      { id: "or-st",  fromId: "order",  toId: "stock",   color: "#818CF8" },
      { id: "st-em",  fromId: "stock",  toId: "email2",  color: "#10B981", labelFr: "EN STOCK", labelEn: "IN STOCK" },
      { id: "st-inv", fromId: "stock",  toId: "invoice", color: "#6366F1" },
    ],
    captionsFr: ["Chaque commande, traitée en temps réel.", "Vérification de stock automatique.", "Le client reçoit sa confirmation en secondes."],
    captionsEn: ["Every order, processed in real time.", "Automatic stock verification.", "Customer gets their confirmation in seconds."],
    sidebarIds: ["order", "stock", "email2", "invoice"],
    zoom: { scale: 1.15, tx: -30, ty: 5 },
  },
  {
    nameFr: "Triage support client",
    nameEn: "Customer Support Triage",
    promptFr: "Email entrant → IA priorité → ticket Notion + alerte urgente",
    promptEn: "Incoming email → AI priority → Notion ticket + urgent alert",
    nodes: [
      { id: "mail_in",  label: "Lire emails",  descFr: "Gmail IMAP",          descEn: "Gmail IMAP",          color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", cx: 380, cy: 360, icon: "gmail" },
      { id: "ai3",      label: "IA Priorité",  descFr: "Niveau d'urgence",    descEn: "Urgency level",       color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", cx: 600, cy: 360, icon: "ai" },
      { id: "notion2",  label: "Notion",       descFr: "Créer ticket",        descEn: "Create ticket",       color: "#374151", bg: "#F9FAFB", border: "#E5E7EB", cx: 820, cy: 280, icon: "notion" },
      { id: "slack3",   label: "Slack",        descFr: "🚨 Alerte critique",  descEn: "🚨 Critical alert",   color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", cx: 820, cy: 450, icon: "slack" },
    ],
    conns: [
      { id: "mi-ai",  fromId: "mail_in", toId: "ai3",     color: "#818CF8" },
      { id: "ai-no2", fromId: "ai3",     toId: "notion2", color: "#10B981", labelFr: "TICKET", labelEn: "TICKET" },
      { id: "ai-sl2", fromId: "ai3",     toId: "slack3",  color: "#EF4444", labelFr: "URGENT", labelEn: "URGENT" },
    ],
    captionsFr: ["Lisez et triez vos emails automatiquement.", "L'IA détecte les urgences en temps réel.", "Zéro email critique manqué."],
    captionsEn: ["Read and sort your emails automatically.", "AI detects urgencies in real time.", "Zero critical email missed."],
    sidebarIds: ["mail_in", "ai3", "notion2", "slack3"],
    zoom: { scale: 1.2, tx: -20, ty: 15 },
  },
  {
    nameFr: "Onboarding automatique",
    nameEn: "Auto Onboarding",
    promptFr: "Nouvel inscrit → email bienvenue → Notion + Calendly",
    promptEn: "New signup → welcome email → Notion + Calendly",
    nodes: [
      { id: "signup",  label: "Inscription",   descFr: "Nouvel utilisateur",  descEn: "New user signup",   color: "#D97706", bg: "#FEF3C7", border: "#FDE68A", cx: 360, cy: 360, icon: "webhook" },
      { id: "welcome", label: "Gmail",         descFr: "Email de bienvenue",  descEn: "Welcome email",     color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", cx: 580, cy: 280, icon: "gmail" },
      { id: "notion3", label: "Notion",        descFr: "Fiche utilisateur",   descEn: "User profile",      color: "#374151", bg: "#F9FAFB", border: "#E5E7EB", cx: 580, cy: 450, icon: "notion" },
      { id: "cal",     label: "Calendly",      descFr: "Appel onboarding",    descEn: "Onboarding call",   color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cx: 800, cy: 360, icon: "schedule" },
    ],
    conns: [
      { id: "su-we", fromId: "signup",  toId: "welcome", color: "#10B981" },
      { id: "su-no", fromId: "signup",  toId: "notion3", color: "#6366F1" },
      { id: "we-ca", fromId: "welcome", toId: "cal",     color: "#818CF8" },
    ],
    captionsFr: ["Chaque inscription, un accueil parfait.", "Email, Notion, Calendly — en un seul workflow.", "Offrez une expérience 5 étoiles dès le premier instant."],
    captionsEn: ["Every signup, a perfect welcome.", "Email, Notion, Calendly — one workflow.", "Deliver a 5-star experience from day one."],
    sidebarIds: ["signup", "welcome", "notion3", "cal"],
    zoom: { scale: 1.12, tx: -60, ty: 5 },
  },
];

const SIDEBAR_BLOCKS = [
  { id: "webhook",  label: "Webhook",       color: "#D97706", icon: "webhook" },
  { id: "schedule", label: "Schedule",      color: "#0891B2", icon: "schedule" },
  { id: "gmail_r",  label: "Lire emails",   color: "#DC2626", icon: "gmail" },
  { id: "gmail_s",  label: "Envoyer email", color: "#DC2626", icon: "gmail" },
  { id: "ai",       label: "Filtre IA",     color: "#6366F1", icon: "ai" },
  { id: "slack",    label: "Slack",         color: "#7C3AED", icon: "slack" },
  { id: "notion",   label: "Notion",        color: "#374151", icon: "notion" },
  { id: "sheets",   label: "Google Sheets", color: "#059669", icon: "sheets" },
];

function NodeIcon({ icon, color, size = 14 }: { icon: string; color: string; size?: number }) {
  const s = size;
  if (icon === "webhook" || icon === "api")
    return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (icon === "ai")
    return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill={color}/></svg>;
  if (icon === "gmail")
    return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke={color} strokeWidth="1.5"/><path d="M2 6l10 7 10-7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>;
  if (icon === "slack")
    return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="8.5" cy="5.5" r="2.5" fill={color} opacity="0.85"/><line x1="8.5" y1="8" x2="8.5" y2="16" stroke={color} strokeWidth="2.5" strokeLinecap="round"/><line x1="11" y1="12" x2="13" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round"/></svg>;
  if (icon === "notion")
    return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.5"/><path d="M7 8h10M7 12h7M7 16h5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>;
  if (icon === "schedule")
    return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/><path d="M12 7v5l3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (icon === "sheets")
    return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5"/><path d="M3 9h18M3 15h18M9 3v18" stroke={color} strokeWidth="1.5"/></svg>;
  return null;
}

// Compute bezier path between two nodes
function bezierPath(nodes: NodeDef[], fromId: string, toId: string): string {
  const from = nodes.find(n => n.id === fromId);
  const to   = nodes.find(n => n.id === toId);
  if (!from || !to) return "";
  const x1 = from.cx + 80, y1 = from.cy;
  const x2 = to.cx - 80,   y2 = to.cy;
  const cx1 = x1 + (x2 - x1) * 0.5, cy1 = y1;
  const cx2 = x1 + (x2 - x1) * 0.5, cy2 = y2;
  return `M ${x1} ${y1} C ${cx1} ${cy1} ${cx2} ${cy2} ${x2} ${y2}`;
}

// Word-by-word reveal component
function Caption({ text, lang }: { text: string; lang: Lang }) {
  void lang;
  const words = text.split(" ");
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.28em", justifyContent: "center" }}>
      {words.map((w, i) => (
        <span key={i} style={{
          display: "inline-block",
          opacity: 0,
          transform: "translateY(8px)",
          animation: `wordIn 0.35s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.07}s forwards`,
        }}>{w}</span>
      ))}
    </div>
  );
}

export default function DemoPage() {
  const [format, setFormat]           = useState<Format>("youtube");
  const [lang, setLang]               = useState<Lang>("fr");
  const [scale, setScale]             = useState(1);
  const wrapRef                       = useRef<HTMLDivElement>(null);
  const cancelRef                     = useRef(false);

  // Per-scenario state
  const [scenarioIdx, setScenarioIdx]         = useState(0);
  const [visNodes, setVisNodes]               = useState<Set<string>>(new Set());
  const [visConns, setVisConns]               = useState<Set<string>>(new Set());
  const [flowConns, setFlowConns]             = useState<Set<string>>(new Set());
  const [successNodes, setSuccessNodes]       = useState<Set<string>>(new Set());
  const [highlightSidebar, setHighlightSidebar] = useState<string | null>(null);

  // Camera
  const [camScale, setCamScale]   = useState(1);
  const [camTx, setCamTx]         = useState(0);
  const [camTy, setCamTy]         = useState(0);

  // Cursor + trail
  const [curX, setCurX]           = useState(640);
  const [curY, setCurY]           = useState(360);
  const [clicking, setClicking]   = useState(false);
  const [trail, setTrail]         = useState<{ x: number; y: number }[]>([]);
  const trailRef                  = useRef<{ x: number; y: number }[]>([]);

  // Captions
  const [captionText, setCaptionText]   = useState("");
  const [captionKey, setCaptionKey]     = useState(0);

  // Nav buttons
  const [savePulse, setSavePulse]       = useState(false);
  const [testPulse, setTestPulse]       = useState(false);
  const [activePulse, setActivePulse]   = useState(false);
  const [isActive, setIsActive]         = useState(false);

  // Toast
  const [showToast, setShowToast]       = useState(false);

  // Transition overlay
  const [fadeOut, setFadeOut]           = useState(0); // 0..1 opacity

  // AI prompt bar
  const [promptText, setPromptText]     = useState("");
  const [promptTyping, setPromptTyping] = useState(false);

  // Flow key for particle reset
  const [flowKey, setFlowKey]           = useState(0);

  const W = format === "youtube" ? 1280 : 720;
  const H = format === "youtube" ? 720  : 1280;

  // Scale-to-fit
  useEffect(() => {
    const update = () => {
      if (!wrapRef.current) return;
      const sx = (window.innerWidth  - 32) / W;
      const sy = (window.innerHeight - 100) / H;
      setScale(Math.min(sx, sy, 1));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [format, W, H]);

  // Trail update when cursor moves
  useEffect(() => {
    const pos = { x: curX, y: curY };
    trailRef.current = [...trailRef.current.slice(-10), pos];
    setTrail([...trailRef.current]);
  }, [curX, curY]);

  const resetSceneState = useCallback(() => {
    setVisNodes(new Set()); setVisConns(new Set());
    setFlowConns(new Set()); setSuccessNodes(new Set());
    setHighlightSidebar(null);
    setSavePulse(false); setTestPulse(false); setActivePulse(false); setIsActive(false);
    setShowToast(false); setCaptionText(""); setPromptText(""); setPromptTyping(false);
    setCamScale(1); setCamTx(0); setCamTy(0);
  }, []);

  const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

  const check = useCallback(() => {
    if (cancelRef.current) throw new Error("cancelled");
  }, []);

  const moveCursor = useCallback((x: number, y: number) => {
    setCurX(x); setCurY(y);
  }, []);

  const doClick = useCallback(async (x: number, y: number, delay = 700) => {
    moveCursor(x, y);
    await sleep(delay);
    setClicking(true);
    await sleep(130);
    setClicking(false);
    await sleep(80);
  }, [moveCursor]);

  const showCaption = useCallback((text: string) => {
    setCaptionText(text);
    setCaptionKey(k => k + 1);
  }, []);

  const typePrompt = useCallback(async (text: string) => {
    setPromptTyping(true);
    for (let i = 0; i <= text.length; i++) {
      if (cancelRef.current) return;
      setPromptText(text.slice(0, i));
      await sleep(22);
    }
    setPromptTyping(false);
    await sleep(400);
  }, []);

  const playScenario = useCallback(async (idx: number) => {
    const sc = SCENARIOS[idx];
    if (!sc) return;

    resetSceneState();
    setScenarioIdx(idx);

    const prompt = lang === "fr" ? sc.promptFr : sc.promptEn;
    const caps = lang === "fr" ? sc.captionsFr : sc.captionsEn;

    // Type prompt
    await typePrompt(prompt);
    check();
    await sleep(300);

    // Add nodes one by one with sidebar highlight
    for (let i = 0; i < sc.nodes.length; i++) {
      check();
      const node = sc.nodes[i];
      // find matching sidebar block
      const sidebarMatch = SIDEBAR_BLOCKS.find(b => b.icon === node.icon || b.id === node.id.split(/[0-9]/)[0]);
      if (sidebarMatch) {
        setHighlightSidebar(sidebarMatch.id);
        moveCursor(105, 80 + SIDEBAR_BLOCKS.indexOf(sidebarMatch) * 52);
        await sleep(500);
      }
      await doClick(105, 80 + i * 52, 600);
      setHighlightSidebar(null);
      setVisNodes(s => new Set([...s, node.id]));
      await sleep(i === 0 ? 500 : 400);
    }

    check();
    showCaption(caps[0]);
    await sleep(1200);

    // Draw connections
    for (let i = 0; i < sc.conns.length; i++) {
      check();
      const conn = sc.conns[i];
      const fromNode = sc.nodes.find(n => n.id === conn.fromId);
      const toNode   = sc.nodes.find(n => n.id === conn.toId);
      if (fromNode && toNode) {
        moveCursor(fromNode.cx + 80, fromNode.cy);
        await sleep(450);
        check();
        setClicking(true);
        moveCursor(toNode.cx - 80, toNode.cy);
        await sleep(400);
        setClicking(false);
        setVisConns(s => new Set([...s, conn.id]));
        await sleep(350);
      }
    }

    check();
    showCaption(caps[1]);

    // Camera zoom in
    const z = sc.zoom;
    setCamScale(z.scale);
    setCamTx(z.tx);
    setCamTy(z.ty);
    await sleep(900);

    // Save
    moveCursor(W * 0.67, 27);
    await sleep(400);
    check();
    setSavePulse(true);
    await doClick(W * 0.67, 27, 200);
    await sleep(300);
    setSavePulse(false);

    // Test
    moveCursor(W * 0.76, 27);
    await sleep(500);
    check();
    setTestPulse(true);
    await doClick(W * 0.76, 27, 200);
    await sleep(300);

    // Data flow
    setFlowKey(k => k + 1);
    for (let i = 0; i < sc.nodes.length; i++) {
      check();
      if (i < sc.conns.length) setFlowConns(s => new Set([...s, sc.conns[i].id]));
      await sleep(250);
      setSuccessNodes(s => new Set([...s, sc.nodes[i].id]));
      await sleep(220);
    }
    check();

    // Toast
    setShowToast(true);
    await sleep(1800);
    setShowToast(false);

    showCaption(caps[2]);
    await sleep(1200);

    // Activate
    moveCursor(W * 0.85, 27);
    await sleep(500);
    check();
    await doClick(W * 0.85, 27, 200);
    setActivePulse(true);
    setIsActive(true);
    await sleep(800);

    // Camera zoom back
    setCamScale(1);
    setCamTx(0);
    setCamTy(0);
    await sleep(2200);

    // Fade out to black
    setFadeOut(1);
    await sleep(700);

  }, [lang, resetSceneState, typePrompt, check, moveCursor, doClick, showCaption, W]);

  const runLoop = useCallback(async () => {
    cancelRef.current = false;
    try {
      for (let i = 0; ; i = (i + 1) % SCENARIOS.length) {
        check();
        setFadeOut(0);
        await sleep(400);
        await playScenario(i);
        check();
        await sleep(300);
      }
    } catch {
      // cancelled
    }
  }, [playScenario, check]);

  useEffect(() => {
    cancelRef.current = false;
    const t = setTimeout(() => runLoop(), 800);
    return () => { cancelRef.current = true; clearTimeout(t); };
  }, [runLoop]);

  const sc = SCENARIOS[scenarioIdx];
  const workflowName = lang === "fr" ? sc.nameFr : sc.nameEn;

  return (
    <div style={{ minHeight: "100vh", background: "#07001a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans',sans-serif", padding: 16, userSelect: "none" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        @keyframes nodeIn { 0%{opacity:0;transform:scale(0.65) translateY(18px)} 60%{transform:scale(1.06) translateY(-3px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes connDraw { 0%{stroke-dashoffset:800} 100%{stroke-dashoffset:0} }
        @keyframes ripple { 0%{transform:scale(0);opacity:0.9} 100%{transform:scale(2.8);opacity:0} }
        @keyframes toastIn { 0%{transform:translateY(24px) translateX(-50%);opacity:0} 100%{transform:translateY(0) translateX(-50%);opacity:1} }
        @keyframes activePulse { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.5)} 50%{box-shadow:0 0 0 12px rgba(16,185,129,0)} }
        @keyframes glowBlink { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes wordIn { 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes sceneBadge { 0%{opacity:0;transform:translateX(12px)} 100%{opacity:1;transform:translateX(0)} }
        @keyframes successPop { 0%{transform:scale(0)} 65%{transform:scale(1.25)} 100%{transform:scale(1)} }
        @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
        .node-enter { animation: nodeIn 0.52s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .conn-path { stroke-dasharray: 800; animation: connDraw 0.6s cubic-bezier(0.4,0,0.2,1) forwards; }
        .success-badge { animation: successPop 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .toast-enter { animation: toastIn 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .scene-badge { animation: sceneBadge 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* Controls */}
      <div style={{ marginBottom: 14, display: "flex", gap: 8, zIndex: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {(["youtube", "tiktok"] as Format[]).map(f => (
          <button key={f} onClick={() => setFormat(f)}
            style={{ padding: ".42rem 1rem", borderRadius: 8, border: `1.5px solid ${format === f ? "#6366F1" : "rgba(255,255,255,0.15)"}`, background: format === f ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.05)", color: format === f ? "#A5B4FC" : "rgba(255,255,255,0.4)", fontSize: ".8rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>
            {f === "youtube" ? "▶ YouTube 16:9" : "TikTok 9:16"}
          </button>
        ))}
        {(["fr", "en"] as Lang[]).map(l => (
          <button key={l} onClick={() => setLang(l)}
            style={{ padding: ".42rem 1rem", borderRadius: 8, border: `1.5px solid ${lang === l ? "#10B981" : "rgba(255,255,255,0.15)"}`, background: lang === l ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.05)", color: lang === l ? "#6EE7B7" : "rgba(255,255,255,0.4)", fontSize: ".8rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>
            {l === "fr" ? "🇫🇷 FR" : "🇬🇧 EN"}
          </button>
        ))}
        <button onClick={() => { cancelRef.current = true; setTimeout(() => runLoop(), 80); }}
          style={{ padding: ".42rem 1rem", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", fontSize: ".8rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          ↺ {lang === "fr" ? "Rejouer" : "Replay"}
        </button>
      </div>

      {/* Viewport */}
      <div ref={wrapRef} style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top center", position: "relative", overflow: "hidden", borderRadius: 20, boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 48px 140px rgba(0,0,0,0.85), 0 0 100px rgba(99,102,241,0.18)" }}>

        {/* BG */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(140deg, #08001f 0%, #0d0230 50%, #120540 100%)" }}>
          <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.28) 0%, transparent 68%)", filter: "blur(90px)", top: -250, left: "42%", transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 68%)", filter: "blur(80px)", bottom: 0, right: 60 }} />
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 68%)", filter: "blur(60px)", top: "40%", left: 100 }} />
        </div>

        {/* NAV */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 54, background: "rgba(8,0,25,0.82)", backdropFilter: "blur(28px)", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, zIndex: 30 }}>
          <div style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.03em", color: "#fff", flexShrink: 0 }}>
            Loop<span style={{ color: "#818CF8" }}>flo</span>
          </div>
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ fontSize: ".78rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{workflowName}</div>
          {isActive && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".68rem", fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", padding: ".18rem .55rem", borderRadius: 100, animation: "activePulse 2s infinite" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
              {lang === "fr" ? "ACTIF" : "ACTIVE"}
            </div>
          )}
          <div style={{ flex: 1 }} />
          {[
            { label: lang === "fr" ? "Sauvegarder" : "Save",   active: savePulse,   tc: "#fff" },
            { label: lang === "fr" ? "Tester ▶"   : "Test ▶", active: testPulse,   tc: "#10B981" },
            { label: lang === "fr" ? "Activer ⚡"  : "Activate ⚡", active: activePulse, tc: "#A5B4FC" },
          ].map(btn => (
            <div key={btn.label} style={{ padding: ".32rem .85rem", borderRadius: 8, background: btn.active ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: btn.active ? btn.tc : "rgba(255,255,255,0.55)", fontSize: ".75rem", fontWeight: 700, backdropFilter: "blur(10px)", transition: "all .3s" }}>
              {btn.label}
            </div>
          ))}
        </div>

        {/* SIDEBAR */}
        <div style={{ position: "absolute", top: 54, left: 0, width: 205, bottom: 0, background: "rgba(255,255,255,0.025)", borderRight: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(24px)", zIndex: 20, padding: "14px 8px", overflowY: "auto" }}>
          {[
            { title: lang === "fr" ? "Déclencheurs" : "Triggers", items: SIDEBAR_BLOCKS.slice(0, 2) },
            { title: "Actions",                                    items: SIDEBAR_BLOCKS.slice(2) },
          ].map(group => (
            <div key={group.title} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: ".58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,0.28)", marginBottom: 6, paddingLeft: 6 }}>{group.title}</p>
              {group.items.map(b => {
                const hl = highlightSidebar === b.id;
                return (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 8, marginBottom: 3, border: `1px solid ${hl ? b.color + "60" : "rgba(255,255,255,0.07)"}`, background: hl ? b.color + "18" : "rgba(255,255,255,0.035)", transition: "all .22s", transform: hl ? "scale(1.02)" : "scale(1)" }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: b.color + "22", border: `1px solid ${b.color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <NodeIcon icon={b.icon} color={b.color} size={11} />
                    </div>
                    <span style={{ fontSize: ".72rem", fontWeight: 600, color: hl ? "#fff" : "rgba(255,255,255,0.6)" }}>{b.label}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* CANVAS */}
        <div style={{ position: "absolute", top: 54, left: 205, right: 0, bottom: 0, overflow: "hidden" }}>
          {/* Dot grid */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />

          {/* Cinematic camera layer */}
          <div style={{ position: "absolute", inset: 0, transformOrigin: "center center", transform: `scale(${camScale}) translate(${camTx}px, ${camTy}px)`, transition: "transform 1.1s cubic-bezier(0.25,0.46,0.45,0.94)", willChange: "transform" }}>

            {/* AI prompt bar */}
            <div style={{ position: "absolute", top: 14, left: 14, right: 14, height: 42, background: "rgba(255,255,255,0.055)", backdropFilter: "blur(20px)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, padding: "0 13px" }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6H15L10.5 9L12 14L8 11L4 14L5.5 9L1 6H6.5L8 1Z" fill="white"/></svg>
              </div>
              <span style={{ fontSize: ".75rem", color: "rgba(255,255,255,0.65)", fontWeight: 500, flex: 1 }}>
                {promptText}
                {promptTyping && <span style={{ display: "inline-block", width: 2, height: 11, background: "#818CF8", marginLeft: 1, verticalAlign: "middle", animation: "glowBlink 0.7s infinite" }} />}
              </span>
            </div>

            {/* SVG connections */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}>
              <defs>
                <filter id="glow2">
                  <feGaussianBlur stdDeviation="3.5" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              {sc.conns.map(conn => {
                if (!visConns.has(conn.id)) return null;
                // offset: canvas left=205, top=54 — we're inside the canvas div
                const path = bezierPath(sc.nodes, conn.fromId, conn.toId);
                // translate coords: nodes are in 1280×720 space, canvas starts at x=205
                // We need to offset nodes relative to canvas (subtract 205 from cx)
                const fromN = sc.nodes.find(n => n.id === conn.fromId)!;
                const toN   = sc.nodes.find(n => n.id === conn.toId)!;
                const x1 = fromN.cx - 205 + 80, y1 = fromN.cy - 54;
                const x2 = toN.cx   - 205 - 80, y2 = toN.cy   - 54;
                const cx1 = x1 + (x2 - x1) * 0.5;
                const adjustedPath = `M ${x1} ${y1} C ${cx1} ${y1} ${cx1} ${y2} ${x2} ${y2}`;
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2 - 12;
                return (
                  <g key={conn.id}>
                    <path d={adjustedPath} stroke={conn.color} strokeWidth="10" fill="none" opacity="0.08" />
                    <path d={adjustedPath} stroke={conn.color} strokeWidth="1.8" fill="none" opacity="0.75" className="conn-path" filter="url(#glow2)" strokeLinecap="round" />
                    <circle r="3.5" fill={conn.color} opacity="0.9" filter="url(#glow2)">
                      <animateMotion dur="0.01s" fill="freeze" path={adjustedPath} />
                    </circle>
                    {(conn.labelFr || conn.labelEn) && (
                      <text x={midX} y={midY} fontSize="9" fontWeight="800" fill={conn.color} opacity="0.95" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">
                        {lang === "fr" ? conn.labelFr : conn.labelEn}
                      </text>
                    )}
                    {flowConns.has(conn.id) && (
                      <g key={`fp-${conn.id}-${flowKey}`}>
                        {[0, 0.35, 0.7].map((delay, pi) => (
                          <circle key={pi} r="4.5" fill={conn.color} filter="url(#glow2)" opacity="0.9">
                            <animateMotion dur="0.95s" begin={`${delay}s`} repeatCount="4" path={adjustedPath} />
                          </circle>
                        ))}
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {sc.nodes.map(node => {
              const vis  = visNodes.has(node.id);
              const succ = successNodes.has(node.id);
              // offset node from canvas origin
              const nx = node.cx - 205 - 80;
              const ny = node.cy - 54 - 28;
              return (
                <div key={node.id} className={vis ? "node-enter" : ""}
                  style={{ position: "absolute", left: nx, top: ny, width: 160, height: 56, opacity: vis ? 1 : 0, pointerEvents: "none" }}>
                  <div style={{
                    width: "100%", height: "100%",
                    background: succ
                      ? `linear-gradient(145deg, rgba(255,255,255,0.09) 0%, ${node.color}22 100%)`
                      : "rgba(255,255,255,0.065)",
                    backdropFilter: "blur(28px) saturate(200%)",
                    border: `1.5px solid ${succ ? node.color + "aa" : "rgba(255,255,255,0.14)"}`,
                    borderRadius: 14,
                    display: "flex", alignItems: "center", padding: "0 11px", gap: 9,
                    boxShadow: succ
                      ? `0 0 30px ${node.color}28, 0 8px 28px rgba(0,0,0,0.45), inset 0 1.5px 0 rgba(255,255,255,0.14)`
                      : "0 8px 28px rgba(0,0,0,0.4), inset 0 1.5px 0 rgba(255,255,255,0.07)",
                    transition: "border .35s, box-shadow .35s, background .35s",
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: node.color + "25", border: `1px solid ${node.color}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <NodeIcon icon={node.icon} color={node.color} size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#fff" }}>{node.label}</div>
                      <div style={{ fontSize: ".62rem", color: "rgba(255,255,255,0.42)", marginTop: 1 }}>{lang === "fr" ? node.descFr : node.descEn}</div>
                    </div>
                    {succ && (
                      <div className="success-badge" style={{ width: 18, height: 18, borderRadius: "50%", background: node.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          </div>{/* /camera layer */}

          {/* Toast */}
          {showToast && (
            <div className="toast-enter" style={{ position: "absolute", bottom: 32, left: "50%", background: "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(5,150,105,0.09))", backdropFilter: "blur(28px)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 16, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 0 48px rgba(16,185,129,0.2), 0 10px 36px rgba(0,0,0,0.45)", zIndex: 40 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(16,185,129,0.2)", border: "1.5px solid rgba(16,185,129,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5 6.5-6.5" stroke="#10B981" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#fff" }}>
                  {lang === "fr" ? "Workflow exécuté avec succès !" : "Workflow executed successfully!"}
                </div>
                <div style={{ fontSize: ".67rem", color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                  {sc.nodes.length} {lang === "fr" ? "blocs · 0 erreur" : "blocks · 0 errors"}
                </div>
              </div>
            </div>
          )}

          {/* Scenario badge */}
          <div key={scenarioIdx} className="scene-badge" style={{ position: "absolute", top: 16, right: 14, background: "rgba(99,102,241,0.18)", backdropFilter: "blur(16px)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 100, padding: ".22rem .8rem", display: "flex", alignItems: "center", gap: 6, zIndex: 40 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {SCENARIOS.map((_, i) => (
                <div key={i} style={{ width: i === scenarioIdx ? 16 : 5, height: 5, borderRadius: 100, background: i === scenarioIdx ? "#818CF8" : "rgba(255,255,255,0.2)", transition: "all .4s cubic-bezier(0.34,1.56,0.64,1)" }} />
              ))}
            </div>
            <span style={{ fontSize: ".68rem", fontWeight: 700, color: "#A5B4FC" }}>{scenarioIdx + 1}/{SCENARIOS.length}</span>
          </div>

        </div>{/* /canvas */}

        {/* CAPTION — bottom third */}
        {captionText && (
          <div key={captionKey} style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 60px 32px", background: "linear-gradient(to top, rgba(8,0,25,0.92) 0%, rgba(8,0,25,0.6) 60%, transparent 100%)", zIndex: 50, textAlign: "center" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.3, textShadow: "0 2px 20px rgba(0,0,0,0.8), 0 0 40px rgba(99,102,241,0.4)" }}>
              <Caption text={captionText} lang={lang} />
            </div>
          </div>
        )}

        {/* CURSOR TRAIL */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9990, overflow: "visible" }}>
          {trail.map((pos, i) => (
            <circle key={i} cx={pos.x} cy={pos.y} r={3.5 - i * 0.28}
              fill="#818CF8"
              opacity={((i + 1) / trail.length) * 0.35}
              style={{ filter: "blur(1px)" }}
            />
          ))}
        </svg>

        {/* CURSOR */}
        <div style={{ position: "absolute", left: curX, top: curY, zIndex: 9999, pointerEvents: "none", transition: "left 0.68s cubic-bezier(0.25,0.46,0.45,0.94), top 0.68s cubic-bezier(0.25,0.46,0.45,0.94)", transform: "translate(-3px,-2px)" }}>
          <svg width="22" height="26" viewBox="0 0 22 26" fill="none" style={{ filter: "drop-shadow(0 2px 10px rgba(99,102,241,0.7)) drop-shadow(0 0 4px rgba(168,85,247,0.5))" }}>
            <path d="M2 2L20 11L12.5 13.5L9 23L2 2Z" fill="url(#cg)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.1" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="cg" x1="2" y1="2" x2="20" y2="23" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6366F1"/>
                <stop offset="100%" stopColor="#A855F7"/>
              </linearGradient>
            </defs>
          </svg>
          {clicking && (
            <div style={{ position: "absolute", top: -14, left: -14, width: 50, height: 50, borderRadius: "50%", border: "2.5px solid #818CF8", animation: "ripple 0.38s ease-out forwards", pointerEvents: "none" }} />
          )}
          {clicking && (
            <div style={{ position: "absolute", top: -8, left: -8, width: 38, height: 38, borderRadius: "50%", border: "1.5px solid rgba(168,85,247,0.6)", animation: "ripple 0.38s ease-out 0.06s forwards", pointerEvents: "none" }} />
          )}
        </div>

        {/* FADE TRANSITION */}
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fadeOut, pointerEvents: "none", zIndex: 10000, transition: "opacity 0.6s ease-in-out" }} />

      </div>

      <p style={{ marginTop: 14, fontSize: ".7rem", color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
        {lang === "fr" ? "Enregistrez avec OBS ou QuickTime" : "Record with OBS or QuickTime"} · {format === "youtube" ? "1280×720 — YouTube 16:9" : "720×1280 — TikTok 9:16"}
      </p>
    </div>
  );
}
