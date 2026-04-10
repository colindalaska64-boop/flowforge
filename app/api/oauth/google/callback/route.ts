import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const settingsUrl = new URL("/dashboard/settings", process.env.NEXTAUTH_URL);

  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL));
  }

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    settingsUrl.searchParams.set("gmail_error", error || "no_code");
    return NextResponse.redirect(settingsUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    settingsUrl.searchParams.set("gmail_error", "config");
    return NextResponse.redirect(settingsUrl);
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/google/callback`;

  // Échange du code contre les tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  const tokens = (await tokenRes.json()) as GoogleTokenResponse;

  if (!tokens.access_token) {
    settingsUrl.searchParams.set("gmail_error", tokens.error || "no_token");
    return NextResponse.redirect(settingsUrl);
  }

  // Récupérer l'email associé au token
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = (await userInfoRes.json()) as { email?: string };

  // Lire les connexions existantes pour préserver le refresh_token si non retourné
  const existingRes = await pool.query(
    "SELECT connections FROM users WHERE email = $1",
    [session.user.email]
  );
  const connections = existingRes.rows[0]?.connections || {};
  const previousOauth = connections.gmail_oauth || {};

  connections.gmail_oauth = {
    email: userInfo.email || previousOauth.email || "",
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || previousOauth.refresh_token || "",
    expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
  };

  await pool.query(
    "UPDATE users SET connections = $1 WHERE email = $2",
    [JSON.stringify(connections), session.user.email]
  );

  settingsUrl.searchParams.set("gmail_success", "1");
  return NextResponse.redirect(settingsUrl);
}
