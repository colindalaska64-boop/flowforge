"use client";
import { useRouter } from "next/navigation";

export default function AdminLogout() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/otp/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <button onClick={logout} style={{ fontSize:".78rem", color:"#F87171", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", padding:".35rem .8rem", borderRadius:"8px", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
      Verrouiller
    </button>
  );
}
