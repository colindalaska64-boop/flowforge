import { cookies } from "next/headers";
import pool from "./db";

export async function checkAdminCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return false;

    const result = await pool.query(
      "SELECT * FROM admin_otp WHERE token = $1 AND code = 'SESSION' AND used = false AND expires_at > NOW()",
      [token]
    );

    return result.rows.length > 0;
  } catch {
    return false;
  }
}
