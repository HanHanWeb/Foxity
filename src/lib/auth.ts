"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  user_id: string;
  name: string;
  email: string;
}

export function useAuth(requireAuth: boolean = true) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          if (!aborted) {
            setUser(null);
            if (requireAuth) router.push("/auth");
          }
          return;
        }
        const data = await res.json();
        if (!aborted) setUser(data);
      } catch {
        if (!aborted) {
          setUser(null);
          if (requireAuth) router.push("/auth");
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [router, requireAuth]);

  return { user, loading };
}
