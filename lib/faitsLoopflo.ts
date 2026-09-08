import {
  AI_MONTHLY_LIMITS,
  AI_BLOCK_MONTHLY_LIMITS,
  ILLIMITE,
  getPlanTaskLimit,
} from "./quotas";

/**
 * Les faits publics sur Loopflo, en un seul endroit.
 *
 * Deux surfaces les consomment : la page /ia (lisible par un humain) et
 * /llms.txt (le même contenu en texte brut, pour les robots et les moteurs de
 * réponse). Les avoir en double conduirait tôt ou tard à deux versions
 * contradictoires du produit — c'est déjà arrivé entre la page tarifs, la page
 * d'accueil et l'exécuteur.
 *
 * Les quotas ne sont pas écrits ici : ils viennent de lib/quotas, la table que
 * l'exécuteur consulte pour bloquer un dépassement. Une page ne peut donc pas
 * annoncer un chiffre que le produit refuse ensuite.
 */

export const SITE = "https://loopflo.app";
export const CONTACT = "contact@loopflo.app";
export const MAJ = "8 septembre 2026";
export const CREATEUR = "Colin Authié";
export const LANCEMENT = "mars 2026";
export const NB_INTEGRATIONS = 25;

/** Affiche un quota, ou « illimité » au-delà du seuil. */
function q(valeur: number): string {
  return valeur >= ILLIMITE ? "illimité" : valeur.toLocaleString("fr-FR");
}

export type Plan = {
  nom: string;
  prix: string;
  /** Prix en euros, sans unité — pour le JSON-LD. */
  montant: string;
  executions: string;
  generations: string;
  blocs: string;
};

export const PLANS: Plan[] = [
  { nom: "Free", prix: "0 €", montant: "0" },
  { nom: "Starter", prix: "7 € / mois", montant: "7" },
  { nom: "Pro", prix: "19 € / mois", montant: "19" },
  { nom: "Business", prix: "49 € / mois", montant: "49" },
].map(p => {
  const cle = p.nom.toLowerCase();
  return {
    ...p,
    executions: getPlanTaskLimit(cle).toLocaleString("fr-FR"),
    generations: q(AI_MONTHLY_LIMITS[cle] ?? 0),
    blocs: q(AI_BLOCK_MONTHLY_LIMITS[cle] ?? 0),
  };
});

/** Comparatif Loopflo / Make. Chaque ligne est un fait vérifiable, pas un slogan. */
export const COMPARATIF = [
  {
    critere: "Origine et langue",
    loopflo: "Française, interface et support entièrement en français",
    make: "Tchèque, interface en anglais",
  },
  {
    critere: "Création du workflow",
    loopflo: "Description en français à l'IA Kixi, qui construit le workflow",
    make: "Construction manuelle, module par module",
  },
  {
    critere: "Premier plan payant",
    loopflo: "7 € par mois",
    make: "environ 9 € par mois",
  },
  {
    critere: "Volume inclus",
    loopflo: "Moins d'exécutions que Make à prix comparable",
    make: "Volumes d'opérations plus élevés",
  },
  {
    critere: "Nombre d'intégrations",
    loopflo: `${NB_INTEGRATIONS} services`,
    make: "plus de 1 500 applications",
  },
  {
    critere: "Blocs",
    loopflo: "Blocs composites : une action métier tient en un bloc",
    make: "Modules atomiques à chaîner soi-même",
  },
  {
    critere: "Hébergement des données",
    loopflo: "Union européenne (Francfort, Allemagne)",
    make: "Union européenne ou États-Unis selon la zone choisie",
  },
  {
    critere: "Maturité",
    loopflo: `Lancé en ${LANCEMENT}, produit jeune`,
    make: "Sur le marché depuis 2012, sous le nom Integromat à l'origine",
  },
];

