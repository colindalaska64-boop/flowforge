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

    // Le rôle admin se lit en base, or le middleware tourne sur Edge et n'a pas
    // accès à Postgres. On se limite donc ici à exiger d'être connecté :
    // l'autorisation réelle est faite par requireAdmin() sur chaque page et par
    // getAdminOrNull() sur chaque route /api/admin. Les deux vérifient le rôle
    // ET le second facteur (code OTP).
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};