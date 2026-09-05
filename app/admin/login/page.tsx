export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { checkAdminCookie } from "@/lib/adminAuth";
import { getAdminRole } from "@/lib/adminTeam";
import LoginForm from "./LoginForm";

export default async function AdminLoginPage() {
  const session = await getServerSession();

  // Pas connecté ou pas admin → dashboard
  const email = session?.user?.email;
  if (!email || !(await getAdminRole(email))) {
    redirect("/dashboard");
  }

  // Déjà vérifié → direct sur /admin
  const verified = await checkAdminCookie(email);
  if (verified) redirect("/admin");

  return <LoginForm email={email} />;
}
