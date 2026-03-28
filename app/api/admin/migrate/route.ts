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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_otp (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        used BOOLEAN DEFAULT false,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    return NextResponse.json({ ok: true, message: "Migration exécutée." });
  } catch (error) {
    console.error("MIGRATE ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
