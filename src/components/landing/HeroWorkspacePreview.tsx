"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Circle, Loader2, Map as MapIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CodeLine, TWO_SUM_LINES } from "./codeSnippet";
import type { HeroPhase } from "./useHeroChoreography";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PROBLEMS = [
  { title: "Contains Duplicate", done: true, difficulty: "Easy" },
  { title: "Valid Anagram", done: true, difficulty: "Easy" },
  { title: "Two Sum", done: false, active: true, difficulty: "Easy" },
  { title: "Group Anagrams", done: false, difficulty: "Med" },
  { title: "Top K Frequent Elements", done: false, difficulty: "Med" },
  { title: "Product of Array Except Self", done: false, difficulty: "Med" },
  { title: "Longest Consecutive Sequence", done: false, difficulty: "Med" },
] as const;

const SAMPLE_CASES = [
  { input: "[2,7,11,15], 9", output: "[0,1]", time: "0.3 ms" },
  { input: "[3,2,4], 6", output: "[1,2]", time: "0.2 ms" },
  { input: "[3,3], 6", output: "[0,1]", time: "0.2 ms" },
] as const;

const SOLUTION_NOTES = [
  {
    label: "Pattern",
    value: "Complement HashMap",
    detail: "Store each seen value mapped to its array index so any target complement resolves in O(1) expected time.",
  },
  {
    label: "Complexity",
    value: "O(n) Time · O(n) Space",
    detail: "Single left-to-right pass eliminates the quadratic nested-loop scan while bounding extra memory to n entries.",
  },
  {
    label: "Edge check",
    value: "Lookup before insert",
    detail: "Querying containsKey(t - a[i]) prior to put(a[i], i) prevents pairing an element with itself.",
  },
] as const;

interface HeroWorkspacePreviewProps {
  phase: HeroPhase;
  reduceMotion: boolean | null;
  onOpenRoadmap: () => void;
}

