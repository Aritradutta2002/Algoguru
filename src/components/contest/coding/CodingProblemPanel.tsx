import { Code2, ListTree, Sigma } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PublicCodingProblem } from "@/lib/contest/types";
import { cn } from "@/lib/utils";

/**
 * Problem statement panel. Rendered purely from the problem model — there is
 * no per-problem UI logic anywhere in this feature.
 */

const DIFFICULTY_STYLES: Record<PublicCodingProblem["difficulty"], string> = {
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
    <Badge
      variant="outline"
      className={cn("capitalize", DIFFICULTY_STYLES[difficulty])}
    >
      {difficulty}
    </Badge>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof ListTree;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-4">
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {title}
      </h4>
      <div className="mt-2.5 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export function CodingProblemPanel({ problem }: { problem: PublicCodingProblem }) {
  return (
    <article
      aria-labelledby="coding-problem-title"
      className="space-y-5 px-4 py-5"
    >
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <CodingDifficultyBadge difficulty={problem.difficulty} />
          {problem.topics.map((topic) => (
            <Badge key={topic} variant="secondary" className="font-normal">
              {topic}
            </Badge>
          ))}
        </div>
        <h2
          id="coding-problem-title"
          className="mt-3 font-display text-xl font-semibold tracking-tight"
        >
          {problem.title}
        </h2>
      </header>

      <p className="text-sm leading-relaxed">{problem.description}</p>

      <Section title="Input format" icon={ListTree}>
        <p className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
          {problem.inputFormat}
        </p>
      </Section>

      <Section title="Output format" icon={ListTree}>
        <p className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
          {problem.outputFormat}
        </p>
      </Section>

      <Section title="Constraints" icon={ListTree}>
        <ul className="space-y-1.5 font-mono text-xs text-muted-foreground">
          {problem.constraints.map((constraint) => (
            <li key={constraint}>{constraint}</li>
          ))}
        </ul>
      </Section>

      <Section title="Examples" icon={ListTree}>
        <ol className="space-y-4">
          {problem.examples.map((example, index) => (
            <li key={`${example.input}-${index}`}>
              <p className="text-xs font-medium text-muted-foreground">
                Example {index + 1}
              </p>
              <div className="mt-1.5 space-y-1 rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs">
                <p>
                  <span className="text-muted-foreground">Input:</span>{" "}
                  {example.input}
                </p>
                <p>
                  <span className="text-muted-foreground">Output:</span>{" "}
                  {example.output}
                </p>
              </div>
              {example.explanation ? (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {example.explanation}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Visible sample tests" icon={ListTree}>
        <p className="mb-2.5 text-xs text-muted-foreground">
          These are the only tests you can see. Your submission is graded against
          a separate hidden set.
        </p>
        <ol className="space-y-2.5">
          {problem.visibleTestCases.map((testCase, index) => (
            <li
              key={testCase.id}
              className="rounded-xl border border-border bg-muted/40 p-3"
            >
              <p className="text-xs font-medium text-muted-foreground">
                Sample {index + 1}
              </p>
              <div className="mt-1.5 space-y-1 font-mono text-xs">
                <p>
                  <span className="text-muted-foreground">Input:</span>{" "}
                  <span className="whitespace-pre-wrap">{testCase.input}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Expected:</span>{" "}
                  {testCase.expectedOutput}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Expected signature" icon={Code2}>
        <p className="whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs">
          {problem.functionSignature}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Limits: {problem.timeLimitMs} ms, {problem.memoryLimitMb} MB.
        </p>
      </Section>
    </article>
  );
}
