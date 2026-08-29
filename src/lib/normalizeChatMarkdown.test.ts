import { describe, expect, it } from "vitest";
import { normalizeChatMarkdown } from "./normalizeChatMarkdown";

describe("normalizeChatMarkdown", () => {
  it("restores escaped, collapsed table rows", () => {
    const markdown =
      "\\| Feature | BFS | DFS | |--------|-----|-----| | **Data structure** | Queue | Stack |";

    expect(normalizeChatMarkdown(markdown)).toBe(
      "| Feature | BFS | DFS |\n|--------|-----|-----|\n| **Data structure** | Queue | Stack |",
    );
  });

  it("does not alter pipes inside fenced code blocks", () => {
    const markdown = "```java\nString value = \"a | b\";\n```";

    expect(normalizeChatMarkdown(markdown)).toBe(markdown);
  });
});
