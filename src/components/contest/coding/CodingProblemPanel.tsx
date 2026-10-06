import { useState } from "react";
import { FileText, History } from "lucide-react";
import {
  CODING_DIFFICULTY_TIERS,
  CODING_PROBLEM_POINTS,
} from "@/lib/contest/config";
import type { PublicCodingProblem } from "@/lib/contest/types";
import { cn } from "@/lib/utils";
import {
  PROBLEM_STATE_LABELS,
  PROBLEM_STATE_SHORT_LABELS,
  type ProblemState,
} from "@/components/contest/coding/problemState";

/**
 * Problem statement pane, rendered purely from the problem model — there is no
 * per-problem UI logic anywhere in this feature. The `Submissions` tab reports
 * only what this browser session actually knows; the authoritative grading
 * result is produced on the server.
 */

const DIFFICULTY_TIER_STYLES: Record<PublicCodingProblem["difficulty"], string> = {
  easy: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  hard: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

export function CodingDifficultyBadge({
  difficulty,
}: {
  difficulty: PublicCodingProblem["difficulty"];
}) {
  return (
    <span
      title={difficulty}
      className={cn(
        "rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        DIFFICULTY_TIER_STYLES[difficulty],
      )}
    >
      {CODING_DIFFICULTY_TIERS[difficulty]}
    </span>
  );
}

export interface CodingSubmissionSummary {
  problem: PublicCodingProblem;
  index: number;
  state: ProblemState;
  passed: number;
  total: number;
}

/** Heading plus a left-ruled body — the flat statement style of the reference. */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-2 border-l-2 border-border pl-4 text-sm leading-6 text-foreground/90">
        {children}
      </div>
    </section>
  );
}

function ProblemStatement({ problem }: { problem: PublicCodingProblem }) {
  return (
    <article aria-labelledby="coding-problem-title">
      <h1
        id="coding-problem-title"
        className="font-display text-xl font-bold tracking-tight text-foreground"
      >
        {problem.title}
      </h1>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <CodingDifficultyBadge difficulty={problem.difficulty} />
        {problem.topics.map((topic) => (
          <span
            key={topic}
            className="rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground"
          >
            {topic}
          </span>
        ))}
      </div>

      <p className="mt-6 whitespace-pre-wrap text-[15px] leading-7 text-foreground/90">
        {problem.description}
      </p>

      {problem.examples.map((example, index) => (
        <section key={`${example.input}-${index}`} className="mt-7">
          <h3 className="text-[15px] font-semibold text-foreground">
            Example {index + 1}:
          </h3>
          <div className="mt-3 space-y-2.5 border-l-2 border-border pl-5 text-[15px] leading-6 text-foreground/90">
            <p>Input: {example.input}</p>
            <p>Output: {example.output}</p>
            {example.explanation ? (
              <>
                <p className="pt-1.5">Explanation:</p>
                {example.explanation
                  .split("\n")
                  .map((line, lineIndex) => (
                    <p key={`${index}-${lineIndex}`}>{line}</p>
                  ))}
              </>
            ) : null}
          </div>
        </section>
      ))}

      {problem.constraints.length ? (
        <Section title="Constraints">
          <ul className="space-y-1 font-mono text-xs">
            {problem.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Input format">
        <p className="whitespace-pre-wrap font-mono text-xs">{problem.inputFormat}</p>
      </Section>

      <Section title="Output format">
        <p className="whitespace-pre-wrap font-mono text-xs">{problem.outputFormat}</p>
      </Section>

      {problem.visibleTestCases.length ? (
        <Section title="Sample tests">
          <ol className="space-y-3">
            {problem.visibleTestCases.map((testCase, index) => (
              <li key={testCase.id} className="space-y-1 font-mono text-xs">
                <p className="font-sans font-medium text-muted-foreground">
                  Sample {index + 1}
                </p>
                <p>Input: {testCase.input}</p>
                <p>Expected: {testCase.expectedOutput}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            Your submission is graded against a separate hidden set.
          </p>
        </Section>
      ) : null}

      <Section title="Expected signature">
        <p className="whitespace-pre-wrap font-mono text-xs text-primary">
          {problem.functionSignature}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Limits: {problem.timeLimitMs} ms, {problem.memoryLimitMb} MB.
        </p>
      </Section>
    </article>
  );
}

function SubmissionList({
  submissions,
}: {
  submissions: CodingSubmissionSummary[];
}) {
  return (
    <section aria-label="Submissions" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          Submissions
        </h2>
        <p className="text-xs text-muted-foreground">
          Attempts recorded in this session. Final grading happens on the server.
        </p>
      </div>

      {submissions.length ? (
        <ul>
          {submissions.map((submission) => (
            <li
              key={submission.problem.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 py-3 last:border-b-0"
            >
              <span className="min-w-0 truncate text-sm text-foreground">
                {submission.problem.title}
              </span>
              <span className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono">
                  {CODING_PROBLEM_POINTS[submission.problem.difficulty]} pts
                </span>
                <span>
                  {submission.total
                    ? `${submission.passed} of ${submission.total} visible tests passed`
                    : "Not run"}
                </span>
                <span className="rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 font-medium">
                  {PROBLEM_STATE_SHORT_LABELS[submission.state]}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nothing submitted yet.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Full states:{" "}
        {PROBLEM_STATE_LABELS.join(", ").toLowerCase()}.
      </p>
    </section>
  );
}

export function CodingProblemPanel({
  problem,
  submissions = [],
}: {
  problem: PublicCodingProblem;
  submissions?: CodingSubmissionSummary[];
}) {
  const [tab, setTab] = useState<"problem" | "submissions">("problem");

  const tabs = [
    { id: "problem" as const, label: "Problem", icon: FileText },
    { id: "submissions" as const, label: "Submissions", icon: History },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div
        role="tablist"
        aria-label="Problem views"
        className="flex shrink-0 items-center gap-1 border-b border-border/60 px-2 pt-1.5"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`coding-pane-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`coding-pane-${id}`}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 pb-2 pt-1.5 text-xs font-medium transition-colors",
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`coding-pane-${tab}`}
        aria-labelledby={`coding-pane-tab-${tab}`}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-5"
      >
        {tab === "problem" ? (
          <ProblemStatement problem={problem} />
        ) : (
          <SubmissionList submissions={submissions} />
        )}
      </div>
    </div>
  );
}
