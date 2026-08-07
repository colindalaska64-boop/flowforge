"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TARGET = new Date("2026-08-24T14:00:00+02:00").getTime();

export default function Countdown() {
  const router = useRouter();
  const [diff, setDiff] = useState(TARGET - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const d = TARGET - Date.now();
      setDiff(d);
      if (d <= 0) {
        clearInterval(id);
        router.push("/3d7c1f5e");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [router]);

  const total = Math.max(0, diff);
  const j = Math.floor(total / 86400000);
  const h = Math.floor((total % 86400000) / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#ffffff",
      fontFamily: "monospace",
    }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "clamp(3rem, 10vw, 6rem)", fontWeight: 800, color: "#111", letterSpacing: "-0.04em", margin: 0 }}>
          {pad(j)}j {pad(h)}h {pad(m)}m {pad(s)}s
        </p>
        <p style={{ fontSize: "0.75rem", color: "#aaa", marginTop: "2rem" }}>met toi un rappel :)</p>
      </div>
    </main>
  );
}
