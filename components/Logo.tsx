import Link from "next/link";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "1rem", md: "1.2rem", lg: "1.5rem" };
  return (
    <Link href="/" style={{ fontWeight: 800, fontSize: sizes[size], letterSpacing: "-0.03em", color: "#0A0A0A", textDecoration: "none" }}>
      Flow<span style={{ color: "#4F46E5" }}>Forge</span>
    </Link>
  );
}