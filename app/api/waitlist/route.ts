import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendWaitlistConfirmation } from "@/lib/email";
import { validateEmail } from "@/lib/validateEmail";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfter } = rateLimit(`waitlist:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const { email } = await req.json();

    const { valid, reason } = validateEmail(email);
    if (!valid) {
      return NextResponse.json({ error: reason || "Email invalide." }, { status: 400 });
    }

    const existing = await pool.query(
      "SELECT id FROM waitlist WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Cet email est déjà sur la waitlist !" },
        { status: 400 }
      );
    }

    await pool.query(
      "INSERT INTO waitlist (email) VALUES ($1)",
      [email]
    );

    // Envoi en arrière-plan, sans bloquer la réponse
    sendWaitlistConfirmation(email).catch(() => {});

    return NextResponse.json(
      { message: "Vous êtes sur la waitlist ! 🎉" },
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