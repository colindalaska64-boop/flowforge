"use client";
import Logo from "./Logo";
import Button from "./Button";
import { signOut, useSession } from "next-auth/react";

export default function NavApp() {
  const { data: session } = useSession();

  return (
    <nav style={{
      background: "#fff", borderBottom: "1px solid #E5E7EB",
      padding: "1rem 2.5rem", display: "flex",
      alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <Logo />
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Workflows", href: "/dashboard/workflows" },
            { label: "Paramètres", href: "/dashboard/settings" },
          ].map((item) => (
            <a key={item.label} href={item.href} style={{
              fontSize: "0.85rem", color: "#6B7280", textDecoration: "none",
              padding: "0.4rem 0.75rem", borderRadius: "8px", fontWeight: 500,
            }}>
              {item.label}
            </a>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontSize: "0.82rem", color: "#9CA3AF" }}>
          {session?.user?.email}
        </span>
        <div style={{ background: "#EEF2FF", color: "#4F46E5", fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.7rem", borderRadius: "100px", border: "1px solid #C7D2FE" }}>
          FREE
        </div>
        <Button variant="danger" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
          Déconnexion
        </Button>
      </div>
    </nav>
  );
}