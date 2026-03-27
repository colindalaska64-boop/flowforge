import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    const user = await pool.query("SELECT id FROM users WHERE email = $1", [session.user?.email]);
    if (user.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get("workflow_id");
    const statusFilter = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    let query = `
      SELECT e.id, e.workflow_id, e.trigger_data, e.results, e.status, e.created_at,
             w.name as workflow_name
      FROM executions e
      JOIN workflows w ON e.workflow_id = w.id
      WHERE w.user_id = $1
    `;
    const values: (string | number)[] = [user.rows[0].id];
    let idx = 2;

    if (workflowId) {
      query += ` AND e.workflow_id = $${idx++}`;
      values.push(workflowId);
    }
    if (statusFilter && statusFilter !== "all") {
      query += ` AND e.status = $${idx++}`;
      values.push(statusFilter);
    }

    query += ` ORDER BY e.created_at DESC LIMIT $${idx}`;
    values.push(limit);

    const result = await pool.query(query, values);
    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("EXECUTIONS ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
