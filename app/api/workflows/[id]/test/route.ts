import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { executeWorkflow } from "@/lib/executor";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await pool.query("SELECT * FROM workflows WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Workflow introuvable." }, { status: 404 });
    }

    const workflow = result.rows[0];
    const testData = {
      source: "test_loopflo",
      message: "Test depuis l'éditeur !",
      date: new Date().toISOString(),
    };

    const executionResults = await executeWorkflow(workflow.data, testData);

    // Log détaillé pour débugger
    console.log("EXECUTION RESULTS:", JSON.stringify(executionResults, null, 2));

    await pool.query(
      "INSERT INTO executions (workflow_id, trigger_data, status) VALUES ($1, $2, $3)",
      [workflow.id, JSON.stringify(testData), "success"]
    );

    return NextResponse.json({
      message: "Workflow exécuté !",
      results: executionResults,
    });

  } catch (error) {
    console.error("TEST ERROR:", error);
    return NextResponse.json({ 
      error: "Erreur serveur.",
      details: String(error)
    }, { status: 500 });
  }
}