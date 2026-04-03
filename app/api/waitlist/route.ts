import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendWaitlistConfirmation } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return NextResponse.json(
        { error: "Email invalide." },
        { status: 400 }
      );
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