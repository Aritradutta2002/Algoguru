import { Suspense } from "react";
import type { Metadata } from "next";
import { AppLoadingScreen } from "@/components/layout/RouteFallback";
import { QuizView } from "@/features/contest/QuizView";

export const metadata: Metadata = {
  title: "MCQ Quiz — AlgoGuru Contest",
  description:
    "Randomized multiple-choice programming quiz in a strict fullscreen exam environment.",
};

export default function ContestQuizPage() {
  return (
    <Suspense fallback={<AppLoadingScreen label="Loading quiz" />}>
      <QuizView />
    </Suspense>
  );
}
