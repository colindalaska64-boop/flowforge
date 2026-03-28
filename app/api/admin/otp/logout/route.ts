import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (token) {
      // Invalider le token en DB
      await pool.query(
        "UPDATE admin_otp SET used = true WHERE token = $1",
        [token]
      );
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_token", "", { expires: new Date(0), path: "/" });
    return res;
  } catch {
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}
