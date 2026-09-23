import { memo } from "react";
import type { ReactNode } from "react";

/** Parse inline **bold** and `code` tokens */
export function parseInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\`[^\`]+\`)/g;
  let last = 0,
    k = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={k++} className="font-bold">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(<code key={k++}>{token.slice(1, -1)}</code>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  if (parts.length === 0) return text;
  if (parts.length === 1 && typeof parts[0] === "string") return parts[0];
  return <>{parts}</>;
}

function renderTheoryContent(answer: string): ReactNode {
  if (!answer) return null;
  const sections = answer.split("\n\n").filter(Boolean);
  return (
    <div className="space-y-7 cjq-reading-content">
      {sections.map((section, idx) => {
        const lines = section.split("\n").filter(Boolean);
        const isBullet = lines.every((l) => l.trim().startsWith("- "));
        const isNumbered = lines.every((l) => /^\d+\./.test(l.trim()));
        const isHeading =
          lines.length === 1 &&
          (lines[0].startsWith("##") ||
            (lines[0].endsWith(":") && lines[0].length < 70) ||
            (lines[0].length < 55 && !lines[0].endsWith(".") && !lines[0].startsWith("-")));

        if (isHeading) {
          return (
            <div key={idx} className="flex items-center gap-3 pt-2">
              <span
                className="w-1 h-7 rounded-full shrink-0"
                style={{ background: "hsl(var(--primary))" }}
                aria-hidden="true"
              />
              <h4>{lines[0].replace(/^#{1,3}\s*/, "").replace(/:$/, "")}</h4>
            </div>
          );
        }
        if (isBullet) {
          return (
            <ul key={idx} className="space-y-3.5">
              {lines.map((l, i) => (
                <li key={i} className="flex items-start gap-3.5">
                  <span
                    className="mt-[11px] w-2 h-2 rounded-full shrink-0"
                    style={{ background: "hsl(var(--primary) / 0.65)" }}
                    aria-hidden="true"
                  />
                  <span>{parseInline(l.replace(/^- /, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (isNumbered) {
          return (
            <ol key={idx} className="space-y-4">
              {lines.map((l, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span
                    className="shrink-0 w-6 h-6 rounded-full text-[12px] font-bold flex items-center justify-center mt-[3px]"
                    style={{
                      background: "hsl(var(--primary) / 0.1)",
                      border: "1px solid hsl(var(--primary) / 0.25)",
                      color: "hsl(var(--primary))",
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span>{parseInline(l.replace(/^\d+\.\s*/, ""))}</span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <div key={idx} className="space-y-3">
            {lines.map((l, i) => (
              <p key={i}>{parseInline(l)}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

interface CoreJavaQuestionAnswerProps {
  answer: string;
}

/**
 * Shared renderer for Core Java answer content (used by list page and detail page).
 * Preserves the existing markdown-lite rendering behavior.
 */
export const CoreJavaQuestionAnswer = memo(function CoreJavaQuestionAnswer({
  answer,
}: CoreJavaQuestionAnswerProps) {
  return <>{renderTheoryContent(answer)}</>;
});
