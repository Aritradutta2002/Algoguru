import { useParams } from "react-router-dom";
import { getRoadmap } from "@/data/roadmaps";
import { ROADMAP_DATA } from "@/data/roadmapDataIndex";
import { RoadmapEngine } from "@/components/roadmap/RoadmapEngine";
import NotFound from "./NotFound";

/**
 * /roadmap/:roadmapId — renders the NeetCode-style dependency graph for the
 * requested roadmap. Thin wrapper that resolves the URL param into a graph
 * `Roadmap` definition and hands it to the reusable `RoadmapEngine`.
 */
export default function RoadmapPage() {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const meta = getRoadmap(roadmapId);
  const graph = roadmapId ? ROADMAP_DATA[roadmapId as keyof typeof ROADMAP_DATA] : undefined;

  if (!meta || !graph) return <NotFound />;

  return <RoadmapEngine roadmap={graph} />;
}
