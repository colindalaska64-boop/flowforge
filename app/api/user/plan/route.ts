import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ plan: "free" });

  const user = await pool.query("SELECT plan FROM users WHERE email = $1", [session.user?.email]);
  return NextResponse.json({ plan: user.rows[0]?.plan || "free" });
}