/**
 * Regression tests for the sanitisation boundaries hardened during the
 * Semgrep security pass.
 *
 * Each case feeds a hostile payload through a function whose output is later
 * handed to `dangerouslySetInnerHTML` / `innerHTML`. The assertions check the
 * dangerous construct is gone, not merely that the string changed, so a future
 * refactor that drops the sanitiser fails here.
 */
import { describe, expect, it } from "vitest";
import { renderNoteMarkdown } from "./renderNoteMarkdown";
import { stripHtml } from "./guruContext";

const XSS_PAYLOADS = [
  `<img src=x onerror="alert(1)">`,
  `<script>alert(1)</script>`,
  `<a href="javascript:alert(1)">click</a>`,
  `<svg onload="alert(1)"></svg>`,
  `<div onmouseover="alert(1)">hover</div>`,
  `<iframe src="https://evil.example"></iframe>`,
  `<a href="javascript&colon;alert(1)">encoded</a>`,
];

/** True when the markup contains anything that executes in a browser. */
function hasExecutableMarkup(html: string): boolean {
  const probe = document.createElement("div");
  probe.innerHTML = html;
  if (probe.querySelector("script, iframe, object, embed, svg, img")) return true;
  const nodes = probe.querySelectorAll("*");
  for (const node of Array.from(nodes)) {
    for (const attr of Array.from(node.attributes)) {
      if (attr.name.startsWith("on")) return true;
      if (/^\s*(javascript|data:text\/html|vbscript):/i.test(attr.value)) return true;
    }
  }
  return false;
}

describe("renderNoteMarkdown", () => {
  it("still renders the supported markdown subset", () => {
    const html = renderNoteMarkdown("# Title\n- item\n**bold** and *italic* and `code`");

    expect(html).toContain("note-heading");
    expect(html).toContain("note-list-item");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain('<code class="note-code">code</code>');
  });

  it.each(XSS_PAYLOADS)("neutralises %s", (payload) => {
    const html = renderNoteMarkdown(payload);

    expect(hasExecutableMarkup(html)).toBe(false);
  });

  it("keeps user text visible rather than silently dropping it", () => {
    // Escaped markup must survive as literal text, so notes are not blanked.
    expect(renderNoteMarkdown("a < b")).toContain("&lt;");
  });
});

describe("stripHtml", () => {
  it("extracts readable text from problem HTML", () => {
    const text = stripHtml(
      "<p>Given an array <code>nums</code>, return the <strong>sum</strong>.</p>",
    );

    expect(text).toContain("Given an array");
    expect(text).toContain("sum");
    expect(text).not.toContain("<");
  });

  it.each(XSS_PAYLOADS)("never materialises executable markup from %s", (payload) => {
    const text = stripHtml(payload);

    expect(hasExecutableMarkup(text)).toBe(false);
  });
});
