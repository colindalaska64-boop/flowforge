/**
 * Les quotas de chaque plan, et rien d'autre.
 *
 * Ce module est volontairement pur : aucune connexion à la base, aucun effet de
 * bord à l'import. Il peut donc être lu par des pages statiques (la fiche /ia,
 * /llms.txt) comme par les modules qui appliquent réellement les limites
 * (lib/limits, lib/ai-limits), qui le réexportent.
 *
 * C'est la seule définition de ces chiffres dans le projet : une page marketing
 * ne peut pas annoncer autre chose que ce que le produit applique.
 */

/** Au-delà de ce seuil, le quota est considéré comme illimité. */
export const ILLIMITE = 99999;

/** Exécutions de workflow autorisées par mois et par plan. */
export const PLAN_TASK_LIMITS: Record<string, number> = {
  free: 100,
  starter: 2000,
  pro: 10000,
  business: 50000,
};

/**
 * Générations Kixi (création d'un workflow complet) autorisées par mois.
 *
 * Le plan gratuit est volontairement très limité : il sert à faire découvrir
 * Kixi, pas à l'utiliser au quotidien.
 */
export const AI_MONTHLY_LIMITS: Record<string, number> = {
  free: 1,
  starter: 15,
  pro: 100,
  business: ILLIMITE,
};

/** Exécutions de blocs IA (texte, image, voix) autorisées par mois. */
export const AI_BLOCK_MONTHLY_LIMITS: Record<string, number> = {
  free: 10,
  starter: 150,
  pro: 2000,
  business: ILLIMITE,
};

/** Exécutions de workflow d'un plan. Retombe sur le plan gratuit si inconnu. */
export function getPlanTaskLimit(plan: string): number {
  return PLAN_TASK_LIMITS[plan] ?? 100;
}
