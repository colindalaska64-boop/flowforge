import { NextRequest, NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/adminAuth";
import pool from "@/lib/db";
import { logAdminAction } from "@/lib/adminAudit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Double facteur : session admin + code OTP validé.
    const admin = await getAdminOrNull();
    if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    }

    const { plan } = await req.json();

    const validPlans = ["free", "starter", "pro", "business"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
    }

    const userRes = await pool.query("SELECT email, plan FROM users WHERE id = $1", [id]);
    const oldPlan = userRes.rows[0]?.plan || "?";

    await pool.query(
      "UPDATE users SET plan = $1 WHERE id = $2",
      [plan, id]
    );

    await logAdminAction(
      admin,
      "change_plan",
      id,
      `Utilisateur ${userRes.rows[0]?.email} : ${oldPlan} → ${plan}`
    );

    return NextResponse.json({ message: "Plan mis à jour !" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}