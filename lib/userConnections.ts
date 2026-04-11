import pool from "./db";
import { encryptJson, decryptJson } from "./encryption";
import type { UserConnections } from "./executor";

/**
 * Unified read/write for users.connections.
 *
 * Storage shape: either a plain JSON object (legacy) or an
 * EncryptedBlob produced by lib/encryption.ts. Reads tolerate both,
 * so existing rows keep working until they are next saved.
 * Writes always go through encryptJson — if no key is configured,
 * the plaintext path is kept transparently.
 */

export async function getUserConnectionsByEmail(email: string): Promise<UserConnections> {
  const res = await pool.query("SELECT connections FROM users WHERE email = $1", [email]);
  return normalize(res.rows[0]?.connections);
}

export async function getUserConnectionsById(userId: number | string): Promise<UserConnections> {
  const res = await pool.query("SELECT connections FROM users WHERE id = $1", [userId]);
  return normalize(res.rows[0]?.connections);
}

export async function setUserConnectionsByEmail(email: string, connections: UserConnections): Promise<void> {
  const stored = encryptJson(connections);
  await pool.query("UPDATE users SET connections = $1 WHERE email = $2", [
    JSON.stringify(stored),
    email,
  ]);
}

function normalize(raw: unknown): UserConnections {
  if (!raw) return {};
  const decrypted = decryptJson<UserConnections>(raw);
  return decrypted || {};
}
