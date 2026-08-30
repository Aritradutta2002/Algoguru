// Parser for LeetCode problem HTML — extracts expected outputs from example blocks.
//
// Used by both /problem-solver and /playground to compare the user's output
// against LeetCode's expected output for each example test case.
//
// Supports THREE formats seen in the wild:
//   1) <div class="example-block"> ... <strong>Output:</strong> <span class="example-io">X</span>
//      — used by our hardcoded FALLBACK_PROBLEM and some custom content.
//   2) <pre> ... <strong>Input:</strong> ... \n <strong>Output:</strong> X \n ...
//      — the REAL format returned by alfa-leetcode-api.onrender.com (the actual
//        upstream for /problem-solver and /playground). Output is followed by
//        plain text until the next <strong>...</strong> tag (e.g. Explanation).
//   3) Bare <strong>Output:</strong> X anywhere in the content.
//
// Without this parser, every daily challenge showed "No expected — custom case"
// because the legacy parser only knew about format (1) and silently returned [].

/** Normalise HTML entities that show up in LeetCode content. @internal */
function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/ /g, " ")
    .replace(/&nbsp;/g, " ");
}

/** @internal */
function cleanValue(raw: string): string {
  let v = (raw || "").replace(/^[\s ]+|[\s ]+$/g, "");
  v = decodeEntities(v);
  v = v.replace(/,\s*$/, "");
  return v.trim();
}
/**
 * Try to push an Output value from a single example container element.
 * Returns true if it managed to extract one.
 * @internal
 */
function extractFromBlock(block: Element, out: string[]): boolean {
  // Strategy A — walk <strong> children; pick the one whose label starts with "Output".
  const strongs = block.querySelectorAll("strong");
  for (const s of Array.from(strongs)) {
    const label = (s.textContent || "").trim().toLowerCase();
    if (!label.startsWith("output")) continue;
    const parent = s.parentElement;
    if (!parent) continue;

    // Prefer <span class="example-io"> if present (format 1).
    const exampleSpan = parent.querySelector(".example-io");
    if (exampleSpan && (exampleSpan.textContent || "").trim()) {
      out.push(cleanValue(exampleSpan.textContent || ""));
      return true;
    }

    // Format 2: <p><strong>Output:</strong> 5</p>
    // Walk the parent's child nodes and take text AFTER the <strong>,
    // but STOP at the next <strong> tag (which is the start of the next
    // labelled section, typically Explanation:).
    let value = "";
    let seenStrong = false;
    for (const node of Array.from(parent.childNodes)) {
      if (node === s) {
        seenStrong = true;
        continue;
      }
      if (!seenStrong) continue;
      // Stop at any subsequent <strong> tag.
      if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "STRONG") {
        break;
      }
      value += node.textContent || "";
    }
    // Also collapse newlines so multi-line explanations don't bleed in.
    if (value.includes("\n")) value = value.split("\n")[0];
    if (!value.trim() && parent.textContent) {
      value = (parent.textContent || "")
        .replace(/^output\s*:?\s*/i, "")
        .split("\n")[0];
    }
    if (value.trim()) {
      out.push(cleanValue(value));
      return true;
    }
  }

  // Strategy B — textContent heuristic up to newline.
  const text = block.textContent || "";
  const m = text.match(/Output\s*:\s*([^\n]+)/i);
  if (m && m[1] && m[1].trim()) {
    out.push(cleanValue(m[1]));
    return true;
  }

  // Strategy C — example-io span fallback (when strong tag is missing/wrong).
  const spans = block.querySelectorAll(".example-io");
  if (spans.length >= 2) {
    out.push(cleanValue(spans[1].textContent || ""));
    return true;
  }
  if (spans.length === 1 && (block.textContent || "").toLowerCase().includes("output")) {
    out.push(cleanValue(spans[0].textContent || ""));
    return true;
  }
  return false;
}

/**
 * Try to extract an Output value from a paragraph (<p>) that contains
 * <strong>Output:</strong> directly (no surrounding example container).
 * Used for LeetCode problems where each Output lives in its own <p>.
 * @internal
 */
