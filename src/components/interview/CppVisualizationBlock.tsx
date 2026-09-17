import { memo } from "react";
import { DiagramRenderer } from "@/components/DiagramRenderer";
import { cppVisualizations } from "@/data/cppVisualizations";

interface CppVisualizationBlockProps {
  questionId: string;
}

/**
 * Renders the scoped visualization for a question when one exists.
 * Falls back to null for simple definition questions.
 */
export const CppVisualizationBlock = memo(function CppVisualizationBlock({
  questionId,
}: CppVisualizationBlockProps) {
  const diagram = cppVisualizations[questionId];
  if (!diagram) return null;

  return (
    <section aria-label={`Visualization: ${diagram.title}`} className="cjd-viz-section">
      <DiagramRenderer diagram={diagram} />
    </section>
  );
});

export function hasCppVisualization(questionId: string): boolean {
  return questionId in cppVisualizations;
}

