import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession();

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const formData = await req.formData();
  const plan = formData.get("plan") as string;

  const validPlans = ["free", "starter", "pro", "business"];
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
  }

  await pool.query("UPDATE users SET plan = $1 WHERE id = $2", [plan, id]);

  return NextResponse.redirect(new URL(`/admin/users/${id}`, req.url));
}