/**
 * POST /api/community-templates/[id]/like  — toggle like (auth requise)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

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

    const userRow = await pool.query("SELECT id FROM users WHERE email = $1", [session.user.email]);
    if (!userRow.rows.length) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    const userId = userRow.rows[0].id;

    // Vérifie si le template existe
    const exists = await pool.query(
      "SELECT id FROM community_templates WHERE id = $1 AND status = 'published'",
      [templateId]
    );
    if (!exists.rows.length) return NextResponse.json({ error: "Template introuvable." }, { status: 404 });

    // Toggle : insert ou delete
    const existing = await pool.query(
      "SELECT 1 FROM template_likes WHERE user_id = $1 AND template_id = $2",
      [userId, templateId]
    );

    let liked: boolean;
    if (existing.rows.length) {
      // Unlike
      await pool.query(
        "DELETE FROM template_likes WHERE user_id = $1 AND template_id = $2",
        [userId, templateId]
      );
      await pool.query(
        "UPDATE community_templates SET likes = GREATEST(0, likes - 1) WHERE id = $1",
        [templateId]
      );
      liked = false;
    } else {
      // Like
      await pool.query(
        "INSERT INTO template_likes (user_id, template_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [userId, templateId]
      );
      await pool.query(
        "UPDATE community_templates SET likes = likes + 1 WHERE id = $1",
        [templateId]
      );
      liked = true;
    }

    const countRow = await pool.query(
      "SELECT likes FROM community_templates WHERE id = $1",
      [templateId]
    );
    return NextResponse.json({ ok: true, liked, likes: countRow.rows[0]?.likes ?? 0 });
  } catch (error) {
    console.error("POST community-templates/[id]/like:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
