import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { executeWorkflow } from "@/lib/executor";
import { sendWorkflowErrorAlert } from "@/lib/email";
import { rateLimit } from "@/lib/ratelimit";
import { checkTaskLimit } from "@/lib/limits";
import { getUserConnectionsById } from "@/lib/userConnections";
import { sanitizeResults } from "@/lib/sanitizeResults";

/**
 * Extrait un identifiant unique de l'event depuis les headers des providers connus.
 * Cet ID est utilisé pour dédupliquer les retries (double exécution).
 *
 * Providers supportés : GitHub, Stripe, Typeform, Svix (Clerk/Resend/etc.),
 * Shopify, Linear, Jira, SendGrid, X-Request-ID générique.
 */
function extractEventId(req: NextRequest, workflowId: number): string | null {
  const h = (name: string) => req.headers.get(name);
  const id =
    h("x-github-delivery") ||          // GitHub Webhooks
    h("stripe-idempotency-key") ||      // Stripe
    h("x-typeform-signature")?.slice(0, 40) || // Typeform (signature = unique par event)
    h("svix-id") ||                     // Svix (Clerk, Resend, etc.)
    h("x-shopify-webhook-id") ||        // Shopify
    h("linear-delivery") ||             // Linear
    h("x-atlassian-webhook-identifier") || // Jira / Confluence
    h("x-sendgrid-event-id") ||         // SendGrid
    h("x-request-id") ||               // Header générique (Zapier, Make, custom)
    h("x-idempotency-key");            // Clé custom envoyée par l'utilisateur

  if (!id) return null;
  // Préfixer avec workflow_id pour isoler les namespaces entre workflows
  return `wf${workflowId}:${id.slice(0, 200)}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;

  // Rate limit en mémoire (protection brute force) — 120 appels/min par secret
  const { allowed, retryAfter } = rateLimit(`webhook:${secret}`, 120, 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans quelques secondes." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 1_000_000) {
      return NextResponse.json({ error: "Payload trop volumineux (max 1 Mo)." }, { status: 413 });
    }
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

    // ── Déduplication idempotente ────────────────────────────────────────────
    // ON CONFLICT DO NOTHING est atomique côté PostgreSQL :
    // même deux requêtes simultanées, une seule INSERT passe.
    const eventId = extractEventId(req, workflow.id);
    if (eventId) {
      const { rowCount } = await pool.query(
        `INSERT INTO webhook_events (event_id, workflow_id)
         VALUES ($1, $2)
         ON CONFLICT (event_id) DO NOTHING`,
        [eventId, workflow.id]
      );
      if (rowCount === 0) {
        // Déjà traité — on répond 200 pour que le provider ne retente pas
        return NextResponse.json({ message: "Déjà traité (duplicate).", deduplicated: true });
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    // Récupérer le plan, l'email et les variables globales du propriétaire
    const connResult = await pool.query(
      "SELECT plan, email, global_vars FROM users WHERE id = $1",
      [workflow.user_id]
    );
    const connections = await getUserConnectionsById(workflow.user_id);
    const userPlan = connResult.rows[0]?.plan || "free";
    const globalVars = connResult.rows[0]?.global_vars || {};

    const limitCheck = await checkTaskLimit(workflow.user_id, userPlan);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Limite mensuelle atteinte (${limitCheck.used}/${limitCheck.limit} tâches).` },
        { status: 429 }
      );
    }

    // Exécuter le workflow
    const executionResults = await executeWorkflow(workflowData, body, connections, userPlan, globalVars, { name: workflow.name, userEmail: connResult.rows[0]?.email || "" });

    // Logger l'exécution
    const hasErrors = executionResults.some((r) => r.status === "error");
    await pool.query(
      "INSERT INTO executions (workflow_id, trigger_data, status, results) VALUES ($1, $2, $3, $4)",
      [workflow.id, JSON.stringify(body), hasErrors ? "error" : "success", JSON.stringify(sanitizeResults(executionResults))]
    );

    // Envoyer une alerte email si des nœuds ont échoué
    if (hasErrors && connResult.rows[0]?.email) {
      const errors = executionResults
        .filter((r) => r.status === "error")
        .map((r) => ({ node: r.node, error: r.error || "Erreur inconnue" }));
      await sendWorkflowErrorAlert(connResult.rows[0].email, workflow.name, errors);
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