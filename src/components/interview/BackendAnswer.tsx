import { memo } from "react";
import { CoreJavaQuestionAnswer, parseInline } from "@/components/interview/CoreJavaQuestionAnswer";

/**
 * Renderer for the Backend / Spring Boot answer dialect.
 *
 * The markdown-lite dialect described in `src/data/backendInterview/contract.ts`
 * is intentionally identical to the Core Java one, so this is a thin, named
 * alias rather than a second parser to keep in sync.
 */
export const BackendAnswer = memo(function BackendAnswer({ answer }: { answer: string }) {
  return <CoreJavaQuestionAnswer answer={answer} />;
});

export { parseInline };

/** Single-paragraph inline renderer for blurbs, hints and discussion lines. */
export const BackendInline = memo(function BackendInline({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return <span className={className}>{parseInline(text)}</span>;
});
