"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

/* Icônes SVG 16px — trait uniforme, pas d'emoji. */
const I = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  executions: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  ),
  bug: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="6" width="8" height="14" rx="4" /><path d="M12 20v-9" />
      <path d="M8 10 4 8" /><path d="M8 15H3" /><path d="m8 19-4 2" />
      <path d="m16 10 4-2" /><path d="M16 15h5" /><path d="m16 19 4 2" />
      <path d="m9 6 1.5-3h3L15 6" />
    </svg>
  ),
  idea: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" /><path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  ),
  templates: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
    </svg>
  ),
  system: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  film: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 4v16" /><path d="M17 4v16" />
      <path d="M2 12h20" /><path d="M2 8h5" /><path d="M2 16h5" /><path d="M17 8h5" /><path d="M17 16h5" />
    </svg>
  ),
  sparkles: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4" /><path d="M12 17v4" /><path d="M3 12h4" /><path d="M17 12h4" />
      <path d="m5.6 5.6 2.8 2.8" /><path d="m15.6 15.6 2.8 2.8" />
      <path d="m18.4 5.6-2.8 2.8" /><path d="m8.4 15.6-2.8 2.8" />
    </svg>
  ),
  bot: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 8V4" /><circle cx="12" cy="3" r="1" />
      <path d="M9 13h.01" /><path d="M15 13h.01" /><path d="M9.5 17h5" />
    </svg>
  ),
  site: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v4" /><path d="m10 14 11-11" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </svg>
  ),
};

type NavItem = { label: string; href: string; icon: React.ReactNode; badgeKey?: "bugs" };

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Pilotage",
    items: [
      { label: "Dashboard", href: "/admin", icon: I.dashboard },
      { label: "Utilisateurs", href: "/admin/users", icon: I.users },
      { label: "Exécutions", href: "/admin/executions", icon: I.executions },
    ],
  },
  {
    title: "Retours",
    items: [
      { label: "Bug reports", href: "/admin/bug-reports", icon: I.bug, badgeKey: "bugs" },
      { label: "Demandes de features", href: "/admin/feature-requests", icon: I.idea },
      { label: "Modération templates", href: "/admin/templates", icon: I.templates },
    ],
  },
  {
    title: "Plateforme",
    items: [
      { label: "Système", href: "/admin/system", icon: I.system },
    ],
  },
  {
    title: "Studio",
    items: [
      { label: "Démo animée", href: "/admin/demo", icon: I.film },
      { label: "Animation logo", href: "/admin/logo-animation", icon: I.sparkles },
      { label: "Mascotte", href: "/admin/mascot", icon: I.bot },
    ],
  },
];

export default function AdminNavLinks({ bugCount = 0 }: { bugCount?: number }) {
  const pathname = usePathname() || "";

  return (
    <nav className="admin-nav">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <p className="admin-nav-group">{group.title}</p>
          {group.items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            const badge = item.badgeKey === "bugs" && bugCount > 0 ? bugCount : null;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon}
                {item.label}
                {badge !== null && <span className="admin-nav-badge">{badge}</span>}
              </Link>
            );
          })}
        </div>
      ))}

      <div style={{ marginTop: "auto" }}>
        <p className="admin-nav-group">Raccourci</p>
        <a href="/dashboard" className="admin-nav-link">
          {I.site}
          Retour à l&apos;app
        </a>
      </div>
    </nav>
  );
}
