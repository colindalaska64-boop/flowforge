"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteUserButton({ userId, userEmail }: { userId: number; userEmail: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Supprimer définitivement le compte de ${userEmail} ? Cette action est irréversible.`)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}/delete`, { method: "POST" });
    if (res.ok) {
      router.push("/admin/users");
    } else {
      alert("Erreur lors de la suppression.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      style={{ fontFamily:"inherit", cursor: loading ? "wait" : "pointer", fontWeight:600, borderRadius:8, padding:".6rem 1.25rem", fontSize:".85rem", border:"none", background:"#7F1D1D", color:"#fff", opacity: loading ? .7 : 1 }}
    >
      {loading ? "Suppression..." : "Supprimer ce compte"}
    </button>
  );
}

export function ApproveUnbanButton({ userId, userEmail }: { userId: number; userEmail: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    // Débannir + supprimer la demande
    await fetch(`/api/admin/users/${userId}/ban`, { method: "POST" });
    await fetch(`/api/admin/unban-requests/${encodeURIComponent(userEmail)}`, { method: "DELETE" }).catch(() => {});
    router.refresh();
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      style={{ fontFamily:"inherit", cursor: loading ? "wait" : "pointer", fontWeight:700, borderRadius:8, padding:".6rem 1.25rem", fontSize:".85rem", border:"none", background:"linear-gradient(135deg,#059669,#10B981)", color:"#fff" }}
    >
      {loading ? "..." : "Approuver (débannir)"}
    </button>
  );
}
