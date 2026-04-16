/**
 * GET  /api/community-templates/[id]  — détail complet (public)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templateId = parseInt(id);
    if (isNaN(templateId)) return NextResponse.json({ error: "ID invalide." }, { status: 400 });

    const result = await pool.query(
      `SELECT id, user_name, name, description, category, keywords, tools,
              config_time, workflow_data, configurable_blocks,
              downloads, likes, share_token, created_at
       FROM community_templates
       WHERE id = $1 AND status = 'published'`,
      [templateId]
    );
    if (!result.rows.length)
      return NextResponse.json({ error: "Template introuvable." }, { status: 404 });

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("GET community-templates/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
