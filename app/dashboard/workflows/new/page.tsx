"use client";
import { useCallback, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Connection,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Mail, Zap, Clock, Sheet, MessageSquare, FileText,
  Globe, Filter, Sparkles, Play, Save, ArrowLeft,
  Plus, Webhook
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

function CustomNode({ data }: { data: { label: string; desc: string; color: string; bg: string; border: string; IconComponent: React.ElementType } }) {
  const { label, desc, color, bg, border, IconComponent } = data;
  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: "12px 16px", minWidth: 180, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#fff", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IconComponent size={14} color={color} strokeWidth={2} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0A0A0A" }}>{label}</span>
      </div>
      <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, marginLeft: 36 }}>{desc}</p>
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

const initialNodes: Node[] = [
  {
    id: "1",
    type: "custom",
    position: { x: 80, y: 180 },
    data: {
      label: "Gmail",
      desc: "Nouvel email reçu",
      color: "#DC2626",
      bg: "#FEF2F2",
      border: "#FECACA",
      IconComponent: Mail,
    },
  },
];

export default function NewWorkflowPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState("Mon workflow");
  const [editingName, setEditingName] = useState(false);
  const [saved, setSaved] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "#818CF8", strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  function addNode(block: typeof allBlocks[0]) {
    const id = `node_${Date.now()}`;
    const newNode: Node = {
      id,
      type: "custom",
      position: {
        x: 100 + Math.random() * 300,
        y: 100 + Math.random() * 200,
      },
      data: {
        label: block.label,
        desc: block.desc,
        color: block.color,
        bg: block.bg,
        border: block.border,
        IconComponent: block.icon,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

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
        .sidebar-label:first-child { margin-top:0; }
        .react-flow__attribution { display:none !important; }
        .react-flow__controls { box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important; border: 1px solid #E5E7EB !important; border-radius: 10px !important; }
        .react-flow__controls-button { border-bottom: 1px solid #F3F4F6 !important; }
        .react-flow__minimap { border: 1px solid #E5E7EB !important; border-radius: 10px !important; }
        .workflow-name-input { background:none; border:none; outline:none; font-family:'Plus Jakarta Sans',sans-serif; font-size:.9rem; font-weight:700; color:#0A0A0A; width:200px; border-bottom: 2px solid #4F46E5; padding-bottom:2px; }
      `}</style>

      {/* NAV */}
      <nav style={{ background:"#fff", borderBottom:"1px solid #E5E7EB", padding:".75rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"fixed", top:0, left:0, right:0, zIndex:100, height:52 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <a href="/dashboard" style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", color:"#6B7280", textDecoration:"none", padding:".4rem .6rem", borderRadius:8, border:"1px solid #E5E7EB" }}>
            <ArrowLeft size={13} strokeWidth={2}/>
            Retour
          </a>

          {editingName ? (
            <input
              className="workflow-name-input"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
              autoFocus
            />
          ) : (
            <span
              onClick={() => setEditingName(true)}
              style={{ fontSize:".9rem", fontWeight:700, color:"#0A0A0A", cursor:"pointer", padding:".2rem .4rem", borderRadius:6, border:"1px solid transparent" }}
              title="Cliquer pour renommer"
            >
              {workflowName}
            </span>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".75rem", color:"#9CA3AF" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#10B981" }}></div>
            {nodes.length} nœud{nodes.length > 1 ? "s" : ""}
          </div>
        </div>

        <div style={{ display:"flex", gap:".6rem", alignItems:"center" }}>
          <button
            onClick={handleSave}
            style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:600, background: saved ? "#ECFDF5" : "#F9FAFB", border:`1px solid ${saved ? "#A7F3D0" : "#E5E7EB"}`, color: saved ? "#059669" : "#374151", padding:".5rem 1rem", borderRadius:8, cursor:"pointer", fontFamily:"inherit", transition:"all .2s" }}
          >
            <Save size={13} strokeWidth={2}/>
            {saved ? "Sauvegardé !" : "Sauvegarder"}
          </button>
          <button style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:600, background:"#4F46E5", border:"none", color:"#fff", padding:".5rem 1rem", borderRadius:8, cursor:"pointer", fontFamily:"inherit" }}>
            <Play size={13} strokeWidth={2}/>
            Activer
          </button>
        </div>
      </nav>

      {/* SIDEBAR */}
      <div style={{ position:"fixed", top:52, left:0, bottom:0, width:220, background:"#fff", borderRight:"1px solid #E5E7EB", zIndex:99, padding:"1rem", overflowY:"auto" }}>

        <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:8, padding:".6rem .75rem", marginBottom:"1rem", display:"flex", alignItems:"center", gap:".5rem" }}>
          <Plus size={12} color="#4F46E5" strokeWidth={2.5}/>
          <span style={{ fontSize:".75rem", color:"#4F46E5", fontWeight:600 }}>Cliquer pour ajouter</span>
        </div>

        <p className="sidebar-label">Déclencheurs</p>
        {nodeBlocks.triggers.map((block) => (
          <div
            key={block.type}
            className="block-item"
            onClick={() => addNode(block)}
            style={{ background: block.bg, border:`1px solid ${block.border}`, borderRadius:8, padding:".6rem .75rem", marginBottom:".4rem", cursor:"pointer", display:"flex", alignItems:"center", gap:".6rem" }}
          >
            <div style={{ width:24, height:24, borderRadius:6, background:"#fff", border:`1px solid ${block.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <block.icon size={12} color={block.color} strokeWidth={2}/>
            </div>
            <div>
              <p style={{ fontSize:".8rem", fontWeight:700, color:"#0A0A0A", lineHeight:1.2 }}>{block.label}</p>
              <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:500 }}>{block.desc}</p>
            </div>
          </div>
        ))}

        <p className="sidebar-label">Actions</p>
        {nodeBlocks.actions.map((block) => (
          <div
            key={block.type}
            className="block-item"
            onClick={() => addNode(block)}
            style={{ background: block.bg, border:`1px solid ${block.border}`, borderRadius:8, padding:".6rem .75rem", marginBottom:".4rem", cursor:"pointer", display:"flex", alignItems:"center", gap:".6rem" }}
          >
            <div style={{ width:24, height:24, borderRadius:6, background:"#fff", border:`1px solid ${block.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <block.icon size={12} color={block.color} strokeWidth={2}/>
            </div>
            <div>
              <p style={{ fontSize:".8rem", fontWeight:700, color:"#0A0A0A", lineHeight:1.2 }}>{block.label}</p>
              <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:500 }}>{block.desc}</p>
            </div>
          </div>
        ))}

        <p className="sidebar-label">Intelligence artificielle</p>
        {nodeBlocks.ai.map((block) => (
          <div
            key={block.type}
            className="block-item"
            onClick={() => addNode(block)}
            style={{ background: block.bg, border:`1px solid ${block.border}`, borderRadius:8, padding:".6rem .75rem", marginBottom:".4rem", cursor:"pointer", display:"flex", alignItems:"center", gap:".6rem" }}
          >
            <div style={{ width:24, height:24, borderRadius:6, background:"#fff", border:`1px solid ${block.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <block.icon size={12} color={block.color} strokeWidth={2}/>
            </div>
            <div>
              <p style={{ fontSize:".8rem", fontWeight:700, color:"#0A0A0A", lineHeight:1.2 }}>{block.label}</p>
              <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:500 }}>{block.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CANVAS */}
      <div style={{ position:"fixed", top:52, left:220, right:0, bottom:0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{ animated: true, style: { stroke: "#818CF8", strokeWidth: 2 } }}
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => (node.data as { bg: string }).bg || "#EEF2FF"}
            maskColor="rgba(249,250,251,0.7)"
          />
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#E5E7EB" />
        </ReactFlow>
      </div>
    </>
  );
}