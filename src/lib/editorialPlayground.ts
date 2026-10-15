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
 * so it can neither be fetched client-side nor embedded. The `leetcode-daily`
 * edge function therefore resolves each playground on the server and rewrites
 * the iframe into a fenced code block before the payload reaches the client.
 *
 * This module holds the pure pieces of that contract so both the edge function
 * and the UI agree on what a "playground iframe" is, and so the logic is unit
 * testable without a Deno runtime.
 *
 * The edge function keeps a small mirrored copy of `PLAYGROUND_IFRAME_RE`,
 * `extractPlaygroundUuids` and `toFencedCodeBlock` — keep them in sync.
 */

/** Matches a LeetCode playground iframe in editorial markdown. */
export const PLAYGROUND_IFRAME_RE =
  /<iframe[^>]*\bsrc\s*=\s*["']https?:\/\/(?:www\.)?leetcode\.com\/playground\/([A-Za-z0-9_-]+)(?:\/[^"']*)?["'][^>]*>\s*<\/iframe>/gi;

/** True when the string still contains at least one playground iframe. */
export function hasPlaygroundIframe(markdown: string | null | undefined): boolean {
  if (!markdown) return false;
  PLAYGROUND_IFRAME_RE.lastIndex = 0;
  return PLAYGROUND_IFRAME_RE.test(markdown);
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

/** Fence a code sample, picking a fence long enough to survive backticks. */
export function toFencedCodeBlock(code: string, langSlug?: string | null): string {
  const trimmed = code.replace(/\s+$/, "");
  let longestRun = 0;
  for (const run of trimmed.match(/`+/g) || []) {
    if (run.length > longestRun) longestRun = run.length;
  }
  const fence = "`".repeat(Math.max(3, longestRun + 1));
  return `\n\n${fence}${normalizeLanguageSlug(langSlug)}\n${trimmed}\n${fence}\n\n`;
}

export interface PlaygroundSnippet {
  code: string;
  langSlug?: string | null;
}

/**
 * Rewrite every resolvable playground iframe in `markdown` into a fenced code
 * block. `resolve` is called once per unique UUID; returning `null` leaves that
 * iframe untouched so the UI can fall back to an external link.
 */
export async function inlinePlaygroundSnippets(
  markdown: string,
  resolve: (uuid: string) => Promise<PlaygroundSnippet | null>,
): Promise<string> {
  const uuids = extractPlaygroundUuids(markdown);
  if (uuids.length === 0) return markdown;

  const results = await Promise.allSettled(uuids.map((u) => resolve(u)));
  const byUuid = new Map<string, PlaygroundSnippet>();
  results.forEach((r, i) => {
    // Whitespace-only code is as good as missing — treat it as unresolved so
    // the caller keeps its external-link fallback instead of an empty block.
    if (r.status === "fulfilled" && r.value?.code?.trim()) byUuid.set(uuids[i], r.value);
  });
  if (byUuid.size === 0) return markdown;

  const re = new RegExp(PLAYGROUND_IFRAME_RE.source, "gi");
  return markdown.replace(re, (whole: string, uuid: string) => {
    const snippet = byUuid.get(uuid);
    if (!snippet?.code?.trim()) return whole;
    return toFencedCodeBlock(snippet.code, snippet.langSlug);
  });
}
