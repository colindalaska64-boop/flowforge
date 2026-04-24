import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import { sendLaunchAnnouncement } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  try {
    const users = await pool.query("SELECT email FROM users");
    const userEmails: string[] = users.rows.map((r: { email: string }) => r.email);

    let sent = 0;
    for (const email of userEmails) {
      await sendLaunchAnnouncement(email, true);
      sent++;
    }

    return NextResponse.json({ sent, users: userEmails.length });

  } catch (error) {
    console.error("ANNOUNCE ERROR:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}
