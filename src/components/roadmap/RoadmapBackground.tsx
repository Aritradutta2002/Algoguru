import { Background, BackgroundVariant } from "@xyflow/react";

/**
 * The reference canvas is solid near-black — no grid, no dots.
 * Renders an invisible Background only so React Flow keeps its
 * pane measurement behaviour stable.
 */
export function RoadmapBackground() {
  return (
    <Background
      variant={BackgroundVariant.Dots}
      gap={48}
      size={0.5}
      color="transparent"
      style={{ background: "transparent" }}
    />
  );
}
