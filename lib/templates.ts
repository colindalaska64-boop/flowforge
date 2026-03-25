export type TemplateNode = {
  id: string;
  type: "custom" | "condition";
  position: { x: number; y: number };
  data: {
    label: string;
    desc: string;
    color: string;
    bg: string;
    border: string;
    config: Record<string, string>;
  };
};

export type TemplateEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  animated: boolean;
  style: { stroke: string; strokeWidth: number };
  label?: string;
  labelStyle?: Record<string, unknown>;
  labelBgStyle?: Record<string, unknown>;
  labelBgPadding?: [number, number];
};

export type Template = {
  slug: string;
  name: string;
  description: string;
  category: string;
  setup: string;
  tools: string[];
  nodes: TemplateNode[];
  edges: TemplateEdge[];
};

export const templates: Template[] = [
  {
    slug: "webhook-email",
    name: "Alerte email sur webhook",
    description: "Reçois un email à chaque fois qu'un événement arrive via webhook. Idéal pour les notifications de formulaires, paiements ou APIs.",
    category: "Notifications",
    setup: "2 min",
    tools: ["Webhook", "Gmail"],
    nodes: [
      {
        id: "1", type: "custom", position: { x: 80, y: 160 },
        data: { label: "Webhook", desc: "Requête HTTP entrante", color: "#D97706", bg: "#FFF7ED", border: "#FDE68A", config: { description: "Événement entrant" } },
      },
      {
        id: "2", type: "custom", position: { x: 380, y: 160 },
        data: { label: "Gmail", desc: "Envoyer un email", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", config: { subject: "Nouvelle notification — {{source}}", body: "Bonjour,\n\nVous avez reçu un nouvel événement :\n\nSource : {{source}}\nDate : {{date}}\n\nCordialement,\nLoopflo" } },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#818CF8", strokeWidth: 2 } },
    ],
  },

  {
    slug: "webhook-slack",
    name: "Alerte Slack sur webhook",
    description: "Envoie un message dans ton canal Slack dès qu'un événement est reçu. Parfait pour alerter l'équipe en temps réel.",
    category: "Notifications",
    setup: "3 min",
    tools: ["Webhook", "Slack"],
    nodes: [
      {
        id: "1", type: "custom", position: { x: 80, y: 160 },
        data: { label: "Webhook", desc: "Requête HTTP entrante", color: "#D97706", bg: "#FFF7ED", border: "#FDE68A", config: { description: "Événement entrant" } },
      },
      {
        id: "2", type: "custom", position: { x: 380, y: 160 },
        data: { label: "Slack", desc: "Envoyer un message", color: "#7C3AED", bg: "#FDF4FF", border: "#E9D5FF", config: { channel: "#général", message: "Nouvel événement reçu !\n- Source : {{source}}\n- Date : {{date}}\n- Message : {{message}}" } },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#818CF8", strokeWidth: 2 } },
    ],
  },

  {
    slug: "webhook-sheets",
    name: "Logger dans Google Sheets",
    description: "Enregistre automatiquement chaque événement webhook dans un tableur Google Sheets. Idéal pour garder un historique ou analyser des données.",
    category: "Données",
    setup: "5 min",
    tools: ["Webhook", "Google Sheets"],
    nodes: [
      {
        id: "1", type: "custom", position: { x: 80, y: 160 },
        data: { label: "Webhook", desc: "Requête HTTP entrante", color: "#D97706", bg: "#FFF7ED", border: "#FDE68A", config: { description: "Données entrantes" } },
      },
      {
        id: "2", type: "custom", position: { x: 380, y: 160 },
        data: { label: "Google Sheets", desc: "Ajouter une ligne", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", config: { sheet_name: "Feuille1" } },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#818CF8", strokeWidth: 2 } },
    ],
  },

  {
    slug: "condition-routing",
    name: "Routage conditionnel",
    description: "Analyse les données reçues et dirige vers deux chemins différents selon une condition. Ex : urgents → Slack, autres → Sheets.",
    category: "Logique",
    setup: "5 min",
    tools: ["Webhook", "Condition", "Slack", "Gmail"],
    nodes: [
      {
        id: "1", type: "custom", position: { x: 60, y: 180 },
        data: { label: "Webhook", desc: "Requête HTTP entrante", color: "#D97706", bg: "#FFF7ED", border: "#FDE68A", config: {} },
      },
      {
        id: "2", type: "condition", position: { x: 320, y: 180 },
        data: { label: "Condition", desc: "Bifurquer selon une règle", color: "#7C3AED", bg: "#FDF4FF", border: "#E9D5FF", config: { field: "message", operator: "contient", value: "urgent" } },
      },
      {
        id: "3", type: "custom", position: { x: 580, y: 80 },
        data: { label: "Slack", desc: "Envoyer un message", color: "#7C3AED", bg: "#FDF4FF", border: "#E9D5FF", config: { channel: "#urgent", message: "URGENT : {{message}}" } },
      },
      {
        id: "4", type: "custom", position: { x: 580, y: 290 },
        data: { label: "Gmail", desc: "Envoyer un email", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", config: { subject: "Nouveau message : {{source}}", body: "Message reçu : {{message}}" } },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#818CF8", strokeWidth: 2 } },
      { id: "e2-3", source: "2", target: "3", sourceHandle: "yes", animated: true, style: { stroke: "#059669", strokeWidth: 2 }, label: "Oui", labelStyle: { fill: "#059669", fontWeight: 800, fontSize: 11 }, labelBgStyle: { fill: "#ECFDF5" }, labelBgPadding: [4, 6] },
      { id: "e2-4", source: "2", target: "4", sourceHandle: "no", animated: true, style: { stroke: "#DC2626", strokeWidth: 2 }, label: "Non", labelStyle: { fill: "#DC2626", fontWeight: 800, fontSize: 11 }, labelBgStyle: { fill: "#FEF2F2" }, labelBgPadding: [4, 6] },
    ],
  },

  {
    slug: "rapport-quotidien",
    name: "Rapport quotidien IA",
    description: "Génère et envoie automatiquement un rapport chaque matin grâce à l'IA. Tu définis le sujet, Loopflo s'occupe du reste.",
    category: "IA",
    setup: "3 min",
    tools: ["Planifié", "Générer texte", "Gmail"],
    nodes: [
      {
        id: "1", type: "custom", position: { x: 60, y: 170 },
        data: { label: "Planifié", desc: "Exécution programmée", color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE", config: { schedule: JSON.stringify({ type: "daily", hour: "09", minute: "00", timezone: "Europe/Paris" }) } },
      },
      {
        id: "2", type: "custom", position: { x: 340, y: 170 },
        data: { label: "Générer texte", desc: "Créer du contenu IA", color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE", config: { prompt: "Rédige un rapport quotidien court et professionnel sur l'activité de mon entreprise. Date : {{date}}", tone: "Professionnel", language: "Français", max_words: "200" } },
      },
      {
        id: "3", type: "custom", position: { x: 620, y: 170 },
        data: { label: "Gmail", desc: "Envoyer un email", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", config: { subject: "Rapport du jour — {{date}}", body: "Bonjour,\n\nVoici votre rapport quotidien :\n\n{{texte_genere}}\n\nBonne journée !" } },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#818CF8", strokeWidth: 2 } },
      { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#818CF8", strokeWidth: 2 } },
    ],
  },

  {
    slug: "lead-crm",
    name: "Capture de leads automatique",
    description: "Quand un formulaire est soumis, l'IA vérifie si c'est un vrai lead, puis le sauvegarde dans Notion et envoie un email de confirmation.",
    category: "IA",
    setup: "8 min",
    tools: ["Webhook", "Filtre IA", "Notion", "Gmail"],
    nodes: [
      {
        id: "1", type: "custom", position: { x: 60, y: 180 },
        data: { label: "Webhook", desc: "Formulaire soumis", color: "#D97706", bg: "#FFF7ED", border: "#FDE68A", config: { description: "Nouveau lead entrant" } },
      },
      {
        id: "2", type: "custom", position: { x: 320, y: 180 },
        data: { label: "Filtre IA", desc: "Analyser et filtrer", color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE", config: { condition: "Est-ce que ces données ressemblent à un vrai lead commercial (email valide, message sérieux) ? Réponds OUI ou NON.", context: "Je gère une entreprise SaaS et je veux filtrer les spams." } },
      },
      {
        id: "3", type: "custom", position: { x: 580, y: 100 },
        data: { label: "Notion", desc: "Créer une page", color: "#0A0A0A", bg: "#F9FAFB", border: "#E5E7EB", config: { title: "Lead : {{email}}", content: "Email : {{email}}\nMessage : {{message}}\nDate : {{date}}" } },
      },
      {
        id: "4", type: "custom", position: { x: 580, y: 280 },
        data: { label: "Gmail", desc: "Email de confirmation", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", config: { subject: "Merci pour votre message !", body: "Bonjour,\n\nMerci pour votre intérêt. Nous reviendrons vers vous rapidement.\n\nCordialement" } },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#818CF8", strokeWidth: 2 } },
      { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#059669", strokeWidth: 2 } },
      { id: "e2-4", source: "2", target: "4", animated: true, style: { stroke: "#059669", strokeWidth: 2 } },
    ],
  },
];

export function getTemplate(slug: string): Template | undefined {
  return templates.find(t => t.slug === slug);
}
