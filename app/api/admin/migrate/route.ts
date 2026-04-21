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
    // Nettoyage auto : supprime les exécutions de plus de 90 jours
    await pool.query(`
      CREATE OR REPLACE FUNCTION cleanup_old_executions() RETURNS void AS $$
      BEGIN
        DELETE FROM executions WHERE created_at < NOW() - INTERVAL '90 days';
      END;
      $$ LANGUAGE plpgsql
    `);

    // -------------------------------------------------------------------------
    // Community templates — upgrade + nouvelles tables
    // -------------------------------------------------------------------------

    // Crée la table principale si elle n'existe pas encore
    await pool.query(`
      CREATE TABLE IF NOT EXISTS community_templates (
        id BIGSERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_name TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Autre',
        keywords TEXT[] DEFAULT '{}',
        tools TEXT[] DEFAULT '{}',
        config_time INT DEFAULT 5,
        workflow_data JSONB NOT NULL DEFAULT '{}',
        configurable_blocks JSONB DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'published',
        downloads INT NOT NULL DEFAULT 0,
        likes INT NOT NULL DEFAULT 0,
        share_token TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Colonnes ajoutées progressivement (idempotent)
    await pool.query(`ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}'`);
    await pool.query(`ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS tools TEXT[] DEFAULT '{}'`);
    await pool.query(`ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS config_time INT DEFAULT 5`);
    await pool.query(`ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS configurable_blocks JSONB DEFAULT '[]'`);
    await pool.query(`ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'`);
    await pool.query(`ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS downloads INT NOT NULL DEFAULT 0`);
    await pool.query(`ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS likes INT NOT NULL DEFAULT 0`);
    await pool.query(`ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS share_token TEXT`);
    // user_id FK (si la table existait en mode sans FK)
    // Ne tente pas ALTER si la colonne existe déjà avec FK — on laisse ça manuellement si besoin.

    // Indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS ct_category_idx ON community_templates (category)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS ct_status_created_idx ON community_templates (status, created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS ct_user_id_idx ON community_templates (user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS ct_downloads_idx ON community_templates (downloads DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS ct_likes_idx ON community_templates (likes DESC)`);
    // GIN pour recherche full-text
    await pool.query(`
      CREATE INDEX IF NOT EXISTS ct_fulltext_idx
      ON community_templates USING GIN (
        to_tsvector('simple', name || ' ' || description)
      )
    `);
    // GIN pour keywords
    await pool.query(`
      CREATE INDEX IF NOT EXISTS ct_keywords_gin
      ON community_templates USING GIN (keywords)
    `);

    // Likes (une ligne = un utilisateur a liké un template)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS template_likes (
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        template_id BIGINT NOT NULL REFERENCES community_templates(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, template_id)
      )
    `);

    // Signalements
    await pool.query(`
      CREATE TABLE IF NOT EXISTS template_reports (
        id BIGSERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        template_id BIGINT NOT NULL REFERENCES community_templates(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS tr_template_idx ON template_reports (template_id)`);

    // ── Déduplication webhooks ────────────────────────────────────────────────
    // Stocke les event IDs uniques des providers (GitHub, Stripe, Svix, etc.)
    // pour empêcher la double exécution lors des retries.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        event_id   TEXT PRIMARY KEY,
        workflow_id INT NOT NULL,
        received_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS webhook_events_received_idx
      ON webhook_events (received_at)
    `);
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json({ ok: true, message: "Migration exécutée." });
  } catch (error) {
    console.error("MIGRATE ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
