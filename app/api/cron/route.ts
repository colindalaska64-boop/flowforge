import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { executeWorkflow } from "@/lib/executor";
import { sendWorkflowErrorAlert } from "@/lib/email";
import { checkTaskLimit } from "@/lib/limits";
import { getUserConnectionsById } from "@/lib/userConnections";
import { fetchRSSFeed } from "@/lib/rssFetcher";

type ScheduleConfig = {
  type: "daily" | "weekly" | "monthly" | "hourly";
  hour?: string;
  minute?: string;
  days?: string[];       // ["monday","tuesday",...] pour weekly
  dayOfMonth?: string;   // "1"-"28" ou "last" pour monthly
  intervalHours?: string;// intervalle en heures pour hourly
  timezone?: string;
};

const DAY_NAME_TO_NUM: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function shouldRunNow(scheduleJson: string): boolean {
  try {
    const s: ScheduleConfig = JSON.parse(scheduleJson);
    const tz = s.timezone || "UTC";
    const now = new Date();
    const local = new Date(now.toLocaleString("en-US", { timeZone: tz }));
    const h = local.getHours();
    const m = local.getMinutes();
    const d = local.getDay(); // 0=dimanche

    if (s.type === "daily") {
      return h === parseInt(s.hour || "9") && m === parseInt(s.minute || "0");
    }
    if (s.type === "weekly") {
      const activeDays = (s.days || []).map(day => DAY_NAME_TO_NUM[day] ?? -1);
      return activeDays.includes(d) &&
             h === parseInt(s.hour || "9") &&
             m === parseInt(s.minute || "0");
    }
    if (s.type === "monthly") {
      const dom = local.getDate();
      const lastDay = new Date(local.getFullYear(), local.getMonth() + 1, 0).getDate();
      const targetDay = s.dayOfMonth === "last" ? lastDay : parseInt(s.dayOfMonth || "1");
      return dom === targetDay &&
             h === parseInt(s.hour || "9") &&
             m === parseInt(s.minute || "0");
    }
    if (s.type === "hourly") {
      const interval = Math.max(1, parseInt(s.intervalHours || "1"));
      return h % interval === 0 && m === 0;
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
          "SELECT plan, email, global_vars FROM users WHERE id = $1",
          [workflow.user_id]
        );
        const connections = await getUserConnectionsById(workflow.user_id);
        const userPlan = connResult.rows[0]?.plan || "free";
        const globalVars = connResult.rows[0]?.global_vars || {};

        const limitCheck = await checkTaskLimit(workflow.user_id, userPlan);
        if (!limitCheck.allowed) {
          errors.push(`${workflow.name}: limite mensuelle atteinte (${limitCheck.used}/${limitCheck.limit})`);
          continue;
        }

        const executionResults = await executeWorkflow(workflow.data, triggerData, connections, userPlan, globalVars);
        const hasErrors = executionResults.some(r => r.status === "error");

        await pool.query(
          "INSERT INTO executions (workflow_id, trigger_data, status, results) VALUES ($1, $2, $3, $4)",
          [workflow.id, JSON.stringify(triggerData), hasErrors ? "error" : "success", JSON.stringify(executionResults)]
        );

        if (hasErrors) {
          if (connResult.rows[0]?.email) {
            const errs = executionResults
              .filter(r => r.status === "error")
              .map(r => ({ node: r.node, error: r.error || "Erreur inconnue" }));
            await sendWorkflowErrorAlert(connResult.rows[0].email, workflow.name, errs);
          }
          errors.push(workflow.name);
        } else {
          triggered.push(workflow.name);
        }
      } catch (err) {
        errors.push(`${workflow.name}: ${String(err)}`);
      }
    }

    // ── RSS Feed polling ──────────────────────────────────────────────────
    try {
      // Créer la table rss_state si elle n'existe pas
      await pool.query(`
        CREATE TABLE IF NOT EXISTS rss_state (
          workflow_id INT PRIMARY KEY,
          last_guid TEXT,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      const rssWorkflows = await pool.query(
        "SELECT * FROM workflows WHERE active = true"
      );

      for (const wf of rssWorkflows.rows) {
        const nodes: { data?: { label?: string; config?: Record<string, string> } }[] = wf.data?.nodes || [];
        const rssNode = nodes.find(n => n.data?.label?.toLowerCase() === "rss feed");
        if (!rssNode) continue;

        const feedUrl = rssNode.data?.config?.url;
        if (!feedUrl) continue;

        try {
          const items = await fetchRSSFeed(feedUrl);
          if (items.length === 0) continue;

          // Récupérer le dernier guid connu pour ce workflow
          const stateRes = await pool.query(
            "SELECT last_guid FROM rss_state WHERE workflow_id = $1",
            [wf.id]
          );
          const lastGuid = stateRes.rows[0]?.last_guid || null;

          // Trouver les nouveaux items (avant le lastGuid connu)
          const newItems = lastGuid
            ? items.slice(0, items.findIndex(i => i.guid === lastGuid)).filter(Boolean)
            : items.slice(0, 3); // Premier run : traiter max 3 items récents

          if (newItems.length === 0) continue;

          const connResult = await pool.query(
            "SELECT plan, email, global_vars FROM users WHERE id = $1",
            [wf.user_id]
          );
          const connections = await getUserConnectionsById(wf.user_id);
          const userPlan = connResult.rows[0]?.plan || "free";
          const rssGlobalVars = connResult.rows[0]?.global_vars || {};

          for (const item of newItems.slice(0, 5)) {
            const limitCheck = await checkTaskLimit(wf.user_id, userPlan);
            if (!limitCheck.allowed) break;

            const triggerData = {
              source: "rss",
              title: item.title,
              link: item.link,
              description: item.description,
              pub_date: item.pubDate,
              guid: item.guid,
              feed_url: feedUrl,
            };

            const executionResults = await executeWorkflow(wf.data, triggerData, connections, userPlan, rssGlobalVars);
            const hasErrors = executionResults.some(r => r.status === "error");

            await pool.query(
              "INSERT INTO executions (workflow_id, trigger_data, status, results) VALUES ($1, $2, $3, $4)",
              [wf.id, JSON.stringify(triggerData), hasErrors ? "error" : "success", JSON.stringify(executionResults)]
            );

            if (hasErrors && connResult.rows[0]?.email) {
              const errs = executionResults.filter(r => r.status === "error").map(r => ({ node: r.node, error: r.error || "Erreur inconnue" }));
              await sendWorkflowErrorAlert(connResult.rows[0].email, wf.name, errs);
            }
          }

          // Sauvegarder le nouveau dernier guid
          await pool.query(
            `INSERT INTO rss_state (workflow_id, last_guid, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (workflow_id) DO UPDATE SET last_guid = $2, updated_at = NOW()`,
            [wf.id, items[0].guid]
          );

          triggered.push(`[RSS] ${wf.name} (${newItems.length} item(s))`);
        } catch (rssErr) {
          errors.push(`[RSS] ${wf.name}: ${String(rssErr)}`);
        }
      }
    } catch { /* rss_state table not ready, skip silently */ }
    // ── fin RSS ───────────────────────────────────────────────────────────

    // Nettoyage : supprimer les exécutions de plus de 30 jours
    const cleanup = await pool.query(
      "DELETE FROM executions WHERE created_at < NOW() - INTERVAL '30 days'"
    );

    // Nettoyage images temporaires : supprimer les images de plus de 24h
    let imagesCleaned = 0;
    try {
      const imgCleanup = await pool.query(
        "DELETE FROM temp_images WHERE created_at < NOW() - INTERVAL '24 hours'"
      );
      imagesCleaned = imgCleanup.rowCount ?? 0;
    } catch { /* table pas encore créée, silencieux */ }

    return NextResponse.json({
      triggered,
      errors,
      count: triggered.length,
      cleaned: cleanup.rowCount,
      imagesCleaned,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
