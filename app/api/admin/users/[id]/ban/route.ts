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
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const user = await pool.query("SELECT banned, email FROM users WHERE id = $1", [id]);
  if (user.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  const newBanned = !user.rows[0].banned;
  await pool.query("UPDATE users SET banned = $1 WHERE id = $2", [newBanned, id]);

  await logAdminAction(
    session.user?.email ?? "admin",
    newBanned ? "ban_user" : "unban_user",
    id,
    `Utilisateur ${user.rows[0].email} → banned=${newBanned}`
  );

  return NextResponse.json({ ok: true, banned: newBanned });
}