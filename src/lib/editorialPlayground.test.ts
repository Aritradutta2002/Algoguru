import { describe, expect, it } from "vitest";
import {
  extractPlaygroundUuid,
  extractPlaygroundUuids,
  hasPlaygroundIframe,
  hasSolutionBlockToken,
  languageLabel,
  normalizeLanguageSlug,
  pickDefaultLanguage,
  splitEditorialMarkdown,
} from "./editorialPlayground";
import type { SolutionBlock } from "./editorialPlayground";

const IFRAME_A =
  '<iframe src="https://leetcode.com/playground/b3Z45Rq9/shared" frameBorder="0" width="100%" height="327" name="b3Z45Rq9"></iframe>';
const IFRAME_B =
  '<iframe src="https://leetcode.com/playground/ZaDAqWnF/shared" frameBorder="0" width="100%" height="500" name="ZaDAqWnF"></iframe>';

/** The shape the edge function emits once it has resolved the playgrounds. */
const RESOLVED_EDITORIAL = `### Approach 1: Simulation

#### Intuition

Enumerate all contiguous subarrays with two nested loops.

#### Implementation

<!--solution-block:0-->

#### Complexity Analysis

Time complexity: $O(n^2)$.

### Approach 2: Binary Indexed Tree

#### Implementation

<!--solution-block:1-->

#### Complexity Analysis

Time complexity: $O(n \\log n)$.
`;

function block(defaultLangSlug: string, langs: string[]): SolutionBlock {
  return {
    defaultLangSlug,
    languages: langs.map((langSlug) => ({
      langSlug,
      label: languageLabel(langSlug),
      code: `// ${langSlug} solution`,
    })),
  };
}

const BLOCKS: SolutionBlock[] = [
  block("cpp", ["cpp", "java", "python"]),
  block("cpp", ["cpp", "java"]),
];

describe("hasPlaygroundIframe", () => {
  it("detects a playground iframe", () => {
    expect(hasPlaygroundIframe(IFRAME_A)).toBe(true);
  });

  it("is false for prose, fenced code and resolved tokens", () => {
    expect(hasPlaygroundIframe("```java\nint x;\n```")).toBe(false);
    expect(hasPlaygroundIframe(RESOLVED_EDITORIAL)).toBe(false);
  });

  it("is false for nullish input", () => {
    expect(hasPlaygroundIframe(null)).toBe(false);
    expect(hasPlaygroundIframe(undefined)).toBe(false);
    expect(hasPlaygroundIframe("")).toBe(false);
  });

  it("does not leak regex lastIndex between calls", () => {
    expect(hasPlaygroundIframe(IFRAME_A)).toBe(true);
    expect(hasPlaygroundIframe(IFRAME_A)).toBe(true);
  });
});

