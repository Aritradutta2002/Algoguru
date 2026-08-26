import { useMemo, useState } from "react";
import { Search, Loader2, ExternalLink, Code2, ChevronDown, Layers } from "lucide-react";
import { practiceData, type Problem } from "@/data/practiceData";
import type { LeetCodeProblem } from "@/lib/leetcodeProblem";

type Props = {
  onSelectProblem: (problem: Problem, leetCodeData: LeetCodeProblem | null, javaSnippet: string, exampleTestcases: string) => void;
  onFetchProblem: (titleSlug: string) => Promise<LeetCodeProblem | null>;
  deriveSlug: (p: Problem) => string | null;
  loadingSlug: string | null;
  activeSlug: string | null;
};

const TOPIC_ACCENT_FALLBACK = { bg: "bg-zinc-900", text: "text-zinc-900", border: "border-zinc-200", soft: "bg-zinc-50" };

const TOPIC_ACCENTS: Record<string, { bg: string; text: string; border: string; soft: string }> = {
  array: { bg: "bg-blue-500", text: "text-blue-600", border: "border-blue-200", soft: "bg-blue-50 dark:bg-blue-950/30" },
  strings: { bg: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-200", soft: "bg-emerald-50 dark:bg-emerald-950/30" },
  "binary-search": { bg: "bg-amber-500", text: "text-amber-600", border: "border-amber-200", soft: "bg-amber-50 dark:bg-amber-950/30" },
  stack: { bg: "bg-purple-500", text: "text-purple-600", border: "border-purple-200", soft: "bg-purple-50 dark:bg-purple-950/30" },
  "linked-list": { bg: "bg-rose-500", text: "text-rose-600", border: "border-rose-200", soft: "bg-rose-50 dark:bg-rose-950/30" },
  "double-linked-list": { bg: "bg-pink-500", text: "text-pink-600", border: "border-pink-200", soft: "bg-pink-50 dark:bg-pink-950/30" },
  hashmap: { bg: "bg-cyan-500", text: "text-cyan-600", border: "border-cyan-200", soft: "bg-cyan-50 dark:bg-cyan-950/30" },
  heap: { bg: "bg-indigo-500", text: "text-indigo-600", border: "border-indigo-200", soft: "bg-indigo-50 dark:bg-indigo-950/30" },
  recursion: { bg: "bg-orange-500", text: "text-orange-600", border: "border-orange-200", soft: "bg-orange-50 dark:bg-orange-950/30" },
  tree: { bg: "bg-teal-500", text: "text-teal-600", border: "border-teal-200", soft: "bg-teal-50 dark:bg-teal-950/30" },
  "binary-search-tree": { bg: "bg-lime-600", text: "text-lime-700", border: "border-lime-200", soft: "bg-lime-50 dark:bg-lime-950/30" },
  graph: { bg: "bg-sky-600", text: "text-sky-700", border: "border-sky-200", soft: "bg-sky-50 dark:bg-sky-950/30" },
  backtracking: { bg: "bg-fuchsia-500", text: "text-fuchsia-600", border: "border-fuchsia-200", soft: "bg-fuchsia-50 dark:bg-fuchsia-950/30" },
  greedy: { bg: "bg-yellow-500", text: "text-yellow-700", border: "border-yellow-200", soft: "bg-yellow-50 dark:bg-yellow-950/30" },
  "dynamic-programming": { bg: "bg-violet-600", text: "text-violet-700", border: "border-violet-200", soft: "bg-violet-50 dark:bg-violet-950/30" },
  trie: { bg: "bg-emerald-600", text: "text-emerald-700", border: "border-emerald-200", soft: "bg-emerald-50 dark:bg-emerald-950/30" },
  "bit-manipulation": { bg: "bg-slate-600", text: "text-slate-700", border: "border-slate-200", soft: "bg-slate-50 dark:bg-slate-900/30" },
};

function getDifficultyColor(diff: string) {
  switch (diff) {
    case "Easy":
      return "bg-emerald-500 text-white border-emerald-500";
    case "Medium":
      return "bg-amber-500 text-white border-amber-500";
    case "Hard":
      return "bg-rose-500 text-white border-rose-500";
    default:
      return "bg-zinc-500 text-white";
  }
}

export function PlaygroundProblemsLibrary({ onSelectProblem, onFetchProblem, deriveSlug, loadingSlug, activeSlug }: Props) {
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All");
  const [expandedTopic, setExpandedTopic] = useState<string | null>(practiceData[0]?.id ?? null);
  const [expandedSubtopic, setExpandedSubtopic] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && difficultyFilter === "All") return practiceData;
    return practiceData
      .map((topic) => ({
        ...topic,
        subtopics: topic.subtopics
          .map((sub) => ({
            ...sub,
            problems: sub.problems.filter((p) => {
              const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
              const matchesDiff = difficultyFilter === "All" || p.difficulty === difficultyFilter;
              return matchesQuery && matchesDiff;
            }),
          }))
          .filter((s) => s.problems.length > 0),
      }))
      .filter((t) => t.subtopics.length > 0);
  }, [query, difficultyFilter]);

  const totalVisible = useMemo(() => filtered.reduce((a, t) => a + t.subtopics.reduce((b, s) => b + s.problems.length, 0), 0), [filtered]);

  return (
    <div className="flex flex-col min-h-0">
      {/* Search + filter */}
      <div className="sticky top-0 z-10 p-3 space-y-2" style={{ background: "var(--lc-panel)", borderBottom: "1px solid var(--lc-border-soft)" }}>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--lc-faint)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search practice problems…"
            className="lc-field w-full pl-8 pr-3 h-8 text-[12px]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {["All", "Easy", "Medium", "Hard"].map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${difficultyFilter === d ? "bg-[color:var(--lc-text)] text-[color:var(--lc-panel)] border-[color:var(--lc-text)]" : "bg-transparent border-[color:var(--lc-border)] text-[color:var(--lc-muted)] hover:text-[color:var(--lc-text)]"}`}
            >
              {d}
            </button>
          ))}
          <span className="ml-auto text-[11px]" style={{ color: "var(--lc-faint)" }}>
            {totalVisible} problems
          </span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-2 space-y-3">
        {filtered.length === 0 ? (
          <div className="px-3 py-10 text-center text-[12px]" style={{ color: "var(--lc-faint)" }}>
            No problems match your search.
          </div>
        ) : (
          filtered.map((topic) => {
            const accent = TOPIC_ACCENTS[topic.id] ?? TOPIC_ACCENT_FALLBACK;
            const isTopicOpen = expandedTopic === topic.id;
            return (
              <div key={topic.id} className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--lc-border)", background: "var(--lc-panel-2)" }}>
                <button
                  onClick={() => setExpandedTopic(isTopicOpen ? null : topic.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left lc-hover"
                >
                  <span className={`w-7 h-7 rounded-lg ${accent.bg} text-white flex items-center justify-center shrink-0`}>
                    <Layers size={13} />
                  </span>
                  <span className="text-[13px] font-bold flex-1 truncate" style={{ color: "var(--lc-text)" }}>
                    {topic.title}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full border" style={{ color: "var(--lc-muted)", borderColor: "var(--lc-border)" }}>
                    {topic.subtopics.reduce((a, s) => a + s.problems.length, 0)}
                  </span>
                  <ChevronDown size={13} className={`transition-transform ${isTopicOpen ? "rotate-180" : ""}`} style={{ color: "var(--lc-muted)" }} />
                </button>

                {isTopicOpen && (
                  <div className="px-2 pb-2 space-y-2">
                    {topic.subtopics.map((sub) => {
                      const isSubOpen = expandedSubtopic === sub.id;
                      return (
                        <div key={sub.id} className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--lc-border-soft)", background: "var(--lc-panel)" }}>
                          <button
                            onClick={() => setExpandedSubtopic(isSubOpen ? null : sub.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left lc-hover"
                          >
                            <span className="text-[12px] font-semibold flex-1 truncate" style={{ color: "var(--lc-text)" }}>
                              {sub.title}
                            </span>
                            <span className="text-[11px]" style={{ color: "var(--lc-faint)" }}>
                              {sub.problems.length}
                            </span>
                            <ChevronDown size={12} className={`transition-transform ${isSubOpen ? "rotate-180" : ""}`} style={{ color: "var(--lc-muted)" }} />
                          </button>

                          {isSubOpen && (
                            <div className="px-1.5 pb-1.5 space-y-1">
                              {sub.problems.map((prob) => {
                                const slug = deriveSlug(prob);
                                const isLoading = loadingSlug === slug;
                                const isActive = activeSlug === slug;
                                return (
                                  <div
                                    key={prob.id}
                                    className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors ${isActive ? "border-[color:var(--lc-accent)] bg-[color:var(--lc-accent-soft)]" : "border-transparent hover:bg-[color:var(--lc-panel-3)]"}`}
                                    style={{ borderColor: isActive ? "var(--lc-accent-soft)" : "transparent" }}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[12px] font-semibold truncate" style={{ color: "var(--lc-text)" }}>
                                          {prob.title}
                                        </span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${getDifficultyColor(prob.difficulty)}`}>{prob.difficulty}</span>
                                      </div>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-[10px] font-mono truncate" style={{ color: "var(--lc-faint)" }}>
                                          {slug || prob.id}
                                        </span>
                                        {prob.leetcodeLink && (
                                          <a
                                            href={prob.leetcodeLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
                                            title="Open LeetCode"
                                          >
                                            <ExternalLink size={10} style={{ color: "var(--lc-muted)" }} />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                      <button
                                      onClick={async () => {
                                        if (!slug) return;
                                        const data = await onFetchProblem(slug);
                                        // snippet prefer java
                                        const javaSnippet = data?.codeSnippets?.find((s) => s.langSlug === "java")?.code || "";
                                        const hasReal = javaSnippet && !javaSnippet.includes("public int solve()");
                                        const testcases = data?.exampleTestcases || "";
                                        // If LeetCode missing (null), still load placeholder with title
                                        onSelectProblem(
                                          prob,
                                          data,
                                          hasReal ? javaSnippet : "",
                                          testcases,
                                        );
                                      }}
                                      disabled={isLoading}
                                      className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors disabled:opacity-50 ${isActive ? "bg-[color:var(--lc-accent)] text-white border-[color:var(--lc-accent)]" : "bg-[color:var(--lc-panel)] text-[color:var(--lc-text)] border-[color:var(--lc-border)] hover:border-[color:var(--lc-accent)] hover:text-[color:var(--lc-accent)]"}`}
                                    >
                                      {isLoading ? <Loader2 size={11} className="animate-spin" /> : <Code2 size={11} />}
                                      {isLoading ? "Loading" : isActive ? "Loaded" : "Load"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div className="px-2 py-2 text-[11px] leading-relaxed rounded-lg border" style={{ color: "var(--lc-muted)", borderColor: "var(--lc-border-soft)", background: "var(--lc-panel)" }}>
          Click <b style={{ color: "var(--lc-text)" }}>Load</b> to open the problem in the editor with starter code and sample testcases. Add custom cases in the Testcase tab.
        </div>
      </div>
    </div>
  );
}
