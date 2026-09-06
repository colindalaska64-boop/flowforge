import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

/** Ajoute la colonne si elle manque. Sans effet si déjà présente. */
async function ensureColonnes() {
  await pool.query(
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_on_error BOOLEAN DEFAULT true"
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    await ensureColonnes();
    const res = await pool.query("SELECT notify_on_error FROM users WHERE email = $1", [
      session.user.email,
    ]);
    // Par défaut on prévient : mieux vaut une alerte de trop qu'un workflow
    // cassé pendant des semaines sans que personne ne le sache.
    return NextResponse.json({ notifyOnError: res.rows[0]?.notify_on_error !== false });
  } catch {
    return NextResponse.json({ notifyOnError: true });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const { notifyOnError } = await req.json().catch(() => ({}));
  if (typeof notifyOnError !== "boolean") {
    return NextResponse.json({ error: "Valeur invalide." }, { status: 400 });
  }

  try {
    await ensureColonnes();
    await pool.query("UPDATE users SET notify_on_error = $1 WHERE email = $2", [
      notifyOnError,
      session.user.email,
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PREFERENCES ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
