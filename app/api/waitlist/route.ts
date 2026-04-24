import { NextResponse } from "next/server";

// Waitlist supprimée — Loopflo est ouvert à tous
export async function POST() {
  return NextResponse.json({ error: "Route supprimée." }, { status: 410 });
}
