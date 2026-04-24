import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`unban:${ip}`, 3, 60 * 60 * 1000); // 3 tentatives/heure
  if (!allowed) {
    return NextResponse.json({ error: "Trop de demandes." }, { status: 429 });
  }

  try {
    const { email, message } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requis." }, { status: 400 });
    }

    // Vérifier que l'email correspond bien à un compte banni
    const user = await pool.query("SELECT id FROM users WHERE email = $1 AND banned = true", [email.trim().toLowerCase()]);
    if (user.rows.length === 0) {
      // Réponse identique pour ne pas exposer si l'email existe
      return NextResponse.json({ ok: true });
    }

    await pool.query(
      `INSERT INTO unban_requests (email, message)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET message = $2, created_at = NOW()`,
      [email.trim().toLowerCase(), (message || "").slice(0, 1000)]
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
