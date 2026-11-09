import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Code2,
  FileQuestion,
  MonitorPlay,
  Shuffle,
  Trophy,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PagePrimitives";
import { MCQ_QUESTIONS } from "@/lib/mcqQuizBank";
import { QUIZ_LENGTH, getQuizLanguages } from "@/lib/quizBank";
import {
  CODING_CONTEST_CONFIG,
  CODING_CONTEST_DURATION_LABEL,
} from "@/lib/contest/config";
import { PUBLIC_JAVA_PROBLEMS } from "@/lib/codingContest/javaProblemBank";

/**
 * Contest landing page.
 *
 * Presents the two assessment paths and nothing else: the setup form lives on
 * the MCQ page, and the start flow lives on the coding instructions page. Every
 * number shown here is derived from the real data so the page cannot drift out
 * of date.
 */

const MCQ_QUESTION_COUNT = MCQ_QUESTIONS.length;
const QUIZ_LANGUAGES = getQuizLanguages();
const CODING_PROBLEM_COUNT = PUBLIC_JAVA_PROBLEMS.filter(
  (problem) => problem.isPublished,
).length;

function FactList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-start gap-2.5 text-sm">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
          />
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{item.value}</span>{" "}
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ModeCard({
  icon: Icon,
  eyebrow,
  title,
  purpose,
  facts,
  actionLabel,
  to,
  busy,
  disabledHint,
}: {
  icon: typeof Shuffle;
  eyebrow: string;
  title: string;
  purpose: string;
  facts: { label: string; value: string }[];
  actionLabel: string;
  to: string;
  busy?: boolean;
  disabledHint?: string;
  accent?: "primary" | "secondary";
}) {
  return (
    <section
      aria-labelledby={`${to.replace(/\W/g, "")}-title`}
      className="flex h-full flex-col rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-6 transition-colors hover:bg-obsidian-elevated/50 sm:p-7"
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-obsidian-border bg-obsidian-elevated text-foreground"
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <span className="lp-chip">
          {eyebrow}
        </span>
      </div>

      <h2
        id={`${to.replace(/\W/g, "")}-title`}
        className="mt-4 text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {purpose}
      </p>

      <div className="mt-5 flex-1 border-t border-obsidian-border pt-5">
        <FactList items={facts} />
      </div>

      <div className="mt-6">
        {busy ? (
          <div
            role="status"
            aria-live="polite"
            className="h-10 w-full animate-pulse rounded-lg bg-obsidian-elevated"
          >
            <span className="sr-only">Checking availability…</span>
          </div>
        ) : (
          <Button asChild size="default" className="w-full">
            <Link to={to}>
              {actionLabel}
              <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
        {disabledHint ? (
          <p className="mt-2 text-xs text-muted-foreground">{disabledHint}</p>
        ) : null}
      </div>
    </section>
  );
}

export function ContestLanding() {
  // Reserving the card height up front keeps the grid from shifting once the
  // availability probe resolves.
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  useEffect(() => {
    setAvailabilityChecked(true);
  }, []);

  const codingUnavailable =
    CODING_PROBLEM_COUNT < CODING_CONTEST_CONFIG.minProblems;

  return (
    <PageContainer className="py-10 md:py-14">
      <header className="rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-6 sm:p-8">
        <div>
          <p className="lp-kicker mb-3">
            <Trophy aria-hidden="true" className="inline mr-1.5 h-3.5 w-3.5" />
            Assessment
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            Contest
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
            Two ways to be assessed: a randomized multiple-choice quiz, or a
            timed Java coding exam. Both run in a mandatory fullscreen
            examination environment and both warn you when you look away.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-obsidian-border bg-obsidian-elevated px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Shuffle size={12} className="text-primary" /> {MCQ_QUESTION_COUNT} MCQ bank
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-obsidian-border bg-obsidian-elevated px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Code2 size={12} className="text-primary" /> {CODING_CONTEST_DURATION_LABEL} coding
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500">
              <CheckCircle2 size={12} /> Auto-graded
            </span>
          </div>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ModeCard
          icon={Shuffle}
          eyebrow="Assessment mode"
          title="MCQ Quiz"
          purpose="Test your programming knowledge with randomized multiple-choice questions in a focused exam environment."
          to="/contest/quiz"
          actionLabel="Start MCQ Quiz"
          accent="primary"
          facts={[
            {
              value: `${MCQ_QUESTION_COUNT} questions`,
              label: `in the bank, drawn at random from ${QUIZ_LANGUAGES.length} languages: ${QUIZ_LANGUAGES.map(
                (language) => language.label,
              ).join(", ")}.`,
            },
            {
              value: "Topic and difficulty filters",
              label: "pick the language and level you want to be quizzed on.",
            },
            {
              value: "Practice or timed",
              label: "study without a clock, or sit the full timed challenge.",
            },
            {
              value: "Fullscreen enforced",
              label: "the clock only starts once fullscreen is entered.",
            },
            {
              value: "Automatic scoring",
              label: "1 point per correct answer, with no negative marking.",
            },
            {
              value: `About ${QUIZ_LENGTH} minutes`,
              label: "for a full-length timed run.",
            },
          ]}
        />

        <ModeCard
          icon={Code2}
          eyebrow="Assessment mode"
          title="Java Coding Contest"
          purpose="Solve real Java interview problems using a code editor in a timed examination environment."
          to="/contest/coding"
          actionLabel="Start Coding Contest"
          accent="secondary"
          busy={!availabilityChecked}
          disabledHint={
            codingUnavailable
              ? `Only ${CODING_PROBLEM_COUNT} problem(s) are published; a contest needs at least ${CODING_CONTEST_CONFIG.minProblems}.`
              : undefined
          }
          facts={[
            {
              value: "Java only",
              label: "the initial version ships a single language.",
            },
            {
              value: CODING_CONTEST_DURATION_LABEL,
              label: "exactly, and the timer never pauses.",
            },
            {
              value: `${CODING_CONTEST_CONFIG.minProblems} or ${CODING_CONTEST_CONFIG.maxProblems} problems`,
              label: "assigned at random from the published bank.",
            },
            {
              value: "Built-in code editor",
              label: "with Java highlighting, autocomplete and per-problem drafts.",
            },
            {
              value: "Compile and run",
              label: "against the sample tests you can see.",
            },
            {
              value: "Visible and hidden tests",
              label: "samples are shown; the graded set stays on the server.",
            },
            {
              value: "Fullscreen enforced",
              label: "with tab-switch and focus warnings.",
            },
          ]}
        />
      </div>

      <section
        aria-labelledby="contest-shared-rules"
        className="mt-8 rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-6 sm:p-7"
      >
        <h2
          id="contest-shared-rules"
          className="text-lg font-semibold tracking-[-0.02em] text-foreground"
        >
          How both modes work
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="flex gap-3">
            <MonitorPlay aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Fullscreen is mandatory</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Neither mode starts its clock until the browser is actually in
                fullscreen.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ListChecks aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Look away and you are warned</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Leaving fullscreen, switching tabs or blurring the window counts
                as a warning.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Clock3 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Timeout submits for you</p>
              <p className="mt-1 text-sm text-muted-foreground">
                When the clock runs out your work is submitted automatically and
                the exam closes.
              </p>
            </div>
          </div>
        </div>
        <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <FileQuestion aria-hidden="true" className="h-3.5 w-3.5" />
          {CODING_PROBLEM_COUNT} coding problems are currently published.
        </p>
      </section>
    </PageContainer>
  );
}

export default ContestLanding;
