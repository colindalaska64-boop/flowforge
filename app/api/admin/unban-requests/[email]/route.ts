import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const { email } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  await pool.query("DELETE FROM unban_requests WHERE email = $1", [decodeURIComponent(email)]).catch(() => {});
  return NextResponse.json({ ok: true });
}
