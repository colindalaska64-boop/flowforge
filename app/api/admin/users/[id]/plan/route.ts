import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Vérification admin
    if (!token) {
      return NextResponse.json({ error: "Non connecté." }, { status: 401 });
    }

    const adminCheck = await pool.query(
      "SELECT is_admin FROM users WHERE email = $1 AND is_admin = true",
      [token.email]
    );

    if (adminCheck.rows.length === 0) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const { plan } = await req.json();

    const validPlans = ["free", "starter", "pro", "business"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
    }

    await pool.query(
      "UPDATE users SET plan = $1 WHERE id = $2",
      [plan, id]
    );

    return NextResponse.json({ message: "Plan mis à jour !" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}