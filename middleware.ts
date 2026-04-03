import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (token.email !== process.env.ADMIN_EMAIL) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};