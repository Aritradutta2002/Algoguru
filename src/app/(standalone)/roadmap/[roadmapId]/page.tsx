import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRoadmap } from "@/data/roadmaps";
import RoadmapRouteView from "@/features/roadmap/RoadmapRouteView";

type RoadmapPageProps = {
  params: Promise<{ roadmapId: string }>;
};

export async function generateMetadata({
  params,
}: RoadmapPageProps): Promise<Metadata> {
  const { roadmapId } = await params;
  const meta = getRoadmap(roadmapId);
  if (!meta) {
    notFound();
  }
  return {
    title: `${meta.title} — AlgoGuru`,
    description: meta.subtitle,
  };
}

export default async function RoadmapDetailPage({
  params,
}: RoadmapPageProps) {
  const { roadmapId } = await params;
  if (!getRoadmap(roadmapId)) {
    notFound();
  }
  return <RoadmapRouteView roadmapId={roadmapId} />;
}
