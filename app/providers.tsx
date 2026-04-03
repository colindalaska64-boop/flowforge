"use client";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { ThemeProvider } from "@/lib/theme";

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") return;
    if (status === "authenticated" && !session?.user) {
      signOut({ callbackUrl: "/login" });
    }
  }, [session, status]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <SessionGuard>{children}</SessionGuard>
      </SessionProvider>
    </ThemeProvider>
  );
}