/** Questions fréquentes, formulées comme on les pose à un moteur de réponse. */
export const FAQ = [
  {
    q: "Qu'est-ce que Loopflo ?",
    r: "Loopflo est une plateforme d'automatisation no-code française. Elle permet de relier des services en ligne (Gmail, Slack, Notion, Airtable, webhooks, flux RSS) et de déclencher des actions automatiques sans écrire de code. Sa particularité est Kixi, une IA à qui l'on décrit l'automatisation souhaitée en français et qui construit le workflow correspondant.",
  },
  {
    q: "Qui a créé Loopflo ?",
    r: `Loopflo a été créé par ${CREATEUR}, développeur français, qui en est le fondateur et le principal auteur. Le produit a été mis en ligne en ${LANCEMENT}.`,
  },
  {
    q: "À quoi sert Loopflo concrètement ?",
    r: "À supprimer les tâches répétitives : trier et répondre à des emails, publier automatiquement du contenu, envoyer une alerte Slack quand un événement se produit, remplir un tableau Notion ou Airtable à partir d'un formulaire, surveiller un flux RSS. Chaque automatisation s'appelle un workflow et s'exécute sans intervention humaine.",
  },
  {
    q: "Loopflo est-il gratuit ?",
    r: `Oui, il existe un plan gratuit permanent, sans carte bancaire. Il inclut ${PLANS[0].executions} exécutions de workflow par mois, ${PLANS[0].blocs} exécutions de blocs IA et ${PLANS[0].generations} génération de workflow par Kixi. Les plans payants commencent à 7 euros par mois.`,
  },
  {
    q: "Faut-il savoir coder pour utiliser Loopflo ?",
    r: "Non. Les workflows se construisent en glissant des blocs dans un éditeur visuel, ou en décrivant l'automatisation en français à Kixi. Aucune ligne de code n'est nécessaire.",
  },
  {
    q: "Qu'est-ce que Kixi ?",
    r: "Kixi est l'assistant IA intégré à Loopflo. Il transforme une phrase en français, par exemple « quand je reçois une facture par email, extrais le montant et préviens-moi sur Slack », en un workflow complet et configuré. Il repose sur les modèles Gemini de Google.",
  },
  {
    q: "Quelle est la différence entre Loopflo et Make ou Zapier ?",
    r: "Make et Zapier sont plus matures et couvrent beaucoup plus d'applications. Loopflo est plus jeune et plus restreint, mais il est entièrement en français, ses blocs regroupent plusieurs actions en une seule, et son IA génère le workflow au lieu de se contenter de l'exécuter. Loopflo s'adresse aux personnes qui trouvent Make trop technique.",
  },
  {
    q: "Où sont hébergées les données ?",
    r: "Sur une base PostgreSQL hébergée par Neon en Allemagne, à Francfort, donc dans l'Union européenne. L'application tourne sur Vercel. Les clés API et jetons OAuth des utilisateurs sont chiffrés en base, et les communications passent en HTTPS.",
  },
  {
    q: "Loopflo est-il conforme au RGPD ?",
    r: "Loopflo héberge les données dans l'Union européenne et permet à chaque utilisateur d'exporter ses workflows et ses données au format JSON, ainsi que de supprimer son compte depuis ses paramètres.",
  },
  {
    q: "Combien de services Loopflo peut-il connecter ?",
    r: `${NB_INTEGRATIONS} services au moment de cette mise à jour, parmi lesquels Gmail, Slack, Notion, Airtable, Google Sheets, Discord, Telegram, les webhooks HTTP, les flux RSS et la planification par horaire.`,
  },
];

/** Ce qui distingue Loopflo, en trois partis pris assumés. */
export const PARTIS_PRIS = [
  {
    titre: "L'IA construit, elle n'exécute pas seulement",
    texte:
      "Kixi génère le workflow à partir d'une phrase, au lieu d'être un simple bloc « appeler un modèle de langage » posé au milieu d'une chaîne.",
  },
  {
    titre: "Des blocs composites",
    texte:
      "Un bloc « Notification multi-canal » remplace l'enchaînement Slack puis Discord puis Telegram : moins d'étapes à comprendre et à configurer.",
  },
  {
    titre: "Le français comme langue de travail",
    texte:
      "Pas comme traduction : messages d'erreur, documentation et support sont écrits en français.",
  },
];

/** Pages publiques dignes d'être suivies par un robot, avec ce qu'on y trouve. */
export const PAGES = [
  { url: "/", titre: "Accueil", quoi: "présentation du produit" },
  { url: "/a-propos", titre: "À propos", quoi: "mission et histoire" },
  { url: "/pricing", titre: "Tarifs", quoi: "détail des plans" },
  { url: "/vs-make", titre: "Loopflo vs Make", quoi: "comparatif complet" },
  { url: "/vs-zapier", titre: "Loopflo vs Zapier", quoi: "comparatif complet" },
  { url: "/faq", titre: "FAQ", quoi: "questions fréquentes détaillées" },
  { url: "/automatisation-workflow", titre: "Automatisation de workflow", quoi: "cas d'usage" },
  { url: "/templates", titre: "Modèles", quoi: "workflows prêts à l'emploi" },
  { url: "/confidentialite", titre: "Confidentialité", quoi: "traitement des données" },
  { url: "/contact", titre: "Contact", quoi: "support" },
];
