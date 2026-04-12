import AdminLogout from "@/components/AdminLogout";
import AdminNavLinks from "@/components/AdminNavLinks";

export default function AdminNav({ email }: { email?: string }) {
  return (
    <nav style={{
      background: "rgba(15,10,40,0.97)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(129,140,248,0.2)",
      padding: "0 2rem",
      display: "flex",
      alignItems: "stretch",
      justifyContent: "space-between",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo + links */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center",
          paddingRight: "1.5rem", marginRight: ".5rem",
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}>
          <span style={{ fontWeight: 900, fontSize: "1.15rem", color: "#fff", letterSpacing: "-0.03em" }}>
            Loop<span style={{ color: "#818CF8" }}>flo</span>
          </span>
          <span style={{
            marginLeft: ".5rem", fontSize: ".6rem", fontWeight: 800,
            color: "#818CF8", background: "rgba(129,140,248,0.2)",
            border: "1px solid rgba(129,140,248,0.4)",
            padding: ".2rem .55rem", borderRadius: "100px",
            letterSpacing: ".1em", textTransform: "uppercase",
          }}>Admin</span>
        </div>

        {/* Nav links (client component pour usePathname) */}
        <AdminNavLinks />
      </div>

      {/* Right: email + logout */}
      <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
        {email && (
          <span style={{
            fontSize: ".75rem", color: "rgba(255,255,255,0.35)",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: ".3rem .75rem", borderRadius: 100,
          }}>
            {email}
          </span>
        )}
        <AdminLogout />
      </div>
    </nav>
  );
}
