import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { sendWelcomeEmail } from "@/lib/email";
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

    // Créer l'utilisateur — email vérifié directement, pas de blocage à la connexion
    await pool.query(
      "INSERT INTO users (name, email, password, email_verified) VALUES ($1, $2, $3, true)",
      [name, email, hashedPassword]
    );

    // Email de bienvenue (non bloquant)
    sendWelcomeEmail(email, name).catch(() => {});

    return NextResponse.json(
      { message: "Compte créé ! Vous pouvez maintenant vous connecter." },
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