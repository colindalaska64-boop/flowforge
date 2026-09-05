export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/adminAuth";
import Studio from "./Studio";

// Garde serveur : ces pages n'en avaient aucune et reposaient uniquement sur
// le middleware. Depuis l'ouverture du panel à plusieurs rôles, chaque page
// vérifie elle-même l'accès.
export default async function Page() {
  await requireAdmin();
  return <Studio />;
}
