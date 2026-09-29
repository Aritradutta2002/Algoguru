import { memo } from "react";
import type { ReactNode } from "react";

/**
 * Renders the answer dialect documented in
 * `src/data/coreJavaQuestions/contract.ts`:
 *
 *   **bold**   `code`   - bullet   1. numbered   short line ending in ":"
 *
 * The output is a plain documentation column — paragraphs, a dotted-ruled
 * sub-heading, bullets and an ordered list — styled entirely by the
 * `cjq-ans*` classes so day and night mode share one set of rules.
 */

/** Strip a trailing `:` or `#` markers from a heading line. */
function cleanHeading(raw: string): string {
  return raw
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[-*]\s+/, "")
    .replace(/:$/, "")
    .replace(/\*\*/g, "")
    .trim();
}

/** Parse inline **bold** and `code` tokens. */
export function parseInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let k = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={k++} className="cjq-ans-strong">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <code key={k++} className="cjq-ans-c">
          {token.slice(1, -1)}
        </code>
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  if (parts.length === 0) return text;
  if (parts.length === 1 && typeof parts[0] === "string") return parts[0];
  return <>{parts}</>;
}

const BULLET_RE = /^\s*[-*•]\s+/;
const NUMBERED_RE = /^\s*(\d+)[.)]\s+/;

/**
 * A single line is only a sub-heading when it says so explicitly. The
 * previous heuristic ("short line without a full stop") turned ordinary
 * opening sentences into headings, which is what made answers read badly.
 */
function isHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^#{1,6}\s+/.test(trimmed)) return true;
  // "Why it matters:" / "**Key point:**" style lead-ins.
  if (trimmed.length <= 80 && trimmed.endsWith(":")) return true;
  if (/^\*\*[^*]{1,60}:\*\*$/.test(trimmed)) return true;
  return false;
}

function renderTheoryContent(answer: string): ReactNode {
  if (!answer) return null;
  const sections = answer.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="cjq-ans">
      {sections.map((section, idx) => {
        const lines = section.split("\n").filter((l) => l.trim().length > 0);
        if (lines.length === 0) return null;

        if (isHeadingLine(lines[0]) && (lines.length === 1 || lines.slice(1).every((l) => BULLET_RE.test(l)))) {
          return (
            <h4 key={idx} className="cjq-ans-h">
              {cleanHeading(lines[0])}
            </h4>
          );
        }

        if (lines.every((l) => BULLET_RE.test(l))) {
          return (
            <ul key={idx} className="cjq-ans-ul">
              {lines.map((l, i) => (
                <li key={i} className="cjq-ans-li">
                  {parseInline(l.replace(BULLET_RE, ""))}
                </li>
              ))}
            </ul>
          );
        }

        if (lines.every((l) => NUMBERED_RE.test(l))) {
          return (
            <ol key={idx} className="cjq-ans-ol">
              {lines.map((l, i) => (
                <li key={i} className="cjq-ans-li">
                  {parseInline(l.replace(NUMBERED_RE, ""))}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <div key={idx}>
            {lines.map((l, i) => (
              <p key={i} className="cjq-ans-p">
                {parseInline(BULLET_RE.test(l) ? l.replace(BULLET_RE, "") : l)}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

interface CoreJavaQuestionAnswerProps {
  answer: string;
  className?: string;
}

/**
 * Shared renderer for Core Java answer content (used by the list page and
 * the detail reader). `BackendAnswer` aliases this component.
 */
export const CoreJavaQuestionAnswer = memo(function CoreJavaQuestionAnswer({
  answer,
  className,
}: CoreJavaQuestionAnswerProps) {
  return <div className={className}>{renderTheoryContent(answer)}</div>;
});
