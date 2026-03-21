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

  const result = await pool.query(
    "SELECT * FROM workflows WHERE id = $1",
    [id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Workflow introuvable." }, { status: 404 });
  }

  const workflow = result.rows[0];
  const testData = { source: "test_loopflo", message: "Test depuis l'éditeur !", date: new Date().toISOString() };

  const executionResults = await executeWorkflow(workflow.data, testData);

  await pool.query(
    "INSERT INTO executions (workflow_id, trigger_data, status) VALUES ($1, $2, $3)",
    [workflow.id, JSON.stringify(testData), "test"]
  );

  return NextResponse.json({ message: "Workflow testé !", results: executionResults });
}