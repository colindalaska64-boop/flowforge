export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { checkAdminCookie } from "@/lib/adminAuth";
import LoginForm from "./LoginForm";

export default async function AdminLoginPage() {
  const session = await getServerSession();

  // Pas connecté ou pas admin → dashboard
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  // Déjà vérifié → direct sur /admin
  const verified = await checkAdminCookie();
  if (verified) redirect("/admin");

  return <LoginForm email={session.user?.email || ""} />;
}
