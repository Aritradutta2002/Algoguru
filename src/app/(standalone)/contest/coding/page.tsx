import { Suspense } from "react";
import type { Metadata } from "next";
import { AppLoadingScreen } from "@/components/layout/RouteFallback";
import { CodingContestInstructionsView } from "@/features/contest/CodingContestInstructionsView";

export const metadata: Metadata = {
  title: "Java Coding Contest Instructions — AlgoGuru",
  description:
    "Review rules, time limits, and fullscreen requirements before starting your timed Java coding contest.",
};

export default function CodingContestInstructionsPage() {
  return (
    <Suspense fallback={<AppLoadingScreen label="Loading contest instructions" />}>
      <CodingContestInstructionsView />
    </Suspense>
  );
}