describe("hasSolutionBlockToken", () => {
  it("detects a resolved token", () => {
    expect(hasSolutionBlockToken(RESOLVED_EDITORIAL)).toBe(true);
  });

  it("tolerates whitespace inside the comment", () => {
    expect(hasSolutionBlockToken("<!-- solution-block:3 -->")).toBe(true);
  });

  it("is false for plain markdown", () => {
    expect(hasSolutionBlockToken("### Approach\n\nJust prose.")).toBe(false);
    expect(hasSolutionBlockToken(null)).toBe(false);
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
    expect(extractPlaygroundUuids(`${IFRAME_A}\n\n${IFRAME_B}`)).toEqual([
      "b3Z45Rq9",
      "ZaDAqWnF",
    ]);
  });

  it("dedupes a repeated uuid", () => {
    expect(extractPlaygroundUuids(`${IFRAME_A}\n\ntext\n\n${IFRAME_A}`)).toEqual(["b3Z45Rq9"]);
  });

  it("tolerates attribute order, www host and the short src form", () => {
    expect(
      extractPlaygroundUuids(
        '<iframe name="x" width="100%" src="https://www.leetcode.com/playground/AbC-12_3/shared"></iframe>',
      ),
    ).toEqual(["AbC-12_3"]);
  });

  it("extracts nothing from a non-playground iframe", () => {
    expect(
      extractPlaygroundUuids('<iframe src="https://www.youtube.com/embed/xyz"></iframe>'),
    ).toEqual([]);
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

describe("languageLabel", () => {
  it("gives proper display names", () => {
    expect(languageLabel("cpp")).toBe("C++");
    expect(languageLabel("python")).toBe("Python");
    expect(languageLabel("csharp")).toBe("C#");
    expect(languageLabel("javascript")).toBe("JavaScript");
  });

  it("normalises before labelling", () => {
    expect(languageLabel("python3")).toBe("Python");
    expect(languageLabel("golang")).toBe("Go");
  });
});

describe("pickDefaultLanguage", () => {
  const available = ["cpp", "java", "python", "javascript"];

  it("prefers the reader's language over the author's", () => {
    // The app is Java-first; a C++-first editorial must not win over Java.
    expect(pickDefaultLanguage(available, "java")).toBe("java");
  });

  it("normalises the preference before matching", () => {
    expect(pickDefaultLanguage(available, "Java")).toBe("java");
  });

  it("falls back to the preference order when the reader's language is absent", () => {
    expect(pickDefaultLanguage(["cpp", "python"], "go")).toBe("cpp");
  });

  it("returns the first available when nothing matches the preference list", () => {
    expect(pickDefaultLanguage(["racket", "erlang"], "java")).toBe("racket");
  });

  it("returns null for an empty set", () => {
    expect(pickDefaultLanguage([], "java")).toBeNull();
  });
});

describe("splitEditorialMarkdown", () => {
  it("interleaves prose and blocks in document order", () => {
    const segments = splitEditorialMarkdown(RESOLVED_EDITORIAL, BLOCKS);
    expect(segments.map((s) => s.kind)).toEqual([
      "markdown",
      "block",
      "markdown",
      "block",
      "markdown",
    ]);
  });

  it("binds each token to the block at its index", () => {
    const segments = splitEditorialMarkdown(RESOLVED_EDITORIAL, BLOCKS);
    const blocks = segments.filter((s) => s.kind === "block");
    expect(blocks[0]).toMatchObject({ index: 0 });
    expect(blocks[1]).toMatchObject({ index: 1 });
    if (blocks[0].kind === "block") expect(blocks[0].block?.languages).toHaveLength(3);
    if (blocks[1].kind === "block") expect(blocks[1].block?.languages).toHaveLength(2);
  });

  it("preserves the surrounding prose verbatim", () => {
    const segments = splitEditorialMarkdown(RESOLVED_EDITORIAL, BLOCKS);
    const prose = segments
      .filter((s) => s.kind === "markdown")
      .map((s) => (s.kind === "markdown" ? s.content : ""))
      .join("");
    expect(prose).toContain("### Approach 1: Simulation");
    expect(prose).toContain("### Approach 2: Binary Indexed Tree");
    expect(prose).toContain("Time complexity: $O(n^2)$.");
    expect(prose).toContain("Time complexity: $O(n \\log n)$.");
    // The placeholder itself must never survive into rendered prose.
    expect(prose).not.toContain("solution-block");
  });

  it("yields a null block for a token with no match so callers can degrade", () => {
    const segments = splitEditorialMarkdown("Before\n\n<!--solution-block:9-->\n\nAfter", BLOCKS);
    const b = segments.find((s) => s.kind === "block");
    expect(b).toMatchObject({ kind: "block", index: 9, block: null });
  });

  it("handles blocks being omitted entirely", () => {
    const segments = splitEditorialMarkdown(RESOLVED_EDITORIAL);
    expect(segments.filter((s) => s.kind === "block")).toHaveLength(2);
    expect(segments.find((s) => s.kind === "block")).toMatchObject({ block: null });
  });

  it("returns a single markdown segment when there are no tokens", () => {
    const plain = "### Approach\n\nJust prose.";
    expect(splitEditorialMarkdown(plain, BLOCKS)).toEqual([
      { kind: "markdown", content: plain },
    ]);
  });

  it("drops leading/trailing whitespace-only segments", () => {
    const segments = splitEditorialMarkdown("\n\n<!--solution-block:0-->\n\n", BLOCKS);
    expect(segments).toHaveLength(1);
    expect(segments[0].kind).toBe("block");
  });

  it("returns nothing for empty markdown", () => {
    expect(splitEditorialMarkdown("", BLOCKS)).toEqual([]);
  });
});
