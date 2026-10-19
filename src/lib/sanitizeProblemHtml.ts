import DOMPurify from "dompurify";

/**
 * Problem descriptions, hints and editorials are fetched from LeetCode by an
 * edge function, so they are third-party HTML rather than application markup.
 * It reaches the DOM three ways — `dangerouslySetInnerHTML` twice and
 * `rehype-raw` for the editorial — and all three go through this one allowlist
 * so the policy cannot drift between call sites.
 *
 * Images and links are still permitted (descriptions legitimately embed them);
 * DOMPurify filters `javascript:` and other unsafe URL schemes, strips scripts
 * and event handlers, and blocks `iframe`/`object`, which `rehype-raw` would
 * otherwise render as live frames.
 */
export const PROBLEM_HTML_ALLOWED_TAGS = [
  "p", "br", "pre", "code", "strong", "b", "em", "i", "u", "s",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "hr", "a", "img", "sup", "sub", "span", "div",
  "table", "thead", "tbody", "tr", "th", "td", "caption",
] as const;

export const PROBLEM_HTML_ALLOWED_ATTR = [
  "href", "src", "alt", "title", "class", "target", "rel", "width",
  "height", "colspan", "rowspan", "align",
] as const;

/** Only absolute http(s), mailto, site-relative, fragment and dot-relative URLs. */
export const PROBLEM_HTML_ALLOWED_URI_REGEXP = /^(?:https?:|mailto:|\/|#|\.{0,2}\/)/i;

export function sanitizeProblemHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...PROBLEM_HTML_ALLOWED_TAGS],
    ALLOWED_ATTR: [...PROBLEM_HTML_ALLOWED_ATTR],
    ALLOWED_URI_REGEXP: PROBLEM_HTML_ALLOWED_URI_REGEXP,
  });
}
