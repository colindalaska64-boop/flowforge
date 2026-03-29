"use client";
import { useCallback, useState, useEffect, useRef } from "react";
import {
  ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState,
  addEdge, BackgroundVariant, Handle, Position, useReactFlow, ReactFlowProvider,
  type Connection, type Node, type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Mail, MailOpen, Clock, Sheet, MessageSquare, FileText, Globe, Filter,
  Sparkles, Play, Save, ArrowLeft, Plus, Webhook, Loader2, Wand2, Settings, X, HelpCircle, GitBranch,
  CreditCard, Hash, Table2, Repeat, Github, Zap, Phone, Send, UserPlus,
} from "lucide-react";
import Tutorial from "@/components/Tutorial";
import { TextFieldWithVars } from "@/components/VariablePicker";
import MobileFallback from "./mobile";

const nodeBlocks = {
  triggers: [
    { type: "webhook",     label: "Webhook",      desc: "Requête HTTP entrante",    icon: Webhook,       color: "#D97706", bg: "#FFF7ED", border: "#FDE68A" },
    { type: "schedule",    label: "Planifié",      desc: "Exécution programmée",     icon: Clock,         color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
    { type: "slack_event", label: "Slack Event",   desc: "Nouveau message Slack",    icon: Zap,           color: "#7C3AED", bg: "#FDF4FF", border: "#E9D5FF" },
    { type: "github",      label: "GitHub",        desc: "Événement GitHub",         icon: Github,        color: "#0A0A0A", bg: "#F9FAFB", border: "#E5E7EB" },
  ],
  actions: [
    { type: "gmail",      label: "Gmail",        desc: "Envoyer un email",       icon: Mail,     color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
    { type: "gmail_read", label: "Lire emails",  desc: "Récupérer les derniers emails", icon: MailOpen, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
    { type: "slack",   label: "Slack",        desc: "Envoyer un message",   icon: MessageSquare, color: "#7C3AED", bg: "#FDF4FF", border: "#E9D5FF" },
    { type: "discord", label: "Discord",      desc: "Envoyer un message",   icon: Hash,          color: "#5865F2", bg: "#EEF0FF", border: "#C7CBFF" },
    { type: "sheets",  label: "Google Sheets",desc: "Ajouter une ligne",    icon: Sheet,         color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
    { type: "airtable",label: "Airtable",     desc: "Ajouter une entrée",   icon: Table2,        color: "#18BFFF", bg: "#EFF9FF", border: "#BAE9FF" },
    { type: "notion",  label: "Notion",       desc: "Créer une page",       icon: FileText,      color: "#0A0A0A", bg: "#F9FAFB", border: "#E5E7EB" },
    { type: "stripe",  label: "Stripe",       desc: "Récupérer un paiement",icon: CreditCard,    color: "#635BFF", bg: "#F0EFFF", border: "#C8C6FF" },
    { type: "http",    label: "HTTP Request", desc: "Appel API externe",    icon: Globe,         color: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD" },
    { type: "telegram",  label: "Telegram",  desc: "Envoyer un message",    icon: Send,     color: "#0088CC", bg: "#F0F9FF", border: "#BAE6FD" },
    { type: "sms",       label: "SMS",       desc: "Envoyer un SMS",        icon: Phone,    color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
    { type: "hubspot",   label: "HubSpot",   desc: "Créer un contact",      icon: UserPlus, color: "#FF7A59", bg: "#FFF7F5", border: "#FFD5C8" },
  ],
  logique: [
    { type: "condition", label: "Condition", desc: "Bifurquer selon une règle", icon: GitBranch, color: "#7C3AED", bg: "#FDF4FF", border: "#E9D5FF" },
    { type: "loop",      label: "Boucle",    desc: "Itérer sur une liste",      icon: Repeat,    color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
  ],
  ai: [
    { type: "ai_filter",   label: "Filtre IA",      desc: "Analyser et filtrer",   icon: Filter,   color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
    { type: "ai_generate", label: "Générer texte",   desc: "Créer du contenu IA",  icon: Sparkles, color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
  ],
};

const allBlocks = [...nodeBlocks.triggers, ...nodeBlocks.actions, ...nodeBlocks.logique, ...nodeBlocks.ai];

const iconMap: Record<string, React.ElementType> = {
  Gmail: Mail, "Lire emails": MailOpen, Webhook: Webhook, Planifié: Clock,
  "Google Sheets": Sheet, Slack: MessageSquare, Notion: FileText,
  "HTTP Request": Globe, "Filtre IA": Filter, "Générer texte": Sparkles,
  "Condition":   GitBranch,
  "Discord":     Hash,
  "Airtable":    Table2,
  "Stripe":      CreditCard,
  "Boucle":      Repeat,
  "Slack Event": Zap,
  "GitHub":      Github,
  "Telegram":  Send,
  "SMS":       Phone,
  "HubSpot":   UserPlus,
};

const styleMap: Record<string, { color: string; bg: string; border: string }> = {
  gmail:      { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  gmail_read: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  webhook: { color: "#D97706", bg: "#FFF7ED", border: "#FDE68A" },
  schedule: { color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
  sheets: { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  slack: { color: "#7C3AED", bg: "#FDF4FF", border: "#E9D5FF" },
  notion: { color: "#0A0A0A", bg: "#F9FAFB", border: "#E5E7EB" },
  http: { color: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD" },
  ai_filter: { color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
  ai_generate: { color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
  condition: { color: "#7C3AED", bg: "#FDF4FF", border: "#E9D5FF" },
  discord:     { color: "#5865F2", bg: "#EEF0FF", border: "#C7CBFF" },
  airtable:    { color: "#18BFFF", bg: "#EFF9FF", border: "#BAE9FF" },
  stripe:      { color: "#635BFF", bg: "#F0EFFF", border: "#C8C6FF" },
  loop:        { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
  slack_event: { color: "#7C3AED", bg: "#FDF4FF", border: "#E9D5FF" },
  github:      { color: "#0A0A0A", bg: "#F9FAFB", border: "#E5E7EB" },
  telegram:   { color: "#0088CC", bg: "#F0F9FF", border: "#BAE6FD" },
  sms:        { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  hubspot:    { color: "#FF7A59", bg: "#FFF7F5", border: "#FFD5C8" },
};

// Aides par bloc
const blockHelp: Record<string, { title: string; description: string; useCases: string[]; tips: string[] }> = {
  "Lire emails": {
    title: "Bloc Lire emails — Récupérer les derniers emails",
    description: "Se connecte à votre boîte Gmail via IMAP et récupère les derniers emails selon vos critères. Les données sont disponibles dans les blocs suivants.",
    useCases: ["Lire les emails non lus chaque matin et les résumer avec l'IA", "Détecter les emails contenant 'Commande' et les enregistrer dans Airtable", "Transférer automatiquement certains emails vers Slack"],
    tips: ["Configurez vos identifiants Gmail dans Paramètres → Connexions (email + mot de passe d'application)", "Utilisez {{email_subject}}, {{email_from}}, {{email_date}} dans les blocs suivants", "Combinez avec 'Boucle' pour traiter chaque email individuellement : {{emails}}"],
  },
  Gmail: {
    title: "Bloc Gmail — Envoyer un email",
    description: "Envoie un email automatiquement à un ou plusieurs destinataires avec un sujet et un contenu personnalisés.",
    useCases: ["Notifier un client quand une commande est reçue", "Envoyer un rapport quotidien à votre équipe", "Alerter un responsable en cas d'erreur"],
    tips: ["Utilisez {{email}} pour insérer l'email du contact reçu", "Séparez plusieurs destinataires par des virgules", "Le format HTML permet d'envoyer des emails mis en forme"],
  },
  Webhook: {
    title: "Bloc Webhook — Déclencheur HTTP",
    description: "Déclenche le workflow quand une application externe envoie une requête HTTP à l'URL unique générée.",
    useCases: ["Déclencher quand Stripe reçoit un paiement", "Lancer quand un formulaire est soumis", "Connecter n'importe quelle app qui supporte les webhooks"],
    tips: ["Activez le workflow pour obtenir l'URL webhook", "Testez avec le bouton ▶ Tester sans avoir besoin d'une vraie app", "L'URL contient un secret unique — ne la partagez pas"],
  },
  Planifié: {
    title: "Bloc Planifié — Exécution programmée",
    description: "Lance le workflow automatiquement selon un planning défini — quotidien, hebdomadaire, ou à intervalles réguliers.",
    useCases: ["Envoyer un rapport tous les lundis matin", "Nettoyer une base de données chaque nuit", "Publier un résumé quotidien à 9h"],
    tips: ["Choisissez le fuseau horaire correct pour votre équipe", "L'exécution se fait sur nos serveurs — votre PC peut être éteint", "Combinez avec 'Générer texte' pour des rapports automatiques"],
  },
  "Google Sheets": {
    title: "Bloc Google Sheets — Enregistrer des données",
    description: "Ajoute une nouvelle ligne dans votre Google Sheet avec les données reçues du workflow.",
    useCases: ["Logger tous les nouveaux leads dans un tableau", "Enregistrer les transactions financières", "Tenir un journal des événements"],
    tips: ["Partagez votre Sheet avec loopflo-sheets@loopflo.iam.gserviceaccount.com", "Utilisez {{date}} pour ajouter automatiquement la date", "Le nom de la feuille doit correspondre exactement à l'onglet"],
  },
  Slack: {
    title: "Bloc Slack — Envoyer un message",
    description: "Envoie un message dans un canal Slack de votre workspace via un webhook entrant.",
    useCases: ["Alerter l'équipe commerciale d'un nouveau lead", "Notifier les devs d'une erreur critique", "Partager un rapport quotidien dans #general"],
    tips: ["Créez un webhook sur api.slack.com/apps → Incoming Webhooks", "Utilisez *texte* pour le gras et _texte_ pour l'italique", "Mentionnez @channel ou @here pour notifier tout le monde"],
  },
  Notion: {
    title: "Bloc Notion — Créer une page",
    description: "Crée automatiquement une nouvelle page dans une base de données Notion avec le contenu que vous définissez.",
    useCases: ["Créer une fiche client à chaque nouveau lead", "Ajouter une tâche à votre backlog automatiquement", "Archiver des événements dans une base de données"],
    tips: ["L'ID de la base se trouve dans l'URL après notion.so/", "Partagez la base avec votre intégration Loopflo", "Le titre peut contenir des variables comme {{email}}"],
  },
  "HTTP Request": {
    title: "Bloc HTTP Request — Appel API",
    description: "Fait un appel HTTP vers n'importe quelle API externe avec la méthode, les headers et le corps que vous définissez.",
    useCases: ["Mettre à jour un CRM externe quand un lead arrive", "Déclencher une action dans une app non supportée", "Appeler votre propre API backend"],
    tips: ["Utilisez POST pour envoyer des données, GET pour en récupérer", "Le corps JSON peut contenir des variables {{variable}}", "Testez d'abord avec https://httpbin.org/post pour voir le résultat"],
  },
  "Filtre IA": {
    title: "Bloc Filtre IA — Analyse intelligente",
    description: "Pose une question à l'IA qui répond OUI ou NON, permettant de brancher le workflow selon la réponse.",
    useCases: ["Filtrer les emails urgents des non-urgents", "Détecter si un message est une plainte", "Vérifier si un montant dépasse un seuil"],
    tips: ["Plus votre question est précise, meilleur est le résultat", "Ajoutez du contexte sur votre activité pour améliorer la précision", "Exemple : 'Est-ce que ce message exprime une urgence ou une insatisfaction ?'"],
  },
  "Générer texte": {
    title: "Bloc Générer texte — Rédaction IA",
    description: "Génère du texte en utilisant l'IA selon vos instructions — emails, résumés, traductions, analyses...",
    useCases: ["Rédiger une réponse automatique personnalisée à un client", "Résumer un long email en 3 points", "Traduire un message dans une autre langue"],
    tips: ["Donnez des instructions précises sur le ton et la longueur souhaitée", "Utilisez {{message}} pour inclure les données reçues dans le prompt", "Donnez un nom à la variable de sortie pour la réutiliser dans les blocs suivants"],
  },
  Discord: {
    title: "Bloc Discord — Envoyer un message",
    description: "Envoie un message dans un salon Discord via un webhook entrant. Supporte le formatage Markdown.",
    useCases: ["Alerter votre serveur Discord d'un nouveau paiement", "Notifier l'équipe d'une erreur en production", "Partager des données entrantes en temps réel"],
    tips: ["Créez un webhook dans Paramètres du salon → Intégrations → Webhooks", "Utilisez **gras**, *italique*, `code` et >>> pour les citations", "Vous pouvez mentionner @everyone ou des rôles avec leur ID <@&roleId>"],
  },
  Airtable: {
    title: "Bloc Airtable — Ajouter une entrée",
    description: "Crée un nouvel enregistrement dans une table Airtable avec les champs que vous définissez.",
    useCases: ["Ajouter un lead dans votre CRM Airtable", "Logger des commandes dans une base produits", "Alimenter un tracker de tickets support"],
    tips: ["Trouvez votre Base ID dans l'URL : airtable.com/appXXXXXX/...", "Générez un Personal Access Token sur airtable.com/create/tokens", "Les noms de champs doivent correspondre exactement à vos colonnes Airtable"],
  },
  Stripe: {
    title: "Bloc Stripe — Récupérer un paiement",
    description: "Récupère les détails d'un paiement Stripe à partir de son ID pour enrichir le workflow.",
    useCases: ["Récupérer le montant et le client d'un paiement reçu", "Vérifier le statut d'un PaymentIntent", "Enrichir un webhook Stripe avec des données complètes"],
    tips: ["Utilisez votre clé secrète Stripe (sk_live_... ou sk_test_...)", "L'ID de paiement vient généralement du payload webhook Stripe : {{id}}", "Combinez avec Gmail pour envoyer un reçu au client"],
  },
  "Slack Event": {
    title: "Bloc Slack Event — Nouveau message reçu",
    description: "Déclenche le workflow quand un message est posté dans un canal Slack via l'API Events de Slack.",
    useCases: ["Réagir aux messages dans un canal #support", "Déclencher une action quand un mot-clé est détecté", "Logger tous les messages d'un canal dans Airtable"],
    tips: ["Créez une Slack App sur api.slack.com → Event Subscriptions", "L'URL à coller dans Slack est votre URL webhook Loopflo", "Slack enverra event.text, event.user, channel dans les données"],
  },
  GitHub: {
    title: "Bloc GitHub — Événement GitHub",
    description: "Déclenche le workflow sur un événement GitHub : pull request, issue, push, release, etc.",
    useCases: ["Notifier Slack quand une PR est ouverte", "Logger les issues dans Notion", "Envoyer un email de bienvenue quand une PR est mergée"],
    tips: ["Ajoutez le webhook dans Settings → Webhooks de votre repo", "L'URL à coller est votre URL webhook Loopflo", "GitHub envoie action, repository.name, sender.login dans les données"],
  },
  Boucle: {
    title: "Bloc Boucle — Itérer sur une liste",
    description: "Exécute tous les blocs suivants une fois pour chaque élément d'un tableau. Indispensable pour traiter des listes.",
    useCases: ["Envoyer un email à chaque contact d'une liste", "Créer une entrée Notion pour chaque item reçu", "Poster un message Discord pour chaque commande du jour"],
    tips: ["Le champ doit contenir un tableau JSON : [{...}, {...}]", "Dans les blocs suivants, utilisez {{_index}} pour le numéro de l'itération", "Les champs de chaque item sont disponibles directement avec {{nom_du_champ}}"],
  },
  Telegram: {
    title: "Bloc Telegram — Envoyer un message",
    description: "Envoie un message dans un chat ou canal Telegram via votre bot.",
    useCases: ["Notifier une équipe sur Telegram d'un nouveau lead", "Alerter quand un paiement est reçu", "Envoyer un rapport quotidien sur un canal privé"],
    tips: ["Créez un bot avec @BotFather sur Telegram", "Récupérez le chat ID avec @userinfobot", "Utilisez **gras** et _italique_ dans vos messages (Markdown)"],
  },
  SMS: {
    title: "Bloc SMS — Envoyer un SMS via Twilio",
    description: "Envoie un SMS à n'importe quel numéro via l'API Twilio.",
    useCases: ["Confirmer une commande par SMS au client", "Alerter un responsable en cas d'urgence", "Envoyer un code de confirmation"],
    tips: ["Créez un compte sur twilio.com — essai gratuit disponible", "Le numéro doit être au format international : +33612345678", "Vérifiez que votre numéro Twilio est activé pour les SMS"],
  },
  HubSpot: {
    title: "Bloc HubSpot — Créer un contact",
    description: "Crée automatiquement un nouveau contact dans votre CRM HubSpot.",
    useCases: ["Ajouter chaque nouveau lead webhook dans HubSpot", "Synchroniser les inscriptions de formulaire avec votre CRM", "Créer un contact Stripe dans HubSpot"],
    tips: ["Générez une clé API privée dans HubSpot → Paramètres → Intégrations → API", "L'email est obligatoire pour créer un contact", "Les doublons d'email sont automatiquement fusionnés par HubSpot"],
  },
};

type NodeConfig = Record<string, string>;
type NodeData = {
  label: string; desc: string; color: string; bg: string; border: string;
  config?: NodeConfig; onConfigure?: (id: string) => void;
};

type ChatMessage = { role: "user" | "assistant"; content: string };
type AiPreviewEdge = { from: number; to: number; handle?: "yes" | "no" };
type AiPreviewNode = { type: string; label: string; desc: string; config: NodeConfig };
type AiPreview = { name: string; nodes: AiPreviewNode[]; edges: AiPreviewEdge[] };

function getIcon(label: string): React.ElementType { return iconMap[label] || Globe; }

function CustomNode({ id, data }: { id: string; data: NodeData }) {
  const { label, desc, color, bg, border, config, onConfigure } = data;
  const { setNodes } = useReactFlow();
  const IconComponent = getIcon(label);
  const hasConfig = config && Object.values(config).some(v => v && v.trim() !== "");
  function deleteNode() { setNodes(nds => nds.filter(n => n.id !== id)); }

  return (
    <div style={{ background: `linear-gradient(155deg, rgba(255,255,255,0.94) 0%, ${bg}60 100%)`, backdropFilter: "blur(32px) saturate(200%)", WebkitBackdropFilter: "blur(32px) saturate(200%)", border: `1.5px solid ${hasConfig ? color : "rgba(255,255,255,0.92)"}`, borderRadius: 13, padding: "12px 16px", minWidth: 200, boxShadow: `0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06), inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.04), inset 1px 0 0 rgba(255,255,255,0.7)`, fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative" }}>
      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10, background: "#4F46E5", border: "2px solid #fff", borderRadius: "50%" }} />
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10, background: "#4F46E5", border: "2px solid #fff", borderRadius: "50%" }} />
      <button onClick={deleteNode} style={{ position: "absolute", top: -8, right: -8, width: 18, height: 18, borderRadius: "50%", background: "#EF4444", border: "2px solid #fff", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 10 }}>×</button>
      <button onClick={() => onConfigure && onConfigure(id)} style={{ position: "absolute", top: -8, left: -8, width: 18, height: 18, borderRadius: "50%", background: hasConfig ? color : "#6B7280", border: "2px solid #fff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 10 }}>
        <Settings size={9} strokeWidth={2.5} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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

function ConditionNode({ id, data }: { id: string; data: NodeData }) {
  const { color, bg, border, config, onConfigure } = data;
  const { setNodes } = useReactFlow();
  const hasConfig = config && config.field && config.field.trim() !== "";
  function deleteNode() { setNodes(nds => nds.filter(n => n.id !== id)); }

  const conditionText = hasConfig
    ? `${config?.field} ${config?.operator || "contient"} "${config?.value || "..."}"`
    : "Configurer la condition";

  return (
    <div style={{ background: `linear-gradient(155deg, rgba(255,255,255,0.94) 0%, ${bg}60 100%)`, backdropFilter: "blur(32px) saturate(200%)", WebkitBackdropFilter: "blur(32px) saturate(200%)", border: `1.5px solid ${hasConfig ? color : "rgba(255,255,255,0.92)"}`, borderRadius: 13, padding: "12px 16px", minWidth: 210, boxShadow: `0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06), inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.04), inset 1px 0 0 rgba(255,255,255,0.7)`, fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative" }}>
      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10, background: "#4F46E5", border: "2px solid #fff", borderRadius: "50%" }} />

      {/* Handle Oui — haut droite */}
      <Handle type="source" id="yes" position={Position.Right} style={{ top: "32%", width: 10, height: 10, background: "#059669", border: "2px solid #fff", borderRadius: "50%" }} />
      {/* Handle Non — bas droite */}
      <Handle type="source" id="no" position={Position.Right} style={{ top: "68%", width: 10, height: 10, background: "#DC2626", border: "2px solid #fff", borderRadius: "50%" }} />

      {/* Labels Oui / Non */}
      <div style={{ position:"absolute", right:-26, top:"calc(32% - 7px)", fontSize:9, fontWeight:800, color:"#059669", pointerEvents:"none" }}>Oui</div>
      <div style={{ position:"absolute", right:-24, top:"calc(68% - 7px)", fontSize:9, fontWeight:800, color:"#DC2626", pointerEvents:"none" }}>Non</div>

      <button onClick={deleteNode} style={{ position:"absolute", top:-8, right:-8, width:18, height:18, borderRadius:"50%", background:"#EF4444", border:"2px solid #fff", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, zIndex:10 }}>×</button>
      <button onClick={() => onConfigure && onConfigure(id)} style={{ position:"absolute", top:-8, left:-8, width:18, height:18, borderRadius:"50%", background: hasConfig ? color : "#6B7280", border:"2px solid #fff", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, zIndex:10 }}>
        <Settings size={9} strokeWidth={2.5} />
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <div style={{ width:28, height:28, borderRadius:7, background:bg, border:`1px solid ${border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <GitBranch size={14} color={color} strokeWidth={2} />
        </div>
        <span style={{ fontSize:13, fontWeight:700, color:"#0A0A0A" }}>Condition</span>
        {hasConfig && <span style={{ fontSize:9, fontWeight:700, background:color, color:"#fff", padding:"1px 5px", borderRadius:"100px", marginLeft:"auto" }}>✓</span>}
      </div>
      <p style={{ fontSize:11, color: hasConfig ? "#374151" : "#9CA3AF", fontWeight:500, marginLeft:36, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:140 }}>{conditionText}</p>

      {/* Indicateurs branches */}
      <div style={{ display:"flex", gap:4, marginLeft:36, marginTop:6 }}>
        <span style={{ fontSize:9, fontWeight:700, background:"#ECFDF5", color:"#059669", padding:"2px 6px", borderRadius:100, border:"1px solid #A7F3D0" }}>OUI →</span>
        <span style={{ fontSize:9, fontWeight:700, background:"#FEF2F2", color:"#DC2626", padding:"2px 6px", borderRadius:100, border:"1px solid #FECACA" }}>NON →</span>
      </div>
    </div>
  );
}

const nodeTypes = { custom: CustomNode, condition: ConditionNode };
const initialNodes: Node[] = [
  { id: "1", type: "custom", position: { x: 80, y: 180 }, data: { label: "Webhook", desc: "Requête HTTP entrante", color: "#D97706", bg: "#FFF7ED", border: "#FDE68A", config: {} } },
];

// ============ AIDE PAR BLOC ============

function HelpPanel({ label, onClose }: { label: string; onClose: () => void }) {
  const help = blockHelp[label];
  if (!help) return null;
  const IconComponent = getIcon(label);
  const style = styleMap[Object.keys(styleMap).find(k => iconMap[label] && k) || "http"] || styleMap.http;

  return (
    <div className="glass-panel" style={{ position:"fixed", top:52, right:0, bottom:0, width:340, zIndex:160, display:"flex", flexDirection:"column", boxShadow:"-4px 0 16px rgba(0,0,0,0.06)" }}>
      <div className="glass-card" style={{ padding:"1rem 1.25rem", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:".6rem" }}>
          <div style={{ width:28, height:28, borderRadius:7, background:style.bg, border:`1px solid ${style.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <IconComponent size={13} color={style.color} strokeWidth={2} />
          </div>
          <p style={{ fontSize:".85rem", fontWeight:700, color:"#0A0A0A" }}>Aide — {label}</p>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:"#6B7280" }}>
          <X size={16} strokeWidth={2} />
        </button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"1.25rem" }}>
        <p style={{ fontSize:".82rem", color:"#6B7280", lineHeight:1.7, marginBottom:"1.5rem" }}>{help.description}</p>

        <div style={{ marginBottom:"1.5rem" }}>
          <p style={{ fontSize:".72rem", fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:".08em", marginBottom:".75rem" }}>Cas d&apos;usage</p>
          <div style={{ display:"flex", flexDirection:"column", gap:".5rem" }}>
            {help.useCases.map((uc, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:".6rem", padding:".6rem .75rem", background:"#F9FAFB", borderRadius:8, border:"1px solid #F3F4F6" }}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2.5 2.5 4-4" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <p style={{ fontSize:".8rem", color:"#374151", lineHeight:1.5 }}>{uc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize:".72rem", fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:".08em", marginBottom:".75rem" }}>Conseils</p>
          <div style={{ display:"flex", flexDirection:"column", gap:".5rem" }}>
            {help.tips.map((tip, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:".6rem", padding:".6rem .75rem", background:"#F5F3FF", borderRadius:8, border:"1px solid #DDD6FE" }}>
                <span style={{ fontSize:12, flexShrink:0, marginTop:1 }}>💡</span>
                <p style={{ fontSize:".78rem", color:"#4338CA", lineHeight:1.5 }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding:"1rem 1.25rem", borderTop:"1px solid #F3F4F6" }}>
        <button onClick={onClose} style={{ width:"100%", padding:".65rem", borderRadius:8, fontSize:".85rem", fontWeight:600, background:"#4F46E5", border:"none", color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>
          Compris, fermer
        </button>
      </div>
    </div>
  );
}

// ============ PANNEAU DE CONFIG ============

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
    setInput(""); setError("");
  }

  return (
    <div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:".35rem", marginBottom:".5rem" }}>
        {tags.map(tag => (
          <span key={tag} style={{ display:"inline-flex", alignItems:"center", gap:".3rem", background:"#EEF2FF", color:"#4F46E5", fontSize:".75rem", fontWeight:600, padding:".2rem .5rem .2rem .6rem", borderRadius:"100px", border:"1px solid #C7D2FE" }}>
            {tag}
            <button onClick={() => onChange(tags.filter(t => t !== tag).join(", "))} style={{ background:"none", border:"none", cursor:"pointer", color:"#818CF8", fontSize:12, padding:0, lineHeight:1 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display:"flex", gap:".5rem" }}>
        <input type="email" style={{ flex:1, padding:".6rem .75rem", border:`1px solid ${error ? "#FECACA" : "#E5E7EB"}`, borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} placeholder="nom@exemple.com" value={input} onChange={e => { setInput(e.target.value); setError(""); }} onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }} />
        <button onClick={addTag} style={{ padding:".6rem .9rem", borderRadius:8, fontSize:".82rem", fontWeight:600, background:"#4F46E5", color:"#fff", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Ajouter</button>
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

  useEffect(() => { onChange(JSON.stringify({ type, hour, minute, days, dayOfMonth, intervalHours, timezone })); }, [type, hour, minute, days, dayOfMonth, intervalHours, timezone]);

  const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const dayValues = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const typeStyle = (t: string) => ({ padding:".4rem .75rem", borderRadius:8, fontSize:".8rem", fontWeight:600, cursor:"pointer", border:`1px solid ${type === t ? "#4F46E5" : "#E5E7EB"}`, background: type === t ? "#EEF2FF" : "#fff", color: type === t ? "#4F46E5" : "#6B7280", fontFamily:"inherit" as const });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
      <div>
        <p style={{ fontSize:".78rem", fontWeight:600, color:"#374151", marginBottom:".4rem" }}>Type de répétition</p>
        <div style={{ display:"flex", gap:".4rem", flexWrap:"wrap" }}>
          {[["hourly","Toutes les X h"], ["daily","Quotidien"], ["weekly","Hebdomadaire"], ["monthly","Mensuel"]].map(([val, lbl]) => (
            <button key={val} style={typeStyle(val)} onClick={() => setType(val)}>{lbl}</button>
          ))}
        </div>
      </div>
      {type === "hourly" && (
        <div>
          <p style={{ fontSize:".78rem", fontWeight:600, color:"#374151", marginBottom:".4rem" }}>Intervalle</p>
          <select style={{ width:"100%", padding:".6rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none" }} value={intervalHours} onChange={e => setIntervalHours(e.target.value)}>
            {["1","2","3","4","6","8","12"].map(h => <option key={h} value={h}>Toutes les {h}h</option>)}
          </select>
        </div>
      )}
      {type === "weekly" && (
        <div>
          <p style={{ fontSize:".78rem", fontWeight:600, color:"#374151", marginBottom:".4rem" }}>Jours d&apos;exécution</p>
          <div style={{ display:"flex", gap:".35rem" }}>
            {dayLabels.map((lbl, i) => (
              <button key={lbl} onClick={() => setDays(prev => prev.includes(dayValues[i]) ? prev.filter(d => d !== dayValues[i]) : [...prev, dayValues[i]])} style={{ width:36, height:36, borderRadius:8, border:`1px solid ${days.includes(dayValues[i]) ? "#4F46E5" : "#E5E7EB"}`, background: days.includes(dayValues[i]) ? "#4F46E5" : "#fff", color: days.includes(dayValues[i]) ? "#fff" : "#6B7280", fontSize:".72rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{lbl}</button>
            ))}
          </div>
        </div>
      )}
      {type === "monthly" && (
        <div>
          <p style={{ fontSize:".78rem", fontWeight:600, color:"#374151", marginBottom:".4rem" }}>Jour du mois</p>
          <select style={{ width:"100%", padding:".6rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none" }} value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Le {d} du mois</option>)}
            <option value="last">Le dernier jour du mois</option>
          </select>
        </div>
      )}
      {type !== "hourly" && (
        <div>
          <p style={{ fontSize:".78rem", fontWeight:600, color:"#374151", marginBottom:".4rem" }}>Heure d&apos;exécution</p>
          <div style={{ display:"flex", gap:".5rem", alignItems:"center" }}>
            <select style={{ flex:1, padding:".6rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none" }} value={hour} onChange={e => setHour(e.target.value)}>
              {hours.map(h => <option key={h} value={h}>{h}h</option>)}
            </select>
            <span style={{ color:"#9CA3AF", fontWeight:600 }}>:</span>
            <select style={{ flex:1, padding:".6rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none" }} value={minute} onChange={e => setMinute(e.target.value)}>
              {["00","15","30","45"].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      )}
      <div>
        <p style={{ fontSize:".78rem", fontWeight:600, color:"#374151", marginBottom:".4rem" }}>Fuseau horaire</p>
        <select style={{ width:"100%", padding:".6rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none" }} value={timezone} onChange={e => setTimezone(e.target.value)}>
          {["Europe/Paris","Europe/London","Europe/Berlin","America/New_York","America/Los_Angeles","America/Chicago","Asia/Tokyo","Asia/Dubai","Australia/Sydney"].map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>
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
  useEffect(() => { onChange(JSON.stringify(cols)); }, [cols]);

  return (
    <div>
      <div style={{ display:"flex", flexDirection:"column", gap:".5rem", marginBottom:".5rem" }}>
        {cols.map((col, i) => (
          <div key={i} style={{ display:"flex", gap:".4rem", alignItems:"center" }}>
            <select style={{ width:60, padding:".55rem .5rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} value={col.col} onChange={e => setCols(prev => prev.map((c, idx) => idx === i ? { ...c, col: e.target.value } : c))}>
              {letters.map(l => <option key={l} value={l}>Col {l}</option>)}
            </select>
            <input type="text" style={{ flex:1, padding:".55rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} placeholder="ex: {{email}} ou texte fixe" value={col.val} onChange={e => setCols(prev => prev.map((c, idx) => idx === i ? { ...c, val: e.target.value } : c))} />
            <button onClick={() => setCols(prev => prev.filter((_, idx) => idx !== i))} style={{ background:"none", border:"1px solid #FECACA", borderRadius:6, color:"#EF4444", cursor:"pointer", padding:".4rem .5rem", fontSize:12 }}>×</button>
          </div>
        ))}
      </div>
      <button onClick={() => setCols(prev => [...prev, { col: letters[prev.length] || "A", val: "" }])} style={{ fontSize:".78rem", fontWeight:600, color:"#4F46E5", background:"#EEF2FF", border:"1px solid #C7D2FE", padding:".4rem .9rem", borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>+ Ajouter une colonne</button>
      <p style={{ fontSize:".7rem", color:"#9CA3AF", marginTop:".4rem" }}>Utilisez {`{{variable}}`} pour les données dynamiques</p>
    </div>
  );
}

function HttpAuthField({ config, onChange }: { config: NodeConfig; onChange: (key: string, val: string) => void }) {
  const authType = config.auth_type || "Aucune";
  const inputStyle = { width:"100%", padding:".65rem .75rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
      <div>
        <label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Type d&apos;authentification</label>
        <select style={{ ...inputStyle }} value={authType} onChange={e => onChange("auth_type", e.target.value)}>
          {["Aucune","Bearer Token","Basic Auth","API Key dans header","API Key dans URL"].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      {authType === "Bearer Token" && <div><label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Token Bearer</label><input type="text" style={inputStyle} placeholder="votre-token-secret" value={config.bearer_token || ""} onChange={e => onChange("bearer_token", e.target.value)} /></div>}
      {authType === "Basic Auth" && <><div><label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Nom d&apos;utilisateur</label><input type="text" style={inputStyle} placeholder="username" value={config.basic_user || ""} onChange={e => onChange("basic_user", e.target.value)} /></div><div><label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Mot de passe</label><input type="password" style={inputStyle} placeholder="••••••••" value={config.basic_pass || ""} onChange={e => onChange("basic_pass", e.target.value)} /></div></>}
      {authType === "API Key dans header" && <><div><label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Nom du header</label><input type="text" style={inputStyle} placeholder="ex: X-API-Key" value={config.api_key_header || ""} onChange={e => onChange("api_key_header", e.target.value)} /></div><div><label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Valeur</label><input type="text" style={inputStyle} placeholder="votre-clé-api" value={config.api_key_value || ""} onChange={e => onChange("api_key_value", e.target.value)} /></div></>}
      {authType === "API Key dans URL" && <div><label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Paramètre URL</label><input type="text" style={inputStyle} placeholder="ex: ?api_key=VOTRE_CLÉ" value={config.api_key_param || ""} onChange={e => onChange("api_key_param", e.target.value)} /><p style={{ fontSize:".7rem", color:"#9CA3AF", marginTop:".3rem" }}>Sera ajouté automatiquement à l&apos;URL</p></div>}
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
      <input type="range" min={min} max={max} step={step} value={num} onChange={e => onChange(e.target.value)} style={{ width:"100%", accentColor:"#4F46E5" }} />
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:".7rem", color:"#9CA3AF", marginTop:".2rem" }}><span>{min} {unit}</span><span>{max} {unit}</span></div>
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
        <button onClick={() => setShowHelp(!showHelp)} style={{ fontSize:".72rem", color:"#4F46E5", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", fontFamily:"inherit" }}>Où le trouver ?</button>
      </div>
      <input type="text" style={{ width:"100%", padding:".65rem .75rem", border:`1px solid ${value && !isValid ? "#FECACA" : "#E5E7EB"}`, borderRadius:8, fontSize:".82rem", fontFamily:"inherit", outline:"none", background:"#FAFAFA" }} placeholder="ex: 32b67f93eac480daad10ce81c6366c74" value={value} onChange={e => onChange(e.target.value)} />
      {value && !isValid && <p style={{ fontSize:".72rem", color:"#DC2626", marginTop:".25rem" }}>Format invalide — 32 caractères attendus</p>}
      {value && isValid && <p style={{ fontSize:".72rem", color:"#059669", marginTop:".25rem" }}>Format valide</p>}
      {showHelp && (
        <div style={{ marginTop:".5rem", background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:8, padding:".75rem", fontSize:".78rem", color:"#374151", lineHeight:1.6 }}>
          <strong>Comment trouver l&apos;ID :</strong>
          <ol style={{ paddingLeft:"1.25rem", marginTop:".4rem" }}>
            <li>Ouvrez votre base de données Notion</li>
            <li>URL : <code style={{ background:"#E5E7EB", padding:"1px 4px", borderRadius:4 }}>notion.so/XXXX?v=...</code></li>
            <li>Copiez les 32 caractères avant le <code style={{ background:"#E5E7EB", padding:"1px 4px", borderRadius:4 }}>?v=</code></li>
          </ol>
        </div>
      )}
    </div>
  );
}

function ConfigPanel({ label, config, onUpdate, onClose, onSave, triggerType, onShowHelp }: {
  label: string; config: NodeConfig; onUpdate: (key: string, val: string) => void;
  onClose: () => void; onSave: () => void; triggerType: string; onShowHelp: () => void;
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
      Utilisez <code style={{ background:"#EEF2FF", padding:"1px 5px", borderRadius:4 }}>{`{{variable}}`}</code> pour les données dynamiques — ex: <code style={{ background:"#EEF2FF", padding:"1px 4px", borderRadius:4 }}>{"{{message}}"}</code>
    </div>
  );

  const renderContent = () => {
    switch (label) {
      case "Lire emails": return (<>
        {select("max_count", "Nombre d'emails à lire", ["1", "3", "5", "10", "20"])}
        {input("folder", "Dossier Gmail", "INBOX", "text", "INBOX, Sent, Spam ou tout autre dossier Gmail")}
        {select("filter", "Filtre", ["Tous", "Non lus seulement", "Contient dans le sujet"])}
        {config.filter === "Contient dans le sujet" && input("subject_filter", "Mot-clé dans le sujet", "ex: Commande, Facture, Urgent")}
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:".65rem .85rem", fontSize:".78rem", color:"#B91C1C", lineHeight:1.6 }}>
          <strong>Pré-requis :</strong> configurez votre <strong>email</strong> + <strong>mot de passe d&apos;application Gmail</strong> dans <a href="/dashboard/settings" style={{ color:"#B91C1C", textDecoration:"underline" }}>Paramètres → Connexions</a>.
        </div>
        <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:8, padding:".65rem .85rem", fontSize:".78rem", color:"#4338CA", lineHeight:1.7 }}>
          <strong>Variables disponibles après ce bloc :</strong><br/>
          <code style={{ background:"rgba(0,0,0,.06)", padding:".1rem .3rem", borderRadius:3 }}>{"{{email_subject}}"}</code> — Sujet du dernier email<br/>
          <code style={{ background:"rgba(0,0,0,.06)", padding:".1rem .3rem", borderRadius:3 }}>{"{{email_from}}"}</code> — Expéditeur<br/>
          <code style={{ background:"rgba(0,0,0,.06)", padding:".1rem .3rem", borderRadius:3 }}>{"{{email_date}}"}</code> — Date de réception<br/>
          <code style={{ background:"rgba(0,0,0,.06)", padding:".1rem .3rem", borderRadius:3 }}>{"{{email_count}}"}</code> — Nombre d&apos;emails lus<br/>
          <code style={{ background:"rgba(0,0,0,.06)", padding:".1rem .3rem", borderRadius:3 }}>{"{{emails}}"}</code> — Tableau complet (pour Boucle)
        </div>
      </>);
      case "Gmail": return (<>{varHint}<div><label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".3rem" }}>Destinataire(s)</label><EmailTagsField value={config.to || ""} onChange={v => onUpdate("to", v)} /></div>{input("cc", "CC (optionnel)", "cc@exemple.com", "email")}{input("subject", "Sujet", "ex: Nouvelle notification — {{source}}")}<TextFieldWithVars label="Contenu de l'email" value={config.body || ""} onChange={v => onUpdate("body", v)} placeholder={"Bonjour,\n\nVoici les données reçues :\n{{message}}\n\nCordialement"} rows={5} triggerType={triggerType} />{select("format", "Format d'envoi", ["HTML", "Texte brut"])}</>);
      case "Webhook": return (<>{input("description", "Description", "ex: Paiement Stripe reçu", "text", "Aide à identifier ce webhook")}{input("expected_field", "Champ obligatoire attendu (optionnel)", "ex: email", "text", "Le workflow ne s'exécutera que si ce champ est présent")}</>);
      case "Planifié": return (<div><label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".5rem" }}>Planification</label><ScheduleField value={config.schedule || ""} onChange={v => onUpdate("schedule", v)} /></div>);
      case "Google Sheets": return (<>{input("spreadsheet_url", "URL du Google Sheet", "https://docs.google.com/spreadsheets/d/...", "url", "Partagez le sheet avec loopflo-sheets@loopflo.iam.gserviceaccount.com")}{input("sheet_name", "Nom de la feuille", "ex: Feuille1, Commandes")}{select("action", "Action", ["Ajouter une ligne", "Mettre à jour une ligne"])}<div><label style={{ fontSize:".78rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".5rem" }}>Colonnes à remplir</label><SheetsColumnsField value={config.columns || ""} onChange={v => onUpdate("columns", v)} /></div></>);
      case "Slack": return (<>{input("webhook_url", "URL Webhook Slack", "https://hooks.slack.com/services/...", "url", "Créez un webhook sur api.slack.com/apps → Incoming Webhooks")}{input("channel", "Canal", "ex: #general, #ventes")}{input("username", "Nom du bot (optionnel)", "ex: Loopflo Bot")}{varHint}<TextFieldWithVars label="Message" value={config.message || ""} onChange={v => onUpdate("message", v)} placeholder={"Nouvelle entrée :\n- Source : {{source}}\n- Message : {{message}}"} rows={4} triggerType={triggerType} help="Supporte *gras*, _italique_, `code`" /></>);
      case "Notion": return (<><NotionIdField value={config.database_id || ""} onChange={v => onUpdate("database_id", v)} />{varHint}{input("title", "Titre de la page", "ex: Nouveau lead : {{email}}")}<TextFieldWithVars label="Contenu de la page" value={config.content || ""} onChange={v => onUpdate("content", v)} placeholder={"Source : {{source}}\nDate : {{date}}\nMessage : {{message}}"} rows={3} triggerType={triggerType} />{select("status", "Statut (si colonne Status)", ["", "À faire", "En cours", "Terminé", "Archivé"])}</>);
      case "HTTP Request": return (<>{input("url", "URL de l'API", "https://api.exemple.com/endpoint", "url")}{select("method", "Méthode HTTP", ["POST", "GET", "PUT", "PATCH", "DELETE"])}<HttpAuthField config={config} onChange={onUpdate} />{textarea("headers", "Headers JSON (optionnel)", '{"Content-Type": "application/json"}', 2)}{varHint}<TextFieldWithVars label="Corps de la requête (optionnel)" value={config.body || ""} onChange={v => onUpdate("body", v)} placeholder={'{"email": "{{email}}", "message": "{{message}}"}' } rows={3} triggerType={triggerType} /></>);
      case "Condition": return (
        <>
          {input("field", "Champ à tester", "ex: message, email, montant", "text", "Le nom de la variable reçue (depuis le webhook ou le déclencheur)")}
          {select("operator", "Opérateur", ["contient", "ne contient pas", "égal à", "différent de", "commence par", "se termine par", "plus grand que", "plus petit que", "est vide", "n'est pas vide"])}
          {config.operator !== "est vide" && config.operator !== "n'est pas vide" && input("value", "Valeur de comparaison", "ex: urgent, 100, john@email.com")}
          <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:8, padding:".65rem .85rem", fontSize:".78rem", color:"#4338CA", lineHeight:1.6 }}>
            <strong>Comment connecter :</strong> après avoir configuré, glissez un fil depuis le point <span style={{ color:"#059669", fontWeight:700 }}>vert (Oui)</span> vers la branche "vrai", et depuis le point <span style={{ color:"#DC2626", fontWeight:700 }}>rouge (Non)</span> vers la branche "faux".
          </div>
        </>
      );
      case "Filtre IA": return (<>{textarea("condition", "Question posée à l'IA", "ex: Est-ce que ce message contient une demande urgente ?", 3, "L'IA répondra OUI ou NON")}{select("action_if_yes", "Si OUI →", ["Continuer le workflow", "Arrêter le workflow", "Envoyer une alerte email"])}{select("action_if_no", "Si NON →", ["Arrêter le workflow", "Continuer le workflow", "Ignorer silencieusement"])}{textarea("context", "Contexte pour l'IA (optionnel)", "ex: Je gère un e-commerce...", 2, "Plus c'est précis, meilleur est le filtre")}</>);
      case "Générer texte": return (<>{varHint}<TextFieldWithVars label="Instruction pour l'IA" value={config.prompt || ""} onChange={v => onUpdate("prompt", v)} placeholder={"Rédige un email de réponse professionnel basé sur : {{message}}"} rows={5} triggerType={triggerType} help="Décrivez précisément ce que l'IA doit générer" />{select("tone", "Ton", ["Professionnel", "Décontracté", "Formel", "Amical", "Persuasif", "Neutre", "Humoristique"])}{select("language", "Langue", ["Français", "Anglais", "Espagnol", "Allemand", "Italien", "Portugais"])}<SliderField label="Longueur max" value={config.max_words || "150"} onChange={v => onUpdate("max_words", v)} min={30} max={800} step={10} unit="mots" />{input("output_var", "Variable de sortie", "ex: texte_genere", "text", "Utilisez {{texte_genere}} dans les blocs suivants")}</>);
      case "Slack Event": return (<>{input("description", "Description", "ex: Messages du canal #support")}<div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:8, padding:".65rem .85rem", fontSize:".78rem", color:"#4338CA", lineHeight:1.6 }}><strong>Configuration Slack :</strong><br/>1. Créez une Slack App sur <strong>api.slack.com</strong><br/>2. Activez <strong>Event Subscriptions</strong><br/>3. Collez votre URL webhook Loopflo<br/>4. Abonnez-vous à <code style={{ background:"rgba(0,0,0,.06)", padding:".1rem .3rem", borderRadius:4 }}>message.channels</code></div></>);
      case "GitHub": return (<>{input("description", "Description", "ex: PRs du repo mon-projet")}{select("event_type", "Type d'événement attendu", ["Tous", "pull_request", "push", "issues", "release", "create"])}<div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:8, padding:".65rem .85rem", fontSize:".78rem", color:"#4338CA", lineHeight:1.6 }}><strong>Configuration GitHub :</strong><br/>1. Allez dans <strong>Settings → Webhooks</strong> de votre repo<br/>2. Collez votre URL webhook Loopflo<br/>3. Choisissez les événements à envoyer</div></>);
      case "Discord": return (<>{input("webhook_url", "URL Webhook Discord", "https://discord.com/api/webhooks/...", "url", "Paramètres du salon → Intégrations → Webhooks")}{input("username", "Nom du bot (optionnel)", "ex: Loopflo")}{varHint}<TextFieldWithVars label="Message" value={config.message || ""} onChange={v => onUpdate("message", v)} placeholder={"Nouveau paiement reçu !\n**Client :** {{email}}\n**Montant :** {{amount}}"} rows={4} triggerType={triggerType} help="Supporte **gras**, *italique*, `code`" /></>);
      case "Airtable": return (<>{input("api_key", "Personal Access Token", "patXXXXXXXXXXXXXX", "text", "Générez un token sur airtable.com/create/tokens")}{input("base_id", "Base ID", "appXXXXXXXXXXXXXX", "text", "Visible dans l'URL : airtable.com/appXXX/...")}{input("table_name", "Nom de la table", "ex: Leads, Commandes")}{varHint}{textarea("fields", "Champs JSON à créer", '{"Nom": "{{name}}", "Email": "{{email}}", "Message": "{{message}}"}', 4, "Les noms de champs doivent correspondre exactement à vos colonnes")}</>);
      case "Stripe": return (<>{input("secret_key", "Clé secrète Stripe", "sk_live_... ou sk_test_...", "text", "Trouvez-la sur dashboard.stripe.com → Développeurs → Clés API")}{select("action", "Action", ["Récupérer un paiement", "Récupérer un client", "Créer un client"])}{input("resource_id", "ID de la ressource", "ex: {{id}}, pi_xxxxx, cus_xxxxx", "text", "L'ID Stripe de l'objet à récupérer")}</>);
      case "Boucle": return (<>{input("array_field", "Champ contenant la liste", "ex: items, contacts, orders", "text", "Le nom du champ dans les données du déclencheur qui contient le tableau")}<div style={{ background:"#ECFEFF", border:"1px solid #A5F3FC", borderRadius:8, padding:".65rem .85rem", fontSize:".78rem", color:"#0E7490", lineHeight:1.6 }}><strong>Comment ça marche :</strong> tous les blocs connectés après la Boucle s&apos;exécuteront une fois pour chaque élément. Utilisez <code style={{ background:"rgba(0,0,0,.06)", padding:".1rem .3rem", borderRadius:4 }}>{"{{_index}}"}</code> pour le numéro de l&apos;itération (0, 1, 2...).</div></>);
      case "Telegram": return (<>{input("bot_token", "Token du bot", "1234567890:ABCdef...", "text", "Créez un bot avec @BotFather et copiez le token")}{input("chat_id", "Chat ID", "ex: -1001234567890 ou 123456789", "text", "Trouvez-le avec @userinfobot ou dans l'URL web.telegram.org")}{varHint}<TextFieldWithVars label="Message" value={config.message || ""} onChange={v => onUpdate("message", v)} placeholder={"Nouvelle notification :\n**{{name}}** — {{message}}"} rows={4} triggerType={triggerType} help="Supporte **gras**, _italique_, `code` (Markdown Telegram)" /></>);
      case "SMS": return (<>{input("account_sid", "Account SID Twilio", "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", "text")}{input("auth_token", "Auth Token Twilio", "votre auth token", "password")}{input("from_number", "Numéro Twilio", "+33XXXXXXXXX", "text", "Votre numéro Twilio actif")}{input("to_number", "Destinataire", "+33612345678 ou {{phone}}", "text", "Format international obligatoire")}{varHint}<TextFieldWithVars label="Message SMS" value={config.message || ""} onChange={v => onUpdate("message", v)} placeholder={"Notification Loopflo :\n{{message}}"} rows={3} triggerType={triggerType} help="160 caractères max pour un SMS standard" /></>);
      case "HubSpot": return (<>{input("api_key", "Clé API privée HubSpot", "pat-eu1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", "text", "HubSpot → Paramètres → Intégrations → Clés API privées")}{input("email", "Email du contact", "{{email}}", "text", "Obligatoire — utilisez {{email}} pour la donnée dynamique")}{input("first_name", "Prénom", "{{name}}", "text")}{input("last_name", "Nom de famille", "{{last_name}}", "text")}{input("phone", "Téléphone (optionnel)", "{{phone}}", "text")}</>);
      default: return <p style={{ fontSize:".85rem", color:"#9CA3AF", textAlign:"center", marginTop:"2rem" }}>Aucune configuration disponible.</p>;
    }
  };

  const IconComponent = getIcon(label);
  const nodeStyle = styleMap[Object.keys(styleMap).find(k => k === label.toLowerCase().replace(" ", "_").replace(" ", "")) || "http"] || styleMap.http;
  const hasHelp = !!blockHelp[label];

  return (
    <div className="glass-panel" style={{ position:"fixed", top:52, right:0, bottom:0, width:360, zIndex:150, display:"flex", flexDirection:"column", background:"rgba(245,242,255,0.92)", backdropFilter:"blur(48px) saturate(210%) brightness(103%)", WebkitBackdropFilter:"blur(48px) saturate(210%) brightness(103%)", borderLeft:"1.5px solid rgba(255,255,255,0.95)", boxShadow:"-4px 0 32px rgba(99,102,241,0.12), inset 1px 0 0 rgba(255,255,255,0.8)" }}>
      <div className="glass-card" style={{ padding:"1rem 1.25rem", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:".6rem" }}>
          <div style={{ width:28, height:28, borderRadius:7, background:nodeStyle.bg, border:`1px solid ${nodeStyle.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <IconComponent size={13} color={nodeStyle.color} strokeWidth={2} />
          </div>
          <p style={{ fontSize:".85rem", fontWeight:700, color:"#0A0A0A" }}>Configurer — {label}</p>
        </div>
        <div style={{ display:"flex", gap:".4rem" }}>
          {hasHelp && (
            <button onClick={onShowHelp} title="Aide" style={{ background:"#EEF2FF", border:"1px solid #C7D2FE", borderRadius:7, cursor:"pointer", padding:".3rem .5rem", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <HelpCircle size={14} color="#4F46E5" strokeWidth={2} />
            </button>
          )}
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:"#6B7280" }}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"1rem 1.25rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
        {renderContent()}
      </div>
      <div style={{ padding:"1rem 1.25rem", borderTop:"1px solid #F3F4F6", display:"flex", gap:".75rem" }}>
        <button onClick={onClose} style={{ flex:1, padding:".65rem", borderRadius:9, fontSize:".85rem", fontWeight:600, background:"rgba(255,255,255,0.88)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:"1.5px solid rgba(255,255,255,0.95)", color:"#374151", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)" }}>Annuler</button>
        <button onClick={onSave} style={{ flex:2, padding:".65rem", borderRadius:9, fontSize:".85rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", border:"none", color:"#fff", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 16px rgba(99,102,241,0.38)" }}>Enregistrer</button>
      </div>
    </div>
  );
}

// ============ CHAT IA ============

function AiChat({ onClose, onGenerate, hasNodes, onSave }: {
  onClose: () => void;
  onGenerate: (nodes: Node[], edges: Edge[], replace: boolean) => void;
  hasNodes: boolean;
  onSave: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Décrivez votre automatisation — je vais poser quelques questions puis générer le workflow." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<AiPreview | null>(null);
  const [previewNodes, setPreviewNodes] = useState<AiPreviewNode[]>([]);
  const [previewEdges, setPreviewEdges] = useState<AiPreviewEdge[]>([]);
  const [replace, setReplace] = useState(true);
  const [expandedNode, setExpandedNode] = useState<number | null>(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const EXAMPLES = [
    "Webhook → filtrer si urgent → email au responsable",
    "Chaque lundi 9h, générer un résumé et l'envoyer par email",
    "Paiement reçu → email client + ligne dans Sheets",
    "Message Slack → analyser avec l'IA → répondre sur Discord",
  ];

  const COMPLEX_FIELDS = ["schedule", "columns", "fields"];

  async function sendMessage(text?: string) {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");
    setError("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/generate-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.ready && data.nodes?.length) {
        setMessages(prev => [...prev, { role: "assistant", content: `Parfait ! J'ai préparé ${data.nodes.length} bloc${data.nodes.length > 1 ? "s" : ""}. Vérifiez et ajustez les paramètres avant de générer.` }]);
        const pNodes: AiPreviewNode[] = data.nodes.map((n: AiPreviewNode) => ({
          type: n.type || "http",
          label: n.label || n.type,
          desc: n.desc || "",
          config: n.config || {},
        }));
        const pEdges: AiPreviewEdge[] = Array.isArray(data.edges) ? data.edges : [];
        setPreviewNodes(pNodes);
        setPreviewEdges(pEdges);
        setPreview({ name: data.name || "Workflow généré", nodes: pNodes, edges: pEdges });
      } else if (data.question) {
        let reply = data.question;
        if (data.hint) reply += `\n\nEx : *${data.hint}*`;
        setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de génération.");
    } finally {
      setLoading(false);
    }
  }

  function updateConfig(nodeIdx: number, key: string, value: string) {
    setPreviewNodes(prev => prev.map((n, i) =>
      i === nodeIdx ? { ...n, config: { ...n.config, [key]: value } } : n
    ));
  }

  function confirmGenerate() {
    const newNodes: Node[] = previewNodes.map((n, i) => {
      const s = styleMap[n.type] || styleMap.http;
      const nodeType = n.type === "condition" ? "condition" : "custom";
      // Layout: stagger Y for branching workflows
      const hasBranch = previewEdges.some(e => e.handle);
      const x = 80 + i * 280;
      const y = hasBranch ? (i % 2 === 0 ? 130 : 310) : 180;
      return {
        id: `ai_${Date.now()}_${i}`,
        type: nodeType,
        position: { x, y },
        data: { label: n.label, desc: n.desc, ...s, config: n.config }
      };
    });

    const newEdges: Edge[] = previewEdges.length > 0
      ? previewEdges.map((e, i) => ({
          id: `edge_ai_${i}`,
          source: newNodes[e.from]?.id || "",
          target: newNodes[e.to]?.id || "",
          sourceHandle: e.handle || undefined,
          animated: true,
          style: { stroke: e.handle === "yes" ? "#059669" : e.handle === "no" ? "#DC2626" : "#818CF8", strokeWidth: 2 }
        })).filter(e => e.source && e.target)
      : newNodes.slice(0, -1).map((node, i) => ({
          id: `edge_ai_${i}`,
          source: node.id,
          target: newNodes[i + 1].id,
          animated: true,
          style: { stroke: "#818CF8", strokeWidth: 2 }
        }));

    onGenerate(newNodes, newEdges, replace);
    setTimeout(onSave, 400);
    onClose();
  }

  const iconForType = (type: string) => {
    const block = [...nodeBlocks.triggers, ...nodeBlocks.actions, ...nodeBlocks.logique, ...nodeBlocks.ai].find(b => b.type === type);
    return block?.icon || Globe;
  };

  return (
    <div className="ai-overlay" onClick={onClose}>
      <div className="ai-modal glass-panel" onClick={e => e.stopPropagation()} style={{ display:"flex", flexDirection:"column", height:"min(640px, 85vh)", padding:0 }}>

        {/* Header */}
        <div className="glass-card" style={{ padding:"1rem 1.25rem", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between", borderRadius:"16px 16px 0 0", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:".6rem" }}>
            <div style={{ width:32, height:32, borderRadius:9, background:"#4F46E5", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Wand2 size={15} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize:".875rem", fontWeight:700, color:"#0A0A0A" }}>Assistant IA Loopflo</p>
              <p style={{ fontSize:".72rem", color:"#9CA3AF" }}>{preview ? `${previewNodes.length} bloc${previewNodes.length > 1 ? "s" : ""} — vérifiez avant de générer` : "Je configure votre workflow en quelques questions"}</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:".4rem", alignItems:"center" }}>
            {preview && (
              <button onClick={() => setPreview(null)} style={{ fontSize:".72rem", fontWeight:600, color:"#6B7280", background:"#F9FAFB", border:"1px solid #E5E7EB", padding:".3rem .6rem", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>
                Retour
              </button>
            )}
            <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#6B7280", padding:4 }}>
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* PREVIEW MODE */}
        {preview ? (
          <>
            <div style={{ flex:1, overflowY:"auto", padding:"1rem" }}>

              {/* Replace / merge toggle (only if canvas has nodes) */}
              {hasNodes && (
                <div style={{ display:"flex", gap:".4rem", marginBottom:"1rem" }}>
                  {[{ v: true, l: "Remplacer le workflow" }, { v: false, l: "Ajouter au workflow" }].map(({ v, l }) => (
                    <button key={l} onClick={() => setReplace(v)} style={{ flex:1, padding:".45rem", borderRadius:8, fontSize:".75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:`1.5px solid ${replace === v ? "#4F46E5" : "#E5E7EB"}`, background: replace === v ? "#EEF2FF" : "#fff", color: replace === v ? "#4F46E5" : "#6B7280" }}>
                      {l}
                    </button>
                  ))}
                </div>
              )}

              {/* Node cards */}
              <div style={{ display:"flex", flexDirection:"column", gap:".5rem" }}>
                {previewNodes.map((node, idx) => {
                  const s = styleMap[node.type] || styleMap.http;
                  const Icon = iconForType(node.type);
                  const isOpen = expandedNode === idx;
                  const simpleConfig = Object.entries(node.config).filter(([k, v]) => v && !COMPLEX_FIELDS.includes(k));
                  const complexConfig = Object.entries(node.config).filter(([k, v]) => v && COMPLEX_FIELDS.includes(k));

                  return (
                    <div key={idx} className="glass-card" style={{ border:`1.5px solid ${s.border}`, borderRadius:10, overflow:"hidden" }}>
                      {/* Card header */}
                      <div
                        onClick={() => setExpandedNode(isOpen ? null : idx)}
                        style={{ display:"flex", alignItems:"center", gap:".65rem", padding:".65rem .9rem", background:s.bg, cursor:"pointer" }}
                      >
                        <div style={{ width:24, height:24, borderRadius:6, background:"#fff", border:`1px solid ${s.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <Icon size={11} color={s.color} strokeWidth={2} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:".82rem", fontWeight:700, color:"#0A0A0A" }}>{node.label}</p>
                          <p style={{ fontSize:".7rem", color:"#6B7280", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{node.desc}</p>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:".4rem", flexShrink:0 }}>
                          {simpleConfig.length > 0 && (
                            <span style={{ fontSize:".65rem", fontWeight:700, background:s.color, color:"#fff", padding:".1rem .4rem", borderRadius:100 }}>
                              {simpleConfig.length} param{simpleConfig.length > 1 ? "s" : ""}
                            </span>
                          )}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition:".15s", color:"#9CA3AF" }}>
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>

                      {/* Editable config */}
                      {isOpen && (
                        <div style={{ padding:".75rem .9rem", display:"flex", flexDirection:"column", gap:".6rem", borderTop:`1px solid ${s.border}` }}>
                          {simpleConfig.length === 0 && complexConfig.length === 0 && (
                            <p style={{ fontSize:".75rem", color:"#9CA3AF", textAlign:"center" }}>Pas de config — configurez après génération.</p>
                          )}
                          {simpleConfig.map(([key, val]) => (
                            <div key={key}>
                              <label style={{ fontSize:".7rem", fontWeight:700, color:"#6B7280", display:"block", marginBottom:".2rem", textTransform:"capitalize" }}>
                                {key.replace(/_/g, " ")}
                              </label>
                              {(val.length > 60 || key === "body" || key === "content" || key === "prompt" || key === "message" || key === "condition") ? (
                                <textarea
                                  value={val}
                                  onChange={e => updateConfig(idx, key, e.target.value)}
                                  rows={3}
                                  style={{ width:"100%", padding:".45rem .6rem", border:"1.5px solid #E5E7EB", borderRadius:7, fontSize:".78rem", fontFamily:"inherit", outline:"none", resize:"vertical", lineHeight:1.5, boxSizing:"border-box" }}
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={val}
                                  onChange={e => updateConfig(idx, key, e.target.value)}
                                  style={{ width:"100%", padding:".45rem .6rem", border:"1.5px solid #E5E7EB", borderRadius:7, fontSize:".78rem", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
                                />
                              )}
                            </div>
                          ))}
                          {complexConfig.length > 0 && (
                            <p style={{ fontSize:".7rem", color:"#9CA3AF", fontStyle:"italic" }}>
                              {complexConfig.map(([k]) => k).join(", ")} — à configurer via le panneau apres generation.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirm button */}
            <div style={{ padding:".9rem 1rem", borderTop:"1px solid #F3F4F6", flexShrink:0 }}>
              <button
                onClick={confirmGenerate}
                style={{ width:"100%", padding:".75rem", borderRadius:10, fontSize:".9rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", border:"none", color:"#fff", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:".5rem" }}
              >
                <Wand2 size={15} strokeWidth={2} />
                Générer le workflow ({previewNodes.length} blocs)
              </button>
            </div>
          </>
        ) : (
          <>
            {/* CHAT MODE */}
            <div style={{ flex:1, overflowY:"auto", padding:"1rem", display:"flex", flexDirection:"column", gap:".75rem" }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display:"flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {msg.role === "assistant" && (
                    <div style={{ width:24, height:24, borderRadius:7, background:"#4F46E5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginRight:".5rem", marginTop:2 }}>
                      <Wand2 size={11} color="#fff" strokeWidth={2} />
                    </div>
                  )}
                  <div style={{ maxWidth:"80%", padding:".65rem .9rem", borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: msg.role === "user" ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "rgba(255,255,255,0.72)", backdropFilter: msg.role === "assistant" ? "blur(16px)" : undefined, WebkitBackdropFilter: msg.role === "assistant" ? "blur(16px)" : undefined, border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.82)", boxShadow: msg.role === "user" ? "0 4px 12px rgba(99,102,241,0.25)" : "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)", color: msg.role === "user" ? "#fff" : "#374151", fontSize:".84rem", lineHeight:1.6, whiteSpace:"pre-wrap" }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display:"flex", alignItems:"center", gap:".5rem" }}>
                  <div style={{ width:24, height:24, borderRadius:7, background:"#4F46E5", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Loader2 size={11} color="#fff" strokeWidth={2} style={{ animation:"spin 1s linear infinite" }} />
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.72)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:"1px solid rgba(255,255,255,0.82)", boxShadow:"0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)", borderRadius:"12px 12px 12px 2px", padding:".65rem .9rem", display:"flex", gap:".3rem" }}>
                    {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#C7D2FE", animation:`bounce 1s ${i * 0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {messages.length === 1 && (
              <div style={{ padding:"0 1rem .75rem", flexShrink:0 }}>
                <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:600, marginBottom:".4rem" }}>EXEMPLES :</p>
                <div style={{ display:"flex", flexDirection:"column", gap:".3rem" }}>
                  {EXAMPLES.map(ex => (
                    <button key={ex} onClick={() => sendMessage(ex)} style={{ textAlign:"left", fontSize:".78rem", color:"#4F46E5", background:"#F5F3FF", border:"1px solid #DDD6FE", padding:".4rem .7rem", borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>
                      → {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p style={{ fontSize:".8rem", color:"#DC2626", margin:"0 1rem .5rem", background:"#FEF2F2", padding:".5rem .75rem", borderRadius:7, border:"1px solid #FECACA", flexShrink:0 }}>{error}</p>}

            <div style={{ padding:".75rem 1rem", borderTop:"1px solid #F3F4F6", display:"flex", gap:".5rem", flexShrink:0 }}>
              <input
                type="text"
                style={{ flex:1, padding:".7rem .9rem", border:"1.5px solid rgba(199,210,254,0.8)", borderRadius:10, fontSize:".85rem", fontFamily:"inherit", outline:"none", background:"rgba(245,243,255,0.75)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", color:"#0A0A0A", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.7)" }}
                placeholder="Décrivez votre workflow ou répondez..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                disabled={loading}
                autoFocus
              />
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ padding:".7rem 1rem", borderRadius:10, fontSize:".85rem", fontWeight:600, background: loading ? "#9CA3AF" : "#4F46E5", border:"none", color:"#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:".4rem" }}>
                {loading ? <Loader2 size={13} strokeWidth={2} /> : <Wand2 size={13} strokeWidth={2} />}
              </button>
            </div>
          </>
        )}
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
  const [showAiChat, setShowAiChat] = useState(false);
  const [configNodeId, setConfigNodeId] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<NodeConfig>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testDetails, setTestDetails] = useState<{ node: string; status: string; result?: unknown; error?: string }[] | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [helpLabel, setHelpLabel] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch("/api/user/plan").then(r => r.json()).then(d => setUserPlan(d.plan || "free"));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get("id");
    const urlTemplate = params.get("template");

    if (urlId) {
      fetch(`/api/workflows/${urlId}`).then(r => r.json()).then(data => {
        if (!data.id) return;
        setWorkflowId(data.id);
        setWorkflowName(data.name);
        setActive(data.active);
        if (data.data?.nodes) setNodes(data.data.nodes.map((n: { id: string; type: string; position: { x: number; y: number }; data: NodeData }) => ({ ...n, data: { ...n.data } })));
        if (data.data?.edges) setEdges(data.data.edges);
      });
    } else if (urlTemplate) {
      import("@/lib/templates").then(({ getTemplate }) => {
        const tpl = getTemplate(urlTemplate);
        if (!tpl) return;
        // Vérifier si le template contient des blocs IA
        const AI_LABELS = ["filtre ia", "générer texte"];
        const hasAI = tpl.nodes.some(n => AI_LABELS.some(l => (n.data?.label || "").toLowerCase().includes(l)));
        // Récupérer le plan actuel depuis l'état (userPlan est chargé en parallèle)
        fetch("/api/user/plan").then(r => r.json()).then(({ plan }) => {
          if (hasAI && plan !== "pro" && plan !== "business") {
            setShowUpgradeModal(true);
            return;
          }
          setWorkflowName(tpl.name);
          setNodes(tpl.nodes.map(n => ({ ...n, data: { ...n.data } })));
          setEdges(tpl.edges);
        });
      });
    }
  }, []);

  const onConnect = useCallback((params: Connection) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const isCondition = (sourceNode?.data as NodeData)?.label === "Condition";
    const isYes = params.sourceHandle === "yes";
    const isNo = params.sourceHandle === "no";

    const edge: Partial<Edge> & { source: string; target: string } = {
      ...params,
      source: params.source!,
      target: params.target!,
      animated: true,
      style: { stroke: isYes ? "#059669" : isNo ? "#DC2626" : "#818CF8", strokeWidth: 2 },
      ...(isCondition && isYes && {
        label: "Oui",
        labelStyle: { fill: "#059669", fontWeight: 800, fontSize: 11 },
        labelBgStyle: { fill: "#ECFDF5", borderRadius: 4 },
        labelBgPadding: [4, 6] as [number, number],
      }),
      ...(isCondition && isNo && {
        label: "Non",
        labelStyle: { fill: "#DC2626", fontWeight: 800, fontSize: 11 },
        labelBgStyle: { fill: "#FEF2F2", borderRadius: 4 },
        labelBgPadding: [4, 6] as [number, number],
      }),
    };
    setEdges(eds => addEdge(edge as Edge, eds));
  }, [setEdges, nodes]);

  if (isMobile === null) return null;

  const triggerLabelsUi = ["webhook", "planifié", "slack event", "github", "gmail"];
  const triggerNode = nodes.find(n => triggerLabelsUi.includes((n.data as NodeData).label?.toLowerCase() ?? ""));
  const triggerType = (() => {
    const lbl = (triggerNode?.data as NodeData | undefined)?.label?.toLowerCase() ?? "";
    if (lbl === "webhook") return "webhook";
    if (lbl === "planifié") return "schedule";
    if (lbl === "slack event") return "slack_event";
    if (lbl === "github") return "github";
    if (lbl === "gmail") return "gmail";
    return "default";
  })();

  function openConfig(id: string) {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    const nodeData = node.data as NodeData;
    const existing = nodeData.config || {};

    const defaults: NodeConfig = {};
    switch (nodeData.label) {
      case "Gmail":
        if (!existing.format) defaults.format = "HTML";
        if (!existing.subject) defaults.subject = "Notification — {{source}}";
        if (!existing.body) defaults.body = "Bonjour,\n\nVoici les données reçues :\n{{message}}\n\nCordialement";
        break;
      case "Slack":
        if (!existing.channel) defaults.channel = "#general";
        if (!existing.message) defaults.message = "Nouvelle notification :\n{{message}}";
        break;
      case "Discord":
        if (!existing.message) defaults.message = "Nouvelle notification :\n**{{name}}** — {{message}}";
        break;
      case "HTTP Request":
        if (!existing.method) defaults.method = "POST";
        if (!existing.body) defaults.body = '{"email": "{{email}}", "message": "{{message}}"}';
        break;
      case "Notion":
        if (!existing.title) defaults.title = "Nouvelle entrée — {{date}}";
        if (!existing.content) defaults.content = "Source : {{source}}\nDate : {{date}}\n\n{{message}}";
        break;
      case "Filtre IA":
        if (!existing.action_if_yes) defaults.action_if_yes = "Continuer le workflow";
        if (!existing.action_if_no) defaults.action_if_no = "Arrêter le workflow";
        break;
      case "Générer texte":
        if (!existing.language) defaults.language = "Français";
        if (!existing.tone) defaults.tone = "Professionnel";
        if (!existing.max_words) defaults.max_words = "150";
        if (!existing.output_var) defaults.output_var = "texte_genere";
        if (!existing.prompt) defaults.prompt = "Résume ces données en 3 phrases : {{message}}";
        break;
      case "Telegram":
        if (!existing.message) defaults.message = "Nouvelle notification :\n**{{name}}** — {{message}}";
        break;
      case "SMS":
        if (!existing.message) defaults.message = "Notification Loopflo : {{message}}";
        if (!existing.to_number) defaults.to_number = "{{phone}}";
        break;
      case "HubSpot":
        if (!existing.email) defaults.email = "{{email}}";
        if (!existing.first_name) defaults.first_name = "{{name}}";
        break;
    }

    setConfigValues({ ...defaults, ...existing });
    setConfigNodeId(id);
  }

  function saveConfig() {
    if (!configNodeId) return;
    setNodes(nds => nds.map(n => n.id !== configNodeId ? n : { ...n, data: { ...n.data, config: { ...configValues } } }));
    setConfigNodeId(null);
  }

  function updateConfig(key: string, val: string) { setConfigValues(prev => ({ ...prev, [key]: val })); }

  const nodesWithConfig = nodes.map(n => ({ ...n, data: { ...n.data, onConfigure: openConfig } }));

  function addNode(block: typeof allBlocks[0]) {
    if (userPlan === "free" && (block.type === "ai_filter" || block.type === "ai_generate")) { setShowUpgradeModal(true); return; }
    const id = `node_${Date.now()}`;
    const nodeType = block.type === "condition" ? "condition" : "custom";
    setNodes(nds => [...nds, { id, type: nodeType, position: { x: 150 + Math.random() * 250, y: 100 + Math.random() * 200 }, data: { label: block.label, desc: block.desc, color: block.color, bg: block.bg, border: block.border, config: {} } }]);
  }

  function handleAiGenerate(newNodes: Node[], newEdges: Edge[], replace: boolean) {
    if (replace) {
      setNodes(newNodes);
      setEdges(newEdges);
    } else {
      setNodes(prev => [...prev, ...newNodes]);
      setEdges(prev => [...prev, ...newEdges]);
    }
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
    setTesting(true); setTestResult(null); setTestDetails(null);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/test`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      setTestSuccess(res.ok && !data.results?.some((r: { status: string }) => r.status === "error"));
      setTestResult(res.ok ? data.message : "Erreur : " + data.error);
      if (data.results) setTestDetails(data.results);
    } catch { setTestResult("Erreur réseau"); setTestSuccess(false); }
    finally { setTesting(false); }
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
      {isMobile && <MobileFallback />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
        .block-item { transition: transform 0.18s, box-shadow 0.18s, background 0.18s; }
        .block-item:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06), inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.04) !important; background: rgba(255,255,255,0.97) !important; }
        .sidebar-label { font-size:.68rem; font-weight:700; color:#7C6FAE; text-transform:uppercase; letter-spacing:.1em; margin:1.25rem 0 .6rem; }
        .react-flow__attribution { display:none !important; }
        .react-flow__controls { background:rgba(248,246,255,0.88) !important; backdrop-filter:blur(28px) saturate(200%) !important; -webkit-backdrop-filter:blur(28px) saturate(200%) !important; box-shadow:0 8px 24px rgba(99,102,241,0.14), inset 0 1.5px 0 rgba(255,255,255,1) !important; border:1.5px solid rgba(255,255,255,0.95) !important; border-radius:12px !important; overflow:hidden; }
        .react-flow__controls button { background:transparent !important; border-bottom:1px solid rgba(99,102,241,0.08) !important; color:#4F46E5 !important; font-weight:600 !important; }
        .react-flow__controls button:hover { background:rgba(99,102,241,0.10) !important; }
        .react-flow__minimap { background:rgba(248,246,255,0.88) !important; backdrop-filter:blur(28px) saturate(200%) !important; -webkit-backdrop-filter:blur(28px) saturate(200%) !important; border:1.5px solid rgba(255,255,255,0.95) !important; border-radius:12px !important; overflow:hidden; box-shadow:0 8px 24px rgba(99,102,241,0.14) !important; }
        .ai-overlay { position:fixed; top:52px; left:220px; right:0; bottom:0; background:rgba(79,70,229,0.10); backdrop-filter:blur(2px); z-index:200; display:flex; align-items:flex-start; justify-content:center; padding-top:32px; }
        .ai-modal { border-radius:18px; width:100%; max-width:540px; box-shadow:0 20px 60px rgba(99,102,241,0.22); }
        .glass-panel input:not([type="range"]), .glass-panel select, .glass-panel textarea { background:rgba(255,255,255,0.78) !important; backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); border:1.5px solid rgba(0,0,0,0.08) !important; border-radius:10px; }
        .glass-panel input:not([type="range"]):focus, .glass-panel select:focus, .glass-panel textarea:focus { background:rgba(255,255,255,0.97) !important; border-color:rgba(99,102,241,0.50) !important; box-shadow:0 0 0 3px rgba(99,102,241,0.12) !important; }
        input:focus, select:focus, textarea:focus { border-color:#818CF8 !important; box-shadow:0 0 0 3px rgba(99,102,241,0.12) !important; background:rgba(255,255,255,0.97) !important; }
        .workflow-name-input { background:none; border:none; outline:none; font-family:'Plus Jakarta Sans',sans-serif; font-size:.9rem; font-weight:700; color:#0A0A0A; width:200px; border-bottom:2px solid #4F46E5; padding-bottom:2px; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>

      <nav className="glass-nav" style={{ padding:".75rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"fixed", top:0, left:0, right:0, zIndex:100, height:52 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <a href="/dashboard" style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:600, color:"#4F46E5", textDecoration:"none", padding:".4rem .8rem", borderRadius:9, background:"rgba(238,242,255,0.88)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:"1.5px solid rgba(199,210,254,0.9)", boxShadow:"0 2px 8px rgba(99,102,241,0.10), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
            <ArrowLeft size={13} strokeWidth={2} /> Retour
          </a>
          <button onClick={() => setShowTutorial(true)} style={{ fontSize:".78rem", fontWeight:600, color:"#374151", background:"rgba(255,255,255,0.85)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:"1.5px solid rgba(255,255,255,0.95)", padding:".4rem .8rem", borderRadius:9, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 8px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,1)" }}>Tutoriel</button>
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
              <button onClick={() => setShowUpgradeModal(true)} style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:600, background:"rgba(229,231,235,0.80)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:"1.5px solid rgba(255,255,255,0.9)", color:"#9CA3AF", padding:".5rem 1rem", borderRadius:9, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <Wand2 size={13} strokeWidth={2} /> Générer avec l&apos;IA
              </button>
              <span style={{ position:"absolute", top:-6, right:-6, background:"#4F46E5", color:"#fff", fontSize:".6rem", fontWeight:700, padding:".1rem .4rem", borderRadius:"100px", pointerEvents:"none" }}>PRO</span>
            </div>
          ) : (
            <button onClick={() => setShowAiChat(true)} style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:700, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", border:"none", color:"#fff", padding:".5rem 1.1rem", borderRadius:9, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 18px rgba(99,102,241,0.42)" }}>
              <Wand2 size={13} strokeWidth={2} /> Générer avec l&apos;IA
            </button>
          )}
          <button onClick={handleSave} style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:700, background: saved ? "rgba(236,253,245,0.90)" : "rgba(255,255,255,0.88)", backdropFilter:"blur(16px) saturate(180%)", WebkitBackdropFilter:"blur(16px) saturate(180%)", border:`1.5px solid ${saved ? "rgba(167,243,208,0.9)" : "rgba(255,255,255,0.95)"}`, color: saved ? "#059669" : "#374151", padding:".5rem 1.1rem", borderRadius:9, cursor:"pointer", fontFamily:"inherit", transition:"all .2s", boxShadow: saved ? "0 4px 16px rgba(16,185,129,0.15), inset 0 1.5px 0 rgba(255,255,255,1)" : "0 4px 16px rgba(0,0,0,0.08), inset 0 1.5px 0 rgba(255,255,255,1)" }}>
            <Save size={13} strokeWidth={2} /> {saved ? "Sauvegardé !" : "Sauvegarder"}
          </button>
          <button onClick={handleActivate} style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:700, background: active ? "linear-gradient(135deg,#059669,#10B981)" : "linear-gradient(135deg,#1e293b,#0f172a)", border:"none", color:"#fff", padding:".5rem 1.1rem", borderRadius:9, cursor:"pointer", fontFamily:"inherit", boxShadow: active ? "0 4px 18px rgba(5,150,105,0.42)" : "0 4px 18px rgba(0,0,0,0.32)" }}>
            <Play size={13} strokeWidth={2} /> {active ? "Actif" : "Activer"}
          </button>
          {workflowId && (
            <button onClick={handleTest} disabled={testing} style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", fontWeight:700, background: testResult ? (testSuccess ? "rgba(236,253,245,0.90)" : "rgba(254,242,242,0.90)") : "rgba(240,253,244,0.90)", backdropFilter:"blur(16px) saturate(180%)", WebkitBackdropFilter:"blur(16px) saturate(180%)", border:`1.5px solid ${testResult ? (testSuccess ? "rgba(167,243,208,0.9)" : "rgba(254,202,202,0.9)") : "rgba(187,247,208,0.9)"}`, color: testResult ? (testSuccess ? "#059669" : "#DC2626") : "#16A34A", padding:".5rem 1.1rem", borderRadius:9, cursor: testing ? "not-allowed" : "pointer", fontFamily:"inherit", boxShadow: testResult ? (testSuccess ? "0 4px 16px rgba(16,185,129,0.15)" : "0 4px 16px rgba(220,38,38,0.12)") : "0 4px 16px rgba(22,163,74,0.12)", transition:"all .2s" }}>
              {testing ? <Loader2 size={13} strokeWidth={2} /> : "▶"}
              {testing ? "Test..." : testResult || "Tester"}
            </button>
          )}
        </div>
      </nav>

      {webhookUrl && (
        <div style={{ position:"fixed", top:52, left:220, right:0, zIndex:98, background:"rgba(236,253,245,0.88)", backdropFilter:"blur(20px) saturate(160%)", WebkitBackdropFilter:"blur(20px) saturate(160%)", borderBottom:"1px solid rgba(167,243,208,0.75)", padding:".65rem 1.5rem", display:"flex", alignItems:"center", gap:"1rem", boxShadow:"0 2px 8px rgba(16,185,129,0.06)" }}>
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
          <div className="glass-panel" style={{ borderRadius:16, padding:"2rem", maxWidth:420, width:"90%", boxShadow:"0 8px 32px rgba(0,0,0,0.12)" }} onClick={e => e.stopPropagation()}>
            <div style={{ width:48, height:48, borderRadius:12, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
              <Wand2 size={22} color="#4F46E5" strokeWidth={2} />
            </div>
            <h2 style={{ fontSize:"1.1rem", fontWeight:800, textAlign:"center", marginBottom:".5rem" }}>Fonctionnalité Pro</h2>
            <p style={{ fontSize:".875rem", color:"#6B7280", textAlign:"center", lineHeight:1.7, marginBottom:"1.5rem" }}>Les blocs IA sont disponibles à partir du plan <strong>Pro</strong> à 19€/mois.</p>
            <a href="/pricing" style={{ display:"block", width:"100%", padding:".75rem", borderRadius:10, fontSize:".9rem", fontWeight:600, background:"#4F46E5", color:"#fff", border:"none", cursor:"pointer", fontFamily:"inherit", textAlign:"center", textDecoration:"none", boxSizing:"border-box" }}>Voir les plans</a>
            <button onClick={() => setShowUpgradeModal(false)} style={{ width:"100%", marginTop:".5rem", padding:".6rem", borderRadius:10, fontSize:".875rem", fontWeight:500, background:"transparent", color:"#9CA3AF", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Continuer sans IA</button>
          </div>
        </div>
      )}

      {helpLabel && <HelpPanel label={helpLabel} onClose={() => setHelpLabel(null)} />}

      {configNodeId && configNodeData && !helpLabel && (
        <ConfigPanel label={configNodeData.label} config={configValues} onUpdate={updateConfig} onClose={() => setConfigNodeId(null)} onSave={saveConfig} triggerType={triggerType} onShowHelp={() => setHelpLabel(configNodeData.label)} />
      )}

      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}

      {showAiChat && <AiChat onClose={() => setShowAiChat(false)} onGenerate={handleAiGenerate} hasNodes={nodes.length > 1} onSave={handleSave} />}

      <div className="glass-panel" style={{ position:"fixed", top: webhookUrl ? 88 : 52, left:0, bottom:0, width:220, zIndex:99, padding:"1rem", overflowY:"auto", background:"rgba(245,242,255,0.90)", backdropFilter:"blur(48px) saturate(210%) brightness(103%)", WebkitBackdropFilter:"blur(48px) saturate(210%) brightness(103%)", borderRight:"1.5px solid rgba(255,255,255,0.95)", boxShadow:"4px 0 32px rgba(99,102,241,0.10), inset -1px 0 0 rgba(255,255,255,0.8)" }}>
        <div style={{ background:"rgba(238,242,255,0.90)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:"1.5px solid rgba(199,210,254,0.9)", borderRadius:9, padding:".6rem .75rem", marginBottom:"1rem", display:"flex", alignItems:"center", gap:".5rem", boxShadow:"0 2px 10px rgba(99,102,241,0.10), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
          <Plus size={12} color="#4F46E5" strokeWidth={2.5} />
          <span style={{ fontSize:".75rem", color:"#4F46E5", fontWeight:700 }}>Cliquer pour ajouter</span>
        </div>
        <p className="sidebar-label">Déclencheurs</p>
        {nodeBlocks.triggers.map(block => (
          <div key={block.type} className="block-item" onClick={() => addNode(block)} style={{ background: `linear-gradient(145deg, rgba(255,255,255,0.92) 0%, ${block.bg}55 100%)`, backdropFilter: "blur(24px) saturate(200%)", WebkitBackdropFilter: "blur(24px) saturate(200%)", border:"1.5px solid rgba(255,255,255,0.90)", borderRadius:10, padding:".6rem .75rem", marginBottom:".5rem", cursor:"pointer", display:"flex", alignItems:"center", gap:".6rem", boxShadow:`0 6px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05), inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.04)` }}>
            <div style={{ width:24, height:24, borderRadius:6, background:block.bg, border:`1px solid ${block.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
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
          <div key={block.type} className="block-item" onClick={() => addNode(block)} style={{ background: `linear-gradient(145deg, rgba(255,255,255,0.92) 0%, ${block.bg}55 100%)`, backdropFilter: "blur(24px) saturate(200%)", WebkitBackdropFilter: "blur(24px) saturate(200%)", border:"1.5px solid rgba(255,255,255,0.90)", borderRadius:10, padding:".6rem .75rem", marginBottom:".5rem", cursor:"pointer", display:"flex", alignItems:"center", gap:".6rem", boxShadow:`0 6px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05), inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.04)` }}>
            <div style={{ width:24, height:24, borderRadius:6, background:block.bg, border:`1px solid ${block.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <block.icon size={12} color={block.color} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize:".8rem", fontWeight:700, color:"#0A0A0A", lineHeight:1.2 }}>{block.label}</p>
              <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:500 }}>{block.desc}</p>
            </div>
          </div>
        ))}
        <p className="sidebar-label">Logique</p>
        {nodeBlocks.logique.map(block => (
          <div key={block.type} className="block-item" onClick={() => addNode(block)} style={{ background: `linear-gradient(145deg, rgba(255,255,255,0.92) 0%, ${block.bg}55 100%)`, backdropFilter: "blur(24px) saturate(200%)", WebkitBackdropFilter: "blur(24px) saturate(200%)", border:"1.5px solid rgba(255,255,255,0.90)", borderRadius:10, padding:".6rem .75rem", marginBottom:".5rem", cursor:"pointer", display:"flex", alignItems:"center", gap:".6rem", boxShadow:`0 6px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05), inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.04)` }}>
            <div style={{ width:24, height:24, borderRadius:6, background:block.bg, border:`1px solid ${block.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
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
            <div key={block.type} onClick={() => setShowUpgradeModal(true)} style={{ background:"linear-gradient(145deg, rgba(255,255,255,0.80) 0%, rgba(243,244,246,0.60) 100%)", backdropFilter:"blur(16px) saturate(150%)", WebkitBackdropFilter:"blur(16px) saturate(150%)", border:"1.5px solid rgba(255,255,255,0.80)", borderRadius:10, padding:".6rem .75rem", marginBottom:".5rem", cursor:"pointer", display:"flex", alignItems:"center", gap:".6rem", opacity:.7, boxShadow:"0 4px 12px rgba(0,0,0,0.05), inset 0 1.5px 0 rgba(255,255,255,0.9)" }}>
              <div style={{ width:24, height:24, borderRadius:6, background:"#fff", border:"1px solid #E5E7EB", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <block.icon size={12} color="#9CA3AF" strokeWidth={2} />
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:".8rem", fontWeight:700, color:"#9CA3AF" }}>{block.label}</p>
                <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:500 }}>{block.desc}</p>
              </div>
              <span style={{ fontSize:".6rem", fontWeight:700, background:"#4F46E5", color:"#fff", padding:".1rem .4rem", borderRadius:"100px", flexShrink:0 }}>PRO</span>
            </div>
          ) : (
            <div key={block.type} className="block-item" onClick={() => addNode(block)} style={{ background: `linear-gradient(145deg, rgba(255,255,255,0.92) 0%, ${block.bg}55 100%)`, backdropFilter: "blur(24px) saturate(200%)", WebkitBackdropFilter: "blur(24px) saturate(200%)", border:"1.5px solid rgba(255,255,255,0.90)", borderRadius:10, padding:".6rem .75rem", marginBottom:".5rem", cursor:"pointer", display:"flex", alignItems:"center", gap:".6rem", boxShadow:`0 6px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05), inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.04)` }}>
              <div style={{ width:24, height:24, borderRadius:6, background:"#fff", border:`1px solid ${block.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <block.icon size={12} color={block.color} strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize:".8rem", fontWeight:700, color:"#0A0A0A" }}>{block.label}</p>
                <p style={{ fontSize:".7rem", color:"#9CA3AF", fontWeight:500 }}>{block.desc}</p>
              </div>
            </div>
          )
        ))}
      </div>

      <div style={{ position:"fixed", top: webhookUrl ? 88 : 52, left:220, right: (configNodeId && !helpLabel) || helpLabel ? 360 : 0, bottom:0 }}>
        <ReactFlow nodes={nodesWithConfig} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView defaultEdgeOptions={{ animated: true, style: { stroke: "#818CF8", strokeWidth: 2 } }}>
          <Controls />
          <MiniMap nodeColor={node => (node.data as NodeData).bg || "#EEF2FF"} maskColor="rgba(249,250,251,0.7)" />
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#E5E7EB" />
        </ReactFlow>
      </div>

      {/* Modal résultats de test */}
      {testDetails && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setTestDetails(null)}>
          <div className="glass-panel" style={{ borderRadius:16, width:"90%", maxWidth:480, maxHeight:"80vh", display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,.2)" }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:".6rem" }}>
                <div style={{ width:30, height:30, borderRadius:8, background: testSuccess ? "#ECFDF5" : "#FEF2F2", border:`1px solid ${testSuccess ? "#A7F3D0" : "#FECACA"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {testSuccess
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 8v4m0 4h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/></svg>
                  }
                </div>
                <div>
                  <p style={{ fontWeight:700, fontSize:".9rem", color:"#0A0A0A" }}>Résultats du test</p>
                  <p style={{ fontSize:".72rem", color:"#9CA3AF" }}>{testResult}</p>
                </div>
              </div>
              <button onClick={() => setTestDetails(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", padding:4 }}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Résumé */}
            <div style={{ padding:".75rem 1.5rem", background:"rgba(249,250,251,0.72)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", borderBottom:"1px solid rgba(243,244,246,0.9)", display:"flex", gap:".75rem" }}>
              {[
                { label:"Réussis", count: testDetails.filter((r: { status: string }) => r.status === "success").length, color:"#059669", bg:"#ECFDF5", border:"#A7F3D0" },
                { label:"Erreurs", count: testDetails.filter((r: { status: string }) => r.status === "error").length, color:"#DC2626", bg:"#FEF2F2", border:"#FECACA" },
                { label:"Ignorés", count: testDetails.filter((r: { status: string }) => r.status === "skipped").length, color:"#6B7280", bg:"#F9FAFB", border:"#E5E7EB" },
              ].map(s => s.count > 0 && (
                <span key={s.label} style={{ fontSize:".72rem", fontWeight:700, padding:".2rem .65rem", borderRadius:100, background:s.bg, border:`1px solid ${s.border}`, color:s.color }}>
                  {s.count} {s.label}
                </span>
              ))}
            </div>

            {/* Liste des nœuds */}
            <div style={{ overflowY:"auto", flex:1 }}>
              {(testDetails as Array<{ node: string; status: string; result?: unknown; error?: string }>).map((r, i) => (
                <div key={i} style={{ padding:".9rem 1.5rem", borderBottom:"1px solid #F9FAFB", display:"flex", gap:".9rem", alignItems:"flex-start" }}>
                  <div style={{
                    width:24, height:24, borderRadius:6, flexShrink:0, marginTop:2,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background: r.status === "success" ? "#ECFDF5" : r.status === "skipped" ? "#F9FAFB" : "#FEF2F2",
                    border: `1px solid ${r.status === "success" ? "#A7F3D0" : r.status === "skipped" ? "#E5E7EB" : "#FECACA"}`,
                  }}>
                    {r.status === "success"
                      ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : r.status === "skipped"
                      ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="#DC2626" strokeWidth="3" strokeLinecap="round"/></svg>
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:".3rem" }}>
                      <p style={{ fontSize:".85rem", fontWeight:700, color:"#0A0A0A" }}>{r.node}</p>
                      <span style={{ fontSize:".65rem", fontWeight:700, textTransform:"uppercase", padding:".1rem .45rem", borderRadius:100, background: r.status === "success" ? "#ECFDF5" : r.status === "skipped" ? "#F9FAFB" : "#FEF2F2", color: r.status === "success" ? "#059669" : r.status === "skipped" ? "#9CA3AF" : "#DC2626", border:`1px solid ${r.status === "success" ? "#A7F3D0" : r.status === "skipped" ? "#E5E7EB" : "#FECACA"}` }}>
                        {r.status === "success" ? "OK" : r.status === "skipped" ? "Ignoré" : "Erreur"}
                      </span>
                    </div>
                    {r.status === "error" && r.error && (
                      <p style={{ fontSize:".78rem", color:"#DC2626", background:"#FEF2F2", padding:".4rem .6rem", borderRadius:6, border:"1px solid #FECACA", wordBreak:"break-word" }}>{r.error}</p>
                    )}
                    {r.status === "success" && r.result != null && (
                      <p style={{ fontSize:".75rem", color:"#374151", background:"#F9FAFB", padding:".4rem .6rem", borderRadius:6, border:"1px solid #E5E7EB", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {typeof r.result === "object" ? JSON.stringify(r.result as Record<string, unknown>) : String(r.result as string | number | boolean)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding:"1rem 1.5rem", borderTop:"1px solid #F3F4F6" }}>
              <button onClick={() => setTestDetails(null)} style={{ width:"100%", padding:".65rem", borderRadius:8, fontSize:".875rem", fontWeight:600, background:"#4F46E5", border:"none", color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function NewWorkflowPage() {
  return <ReactFlowProvider><WorkflowEditor /></ReactFlowProvider>;
}