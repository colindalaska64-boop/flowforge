import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { executeWorkflow } from "@/lib/executor";

export async function GET(req: NextRequest) {
  // Vérification sécurité Vercel
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    // Récupérer tous les workflows actifs avec un nœud "Planifié"
    const result = await pool.query(
      "SELECT * FROM workflows WHERE active = true"
    );

    const triggered = [];

    for (const workflow of result.rows) {
      const nodes = workflow.data?.nodes || [];
      const hasSchedule = nodes.some((n: { label: string }) =>
        n.label === "Planifié"
      );

      if (hasSchedule) {
        await executeWorkflow(workflow.data, {
          source: "cron",
          date: new Date().toISOString(),
        });

        await pool.query(
          "INSERT INTO executions (workflow_id, trigger_data, status) VALUES ($1, $2, $3)",
          [workflow.id, JSON.stringify({ source: "cron" }), "success"]
        );

        triggered.push(workflow.name);
      }
    }

    return NextResponse.json({ triggered, count: triggered.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}