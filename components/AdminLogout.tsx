"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLogout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/admin/otp/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <button onClick={logout} disabled={loading} className="btn btn-sm btn-danger" style={{ width: "100%" }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      {loading ? "..." : "Verrouiller"}
    </button>
  );
}
