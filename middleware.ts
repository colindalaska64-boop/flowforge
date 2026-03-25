import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    // Double vérification — email ET is_admin en base
    const result = await pool.query(
      "SELECT is_admin FROM users WHERE email = $1 AND is_admin = true",
      [token.email]
    );

    if (result.rows.length === 0) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};