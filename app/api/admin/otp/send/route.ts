import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { randomUUID, randomInt } from "crypto";
import pool from "@/lib/db";
import { sendWorkflowEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  try {
    // Supprimer les anciens codes non utilisés
    await pool.query("DELETE FROM admin_otp WHERE expires_at < NOW() OR used = true");

    // Générer un code à 6 chiffres
    const code = String(randomInt(100000, 1000000));
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      "INSERT INTO admin_otp (code, token, expires_at) VALUES ($1, $2, $3)",
      [code, token, expiresAt]
    );

    await sendWorkflowEmail(
      process.env.ADMIN_EMAIL!,
      "Code d'accès Admin Loopflo",
      `Votre code d'accès : ${code}\n\nValable 10 minutes. Ne le partagez pas.`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("OTP SEND ERROR:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}
