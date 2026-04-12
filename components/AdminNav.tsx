import AdminLogout from "@/components/AdminLogout";

const LINKS = [
  { label: "Dashboard",     href: "/admin" },
  { label: "Utilisateurs",  href: "/admin/users" },
  { label: "Exécutions",    href: "/admin/executions" },
  { label: "Bug Reports",   href: "/admin/bug-reports" },
  { label: "Waitlist",      href: "/admin/waitlist" },
  { label: "Demo",          href: "/admin/demo" },
];

export default function AdminNav({ email }: { email?: string }) {
  return (
    <nav className="glass-nav" style={{ padding: "1rem 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", letterSpacing: "-0.03em" }}>
          Loop<span style={{ color: "#818CF8" }}>flo</span>
          <span style={{ marginLeft: ".5rem", fontSize: ".65rem", fontWeight: 700, color: "#818CF8", background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)", padding: ".2rem .6rem", borderRadius: "100px", letterSpacing: ".08em", textTransform: "uppercase" }}>Admin</span>
        </div>
        <div style={{ display: "flex", gap: ".25rem" }}>
          {LINKS.map((item) => (
            <a key={item.label} href={item.href} style={{ fontSize: ".82rem", color: "rgba(255,255,255,0.6)", padding: ".4rem .75rem", borderRadius: "8px", fontWeight: 500, textDecoration: "none" }}>
              {item.label}
            </a>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {email && <span style={{ fontSize: ".78rem", color: "rgba(255,255,255,0.4)" }}>{email}</span>}
        <AdminLogout />
      </div>
    </nav>
  );
}
