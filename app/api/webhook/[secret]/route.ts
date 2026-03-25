import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { executeWorkflow } from "@/lib/executor";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;

  try {
    const body = await req.json();

    const result = await pool.query(
      "SELECT * FROM workflows WHERE webhook_secret = $1 AND active = true",
      [secret]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Workflow introuvable ou inactif." }, { status: 404 });
    }

    const workflow = result.rows[0];
    const workflowData = workflow.data;

    // Exécuter le workflow
    const executionResults = await executeWorkflow(workflowData, body);

    // Logger l'exécution
    const hasErrors = executionResults.some((r) => r.status === "error");
    await pool.query(
      "INSERT INTO executions (workflow_id, trigger_data, status) VALUES ($1, $2, $3)",
      [workflow.id, JSON.stringify(body), hasErrors ? "error" : "success"]
    );

    return NextResponse.json({
      message: "Workflow exécuté !",
      workflow: workflow.name,
      results: executionResults,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  const result = await pool.query(
    "SELECT name, active FROM workflows WHERE webhook_secret = $1",
    [secret]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Workflow introuvable." }, { status: 404 });
  }
  return NextResponse.json({ status: "ok", workflow: result.rows[0].name });
}