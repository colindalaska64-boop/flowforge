"use client";
import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState,
  addEdge, BackgroundVariant, Handle, Position, useReactFlow, ReactFlowProvider,
  type Connection, type Node, type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Mail, Clock, Sheet, MessageSquare, FileText, Globe, Filter,
  Sparkles, Play, Save, ArrowLeft, Plus, Webhook, Loader2, Wand2, Settings, X,
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
  label: string; desc: string; color: string; bg: string; border: string;
  config?: NodeConfig; onConfigure?: (id: string) => void;
};

function getIcon(label: string): React.ElementType { return iconMap[label] || Globe; }

function CustomNode({ id, data }: { id: string; data: NodeData }) {
  const { label, desc, color, bg, border, config, onConfigure } = data;
  const { setNodes } = useReactFlow();
  const IconComponent = getIcon(label);
  const hasConfig = config && Object.values(config).some(v => v && v.trim() !== "");
  function deleteNode() { setNodes(nds => nds.filter(n => n.id !== id)); }

  return (
    <div style={{ background: bg, border: `1.5px solid ${hasConfig ? color : border}`, borderRadius: 12, padding: "12px 16px", minWidth: 200, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative" }}>
      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10, background: "#4F46E5", border: "2px solid #fff", borderRadius: "50%" }} />
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10, background: "#4F46E5", border: "2px solid #fff", borderRadius: "50%" }} />
      <button onClick={deleteNode} style={{ position: "absolute", top: -8, right: -8, width: 18, height: 18, borderRadius: "50%", background: "#EF4444", border: "2px solid #fff", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 10 }}>×</button>
      <button onClick={() => onConfigure && onConfigure(id)} style={{ position: "absolute", top: -8, left: -8, width: 18, height: 18, borderRadius: "50%", background: hasConfig ? color : "#6B7280", border: "2px solid #fff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 10 }}>
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
  { id: "1", type: "custom", position: { x: 80, y: 180 }, data: { label: "Gmail", desc: "Nouvel email reçu", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", config: {} } },
];

// ============ PANNEAU DE CONFIG INTELLIGENT ============

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function EmailTagsField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const tags = value ? value.split(",").map(e => e.trim()).filter(Boolean) : [];

  function addTag() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!isValidEmail(trimmed)) { setError("Email invalide"); return; }
    if (tags.includes(trimmed)) { setError("Déjà ajouté"); return; }
    onChange([...tags, trimmed].join(", "));
    setInput("");
    setError("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag).join(", "));
  }

  return (
    <div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:".35rem", marginBottom:".5rem" }}>
        {tags.map(tag => (
          <span key={tag} style={{ display:"inline-flex", alignItems:"center", gap:".3rem", background:"#EEF2FF", color:"#4F46E5", fontSize:".75rem", fontWeight:600, padding:".2rem .5rem .2rem .6rem", borderRadius:"100px", border:"1px solid #C7D2FE" }}>
            {tag}
            <button onClick={() => removeTag(tag)} style={{ background:"none", border:"none", cursor:"pointer", color:"#818CF8", fontSize:12, padding:0, lineHeight:1 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display:"flex", gap:".5rem" }}>
        <input
          type="email"
          style={{ flex:1, padding:".6rem .75rem", border:`1px solid ${error ? "#FECACA" : "#E5E7EB"}`, borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }}
          placeholder="nom@exemple.com"
          value={input}
          onChange={e => { setInput(e.target.value); setError(""); }}
          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
        />
        <button onClick={addTag} style={{ padding:".6rem .9rem", borderRadius:8, fontSize:".82rem", fontWeight:600, background:"#4F46E5", color:"#fff", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
          Ajouter
        </button>
      </div>
      {error && <p style={{ fontSize:".72rem", color:"#DC2626", marginTop:".25rem" }}>{error}</p>}
      <p style={{ fontSize:".7rem", color:"#9CA3AF", marginTop:".3rem" }}>Appuyez sur Entrée ou virgule pour ajouter</p>
    </div>
  );
}

function ScheduleField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = (() => { try { return JSON.parse(value || "{}"); } catch { return {}; } })();
  const [type, setType] = useState(parsed.type || "daily");
  const [hour, setHour] = useState(parsed.hour || "09");
  const [minute, setMinute] = useState(parsed.minute || "00");
  const [days, setDays] = useState<string[]>(parsed.days || []);
  const [dayOfMonth, setDayOfMonth] = useState(parsed.dayOfMonth || "1");
  const [intervalHours, setIntervalHours] = useState(parsed.intervalHours || "1");
  const [timezone, setTimezone] = useState(parsed.timezone || "Europe/Paris");

  useEffect(() => {
    const config = { type, hour, minute, days, dayOfMonth, intervalHours, timezone };
    onChange(JSON.stringify(config));
  }, [type, hour, minute, days, dayOfMonth, intervalHours, timezone]);

  function toggleDay(day: string) {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const dayValues = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  const typeStyle = (t: string) => ({
    padding:".4rem .75rem", borderRadius:8, fontSize:".8rem", fontWeight:600, cursor:"pointer",
    border:`1px solid ${type === t ? "#4F46E5" : "#E5E7EB"}`,
    background: type === t ? "#EEF2FF" : "#fff",
    color: type === t ? "#4F46E5" : "#6B7280",
    fontFamily:"inherit",
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
      {/* Type */}
      <div>
        <p style={{ fontSize:".78rem", fontWeight:600, color:"#374151", marginBottom:".4rem" }}>Type de répétition</p>
        <div style={{ display:"flex", gap:".4rem", flexWrap:"wrap" }}>
          {[["hourly","Toutes les X h"], ["daily","Quotidien"], ["weekly","Hebdomadaire"], ["monthly","Mensuel"]].map(([val, lbl]) => (
            <button key={val} style={typeStyle(val)} onClick={() => setType(val)}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Intervalle horaire */}
      {type === "hourly" && (
        <div>
          <p style={{ fontSize:".78rem", fontWeight:600, color:"#374151", marginBottom:".4rem" }}>Toutes les combien d&apos;heures ?</p>
          <select style={{ width:"100%", padding:".6rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none" }} value={intervalHours} onChange={e => setIntervalHours(e.target.value)}>
            {["1","2","3","4","6","8","12"].map(h => <option key={h} value={h}>Toutes les {h}h</option>)}
          </select>
        </div>
      )}

      {/* Jours de la semaine */}
      {type === "weekly" && (
        <div>
          <p style={{ fontSize:".78rem", fontWeight:600, color:"#374151", marginBottom:".4rem" }}>Jours d&apos;exécution</p>
          <div style={{ display:"flex", gap:".35rem" }}>
            {dayLabels.map((lbl, i) => (
              <button key={lbl} onClick={() => toggleDay(dayValues[i])} style={{ width:36, height:36, borderRadius:8, border:`1px solid ${days.includes(dayValues[i]) ? "#4F46E5" : "#E5E7EB"}`, background: days.includes(dayValues[i]) ? "#4F46E5" : "#fff", color: days.includes(dayValues[i]) ? "#fff" : "#6B7280", fontSize:".72rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Jour du mois */}
      {type === "monthly" && (
        <div>
          <p style={{ fontSize:".78rem", fontWeight:600, color:"#374151", marginBottom:".4rem" }}>Jour du mois</p>
          <select style={{ width:"100%", padding:".6rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none" }} value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Le {d} du mois</option>)}
            <option value="last">Le dernier jour du mois</option>
          </select>
        </div>
      )}

      {/* Heure */}
      {type !== "hourly" && (
        <div>
          <p style={{ fontSize:".78rem", fontWeight:600, color:"#374151", marginBottom:".4rem" }}>Heure d&apos;exécution</p>
          <div style={{ display:"flex", gap:".5rem", alignItems:"center" }}>
            <select style={{ flex:1, padding:".6rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none" }} value={hour} onChange={e => setHour(e.target.value)}>
              {hours.map(h => <option key={h} value={h}>{h}h</option>)}
            </select>
            <span style={{ color:"#9CA3AF", fontWeight:600 }}>:</span>
            <select style={{ flex:1, padding:".6rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none" }} value={minute} onChange={e => setMinute(e.target.value)}>
              {minutes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Fuseau horaire */}
      <div>
        <p style={{ fontSize:".78rem", fontWeight:600, color:"#374151", marginBottom:".4rem" }}>Fuseau horaire</p>
        <select style={{ width:"100%", padding:".6rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none" }} value={timezone} onChange={e => setTimezone(e.target.value)}>
          {["Europe/Paris","Europe/London","Europe/Berlin","America/New_York","America/Los_Angeles","America/Chicago","Asia/Tokyo","Asia/Dubai","Australia/Sydney"].map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      {/* Résumé */}
      <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:8, padding:".6rem .75rem", fontSize:".78rem", color:"#4F46E5", fontWeight:500 }}>
        {type === "hourly" && `Toutes les ${intervalHours}h`}
        {type === "daily" && `Tous les jours à ${hour}:${minute}`}
        {type === "weekly" && `Chaque semaine le ${days.length > 0 ? days.map(d => dayLabels[dayValues.indexOf(d)]).join(", ") : "..."} à ${hour}:${minute}`}
        {type === "monthly" && `Le ${dayOfMonth} de chaque mois à ${hour}:${minute}`}
        {` (${timezone})`}
      </div>
    </div>
  );
}

function SheetsColumnsField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = (() => { try { return JSON.parse(value || "[]"); } catch { return []; } })();
  const [cols, setCols] = useState<{ col: string; val: string }[]>(parsed.length > 0 ? parsed : [{ col: "A", val: "" }]);

  const letters = ["A","B","C","D","E","F","G","H","I","J"];

  useEffect(() => {
    onChange(JSON.stringify(cols));
  }, [cols]);

  function addCol() { setCols(prev => [...prev, { col: letters[prev.length] || "A", val: "" }]); }
  function removeCol(i: number) { setCols(prev => prev.filter((_, idx) => idx !== i)); }
  function updateCol(i: number, field: "col" | "val", v: string) {
    setCols(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: v } : c));
  }

  return (
    <div>
      <div style={{ display:"flex", flexDirection:"column", gap:".5rem", marginBottom:".5rem" }}>
        {cols.map((col, i) => (
          <div key={i} style={{ display:"flex", gap:".4rem", alignItems:"center" }}>
            <select style={{ width:60, padding:".55rem .5rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} value={col.col} onChange={e => updateCol(i, "col", e.target.value)}>
              {letters.map(l => <option key={l} value={l}>Col {l}</option>)}
            </select>
            <input type="text" style={{ flex:1, padding:".55rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} placeholder="ex: {{email}} ou texte fixe" value={col.val} onChange={e => updateCol(i, "val", e.target.value)} />
            <button onClick={() => removeCol(i)} style={{ background:"none", border:"1px solid #FECACA", borderRadius:6, color:"#EF4444", cursor:"pointer", padding:".4rem .5rem", fontSize:12 }}>×</button>
          </div>
        ))}
      </div>
      <button onClick={addCol} style={{ fontSize:".78rem", fontWeight:600, color:"#4F46E5", background:"#EEF2FF", border:"1px solid #C7D2FE", padding:".4rem .9rem", borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>
        + Ajouter une colonne
      </button>
      <p style={{ fontSize:".7rem", color:"#9CA3AF", marginTop:".4rem" }}>Utilisez {`{{variable}}`} pour les données dynamiques</p>
    </div>
  );
}

function HttpAuthField({ config, onChange }: { config: NodeConfig; onChange: (key: string, val: string) => void }) {
  const authType = config.auth_type || "Aucune";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
      <div>
        <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Type d&apos;authentification</label>
        <select style={{ width:"100%", padding:".65rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} value={authType} onChange={e => onChange("auth_type", e.target.value)}>
          {["Aucune","Bearer Token","Basic Auth","API Key dans header","API Key dans URL"].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {authType === "Bearer Token" && (
        <div>
          <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Token Bearer</label>
          <input type="text" style={{ width:"100%", padding:".65rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} placeholder="votre-token-secret" value={config.bearer_token || ""} onChange={e => onChange("bearer_token", e.target.value)} />
        </div>
      )}

      {authType === "Basic Auth" && (
        <>
          <div>
            <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Nom d&apos;utilisateur</label>
            <input type="text" style={{ width:"100%", padding:".65rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} placeholder="username" value={config.basic_user || ""} onChange={e => onChange("basic_user", e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Mot de passe</label>
            <input type="password" style={{ width:"100%", padding:".65rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} placeholder="••••••••" value={config.basic_pass || ""} onChange={e => onChange("basic_pass", e.target.value)} />
          </div>
        </>
      )}

      {authType === "API Key dans header" && (
        <>
          <div>
            <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Nom du header</label>
            <input type="text" style={{ width:"100%", padding:".65rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} placeholder="ex: X-API-Key, Authorization" value={config.api_key_header || ""} onChange={e => onChange("api_key_header", e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Valeur de la clé</label>
            <input type="text" style={{ width:"100%", padding:".65rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} placeholder="votre-clé-api" value={config.api_key_value || ""} onChange={e => onChange("api_key_value", e.target.value)} />
          </div>
        </>
      )}

      {authType === "API Key dans URL" && (
        <div>
          <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Paramètre URL</label>
          <input type="text" style={{ width:"100%", padding:".65rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} placeholder="ex: ?api_key=VOTRE_CLÉ" value={config.api_key_param || ""} onChange={e => onChange("api_key_param", e.target.value)} />
          <p style={{ fontSize:".7rem", color:"#9CA3AF", marginTop:".3rem" }}>Sera ajouté automatiquement à l&apos;URL</p>
        </div>
      )}
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step, unit }: { label: string; value: string; onChange: (v: string) => void; min: number; max: number; step: number; unit: string }) {
  const num = parseInt(value) || min;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:".4rem" }}>
        <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151" }}>{label}</label>
        <span style={{ fontSize:".82rem", fontWeight:700, color:"#4F46E5" }}>{num} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={num} onChange={e => onChange(e.target.value)}
        style={{ width:"100%", accentColor:"#4F46E5" }} />
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:".7rem", color:"#9CA3AF", marginTop:".2rem" }}>
        <span>{min} {unit}</span><span>{max} {unit}</span>
      </div>
    </div>
  );
}

function NotionIdField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [showHelp, setShowHelp] = useState(false);
  const isValid = /^[a-f0-9]{32}$/.test(value.replace(/-/g, ""));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:".3rem" }}>
        <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151" }}>ID de la base Notion</label>
        <button onClick={() => setShowHelp(!showHelp)} style={{ fontSize:".72rem", color:"#4F46E5", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", fontFamily:"inherit" }}>
          Où trouver l&apos;ID ?
        </button>
      </div>
      <input type="text" style={{ width:"100%", padding:".65rem .75rem", border:`1px solid ${value && !isValid ? "#FECACA" : "#E5E7EB"}`, borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} placeholder="ex: 32b67f93eac480daad10ce81c6366c74" value={value} onChange={e => onChange(e.target.value)} />
      {value && !isValid && <p style={{ fontSize:".72rem", color:"#DC2626", marginTop:".25rem" }}>Format invalide — l&apos;ID doit faire 32 caractères</p>}
      {value && isValid && <p style={{ fontSize:".72rem", color:"#059669", marginTop:".25rem" }}>Format valide</p>}
      {showHelp && (
        <div style={{ marginTop:".5rem", background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:8, padding:".75rem", fontSize:".78rem", color:"#374151", lineHeight:1.6 }}>
          <strong>Comment trouver l&apos;ID :</strong>
          <ol style={{ paddingLeft:"1.25rem", marginTop:".4rem" }}>
            <li>Ouvrez votre base de données Notion</li>
            <li>Regardez l&apos;URL : <code style={{ background:"#E5E7EB", padding:"1px 4px", borderRadius:4 }}>notion.so/XXXX?v=...</code></li>
            <li>Copiez les 32 caractères avant le <code style={{ background:"#E5E7EB", padding:"1px 4px", borderRadius:4 }}>?v=</code></li>
          </ol>
        </div>
      )}
    </div>
  );
}

// ============ PANNEAU CONFIG PAR TYPE ============

function ConfigPanel({ label, config, onUpdate, onClose, onSave }: {
  label: string;
  config: NodeConfig;
  onUpdate: (key: string, val: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const input = (key: string, lbl: string, placeholder: string, type = "text", help?: string) => (
    <div key={key}>
      <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>{lbl}</label>
      <input type={type} style={{ width:"100%", padding:".65rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} placeholder={placeholder} value={config[key] || ""} onChange={e => onUpdate(key, e.target.value)} />
      {help && <p style={{ fontSize:".7rem", color:"#9CA3AF", marginTop:".25rem" }}>{help}</p>}
    </div>
  );

  const textarea = (key: string, lbl: string, placeholder: string, rows = 3, help?: string) => (
    <div key={key}>
      <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>{lbl}</label>
      <textarea style={{ width:"100%", padding:".65rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA", resize:"vertical" }} rows={rows} placeholder={placeholder} value={config[key] || ""} onChange={e => onUpdate(key, e.target.value)} />
      {help && <p style={{ fontSize:".7rem", color:"#9CA3AF", marginTop:".25rem" }}>{help}</p>}
    </div>
  );

  const select = (key: string, lbl: string, options: string[], help?: string) => (
    <div key={key}>
      <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>{lbl}</label>
      <select style={{ width:"100%", padding:".65rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA", cursor:"pointer" }} value={config[key] || ""} onChange={e => onUpdate(key, e.target.value)}>
        <option value="">Choisir...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {help && <p style={{ fontSize:".7rem", color:"#9CA3AF", marginTop:".25rem" }}>{help}</p>}
    </div>
  );

  const varHint = (
    <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:8, padding:".5rem .75rem", fontSize:".75rem", color:"#4F46E5" }}>
      Utilisez <code style={{ background:"#EEF2FF", padding:"1px 5px", borderRadius:4 }}>{`{{variable}}`}</code> pour insérer des données dynamiques (ex: <code style={{ background:"#EEF2FF", padding:"1px 4px", borderRadius:4 }}>{"{{message}}"}</code>, <code style={{ background:"#EEF2FF", padding:"1px 4px", borderRadius:4 }}>{"{{email}}"}</code>)
    </div>
  );

  const renderContent = () => {
    switch (label) {
      case "Gmail": return (
        <>
          {varHint}
          <div>
            <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Destinataire(s)</label>
            <EmailTagsField value={config.to || ""} onChange={v => onUpdate("to", v)} />
          </div>
          {input("cc", "CC (optionnel)", "cc@exemple.com", "email")}
          {input("subject", "Sujet", "ex: Nouvelle notification — {{source}}")}
          {textarea("body", "Contenu de l'email", "Bonjour,\n\nVoici les données reçues :\n{{message}}\n\nCordialement", 5)}
          {select("format", "Format d'envoi", ["HTML", "Texte brut"])}
        </>
      );

      case "Webhook": return (
        <>
          {input("description", "Description du déclencheur", "ex: Paiement Stripe reçu", "text", "Aide à identifier ce webhook")}
          {input("expected_field", "Champ obligatoire attendu (optionnel)", "ex: email", "text", "Le workflow ne s'exécutera que si ce champ est présent")}
        </>
      );

      case "Planifié": return (
        <div>
          <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".5rem" }}>Planification</label>
          <ScheduleField value={config.schedule || ""} onChange={v => onUpdate("schedule", v)} />
        </div>
      );

      case "Google Sheets": return (
        <>
          {input("spreadsheet_url", "URL du Google Sheet", "https://docs.google.com/spreadsheets/d/...", "url", "Partagez le sheet avec loopflo-sheets@loopflo.iam.gserviceaccount.com")}
          {input("sheet_name", "Nom de la feuille", "ex: Feuille1, Commandes, Leads")}
          {select("action", "Action à effectuer", ["Ajouter une ligne", "Mettre à jour une ligne"])}
          <div>
            <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".5rem" }}>Colonnes à remplir</label>
            <SheetsColumnsField value={config.columns || ""} onChange={v => onUpdate("columns", v)} />
          </div>
        </>
      );

      case "Slack": return (
        <>
          {input("webhook_url", "URL Webhook Slack", "https://hooks.slack.com/services/...", "url", "Créez un webhook sur api.slack.com/apps → Incoming Webhooks")}
          {input("channel", "Canal", "ex: #general, #ventes, #alertes")}
          {input("username", "Nom du bot (optionnel)", "ex: Loopflo Bot")}
          {varHint}
          {textarea("message", "Message", "Nouvelle entrée :\n- Source : {{source}}\n- Message : {{message}}", 4, "Supporte le formatage Slack : *gras*, _italique_, `code`")}
        </>
      );

      case "Notion": return (
        <>
          <NotionIdField value={config.database_id || ""} onChange={v => onUpdate("database_id", v)} />
          {varHint}
          {input("title", "Titre de la page", "ex: Nouveau lead : {{email}}")}
          {textarea("content", "Contenu de la page", "Source : {{source}}\nDate : {{date}}\nMessage : {{message}}", 3)}
          {select("status", "Statut (si colonne Status)", ["", "À faire", "En cours", "Terminé", "Archivé"])}
        </>
      );

      case "HTTP Request": return (
        <>
          {input("url", "URL de l'API", "https://api.exemple.com/endpoint", "url")}
          {select("method", "Méthode HTTP", ["POST", "GET", "PUT", "PATCH", "DELETE"])}
          <HttpAuthField config={config} onChange={onUpdate} />
          {textarea("headers", "Headers JSON (optionnel)", '{"Content-Type": "application/json"}', 2)}
          {varHint}
          {textarea("body", "Corps de la requête (optionnel)", '{"email": "{{email}}", "message": "{{message}}"}', 3)}
        </>
      );

      case "Filtre IA": return (
        <>
          {textarea("condition", "Question posée à l'IA", "ex: Est-ce que ce message contient une demande urgente ?", 3, "L'IA répondra OUI ou NON")}
          {select("action_if_yes", "Si OUI → que faire ?", ["Continuer le workflow", "Arrêter le workflow", "Envoyer une alerte email"])}
          {select("action_if_no", "Si NON → que faire ?", ["Arrêter le workflow", "Continuer le workflow", "Ignorer silencieusement"])}
          {textarea("context", "Contexte pour l'IA (optionnel)", "ex: Je gère un e-commerce de vêtements. Nos clients sont...", 2, "Plus le contexte est précis, meilleur est le filtre")}
        </>
      );

      case "Générer texte": return (
        <>
          {varHint}
          {textarea("prompt", "Instruction pour l'IA", "ex: Rédige un email de réponse professionnel en français basé sur ce message client : {{message}}\n\nSois chaleureux et concis.", 5, "Décrivez précisément ce que l'IA doit générer")}
          {select("tone", "Ton du texte", ["Professionnel", "Décontracté", "Formel", "Amical", "Persuasif", "Neutre", "Humoristique"])}
          {select("language", "Langue de sortie", ["Français", "Anglais", "Espagnol", "Allemand", "Italien", "Portugais", "Néerlandais"])}
          <SliderField label="Longueur maximale" value={config.max_words || "150"} onChange={v => onUpdate("max_words", v)} min={30} max={800} step={10} unit="mots" />
          {input("output_var", "Nom de la variable de sortie", "ex: texte_genere", "text", "Utilisez {{texte_genere}} dans les nœuds suivants")}
        </>
      );

      default: return <p style={{ fontSize:".85rem", color:"#9CA3AF", textAlign:"center", marginTop:"2rem" }}>Aucune configuration disponible.</p>;
    }
  };

  const IconComponent = getIcon(label);
  const nodeStyle = Object.values(styleMap).find((_, i) => Object.keys(styleMap)[i] === label.toLowerCase()) || styleMap.http;

  return (
    <div style={{ position:"fixed", top:52, right:0, bottom:0, width:360, background:"#fff", borderLeft:"1px solid #E5E7EB", zIndex:150, display:"flex", flexDirection:"column", boxShadow:"-4px 0 16px rgba(0,0,0,0.06)" }}>
      <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#FAFAFA" }}>
        <div style={{ display:"flex", alignItems:"center", gap:".6rem" }}>
          <div style={{ width:28, height:28, borderRadius:7, background:nodeStyle.bg, border:`1px solid ${nodeStyle.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <IconComponent size={13} color={nodeStyle.color} strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize:".85rem", fontWeight:700, color:"#0A0A0A" }}>Configurer — {label}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:"#6B7280" }}>
          <X size={16} strokeWidth={2} />
        </button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"1rem 1.25rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
        {renderContent()}
      </div>
      <div style={{ padding:"1rem 1.25rem", borderTop:"1px solid #F3F4F6", display:"flex", gap:".75rem" }}>
        <button onClick={onClose} style={{ flex:1, padding:".65rem", borderRadius:8, fontSize:".85rem", fontWeight:600, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#374151", cursor:"pointer", fontFamily:"inherit" }}>Annuler</button>
        <button onClick={onSave} style={{ flex:2, padding:".65rem", borderRadius:8, fontSize:".85rem", fontWeight:600, background:"#4F46E5", border:"none", color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>Enregistrer</button>
      </div>
    </div>
  );
}

// ============ ÉDITEUR PRINCIPAL ============

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
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/user/plan").then(r => r.json()).then(d => setUserPlan(d.plan || "free"));
  }, []);

  useEffect(() => {
    const urlId = new URLSearchParams(window.location.search).get("id");
    if (!urlId) return;
    fetch(`/api/workflows/${urlId}`).then(r => r.json()).then(data => {
      if (!data.id) return;
      setWorkflowId(data.id);
      setWorkflowName(data.name);
      setActive(data.active);
      if (data.data?.nodes) setNodes(data.data.nodes.map((n: { id: string; type: string; position: { x: number; y: number }; data: NodeData }) => ({ ...n, data: { ...n.data } })));
      if (data.data?.edges) setEdges(data.data.edges);
    });
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

  function updateConfig(key: string, val: string) {
    setConfigValues(prev => ({ ...prev, [key]: val }));
  }

  const nodesWithConfig = nodes.map(n => ({ ...n, data: { ...n.data, onConfigure: openConfig } }));
  const onConnect = useCallback((params: Connection) => setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: "#818CF8", strokeWidth: 2 } }, eds)), [setEdges]);

  function addNode(block: typeof allBlocks[0]) {
    if (userPlan === "free" && (block.type === "ai_filter" || block.type === "ai_generate")) {
      setShowUpgradeModal(true); return;
    }
    const id = `node_${Date.now()}`;
    setNodes(nds => [...nds, { id, type: "custom", position: { x: 150 + Math.random() * 250, y: 100 + Math.random() * 200 }, data: { label: block.label, desc: block.desc, color: block.color, bg: block.bg, border: block.border, config: {} } }]);
  }

  async function generateWithAI() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true); setAiError("");
    try {
      const res = await fetch("/api/ai/generate-workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: aiPrompt }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newNodes: Node[] = data.nodes.map((n: { type: string; label: string; desc: string }, i: number) => {
        const style = styleMap[n.type] || styleMap.http;
        return { id: `ai_${Date.now()}_${i}`, type: "custom", position: { x: 80 + i * 240, y: 180 }, data: { label: n.label, desc: n.desc, ...style, config: {} } };
      });
      const newEdges: Edge[] = newNodes.slice(0, -1).map((node, i) => ({ id: `edge_${i}`, source: node.id, target: newNodes[i + 1].id, animated: true, style: { stroke: "#818CF8", strokeWidth: 2 } }));
      setNodes(newNodes); setEdges(newEdges); setAiPrompt(""); setShowAiBar(false);
    } catch (err) { setAiError(err instanceof Error ? err.message : "Erreur lors de la génération."); }
    finally { setAiLoading(false); }
  }

  async function handleSave() {
    try {
      const cleanNodes = nodes.map(n => ({ ...n, data: { label: (n.data as NodeData).label, desc: (n.data as NodeData).desc, color: (n.data as NodeData).color, bg: (n.data as NodeData).bg, border: (n.data as NodeData).border, config: (n.data as NodeData).config || {} } }));
      const res = await fetch("/api/workflows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: workflowId, name: workflowName, data: { nodes: cleanNodes, edges } }) });
      const data = await res.json();
      if (res.ok) { setWorkflowId(data.id); setSaved(true); setTimeout(() => setSaved(false), 2000); }
      else alert(data.error);
    } catch { alert("Erreur lors de la sauvegarde."); }
  }

  async function handleActivate() {
    if (!workflowId) { alert("Sauvegardez d'abord le workflow !"); return; }
    const newActive = !active;
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: newActive }) });
      const data = await res.json();
      setActive(newActive);
      if (data.webhookUrl) setWebhookUrl(data.webhookUrl);
      else if (!newActive) setWebhookUrl(null);
    } catch { alert("Erreur lors de l'activation."); }
  }

  async function handleTest() {
    if (!workflowId) { alert("Sauvegardez d'abord le workflow !"); return; }
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/test`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      setTestSuccess(res.ok);
      setTestResult(res.ok ? "Workflow exécuté !" : "Erreur : " + data.error);
    } catch { setTestResult("Erreur réseau"); setTestSuccess(false); }
    finally { setTesting(false); setTimeout(() => setTestResult(null), 4000); }
  }

  function copyWebhook() {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const configNode = configNodeId ? nodes.find(n => n.id === configNodeId) : null;
  const configNodeData = configNode?.data as NodeData | undefined;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; }
        .block-item { transition: transform 0.15s, box-shadow 0.15s; }
        .block-item:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; }
        .sidebar-label { font-size:.68rem; font-weight:700; color:#9CA3AF; text-transform:uppercase; letter-spacing:.1em; margin:1.25rem 0 .6rem; }
        .react-flow__attribution { display:none !important; }
        .react-flow__controls { box-shadow:0 2px 8px rgba(0,0,0,0.08) !important; border:1px solid #E5E7EB !important; border-radius:10px !important; overflow:hidden; }
        .react-flow__minimap { border:1px solid #E5E7EB !important; border-radius:10px !important; overflow:hidden; }
        .ai-overlay { position:fixed; top:52px; left:220px; right:0; bottom:0; background:rgba(0,0,0,0.2); z-index:200; display:flex; align-items:flex-start; justify-content:center; padding-top:40px; }
        .ai-modal { background:#fff; border:1px solid #E5E7EB; border-radius:16px; padding:1.5rem; width:100%; max-width:580px; box-shadow:0 8px 32px rgba(0,0,0,0.12); max-height:88vh; overflow-y:auto; }
        input:focus, select:focus, textarea:focus { border-color:#818CF8 !important; box-shadow:0 0 0 3px #EEF2FF !important; background:#fff !important; }
        .workflow-name-input { background:none; border:none; outline:none; font-family:'Plus Jakarta Sans',sans-serif; font-size:.9rem; font-weight:700; color:#0A0A0A; width:200px; border-bottom:2px solid #4F46E5; padding-bottom:2px; }
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
          <button onClick={handleActivate} style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:600, background: active ? "#059669" : "#0A0A0A", border:"none", color:"#fff", padding:".5rem 1rem", borderRadius:8, cursor:"pointer", fontFamily:"inherit" }}>
            <Play size={13} strokeWidth={2} /> {active ? "Actif" : "Activer"}
          </button>
          {workflowId && (
            <button onClick={handleTest} disabled={testing} style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:600, background: testResult ? (testSuccess ? "#ECFDF5" : "#FEF2F2") : "#F0FDF4", border:`1px solid ${testResult ? (testSuccess ? "#A7F3D0" : "#FECACA") : "#BBF7D0"}`, color: testResult ? (testSuccess ? "#059669" : "#DC2626") : "#16A34A", padding:".5rem 1rem", borderRadius:8, cursor: testing ? "not-allowed" : "pointer", fontFamily:"inherit" }}>
              {testing ? <Loader2 size={13} strokeWidth={2} /> : "▶"}
              {testing ? "Test..." : testResult || "Tester"}
            </button>
          )}
        </div>
      </nav>

      {webhookUrl && (
        <div style={{ position:"fixed", top:52, left:220, right:0, zIndex:98, background:"#ECFDF5", borderBottom:"1px solid #A7F3D0", padding:".65rem 1.5rem", display:"flex", alignItems:"center", gap:"1rem" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#10B981", flexShrink:0 }}></div>
          <span style={{ fontSize:".8rem", color:"#065F46", fontWeight:600, whiteSpace:"nowrap" }}>URL Webhook :</span>
          <code style={{ fontSize:".75rem", background:"#D1FAE5", padding:".2rem .6rem", borderRadius:6, color:"#065F46", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{webhookUrl}</code>
          <button onClick={copyWebhook} style={{ fontSize:".75rem", fontWeight:600, color: copied ? "#059669" : "#065F46", background:"none", border:"1px solid #6EE7B7", padding:".3rem .7rem", borderRadius:6, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
      )}

      {showUpgradeModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setShowUpgradeModal(false)}>
          <div style={{ background:"#fff", borderRadius:16, padding:"2rem", maxWidth:420, width:"90%", boxShadow:"0 8px 32px rgba(0,0,0,0.12)" }} onClick={e => e.stopPropagation()}>
            <div style={{ width:48, height:48, borderRadius:12, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
              <Wand2 size={22} color="#4F46E5" strokeWidth={2} />
            </div>
            <h2 style={{ fontSize:"1.1rem", fontWeight:800, textAlign:"center", marginBottom:".5rem", color:"#0A0A0A" }}>Fonctionnalité Pro</h2>
            <p style={{ fontSize:".875rem", color:"#6B7280", textAlign:"center", lineHeight:1.7, marginBottom:"1.5rem" }}>
              Les blocs IA sont disponibles à partir du plan <strong style={{ color:"#0A0A0A" }}>Starter</strong> à 7€/mois.
            </p>
            <button onClick={() => setShowUpgradeModal(false)} style={{ width:"100%", padding:".75rem", borderRadius:10, fontSize:".9rem", fontWeight:600, background:"#4F46E5", color:"#fff", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Compris</button>
          </div>
        </div>
      )}

      {configNodeId && configNodeData && (
        <ConfigPanel
          label={configNodeData.label}
          config={configValues}
          onUpdate={updateConfig}
          onClose={() => setConfigNodeId(null)}
          onSave={saveConfig}
        />
      )}

      {showAiBar && (
        <div className="ai-overlay" onClick={() => setShowAiBar(false)}>
          <div className="ai-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", gap:".75rem", marginBottom:"1rem" }}>
              <div style={{ width:32, height:32, borderRadius:9, background:"#4F46E5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Wand2 size={15} color="#fff" strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize:".9rem", fontWeight:700, color:"#0A0A0A" }}>Générer un workflow avec l&apos;IA</p>
                <p style={{ fontSize:".75rem", color:"#9CA3AF" }}>Décrivez votre automatisation en français</p>
              </div>
            </div>
            <textarea style={{ width:"100%", padding:".85rem 1rem", border:"1.5px solid #C7D2FE", borderRadius:10, fontSize:".9rem", fontFamily:"inherit", outline:"none", background:"#F5F3FF", color:"#0A0A0A", resize:"none" }} rows={4} placeholder="Ex: Quand je reçois un email de client, l'IA vérifie si c'est urgent, si oui envoie une alerte Slack et crée une tâche Notion, sinon enregistre dans Sheets" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && generateWithAI()} autoFocus />
            {aiError && <p style={{ fontSize:".8rem", color:"#DC2626", marginTop:".5rem", background:"#FEF2F2", padding:".5rem .75rem", borderRadius:7, border:"1px solid #FECACA" }}>{aiError}</p>}
            <div style={{ display:"flex", gap:".75rem", marginTop:"1rem", justifyContent:"flex-end" }}>
              <button onClick={() => setShowAiBar(false)} style={{ fontSize:".85rem", fontWeight:600, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#374151", padding:".6rem 1.25rem", borderRadius:8, cursor:"pointer", fontFamily:"inherit" }}>Annuler</button>
              <button onClick={generateWithAI} disabled={aiLoading || !aiPrompt.trim()} style={{ display:"flex", alignItems:"center", gap:".5rem", fontSize:".85rem", fontWeight:600, background: aiLoading ? "#9CA3AF" : "#4F46E5", border:"none", color:"#fff", padding:".6rem 1.25rem", borderRadius:8, cursor: aiLoading ? "not-allowed" : "pointer", fontFamily:"inherit" }}>
                {aiLoading ? <Loader2 size={13} strokeWidth={2} /> : <Wand2 size={13} strokeWidth={2} />}
                {aiLoading ? "Génération..." : "Générer"}
              </button>
            </div>
            <div style={{ marginTop:"1rem", padding:".75rem", background:"#F9FAFB", borderRadius:8, border:"1px solid #F3F4F6" }}>
              <p style={{ fontSize:".72rem", color:"#9CA3AF", fontWeight:600, marginBottom:".5rem" }}>EXEMPLES :</p>
              {[
                "Webhook → filtre email urgent par IA → si OUI : Slack + Notion",
                "Chaque jour à 9h → génère un résumé IA → envoie par email",
                "Nouveau paiement webhook → email client → ligne Sheets → notif Slack",
                "Webhook → analyse sentiment IA → si positif : Notion, si négatif : alerte email",
              ].map(ex => (
                <p key={ex} onClick={() => setAiPrompt(ex)} style={{ fontSize:".78rem", color:"#4F46E5", cursor:"pointer", padding:".3rem 0", borderBottom:"1px solid #F3F4F6", lineHeight:1.4 }}>→ {ex}</p>
              ))}
            </div>
          </div>
        </div>
      )}

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
          userPlan === "free" ? (
            <div key={block.type} onClick={() => setShowUpgradeModal(true)} style={{ background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:8, padding:".6rem .75rem", marginBottom:".4rem", cursor:"pointer", display:"flex", alignItems:"center", gap:".6rem", opacity:.65 }}>
              <div style={{ width:24, height:24, borderRadius:6, background:"#fff", border:"1px solid #E5E7EB", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <block.icon size={12} color="#9CA3AF" strokeWidth={2} />
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:".8rem", fontWeight:700, color:"#9CA3AF", lineHeight:1.2 }}>{block.label}</p>
                <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:500 }}>{block.desc}</p>
              </div>
              <span style={{ fontSize:".6rem", fontWeight:700, background:"#4F46E5", color:"#fff", padding:".1rem .4rem", borderRadius:"100px", flexShrink:0 }}>PRO</span>
            </div>
          ) : (
            <div key={block.type} className="block-item" onClick={() => addNode(block)} style={{ background: block.bg, border:`1px solid ${block.border}`, borderRadius:8, padding:".6rem .75rem", marginBottom:".4rem", cursor:"pointer", display:"flex", alignItems:"center", gap:".6rem" }}>
              <div style={{ width:24, height:24, borderRadius:6, background:"#fff", border:`1px solid ${block.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <block.icon size={12} color={block.color} strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize:".8rem", fontWeight:700, color:"#0A0A0A", lineHeight:1.2 }}>{block.label}</p>
                <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:500 }}>{block.desc}</p>
              </div>
            </div>
          )
        ))}
      </div>

      <div style={{ position:"fixed", top: webhookUrl ? 88 : 52, left:220, right: configNodeId ? 360 : 0, bottom:0 }}>
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