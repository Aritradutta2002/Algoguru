"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RoadmapFullscreenOverlay } from "./RoadmapFullscreenOverlay";
import type { RoadmapId } from "@/data/roadmaps";

/**
 * Route-level mount of the chrome-free roadmap overlay. Used for deep links
 * (/roadmap, /roadmap/:roadmapId) so users can share/bookmark a specific
 * roadmap view. The component lives outside <WorkspaceShell> so no sidebar, header,
 * or footer is rendered — only the overlay.
 */
export function RoadmapFullscreenRoute({
  roadmapId: roadmapIdProp,
}: {
  roadmapId?: string;
} = {}) {
  const router = useRouter();
  const params = useParams<{ roadmapId?: string }>();
  const rawParam = params?.roadmapId;
  const roadmapId =
    roadmapIdProp ?? (Array.isArray(rawParam) ? rawParam[0] : rawParam);

  // When this route mounts, ensure we're at the top so the canvas is visible.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <RoadmapFullscreenOverlay
      open
      onClose={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.replace("/");
        }
      }}
      initialRoadmapId={
        roadmapId === "java" ||
        roadmapId === "dsa" ||
        roadmapId === "system-design"
          ? (roadmapId as RoadmapId)
          : undefined
      }
    />
  );
}
