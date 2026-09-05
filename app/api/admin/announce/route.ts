import { NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/adminAuth";
import pool from "@/lib/db";
import { sendLaunchAnnouncement } from "@/lib/email";
import { logAdminAction } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";

export async function POST() {
  // Double facteur : session admin + code OTP validé.
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const users = await pool.query("SELECT email FROM users WHERE banned = false");
    const emails: string[] = users.rows.map((r: { email: string }) => r.email);

    // Un échec sur une adresse ne doit pas interrompre toute la campagne.
    let sent = 0;
    let failed = 0;
    for (const email of emails) {
      try {
        await sendLaunchAnnouncement(email, true);
        sent++;
      } catch (err) {
        failed++;
        console.error("ANNOUNCE ERROR for", email, err);
      }
    }

    await logAdminAction(admin, "send_announcement", null, `${sent} envoyés, ${failed} échecs`);

    return NextResponse.json({ sent, failed, total: emails.length });
  } catch (error) {
    console.error("ANNOUNCE ERROR:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}
