import type { Metadata } from "next";
import RoadmapRouteView from "@/features/roadmap/RoadmapRouteView";

export const metadata: Metadata = {
  title: "Learning Roadmaps — AlgoGuru",
  description:
    "Interactive mind-map learning roadmaps for Data Structures & Algorithms, Core & Advanced Java, and System Design.",
};

export default function RoadmapPage() {
  return <RoadmapRouteView />;
}
