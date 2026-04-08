import pool from "./db";

// Free: aucune génération auto. Starter: limité (incite à upgrader). Pro/Business: illimité.
const AI_MONTHLY_LIMITS: Record<string, number> = {
  free: 0,
  starter: 15,
  pro: 99999,
  business: 99999,
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
  if (limit >= 99999) return { allowed: true, remaining: 999 };
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
