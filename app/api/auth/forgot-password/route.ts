import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendForgotPasswordEmail } from "@/lib/email";
import crypto from "crypto";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfter } = rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

    // Vérifier si l'utilisateur existe
    const user = await pool.query("SELECT id FROM users WHERE email = $1", [email]);

    // On retourne toujours succès pour ne pas révéler si l'email existe
    if (user.rows.length === 0) {
      return NextResponse.json({ message: "Email envoyé si le compte existe." }, { status: 200 });
    }

    // Générer un token unique
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 heure

    // Supprimer les anciens tokens pour cet email
    await pool.query("DELETE FROM password_resets WHERE email = $1", [email]);

    // Sauvegarder le token
    await pool.query(
      "INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)",
      [email, token, expiresAt]
    );

    // Envoyer l'email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    await sendForgotPasswordEmail(email, resetUrl);

    return NextResponse.json({ message: "Email envoyé si le compte existe." });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}