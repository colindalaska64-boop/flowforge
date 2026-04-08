import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import { validateEmail } from "@/lib/validateEmail";

export const dynamic = "force-dynamic";

// Admin seulement
async function isAdmin(session: { user?: { email?: string | null } } | null) {
  if (!session?.user?.email) return false;
  const row = await pool.query("SELECT role FROM users WHERE email = $1", [session.user.email]);
  return row.rows[0]?.role === "admin";
}

// GET — liste les emails suspects (sans supprimer)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(await isAdmin(session))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table") || "waitlist"; // waitlist ou users

  try {
    const col = table === "users" ? "email, name, created_at" : "email, created_at";
    const rows = await pool.query(`SELECT ${col} FROM ${table} ORDER BY created_at DESC`);
    const suspicious: unknown[] = [];
    const clean: unknown[] = [];

    for (const row of rows.rows) {
      const { valid } = validateEmail(row.email);
      if (!valid) suspicious.push(row);
      else clean.push(row);
    }

    return NextResponse.json({
      table,
      total: rows.rows.length,
      suspicious_count: suspicious.length,
      clean_count: clean.length,
      suspicious,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// DELETE — supprime les emails suspects
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(await isAdmin(session))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { table, emails } = await req.json();
  if (!table || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "Table et liste d'emails requis." }, { status: 400 });
  }
  if (!["waitlist", "users"].includes(table)) {
    return NextResponse.json({ error: "Table invalide." }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `DELETE FROM ${table} WHERE email = ANY($1::text[]) RETURNING email`,
      [emails]
    );
    return NextResponse.json({ deleted: result.rows.map((r: { email: string }) => r.email) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
