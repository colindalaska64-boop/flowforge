import pool from "./db";

/** Au-delà de ce seuil, le quota est considéré comme illimité. */
export const ILLIMITE = 99999;

/**
 * Générations Kixi autorisées par mois et par plan.
 *
 * Le plan gratuit est volontairement très limité : il sert à faire découvrir
 * Kixi, pas à l'utiliser au quotidien.
 *
 * Exporté pour que le panel admin affiche les mêmes chiffres que ceux
 * réellement appliqués, sans les recopier.
 */
export const AI_MONTHLY_LIMITS: Record<string, number> = {
  free: 1,
  starter: 15,
  pro: ILLIMITE,
  business: ILLIMITE,
};

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_usage (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      year_month TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, year_month)
    )
  `);
}

export async function checkAiLimit(userId: number, plan: string): Promise<{ allowed: boolean; remaining: number }> {
  const limit = AI_MONTHLY_LIMITS[plan] ?? 0;
  if (limit >= ILLIMITE) return { allowed: true, remaining: ILLIMITE };
  if (limit === 0) return { allowed: false, remaining: 0 };

  await ensureTable();
  const yearMonth = new Date().toISOString().slice(0, 7); // "2026-04"
  const result = await pool.query(
    "SELECT count FROM ai_usage WHERE user_id = $1 AND year_month = $2",
    [userId, yearMonth]
  );
  const used = parseInt(result.rows[0]?.count || "0");
  return { allowed: used < limit, remaining: Math.max(0, limit - used) };
}

export async function recordAiUsage(userId: number): Promise<void> {
  await ensureTable();
  const yearMonth = new Date().toISOString().slice(0, 7);
  await pool.query(
    `INSERT INTO ai_usage (user_id, year_month, count)
     VALUES ($1, $2, 1)
     ON CONFLICT (user_id, year_month)
     DO UPDATE SET count = ai_usage.count + 1`,
    [userId, yearMonth]
  );
}

/**
 * Consommation Kixi du mois en cours pour un utilisateur.
 * Utilisé par le panel admin. Renvoie 0 si la table n'existe pas encore.
 */
export async function getAiUsage(
  userId: number
): Promise<{ used: number; limit: number | null }> {
  const yearMonth = new Date().toISOString().slice(0, 7);
  try {
    const res = await pool.query(
      "SELECT count FROM ai_usage WHERE user_id = $1 AND year_month = $2",
      [userId, yearMonth]
    );
    return { used: parseInt(res.rows[0]?.count || "0"), limit: null };
  } catch {
    return { used: 0, limit: null };
  }
}

/** Quota mensuel d'un plan, ou null si illimité. */
export function limiteDuPlan(plan: string): number | null {
  const limite = AI_MONTHLY_LIMITS[plan] ?? 0;
  return limite >= ILLIMITE ? null : limite;
}
