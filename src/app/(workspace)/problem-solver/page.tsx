import type { Metadata } from "next";
import ProblemSolverView from "@/features/practice/ProblemSolverView";

export const metadata: Metadata = {
  title: "Problem Solver — AlgoGuru",
  description:
    "Solve the LeetCode daily challenge with an integrated Java editor, test runner, editorial, and Guru AI.",
};

export default function ProblemSolverPage() {
  return <ProblemSolverView />;
}
