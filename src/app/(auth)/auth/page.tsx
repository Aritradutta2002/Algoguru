import { Suspense } from "react";
import type { Metadata } from "next";
import { AppLoadingScreen } from "@/components/layout/RouteFallback";
import { AuthView } from "@/features/auth/AuthView";

export const metadata: Metadata = {
  title: "Sign in — AlgoGuru",
  description:
    "Sign in or create an AlgoGuru account to track DSA sheets, Guru AI hints, timed coding contests, and system design paths.",
};

export default function AuthPage() {
  return (
    <Suspense fallback={<AppLoadingScreen label="Loading sign in" />}>
      <AuthView />
    </Suspense>
  );
}
