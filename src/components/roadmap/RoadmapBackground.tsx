import { Background, BackgroundVariant } from "@xyflow/react";

/**
 * Faint, evenly spaced dot grid (graph-paper / blueprint feel) behind the
 * roadmap. Sits on the dark canvas and tints slightly purple to echo the
 * node accents.
 */
export function RoadmapBackground() {
  return (
    <Background
      variant={BackgroundVariant.Dots}
      gap={25}
      size={1.35}
      color="rgba(133, 133, 142, 0.72)"
    />
  );
}
