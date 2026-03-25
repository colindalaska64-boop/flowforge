import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { sendLaunchAnnouncement } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  try {
    const { target } = await req.json();

    const users = target !== "waitlist"
      ? await pool.query("SELECT email FROM users")
      : { rows: [] };

    const waitlist = target !== "users"
      ? await pool.query("SELECT email FROM waitlist")
      : { rows: [] };

    const userEmails: string[] = users.rows.map((r: { email: string }) => r.email);
    const waitlistEmails: string[] = waitlist.rows.map((r: { email: string }) => r.email);

    // Éviter les doublons (un user qui est aussi dans la waitlist)
    const waitlistOnly = waitlistEmails.filter(e => !userEmails.includes(e));

    let sent = 0;
    for (const email of userEmails) {
      await sendLaunchAnnouncement(email, true);
      sent++;
    }
    for (const email of waitlistOnly) {
      await sendLaunchAnnouncement(email, false);
      sent++;
    }

    return NextResponse.json({ sent, users: userEmails.length, waitlist: waitlistOnly.length });

  } catch (error) {
    console.error("ANNOUNCE ERROR:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}
