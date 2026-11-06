import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Code2,
  Coffee,
  Map as MapIcon,
  Play,
  Route,
  StickyNote,
  Target,
  Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { practiceData } from "@/data/practiceData";
import { topics } from "@/data/topics";
import { javaTopics } from "@/data/javaTopics";
import { cn } from "@/lib/utils";

const RoadmapFullscreenOverlay = lazy(() =>
  import("@/components/roadmap/RoadmapFullscreenOverlay").then((module) => ({
    default: module.RoadmapFullscreenOverlay,
  })),
);

/**
 * Signed-in home. Replaces the marketing landing page that used to sit behind
 * the auth wall: the workspace opens on the learner's own numbers and the next
 * thing to do, not on a pitch they have already accepted.
 *
 * Everything numeric is read from the user's own rows in
 * `practice_problem_user_state`; there is no invented progress.
 */

interface PracticeRow {
  problem_id: string;
  is_completed: boolean;
  is_saved_for_revision: boolean;
  notes: string;
  updated_at: string;
}

const DAY_MS = 86_400_000;

/** Practice sheets are two levels deep: topic → subtopic → problems. */
const PRACTICE_PROBLEMS = practiceData.flatMap((topic) =>
  topic.subtopics.flatMap((subtopic) => subtopic.problems),
);
const PROBLEM_COUNT = PRACTICE_PROBLEMS.length;

