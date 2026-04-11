import pool from "./db";

type LoginAttempt = {
  email: string;
  ip: string;
  success: boolean;
  reason?: "bad_password" | "unknown_user" | "banned" | "locked" | "rate_limited";
};

/**
 * Fire-and-forget logging of login attempts to the login_audit table.
 *
 * Non-blocking: if the table doesn't exist (migration not yet run) or
 * the insert fails, we swallow the error so authentication is never
 * held up by the audit layer.
 */
export function logLoginAttempt(attempt: LoginAttempt): void {
  // Tronque l'email pour éviter de stocker n'importe quoi si un scraper
  // envoie des strings énormes
  const email = attempt.email.slice(0, 255);
  const ip = attempt.ip.slice(0, 64);

  pool.query(
    `INSERT INTO login_audit (email, ip, success, reason)
     VALUES ($1, $2, $3, $4)`,
    [email, ip, attempt.success, attempt.reason || null]
  ).catch(() => { /* table not migrated or DB blip — silent */ });
}
