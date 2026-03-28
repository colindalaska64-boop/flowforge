import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    await pool.query(`
      ALTER TABLE executions
      ADD COLUMN IF NOT EXISTS results JSONB
    `);
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false
    `);
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS session_token TEXT
    `);
    return NextResponse.json({ ok: true, message: "Migration exécutée." });
  } catch (error) {
    console.error("MIGRATE ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