function extractFromBareParagraph(p: Element, out: string[]): boolean {
  const strong = p.querySelector(":scope > strong");
  if (!strong) return false;
  const label = (strong.textContent || "").trim().toLowerCase();
  if (!label.startsWith("output")) return false;

  // If the strong has an example-io sibling, prefer that (format 1 inside <p>).
  const exampleSpan = p.querySelector(".example-io");
  if (exampleSpan && (exampleSpan.textContent || "").trim()) {
    out.push(cleanValue(exampleSpan.textContent || ""));
    return true;
  }

  // Walk text nodes after the <strong>, stopping at the next <strong>.
  let value = "";
  let seenStrong = false;
  for (const node of Array.from(p.childNodes)) {
    if (node === strong) {
      seenStrong = true;
      continue;
    }
    if (!seenStrong) continue;
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "STRONG") break;
    value += node.textContent || "";
  }
  if (value.includes("\n")) value = value.split("\n")[0];
  if (!value.trim() && p.textContent) {
    value = (p.textContent || "").replace(/^output\s*:?\s*/i, "").split("\n")[0];
  }
  if (value.trim()) {
    out.push(cleanValue(value));
    return true;
  }
  return false;
}

/**
 * Parse LeetCode problem HTML and return the expected outputs in document order.
 * Returns an empty array when no example outputs are found (which the caller
 * treats as "all cases are custom").
 */
export function extractExpectedOutputs(html: string): string[] {
  if (!html) return [];

  // Browser-DOM parse path — most reliable because it walks the real structure.
  if (typeof document !== "undefined") {
    try {
      const temp = document.createElement("div");
      temp.innerHTML = html;
      const outputs: string[] = [];

      // We walk ALL example-container candidates AND bare <p> paragraphs
      // in document order so the result respects the original example sequence.
      //
      // The candidates are:
      //   - <div class="example-block"> blocks (format 1 wrapper)
      //   - <pre> blocks that contain BOTH "Input" and "Output" (real LeetCode)
      //   - bare <p> paragraphs that contain <strong>Output:</strong> directly
      //
      // We DFS-walk the DOM so document order is preserved naturally.

      const isContainer = (el: Element): boolean => {
        if (el.classList.contains("example-block")) return true;
        if (el.tagName === "PRE") {
          const t = (el.textContent || "").toLowerCase();
          // Only treat <pre> as an example if it has BOTH Input and Output —
          // otherwise we'd pick up random code-snippet <pre> blocks in editorials.
          return t.includes("input") && t.includes("output");
        }
        return false;
      };

      const walk = (root: Element) => {
        // Try this element itself as a container.
        if (isContainer(root)) {
          extractFromBlock(root, outputs);
          // Don't recurse into containers — their Output has already been
          // extracted, and recursing would double-count bare paragraphs inside.
          return;
        }
        // Try as a bare paragraph.
        if (root.tagName === "P") {
          extractFromBareParagraph(root, outputs);
        }
        // Recurse into children.
        for (const child of Array.from(root.children)) walk(child);
      };
      for (const child of Array.from(temp.children)) walk(child);

      if (outputs.length > 0) return outputs;
    } catch {
      // fall through to regex
    }
  }

  // Regex fallback — works without DOM (SSR / tests / node).
  const out: string[] = [];
  const regexes = [
    // Format 1: <strong>Output:</strong> <span class="example-io">X</span>
    /Output\s*:\s*<\/strong>\s*<span[^>]*class=["']example-io["'][^>]*>([\s\S]*?)<\/span>/gi,
    // Format 2/3: <strong>Output:</strong> X until next <strong> or newline
    /<strong>\s*Output\s*:?\s*<\/strong>\s*([^<\r\n]*?)(?=\s*<strong|\s*\n|$)/gi,
    // Bare: "Output: X" anywhere
    /Output\s*:\s*([^<\n\r]+)/gi,
  ];
  for (const re of regexes) {
    out.length = 0;
    let m: RegExpExecArray | null;
    // Reset lastIndex to be safe (regex objects are stateful with /g).
    re.lastIndex = 0;
    while ((m = re.exec(html)) !== null) {
      const v = cleanValue(m[1]);
      if (v) out.push(v);
      // Avoid infinite-loop on zero-width matches
      if (m.index === re.lastIndex) re.lastIndex++;
    }
    if (out.length > 0) return out;
  }
  return [];
}