export function HeroWorkspacePreview({
  phase,
  reduceMotion,
  onOpenRoadmap,
}: HeroWorkspacePreviewProps) {
  const [editorFile, setEditorFile] = useState<"solution" | "notes">("solution");
  const testsRunning = phase === "running";
  const testsPassed = phase === "pass" || phase === "done";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
      className="lp-frame"
    >
      <div className="lp-frame-bar">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="lp-dot" />
          <span className="lp-dot" />
          <span className="lp-dot" />
        </div>
        <p className="ml-2 min-w-0 truncate text-[12.5px] text-muted-foreground">
          Practice
          <span className="mx-1.5 text-muted-foreground/50" aria-hidden="true">/</span>
          Arrays &amp; Hashing
          <span className="mx-1.5 text-muted-foreground/50" aria-hidden="true">/</span>
          <span className="font-medium text-foreground">Two Sum</span>
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="hidden font-mono text-[11px] text-muted-foreground md:inline">
            O(n) time · O(n) space
          </span>
          <span className="lp-chip hidden sm:inline-flex">Workspace preview</span>
        </div>
      </div>

      <div className="lp-frame-body">
        {/* problem list */}
        <div className="lp-frame-side p-3" aria-hidden="true">
          <div className="flex items-baseline justify-between px-2.5 pb-2 pt-1">
            <p className="text-[12px] font-medium text-foreground">Arrays &amp; Hashing</p>
            <p className="font-mono text-[11.5px] tabular-nums text-muted-foreground">2 / 9</p>
          </div>
          <div className="mx-2.5 mb-2.5 h-1 overflow-hidden rounded-full bg-foreground/[0.08]">
            <div className="h-full w-[22%] rounded-full bg-[hsl(var(--lp-accent))]" />
          </div>
          <ul className="space-y-0.5">
            {PROBLEMS.map((problem) => (
              <li
                key={problem.title}
                className={cn("lp-side-item justify-between", "active" in problem && problem.active && "is-active")}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {problem.done ? (
                    <Check size={14} strokeWidth={2.5} className="lp-success shrink-0" />
                  ) : (
                    <Circle
                      size={14}
                      className={cn(
                        "shrink-0",
                        "active" in problem && problem.active
                          ? "text-[hsl(var(--lp-accent))]"
                          : "text-muted-foreground/50",
                      )}
                    />
                  )}
                  <span className="truncate">{problem.title}</span>
                </span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">
                  {problem.difficulty}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-auto border-t border-obsidian-border px-2.5 pt-3">
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground/80">
              Pattern track
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Hash maps &amp; frequency counting
            </p>
          </div>
        </div>

        {/* editor */}
        <div className="lp-editor min-w-0">
          <div className="lp-editor-tabs">
            <Button
              variant="bare"
              size="bare"
              type="button"
              onClick={() => setEditorFile("solution")}
              aria-pressed={editorFile === "solution"}
              className={cn("lp-editor-tab rounded-none", editorFile === "solution" && "is-active")}
            >
              Solution.java
            </Button>
            <Button
              variant="bare"
              size="bare"
              type="button"
              onClick={() => setEditorFile("notes")}
              aria-pressed={editorFile === "notes"}
              className={cn("lp-editor-tab rounded-none", editorFile === "notes" && "is-active")}
            >
              Notes.md
            </Button>
            <span className="ml-auto flex items-center gap-2 px-3.5 text-[11.5px] text-muted-foreground">
              <span className="hidden font-mono sm:inline">JDK 17</span>
              <span className="lp-chip lp-chip-success hidden md:inline-flex">Easy</span>
            </span>
          </div>

          {editorFile === "solution" ? (
            <pre
              tabIndex={0}
              aria-label="Example Java solution for Two Sum"
              className="landing-code flex-1"
            >
              <code>
                {TWO_SUM_LINES.map((line, index) => (
                  <CodeLine key={index} tokens={line} index={index} />
                ))}
              </code>
            </pre>
          ) : (
            <div className="flex-1 space-y-3 p-4 sm:p-5">
              {SOLUTION_NOTES.map((item) => (
                <div key={item.label} className="lp-well px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="font-mono text-[11.5px] font-medium text-foreground">
                      {item.value}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-5 text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="lp-editor-footer" aria-hidden="true">
            <span>{editorFile === "solution" ? "Solution.java · 11 lines" : "Notes.md · 3 takeaways"}</span>
            <span className="hidden sm:inline">UTF-8 · Java 17 LTS</span>
          </div>
        </div>

        {/* results + plan */}
        <div className="lp-frame-panel flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[12.5px] font-medium text-foreground">Test results</p>
              {testsPassed && (
                <span className="font-mono text-[12px] tabular-nums text-muted-foreground">12 / 12</span>
              )}
            </div>

            <div className="mt-3 min-h-[10.5rem]" aria-live="polite">
              {!testsRunning && !testsPassed && (
                <p className="text-[12.5px] text-muted-foreground">Run the suite to see results.</p>
              )}
              {testsRunning && (
                <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  Running 12 tests…
                </p>
              )}
              {testsPassed && (
                <div className="lp-result-row">
                  <div className="flex items-center justify-between gap-2">
                    <p className="lp-success flex items-center gap-1.5 text-[12.5px] font-medium">
                      <Check size={13} strokeWidth={2.75} aria-hidden="true" />
                      All tests passed
                    </p>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      0.2 ms · 41 MB
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2" aria-hidden="true">
                    {SAMPLE_CASES.map((testCase) => (
                      <li
                        key={testCase.input}
                        className="lp-well flex items-center justify-between gap-3 px-2.5 py-2 font-mono text-[11px]"
                      >
                        <span className="min-w-0 truncate text-foreground/85">
                          {testCase.input} <span className="text-muted-foreground">→ {testCase.output}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{testCase.time}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="lp-guru-callout mt-3" aria-hidden="true">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                      <Sparkles size={12} className="text-[hsl(var(--guru-accent))]" />
                      Guru AI insight
                    </p>
                    <p className="mt-1 text-[11.5px] leading-4 text-muted-foreground">
                      Complement map cuts quadratic scan to single-pass O(n).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto border-t border-obsidian-border p-4">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">Weekly goal</span>
              <span className="font-mono text-[12px] tabular-nums text-foreground">3 / 5 sessions</span>
            </div>
            <div className="lp-progress mt-2">
              <div className="hero-goal-fill w-3/5" />
            </div>
            <Button
              variant="bare"
              size="bare"
              type="button"
              onClick={onOpenRoadmap}
              className="lp-btn lp-btn-secondary mt-4 min-h-9 w-full text-[13px]"
            >
              <MapIcon size={14} aria-hidden="true" />
              Browse full roadmap
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
