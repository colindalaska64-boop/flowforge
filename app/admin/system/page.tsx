export const dynamic = "force-dynamic";

import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { getRecentBugCount } from "@/lib/adminStats";
import SystemSettingsPanel from "./SystemSettings";

export default async function AdminSystemPage() {
  // Garde côté serveur : la page ne se rend pas sans les deux facteurs.
  const adminEmail = await requireAdmin();
  const bugCount = await getRecentBugCount();

  return (
    <AdminShell
      email={adminEmail}
      bugCount={bugCount}
      title="Système"
      subtitle="Maintenance, bannière globale et coupe-circuits par intégration"
      actions={<Link href="/admin" className="btn">Dashboard</Link>}
    >
      <SystemSettingsPanel />
    </AdminShell>
  );
}
