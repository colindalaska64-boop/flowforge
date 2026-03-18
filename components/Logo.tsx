import Link from "next/link";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: 28, md: 36, lg: 44 };
  const s = sizes[size];
  const textSize = { sm: "1rem", md: "1.2rem", lg: "1.5rem" };

  return (
    <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:".6rem", textDecoration:"none" }}>
      {/* Icône */}
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="56" height="56" rx="14" fill="#4F46E5"/>
        <path d="M14 28 C14 20 20 14 28 14 C36 14 42 20 42 28" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <path d="M42 28 C42 36 36 42 28 42 C20 42 14 36 14 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 3"/>
        <circle cx="14" cy="28" r="3.5" fill="white"/>
        <circle cx="42" cy="28" r="3.5" fill="#A5B4FC"/>
        <path d="M38 22 L42 28 L46 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      {/* Texte */}
      <span style={{ fontWeight:800, fontSize:textSize[size], letterSpacing:"-0.03em", color:"#0A0A0A" }}>
        Loop<span style={{ color:"#4F46E5" }}>flo</span>
      </span>
    </Link>
  );
}