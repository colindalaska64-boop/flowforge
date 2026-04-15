export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";

async function getMaintenance(): Promise<{ active: boolean; message: string; eta: string }> {
  try {
    const res = await pool.query(
      "SELECT key, value FROM system_settings WHERE key IN ('maintenance_mode','maintenance_message','maintenance_eta')"
    );
    let active = false;
    let message = "";
    let eta = "";
    for (const row of res.rows) {
      if (row.key === "maintenance_mode") active = row.value === true;
      if (row.key === "maintenance_message") message = String(row.value ?? "");
      if (row.key === "maintenance_eta") eta = String(row.value ?? "");
    }
    return { active, message, eta };
  } catch {
    return { active: false, message: "", eta: "" };
  }
}

async function getBanner(): Promise<{ enabled: boolean; text: string; type: "info" | "warning" | "error" }> {
  try {
    const res = await pool.query(
      "SELECT key, value FROM system_settings WHERE key IN ('global_banner_enabled','global_banner_text','global_banner_type')"
    );
    let enabled = false;
    let text = "";
    let type: "info" | "warning" | "error" = "info";
    for (const row of res.rows) {
      if (row.key === "global_banner_enabled") enabled = row.value === true;
      if (row.key === "global_banner_text") text = String(row.value ?? "");
      if (row.key === "global_banner_type") type = row.value as "info" | "warning" | "error";
    }
    return { enabled, text, type };
  } catch {
    return { enabled: false, text: "", type: "info" };
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, maintenance, banner] = await Promise.all([
    getServerSession(),
    getMaintenance(),
    getBanner(),
  ]);

  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;

  // Mode maintenance : redirect non-admins vers /maintenance
  if (maintenance.active && !isAdmin) {
    redirect("/maintenance");
  }

  const bannerColors = {
    info:    { bg: "#EEF2FF", border: "#818CF8", text: "#4338CA" },
    warning: { bg: "#FFFBEB", border: "#F59E0B", text: "#92400E" },
    error:   { bg: "#FEF2F2", border: "#F87171", text: "#991B1B" },
  };
  const bc = bannerColors[banner.type] ?? bannerColors.info;

  return (
    <>
      {banner.enabled && banner.text && (
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
          {banner.text}
        </div>
      )}
      {children}
    </>
  );
}
