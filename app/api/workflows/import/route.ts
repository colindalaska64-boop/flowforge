import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

// GET /api/workflows/import?token=xxx → retourne les infos du workflow partagé
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token manquant." }, { status: 400 });

  const res = await pool.query(
    "SELECT id, name, data FROM workflows WHERE share_token = $1",
    [token]
  );
  if (res.rows.length === 0) return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });

  const wf = res.rows[0];
  return NextResponse.json({ name: wf.name, data: wf.data });
}

// POST /api/workflows/import → importe dans le compte connecté
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Connectez-vous pour importer." }, { status: 401 });

  const { token } = await req.json() as { token: string };
  if (!token) return NextResponse.json({ error: "Token manquant." }, { status: 400 });

  const res = await pool.query(
    "SELECT name, data FROM workflows WHERE share_token = $1",
    [token]
  );
  if (res.rows.length === 0) return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });

  const user = await pool.query("SELECT id FROM users WHERE email = $1", [session.user?.email]);
  if (user.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  const { name, data } = res.rows[0];
  const newName = `${name} (importé)`;

  const insert = await pool.query(
    "INSERT INTO workflows (user_id, name, data, active) VALUES ($1, $2, $3, false) RETURNING id",
    [user.rows[0].id, newName, data]
  );

  return NextResponse.json({ id: insert.rows[0].id, name: newName });
}
