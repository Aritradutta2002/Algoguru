import type { ContentSection, Diagram } from "./recursionContent";

/**
 * Attaches diagrams to content sections by their `id`.
 *
 * Every diagram is authored in a dedicated `*Visualizations.ts` map and rendered
 * by the shared `DiagramRenderer` component (layers / hierarchy / flow /
 * table-visual / graph), so the visual style stays identical everywhere.
 *
 * Sections that already declare their own `diagram` are left untouched, which
 * makes this safe to use on content files that are partially covered.
 *
 * Usage:
 * ```ts
 * export const springBootRestContent: ContentSection[] = attachDiagrams(
 *   [ /* ...sections... *\/ ],
 *   springBootRestVisualizations,
 * );
 * ```
 */
export function attachDiagrams(
  sections: ContentSection[],
  diagrams: Record<string, Diagram>,
): ContentSection[] {
  return sections.map((section) =>
    section.diagram || !diagrams[section.id]
      ? section
      : { ...section, diagram: diagrams[section.id] },
  );
}
