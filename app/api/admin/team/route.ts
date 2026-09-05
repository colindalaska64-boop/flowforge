import { NextRequest, NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/adminAuth";
import { logAdminAction } from "@/lib/adminAudit";
import { listerEquipe, attribuerRole, revoquerAdmin, ROLES, type AdminRole } from "@/lib/adminTeam";

export const dynamic = "force-dynamic";

/** Toutes les opérations d'équipe sont réservées au propriétaire. */
async function proprietaire() {
  return await getAdminOrNull("owner");
}

export async function GET() {
  const admin = await proprietaire();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  return NextResponse.json({ membres: await listerEquipe() });
}

export async function POST(req: NextRequest) {
  const admin = await proprietaire();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const { email, role } = await req.json().catch(() => ({}));

  if (typeof email !== "string" || typeof role !== "string" || !ROLES.includes(role as AdminRole)) {
    return NextResponse.json({ error: "Adresse ou rôle invalide." }, { status: 400 });
  }

  const res = await attribuerRole(email, role as AdminRole, admin.email);
  if (!res.ok) return NextResponse.json({ error: res.erreur }, { status: 400 });

  await logAdminAction(admin.email, "grant_admin", email, `Rôle « ${role} » attribué à ${email}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await proprietaire();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const { email } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || !email) {
    return NextResponse.json({ error: "Adresse manquante." }, { status: 400 });
  }

  const res = await revoquerAdmin(email);
  if (!res.ok) return NextResponse.json({ error: res.erreur }, { status: 400 });

  await logAdminAction(admin.email, "revoke_admin", email, `Droits d'administration retirés à ${email}`);
  return NextResponse.json({ ok: true });
}
