import { NextRequest, NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/adminAuth";
import pool from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const { email } = await params;

  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  await pool.query("DELETE FROM unban_requests WHERE email = $1", [decodeURIComponent(email)]).catch(() => {});
  return NextResponse.json({ ok: true });
}
