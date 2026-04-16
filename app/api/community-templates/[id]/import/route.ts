/**
 * POST /api/community-templates/[id]/import
 * Crée un workflow dans le compte de l'utilisateur depuis un template communautaire.
 * Incrémente le compteur downloads.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    const { id } = await params;
    const templateId = parseInt(id);
    if (isNaN(templateId)) return NextResponse.json({ error: "ID invalide." }, { status: 400 });

    // Charge le template
    const tplRow = await pool.query(
      `SELECT name, workflow_data FROM community_templates WHERE id = $1 AND status = 'published'`,
      [templateId]
    );
    if (!tplRow.rows.length)
      return NextResponse.json({ error: "Template introuvable." }, { status: 404 });

    const { name, workflow_data } = tplRow.rows[0];

    // Récupère l'utilisateur
    const userRow = await pool.query("SELECT id FROM users WHERE email = $1", [session.user.email]);
    if (!userRow.rows.length)
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    const userId = userRow.rows[0].id;

    // Vérifie le quota de workflows
    const countRow = await pool.query(
      "SELECT COUNT(*) FROM workflows WHERE user_id = $1",
      [userId]
    );
    const MAX_WORKFLOWS = 20;
    if (parseInt(countRow.rows[0].count) >= MAX_WORKFLOWS)
      return NextResponse.json(
        { error: `Vous avez atteint la limite de ${MAX_WORKFLOWS} workflows.` },
        { status: 429 }
      );

    // Crée le workflow
    const share_token = crypto.randomBytes(16).toString("hex");
    const newWorkflow = await pool.query(
      `INSERT INTO workflows (user_id, name, data, active, share_token)
       VALUES ($1, $2, $3, false, $4)
       RETURNING id, name`,
      [userId, `${name} (copie)`, JSON.stringify(workflow_data), share_token]
    );

    // Incrémente downloads (fire-and-forget)
    pool.query(
      "UPDATE community_templates SET downloads = downloads + 1 WHERE id = $1",
      [templateId]
    ).catch(() => {});

    return NextResponse.json({ ok: true, workflow: newWorkflow.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST community-templates/[id]/import:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
