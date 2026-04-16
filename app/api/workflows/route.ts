import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

const SENSITIVE_FIELDS: Record<string, string[]> = {
  stripe:   ["secret_key"],
  telegram: ["bot_token"],
  sms:      ["auth_token", "account_sid"],
  hubspot:  ["api_key"],
  airtable: ["api_key"],
  http:     ["api_key"],
};

const MASK = "__MASKED__";

type WorkflowNode = { id?: string; data?: { label?: string; config?: Record<string, string> } };

// Restaure les valeurs masquées depuis le workflow en base avant sauvegarde (match par ID de nœud)
function restoreMaskedSecrets(
  incoming: { nodes?: WorkflowNode[] },
  original: { nodes?: WorkflowNode[] }
) {
  if (!incoming?.nodes || !original?.nodes) return incoming;
  const cloned = JSON.parse(JSON.stringify(incoming));
  const origById: Record<string, WorkflowNode> = {};
  for (const n of original.nodes) { if (n.id) origById[n.id] = n; }

  for (const node of cloned.nodes) {
    const label = node?.data?.label?.toLowerCase() || "";
    const origNode = node.id ? origById[node.id] : undefined;
    for (const [key, fields] of Object.entries(SENSITIVE_FIELDS)) {
      if (label.includes(key) && node?.data?.config) {
        for (const field of fields) {
          if (node.data.config[field] === MASK && origNode?.data?.config?.[field]) {
            node.data.config[field] = origNode.data.config[field];
          }
        }
      }
    }
  }
  return cloned;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

    const { name, data, id } = await req.json();
    const user = await pool.query("SELECT id, plan FROM users WHERE email = $1", [session.user?.email]);
    if (user.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

    const userPlan = user.rows[0].plan || "free";
    const userId = user.rows[0].id;

    if (!id && userPlan === "free") {
      const count = await pool.query("SELECT COUNT(*) FROM workflows WHERE user_id = $1", [userId]);
      if (parseInt(count.rows[0].count) >= 5) {
        return NextResponse.json({
          error: "Limite atteinte ! Le plan Free est limité à 5 workflows. Passez en Starter pour des workflows illimités."
        }, { status: 403 });
      }
    }

    if (id) {
      // Restaurer les secrets masqués depuis la version en base
      const existing = await pool.query(
        "SELECT data FROM workflows WHERE id = $1 AND user_id = $2",
        [id, userId]
      );
      const safeData = existing.rows[0]?.data
        ? restoreMaskedSecrets(data, existing.rows[0].data)
        : data;

      await pool.query(
        "UPDATE workflows SET name = $1, data = $2 WHERE id = $3 AND user_id = $4",
        [name, JSON.stringify(safeData), id, userId]
      );
      return NextResponse.json({ id, message: "Workflow mis à jour !" }, { status: 200 });
    }

    const result = await pool.query(
      "INSERT INTO workflows (user_id, name, data) VALUES ($1, $2, $3) RETURNING id",
      [userId, name, JSON.stringify(data)]
    );
    return NextResponse.json({ id: result.rows[0].id, message: "Workflow sauvegardé !" }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

    const user = await pool.query("SELECT id FROM users WHERE email = $1", [session.user?.email]);
    if (user.rows.length === 0) return NextResponse.json([], { status: 200 });

    const workflows = await pool.query(
      "SELECT id, name, active, created_at, data FROM workflows WHERE user_id = $1 ORDER BY created_at DESC",
      [user.rows[0].id]
    );

    return NextResponse.json(workflows.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}