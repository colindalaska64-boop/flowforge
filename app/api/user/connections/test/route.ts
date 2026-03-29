import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const { service } = await req.json();

  try {
    const userResult = await pool.query(
      "SELECT connections FROM users WHERE email = $1",
      [session.user?.email]
    );
    const connections = userResult.rows[0]?.connections || {};

    if (service === "gmail") {
      const gmail = connections.gmail;
      if (!gmail?.email || !gmail?.app_password) {
        return NextResponse.json({ ok: false, error: "Identifiants Gmail manquants." });
      }

      const { ImapFlow } = await import("imapflow");
      const client = new ImapFlow({
        host: "imap.gmail.com",
        port: 993,
        secure: true,
        auth: { user: gmail.email, pass: gmail.app_password },
        logger: false,
      });

      try {
        await client.connect();
        const lock = await client.getMailboxLock("INBOX");
        const mb = client.mailbox;
        const total = (mb && typeof mb === "object" && "exists" in mb) ? (mb.exists as number) : 0;
        lock.release();
        await client.logout();
        return NextResponse.json({ ok: true, message: `Connexion IMAP réussie — ${total} email(s) dans INBOX` });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Authentication") || msg.includes("Invalid credentials") || msg.includes("AUTHENTICATIONFAILED")) {
          return NextResponse.json({ ok: false, error: "Mot de passe d'application incorrect ou IMAP désactivé dans Gmail." });
        }
        return NextResponse.json({ ok: false, error: `Erreur de connexion : ${msg}` });
      }
    }

    return NextResponse.json({ ok: false, error: "Service non supporté." });

  } catch {
    return NextResponse.json({ ok: false, error: "Erreur serveur." }, { status: 500 });
  }
}