function useHomeStats() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PracticeRow[]>([]);
  const [interviewCount, setInterviewCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRows([]);
      setInterviewCount(null);
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      const [{ data: practiceRows }, { data: javaRows }] = await Promise.all([
        supabase
          .from("practice_problem_user_state")
          .select(
            "problem_id, is_completed, is_saved_for_revision, notes, updated_at",
          )
          .eq("user_id", user.id),
        supabase
          .from("core_java_user_state")
          .select("question_id, is_completed")
          .eq("user_id", user.id),
      ]);
      if (!active) return;
      setRows((practiceRows ?? []) as PracticeRow[]);
      setInterviewCount(
        (javaRows ?? []).filter(
          (row: { is_completed: boolean }) => row.is_completed,
        ).length,
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  return { rows, interviewCount, loading };
}

function StatCell({
  label,
  value,
  suffix,
  hint,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  hint: string;
}) {
  return (
    <div className="px-4 py-4 first:pl-0">
      <p className="ws-eyebrow">{label}</p>
      <p className="mt-2 font-display text-[26px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
        {value}
        {suffix && (
          <span className="ml-0.5 font-mono text-[12px] font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </p>
      <p className="mt-2 text-[11.5px] leading-4 text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    to: "/practice",
    icon: Code2,
    label: "Practice problems",
    hint: `${PROBLEM_COUNT} curated problems`,
  },
  {
    to: "/playground",
    icon: Play,
    label: "Playground",
    hint: "Run Java, Python or C++ instantly",
  },
  {
    to: "/roadmap",
    icon: Route,
    label: "Roadmaps",
    hint: "Visual prerequisite graphs",
  },
  {
    to: "/interview",
    icon: Coffee,
    label: "Interview prep",
    hint: "Core Java, Spring Boot, system design",
  },
] as const;

export default function Index() {
  const { profile, user } = useAuth();
  const reduceMotion = useReducedMotion();
  const { rows, interviewCount, loading } = useHomeStats();
  const [roadmapOpen, setRoadmapOpen] = useState(false);

  const firstName =
    (profile?.display_name || user?.email || "there")
      .toString()
      .split(/[@\s]/)[0] ?? "there";

  const { solved, bookmarked, notes, activity, lastTouched } = useMemo(() => {
    const solvedSet = new Set(
      rows.filter((row) => row.is_completed).map((row) => row.problem_id),
    );
    const noteRows = rows.filter(
      (row) => row.notes && row.notes.trim().length > 0,
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = Array.from({ length: 14 }, () => 0);
    for (const row of rows) {
      if (!row.updated_at) continue;
      const day = Math.floor(
        (today.getTime() - new Date(row.updated_at).setHours(0, 0, 0, 0)) /
          DAY_MS,
      );
      if (day >= 0 && day < 14) buckets[13 - day] += 1;
    }
    const recent = [...rows]
      .filter((row) => row.updated_at)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )[0];
    return {
      solved: solvedSet,
      bookmarked: rows.filter((row) => row.is_saved_for_revision).length,
      notes: noteRows.length,
      activity: buckets,
      lastTouched: recent?.problem_id ?? null,
    };
  }, [rows]);

  const allProblems = useMemo(() => PRACTICE_PROBLEMS, []);

  const nextProblems = useMemo(
    () =>
      allProblems
        .filter((problem) => !solved.has(problem.id))
        .sort((a, b) => {
          const rank = { Easy: 0, Medium: 1, Hard: 2 };
          return rank[a.difficulty] - rank[b.difficulty];
        })
        .slice(0, 4),
    [allProblems, solved],
  );

  const resumeProblem = lastTouched
    ? allProblems.find((problem) => problem.id === lastTouched)
    : null;

  const peak = Math.max(1, ...activity);
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <div className="mx-auto w-full max-w-content px-5 pb-16 pt-8 sm:px-8">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="ws-eyebrow">Workspace · home</p>
            <h1 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-[-0.03em] sm:text-[30px]">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <CalendarDays size={12} aria-hidden="true" />
              {todayLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRoadmapOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line bg-[hsl(var(--surface-chrome))] px-3 text-[12.5px] font-medium text-foreground transition-colors duration-1 hover:bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MapIcon
                size={13}
                className="text-muted-foreground"
                aria-hidden="true"
              />
              Open roadmap
            </button>
            <Link
              to={
                resumeProblem
                  ? `/practice/solution/${resumeProblem.id}`
                  : "/practice"
              }
              className="group inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-3 text-[12.5px] font-semibold text-primary-foreground transition-[background-color,transform] duration-1 hover:bg-primary/90 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-page))]"
            >
              {resumeProblem ? "Resume last problem" : "Start practising"}
              <ArrowRight
                size={13}
                className="transition-transform duration-2 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </header>

        {/* ── Numbers ────────────────────────────────────────────── */}
        <section
          aria-labelledby="stats-heading"
          className="border-b border-line"
        >
          <h2 id="stats-heading" className="sr-only">
            Your progress
          </h2>
          <div className="grid grid-cols-2 divide-x divide-line/70 md:grid-cols-4">
            <StatCell
              label="Problems solved"
              value={loading ? "—" : solved.size}
              suffix={loading ? undefined : `/ ${allProblems.length}`}
              hint="Marked complete in the practice list"
            />
            <StatCell
              label="Bookmarked"
              value={loading ? "—" : bookmarked}
              hint="Saved for revision"
            />
            <StatCell
              label="Notes"
              value={loading ? "—" : notes}
              hint="Written on a problem"
            />
            <StatCell
              label="Interview Qs"
              value={loading ? "—" : (interviewCount ?? 0)}
              hint="Core Java questions completed"
            />
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
          {/* ── Next up ─────────────────────────────────────────── */}
          <section aria-labelledby="next-heading">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <h2
                id="next-heading"
                className="font-display text-[15px] font-medium"
              >
                Next up
              </h2>
              <Link
                to="/practice"
                className="inline-flex items-center gap-1 rounded-xs font-mono text-[10.5px] text-muted-foreground transition-colors duration-1 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                All problems
                <ArrowRight size={10} aria-hidden="true" />
              </Link>
            </div>

            {loading ? (
              <ul className="divide-y divide-line/60" aria-hidden="true">
                {[0, 1, 2, 3].map((index) => (
                  <li key={index} className="py-3.5">
                    <div className="skeleton-shimmer h-4 w-2/3 rounded-xs" />
                  </li>
                ))}
              </ul>
            ) : nextProblems.length === 0 ? (
              <div className="py-8">
                <Trophy size={18} className="text-accent" aria-hidden="true" />
                <p className="mt-3 text-[13.5px] text-foreground">
                  Every problem is marked complete.
                </p>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  Revisit the ones you bookmarked for revision.
                </p>
                <Link
                  to="/practice"
                  className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-sm border border-line px-2.5 text-[12px] font-medium transition-colors duration-1 hover:bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Open practice list
                  <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-line/60">
                {nextProblems.map((problem) => (
                  <li key={problem.id}>
                    <Link
                      to={`/practice/solution/${problem.id}`}
                      className="group flex items-center gap-3 py-3.5 focus-visible:outline-none"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-pill",
                          problem.difficulty === "Easy"
                            ? "bg-[hsl(var(--difficulty-easy))]"
                            : problem.difficulty === "Medium"
                              ? "bg-[hsl(var(--difficulty-medium))]"
                              : "bg-[hsl(var(--difficulty-hard))]",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] text-foreground transition-colors duration-1 group-hover:text-primary">
                          {problem.title}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 font-mono text-[10.5px] text-muted-foreground">
                          {problem.difficulty}
                          <span
                            aria-hidden="true"
                            className="text-muted-foreground/40"
                          >
                            ·
                          </span>
                          {problem.source.label}
                        </span>
                      </span>
                      <ArrowUpRight
                        size={13}
                        className="shrink-0 text-muted-foreground/80 transition-transform duration-2 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── Activity + quick actions ────────────────────────── */}
          <div className="space-y-8">
            <section aria-labelledby="activity-heading">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <h2
                  id="activity-heading"
                  className="font-display text-[15px] font-medium"
                >
                  Last 14 days
                </h2>
                <span className="font-mono text-[10.5px] text-muted-foreground">
                  {activity.reduce((sum, value) => sum + value, 0)} updates
                </span>
              </div>
              <div
                className="mt-4 flex h-16 items-end gap-1"
                role="img"
                aria-label="Problems updated per day over the last 14 days"
              >
                {activity.map((value, index) => (
                  <motion.span
                    key={index}
                    initial={
                      reduceMotion ? false : { scaleY: 0.2, opacity: 0.4 }
                    }
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{
                      duration: 0.32,
                      delay: reduceMotion ? 0 : index * 0.018,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      height: `${Math.max(6, (value / peak) * 100)}%`,
                      transformOrigin: "bottom",
                    }}
                    className={cn(
                      "flex-1 rounded-xs",
                      value === 0
                        ? "bg-[hsl(var(--surface-line-strong))]"
                        : "bg-primary/60",
                    )}
                  />
                ))}
              </div>
              <p className="mt-3 text-[11.5px] leading-4 text-muted-foreground">
                {rows.length === 0
                  ? "No practice history yet — completing a problem starts the chart."
                  : "Each bar counts problems you completed, bookmarked or noted that day."}
              </p>
            </section>

            <section aria-labelledby="actions-heading">
              <h2
                id="actions-heading"
                className="border-b border-line pb-2.5 font-display text-[15px] font-medium"
              >
                Jump back in
              </h2>
              <ul className="divide-y divide-line/60">
                {QUICK_ACTIONS.map((action) => (
                  <li key={action.to}>
                    <Link
                      to={action.to}
                      className="group flex items-center gap-3 py-3 focus-visible:outline-none"
                    >
                      <action.icon
                        size={14}
                        className="shrink-0 text-muted-foreground transition-colors duration-1 group-hover:text-primary"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] text-foreground transition-colors duration-1 group-hover:text-primary">
                          {action.label}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                          {action.hint}
                        </span>
                      </span>
                      <ArrowRight
                        size={12}
                        className="shrink-0 text-muted-foreground/80 transition-transform duration-2 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* ── Tracks ─────────────────────────────────────────────── */}
        <section aria-labelledby="tracks-heading" className="mt-12">
          <div className="flex items-end justify-between border-b border-line pb-2.5">
            <div>
              <h2
                id="tracks-heading"
                className="font-display text-[15px] font-medium"
              >
                All tracks
              </h2>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                {topics.length} DSA tracks · {javaTopics.length} Java topics ·
                practice sheets
              </p>
            </div>
            <BookOpen
              size={14}
              className="text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <ul className="mt-1 grid sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <li key={topic.id} className="border-b border-line/60">
                <Link
                  to={`/${topic.id}`}
                  className="group flex items-center justify-between gap-3 py-3 pr-2 focus-visible:outline-none"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="w-4 shrink-0 text-center font-mono text-[11px] text-muted-foreground/80"
                    >
                      {topic.icon}
                    </span>
                    <span className="truncate text-[13px] text-foreground transition-colors duration-1 group-hover:text-primary">
                      {topic.title}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground/80">
                    {topic.subtopics.length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
            <Link
              to="/practice"
              className="inline-flex items-center gap-1.5 rounded-xs text-muted-foreground underline-offset-4 transition-colors duration-1 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Target size={12} aria-hidden="true" />
              Practice sheets
            </Link>
            <Link
              to="/contest"
              className="inline-flex items-center gap-1.5 rounded-xs text-muted-foreground underline-offset-4 transition-colors duration-1 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <StickyNote size={12} aria-hidden="true" />
              Contest practice
            </Link>
            <Link
              to="/notes"
              className="inline-flex items-center gap-1.5 rounded-xs text-muted-foreground underline-offset-4 transition-colors duration-1 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BookOpen size={12} aria-hidden="true" />
              My notes
            </Link>
          </div>
        </section>
      </div>

      {roadmapOpen && (
        <Suspense
          fallback={
            <div
              role="status"
              aria-live="polite"
              className="fixed bottom-6 left-1/2 z-modal -translate-x-1/2 rounded-sm border border-line bg-[hsl(var(--surface-panel))] px-4 py-2 text-[12.5px] shadow-overlay"
            >
              Loading your roadmap…
            </div>
          }
        >
          <RoadmapFullscreenOverlay
            open={roadmapOpen}
            onClose={() => setRoadmapOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
