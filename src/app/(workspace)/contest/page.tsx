import type { Metadata } from "next";
import { ContestLandingView } from "@/features/contest/ContestLandingView";

export const metadata: Metadata = {
  title: "Contest — AlgoGuru",
  description:
    "Challenge yourself with a randomized MCQ quiz or a timed Java coding contest under exam conditions.",
};

export default function ContestPage() {
  return <ContestLandingView />;
}
