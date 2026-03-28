import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { sendWorkflowEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("SUPPORT ERROR:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}
