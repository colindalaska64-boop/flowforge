import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "bjr",
  robots: { index: false, follow: false },
};

export default function LiptonPage() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#ffffff",
      gap: "1.5rem",
    }}>
      <p style={{ fontFamily: "sans-serif", fontSize: "1rem", color: "#000" }}>bjr</p>
      <Image
        src="/lipton-chat.png"
        alt=""
        width={600}
        height={450}
        style={{ maxWidth: "90vw", height: "auto", display: "block" }}
        priority
      />
    </main>
  );
}
