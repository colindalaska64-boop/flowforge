export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getSystemSettings } from "@/lib/systemSettings";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([
    getServerSession(),
    getSystemSettings(),
  ]);

  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;

  // Mode maintenance : redirect non-admins to /maintenance
  if (settings.maintenance_mode && !isAdmin) {
    redirect("/maintenance");
  }

  const bannerColors = {
    info:    { bg: "#EEF2FF", border: "#818CF8", text: "#4338CA" },
    warning: { bg: "#FFFBEB", border: "#F59E0B", text: "#92400E" },
    error:   { bg: "#FEF2F2", border: "#F87171", text: "#991B1B" },
  };
  const bc = bannerColors[settings.global_banner_type] ?? bannerColors.info;

  return (
    <>
      {settings.global_banner_enabled && settings.global_banner_text && (
        <div style={{
          background: bc.bg,
          borderBottom: `1px solid ${bc.border}`,
          padding: ".65rem 1.5rem",
          textAlign: "center",
          fontSize: ".82rem",
          fontWeight: 600,
          color: bc.text,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          {settings.global_banner_text}
        </div>
      )}
      {children}
    </>
  );
}
