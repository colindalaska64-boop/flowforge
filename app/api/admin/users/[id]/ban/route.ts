import { NextRequest, NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/adminAuth";
import pool from "@/lib/db";
import { logAdminAction } from "@/lib/adminAudit";
import { ensureAdminColumns } from "@/lib/adminTeam";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Double facteur : session admin + code OTP validé.
  const admin = await getAdminOrNull("admin");
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  const user = await pool.query("SELECT banned, email FROM users WHERE id = $1", [id]);
  if (user.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  const newBanned = !user.rows[0].banned;
  // banned_at : horodatage du ban pour l'auto-suppression après 30 jours
  // banned_by : sans ça, impossible de savoir qui a banni quand on est plusieurs.
  await ensureAdminColumns();
  await pool.query(
    "UPDATE users SET banned = $1, banned_at = $2, banned_by = $3 WHERE id = $4",
    [newBanned, newBanned ? new Date() : null, newBanned ? admin.email : null, id]
  );

  await logAdminAction(
      admin.email,
    newBanned ? "ban_user" : "unban_user",
    id,
    `Utilisateur ${user.rows[0].email} → banned=${newBanned}`
  );

  return NextResponse.json({ ok: true, banned: newBanned });
}