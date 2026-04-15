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
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0
    `);
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_attempts (
        id INT PRIMARY KEY DEFAULT 1,
        attempts INT DEFAULT 0,
        locked_until TIMESTAMPTZ
      )
    `);
    await pool.query(`
      INSERT INTO admin_attempts (id, attempts) VALUES (1, 0)
      ON CONFLICT (id) DO NOTHING
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_audit (
        id BIGSERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        ip TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS login_audit_email_created_idx
      ON login_audit (email, created_at DESC)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS login_audit_ip_created_idx
      ON login_audit (ip, created_at DESC)
    `);
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS global_vars JSONB DEFAULT '{}'
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feature_requests (
        id BIGSERIAL PRIMARY KEY,
        workflow_id INT,
        workflow_name TEXT,
        user_email TEXT,
        node_label TEXT,
        ai_response TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS feature_requests_created_idx
      ON feature_requests (created_at DESC)
    `);
    // Email verification
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT true`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_token TEXT`);
    // Workflow sort order + share
    await pool.query(`ALTER TABLE workflows ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0`);
    await pool.query(`ALTER TABLE workflows ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE`);

    return NextResponse.json({ ok: true, message: "Migration exécutée." });
  } catch (error) {
    console.error("MIGRATE ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
