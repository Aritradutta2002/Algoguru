import { describe, expect, it, vi } from "vitest";
import {
  extractPlaygroundUuid,
  extractPlaygroundUuids,
  hasPlaygroundIframe,
  inlinePlaygroundSnippets,
  normalizeLanguageSlug,
  toFencedCodeBlock,
} from "./editorialPlayground";

const IFRAME_A =
  '<iframe src="https://leetcode.com/playground/b3Z45Rq9/shared" frameBorder="0" width="100%" height="327" name="b3Z45Rq9"></iframe>';
const IFRAME_B =
  '<iframe src="https://leetcode.com/playground/ZaDAqWnF/shared" frameBorder="0" width="100%" height="500" name="ZaDAqWnF"></iframe>';

/** A trimmed-down version of the real leakage shape in LeetCode editorials. */
const EDITORIAL = `### Approach 1: Simulation

#### Intuition

Enumerate all contiguous subarrays with two nested loops.

#### Implementation

${IFRAME_A}

#### Complexity Analysis

Time complexity: $O(n^2)$.

### Approach 2: Binary Indexed Tree

#### Intuition

Maintain the distinct count for every left endpoint.

#### Implementation

${IFRAME_B}

#### Complexity Analysis

Time complexity: $O(n \\log n)$.
`;

describe("hasPlaygroundIframe", () => {
  it("detects a playground iframe", () => {
    expect(hasPlaygroundIframe(EDITORIAL)).toBe(true);
  });

  it("is false for prose and fenced code", () => {
    expect(hasPlaygroundIframe("#### Implementation\n\n```java\nint x;\n```")).toBe(false);
  });

  it("is false for nullish input", () => {
    expect(hasPlaygroundIframe(null)).toBe(false);
    expect(hasPlaygroundIframe(undefined)).toBe(false);
    expect(hasPlaygroundIframe("")).toBe(false);
  });

  it("does not leak regex lastIndex between calls", () => {
    // Global regexes carry state; a naive implementation returns false here.
    expect(hasPlaygroundIframe(EDITORIAL)).toBe(true);
    expect(hasPlaygroundIframe(EDITORIAL)).toBe(true);
  });
});

describe("extractPlaygroundUuid", () => {
  it("reads the uuid from a playground src", () => {
    expect(extractPlaygroundUuid("https://leetcode.com/playground/ZaDAqWnF/shared")).toBe(
      "ZaDAqWnF",
    );
  });

  it("returns null for a non-playground src", () => {
    expect(extractPlaygroundUuid("https://www.youtube.com/embed/abc")).toBeNull();
    expect(extractPlaygroundUuid(null)).toBeNull();
  });
});

describe("extractPlaygroundUuids", () => {
  it("extracts uuids in first-seen order", () => {
    expect(extractPlaygroundUuids(EDITORIAL)).toEqual(["b3Z45Rq9", "ZaDAqWnF"]);
  });

  it("dedupes a repeated uuid", () => {
    expect(extractPlaygroundUuids(`${IFRAME_A}\n\ntext\n\n${IFRAME_A}`)).toEqual(["b3Z45Rq9"]);
  });

  it("tolerates attribute order, short src form and no self-closing slash", () => {
    expect(
      extractPlaygroundUuids(
        '<iframe name="x" width="100%" src="https://www.leetcode.com/playground/AbC-12_3/shared"></iframe>',
      ),
    ).toEqual(["AbC-12_3"]);
  });

  it("extracts nothing from a non-playground iframe", () => {
    expect(extractPlaygroundUuids('<iframe src="https://www.youtube.com/embed/xyz"></iframe>')).toEqual(
      [],
    );
  });
});

describe("normalizeLanguageSlug", () => {
  it("maps LeetCode slugs onto highlighter tags", () => {
    expect(normalizeLanguageSlug("cpp")).toBe("cpp");
    expect(normalizeLanguageSlug("C++")).toBe("cpp");
    expect(normalizeLanguageSlug("python3")).toBe("python");
    expect(normalizeLanguageSlug("golang")).toBe("go");
    expect(normalizeLanguageSlug("csharp")).toBe("csharp");
    expect(normalizeLanguageSlug("C#")).toBe("csharp");
  });

  it("passes through unknown slugs and defaults to text", () => {
    expect(normalizeLanguageSlug("brainfuck")).toBe("brainfuck");
    expect(normalizeLanguageSlug("")).toBe("text");
    expect(normalizeLanguageSlug(null)).toBe("text");
  });
});

