/**
 * Some models emit tool-call syntax as plain text because Guru sends no tool
 * schema upstream. The provider may also swallow the leading `<|tool` token,
 * leaving fragments such as `_call_start|>`. This module turns the known
 * `question` invocation into readable Markdown and removes every other
 * tool/special-token markup.
 *
 * Pure and fence-aware so it can run on every streamed frame as well as on
 * stored history. The displayed text, the copy action and the upstream
 * conversation all read the same sanitised content.
 */

/** Matches only constructs that can start tool markup. */
const CANDIDATE =
  /<\|[^<>\n|]{0,80}\|>|<tool_call\b|(?:<\|)?[a-z_\u2581]*call_start\|>|\[[ \t]*question[ \t]*\(|question[ \t]*\(|\{\s*"name"\s*:/gi;

const CODE_FENCE = /^\s{0,3}(```|~~~)/;
const TOKEN = /<\|[^<>\n|]{0,80}\|>/g;

export function sanitizeGuruReply(
  raw: string,
  options: { streaming?: boolean } = {},
): string {
  if (!raw) return "";

  let result = transformOutsideFences(raw, (gap) => sanitizeProse(gap, options.streaming === true));
  result = result.trimEnd();
  if (!endsInsideFence(result)) {
    result = options.streaming === true ? stripPartialTail(result) : stripDanglingToken(result);
  }
  result = transformOutsideFences(result, tidyGap);
  return result.trim();
}

/* ── Code protection ──────────────────────────────────────────────── */

/**
 * Split on fenced code blocks and run `fn` only on the prose between them.
 * Lines are preserved; unclosed fences keep the rest of the text untouched.
 */
function transformOutsideFences(text: string, fn: (gap: string) => string): string {
  const output: string[] = [];
  let buffer: string[] = [];
  let inFence = false;

  const flush = () => {
    if (!buffer.length) return;
    output.push(fn(buffer.join("\n")));
    buffer = [];
  };

  for (const line of text.split("\n")) {
    if (CODE_FENCE.test(line)) {
      flush();
      output.push(line);
      inFence = !inFence;
    } else if (inFence) {
      output.push(line);
    } else {
      buffer.push(line);
    }
  }

  flush();
  return output.join("\n");
}

function endsInsideFence(text: string): boolean {
  let inFence = false;
  for (const line of text.split("\n")) {
    if (CODE_FENCE.test(line)) inFence = !inFence;
  }
  return inFence;
}

/** Run the scanner on prose, leaving inline code spans untouched. */
function sanitizeProse(text: string, streaming: boolean): string {
  if (!text) return text;

  const inline = /`[^`\n]*`/g;
  let output = "";
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = inline.exec(text))) {
    output += sanitizeSegment(text.slice(last, match.index), streaming);
    output += match[0];
    last = match.index + match[0].length;
  }

  output += sanitizeSegment(text.slice(last), streaming);
  return output;
}

/* ── Scanner ──────────────────────────────────────────────────────── */

function sanitizeSegment(text: string, streaming: boolean, depth = 0): string {
  if (!text) return text;
  if (depth > 4) return text.replace(TOKEN, "");
  if (!/question|call_start\|>|<tool_call|<\|/i.test(text) && !/\{\s*"name"\s*:/i.test(text)) {
    return text;
  }

  const pattern = new RegExp(CANDIDATE.source, "gi");
  let output = "";
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    const index = match.index;
    const marker = match[0];

    /* Special-token blocks: <|tool_call_start|> … <|tool_call_end|> */
    if (marker.startsWith("<|")) {
      const name = tokenName(marker);
      if (isEndToken(name) || !isStartToolToken(name)) {
        output += text.slice(cursor, index);
        cursor = index + marker.length;
        pattern.lastIndex = cursor;
        continue;
      }

      const end = findMarkupEnd(text, index + marker.length);
      output += text.slice(cursor, index);
      if (!end) {
        // The provider may strip the closing token. Salvage a complete call;
        // an incomplete one is dropped by the nested pass.
        output += renderSalvage(text.slice(index + marker.length), streaming, depth);
        cursor = text.length;
        break;
      }
      output += renderPayload(text.slice(index + marker.length, end.index), streaming, depth);
      cursor = end.index + end.length;
      pattern.lastIndex = cursor;
      continue;
    }

    /* XML-style <tool_call> … </tool_call> */
    if (/^<tool_call/i.test(marker)) {
      let contentStart = index + marker.length;
      if (text[contentStart] === ">") contentStart += 1;

      const end = findClosingTag(text, contentStart);
      output += text.slice(cursor, index);
      if (!end) {
        output += renderSalvage(text.slice(contentStart), streaming, depth);
        cursor = text.length;
        break;
      }
      output += renderPayload(text.slice(contentStart, end.index), streaming, depth);
      cursor = end.index + end.length;
      pattern.lastIndex = cursor;
      continue;
    }

    /* Provider-mangled start marker: _call_start|> … call_end|> */
    if (/call_start\|>/i.test(marker)) {
      const end = findMarkupEnd(text, index + marker.length);
      output += text.slice(cursor, index);
      if (!end) {
        output += renderSalvage(text.slice(index + marker.length), streaming, depth);
        cursor = text.length;
        break;
      }
      output += renderPayload(text.slice(index + marker.length, end.index), streaming, depth);
      cursor = end.index + end.length;
      pattern.lastIndex = cursor;
      continue;
    }

    /* Bracketed or bare question(...) call. */
    if (/question/i.test(marker)) {
      const bracket = marker.startsWith("[");
      if (!bracket) {
        const previous = index > 0 ? text[index - 1] : "";
        if (previous && /[\w$.`]/.test(previous)) {
          pattern.lastIndex = index + 1;
          continue;
        }
      }

      const open = index + marker.length - 1;
      const close = readBalanced(text, open, "(", ")");
      output += text.slice(cursor, index);
      if (close === -1) {
        cursor = text.length;
        break;
      }

      const inner = text.slice(open + 1, close).trim();
      const direct = parseJsonValue(inner);
      const args =
        direct && typeof direct === "object" && !Array.isArray(direct)
          ? { values: valuesFromJsonArgs(direct), hadPairs: true }
          : parseArgs(inner);
      const recognised = ["question", "query", "hint"].some((key) => Boolean(args.values[key]));

      let next = close + 1;
      if (bracket) {
        let probe = next;
        while (probe < text.length && /\s/.test(text[probe])) probe += 1;
        if (text[probe] === "]") next = probe + 1;
      }

      if (!recognised) {
        // No quoted arguments at all: ordinary prose, not tool markup.
        if (!args.hadPairs) output += text.slice(index, next);
      } else {
        output += renderQuestion(args.values) ?? "";
      }

      cursor = next;
      pattern.lastIndex = next;
      continue;
    }

    /* Bare JSON call: {"name": "question", "arguments": {...}} */
    const close = readBalanced(text, index, "{", "}");
    if (close === -1) {
      // A truncated JSON object that begins like a tool call is markup.
      output += text.slice(cursor, index);
      cursor = text.length;
      break;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text.slice(index, close + 1));
    } catch {
      output += text.slice(cursor, close + 1);
      cursor = close + 1;
      pattern.lastIndex = cursor;
      continue;
    }

    const call = jsonCall(parsed);
    const wrapped =
      call !== null && index > cursor && text[index - 1] === "[" && text[close + 1] === "]";

    output += text.slice(cursor, wrapped ? index - 1 : index);
    if (call && call.name.toLowerCase() === "question") {
      output += renderQuestion(call.values) ?? "";
    } else if (!call) {
      output += text.slice(index, close + 1);
    }
    // Unknown tool-shaped JSON is dropped rather than rendered raw.
    cursor = close + 1 + (wrapped ? 1 : 0);
    pattern.lastIndex = cursor;
  }

  if (cursor < text.length) output += text.slice(cursor);

  return output
    .replace(TOKEN, "")
    .replace(/<\/?tool_call>/gi, "")
    .replace(/\[TOOL_CALLS\]/gi, "")
    .replace(/[a-z_\u2581]*call_(?:start|end)\|>/gi, "");
}

function renderSalvage(payload: string, streaming: boolean, depth: number): string {
  const rendered = renderPayload(payload, streaming, depth);
  return streaming ? stripPartialTail(rendered) : rendered;
}

function renderPayload(payload: string, streaming: boolean, depth: number): string {
  return sanitizeSegment(payload, streaming, depth + 1);
}

/* ── Marker helpers ───────────────────────────────────────────────── */

function tokenName(token: string): string {
  return token
    .slice(2, -2)
    .toLowerCase()
    .replace(/\u2581/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isEndToken(name: string): boolean {
  return name === "endoftext" || /call.*(?:end|eot)/.test(name) || /(?:end|eot).*call/.test(name);
}

function isStartToolToken(name: string): boolean {
  return (
    /(?:tool|function|calls?).*(?:start|begin)/.test(name) ||
    /(?:start|begin).*(?:tool|call)/.test(name)
  );
}

function findMarkupEnd(
  text: string,
  from: number,
): { index: number; length: number } | null {
  let best: { index: number; length: number } | null = null;

  const tokens = new RegExp(TOKEN.source, "g");
  tokens.lastIndex = from;
  let token: RegExpExecArray | null;
  while ((token = tokens.exec(text))) {
    if (isEndToken(tokenName(token[0]))) {
      best = { index: token.index, length: token[0].length };
      break;
    }
  }

  const mangled = /[a-z_\u2581]*call_end\|>/gi;
  mangled.lastIndex = from;
  const end = mangled.exec(text);
  if (end && (!best || end.index < best.index)) {
    best = { index: end.index, length: end[0].length };
  }

  return best;
}

function findClosingTag(
  text: string,
  from: number,
): { index: number; length: number } | null {
  const closing = /<\/tool_call>/gi;
  closing.lastIndex = from;
  const match = closing.exec(text);
  return match ? { index: match.index, length: match[0].length } : null;
}

/* ── Argument parsing ─────────────────────────────────────────────── */

interface ParsedArgs {
  values: Record<string, string>;
  hadPairs: boolean;
}

/** Find the matching closing bracket, honouring quotes and escapes. */
function readBalanced(text: string, start: number, open: string, close: string): number {
  let depth = 0;
  let quote: string | null = null;
  let escaped = false;

  for (let i = start; i < text.length && i - start <= 8192; i += 1) {
    const char = text[i];

    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }

    if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) return i;
    }

    if (depth > 16) return -1;
  }

  return -1;
}

function readQuoted(text: string, start: number): number {
  const quote = text[start];
  let escaped = false;

  for (let i = start + 1; i < text.length; i += 1) {
    const char = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === quote) return i;
  }

  return -1;
}

/** Split an argument list on top-level commas. */
function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let escaped = false;
  let start = 0;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }

    if (char === "(" || char === "[" || char === "{") depth += 1;
    else if (char === ")" || char === "]" || char === "}") depth = Math.max(0, depth - 1);
    else if (char === "," && depth === 0) {
      parts.push(input.slice(start, i));
      start = i + 1;
    }
  }

  parts.push(input.slice(start));
  return parts;
}

function unescapeValue(value: string): string {
  return value.replace(/\\(n|r|t|'|"|`|\\)/g, (_, escape: string) => {
    if (escape === "n") return "\n";
    if (escape === "r") return "\r";
    if (escape === "t") return "\t";
    return escape;
  });
}

function unquote(raw: string): string {
  const quote = raw[0];
  if (quote !== "'" && quote !== '"' && quote !== "`") return raw;

  const end = readQuoted(raw, 0);
  return unescapeValue(end === -1 ? raw.slice(1) : raw.slice(1, end));
}

function parseJsonValue(raw: string): unknown {
  if (!raw.startsWith("{") && !raw.startsWith("[")) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseArgs(source: string): ParsedArgs {
  const values: Record<string, string> = {};
  let hadPairs = false;

  for (const part of splitTopLevel(source)) {
    const pair = /^\s*([A-Za-z_]\w*)\s*[:=]\s*([\s\S]*)$/.exec(part);
    if (!pair) continue;

    const key = pair[1].toLowerCase();
    const raw = pair[2].trim();
    if (!raw) continue;
    hadPairs = true;

    if (key === "arguments" || key === "parameters" || key === "args") {
      const nested = parseJsonValue(unquote(raw));
      if (nested) Object.assign(values, valuesFromJsonArgs(nested));
      continue;
    }

    values[key] = unquote(raw);
  }

  return { values, hadPairs };
}

function valuesFromJsonArgs(raw: unknown): Record<string, string> {
  if (typeof raw === "string") {
    const parsed = parseJsonValue(raw.trim());
    return parsed ? valuesFromJsonArgs(parsed) : parseArgs(raw).values;
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof value === "string") values[key.toLowerCase()] = value;
      else if (typeof value === "number" || typeof value === "boolean") {
        values[key.toLowerCase()] = String(value);
      }
    }
    return values;
  }

  return {};
}

interface JsonCall {
  name: string;
  values: Record<string, string>;
}

function jsonCall(value: unknown): JsonCall | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const call = jsonCall(item);
      if (call) return call;
    }
    return null;
  }

  if (!value || typeof value !== "object") return null;
  const object = value as Record<string, unknown>;

  if (object.function && typeof object.function === "object") {
    const fn = object.function as Record<string, unknown>;
    if (typeof fn.name === "string") {
      return { name: fn.name, values: valuesFromJsonArgs(fn.arguments ?? fn.parameters) };
    }
  }

  if (typeof object.name === "string") {
    const args = object.arguments ?? object.parameters ?? object.args;
    if (args !== undefined) return { name: object.name, values: valuesFromJsonArgs(args) };
  }

  return null;
}

/* ── Rendering ────────────────────────────────────────────────────── */

function cleanInline(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function cleanBlock(value: string | undefined): string {
  return (value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function renderQuestion(values: Record<string, string>): string | null {
  const question = cleanInline(values.question);
  const query = cleanInline(values.query);
  const hint = cleanBlock(values.hint);

  const parts: string[] = [];
  if (question) parts.push(question);
  if (query && query !== question) parts.push(`**${query}**`);

  if (hint) {
    const lines = hint
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length) {
      parts.push(
        lines
          .map((line, index) => (index === 0 ? `> **Hint:** ${line}` : `> ${line}`))
          .join("\n"),
      );
    }
  }

  return parts.length ? parts.join("\n\n") : null;
}

/* ── Partial-stream cleanup ───────────────────────────────────────── */

/** True when `position` falls inside a single-line `code span`. */
function isInsideInlineCode(text: string, position: number): boolean {
  const lineStart = text.lastIndexOf("\n", Math.max(0, position - 1)) + 1;
  const before = text.slice(lineStart, position);
  return (before.match(/`/g)?.length ?? 0) % 2 === 1;
}

/** Drop a truncated `<|…` token at the very end of the reply. */
function stripDanglingToken(text: string): string {
  const start = text.lastIndexOf("<|");
  if (start >= 0 && !text.slice(start).includes("|>") && !isInsideInlineCode(text, start)) {
    return text.slice(0, start).trimEnd();
  }
  return text;
}

const PARTIAL_MARKERS: Array<[marker: string, minLength: number]> = [
  ["<tool_call>", 6],
  ["[question(", 4],
  ["_call_start|>", 6],
  ["call_start|>", 6],
  ['{"name":', 4],
];

/** Streaming only: hide marker prefixes that have not finished arriving. */
function stripPartialTail(text: string): string {
  const dangling = stripDanglingToken(text);
  if (dangling !== text) return dangling;

  const window = text.slice(-32);
  for (const [marker, minLength] of PARTIAL_MARKERS) {
    const longest = Math.min(marker.length - 1, window.length);
    for (let length = longest; length >= minLength; length -= 1) {
      if (!window.endsWith(marker.slice(0, length))) continue;

      let cut = text.length - length;
      if (marker.includes("call_start")) {
        // Remove a leftover provider prefix such as `tool_`.
        while (cut > 0 && /[a-z_\u2581]/i.test(text[cut - 1])) cut -= 1;
      }
      if (isInsideInlineCode(text, cut)) continue;
      return text.slice(0, cut).trimEnd();
    }
  }

  return text;
}

function tidyGap(text: string): string {
  return text.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");
}
