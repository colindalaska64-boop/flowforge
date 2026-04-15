import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/login?error=token_manquant", req.url));

  try {
    const res = await pool.query(
      `UPDATE users
       SET email_verified = true, verify_token = NULL
       WHERE verify_token = $1 AND email_verified = false
       RETURNING email`,
      [token]
    );

    if (res.rowCount === 0) {
      return NextResponse.redirect(new URL("/login?error=lien_invalide", req.url));
    }

    return NextResponse.redirect(new URL("/login?verified=1", req.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=erreur_serveur", req.url));
  }
}
