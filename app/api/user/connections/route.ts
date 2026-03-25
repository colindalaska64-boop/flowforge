import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

// S'assure que la colonne connections existe
async function ensureColumn() {
  await pool.query(
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS connections JSONB DEFAULT '{}'::jsonb"
  );
}

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  await ensureColumn();

  const result = await pool.query(
    "SELECT connections FROM users WHERE email = $1",
    [session.user?.email]
  );

  return NextResponse.json(result.rows[0]?.connections || {});
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  await ensureColumn();

  const body = await req.json();

  await pool.query(
    "UPDATE users SET connections = $1 WHERE email = $2",
    [JSON.stringify(body), session.user?.email]
  );

  return NextResponse.json({ ok: true });
}
