import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

    const userRes = await pool.query(
      "SELECT id, plan FROM users WHERE email = $1",
      [session.user?.email]
    );
    if (userRes.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

    const userId = userRes.rows[0].id;
    const plan: string = userRes.rows[0].plan || "free";
    const LIMITS: Record<string, number> = { free: 100, starter: 2000, pro: 10000, business: 50000 };
    const limit = LIMITS[plan] ?? 100;

    // Requêtes en parallèle — chacune avec .catch() individuel pour ne pas tout bloquer
    const [workflowsRes, lastExecsRes, limitsRes] = await Promise.all([

      pool.query(
        `SELECT id, name, active, created_at FROM workflows WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      ).catch(() => ({ rows: [] as unknown[] })),

      pool.query(
        `SELECT DISTINCT ON (e.workflow_id) e.workflow_id, e.status, e.created_at
         FROM executions e
         JOIN workflows w ON e.workflow_id = w.id
         WHERE w.user_id = $1
         ORDER BY e.workflow_id, e.created_at DESC`,
        [userId]
      ).catch(() => ({ rows: [] as unknown[] })),

      pool.query(
        `SELECT COUNT(*) as used
         FROM executions e
         JOIN workflows w ON e.workflow_id = w.id
         WHERE w.user_id = $1
           AND e.created_at >= date_trunc('month', NOW())`,
        [userId]
      ).catch(() => ({ rows: [{ used: "0" }] })),

    ]);

    return NextResponse.json({
      workflows: workflowsRes.rows,
      lastExecs: lastExecsRes.rows,
      limits: {
        used: parseInt(String((limitsRes.rows[0] as { used?: string })?.used ?? "0")),
        limit,
        plan,
      },
    });

  } catch (err) {
    console.error("[/api/dashboard]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
