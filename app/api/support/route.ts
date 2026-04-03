import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sendWorkflowEmail } from "@/lib/email";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    const { subject, message } = await req.json();

    if (!subject || !message) {
      return NextResponse.json({ error: "Sujet et message requis." }, { status: 400 });
    }

    if (subject.length > 200 || message.length > 5000) {
      return NextResponse.json({ error: "Message trop long." }, { status: 400 });
    }

    const userEmail = session.user?.email || "inconnu";
    const userName = session.user?.name || "inconnu";

    await sendWorkflowEmail(
      "loopflo.contact@gmail.com",
      `[Support] ${subject}`,
      `De : ${userName} (${userEmail})\n\n${message}`
    );

    await pool.query(
      "INSERT INTO support_messages (email, subject, message) VALUES ($1, $2, $3)",
      [userEmail, subject, message]
    ).catch(() => {}); // silencieux si la table n'existe pas encore

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("SUPPORT ERROR:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}
