/**
 * A small, dependency-free Java re-indenter.
 *
 * This is deliberately **not** a full formatter: it recomputes the *leading
 * whitespace* of every line from the code's own block structure — braces,
 * switch labels and open brackets — and trims trailing whitespace. It never
 * re-wraps, joins or rewrites code, so a learner's solution is never silently
 * changed beyond its indentation. It is idempotent: formatting twice is the
 * same as formatting once.
 *
 * Structure inside string literals, char literals, line comments, block
 * comments and text blocks is ignored, so a `{` in a string cannot move the
 * cursor. Text-block bodies are preserved byte for byte because their
 * whitespace is string data.
 *
 * The one deliberate convention is continuation indent: a line that is still
 * inside an unclosed `(`/`[` from an earlier line gets one extra level, the way
 * google-java-format indents wrapped arguments.
 */

export interface JavaFormatOptions {
  /** Spaces per indent level. Defaults to 4, the contest editor's tab size. */
  indentSize?: number;
}

type ScanMode = "code" | "block-comment" | "text-block";

interface ScanState {
  mode: ScanMode;
  brace: number;
  paren: number;
}

/** One extra level for a line that continues an unclosed bracket. */
const CONTINUATION_LEVELS = 1;

function isCaseLabel(trimmed: string): boolean {
  return /^(case\b|default\b)/.test(trimmed);
}

/** A colon-style `case`/`default` label, i.e. one that opens a case body. */
function opensCaseBody(trimmed: string): boolean {
  return isCaseLabel(trimmed) && /:\s*$/.test(trimmed) && !trimmed.includes("->");
}

/**
 * Advance the scan over one line, updating bracket depth and the multi-line
 * mode (block comment / text block). Strings and comments are consumed whole so
 * their contents can never affect the depth.
 */
function scanLine(line: string, state: ScanState): void {
  let index = 0;

  if (state.mode === "block-comment") {
    const end = line.indexOf("*/");
    if (end === -1) return;
    state.mode = "code";
    index = end + 2;
  } else if (state.mode === "text-block") {
    const end = line.indexOf('"""');
    if (end === -1) return;
    state.mode = "code";
    index = end + 3;
  }

  while (index < line.length) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "/" && next === "/") return;

    if (char === "/" && next === "*") {
      const end = line.indexOf("*/", index + 2);
      if (end === -1) {
        state.mode = "block-comment";
        return;
      }
      index = end + 2;
      continue;
    }

    if (char === '"' && next === '"' && line[index + 2] === '"') {
      const end = line.indexOf('"""', index + 3);
      if (end === -1) {
        state.mode = "text-block";
        return;
      }
      index = end + 3;
      continue;
    }

    if (char === '"' || char === "'") {
      index += 1;
      while (index < line.length) {
        if (line[index] === "\\") {
          index += 2;
          continue;
        }
        if (line[index] === char) {
          index += 1;
          break;
        }
        index += 1;
      }
      continue;
    }

    if (char === "{") state.brace += 1;
    else if (char === "}") state.brace = Math.max(0, state.brace - 1);
    else if (char === "(" || char === "[") state.paren += 1;
    else if (char === ")" || char === "]") state.paren = Math.max(0, state.paren - 1);

    index += 1;
  }
}

export function formatJava(source: string, options: JavaFormatOptions = {}): string {
  const indentSize = Math.max(1, Math.floor(options.indentSize ?? 4));
  const unit = " ".repeat(indentSize);
  const normalized = source.replace(/\r\n?/g, "\n");
  if (!normalized.trim()) return normalized;

  const lines = normalized.split("\n");
  const state: ScanState = { mode: "code", brace: 0, paren: 0 };
  const output: string[] = [];

  /** Brace depth *inside* a switch whose case body is currently open. */
  let caseDepth: number | null = null;

  for (const raw of lines) {
    const trimmed = raw.trim();
    const startMode = state.mode;
    const braceBefore = state.brace;
    const parenBefore = state.paren;

    // Text-block bodies are string data: never touch them, not even trailing
    // spaces, and never re-indent them.
    if (startMode === "text-block") {
      output.push(raw);
      scanLine(raw, state);
      continue;
    }

    if (startMode === "block-comment") {
      const base = Math.max(0, braceBefore - (trimmed.startsWith("}") ? 1 : 0));
      const continuation = parenBefore > 0 && !/^[)\]]/.test(trimmed) ? CONTINUATION_LEVELS : 0;
      if (!trimmed) output.push("");
      else output.push(unit.repeat(base + continuation) + (trimmed.startsWith("*") ? ` ${trimmed}` : trimmed));
      scanLine(raw, state);
      continue;
    }

    if (!trimmed) {
      output.push("");
      scanLine(raw, state);
      continue;
    }

    const closesBlock = trimmed.startsWith("}");
    const label = isCaseLabel(trimmed);
    const structural = Math.max(0, braceBefore - (closesBlock && !label ? 1 : 0));

    let level = structural;
    if (caseDepth !== null && !label) {
      // Everything inside an open case body sits one level in — except the
      // brace that closes the switch itself.
      const insideCaseBody = !(closesBlock && braceBefore <= caseDepth);
      if (insideCaseBody) level += 1;
    }
    if (parenBefore > 0 && !/^[)\]]/.test(trimmed)) level += CONTINUATION_LEVELS;

    output.push(unit.repeat(level) + trimmed);
    scanLine(raw, state);

    if (opensCaseBody(trimmed)) caseDepth = braceBefore;
    // Only a brace that takes the depth *below* the switch interior closes the
    // switch; a brace that merely ends a block inside the case body (2 -> 1)
    // must leave the case body open.
    else if (caseDepth !== null && state.brace < caseDepth) caseDepth = null;
  }

  return output.join("\n");
}
