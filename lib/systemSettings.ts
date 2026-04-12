import pool from "./db";

export type SystemSettings = {
  maintenance_mode: boolean;
  maintenance_message: string;
  maintenance_eta: string; // e.g. "30 minutes", "demain matin"
  global_banner_enabled: boolean;
  global_banner_text: string;
  global_banner_type: "info" | "warning" | "error";
  disabled_integrations: string[]; // e.g. ["gmail", "slack"]
};

const DEFAULTS: SystemSettings = {
  maintenance_mode: false,
  maintenance_message: "Nous effectuons une maintenance technique. Nous revenons très bientôt.",
  maintenance_eta: "",
  global_banner_enabled: false,
  global_banner_text: "",
  global_banner_type: "info",
  disabled_integrations: [],
};

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    await ensureTable();
    const res = await pool.query("SELECT key, value FROM system_settings");
    const settings = { ...DEFAULTS };
    for (const row of res.rows) {
      const key = row.key as keyof SystemSettings;
      if (key in DEFAULTS) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (settings as any)[key] = row.value;
      }
    }
    return settings;
  } catch {
    return { ...DEFAULTS };
  }
}

export async function setSystemSetting<K extends keyof SystemSettings>(
  key: K,
  value: SystemSettings[K]
): Promise<void> {
  // Auto-créer la table si elle n'existe pas encore (évite d'avoir à lancer /migrate)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(
    `INSERT INTO system_settings (key, value, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
    [key, JSON.stringify(value)]
  );
}
