export function stripHtml(html: string): string {
  if (!html) return "";
  try {
    if (typeof document !== "undefined") {
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      // preserve example blocks formatting
      tmp.querySelectorAll(".example-block").forEach((el) => {
        // ensure newlines between examples
        el.insertAdjacentText("beforebegin", "\n");
      });
      const text = tmp.textContent || tmp.innerText || "";
      return text.replace(/\u00A0/g, " ").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    }
  } catch {}
  // fallback: strip tags
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export interface BuildGuruContextOpts {
  title: string;
  difficulty?: string;
  contentHtml?: string;
  exampleTestcases?: string;
  codeSnippets?: { langSlug: string; code: string }[];
  hints?: string[];
  topicTags?: { name: string }[];
  link?: string;
  currentCode?: string;
  testcaseTabs?: { name: string; value: string }[];
  runResult?: { status: string; output: string; executionTimeMs?: number } | null;
  selectedCode?: string;
  extraContext?: string;
}

export function buildProblemSolverGuruContext(opts: BuildGuruContextOpts): string {
  const {
    title,
    difficulty,
    contentHtml,
    codeSnippets,
    hints,
    topicTags,
    link,
    currentCode,
    testcaseTabs,
    runResult,
    selectedCode,
  } = opts;

  const javaSnippet = codeSnippets?.find((s) => s.langSlug === "java")?.code || "";
  const stripped = stripHtml(contentHtml || "");
  // Cap description to ~2500 chars for token budget
  const desc = stripped.length > 2500 ? stripped.slice(0, 2500) + "\n...(truncated)" : stripped;

  const codeCapped = currentCode
    ? currentCode.length > 5000
      ? currentCode.slice(0, 5000) + "\n// ...(truncated, " + (currentCode.length - 5000) + " chars more)"
      : currentCode
    : "";

  const testcaseStr = testcaseTabs?.length
    ? testcaseTabs.map((t) => `${t.name}: ${t.value || "(empty)"}`).join("\n")
    : opts.exampleTestcases
      ? `Example testcases raw:\n${opts.exampleTestcases}`
      : "";

  const runStr = runResult
    ? `Status: ${runResult.status}\nTime: ${runResult.executionTimeMs ?? "?"}ms\nOutput:\n${(runResult.output || "").slice(0, 2000)}`
    : "No run yet";

  const parts: string[] = [];
  parts.push(`LeetCode Problem: ${title}${difficulty ? ` [${difficulty}]` : ""}`);
  if (topicTags?.length) parts.push(`Tags: ${topicTags.map((t) => t.name).join(", ")}`);
  if (link) parts.push(`Link: ${link}`);
  if (desc) parts.push(`Problem description:\n${desc}`);
  if (hints?.length) parts.push(`Hints:\n${hints.map((h, i) => `${i + 1}. ${stripHtml(h)}`).join("\n")}`);
  if (javaSnippet) parts.push(`LeetCode Java starter snippet:\n${javaSnippet.slice(0, 1500)}`);
  if (codeCapped) {
    parts.push(`User's current code (Java 21, auto-attached):\n\`\`\`java\n${codeCapped}\n\`\`\``);
  } else {
    parts.push(`User's current code: (empty - no code written yet)`);
  }
  if (testcaseStr) parts.push(`Testcases (tabs):\n${testcaseStr.slice(0, 1500)}`);
  parts.push(`Last run result:\n${runStr}`);
  if (selectedCode) parts.push(`User's selected code snippet (highlighted range):\n\`\`\`java\n${selectedCode.slice(0, 2000)}\n\`\`\``);
  if (opts.extraContext) parts.push(opts.extraContext);

  const full = parts.filter(Boolean).join("\n\n");
  // Hard cap 8000 chars
  return full.length > 8000 ? full.slice(0, 8000) + "\n...(context truncated)" : full;
}

export function deriveGuruSuggestions(opts: {
  hasCode: boolean;
  hasRun: boolean;
  runStatus?: string;
  exampleTestcases?: string;
}): string[] {
  const { hasCode, hasRun, runStatus } = opts;
  if (!hasCode) return ["Explain approach for this problem", "What pitfalls should I watch?", "Suggest time/space complexity"];
  if (!hasRun) return ["Review my code", "Suggest edge cases to test", "How to test this?"];
  if (runStatus === "compile_error") return ["Why is compilation failing?", "Fix this error", "What line is wrong?"];
  if (runStatus === "runtime_error") return ["Why runtime error?", "Help fix this crash", "What edge case breaks it?"];
  if (runStatus === "success") {
    // success could be WA or Accepted; we don't know expected here, but success from wandbox means compilation ok, check output vs expected elsewhere?
    return ["Check if logic is correct", "Optimize further?", "Explain my mistakes"];
  }
  if (runStatus === "wrong_answer" || runStatus === "Wrong Answer") return ["Why is output wrong?", "Compare expected vs mine", "Hint next step"];
  return ["Why is my output wrong?", "Help me debug", "Give me a hint"];
}
