import pool from "./db";

const PLAN_TASK_LIMITS: Record<string, number> = {
  free: 100,
  starter: 2000,
  pro: 10000,
  business: 50000,
};

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
  const limit = PLAN_TASK_LIMITS[userPlan] ?? 100;
  const used = await getMonthlyTaskCount(userId);
  return { allowed: used < limit, used, limit };
}

export function getPlanTaskLimit(userPlan: string): number {
  return PLAN_TASK_LIMITS[userPlan] ?? 100;
}
