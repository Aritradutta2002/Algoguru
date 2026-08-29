/**
 * Makes imperfect streamed Markdown from a model render predictably.
 *
 * Models occasionally escape table pipes or place several table rows on one
 * line. GitHub-flavoured Markdown requires one row per line, so normalise
 * those two cases before passing the content to the renderer.
 */
export function normalizeChatMarkdown(markdown: string): string {
  let inCodeFence = false;

  return markdown
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inCodeFence = !inCodeFence;
        return line;
      }

      if (inCodeFence) return line;

      // `\|` is often emitted as an unnecessary escape for Markdown tables.
      const unescapedPipes = line.replace(/\\\|/g, "|");

      // A row always ends with `|` and the next one begins with `|`. Splitting
      // this pattern restores tables whose rows were emitted on a single line.
      return unescapedPipes.replace(/\|\s+(?=\|)/g, "|\n");
    })
    .join("\n");
}
