import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { executeWorkflow } from "@/lib/executor";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    const user = await pool.query("SELECT id, plan FROM users WHERE email = $1", [session.user?.email]);
    if (user.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

    const result = await pool.query(
      "SELECT * FROM workflows WHERE id = $1 AND user_id = $2",
      [id, user.rows[0].id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Workflow introuvable." }, { status: 404 });
    }

    const workflow = result.rows[0];
    const testData = {
      source: "test_loopflo",
      message: "Test depuis l'éditeur !",
      date: new Date().toISOString(),
    };

    // Récupérer les connexions de l'utilisateur
    const connResult = await pool.query(
      "SELECT connections FROM users WHERE id = $1",
      [user.rows[0].id]
    );
    const connections = connResult.rows[0]?.connections || {};
    const userPlan = user.rows[0].plan || "free";

    const executionResults = await executeWorkflow(workflow.data, testData, connections, userPlan);

    const hasErrors = executionResults.some((r) => r.status === "error");
    const status = hasErrors ? "error" : "success";

    await pool.query(
      "INSERT INTO executions (workflow_id, trigger_data, status) VALUES ($1, $2, $3)",
      [workflow.id, JSON.stringify(testData), status]
    );

    return NextResponse.json({
      message: hasErrors ? "Workflow exécuté avec des erreurs." : "Workflow exécuté avec succès !",
      results: executionResults,
    });

  } catch (error) {
    console.error("TEST ERROR:", error);
    return NextResponse.json({ error: "Erreur lors de l'exécution du workflow." }, { status: 500 });
  }
}
