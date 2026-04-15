import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { sendWelcomeEmail, sendVerificationEmail } from "@/lib/email";
import { validateEmail } from "@/lib/validateEmail";

export async function POST(req: NextRequest) {
  // 5 tentatives max par IP toutes les 15 minutes
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfter } = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 }
      );
    }

    const { valid, reason } = validateEmail(email);
    if (!valid) {
      return NextResponse.json({ error: reason || "Email invalide." }, { status: 400 });
    }

    if (password.length < 8 || password.length > 100) {
      return NextResponse.json(
        { error: "Le mot de passe doit faire entre 8 et 100 caractères." },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé." },
        { status: 400 }
      );
    }

    // Chiffrer le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Générer un token de vérification email
    const crypto = (await import("crypto")).default;
    const verifyToken = crypto.randomBytes(32).toString("hex");

    // Créer l'utilisateur avec token de vérification
    await pool.query(
      "INSERT INTO users (name, email, password, email_verified, verify_token) VALUES ($1, $2, $3, false, $4)",
      [name, email, hashedPassword, verifyToken]
    );

    // Envoyer email de vérification + email de bienvenue
    const baseUrl = process.env.NEXTAUTH_URL || "https://loopflo.app";
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verifyToken}`;
    sendVerificationEmail(email, verifyUrl).catch(() => {});
    sendWelcomeEmail(email, name).catch(() => {});

    return NextResponse.json(
      { message: "Compte créé ! Vérifiez votre email pour activer votre compte." },
      { status: 201 }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}