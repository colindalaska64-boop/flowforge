import crypto from "crypto";

/**
 * AES-256-GCM symmetric encryption for at-rest secrets
 * (primarily: users.connections JSONB).
 *
 * The key comes from env CONNECTIONS_SECRET:
 *   - 64 hex chars = raw 32-byte key, used as-is
 *   - any other non-empty string = scrypt-derived 32-byte key
 *
 * If CONNECTIONS_SECRET is missing, encryption is disabled and the
 * helpers return/accept plaintext. This keeps local dev working, but
 * production MUST set the variable.
 */

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const SCRYPT_SALT = Buffer.from("loopflo-connections-v1", "utf8");

let cachedKey: Buffer | null = null;
let keyResolved = false;

function getKey(): Buffer | null {
  if (keyResolved) return cachedKey;
  keyResolved = true;

  const raw = process.env.CONNECTIONS_SECRET;
  if (!raw || raw.length < 16) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[ENCRYPTION] CONNECTIONS_SECRET missing — secrets stored in plaintext");
    }
    cachedKey = null;
    return null;
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    cachedKey = Buffer.from(raw, "hex");
  } else {
    cachedKey = crypto.scryptSync(raw, SCRYPT_SALT, 32);
  }
  return cachedKey;
}

export function encryptionEnabled(): boolean {
  return getKey() !== null;
}

export type EncryptedBlob = {
  __enc: 1;
  iv: string;
  tag: string;
  ct: string;
};

export function isEncryptedBlob(value: unknown): value is EncryptedBlob {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { __enc?: unknown }).__enc === 1 &&
    typeof (value as { iv?: unknown }).iv === "string" &&
    typeof (value as { tag?: unknown }).tag === "string" &&
    typeof (value as { ct?: unknown }).ct === "string"
  );
}

export function encryptJson(payload: unknown): EncryptedBlob | unknown {
  const key = getKey();
  if (!key) return payload;

  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    __enc: 1 as const,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ct: ct.toString("base64"),
  };
}

export function decryptJson<T = unknown>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (!isEncryptedBlob(value)) return value as T;

  const key = getKey();
  if (!key) {
    console.error("[ENCRYPTION] Encountered encrypted blob but no key available");
    return null;
  }

  try {
    const iv = Buffer.from(value.iv, "base64");
    const tag = Buffer.from(value.tag, "base64");
    const ct = Buffer.from(value.ct, "base64");
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return JSON.parse(pt.toString("utf8")) as T;
  } catch (e) {
    console.error("[ENCRYPTION] Decryption failed:", e instanceof Error ? e.message : e);
    return null;
  }
}
