"use client";

import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Dashboard",        href: "/admin",                  icon: "⚡" },
  { label: "Utilisateurs",     href: "/admin/users",            icon: "👥" },
  { label: "Exécutions",       href: "/admin/executions",       icon: "▶️" },
  { label: "Bug Reports",      href: "/admin/bug-reports",      icon: "🐛" },
  { label: "Feature Requests", href: "/admin/feature-requests", icon: "💡" },
  { label: "Waitlist",         href: "/admin/waitlist",         icon: "📋" },
  { label: "Demo",             href: "/admin/demo",             icon: "🎯" },
  { label: "Logo anim",        href: "/admin/logo-animation",   icon: "🎬" },
  { label: "Mascotte",         href: "/admin/mascot",           icon: "🤖" },
  { label: "Système",          href: "/admin/system",           icon: "⚙️" },
];

export default function AdminNavLinks() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
        return (
          <a
            key={item.label}
            href={item.href}
            style={{
              display: "flex", alignItems: "center", gap: ".4rem",
              padding: "1rem .85rem",
              fontSize: ".8rem",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
              textDecoration: "none",
              borderBottom: isActive ? "2px solid #818CF8" : "2px solid transparent",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: ".85rem" }}>{item.icon}</span>
            {item.label}
          </a>
        );
      })}
    </>
  );
}
