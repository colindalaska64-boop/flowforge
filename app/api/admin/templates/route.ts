/**
 * GET   /api/admin/templates         — liste (published, flagged, deleted) + signalements
 * PATCH /api/admin/templates         — modérer (approve, flag, delete)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

async function isAdmin(email: string): Promise<boolean> {
  const row = await pool.query("SELECT is_admin FROM users WHERE email = $1", [email]);
  return row.rows[0]?.is_admin === true;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !(await isAdmin(session.user.email)))
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "flagged"; // published | flagged | deleted
    const page   = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit  = 20;
    const offset = (page - 1) * limit;

    const [templates, counts] = await Promise.all([
      pool.query(
        `SELECT ct.id, ct.user_name, ct.name, ct.category, ct.description,
                ct.status, ct.downloads, ct.likes, ct.created_at,
                (SELECT COUNT(*) FROM template_reports tr WHERE tr.template_id = ct.id) AS report_count
         FROM community_templates ct
         WHERE ct.status = $1
         ORDER BY report_count DESC, ct.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        [status]
      ),
      pool.query(
        `SELECT status, COUNT(*) as n
         FROM community_templates
         WHERE status IN ('published','flagged','deleted')
         GROUP BY status`
      ),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const row of counts.rows) statusCounts[row.status] = parseInt(row.n);

    return NextResponse.json({
      templates: templates.rows,
      statusCounts,
      page,
    });
  } catch (error) {
    console.error("GET admin/templates:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !(await isAdmin(session.user.email)))
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const { id, action } = await req.json();
    if (!id || !["approve", "flag", "delete"].includes(action))
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });

    const newStatus = action === "approve" ? "published"
                    : action === "flag"    ? "flagged"
                    : "deleted";

    await pool.query(
      "UPDATE community_templates SET status = $1 WHERE id = $2",
      [newStatus, id]
    );

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (error) {
    console.error("PATCH admin/templates:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
