import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { executeWorkflow } from "@/lib/executor";
import { sendWorkflowErrorAlert } from "@/lib/email";
import { rateLimit } from "@/lib/ratelimit";
import { checkTaskLimit } from "@/lib/limits";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;

  // 120 appels max par secret par minute
  const { allowed, retryAfter } = rateLimit(`webhook:${secret}`, 120, 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans quelques secondes." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

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

    // Récupérer les connexions et le plan de l'utilisateur propriétaire
    const connResult = await pool.query(
      "SELECT connections, plan FROM users WHERE id = $1",
      [workflow.user_id]
    );
    const connections = connResult.rows[0]?.connections || {};
    const userPlan = connResult.rows[0]?.plan || "free";

    const limitCheck = await checkTaskLimit(workflow.user_id, userPlan);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Limite mensuelle atteinte (${limitCheck.used}/${limitCheck.limit} tâches).` },
        { status: 429 }
      );
    }

    // Exécuter le workflow
    const executionResults = await executeWorkflow(workflowData, body, connections, userPlan);

    // Logger l'exécution
    const hasErrors = executionResults.some((r) => r.status === "error");
    await pool.query(
      "INSERT INTO executions (workflow_id, trigger_data, status) VALUES ($1, $2, $3)",
      [workflow.id, JSON.stringify(body), hasErrors ? "error" : "success"]
    );

    // Envoyer une alerte email si des nœuds ont échoué
    if (hasErrors) {
      const ownerResult = await pool.query(
        "SELECT u.email FROM users u JOIN workflows w ON w.user_id = u.id WHERE w.id = $1",
        [workflow.id]
      );
      if (ownerResult.rows.length > 0) {
        const errors = executionResults
          .filter((r) => r.status === "error")
          .map((r) => ({ node: r.node, error: r.error || "Erreur inconnue" }));
        await sendWorkflowErrorAlert(ownerResult.rows[0].email, workflow.name, errors);
      }
    }

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