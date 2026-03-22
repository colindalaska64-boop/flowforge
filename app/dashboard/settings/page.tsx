import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const { name, email } = await req.json();

  await pool.query(
    "UPDATE users SET name = $1, email = $2 WHERE email = $3",
    [name, email, session.user?.email]
  );

  return NextResponse.json({ message: "Profil mis à jour !" });
}