export const dynamic = "force-dynamic";

import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { getRecentBugCount } from "@/lib/adminStats";
import TeamManager from "./TeamManager";

export default async function AdminTeamPage() {
  // Réservé au propriétaire : requireAdmin renvoie vers /admin si le rôle est
  // insuffisant, la page ne se rend jamais pour un autre administrateur.
  const { email: adminEmail, role } = await requireAdmin("owner");
  const bugCount = await getRecentBugCount();

  return (
    <AdminShell
      email={adminEmail}
      isOwner={role === "owner"}
      bugCount={bugCount}
      title="Équipe"
      subtitle="Qui a accès au panel, avec quels droits"
      actions={<Link href="/admin" className="btn">Dashboard</Link>}
    >
      <TeamManager />
    </AdminShell>
  );
}
