"use client";
import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Mail, Clock, Sheet, MessageSquare, FileText,
  Globe, Filter, Sparkles, Play, Save, ArrowLeft,
  Plus, Webhook, Loader2, Wand2, Settings, X,
} from "lucide-react";

const nodeBlocks = {
  triggers: [
    { type: "gmail", label: "Gmail", desc: "Nouvel email reçu", icon: Mail, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
    { type: "webhook", label: "Webhook", desc: "Requête HTTP entrante", icon: Webhook, color: "#D97706", bg: "#FFF7ED", border: "#FDE68A" },
    { type: "schedule", label: "Planifié", desc: "Exécution programmée", icon: Clock, color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
  ],
  actions: [
    { type: "sheets", label: "Google Sheets", desc: "Ajouter une ligne", icon: Sheet, color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
    { type: "slack", label: "Slack", desc: "Envoyer un message", icon: MessageSquare, color: "#7C3AED", bg: "#FDF4FF", border: "#E9D5FF" },
    { type: "notion", label: "Notion", desc: "Créer une page", icon: FileText, color: "#0A0A0A", bg: "#F9FAFB", border: "#E5E7EB" },
    { type: "http", label: "HTTP Request", desc: "Appel API externe", icon: Globe, color: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD" },
  ],
  ai: [
    { type: "ai_filter", label: "Filtre IA", desc: "Analyser et filtrer", icon: Filter, color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
    { type: "ai_generate", label: "Générer texte", desc: "Créer du contenu IA", icon: Sparkles, color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
  ],
};

const allBlocks = [...nodeBlocks.triggers, ...nodeBlocks.actions, ...nodeBlocks.ai];

const iconMap: Record<string, React.ElementType> = {
  gmail: Mail, webhook: Webhook, schedule: Clock,
  sheets: Sheet, slack: MessageSquare, notion: FileText,
  http: Globe, ai_filter: Filter, ai_generate: Sparkles,
  Gmail: Mail, Webhook: Webhook, Planifié: Clock,
  "Google Sheets": Sheet, Slack: MessageSquare, Notion: FileText,
  "HTTP Request": Globe, "Filtre IA": Filter, "Générer texte": Sparkles,
};

const styleMap: Record<string, { color: string; bg: string; border: string }> = {
  gmail: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  webhook: { color: "#D97706", bg: "#FFF7ED", border: "#FDE68A" },
  schedule: { color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
  sheets: { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  slack: { color: "#7C3AED", bg: "#FDF4FF", border: "#E9D5FF" },
  notion: { color: "#0A0A0A", bg: "#F9FAFB", border: "#E5E7EB" },
  http: { color: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD" },
  ai_filter: { color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
  ai_generate: { color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
};

type NodeConfig = Record<string, string>;

type NodeData = {
  label: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
  IconComponent?: React.ElementType;
  config?: NodeConfig;
  onConfigure?: (id: string) => void;
};

function getIcon(label: string): React.ElementType {
  return iconMap[label] || Globe;
}

function CustomNode({ id, data }: { id: string; data: NodeData }) {
  const { label, desc, color, bg, border, config, onConfigure } = data;
  const { setNodes } = useReactFlow();
  const IconComponent = getIcon(label);
  function deleteNode() { setNodes((nds) => nds.filter((n) => n.id !== id)); }
  const hasConfig = config && Object.values(config).some(v => v && v.trim() !== "");

  return (
    <div style={{ background: bg, border: `1.5px solid ${hasConfig ? color : border}`, borderRadius: 12, padding: "12px 16px", minWidth: 200, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative" }}>
      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10, background: "#4F46E5", border: "2px solid #fff", borderRadius: "50%" }} />
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10, background: "#4F46E5", border: "2px solid #fff", borderRadius: "50%" }} />
      <button onClick={deleteNode} style={{ position: "absolute", top: -8, right: -8, width: 18, height: 18, borderRadius: "50%", background: "#EF4444", border: "2px solid #fff", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 10 }}>×</button>
      <button onClick={() => onConfigure && onConfigure(id)} style={{ position: "absolute", top: -8, left: -8, width: 18, height: 18, borderRadius: "50%", background: hasConfig ? color : "#6B7280", border: "2px solid #fff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 10 }} title="Configurer">
        <Settings size={9} strokeWidth={2.5} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#fff", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IconComponent size={14} color={color} strokeWidth={2} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0A0A0A" }}>{label}</span>
        {hasConfig && <span style={{ fontSize: 9, fontWeight: 700, background: color, color: "#fff", padding: "1px 5px", borderRadius: "100px", marginLeft: "auto" }}>✓</span>}
      </div>
      <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, marginLeft: 36 }}>{desc}</p>
      {hasConfig && config && (
        <div style={{ marginTop: 8, marginLeft: 36, fontSize: 10, color: color, fontWeight: 600, lineHeight: 1.6 }}>
          {Object.entries(config).filter(([, v]) => v).slice(0, 2).map(([k, v]) => (
            <div key={k} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{k}: {v}</div>
          ))}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

const initialNodes: Node[] = [
  {
    id: "1",
    type: "custom",
    position: { x: 80, y: 180 },
    data: { label: "Gmail", desc: "Nouvel email reçu", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", config: {} },
  },
];

const configFields: Record<string, { key: string; label: string; placeholder: string; rows?: number }[]> = {
  Gmail: [
    { key: "to", label: "Envoyer vers (email destinataire)", placeholder: "ex: equipe@monentreprise.com" },
    { key: "subject", label: "Sujet de l'email", placeholder: "ex: Nouvelle notification Loopflo" },
    { key: "body", label: "Contenu de l'email", placeholder: "ex: Données reçues : {{message}}", rows: 3 },
  ],
  Webhook: [
    { key: "description", label: "Description du déclencheur", placeholder: "ex: Paiement Stripe reçu" },
  ],
  Planifié: [
    { key: "frequency", label: "Fréquence", placeholder: "ex: Tous les jours à 9h" },
    { key: "timezone", label: "Fuseau horaire", placeholder: "ex: Europe/Paris" },
  ],
  "Google Sheets": [
    { key: "spreadsheet_url", label: "URL Google Sheets", placeholder: "https://docs.google.com/spreadsheets/d/..." },
    { key: "sheet_name", label: "Nom de la feuille", placeholder: "ex: Feuille1" },
    { key: "columns", label: "Colonnes à remplir", placeholder: "ex: A=date, B=nom, C=email" },
  ],
  Slack: [
    { key: "channel", label: "Canal Slack", placeholder: "ex: #general" },
    { key: "message", label: "Message", placeholder: "ex: Nouveau lead : {{nom}}", rows: 3 },
    { key: "webhook_url", label: "URL Webhook Slack", placeholder: "https://hooks.slack.com/services/..." },
  ],
  Notion: [
    { key: "database_id", label: "ID de la base Notion", placeholder: "ex: abc123..." },
    { key: "title", label: "Titre", placeholder: "ex: Nouvelle tâche : {{sujet}}" },
  ],
  "HTTP Request": [
    { key: "url", label: "URL", placeholder: "https://api.exemple.com/endpoint" },
    { key: "method", label: "Méthode", placeholder: "POST" },
    { key: "headers", label: "Headers JSON", placeholder: '{"Authorization": "Bearer token"}' },
    { key: "body", label: "Corps JSON", placeholder: '{"key": "{{value}}"}', rows: 3 },
  ],
  "Filtre IA": [
    { key: "condition", label: "Condition", placeholder: "ex: Est-ce une facture ?", rows: 2 },
    { key: "action_if_yes", label: "Action si OUI", placeholder: "ex: Continuer" },
    { key: "action_if_no", label: "Action si NON", placeholder: "ex: Arrêter" },
  ],
  "Générer texte": [
    { key: "prompt", label: "Prompt IA", placeholder: "ex: Rédige un email basé sur : {{message}}", rows: 4 },
    { key: "language", label: "Langue", placeholder: "ex: Français" },
  ],
};

function WorkflowEditor() {
  const [userPlan, setUserPlan] = useState<string>("free");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [workflowId, setWorkflowId] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [workflowName, setWorkflowName] = useState("Mon workflow");
  const [editingName, setEditingName] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showAiBar, setShowAiBar] = useState(false);
  const [configNodeId, setConfigNodeId] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<NodeConfig>({});

  useEffect(() => {
    fetch("/api/user/plan").then(r => r.json()).then(d => setUserPlan(d.plan || "free"));
  }, []);

  function openConfig(id: string) {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    setConfigValues((node.data as NodeData).config || {});
    setConfigNodeId(id);
  }

  function saveConfig() {
    if (!configNodeId) return;
    setNodes(nds => nds.map(n => n.id !== configNodeId ? n : { ...n, data: { ...n.data, config: { ...configValues } } }));
    setConfigNodeId(null);
  }

  const nodesWithConfig = nodes.map(n => ({ ...n, data: { ...n.data, onConfigure: openConfig } }));

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: "#818CF8", strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  function addNode(block: typeof allBlocks[0]) {
    const id = `node_${Date.now()}`;
    setNodes(nds => [...nds, {
      id, type: "custom",
      position: { x: 150 + Math.random() * 250, y: 100 + Math.random() * 200 },
      data: { label: block.label, desc: block.desc, color: block.color, bg: block.bg, border: block.border, config: {} },
    }]);
  }

  async function generateWithAI() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai/generate-workflow", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newNodes: Node[] = data.nodes.map((n: { type: string; label: string; desc: string }, i: number) => {
        const style = styleMap[n.type] || styleMap.http;
        return { id: `ai_${Date.now()}_${i}`, type: "custom", position: { x: 80 + i * 220, y: 180 }, data: { label: n.label, desc: n.desc, ...style, config: {} } };
      });
      const newEdges: Edge[] = newNodes.slice(0, -1).map((node, i) => ({
        id: `edge_${i}`, source: node.id, target: newNodes[i + 1].id, animated: true, style: { stroke: "#818CF8", strokeWidth: 2 },
      }));
      setNodes(newNodes);
      setEdges(newEdges);
      setAiPrompt("");
      setShowAiBar(false);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Erreur lors de la génération.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave() {
    try {
      // Nettoyer les nœuds — enlever IconComponent et onConfigure non sérialisables
      const cleanNodes = nodes.map(n => ({
        ...n,
        data: {
          label: (n.data as NodeData).label,
          desc: (n.data as NodeData).desc,
          color: (n.data as NodeData).color,
          bg: (n.data as NodeData).bg,
          border: (n.data as NodeData).border,
          config: (n.data as NodeData).config || {},
        }
      }));

      const res = await fetch("/api/workflows", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: workflowId, name: workflowName, data: { nodes: cleanNodes, edges } }),
      });
      const data = await res.json();
      if (res.ok) {
        setWorkflowId(data.id);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        alert(data.error);
      }
    } catch {
      alert("Erreur lors de la sauvegarde.");
    }
  }

  async function handleActivate() {
    if (!workflowId) { alert("Sauvegardez d'abord le workflow !"); return; }
    const newActive = !active;
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive }),
      });
      const data = await res.json();
      setActive(newActive);
      if (data.webhookUrl) setWebhookUrl(data.webhookUrl);
      else if (!newActive) setWebhookUrl(null);
    } catch { alert("Erreur lors de l'activation."); }
  }

  function copyWebhook() {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const configNode = configNodeId ? nodes.find(n => n.id === configNodeId) : null;
  const configNodeData = configNode?.data as NodeData | undefined;
  const fields = configNodeData ? configFields[configNodeData.label] || [] : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; }
        .block-item { transition: transform 0.15s, box-shadow 0.15s; }
        .block-item:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; }
        .block-item:active { transform: scale(0.97); }
        .sidebar-label { font-size:.68rem; font-weight:700; color:#9CA3AF; text-transform:uppercase; letter-spacing:.1em; margin:1.25rem 0 .6rem; }
        .react-flow__attribution { display:none !important; }
        .react-flow__controls { box-shadow:0 2px 8px rgba(0,0,0,0.08) !important; border:1px solid #E5E7EB !important; border-radius:10px !important; overflow:hidden; }
        .react-flow__minimap { border:1px solid #E5E7EB !important; border-radius:10px !important; overflow:hidden; }
        .ai-bar-overlay { position:fixed; top:52px; left:220px; right:0; bottom:0; background:rgba(0,0,0,0.2); z-index:200; display:flex; align-items:flex-start; justify-content:center; padding-top:60px; }
        .ai-bar-modal { background:#fff; border:1px solid #E5E7EB; border-radius:16px; padding:1.5rem; width:100%; max-width:560px; box-shadow:0 8px 32px rgba(0,0,0,0.12); }
        .ai-input { width:100%; padding:.85rem 1rem; border:1.5px solid #C7D2FE; border-radius:10px; font-size:.9rem; font-family:inherit; outline:none; background:#F5F3FF; color:#0A0A0A; resize:none; }
        .ai-input:focus { border-color:#818CF8; box-shadow:0 0 0 3px #EEF2FF; }
        .workflow-name-input { background:none; border:none; outline:none; font-family:'Plus Jakarta Sans',sans-serif; font-size:.9rem; font-weight:700; color:#0A0A0A; width:200px; border-bottom:2px solid #4F46E5; padding-bottom:2px; }
        .config-input { width:100%; padding:.6rem .75rem; border:1px solid #E5E7EB; border-radius:8px; font-size:.82rem; font-family:inherit; outline:none; background:#FAFAFA; color:#0A0A0A; resize:vertical; }
        .config-input:focus { border-color:#818CF8; box-shadow:0 0 0 3px #EEF2FF; background:#fff; }
      `}</style>

      {/* NAV */}
      <nav style={{ background:"#fff", borderBottom:"1px solid #E5E7EB", padding:".75rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"fixed", top:0, left:0, right:0, zIndex:100, height:52 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <a href="/dashboard" style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", color:"#6B7280", textDecoration:"none", padding:".4rem .6rem", borderRadius:8, border:"1px solid #E5E7EB" }}>
            <ArrowLeft size={13} strokeWidth={2} /> Retour
          </a>
          {editingName ? (
            <input className="workflow-name-input" value={workflowName} onChange={e => setWorkflowName(e.target.value)} onBlur={() => setEditingName(false)} onKeyDown={e => e.key === "Enter" && setEditingName(false)} autoFocus />
          ) : (
            <span onClick={() => setEditingName(true)} style={{ fontSize:".9rem", fontWeight:700, color:"#0A0A0A", cursor:"pointer", padding:".2rem .4rem", borderRadius:6 }}>{workflowName}</span>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".75rem", color:"#9CA3AF" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background: active ? "#10B981" : "#9CA3AF" }}></div>
            {active ? "Actif" : `${nodes.length} nœud${nodes.length > 1 ? "s" : ""}`}
          </div>
        </div>
        <div style={{ display:"flex", gap:".6rem", alignItems:"center" }}>
          {userPlan === "free" ? (
            <div style={{ position:"relative" }}>
              <button onClick={() => setShowUpgradeModal(true)} style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:600, background:"#E5E7EB", border:"none", color:"#9CA3AF", padding:".5rem 1rem", borderRadius:8, cursor:"pointer", fontFamily:"inherit" }}>
                <Wand2 size={13} strokeWidth={2} /> Générer avec l&apos;IA
              </button>
              <span style={{ position:"absolute", top:-6, right:-6, background:"#4F46E5", color:"#fff", fontSize:".6rem", fontWeight:700, padding:".1rem .4rem", borderRadius:"100px", pointerEvents:"none" }}>PRO</span>
            </div>
          ) : (
            <button onClick={() => setShowAiBar(true)} style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:600, background:"#4F46E5", border:"none", color:"#fff", padding:".5rem 1rem", borderRadius:8, cursor:"pointer", fontFamily:"inherit" }}>
              <Wand2 size={13} strokeWidth={2} /> Générer avec l&apos;IA
            </button>
          )}
          <button onClick={handleSave} style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:600, background: saved ? "#ECFDF5" : "#F9FAFB", border:`1px solid ${saved ? "#A7F3D0" : "#E5E7EB"}`, color: saved ? "#059669" : "#374151", padding:".5rem 1rem", borderRadius:8, cursor:"pointer", fontFamily:"inherit", transition:"all .2s" }}>
            <Save size={13} strokeWidth={2} /> {saved ? "Sauvegardé !" : "Sauvegarder"}
          </button>
          <button onClick={handleActivate} style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:600, background: active ? "#059669" : "#0A0A0A", border:"none", color:"#fff", padding:".5rem 1rem", borderRadius:8, cursor:"pointer", fontFamily:"inherit", transition:"background .2s" }}>
            <Play size={13} strokeWidth={2} /> {active ? "Actif ✓" : "Activer"}
          </button>
        </div>
      </nav>

      {/* BARRE WEBHOOK */}
      {webhookUrl && (
        <div style={{ position:"fixed", top:52, left:220, right:0, zIndex:98, background:"#ECFDF5", borderBottom:"1px solid #A7F3D0", padding:".65rem 1.5rem", display:"flex", alignItems:"center", gap:"1rem" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#10B981", flexShrink:0 }}></div>
          <span style={{ fontSize:".8rem", color:"#065F46", fontWeight:600, whiteSpace:"nowrap" }}>URL Webhook :</span>
          <code style={{ fontSize:".75rem", background:"#D1FAE5", padding:".2rem .6rem", borderRadius:6, color:"#065F46", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{webhookUrl}</code>
          <button onClick={copyWebhook} style={{ fontSize:".75rem", fontWeight:600, color: copied ? "#059669" : "#065F46", background:"none", border:"1px solid #6EE7B7", padding:".3rem .7rem", borderRadius:6, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
            {copied ? "Copié ✓" : "Copier"}
          </button>
        </div>
      )}

      {/* MODALE UPGRADE */}
      {showUpgradeModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setShowUpgradeModal(false)}>
          <div style={{ background:"#fff", borderRadius:16, padding:"2rem", maxWidth:420, width:"90%", boxShadow:"0 8px 32px rgba(0,0,0,0.12)", fontFamily:"'Plus Jakarta Sans',sans-serif" }} onClick={e => e.stopPropagation()}>
            <div style={{ width:48, height:48, borderRadius:12, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
              <Wand2 size={22} color="#4F46E5" strokeWidth={2} />
            </div>
            <h2 style={{ fontSize:"1.1rem", fontWeight:800, textAlign:"center", marginBottom:".5rem", color:"#0A0A0A" }}>Fonctionnalité Pro</h2>
            <p style={{ fontSize:".875rem", color:"#6B7280", textAlign:"center", lineHeight:1.7, marginBottom:"1.5rem" }}>
              La génération par IA est disponible à partir du plan <strong style={{ color:"#0A0A0A" }}>Starter</strong>.
            </p>
            <div style={{ background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:10, padding:"1rem", marginBottom:"1.5rem" }}>
              {[{ plan:"Starter", price:"7€/mois", color:"#059669", bg:"#ECFDF5", desc:"IA + workflows illimités" }, { plan:"Pro", price:"19€/mois", color:"#4F46E5", bg:"#EEF2FF", desc:"Tout Starter + monitoring" }].map(p => (
                <div key={p.plan} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:".6rem 0", borderBottom:"1px solid #F3F4F6" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:".5rem" }}>
                    <span style={{ fontSize:".72rem", fontWeight:700, background:p.bg, color:p.color, padding:".2rem .6rem", borderRadius:"100px" }}>{p.plan}</span>
                    <span style={{ fontSize:".75rem", color:"#9CA3AF" }}>{p.desc}</span>
                  </div>
                  <span style={{ fontSize:".9rem", fontWeight:800, color:p.color }}>{p.price}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowUpgradeModal(false)} style={{ width:"100%", padding:".75rem", borderRadius:10, fontSize:".9rem", fontWeight:600, background:"#4F46E5", color:"#fff", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Compris →</button>
          </div>
        </div>
      )}

      {/* PANNEAU CONFIG */}
      {configNodeId && configNodeData && (
        <div style={{ position:"fixed", top:52, right:0, bottom:0, width:320, background:"#fff", borderLeft:"1px solid #E5E7EB", zIndex:150, display:"flex", flexDirection:"column", boxShadow:"-4px 0 16px rgba(0,0,0,0.06)" }}>
          <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#FAFAFA" }}>
            <div style={{ display:"flex", alignItems:"center", gap:".6rem" }}>
              <div style={{ width:28, height:28, borderRadius:7, background:configNodeData.bg, border:`1px solid ${configNodeData.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {(() => { const Icon = getIcon(configNodeData.label); return <Icon size={13} color={configNodeData.color} strokeWidth={2} />; })()}
              </div>
              <div>
                <p style={{ fontSize:".85rem", fontWeight:700, color:"#0A0A0A" }}>Configurer</p>
                <p style={{ fontSize:".72rem", color:"#9CA3AF" }}>{configNodeData.label}</p>
              </div>
            </div>
            <button onClick={() => setConfigNodeId(null)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, borderRadius:6, color:"#6B7280" }}>
              <X size={16} strokeWidth={2} />
            </button>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"1rem 1.25rem" }}>
            {fields.length === 0 ? (
              <p style={{ fontSize:".85rem", color:"#9CA3AF", textAlign:"center", marginTop:"2rem" }}>Aucune configuration pour ce nœud.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:8, padding:".6rem .75rem", fontSize:".75rem", color:"#4F46E5", fontWeight:500 }}>
                  💡 Utilisez {`{{variable}}`} pour insérer des données des étapes précédentes
                </div>
                {fields.map(field => (
                  <div key={field.key}>
                    <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".35rem" }}>{field.label}</label>
                    {field.rows ? (
                      <textarea className="config-input" rows={field.rows} placeholder={field.placeholder} value={configValues[field.key] || ""} onChange={e => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))} />
                    ) : (
                      <input type="text" className="config-input" placeholder={field.placeholder} value={configValues[field.key] || ""} onChange={e => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ padding:"1rem 1.25rem", borderTop:"1px solid #F3F4F6", display:"flex", gap:".75rem" }}>
            <button onClick={() => setConfigNodeId(null)} style={{ flex:1, padding:".65rem", borderRadius:8, fontSize:".85rem", fontWeight:600, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#374151", cursor:"pointer", fontFamily:"inherit" }}>Annuler</button>
            <button onClick={saveConfig} style={{ flex:2, padding:".65rem", borderRadius:8, fontSize:".85rem", fontWeight:600, background:"#4F46E5", border:"none", color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>Sauvegarder ✓</button>
          </div>
        </div>
      )}

      {/* MODAL IA */}
      {showAiBar && (
        <div className="ai-bar-overlay" onClick={() => setShowAiBar(false)}>
          <div className="ai-bar-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", gap:".75rem", marginBottom:"1rem" }}>
              <div style={{ width:32, height:32, borderRadius:9, background:"#4F46E5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Wand2 size={15} color="#fff" strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize:".9rem", fontWeight:700, color:"#0A0A0A" }}>Générer un workflow avec l&apos;IA</p>
                <p style={{ fontSize:".75rem", color:"#9CA3AF" }}>Décrivez votre automatisation en français</p>
              </div>
            </div>
            <textarea className="ai-input" rows={3} placeholder="Ex: Quand je reçois un webhook, envoie un email à mon équipe" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && generateWithAI()} autoFocus />
            {aiError && <p style={{ fontSize:".8rem", color:"#DC2626", marginTop:".5rem" }}>{aiError}</p>}
            <div style={{ display:"flex", gap:".75rem", marginTop:"1rem", justifyContent:"flex-end" }}>
              <button onClick={() => setShowAiBar(false)} style={{ fontSize:".85rem", fontWeight:600, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#374151", padding:".6rem 1.25rem", borderRadius:8, cursor:"pointer", fontFamily:"inherit" }}>Annuler</button>
              <button onClick={generateWithAI} disabled={aiLoading || !aiPrompt.trim()} style={{ display:"flex", alignItems:"center", gap:".5rem", fontSize:".85rem", fontWeight:600, background: aiLoading ? "#9CA3AF" : "#4F46E5", border:"none", color:"#fff", padding:".6rem 1.25rem", borderRadius:8, cursor: aiLoading ? "not-allowed" : "pointer", fontFamily:"inherit" }}>
                {aiLoading ? <Loader2 size={13} strokeWidth={2} /> : <Wand2 size={13} strokeWidth={2} />}
                {aiLoading ? "Génération..." : "Générer →"}
              </button>
            </div>
            <div style={{ marginTop:"1rem", padding:".75rem", background:"#F9FAFB", borderRadius:8, border:"1px solid #F3F4F6" }}>
              <p style={{ fontSize:".72rem", color:"#9CA3AF", fontWeight:600, marginBottom:".4rem" }}>EXEMPLES :</p>
              {["Quand je reçois un webhook → envoie un email", "Chaque jour → récupère les données → enregistre dans Sheets", "Webhook → filtre par IA → notifie sur Slack"].map(ex => (
                <p key={ex} onClick={() => setAiPrompt(ex)} style={{ fontSize:".78rem", color:"#4F46E5", cursor:"pointer", padding:".25rem 0", borderBottom:"1px solid #F3F4F6" }}>→ {ex}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div style={{ position:"fixed", top: webhookUrl ? 88 : 52, left:0, bottom:0, width:220, background:"#fff", borderRight:"1px solid #E5E7EB", zIndex:99, padding:"1rem", overflowY:"auto" }}>
        <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:8, padding:".6rem .75rem", marginBottom:"1rem", display:"flex", alignItems:"center", gap:".5rem" }}>
          <Plus size={12} color="#4F46E5" strokeWidth={2.5} />
          <span style={{ fontSize:".75rem", color:"#4F46E5", fontWeight:600 }}>Cliquer pour ajouter</span>
        </div>
        <p className="sidebar-label">Déclencheurs</p>
        {nodeBlocks.triggers.map(block => (
          <div key={block.type} className="block-item" onClick={() => addNode(block)} style={{ background: block.bg, border:`1px solid ${block.border}`, borderRadius:8, padding:".6rem .75rem", marginBottom:".4rem", cursor:"pointer", display:"flex", alignItems:"center", gap:".6rem" }}>
            <div style={{ width:24, height:24, borderRadius:6, background:"#fff", border:`1px solid ${block.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <block.icon size={12} color={block.color} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize:".8rem", fontWeight:700, color:"#0A0A0A", lineHeight:1.2 }}>{block.label}</p>
              <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:500 }}>{block.desc}</p>
            </div>
          </div>
        ))}
        <p className="sidebar-label">Actions</p>
        {nodeBlocks.actions.map(block => (
          <div key={block.type} className="block-item" onClick={() => addNode(block)} style={{ background: block.bg, border:`1px solid ${block.border}`, borderRadius:8, padding:".6rem .75rem", marginBottom:".4rem", cursor:"pointer", display:"flex", alignItems:"center", gap:".6rem" }}>
            <div style={{ width:24, height:24, borderRadius:6, background:"#fff", border:`1px solid ${block.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <block.icon size={12} color={block.color} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize:".8rem", fontWeight:700, color:"#0A0A0A", lineHeight:1.2 }}>{block.label}</p>
              <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:500 }}>{block.desc}</p>
            </div>
          </div>
        ))}
        <p className="sidebar-label">Intelligence artificielle</p>
        {nodeBlocks.ai.map(block => (
          <div key={block.type} className="block-item" onClick={() => addNode(block)} style={{ background: block.bg, border:`1px solid ${block.border}`, borderRadius:8, padding:".6rem .75rem", marginBottom:".4rem", cursor:"pointer", display:"flex", alignItems:"center", gap:".6rem" }}>
            <div style={{ width:24, height:24, borderRadius:6, background:"#fff", border:`1px solid ${block.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <block.icon size={12} color={block.color} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize:".8rem", fontWeight:700, color:"#0A0A0A", lineHeight:1.2 }}>{block.label}</p>
              <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:500 }}>{block.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CANVAS */}
      <div style={{ position:"fixed", top: webhookUrl ? 88 : 52, left:220, right: configNodeId ? 320 : 0, bottom:0 }}>
        <ReactFlow nodes={nodesWithConfig} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView defaultEdgeOptions={{ animated: true, style: { stroke: "#818CF8", strokeWidth: 2 } }}>
          <Controls />
          <MiniMap nodeColor={node => (node.data as NodeData).bg || "#EEF2FF"} maskColor="rgba(249,250,251,0.7)" />
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#E5E7EB" />
        </ReactFlow>
      </div>
    </>
  );
}

export default function NewWorkflowPage() {
  return <ReactFlowProvider><WorkflowEditor /></ReactFlowProvider>;
}