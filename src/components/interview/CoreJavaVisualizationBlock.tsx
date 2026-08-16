import { memo } from "react";
import { DiagramRenderer } from "@/components/DiagramRenderer";
import { coreJavaVisualizations } from "@/data/coreJavaVisualizations";

interface CoreJavaVisualizationBlockProps {
  questionId: string;
}

/**
 * Renders the scoped visualization for a question when one exists.
 * Falls back to null for simple definition questions.
 */
export const CoreJavaVisualizationBlock = memo(function CoreJavaVisualizationBlock({
  questionId,
}: CoreJavaVisualizationBlockProps) {
  const diagram = coreJavaVisualizations[questionId];
  if (!diagram) return null;

  return (
    <section aria-label={`Visualization: ${diagram.title}`} className="cjd-viz-section">
      <DiagramRenderer diagram={diagram} />
    </section>
  );
});

export function hasCoreJavaVisualization(questionId: string): boolean {
  return questionId in coreJavaVisualizations;
}
