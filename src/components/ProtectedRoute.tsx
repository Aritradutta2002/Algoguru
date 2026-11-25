"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppLoadingScreen } from "@/components/layout/RouteFallback";
import { useAuth } from "@/contexts/AuthContext";
import { isPublicRoute } from "@/lib/publicRoutes";

/**
 * Client-side fallback gate for authenticated routes (in addition to `src/proxy.ts`
 * and Server Component DAL checks).
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = isPublicRoute(pathname ?? "/");

  useEffect(() => {
    if (!isPublic && !loading && !session) {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const target = `${pathname || "/"}${search}`;
      router.replace(`/auth?redirect=${encodeURIComponent(target)}`);
    }
  }, [isPublic, loading, session, pathname, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (loading || !session) {
    return <AppLoadingScreen label="Restoring your session" />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
