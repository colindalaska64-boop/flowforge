import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { executeWorkflow } from "@/lib/executor";
import { sendWorkflowErrorAlert } from "@/lib/email";

type ScheduleConfig = {
  type: "daily" | "weekly" | "interval";
  hour?: string;
  minute?: string;
  day?: string;      // 0-6, dimanche = 0
  minutes?: string;  // intervalle en minutes
  timezone?: string;
};

function shouldRunNow(scheduleJson: string): boolean {
  try {
    const s: ScheduleConfig = JSON.parse(scheduleJson);
    const tz = s.timezone || "UTC";
    const now = new Date();
    // Convertir l'heure courante dans le fuseau cible
    const local = new Date(now.toLocaleString("en-US", { timeZone: tz }));
    const h = local.getHours();
    const m = local.getMinutes();
    const d = local.getDay();

    if (s.type === "daily") {
      return h === parseInt(s.hour || "9") && m === parseInt(s.minute || "0");
    }
    if (s.type === "weekly") {
      return d === parseInt(s.day || "1") &&
             h === parseInt(s.hour || "9") &&
             m === parseInt(s.minute || "0");
    }
    if (s.type === "interval") {
      const interval = parseInt(s.minutes || "30");
      return m % interval === 0;
    }
    return false;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const triggered: string[] = [];
  const errors: string[] = [];

  try {
    const result = await pool.query("SELECT * FROM workflows WHERE active = true");

    for (const workflow of result.rows) {
      const nodes: { data?: { label?: string; config?: Record<string, string> } }[] = workflow.data?.nodes || [];

      // Chercher le nœud Planifié
      const scheduleNode = nodes.find(n => n.data?.label?.toLowerCase() === "planifié");
      if (!scheduleNode) continue;

      const scheduleJson = scheduleNode.data?.config?.schedule;
      if (!scheduleJson) continue;

      // Vérifier si c'est le bon moment pour ce workflow
      if (!shouldRunNow(scheduleJson)) continue;

      const triggerData = {
        source: "cron",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        timestamp: String(Math.floor(Date.now() / 1000)),
        day: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"][new Date().getDay()],
      };

      try {
        const connResult = await pool.query(
          "SELECT connections, plan FROM users WHERE id = $1",
          [workflow.user_id]
        );
        const connections = connResult.rows[0]?.connections || {};
        const userPlan = connResult.rows[0]?.plan || "free";
        const executionResults = await executeWorkflow(workflow.data, triggerData, connections, userPlan);
        const hasErrors = executionResults.some(r => r.status === "error");

        await pool.query(
          "INSERT INTO executions (workflow_id, trigger_data, status) VALUES ($1, $2, $3)",
          [workflow.id, JSON.stringify(triggerData), hasErrors ? "error" : "success"]
        );

        if (hasErrors) {
          const ownerResult = await pool.query(
            "SELECT u.email FROM users u JOIN workflows w ON w.user_id = u.id WHERE w.id = $1",
            [workflow.id]
          );
          if (ownerResult.rows.length > 0) {
            const errs = executionResults
              .filter(r => r.status === "error")
              .map(r => ({ node: r.node, error: r.error || "Erreur inconnue" }));
            await sendWorkflowErrorAlert(ownerResult.rows[0].email, workflow.name, errs);
          }
          errors.push(workflow.name);
        } else {
          triggered.push(workflow.name);
        }
      } catch (err) {
        errors.push(`${workflow.name}: ${String(err)}`);
      }
    }

    // Nettoyage : supprimer les exécutions de plus de 30 jours
    const cleanup = await pool.query(
      "DELETE FROM executions WHERE created_at < NOW() - INTERVAL '30 days'"
    );

    return NextResponse.json({
      triggered,
      errors,
      count: triggered.length,
      cleaned: cleanup.rowCount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
