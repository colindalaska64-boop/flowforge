/**
 * POST /api/community-templates/[id]/report  — signaler un template (auth requise)
 * Max 1 signalement par user/template
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_REASONS = [
  "contenu_inapproprie",
  "informations_fausses",
  "spam",
  "credentials_exposes",
  "autre",
] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    const { id } = await params;
    const templateId = parseInt(id);
    if (isNaN(templateId)) return NextResponse.json({ error: "ID invalide." }, { status: 400 });

    const body = await req.json();
    const reason = body.reason as string;
    if (!VALID_REASONS.includes(reason as never))
      return NextResponse.json({ error: "Raison invalide." }, { status: 400 });

    const userRow = await pool.query("SELECT id FROM users WHERE email = $1", [session.user.email]);
    if (!userRow.rows.length) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    const userId = userRow.rows[0].id;

    // 1 signalement par user/template
    const already = await pool.query(
      "SELECT 1 FROM template_reports WHERE user_id = $1 AND template_id = $2",
      [userId, templateId]
    );
    if (already.rows.length)
      return NextResponse.json({ error: "Vous avez déjà signalé ce template." }, { status: 409 });

    await pool.query(
      "INSERT INTO template_reports (user_id, template_id, reason) VALUES ($1, $2, $3)",
      [userId, templateId, reason]
    );

    // Auto-masque si >= 5 signalements
    await pool.query(`
      UPDATE community_templates
      SET status = 'flagged'
      WHERE id = $1
        AND status = 'published'
        AND (SELECT COUNT(*) FROM template_reports WHERE template_id = $1) >= 5
    `, [templateId]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST community-templates/[id]/report:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
