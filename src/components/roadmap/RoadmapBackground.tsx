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
      gap={26}
      size={1.4}
      color="hsl(243 75% 65% / 0.14)"
    />
  );
}