describe("toFencedCodeBlock", () => {
  it("wraps code in a fence tagged with the language", () => {
    expect(toFencedCodeBlock("int x = 1;", "cpp")).toBe("\n\n```cpp\nint x = 1;\n```\n\n");
  });

  it("uses a longer fence when the code contains backticks", () => {
    const out = toFencedCodeBlock("a = ```triple```", "java");
    expect(out).toContain("````java");
    expect(out).toContain("````\n\n");
  });

  it("strips trailing whitespace so the closing fence stays on its own line", () => {
    expect(toFencedCodeBlock("int x;\n\n\n", "java")).toBe("\n\n```java\nint x;\n```\n\n");
  });
});

describe("inlinePlaygroundSnippets", () => {
  it("rewrites a single iframe into a fenced code block", async () => {
    const out = await inlinePlaygroundSnippets(IFRAME_A, async () => ({
      code: "class Solution {}",
      langSlug: "cpp",
    }));
    expect(out).toContain("```cpp\nclass Solution {}\n```");
    expect(out).not.toContain("<iframe");
  });

  it("rewrites both approaches and preserves surrounding prose verbatim", async () => {
    const codes: Record<string, string> = {
      b3Z45Rq9: "// simulation",
      ZaDAqWnF: "// bit",
    };
    const out = await inlinePlaygroundSnippets(EDITORIAL, async (uuid) => ({
      code: codes[uuid],
      langSlug: uuid === "ZaDAqWnF" ? "java" : "cpp",
    }));

    expect(out).not.toContain("<iframe");
    expect(out).toContain("```cpp\n// simulation\n```");
    expect(out).toContain("```java\n// bit\n```");
    // Prose and headings survive intact.
    expect(out).toContain("### Approach 1: Simulation");
    expect(out).toContain("### Approach 2: Binary Indexed Tree");
    expect(out).toContain("Time complexity: $O(n^2)$.");
    expect(out).toContain("Time complexity: $O(n \\log n)$.");
  });

  it("fetches a duplicated uuid only once", async () => {
    const resolve = vi.fn(async () => ({ code: "once", langSlug: "java" }));
    const out = await inlinePlaygroundSnippets(`${IFRAME_A}\n\n${IFRAME_A}`, resolve);
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(out.match(/once/g)).toHaveLength(2);
  });

  it("leaves the iframe intact when resolution fails", async () => {
    const out = await inlinePlaygroundSnippets(IFRAME_A, async () => null);
    expect(out).toContain("<iframe");
    expect(out).toBe(IFRAME_A);
  });

  it("leaves only the failed iframe when one of two resolves", async () => {
    const out = await inlinePlaygroundSnippets(EDITORIAL, async (uuid) =>
      uuid === "b3Z45Rq9" ? { code: "// ok", langSlug: "cpp" } : null,
    );
    expect(out).toContain("```cpp\n// ok\n```");
    expect(out).toContain("ZaDAqWnF");
    expect(out.match(/<iframe/g)).toHaveLength(1);
  });

  it("survives a rejected resolver promise", async () => {
    const out = await inlinePlaygroundSnippets(IFRAME_A, async () => {
      throw new Error("network down");
    });
    expect(out).toBe(IFRAME_A);
  });

  it("is a no-op for markdown without playgrounds", async () => {
    const prose = "### Approach\n\nJust prose.";
    const resolve = vi.fn(async () => ({ code: "x", langSlug: "java" }));
    expect(await inlinePlaygroundSnippets(prose, resolve)).toBe(prose);
    expect(resolve).not.toHaveBeenCalled();
  });

  it("does not treat an empty code payload as resolved", async () => {
    const out = await inlinePlaygroundSnippets(IFRAME_A, async () => ({
      code: "   ",
      langSlug: "java",
    }));
    expect(out).toBe(IFRAME_A);
  });
});
