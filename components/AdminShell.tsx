import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import AdminLogout from "@/components/AdminLogout";
import AdminNavLinks from "@/components/AdminNavLinks";

/**
 * Coque commune à toutes les pages du panel admin :
 * sidebar de navigation + barre de titre collante + zone de contenu.
 *
 * Utilisable depuis un composant serveur comme depuis un composant client
 * (aucune API serveur n'est utilisée ici).
 */
export default function AdminShell({
  email,
  title,
  subtitle,
  actions,
  bugCount = 0,
  isOwner = false,
  children,
}: {
  email?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  bugCount?: number;
  isOwner?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="admin">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <Link href="/admin" className="admin-brand">
            <LogoMark size={30} />
            <span>
              <span className="admin-brand-name">Loopflo</span>
              <br />
              <span className="admin-brand-sub">Admin</span>
            </span>
          </Link>

          <AdminNavLinks bugCount={bugCount} isOwner={isOwner} />

          <div className="admin-sidebar-foot">
            {email && <span className="admin-account" title={email}>{email}</span>}
            <AdminLogout />
          </div>
        </aside>

        <div className="admin-main">
          <header className="admin-topbar">
            <div style={{ minWidth: 0 }}>
              <h1 className="admin-title">{title}</h1>
              {subtitle && <p className="admin-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="admin-topbar-actions">{actions}</div>}
          </header>

          <div className="admin-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
