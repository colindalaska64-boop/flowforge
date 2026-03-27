import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { executeWorkflow } from "@/lib/executor";
import { checkTaskLimit } from "@/lib/limits";

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
      message: "Bonjour, je voudrais avoir plus d'informations sur vos services.",
      email: "client@exemple.com",
      name: "Jean Dupont",
      phone: "+33 6 12 34 56 78",
      amount: "49.99",
      currency: "EUR",
      subject: "Demande d'informations",
      status: "pending",
      id: `test_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      timestamp: String(Math.floor(Date.now() / 1000)),
      day: ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"][new Date().getDay()],
    };

    // Récupérer les connexions de l'utilisateur
    const connResult = await pool.query(
      "SELECT connections FROM users WHERE id = $1",
      [user.rows[0].id]
    );
    const connections = connResult.rows[0]?.connections || {};
    const userPlan = user.rows[0].plan || "free";

    const limitCheck = await checkTaskLimit(user.rows[0].id, userPlan);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Limite mensuelle atteinte (${limitCheck.used}/${limitCheck.limit} tâches). Passez à un plan supérieur.` },
        { status: 429 }
      );
    }

    const executionResults = await executeWorkflow(workflow.data, testData, connections, userPlan);

    const hasErrors = executionResults.some((r) => r.status === "error");
    const status = hasErrors ? "error" : "success";

    await pool.query(
      "INSERT INTO executions (workflow_id, trigger_data, status, results) VALUES ($1, $2, $3, $4)",
      [workflow.id, JSON.stringify(testData), status, JSON.stringify(executionResults)]
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
