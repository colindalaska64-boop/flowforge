import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "Code requis." }, { status: 400 });

    const result = await pool.query(
      "SELECT * FROM admin_otp WHERE code = $1 AND used = false AND expires_at > NOW()",
      [code]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Code invalide ou expiré." }, { status: 401 });
    }

    // Marquer le code comme utilisé
    await pool.query("UPDATE admin_otp SET used = true WHERE id = $1", [result.rows[0].id]);

    // Créer un token de session admin valide 2h
    const adminToken = randomUUID();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await pool.query(
      "INSERT INTO admin_otp (code, token, used, expires_at) VALUES ($1, $2, false, $3)",
      ["SESSION", adminToken, expiresAt]
    );

    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_token", adminToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("OTP VERIFY ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
