"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteUserButton({ userId, userEmail }: { userId: number; userEmail: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!confirm(`Supprimer définitivement le compte de ${userEmail} ? Cette action est irréversible.`)) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/users/${userId}/delete`, { method: "POST" });
    if (res.ok) {
      router.push("/admin/users");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "La suppression a échoué.");
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={handleDelete} disabled={loading} className="btn btn-danger">
        {loading ? "Suppression…" : "Supprimer le compte"}
      </button>
      {error && <p className="note note-err" style={{ marginTop: ".75rem" }}>{error}</p>}
    </>
  );
}

export function ApproveUnbanButton({ userId, userEmail }: { userId: number; userEmail: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleApprove() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/users/${userId}/ban`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "La réactivation a échoué.");
      setLoading(false);
      return;
    }
    await fetch(`/api/admin/unban-requests/${encodeURIComponent(userEmail)}`, { method: "DELETE" }).catch(() => {});
    router.refresh();
    setLoading(false);
  }

  return (
    <>
      <button onClick={handleApprove} disabled={loading} className="btn btn-ok">
        {loading ? "Traitement…" : "Approuver et débannir"}
      </button>
      {error && <p className="note note-err" style={{ marginTop: ".75rem" }}>{error}</p>}
    </>
  );
}
