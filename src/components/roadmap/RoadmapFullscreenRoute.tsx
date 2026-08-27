import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RoadmapFullscreenOverlay } from "./RoadmapFullscreenOverlay";
import type { RoadmapId } from "@/data/roadmaps";

/**
 * Route-level mount of the chrome-free roadmap overlay. Used for deep links
 * (/roadmap, /roadmap/:roadmapId) so users can share/bookmark a specific
 * roadmap view. The component lives outside <AppLayout> so no sidebar, header,
 * or footer is rendered — only the overlay.
 */
export function RoadmapFullscreenRoute() {
  const navigate = useNavigate();
  const { roadmapId } = useParams<{ roadmapId?: string }>();

  // When this route mounts, ensure we're at the top so the canvas is visible.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <RoadmapFullscreenOverlay
      open
      onClose={() => {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate("/", { replace: true });
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
