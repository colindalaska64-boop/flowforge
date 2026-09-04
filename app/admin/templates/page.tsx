export const dynamic = "force-dynamic";

import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { getRecentBugCount } from "@/lib/adminStats";
import TemplatesModeration from "./TemplatesModeration";

export default async function AdminTemplatesPage() {
  const adminEmail = await requireAdmin();
  const bugCount = await getRecentBugCount();

  return (
    <AdminShell
      email={adminEmail}
      bugCount={bugCount}
      title="Modération des templates"
      subtitle="Templates communautaires signalés, publiés ou supprimés"
      actions={<Link href="/admin" className="btn">Dashboard</Link>}
    >
      <TemplatesModeration />
    </AdminShell>
  );
}
