import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import { getUserConnectionsByEmail } from "@/lib/userConnections";

export const dynamic = "force-dynamic";

/**
 * RGPD — Droit à la portabilité (article 20).
 * Retourne toutes les données personnelles de l'utilisateur connecté
 * sous forme d'un JSON téléchargeable.
 *
 * Les clés API tierces (champ connections) sont volontairement MASQUÉES
 * dans l'export : on confirme leur présence sans les ressortir en clair.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  try {
    const userRes = await pool.query(
      `SELECT id, name, email, plan, created_at, is_admin
       FROM users WHERE email = $1`,
      [session.user.email]
    );
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }
    const user = userRes.rows[0];

    const [workflowsRes, executionsRes, supportRes, connections] = await Promise.all([
      pool.query(
        "SELECT id, name, active, created_at FROM workflows WHERE user_id = $1",
        [user.id]
      ),
      pool.query(
        `SELECT e.id, e.workflow_id, e.status, e.created_at
         FROM executions e
         JOIN workflows w ON w.id = e.workflow_id
         WHERE w.user_id = $1
         ORDER BY e.created_at DESC
         LIMIT 1000`,
        [user.id]
      ),
      pool.query(
        "SELECT subject, message, created_at FROM support_messages WHERE email = $1",
        [user.email]
      ).catch(() => ({ rows: [] })),
      getUserConnectionsByEmail(user.email),
    ]);

    // Masque les secrets dans l'export
    const connectionsOverview: Record<string, { configured: boolean }> = {};
    for (const [key, value] of Object.entries(connections || {})) {
      connectionsOverview[key] = { configured: !!value && Object.keys(value).length > 0 };
    }

    const payload = {
      exported_at: new Date().toISOString(),
      account: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        created_at: user.created_at,
        is_admin: user.is_admin,
      },
      connections_overview: connectionsOverview,
      workflows: workflowsRes.rows,
      executions: executionsRes.rows,
      support_messages: supportRes.rows,
    };

    const filename = `loopflo-export-${user.id}-${Date.now()}.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("EXPORT ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
