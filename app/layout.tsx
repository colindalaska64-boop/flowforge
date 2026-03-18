import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "LoopFlo — Automatisez tout, sans coder",
  description: "Connectez vos applications via un éditeur visuel. L'IA génère vos workflows automatiquement.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={jakarta.className}>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}