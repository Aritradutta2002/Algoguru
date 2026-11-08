import { motion } from "framer-motion";
import { Check, Circle, Loader2, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeLine, TWO_SUM_LINES } from "./codeSnippet";
import type { HeroPhase } from "./useHeroChoreography";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PROBLEMS = [
  { title: "Contains Duplicate", done: true },
  { title: "Valid Anagram", done: true },
  { title: "Two Sum", done: false, active: true },
  { title: "Group Anagrams", done: false },
  { title: "Top K Frequent Elements", done: false },
  { title: "Product of Array Except Self", done: false },
  { title: "Longest Consecutive Sequence", done: false },
] as const;

const SAMPLE_CASES = [
  { input: "[2,7,11,15], 9", output: "[0,1]", time: "0.3 ms" },
  { input: "[3,2,4], 6", output: "[1,2]", time: "0.2 ms" },
  { input: "[3,3], 6", output: "[0,1]", time: "0.2 ms" },
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
          <span className="text-foreground">Two Sum</span>
        </p>
        <span className="lp-chip ml-auto hidden shrink-0 sm:inline-flex">Workspace preview</span>
      </div>

      <div className="lp-frame-body">
        {/* problem list */}
        <div className="lp-frame-side p-3" aria-hidden="true">
          <div className="flex items-baseline justify-between px-2.5 pb-2 pt-1">
            <p className="text-[12px] font-medium text-foreground">Arrays &amp; Hashing</p>
            <p className="text-[12px] tabular-nums text-muted-foreground">2 of 9</p>
          </div>
          <ul className="space-y-0.5">
            {PROBLEMS.map((problem) => (
              <li
                key={problem.title}
                className={cn("lp-side-item", "active" in problem && problem.active && "is-active")}
              >
                {problem.done ? (
                  <Check size={14} strokeWidth={2.5} className="lp-success shrink-0" />
                ) : (
                  <Circle size={14} className="shrink-0 text-muted-foreground/50" />
                )}
                <span className="truncate">{problem.title}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* editor */}
        <div className="lp-editor min-w-0">
          <div className="lp-editor-tabs" aria-hidden="true">
            <span className="lp-editor-tab is-active">Solution.java</span>
            <span className="lp-editor-tab">Notes.md</span>
            <span className="ml-auto flex items-center px-3.5 text-[11.5px] text-muted-foreground">
              Java 17
            </span>
          </div>
          <pre
            tabIndex={0}
            aria-label="Example Java solution for Two Sum"
            className="landing-code"
          >
            <code>
              {TWO_SUM_LINES.map((line, index) => (
                <CodeLine key={index} tokens={line} index={index} />
              ))}
            </code>
          </pre>
        </div>

        {/* results + plan */}
        <div className="lp-frame-panel flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[12.5px] font-medium text-foreground">Test results</p>
              {testsPassed && (
                <span className="text-[12px] tabular-nums text-muted-foreground">12 / 12</span>
              )}
            </div>

            <div className="mt-3 min-h-[8.75rem]" aria-live="polite">
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
                  <p className="lp-success flex items-center gap-1.5 text-[12.5px] font-medium">
                    <Check size={13} strokeWidth={2.75} aria-hidden="true" />
                    All tests passed
                  </p>
                  <ul className="mt-3 space-y-2" aria-hidden="true">
                    {SAMPLE_CASES.map((testCase) => (
                      <li
                        key={testCase.input}
                        className="lp-well flex items-center justify-between gap-3 px-2.5 py-2 font-mono text-[11px]"
                      >
                        <span className="min-w-0 truncate text-foreground/85">
                          {testCase.input} <span className="text-muted-foreground">→ {testCase.output}</span>
                        </span>
                        <span className="shrink-0 text-muted-foreground">{testCase.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto border-t border-obsidian-border p-4">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">Weekly goal</span>
              <span className="text-[12px] tabular-nums text-foreground">3 / 5 sessions</span>
            </div>
            <div className="lp-progress mt-2">
              <div className="hero-goal-fill w-3/5" />
            </div>
            <button
              type="button"
              onClick={onOpenRoadmap}
              className="lp-btn lp-btn-secondary mt-4 min-h-9 w-full text-[13px]"
            >
              <MapIcon size={14} aria-hidden="true" />
              Browse full roadmap
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
