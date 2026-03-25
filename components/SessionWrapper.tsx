"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    // Si la session est vide mais qu'on était connecté → banni
    if (session === null) {
      signOut({ callbackUrl: "/login" });
    }
  }, [session]);

  return <>{children}</>;
}