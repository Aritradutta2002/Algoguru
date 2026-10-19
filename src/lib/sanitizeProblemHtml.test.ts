import { describe, it, expect } from "vitest";
import { sanitizeProblemHtml } from "@/lib/sanitizeProblemHtml";

/**
 * These tests guard the three sinks in `ProblemSolver.tsx` that render
 * third-party HTML fetched from LeetCode: the description and hints through
 * `dangerouslySetInnerHTML`, and the editorial through `rehype-raw`.
 *
 * The sanitizer is the only thing standing between that HTML and the DOM, so
 * each payload below is one that would execute or fetch off-origin if the
 * allowlist were loosened or the wrapper were dropped.
 */

/** True when the output would run script, load an off-origin frame, or keep a live event handler. */
function hasExecutableMarkup(html: string): boolean {
  const host = document.createElement("div");
  host.innerHTML = html;
  if (host.querySelector("script, iframe, object, embed, form")) return true;
  return Array.from(host.querySelectorAll("*")).some((el) =>
    Array.from(el.attributes).some(
      (a) => a.name.startsWith("on") || /^\s*javascript:/i.test(a.value) || /^\s*data:text\/html/i.test(a.value),
    ),
  );
}

const XSS_PAYLOADS = [
  '<img src=x onerror="alert(1)">',
  '<script>alert(2)</script>',
  '<a href="javascript:alert(3)">click</a>',
  '<iframe src="https://evil.example"></iframe>',
  '<object data="https://evil.example/x.swf"></object>',
  "<svg><animate onbegin=alert(4) attributeName=x dur=1s>",
  '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>',
  '<p style="background:url(javascript:alert(5))">x</p>',
  '<div onmouseover="alert(6)">hover</div>',
  '<math><mtext><table><mglyph><style><img src=x onerror=alert(7)>',
];

describe("sanitizeProblemHtml", () => {
  it.each(XSS_PAYLOADS)("neutralises %s", (payload) => {
    expect(hasExecutableMarkup(sanitizeProblemHtml(payload))).toBe(false);
  });

  it("returns an empty string for empty input", () => {
    expect(sanitizeProblemHtml("")).toBe("");
    expect(sanitizeProblemHtml(null)).toBe("");
    expect(sanitizeProblemHtml(undefined)).toBe("");
  });

  it("keeps the formatting a problem description relies on", () => {
    const html = "<p>Given <strong>two</strong> <code>nums</code>, return <em>the sum</em>.</p>";
    const out = sanitizeProblemHtml(html);
    expect(out).toContain("<strong>two</strong>");
    expect(out).toContain("<code>nums</code>");
    expect(out).toContain("<em>the sum</em>");
  });

  it("keeps tables, lists and blockquotes used by editorials", () => {
    const html =
      "<blockquote><p>note</p></blockquote><ul><li>a</li></ul>" +
      "<table><thead><tr><th>k</th></tr></thead><tbody><tr><td>v</td></tr></tbody></table>";
    const out = sanitizeProblemHtml(html);
    expect(out).toContain("<blockquote>");
    expect(out).toContain("<li>a</li>");
    expect(out).toContain("<th>k</th>");
    expect(out).toContain("<td>v</td>");
  });

  // The allowlist regex must not strip the images and links LeetCode actually emits.
  it.each([
    "https://assets.leetcode.com/uploads/2021/01/01/example.jpg",
    "http://example.com/diagram.png",
    "/uploads/local.png",
    "./relative.png",
    "../up.png",
    "#section",
  ])("preserves legitimate image src %s", (src) => {
    const out = sanitizeProblemHtml(`<img src="${src}" alt="diagram">`);
    expect(out).toContain(`src="${src}"`);
    expect(out).toContain('alt="diagram"');
  });

  it.each([
    "https://leetcode.com/problems/two-sum/",
    "mailto:support@example.com",
    "/interview/java",
    "#approach",
  ])("preserves legitimate link href %s", (href) => {
    expect(sanitizeProblemHtml(`<a href="${href}">link</a>`)).toContain(`href="${href}"`);
  });

  it("does not preserve in-page anchors that could be abused as script URLs", () => {
    expect(sanitizeProblemHtml('<a href="javascript:void(0)">x</a>')).not.toMatch(/javascript:/i);
  });
});
