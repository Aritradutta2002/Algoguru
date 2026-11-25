"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { practiceData } from "@/data/practiceData";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Loader2,
  StickyNote,
  TrendingUp,
  Target,
  Code2,
  Layers,
  Sparkles,
  ArrowRight,
  Search,
  X,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DraggableNoteEditor } from "@/components/DraggableNoteEditor";
import { AppTooltip } from "@/components/ui/tooltip";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";

type CelebrationParticle = {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotate: number;
};
type CelebrationBurst = {
  id: number;
  x: number;
  y: number;
  particles: CelebrationParticle[];
};

const CELEBRATION_COLORS = [
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#eab308",
  "#10b981",
];
const CELEBRATION_PARTICLE_COUNT = 18;

function toProblemSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function PracticeView() {
  const { user } = useAuth();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [savedForRevision, setSavedForRevision] = useState<Set<string>>(
    new Set(),
  );
  const [notesByProblem, setNotesByProblem] = useState<Record<string, string>>(
    {},
  );
  const [loadingState, setLoadingState] = useState(false);
  const [upsertingProblemId, setUpsertingProblemId] = useState<string | null>(
    null,
  );
  const [savingNotesFor, setSavingNotesFor] = useState<Record<string, boolean>>(
    {},
  );
  const [, setSavedNotesFor] = useState<Record<string, boolean>>({});
  const [openSubtopicId, setOpenSubtopicId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [celebrationBursts, setCelebrationBursts] = useState<
    CelebrationBurst[]
  >([]);
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<
    "all" | "Easy" | "Medium" | "Hard"
  >("all");
  const [onlyUnsolved, setOnlyUnsolved] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const celebrationIdRef = useRef(0);
  const noteSaveFeedbackTimersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const timers = noteSaveFeedbackTimersRef.current;
    return () => {
      Object.values(timers).forEach((timer) => window.clearTimeout(timer));
      noteSaveFeedbackTimersRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setCompleted(new Set());
      setSavedForRevision(new Set());
      setNotesByProblem({});
      return;
    }
    let mounted = true;
    const load = async () => {
      setLoadingState(true);
      const { data, error } = await supabase
        .from("practice_problem_user_state")
        .select("problem_id, notes, is_completed, is_saved_for_revision")
        .eq("user_id", user.id);
      if (!mounted) return;
      if (error) {
        toast({
          title: "Load failed",
          description: error.message,
          variant: "destructive",
        });
        setLoadingState(false);
        return;
      }
      const c = new Set<string>(),
        r = new Set<string>(),
        n: Record<string, string> = {};
      for (const row of data ?? []) {
        if (row.is_completed) c.add(row.problem_id);
        if (row.is_saved_for_revision) r.add(row.problem_id);
        if (row.notes) n[row.problem_id] = row.notes;
      }
      setCompleted(c);
      setSavedForRevision(r);
      setNotesByProblem(n);
      setLoadingState(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const upsertUserState = async (
    problemId: string,
    patch: Partial<{
      notes: string;
      is_completed: boolean;
      is_saved_for_revision: boolean;
    }>,
  ) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "Login is required to save progress.",
        variant: "destructive",
      });
      return false;
    }
    const { error } = await supabase
      .from("practice_problem_user_state")
      .upsert(
        { user_id: user.id, problem_id: problemId, ...patch },
        { onConflict: "user_id,problem_id" },
      );
    if (error) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const triggerCompletionCelebration = (problemId: string) => {
    const el = document.getElementById(problemId);
    const r = el?.getBoundingClientRect();
    const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
    const y = r
      ? r.top + r.height / 2
      : Math.min(window.innerHeight * 0.35, 240);
    celebrationIdRef.current += 1;
    const burstId = celebrationIdRef.current;
    const particles: CelebrationParticle[] = Array.from(
      { length: CELEBRATION_PARTICLE_COUNT },
      (_, i) => {
        const a = (Math.PI * 2 * i) / CELEBRATION_PARTICLE_COUNT;
        const s = 60 + Math.random() * 80;
        return {
          x: Math.cos(a) * s,
          y: Math.sin(a) * s - (30 + Math.random() * 30),
          size: 5 + Math.round(Math.random() * 4),
          color: CELEBRATION_COLORS[i % CELEBRATION_COLORS.length],
          delay: Math.random() * 0.08,
          duration: 0.65 + Math.random() * 0.45,
          rotate: Math.random() * 540 - 270,
        };
      },
    );
    setCelebrationBursts((prev) => [...prev, { id: burstId, x, y, particles }]);
    window.setTimeout(
      () =>
        setCelebrationBursts((prev) => prev.filter((b) => b.id !== burstId)),
      1300,
    );
  };

  const toggleProblem = async (id: string) => {
    const cur = completed.has(id);
    const next = !cur;
    setCompleted((prev) => {
      const n = new Set(prev);
      if (next) n.add(id);
      else n.delete(id);
      return n;
    });
    setUpsertingProblemId(id);
    const ok = await upsertUserState(id, { is_completed: next });
    setUpsertingProblemId(null);
    if (!ok) {
      setCompleted((prev) => {
        const r = new Set(prev);
        if (cur) r.add(id);
        else r.delete(id);
        return r;
      });
      return;
    }
    if (next) triggerCompletionCelebration(id);
  };

  const toggleSaveForRevision = async (id: string) => {
    const cur = savedForRevision.has(id);
    const next = !cur;
    setSavedForRevision((prev) => {
      const n = new Set(prev);
      if (next) n.add(id);
      else n.delete(id);
      return n;
    });
    setUpsertingProblemId(id);
    const ok = await upsertUserState(id, { is_saved_for_revision: next });
    setUpsertingProblemId(null);
    if (!ok) {
      setSavedForRevision((prev) => {
        const r = new Set(prev);
        if (cur) r.add(id);
        else r.delete(id);
        return r;
      });
      return;
    }
    toast({ title: next ? "Saved for revision" : "Removed from revision" });
  };

  const saveNotes = async (id: string, nextNotes: string) => {
    const trimmed = nextNotes.trim();
    setSavedNotesFor((prev) => ({ ...prev, [id]: false }));
    setSavingNotesFor((prev) => ({ ...prev, [id]: true }));
    const ok = await upsertUserState(
      id,
      trimmed.length > 0
        ? { notes: nextNotes, is_saved_for_revision: true }
        : { notes: nextNotes },
    );
    setSavingNotesFor((prev) => ({ ...prev, [id]: false }));
    if (ok) {
      setNotesByProblem((prev) => {
        if (!trimmed.length) {
          const n = { ...prev };
          delete n[id];
          return n;
        }
        return { ...prev, [id]: nextNotes };
      });
      if (trimmed.length > 0) {
        setSavedForRevision((prev) => {
          const n = new Set(prev);
          n.add(id);
          return n;
        });
      }
      setSavedNotesFor((prev) => ({ ...prev, [id]: true }));
      if (noteSaveFeedbackTimersRef.current[id]) {
        window.clearTimeout(noteSaveFeedbackTimersRef.current[id]);
      }
      noteSaveFeedbackTimersRef.current[id] = window.setTimeout(() => {
        setSavedNotesFor((prev) => ({ ...prev, [id]: false }));
        delete noteSaveFeedbackTimersRef.current[id];
      }, 2200);
      toast({ title: trimmed.length > 0 ? "Notes saved" : "Notes cleared" });
    }
  };

  const openNotesPopup = (id: string) => {
    setNoteDraft(notesByProblem[id] ?? "");
    setSavedNotesFor((prev) => ({ ...prev, [id]: false }));
    setActiveNoteId(id);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "bg-success/10 text-success border-success/30";
      case "Medium":
        return "bg-warning/10 text-warning border-warning/30";
      case "Hard":
        return "bg-destructive/10 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const totalProblems = useMemo(
    () =>
      practiceData.reduce(
        (acc, t) =>
          acc + t.subtopics.reduce((a, s) => a + s.problems.length, 0),
        0,
      ),
    [],
  );
  const solvedCount = completed.size;
  const progressPct = totalProblems
    ? Math.round((solvedCount / totalProblems) * 100)
    : 0;

  const filteredTopics = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return practiceData
      .map((topic) => {
        const subtopics = topic.subtopics
          .map((subtopic) => ({
            ...subtopic,
            problems: subtopic.problems.filter((problem) => {
              const matchesQuery =
                !normalizedQuery ||
                problem.title.toLowerCase().includes(normalizedQuery) ||
                problem.companies.some((company) =>
                  company.toLowerCase().includes(normalizedQuery),
                );
              const matchesDifficulty =
                difficultyFilter === "all" ||
                problem.difficulty === difficultyFilter;
              const matchesUnsolved = !onlyUnsolved || !completed.has(problem.id);
              const matchesSaved =
                !onlySaved || savedForRevision.has(problem.id);
              return (
                matchesQuery &&
                matchesDifficulty &&
                matchesUnsolved &&
                matchesSaved
              );
            }),
          }))
          .filter((subtopic) => subtopic.problems.length > 0);
        return { ...topic, subtopics };
      })
      .filter((topic) => topic.subtopics.length > 0);
  }, [completed, difficultyFilter, onlySaved, onlyUnsolved, query, savedForRevision]);

  const filteredProblemCount = useMemo(
    () =>
      filteredTopics.reduce(
        (total, topic) =>
          total +
          topic.subtopics.reduce(
            (subtotal, subtopic) => subtotal + subtopic.problems.length,
            0,
          ),
        0,
      ),
    [filteredTopics],
  );

  const hasActiveFilters =
    query.trim().length > 0 ||
    difficultyFilter !== "all" ||
    onlyUnsolved ||
    onlySaved;

  const clearFilters = () => {
    setQuery("");
    setDifficultyFilter("all");
    setOnlyUnsolved(false);
    setOnlySaved(false);
  };

  return (
    <div className="min-h-screen bg-obsidian-void text-foreground">
      <section className="relative border-b border-obsidian-border bg-obsidian-void">
        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 md:py-14">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="lp-kicker mb-3">
                <TrendingUp size={12} className="inline mr-1" /> Master data structures &amp; algorithms
              </p>
              <h1 className="text-3xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-4xl md:text-5xl text-foreground">
                Master code. Ace interviews.
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
                Curated by pattern — Array, String, Binary Search, Stack, Linked
                List, Heap, Tree &amp; more. Track progress, save notes, and solve
                with editorial.
              </p>
              {loadingState && (
                <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={13} className="animate-spin" /> Syncing your progress…
                </div>
              )}
            </div>

            <Card className="w-full shrink-0 rounded-[0.875rem] border-obsidian-border bg-obsidian-pane shadow-none lg:w-[360px]">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Target size={14} className="text-primary" /> Your progress
                    </div>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                      {progressPct}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {solvedCount} of {totalProblems} problems solved
                    </p>
                  </div>
                  <ProgressRing
                    value={progressPct}
                    size={76}
                    label={`${progressPct}% of practice problems completed`}
                  >
                    <Target size={18} className="text-primary" />
                  </ProgressRing>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-obsidian-elevated">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md border border-obsidian-border bg-obsidian-elevated p-2">
                    <div className="text-[11px] font-medium text-muted-foreground">
                      Solved
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                      {solvedCount}
                    </div>
                  </div>
                  <div className="rounded-md border border-obsidian-border bg-obsidian-elevated p-2">
                    <div className="text-[11px] font-medium text-muted-foreground">
                      Saved
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                      {savedForRevision.size}
                    </div>
                  </div>
                  <div className="rounded-md border border-primary/30 bg-primary/10 p-2">
                    <div className="text-[11px] font-medium text-primary">
                      Remaining
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-primary tabular-nums">
                      {totalProblems - solvedCount}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 md:py-10">
        <div className="sticky top-0 z-20 -mx-5 mb-8 border-b border-obsidian-border bg-obsidian-void/90 px-5 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search problems or companies…"
                aria-label="Search problems or companies"
                className="h-10 w-full rounded-lg border-obsidian-border bg-obsidian-pane pl-9 pr-9 text-[13px] text-foreground shadow-none placeholder:text-muted-foreground/60 hover:border-obsidian-border focus-visible:border-foreground/30 focus-visible:bg-obsidian-elevated focus-visible:ring-0 md:text-[13px]"
              />
              {query.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md text-muted-foreground/60 hover:bg-obsidian-elevated hover:text-foreground"
                >
                  <X size={13} />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(["all", "Easy", "Medium", "Hard"] as const).map((level) => (
                <Button
                  key={level}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDifficultyFilter(level)}
                  aria-pressed={difficultyFilter === level}
                  className={cn(
                    "h-8 rounded-lg border-obsidian-border px-3 text-[11.5px] font-medium",
                    difficultyFilter === level
                      ? "bg-foreground/[0.08] text-foreground hover:bg-foreground/[0.1]"
                      : "bg-obsidian-pane text-muted-foreground hover:bg-obsidian-elevated hover:text-foreground",
                  )}
                >
                  {level === "all" ? "All levels" : level}
                </Button>
              ))}

              <span
                className="mx-1 hidden h-5 w-px bg-obsidian-border sm:block"
                aria-hidden="true"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOnlyUnsolved((value) => !value)}
                aria-pressed={onlyUnsolved}
                className={cn(
                  "h-8 gap-1.5 rounded-lg border-obsidian-border px-3 text-[11.5px] font-medium",
                  onlyUnsolved
                    ? "bg-foreground/[0.08] text-foreground hover:bg-foreground/[0.1]"
                    : "bg-obsidian-pane text-muted-foreground hover:bg-obsidian-elevated hover:text-foreground",
                )}
              >
                <CheckCircle2 size={12} />
                Unsolved
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOnlySaved((value) => !value)}
                aria-pressed={onlySaved}
                className={cn(
                  "h-8 gap-1.5 rounded-lg border-obsidian-border px-3 text-[11.5px] font-medium",
                  onlySaved
                    ? "bg-foreground/[0.08] text-foreground hover:bg-foreground/[0.1]"
                    : "bg-obsidian-pane text-muted-foreground hover:bg-obsidian-elevated hover:text-foreground",
                )}
              >
                <Sparkles size={12} />
                Saved
              </Button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-[10.5px] text-muted-foreground">
            <span>
              Showing{" "}
              <span className="font-semibold text-foreground/80">
                {filteredProblemCount}
              </span>{" "}
              of {totalProblems} problems
            </span>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto gap-1 rounded-md px-1.5 py-1 text-[10.5px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <RotateCcw size={10} />
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-12">
          {filteredTopics.map((topic) => {
            const sourceTopic =
              practiceData.find((item) => item.id === topic.id) ?? topic;
            const topicTotal = sourceTopic.subtopics.reduce(
              (a, s) => a + s.problems.length,
              0,
            );
            const topicSolved = sourceTopic.subtopics.reduce(
              (a, s) =>
                a + s.problems.filter((p) => completed.has(p.id)).length,
              0,
            );
            const topicPct = topicTotal
              ? Math.round((topicSolved / topicTotal) * 100)
              : 0;
            return (
              <div key={topic.id} className="space-y-5">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-obsidian-border pb-4">
                  <div className="flex items-start gap-4">
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-obsidian-border bg-obsidian-pane text-muted-foreground md:flex">
                      <Layers size={18} />
                    </div>
                    <div>
                      <h2 className="flex items-center gap-3 text-xl font-semibold tracking-[-0.02em] text-foreground">
                        {topic.title}
                        <Badge
                          variant="outline"
                          className="hidden border-obsidian-border bg-foreground/[0.04] px-2 py-0.5 text-[11px] font-medium text-muted-foreground md:inline-flex"
                        >
                          {topicSolved}/{topicTotal}
                        </Badge>
                      </h2>
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground max-w-3xl">
                        {topic.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                      <Code2 size={13} className="text-muted-foreground" />{" "}
                      {topicPct}% done
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1">
                  {topic.subtopics.map((sub) => {
                    const sourceSub =
                      sourceTopic.subtopics.find(
                        (item) => item.id === sub.id,
                      ) ?? sub;
                    const total = sourceSub.problems.length;
                    const done = sourceSub.problems.filter((p) =>
                      completed.has(p.id),
                    ).length;
                    const progress = total ? (done / total) * 100 : 0;
                    const isDone = done === total && total > 0;
                    return (
                      <Card
                        key={sub.id}
                        className="group flex flex-col overflow-hidden rounded-[0.875rem] border-obsidian-border bg-obsidian-pane shadow-none transition-all duration-200 hover:bg-obsidian-elevated/40"
                      >
                        <div
                          className={`h-0.5 w-full ${isDone ? "bg-emerald-500" : "bg-obsidian-border"}`}
                        />
                        <Accordion
                          type="single"
                          collapsible
                          value={
                            openSubtopicId === sub.id ? sub.id : undefined
                          }
                          onValueChange={(v) =>
                            setOpenSubtopicId(v === sub.id ? sub.id : null)
                          }
                          className="w-full"
                        >
                          <AccordionItem value={sub.id} className="border-none">
                            <AccordionTrigger className="hover:no-underline px-6 py-5 group/trigger">
                              <div className="flex flex-col items-start text-left gap-2.5 w-full pr-2">
                                <div className="flex items-center justify-between w-full gap-3">
                                  <h3 className="text-base font-semibold tracking-tight text-foreground transition-colors line-clamp-1">
                                    {sub.title}
                                  </h3>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "shrink-0 px-2.5 py-0.5 text-xs font-medium",
                                      isDone
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                        : "bg-obsidian-elevated border-obsidian-border text-muted-foreground",
                                    )}
                                  >
                                    {isDone && <CheckCircle2 size={12} />}{" "}
                                    {done}/{total}
                                  </Badge>
                                </div>
                                <p className="text-sm leading-6 text-muted-foreground line-clamp-2 max-w-[95%]">
                                  {sub.description}
                                </p>
                                <div className="w-full h-1.5 bg-obsidian-elevated rounded-full overflow-hidden mt-2">
                                  <motion.div
                                    className={`h-full ${isDone ? "bg-emerald-500" : "bg-foreground/50"}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                  />
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-5 pt-0 sm:px-6">
                              <div className="overflow-hidden rounded-lg border border-obsidian-border bg-obsidian-pane">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-obsidian-border bg-obsidian-elevated/50 hover:bg-obsidian-elevated/50">
                                      <TableHead className="w-11 px-3 text-xs">
                                        Done
                                      </TableHead>
                                      <TableHead className="px-3 text-xs">
                                        Problem
                                      </TableHead>
                                      <TableHead className="hidden md:table-cell px-3 text-xs">
                                        Companies
                                      </TableHead>
                                      <TableHead className="w-24 px-3 text-xs">
                                        Difficulty
                                      </TableHead>
                                      <TableHead className="px-3 text-right text-xs">
                                        Actions
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sub.problems.map((prob) => {
                                      const checked = completed.has(prob.id);
                                      const isRevisionSaved =
                                        savedForRevision.has(prob.id);
                                      const isSavingNotes =
                                        savingNotesFor[prob.id] ?? false;
                                      const hasNotes =
                                        (
                                          notesByProblem[prob.id] ?? ""
                                        ).trim().length > 0;
                                      const rowBusy =
                                        upsertingProblemId === prob.id;
                                      return (
                                        <TableRow
                                          key={prob.id}
                                          className={cn(
                                            "border-obsidian-border transition-colors",
                                            checked
                                              ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                                              : "hover:bg-obsidian-elevated/70",
                                          )}
                                        >
                                          <TableCell className="w-11 px-3 py-3 align-middle">
                                            <Checkbox
                                              id={prob.id}
                                              checked={checked}
                                              onCheckedChange={() =>
                                                void toggleProblem(prob.id)
                                              }
                                              className="h-4 w-4 rounded border-obsidian-border data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 shrink-0"
                                            />
                                          </TableCell>
                                          <TableCell className="px-3 py-3 align-middle min-w-[180px]">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <label
                                                htmlFor={prob.id}
                                                className={cn(
                                                  "text-sm font-medium cursor-pointer select-none leading-5",
                                                  checked
                                                    ? "text-muted-foreground line-through"
                                                    : "text-foreground",
                                                )}
                                              >
                                                {prob.title}
                                              </label>
                                              {checked && (
                                                <CheckCircle2
                                                  size={14}
                                                  className="text-emerald-400 shrink-0 hidden sm:inline"
                                                />
                                              )}
                                              {rowBusy && (
                                                <Loader2
                                                  size={13}
                                                  className="animate-spin text-muted-foreground shrink-0"
                                                />
                                              )}
                                            </div>
                                            {prob.companies.length > 0 && (
                                              <div className="mt-1.5 flex flex-wrap gap-1 md:hidden">
                                                {prob.companies
                                                  .slice(0, 3)
                                                  .map((c) => (
                                                    <Badge
                                                      key={`${prob.id}-m-${c}`}
                                                      variant="secondary"
                                                      className="border border-obsidian-border bg-obsidian-elevated px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
                                                    >
                                                      {c}
                                                    </Badge>
                                                  ))}
                                              </div>
                                            )}
                                          </TableCell>
                                          <TableCell className="hidden md:table-cell px-3 py-3 align-middle">
                                            <div className="flex flex-wrap items-center gap-1">
                                              {prob.companies
                                                .slice(0, 4)
                                                .map((c) => (
                                                  <Badge
                                                    key={`${prob.id}-${c}`}
                                                    variant="secondary"
                                                    className="border border-obsidian-border bg-obsidian-elevated px-2 py-0.5 text-[11px] font-normal text-muted-foreground"
                                                  >
                                                    {c}
                                                  </Badge>
                                                ))}
                                              {prob.companies.length > 4 && (
                                                <span className="text-xs text-muted-foreground">
                                                  +{prob.companies.length - 4}
                                                </span>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell className="px-3 py-3 align-middle">
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                "text-xs font-medium",
                                                getDifficultyColor(
                                                  prob.difficulty,
                                                ),
                                              )}
                                            >
                                              {prob.difficulty}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="px-3 py-3 align-middle">
                                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                                              <AppTooltip content="LeetCode">
                                                <Button
                                                  asChild
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-7 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                                                >
                                                  <a
                                                    href={prob.leetcodeLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                  >
                                                    LC
                                                  </a>
                                                </Button>
                                              </AppTooltip>
                                              <AppTooltip content="GeeksforGeeks">
                                                <Button
                                                  asChild
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-7 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                                                >
                                                  <a
                                                    href={prob.gfgLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                  >
                                                    GFG
                                                  </a>
                                                </Button>
                                              </AppTooltip>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  openNotesPopup(prob.id)
                                                }
                                                disabled={isSavingNotes}
                                                className={cn(
                                                  "h-7 gap-1 px-2.5 text-xs font-medium",
                                                  hasNotes
                                                    ? "bg-foreground/[0.08] text-foreground"
                                                    : "text-muted-foreground hover:text-foreground",
                                                )}
                                              >
                                                {isSavingNotes ? (
                                                  <Loader2
                                                    size={12}
                                                    className="animate-spin"
                                                  />
                                                ) : (
                                                  <StickyNote size={12} />
                                                )}
                                                {hasNotes
                                                  ? "Edit note"
                                                  : "Add note"}
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  void toggleSaveForRevision(
                                                    prob.id,
                                                  )
                                                }
                                                className={cn(
                                                  "h-7 gap-1 px-2.5 text-xs font-medium",
                                                  isRevisionSaved
                                                    ? "bg-foreground/[0.08] text-foreground"
                                                    : "text-muted-foreground hover:text-foreground",
                                                )}
                                              >
                                                <Sparkles size={12} />
                                                {isRevisionSaved
                                                  ? "Saved"
                                                  : "Save"}
                                              </Button>
                                              <Button
                                                asChild
                                                size="sm"
                                                className="h-7 gap-1 px-3 text-xs font-medium"
                                              >
                                                <Link
                                                  href={`/practice/solution/${prob.id}/${toProblemSlug(prob.title)}`}
                                                >
                                                  Solution{" "}
                                                  <ArrowRight size={12} />
                                                </Link>
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredTopics.length === 0 && (
            <Card className="flex flex-col items-center justify-center rounded-[0.875rem] border-dashed border-obsidian-border bg-obsidian-pane px-6 py-14 text-center shadow-none">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-obsidian-border bg-obsidian-elevated text-muted-foreground">
                <Search size={18} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                No problems match those filters
              </h3>
              <p className="mt-1.5 max-w-sm text-xs leading-5 text-muted-foreground">
                Try a shorter search, a different difficulty, or clear the
                saved/unsolved filters.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4 gap-1.5 bg-obsidian-elevated text-xs font-medium"
              >
                <RotateCcw size={12} />
                Clear filters
              </Button>
            </Card>
          )}
        </div>
      </div>

      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {celebrationBursts.map((burst) => (
          <div
            key={burst.id}
            className="absolute"
            style={{ left: `${burst.x}px`, top: `${burst.y}px` }}
          >
            {burst.particles.map((p, i) => (
              <motion.span
                key={`${burst.id}-${i}`}
                className="absolute rounded-sm"
                style={{
                  backgroundColor: p.color,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  opacity: 0,
                  scale: 0.3,
                  rotate: p.rotate,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: "easeOut",
                }}
              />
            ))}
            <motion.div
              className="absolute -left-7 -top-7 h-14 w-14 rounded-full border-2 border-amber-500/50"
              initial={{ scale: 0.25, opacity: 0.85 }}
              animate={{ scale: 1.7, opacity: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {activeNoteId && (
          <DraggableNoteEditor
            questionTitle={
              practiceData
                .flatMap((t) => t.subtopics)
                .flatMap((s) => s.problems)
                .find((p) => p.id === activeNoteId)?.title ?? "Note"
            }
            value={noteDraft}
            onChange={setNoteDraft}
            onClose={() => setActiveNoteId(null)}
            onSave={() => void saveNotes(activeNoteId, noteDraft)}
            isSaving={savingNotesFor[activeNoteId] ?? false}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
