"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildQuizRedirectHref } from "@/components/contest/ContestRoutes";

/**
 * Client-side fallback redirect for the legacy `/quiz` route.
 *
 * Server-side redirects happen in `src/app/(standalone)/quiz/page.tsx` via
 * Next.js `redirect(buildQuizRedirectHref(searchParams))`. This component
 * preserves query parameters (`language`, `difficulty`, etc.) if rendered inside
 * a client boundary.
 */
export function QuizLegacyRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const target = buildQuizRedirectHref(searchParams);

  useEffect(() => {
    router.replace(target);
  }, [router, target]);

  return null;
}

export default QuizLegacyRedirect;
