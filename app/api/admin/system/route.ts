import { NextRequest, NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/adminAuth";
import { getSystemSettings, setSystemSetting, SystemSettings } from "@/lib/systemSettings";

// Couper le site ou désactiver une intégration touche tous les utilisateurs :
// réservé au propriétaire.
async function isAdmin(): Promise<boolean> {
  return (await getAdminOrNull("owner")) !== null;
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const settings = await getSystemSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json() as { key: keyof SystemSettings; value: SystemSettings[keyof SystemSettings] };
  if (!body.key) return NextResponse.json({ error: "key manquant" }, { status: 400 });

  await setSystemSetting(body.key, body.value);
  return NextResponse.json({ ok: true });
}
