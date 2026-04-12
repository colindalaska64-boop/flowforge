import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    const res = await pool.query("SELECT global_vars FROM users WHERE email = $1", [session.user.email]);
    return NextResponse.json(res.rows[0]?.global_vars || {});
  } catch {
    // Colonne pas encore migrée
    return NextResponse.json({});
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await req.json();

  // Valider : max 50 variables, clés alphanumériques, valeurs < 1000 chars
  if (typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Format invalide." }, { status: 400 });
  }
  const entries = Object.entries(body);
  if (entries.length > 50) {
    return NextResponse.json({ error: "Maximum 50 variables." }, { status: 400 });
  }
  for (const [key, val] of entries) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      return NextResponse.json({ error: `Nom invalide : "${key}". Utilisez lettres, chiffres et _ uniquement.` }, { status: 400 });
    }
    if (typeof val !== "string" || val.length > 1000) {
      return NextResponse.json({ error: `Valeur trop longue pour "${key}" (max 1000 caractères).` }, { status: 400 });
    }
  }

  try {
    await pool.query("UPDATE users SET global_vars = $1 WHERE email = $2", [JSON.stringify(body), session.user.email]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur. La colonne global_vars n'est peut-être pas encore migrée." }, { status: 500 });
  }
}
