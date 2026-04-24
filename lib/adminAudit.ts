import pool from "./db";

export type AdminAction =
  | "ban_user"
  | "unban_user"
  | "change_plan"
  | "send_announcement"
  | "disable_integration"
  | "enable_integration"
  | "delete_workflow"
  | "delete_user"
  | "migrate_db"
  | "view_users"
  | "debug_settings";

/**
 * Enregistre une action admin dans admin_audit.
 * Fire-and-forget : n'interrompt jamais l'opération en cas d'erreur d'écriture.
 */
export async function logAdminAction(
  adminEmail: string,
  action: AdminAction,
  targetId: string | number | null,
  details: string
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO admin_audit (admin_email, action, target_id, details)
       VALUES ($1, $2, $3, $4)`,
      [adminEmail, action, targetId !== null ? String(targetId) : null, details]
    );
  } catch {
    // Ne jamais bloquer une action admin à cause d'un échec d'audit
  }
}
