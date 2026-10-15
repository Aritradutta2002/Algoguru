/**
 * Helpers for turning LeetCode official-editorial markdown into renderable
 * content.
 *
 * Why this exists: LeetCode ships each editorial approach's implementation as a
 * LeetCode *playground* iframe rather than as a fenced code block, e.g.
 *
 *   #### Implementation
 *   <iframe src="https://leetcode.com/playground/ZaDAqWnF/shared" ...></iframe>
 *
 * That URL is unusable from the browser: it answers a non-browser client with
 * HTTP 403 + a Cloudflare challenge and carries `X-Frame-Options: SAMEORIGIN`,
 * so it can neither be fetched client-side nor embedded.
 *
 * Each playground holds the same solution in ~9 languages and the reader should
 * be able to switch between them, so the edge function does not bake one
 * language into a fence. It replaces each iframe with a numbered token and
 * attaches the language sets to `problem.solutionBlocks`:
 *
 *   <!--solution-block:0-->
 *
 * `splitEditorialMarkdown` splits the editorial on those tokens so each one can
 * be rendered as a language-switching code block while the surrounding prose
 * stays intact.
 *
 * This module holds the pure pieces of that contract so the logic is unit
 * testable without a Deno runtime. The edge function keeps a small mirrored copy
 * — keep them in sync.
 */

/** Matches a LeetCode playground iframe in editorial markdown. */
export const PLAYGROUND_IFRAME_RE =
  /<iframe[^>]*\bsrc\s*=\s*["']https?:\/\/(?:www\.)?leetcode\.com\/playground\/([A-Za-z0-9_-]+)(?:\/[^"']*)?["'][^>]*>\s*<\/iframe>/gi;

/** Matches the placeholder the edge function leaves for a resolved block. */
export const SOLUTION_BLOCK_TOKEN_RE = /<!--\s*solution-block:(\d+)\s*-->/g;

/** True when the string still contains at least one playground iframe. */
export function hasPlaygroundIframe(markdown: string | null | undefined): boolean {
  if (!markdown) return false;
  PLAYGROUND_IFRAME_RE.lastIndex = 0;
  return PLAYGROUND_IFRAME_RE.test(markdown);
}

/** True when the markdown contains at least one solution-block token. */
export function hasSolutionBlockToken(markdown: string | null | undefined): boolean {
  if (!markdown) return false;
  SOLUTION_BLOCK_TOKEN_RE.lastIndex = 0;
  return SOLUTION_BLOCK_TOKEN_RE.test(markdown);
}

/** Pull the playground UUID out of a single iframe `src` URL, if it is one. */
export function extractPlaygroundUuid(src: string | null | undefined): string | null {
  if (!src) return null;
  const match = /leetcode\.com\/playground\/([A-Za-z0-9_-]+)/i.exec(src);
  return match ? match[1] : null;
}

/** Unique playground UUIDs referenced by the markdown, in first-seen order. */
export function extractPlaygroundUuids(markdown: string | null | undefined): string[] {
  if (!markdown) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  const re = new RegExp(PLAYGROUND_IFRAME_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out;
}

/**
 * Map a LeetCode language slug onto a language tag the UI's syntax highlighter
 * understands. Unknown slugs pass through lowercased; callers should fall back
 * to a plain-text render when the highlighter does not recognise the result.
 */
export function normalizeLanguageSlug(slug: string | null | undefined): string {
  const s = (slug || "").toLowerCase().trim();
  const map: Record<string, string> = {
    "c++": "cpp",
    cpp: "cpp",
    "c#": "csharp",
    csharp: "csharp",
    cs: "csharp",
    py: "python",
    python3: "python",
    python: "python",
    js: "javascript",
    javascript: "javascript",
    ts: "typescript",
    typescript: "typescript",
    go: "go",
    golang: "go",
    rb: "ruby",
    ruby: "ruby",
    rs: "rust",
    rust: "rust",
    kt: "kotlin",
    kotlin: "kotlin",
    swift: "swift",
    php: "php",
    dart: "dart",
    scala: "scala",
    elixir: "elixir",
    erlang: "erlang",
    racket: "racket",
    mysql: "sql",
    mssql: "sql",
    oraclesql: "sql",
  };
  return map[s] || s || "text";
}

/** Human-readable label for a normalised language slug. */
export function languageLabel(slug: string | null | undefined): string {
  const s = normalizeLanguageSlug(slug);
  const labels: Record<string, string> = {
    cpp: "C++",
    java: "Java",
    c: "C",
    csharp: "C#",
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    go: "Go",
    rust: "Rust",
    ruby: "Ruby",
    kotlin: "Kotlin",
    swift: "Swift",
    php: "PHP",
    dart: "Dart",
    scala: "Scala",
    elixir: "Elixir",
    erlang: "Erlang",
    racket: "Racket",
    sql: "SQL",
  };
  return labels[s] || s.toUpperCase();
}

/**
 * Languages the reader most likely wants, in preference order. Used to pick a
 * default when the source language is unavailable.
 */
export const LANGUAGE_PREFERENCE = [
  "java",
  "cpp",
  "python",
  "javascript",
  "typescript",
  "go",
  "csharp",
  "c",
  "rust",
];

/**
 * Choose which language a block should open on.
 *
 * `preferred` is the reader's current context (the editor language); the
 * author's own selection is only a fallback, because this app is Java-first and
 * a C++-only editorial would otherwise force a manual switch every time.
 */
export function pickDefaultLanguage(
  available: string[],
  preferred?: string | null,
): string | null {
  if (available.length === 0) return null;

  const wanted = preferred ? normalizeLanguageSlug(preferred) : null;
  if (wanted && available.includes(wanted)) return wanted;

  for (const candidate of LANGUAGE_PREFERENCE) {
    if (available.includes(candidate)) return candidate;
  }
  return available[0];
}

/** A resolved editorial implementation block: one solution, many languages. */
export interface SolutionBlock {
  defaultLangSlug: string;
  languages: { langSlug: string; label: string; code: string }[];
}

export type EditorialSegment =
  | { kind: "markdown"; content: string }
  | { kind: "block"; index: number; block: SolutionBlock | null };

/**
 * Split editorial markdown on solution-block tokens.
 *
 * A token whose index has no matching block yields a null block so the caller
 * can render a fallback rather than leaking an unstyled HTML comment into the
 * prose.
 */
export function splitEditorialMarkdown(
  markdown: string,
  blocks?: SolutionBlock[] | null,
): EditorialSegment[] {
  const segments: EditorialSegment[] = [];
  const re = new RegExp(SOLUTION_BLOCK_TOKEN_RE.source, "g");
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(markdown)) !== null) {
    const before = markdown.slice(lastIndex, m.index);
    if (before.trim()) segments.push({ kind: "markdown", content: before });

    const index = Number(m[1]);
    segments.push({ kind: "block", index, block: blocks?.[index] ?? null });
    lastIndex = m.index + m[0].length;
  }

  const rest = markdown.slice(lastIndex);
  if (rest.trim()) segments.push({ kind: "markdown", content: rest });

  // No tokens at all: the whole thing is plain markdown.
  if (segments.length === 0 && markdown.trim()) {
    segments.push({ kind: "markdown", content: markdown });
  }
  return segments;
}
