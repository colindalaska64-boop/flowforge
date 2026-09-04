import pool from "./db";

/**
 * Nombre de bug reports des 7 derniers jours — sert de pastille dans la sidebar admin.
 * Renvoie 0 si la table n'existe pas encore.
 */
export async function getRecentBugCount(): Promise<number> {
  try {
    const res = await pool.query(
      "SELECT COUNT(*)::int AS n FROM bug_reports WHERE created_at >= NOW() - INTERVAL '7 days'"
    );
    return res.rows[0]?.n ?? 0;
  } catch {
    return 0;
  }
}
