import pool from "./db";
import { getPlanTaskLimit } from "./quotas";

// Les chiffres vivent dans lib/quotas.ts, module pur lisible par les pages
// statiques (/ia, /llms.txt) qui ne doivent pas importer la base de données.
export { PLAN_TASK_LIMITS, getPlanTaskLimit } from "./quotas";

export async function getMonthlyTaskCount(userId: number): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM executions e
     JOIN workflows w ON w.id = e.workflow_id
     WHERE w.user_id = $1
     AND e.created_at >= DATE_TRUNC('month', NOW())`,
    [userId]
  );
  return parseInt(result.rows[0]?.count || "0");
}

export async function checkTaskLimit(userId: number, userPlan: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limit = getPlanTaskLimit(userPlan);
  const used = await getMonthlyTaskCount(userId);
  return { allowed: used < limit, used, limit };
}

