import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token et mot de passe requis." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
    }

    // Vérifier le token
    const result = await pool.query(
      "SELECT * FROM password_resets WHERE token = $1 AND used = false AND expires_at > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 400 });
    }

    const reset = result.rows[0];

    // Mettre à jour le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, reset.email]);

    // Marquer le token comme utilisé
    await pool.query("UPDATE password_resets SET used = true WHERE token = $1", [token]);

    return NextResponse.json({ message: "Mot de passe modifié avec succès !" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}