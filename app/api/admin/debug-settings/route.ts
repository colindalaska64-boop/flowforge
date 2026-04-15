import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Test connexion DB
  try {
    await pool.query("SELECT 1");
    results.db_connection = "OK";
  } catch (err) {
    results.db_connection = `ERREUR: ${String(err)}`;
  }

  // 2. Vérifie si la table system_settings existe
  try {
    const res = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_settings')"
    );
    results.table_exists = res.rows[0].exists;
  } catch (err) {
    results.table_exists = `ERREUR: ${String(err)}`;
  }

  // 3. Lire le contenu de la table
  try {
    const res = await pool.query("SELECT key, value FROM system_settings");
    results.rows = res.rows;
    results.row_count = res.rowCount;
  } catch (err) {
    results.rows = `ERREUR: ${String(err)}`;
  }

  // 4. Tester l'écriture
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    results.create_table = "OK";
  } catch (err) {
    results.create_table = `ERREUR: ${String(err)}`;
  }

  // 5. Variables d'env critiques (sans révéler les valeurs)
  results.env = {
    DATABASE_URL: process.env.DATABASE_URL ? `défini (${process.env.DATABASE_URL.slice(0, 30)}...)` : "MANQUANT",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ? `défini (${process.env.ADMIN_EMAIL})` : "MANQUANT",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "défini" : "MANQUANT",
  };

  return NextResponse.json(results, { status: 200 });
}
