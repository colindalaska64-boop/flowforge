import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { randomUUID } from "crypto";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "Code requis." }, { status: 400 });

    // Vérifier le rate limiting OTP
    const attemptsRow = await pool.query("SELECT * FROM admin_attempts WHERE id = 1");
    const att = attemptsRow.rows[0];
    if (att?.locked_until && new Date(att.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(att.locked_until).getTime() - Date.now()) / 60000);
      return NextResponse.json({ error: `Trop de tentatives. Réessayez dans ${mins} minute(s).` }, { status: 429 });
    }

    const result = await pool.query(
      "SELECT * FROM admin_otp WHERE code = $1 AND used = false AND expires_at > NOW()",
      [code]
    );

    if (result.rows.length === 0) {
      // Incrémenter les tentatives
      const attempts = (att?.attempts || 0) + 1;
      if (attempts >= 5) {
        const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
        await pool.query("UPDATE admin_attempts SET attempts = 0, locked_until = $1 WHERE id = 1", [lockedUntil]);
        return NextResponse.json({ error: "Trop de tentatives. Compte bloqué 10 minutes." }, { status: 429 });
      }
      await pool.query("UPDATE admin_attempts SET attempts = $1 WHERE id = 1", [attempts]);
      return NextResponse.json({ error: `Code invalide. ${5 - attempts} tentative(s) restante(s).` }, { status: 401 });
    }

    // Marquer le code comme utilisé + reset tentatives
    await pool.query("UPDATE admin_otp SET used = true WHERE id = $1", [result.rows[0].id]);
    await pool.query("UPDATE admin_attempts SET attempts = 0, locked_until = NULL WHERE id = 1");

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
