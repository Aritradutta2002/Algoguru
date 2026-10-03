import { Check, Clock, Code2, Copy, Cpu, FileText, Layers, ListTree, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PublicCodingProblem } from "@/lib/contest/types";
import { cn } from "@/lib/utils";

/**
 * Problem statement panel. Rendered purely from the problem model — there is
 * no per-problem UI logic anywhere in this feature.
 */

const DIFFICULTY_STYLES: Record<PublicCodingProblem["difficulty"], string> = {
  easy: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium",
  hard: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium",
};

export function CodingDifficultyBadge({
  difficulty,
}: {
  difficulty: PublicCodingProblem["difficulty"];
}) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize px-2.5 py-0.5 text-xs rounded-full", DIFFICULTY_STYLES[difficulty])}
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
    <section className="rounded-2xl border border-border/70 bg-card/40 p-4 transition-all hover:border-border">
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-foreground">
          <Icon aria-hidden="true" className="h-3 w-3" />
        </span>
        {title}
      </h4>
      <div className="mt-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export function CodingProblemPanel({ problem }: { problem: PublicCodingProblem }) {
  return (
    <article
      aria-labelledby="coding-problem-title"
      className="space-y-5 p-5 md:p-6"
    >
      {/* Problem Header */}
      <header className="rounded-2xl border border-border/80 bg-muted/15 p-5 backdrop-blur-xs">
        <div className="flex flex-wrap items-center gap-2">
          <CodingDifficultyBadge difficulty={problem.difficulty} />
          {problem.topics.map((topic) => (
            <Badge key={topic} variant="secondary" className="font-normal text-xs bg-muted/60 text-muted-foreground">
              {topic}
            </Badge>
          ))}
          <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {problem.timeLimitMs}ms
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-3 w-3" /> {problem.memoryLimitMb}MB
            </span>
          </div>
        </div>

        <h2
          id="coding-problem-title"
          className="mt-3.5 font-display text-2xl font-bold tracking-tight text-foreground"
        >
          {problem.title}
        </h2>
      </header>

      {/* Description */}
      <div className="rounded-2xl border border-border/60 bg-card/30 p-5 text-sm leading-relaxed text-foreground/90">
        <p className="whitespace-pre-wrap">{problem.description}</p>
      </div>

      {/* Input format */}
      <Section title="Input format" icon={FileText}>
        <p className="whitespace-pre-wrap font-mono text-xs text-muted-foreground rounded-xl bg-muted/30 p-3 border border-border/40">
          {problem.inputFormat}
        </p>
      </Section>

      {/* Output format */}
      <Section title="Output format" icon={FileText}>
        <p className="whitespace-pre-wrap font-mono text-xs text-muted-foreground rounded-xl bg-muted/30 p-3 border border-border/40">
          {problem.outputFormat}
        </p>
      </Section>

      {/* Constraints */}
      <Section title="Constraints" icon={ListTree}>
        <ul className="space-y-2">
          {problem.constraints.map((constraint) => (
            <li
              key={constraint}
              className="inline-block mr-2 mb-1.5 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 font-mono text-xs text-foreground/80"
            >
              {constraint}
            </li>
          ))}
        </ul>
      </Section>

      {/* Examples */}
      <Section title="Examples" icon={Sparkles}>
        <ol className="space-y-4">
          {problem.examples.map((example, index) => (
            <li
              key={`${example.input}-${index}`}
              className="rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="font-mono text-xs font-semibold text-primary">
                  Example {index + 1}
                </span>
              </div>
              <div className="mt-3 space-y-2.5 font-mono text-xs">
                <div className="rounded-lg bg-background/80 p-2.5 border border-border/40">
                  <span className="text-muted-foreground block text-[11px] font-sans font-medium uppercase tracking-wider mb-1">
                    Input:
                  </span>
                  <span className="text-foreground">{example.input}</span>
                </div>
                <div className="rounded-lg bg-background/80 p-2.5 border border-border/40">
                  <span className="text-muted-foreground block text-[11px] font-sans font-medium uppercase tracking-wider mb-1">
                    Output:
                  </span>
                  <span className="text-foreground">{example.output}</span>
                </div>
              </div>
              {example.explanation ? (
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground pt-2 border-t border-border/30">
                  <span className="font-semibold text-foreground/80">Explanation: </span>
                  {example.explanation}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </Section>

      {/* Visible sample tests */}
      <Section title="Visible sample tests" icon={ListTree}>
        <p className="mb-3 text-xs text-muted-foreground">
          These are the only tests you can see. Your submission is graded against
          a separate hidden set.
        </p>
        <ol className="space-y-3">
          {problem.visibleTestCases.map((testCase, index) => (
            <li
              key={testCase.id}
              className="rounded-xl border border-border/60 bg-muted/25 p-3.5"
            >
              <div className="flex items-center gap-2 pb-2">
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-foreground">
                  Sample {index + 1}
                </span>
              </div>
              <div className="mt-2 space-y-2 font-mono text-xs">
                <div className="rounded-lg bg-background/70 p-2 border border-border/40">
                  <span className="text-muted-foreground block text-[10px] uppercase font-sans">Input</span>
                  <span className="whitespace-pre-wrap text-foreground">{testCase.input}</span>
                </div>
                <div className="rounded-lg bg-background/70 p-2 border border-border/40">
                  <span className="text-muted-foreground block text-[10px] uppercase font-sans">Expected Output</span>
                  <span className="text-foreground">{testCase.expectedOutput}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Expected signature */}
      <Section title="Expected signature" icon={Code2}>
        <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5">
          <p className="whitespace-pre-wrap font-mono text-xs text-primary font-medium">
            {problem.functionSignature}
          </p>
        </div>
        <p className="mt-2.5 text-xs text-muted-foreground">
          Limits: {problem.timeLimitMs} ms, {problem.memoryLimitMb} MB.
        </p>
      </Section>
    </article>
  );
}
