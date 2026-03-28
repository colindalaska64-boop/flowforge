import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  let currentPassword: string, newPassword: string;
  try { ({ currentPassword, newPassword } = await req.json()); }
  catch { return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 }); }

  const user = await pool.query("SELECT password FROM users WHERE email = $1", [session.user?.email]);
  if (user.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.rows[0].password);
  if (!valid) return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashed, session.user?.email]);

  return NextResponse.json({ message: "Mot de passe modifié !" });
}