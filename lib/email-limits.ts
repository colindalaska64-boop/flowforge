import pool from "./db";

// Limites mensuelles d'envoi d'emails via workflows — non affichées dans l'UI.
// Protège contre les abus tout en restant généreux selon le plan.
const EMAIL_MONTHLY_LIMITS: Record<string, number> = {
  free: 20,
  starter: 500,
  pro: 5000,
  business: 99999,
};

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_usage (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      year_month TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, year_month)
    )
  `);
}

export async function checkEmailLimit(userId: number, plan: string): Promise<{ allowed: boolean }> {
  const limit = EMAIL_MONTHLY_LIMITS[plan] ?? 20;
  if (limit >= 99999) return { allowed: true };

  await ensureTable();
  const yearMonth = new Date().toISOString().slice(0, 7);
  const result = await pool.query(
    "SELECT count FROM email_usage WHERE user_id = $1 AND year_month = $2",
    [userId, yearMonth]
  );
  const used = parseInt(result.rows[0]?.count || "0");
  return { allowed: used < limit };
}

export async function recordEmailSend(userId: number): Promise<void> {
  await ensureTable();
  const yearMonth = new Date().toISOString().slice(0, 7);
  await pool.query(
    `INSERT INTO email_usage (user_id, year_month, count)
     VALUES ($1, $2, 1)
     ON CONFLICT (user_id, year_month)
     DO UPDATE SET count = email_usage.count + 1`,
    [userId, yearMonth]
  );
}
