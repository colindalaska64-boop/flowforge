import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import { logAdminAction } from "@/lib/adminAudit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const userRes = await pool.query("SELECT email FROM users WHERE id = $1", [id]);
  if (userRes.rows.length === 0) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }
  const userEmail = userRes.rows[0].email;

  try {
    // Suppression en cascade dans une transaction
    await pool.query("BEGIN");
    await pool.query(
      "DELETE FROM executions WHERE workflow_id IN (SELECT id FROM workflows WHERE user_id = $1)",
      [id]
    );
    await pool.query("DELETE FROM workflows WHERE user_id = $1", [id]);
    await pool.query("DELETE FROM support_messages WHERE email = $1", [userEmail]);
    await pool.query("DELETE FROM unban_requests WHERE email = $1", [userEmail]).catch(() => {});
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    await pool.query("COMMIT");

    await logAdminAction(
      session.user?.email ?? "admin",
      "delete_user",
      id,
      `Compte supprimé : ${userEmail}`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
