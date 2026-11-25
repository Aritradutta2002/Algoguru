import type { Metadata } from "next";
import PracticeView from "@/features/practice/PracticeView";

export const metadata: Metadata = {
  title: "Practice Sheet — AlgoGuru",
  description:
    "Curated DSA problem sheet organized by pattern with progress tracking, notes, and interview editorials.",
};

export default function PracticePage() {
  return <PracticeView />;
}
