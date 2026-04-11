import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getUserConnectionsByEmail, setUserConnectionsByEmail } from "@/lib/userConnections";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const connections = await getUserConnectionsByEmail(session.user.email);
  return NextResponse.json(connections);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await req.json();
  await setUserConnectionsByEmail(session.user.email, body);

  return NextResponse.json({ ok: true });
}
