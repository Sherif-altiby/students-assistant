"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { restoreSession } from "@/lib/auth";

/**
 * Runs once when the app mounts in the browser. Because the access token
 * only lives in memory, a hard refresh wipes it — this silently exchanges
 * the httpOnly refreshToken cookie for a new access token and re-hydrates
 * the user, so the person stays logged in across reloads.
 *
 * NOTE on cross-origin backends: if the API lives on a different domain
 * than this app, the browser (not Next's edge middleware) is what carries
 * the refreshToken cookie, so this client-side bootstrap is the source of
 * truth for auth state — middleware.ts is a best-effort fast path only.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);

  useEffect(() => {
    let cancelled = false;

    restoreSession().then((result) => {
      if (cancelled) return;
      if (result) {
        setSession(result.user, result.accessToken);
      }
      setBootstrapping(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
