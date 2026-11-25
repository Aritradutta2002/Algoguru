"use client";

import dynamic from "next/dynamic";
import { AppLoadingScreen } from "@/components/layout/RouteFallback";

const RoadmapFullscreenRoute = dynamic(
  () =>
    import("@/components/roadmap/RoadmapFullscreenRoute").then(
      (m) => m.RoadmapFullscreenRoute,
    ),
  {
    ssr: false,
    loading: () => <AppLoadingScreen label="Loading roadmap" />,
  },
);

export function RoadmapRouteView({ roadmapId }: { roadmapId?: string }) {
  return <RoadmapFullscreenRoute roadmapId={roadmapId} />;
}

export default RoadmapRouteView;
