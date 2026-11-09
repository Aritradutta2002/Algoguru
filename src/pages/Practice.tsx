import { useEffect, useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { practiceData } from "../data/practiceData";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

type CelebrationParticle = { x: number; y: number; size: number; color: string; delay: number; duration: number; rotate: number };
type CelebrationBurst = { id: number; x: number; y: number; particles: CelebrationParticle[] };

const CELEBRATION_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#eab308", "#10b981"];
const CELEBRATION_PARTICLE_COUNT = 18;

const TOPIC_ACCENTS: Record<string, { bg: string; text: string; border: string; soft: string }> = {
  array: { bg: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200", soft: "bg-blue-50 dark:bg-blue-950/30" },
  strings: { bg: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200", soft: "bg-emerald-50 dark:bg-emerald-950/30" },
  "binary-search": { bg: "bg-blue-400", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200", soft: "bg-blue-50 dark:bg-blue-950/30" },
  stack: { bg: "bg-purple-500", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200", soft: "bg-purple-50 dark:bg-purple-950/30" },
  "linked-list": { bg: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", border: "border-rose-200", soft: "bg-rose-50 dark:bg-rose-950/30" },
  "double-linked-list": { bg: "bg-pink-500", text: "text-pink-600 dark:text-pink-400", border: "border-pink-200", soft: "bg-pink-50 dark:bg-pink-950/30" },
  hashmap: { bg: "bg-cyan-500", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-200", soft: "bg-cyan-50 dark:bg-cyan-950/30" },
  heap: { bg: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-200", soft: "bg-indigo-50 dark:bg-indigo-950/30" },
  recursion: { bg: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200", soft: "bg-blue-50 dark:bg-blue-950/30" },
  tree: { bg: "bg-teal-500", text: "text-teal-600 dark:text-teal-400", border: "border-teal-200", soft: "bg-teal-50 dark:bg-teal-950/30" },
  "binary-search-tree": { bg: "bg-lime-600", text: "text-lime-700 dark:text-lime-300", border: "border-lime-200", soft: "bg-lime-50 dark:bg-lime-950/30" },
  graph: { bg: "bg-sky-600", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200", soft: "bg-sky-50 dark:bg-sky-950/30" },
  backtracking: { bg: "bg-fuchsia-500", text: "text-fuchsia-600 dark:text-fuchsia-400", border: "border-fuchsia-200", soft: "bg-fuchsia-50 dark:bg-fuchsia-950/30" },
  greedy: { bg: "bg-yellow-500", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-200", soft: "bg-yellow-50 dark:bg-yellow-950/30" },
  "dynamic-programming": { bg: "bg-violet-600", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200", soft: "bg-violet-50 dark:bg-violet-950/30" },
  trie: { bg: "bg-emerald-600", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200", soft: "bg-emerald-50 dark:bg-emerald-950/30" },
  "bit-manipulation": { bg: "bg-slate-600", text: "text-slate-700 dark:text-slate-300", border: "border-slate-200", soft: "bg-slate-50 dark:bg-slate-900/30" },
};

function toProblemSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

export default function Practice() {
  const { user } = useAuth();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [savedForRevision, setSavedForRevision] = useState<Set<string>>(new Set());
  const [notesByProblem, setNotesByProblem] = useState<Record<string, string>>({});
  const [loadingState, setLoadingState] = useState(false);
  const [upsertingProblemId, setUpsertingProblemId] = useState<string | null>(null);
  const [savingNotesFor, setSavingNotesFor] = useState<Record<string, boolean>>({});
  const [savedNotesFor, setSavedNotesFor] = useState<Record<string, boolean>>({});
  const [openSubtopicId, setOpenSubtopicId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [celebrationBursts, setCelebrationBursts] = useState<CelebrationBurst[]>([]);
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "Easy" | "Medium" | "Hard">("all");
  const [onlyUnsolved, setOnlyUnsolved] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const celebrationIdRef = useRef(0);
  const noteSaveFeedbackTimersRef = useRef<Record<string, number | ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    return () => {
      Object.values(noteSaveFeedbackTimersRef.current).forEach((timer) => window.clearTimeout(timer));
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
      const { data, error } = await supabase.from("practice_problem_user_state").select("problem_id, notes, is_completed, is_saved_for_revision").eq("user_id", user.id);
      if (!mounted) return;
      if (error) {
        toast({ title: "Load failed", description: error.message, variant: "destructive" });
        setLoadingState(false);
        return;
      }
      const c = new Set<string>(), r = new Set<string>(), n: Record<string, string> = {};
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
    load();
    return () => { mounted = false; };
  }, [user]);

  const upsertUserState = async (problemId: string, patch: Partial<{ notes: string; is_completed: boolean; is_saved_for_revision: boolean }>) => {
    if (!user) { toast({ title: "Please sign in", description: "Login is required to save progress.", variant: "destructive" }); return false; }
    const { error } = await supabase.from("practice_problem_user_state").upsert({ user_id: user.id, problem_id: problemId, ...patch }, { onConflict: "user_id,problem_id" });
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return false; }
    return true;
  };

  const toggleProblem = async (id: string) => {
    const cur = completed.has(id);
    const next = !cur;
    setCompleted((prev) => { const n = new Set(prev); if (next) n.add(id); else n.delete(id); return n; });
    setUpsertingProblemId(id);
    const ok = await upsertUserState(id, { is_completed: next });
    setUpsertingProblemId(null);
    if (!ok) { setCompleted((prev) => { const r = new Set(prev); if (cur) r.add(id); else r.delete(id); return r; }); return; }
    if (next) triggerCompletionCelebration(id);
  };

  const toggleSaveForRevision = async (id: string) => {
    const cur = savedForRevision.has(id);
    const next = !cur;
    setSavedForRevision((prev) => { const n = new Set(prev); if (next) n.add(id); else n.delete(id); return n; });
    setUpsertingProblemId(id);
    const ok = await upsertUserState(id, { is_saved_for_revision: next });
    setUpsertingProblemId(null);
    if (!ok) { setSavedForRevision((prev) => { const r = new Set(prev); if (cur) r.add(id); else r.delete(id); return r; }); return; }
    toast({ title: next ? "Saved for revision" : "Removed from revision" });
  };

  const saveNotes = async (id: string, nextNotes: string) => {
    const trimmed = nextNotes.trim();
    setSavedNotesFor((prev) => ({ ...prev, [id]: false }));
    setSavingNotesFor((prev) => ({ ...prev, [id]: true }));
    const ok = await upsertUserState(id, trimmed.length > 0 ? { notes: nextNotes, is_saved_for_revision: true } : { notes: nextNotes });
    setSavingNotesFor((prev) => ({ ...prev, [id]: false }));
    if (ok) {
      setNotesByProblem((prev) => { if (!trimmed.length) { const n = { ...prev }; delete n[id]; return n; } return { ...prev, [id]: nextNotes }; });
      if (trimmed.length > 0) setSavedForRevision((prev) => { const n = new Set(prev); n.add(id); return n; });
      setSavedNotesFor((prev) => ({ ...prev, [id]: true }));
      if (noteSaveFeedbackTimersRef.current[id]) window.clearTimeout(noteSaveFeedbackTimersRef.current[id]);
      noteSaveFeedbackTimersRef.current[id] = window.setTimeout(() => { setSavedNotesFor((prev) => ({ ...prev, [id]: false })); delete noteSaveFeedbackTimersRef.current[id]; }, 2200);
      toast({ title: trimmed.length > 0 ? "Notes saved" : "Notes cleared" });
    }
  };

  const triggerCompletionCelebration = (problemId: string) => {
    const el = document.getElementById(problemId);
    const r = el?.getBoundingClientRect();
    const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
    const y = r ? r.top + r.height / 2 : Math.min(window.innerHeight * 0.35, 240);
    celebrationIdRef.current += 1;
    const burstId = celebrationIdRef.current;
    const particles: CelebrationParticle[] = Array.from({ length: CELEBRATION_PARTICLE_COUNT }, (_, i) => {
      const a = (Math.PI * 2 * i) / CELEBRATION_PARTICLE_COUNT;
      const s = 60 + Math.random() * 80;
      return { x: Math.cos(a) * s, y: Math.sin(a) * s - (30 + Math.random() * 30), size: 5 + Math.round(Math.random() * 4), color: CELEBRATION_COLORS[i % CELEBRATION_COLORS.length], delay: Math.random() * 0.08, duration: 0.65 + Math.random() * 0.45, rotate: Math.random() * 540 - 270 };
    });
    setCelebrationBursts((prev) => [...prev, { id: burstId, x, y, particles }]);
    window.setTimeout(() => setCelebrationBursts((prev) => prev.filter((b) => b.id !== burstId)), 1300);
  };

  const openNotesPopup = (id: string) => {
    setNoteDraft(notesByProblem[id] ?? "");
    setSavedNotesFor((prev) => ({ ...prev, [id]: false }));
    setActiveNoteId(id);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy": return "bg-success/10 text-success border-success/30";
      case "Medium": return "bg-warning/10 text-warning border-warning/30";
      case "Hard": return "bg-destructive/10 text-destructive border-destructive/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const totalProblems = useMemo(() => practiceData.reduce((acc, t) => acc + t.subtopics.reduce((a, s) => a + s.problems.length, 0), 0), []);
  const solvedCount = completed.size;
  const progressPct = totalProblems ? Math.round((solvedCount / totalProblems) * 100) : 0;

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
                difficultyFilter === "all" || problem.difficulty === difficultyFilter;
              const matchesUnsolved = !onlyUnsolved || !completed.has(problem.id);
              const matchesSaved = !onlySaved || savedForRevision.has(problem.id);
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
                <TrendingUp size={12} className="inline mr-1" /> Master data structures & algorithms
              </p>
              <h1 className="text-3xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-4xl md:text-5xl text-foreground">
                Master code. Ace interviews.
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
                Curated by pattern — Array, String, Binary Search, Stack, Linked
                List, Heap, Tree & more. Track progress, save notes, and solve
                with editorial.
              </p>
              {loadingState && (
                <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={13} className="animate-spin" /> Syncing your progress…
                </div>
              )}
            </div>

            <div className="w-full shrink-0 rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-5 lg:w-[360px]">
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
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 md:py-10">
        <div className="sticky top-0 z-20 -mx-5 mb-8 border-b border-obsidian-border bg-obsidian-void/90 px-5 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search problems or companies…"
                aria-label="Search problems or companies"
                className="h-10 w-full rounded-lg border border-obsidian-border bg-obsidian-pane pl-9 pr-9 text-[13px] text-foreground outline-none transition-[border-color,background-color] placeholder:text-muted-foreground/60 hover:border-obsidian-border focus:border-foreground/30 focus:bg-obsidian-elevated focus:ring-0"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-obsidian-elevated hover:text-foreground"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(["all", "Easy", "Medium", "Hard"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficultyFilter(level)}
                  aria-pressed={difficultyFilter === level}
                  className={cn(
                    "h-8 rounded-lg border px-3 text-[11.5px] font-medium transition-colors",
                    difficultyFilter === level
                      ? "border-obsidian-border bg-foreground/[0.08] text-foreground"
                      : "border-obsidian-border bg-obsidian-pane text-muted-foreground hover:bg-obsidian-elevated hover:text-foreground",
                  )}
                >
                  {level === "all" ? "All levels" : level}
                </button>
              ))}

              <span className="mx-1 hidden h-5 w-px bg-obsidian-border sm:block" aria-hidden="true" />

              <button
                type="button"
                onClick={() => setOnlyUnsolved((value) => !value)}
                aria-pressed={onlyUnsolved}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11.5px] font-medium transition-colors",
                  onlyUnsolved
                    ? "border-obsidian-border bg-foreground/[0.08] text-foreground"
                    : "border-obsidian-border bg-obsidian-pane text-muted-foreground hover:bg-obsidian-elevated hover:text-foreground",
                )}
              >
                <CheckCircle2 size={12} />
                Unsolved
              </button>
              <button
                type="button"
                onClick={() => setOnlySaved((value) => !value)}
                aria-pressed={onlySaved}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11.5px] font-medium transition-colors",
                  onlySaved
                    ? "border-obsidian-border bg-foreground/[0.08] text-foreground"
                    : "border-obsidian-border bg-obsidian-pane text-muted-foreground hover:bg-obsidian-elevated hover:text-foreground",
                )}
              >
                <Sparkles size={12} />
                Saved
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-[10.5px] text-muted-foreground">
            <span>
              Showing <span className="font-semibold text-foreground/80">{filteredProblemCount}</span> of{" "}
              {totalProblems} problems
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw size={10} />
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="space-y-12">
          {filteredTopics.map((topic) => {
            const sourceTopic = practiceData.find((item) => item.id === topic.id) ?? topic;
            const accent = TOPIC_ACCENTS[topic.id] ?? { bg: "bg-zinc-900", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-200 dark:border-zinc-800", soft: "bg-zinc-50 dark:bg-zinc-900/30" };
            const topicTotal = sourceTopic.subtopics.reduce((a, s) => a + s.problems.length, 0);
            const topicSolved = sourceTopic.subtopics.reduce((a, s) => a + s.problems.filter((p) => completed.has(p.id)).length, 0);
            const topicPct = topicTotal ? Math.round((topicSolved / topicTotal) * 100) : 0;
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
                        <span className="hidden items-center rounded-md border border-obsidian-border bg-foreground/[0.04] px-2 py-0.5 text-[11px] font-medium text-muted-foreground md:inline-flex">{topicSolved}/{topicTotal}</span>
                      </h2>
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground max-w-3xl">{topic.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                      <Code2 size={13} className="text-muted-foreground" /> {topicPct}% done
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1">
                  {topic.subtopics.map((sub) => {
                    const sourceSub = sourceTopic.subtopics.find((item) => item.id === sub.id) ?? sub;
                    const total = sourceSub.problems.length;
                    const done = sourceSub.problems.filter((p) => completed.has(p.id)).length;
                    const progress = total ? (done / total) * 100 : 0;
                    const isDone = done === total && total > 0;
                    return (
                      <div key={sub.id} className="group flex flex-col overflow-hidden rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane transition-all duration-200 hover:bg-obsidian-elevated/40">
                        <div className={`h-0.5 w-full ${isDone ? "bg-emerald-500" : "bg-obsidian-border"}`} />
                        <Accordion type="single" collapsible value={openSubtopicId === sub.id ? sub.id : undefined} onValueChange={(v) => setOpenSubtopicId(v === sub.id ? sub.id : null)} className="w-full">
                          <AccordionItem value={sub.id} className="border-none">
                            <AccordionTrigger className="hover:no-underline px-6 py-5 group/trigger">
                              <div className="flex flex-col items-start text-left gap-2.5 w-full pr-2">
                                <div className="flex items-center justify-between w-full gap-3">
                                  <h3 className="text-base font-semibold tracking-tight text-foreground transition-colors line-clamp-1">
                                    {sub.title}
                                  </h3>
                                  <div className={`shrink-0 px-2.5 py-0.5 text-xs font-medium rounded-md border flex items-center gap-1.5 ${isDone ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-obsidian-elevated border-obsidian-border text-muted-foreground"}`}>
                                    {isDone && <CheckCircle2 size={12} />} {done}/{total}
                                  </div>
                                </div>
                                <p className="text-sm leading-6 text-muted-foreground line-clamp-2 max-w-[95%]">{sub.description}</p>
                                <div className="w-full h-1.5 bg-obsidian-elevated rounded-full overflow-hidden mt-2">
                                  <motion.div className={`h-full ${isDone ? "bg-emerald-500" : "bg-foreground/50"}`} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 pt-0">
                              <div className="space-y-2.5">
                                {sub.problems.map((prob) => {
                                  const checked = completed.has(prob.id);
                                  const isRevisionSaved = savedForRevision.has(prob.id);
                                  const isSavingNotes = savingNotesFor[prob.id] ?? false;
                                  const hasNotes = (notesByProblem[prob.id] ?? "").trim().length > 0;
                                  const rowBusy = upsertingProblemId === prob.id;
                                  return (
                                    <div key={prob.id} className={`group/row p-4 rounded-lg border transition-colors ${checked ? "border-emerald-500/30 bg-emerald-500/5" : "border-obsidian-border bg-obsidian-pane hover:bg-obsidian-elevated"}`}>
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <Checkbox id={prob.id} checked={checked} onCheckedChange={() => void toggleProblem(prob.id)} className="h-4 w-4 rounded border-obsidian-border data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 shrink-0" />
                                          <label htmlFor={prob.id} className={`text-sm font-medium cursor-pointer select-none truncate leading-5 ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                            {prob.title}
                                          </label>
                                          {checked && <CheckCircle2 size={14} className="text-emerald-400 hidden sm:block" />}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${getDifficultyColor(prob.difficulty)}`}>{prob.difficulty}</span>
                                          {rowBusy && <Loader2 size={13} className="animate-spin text-muted-foreground" />}
                                        </div>
                                      </div>

                                      <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <div className="flex flex-wrap gap-1.5 mr-auto">
                                          {prob.companies.slice(0, 4).map((c) => (
                                            <span key={`${prob.id}-${c}`} className="text-xs font-normal px-2 py-0.5 rounded bg-obsidian-elevated border border-obsidian-border text-muted-foreground">
                                              {c}
                                            </span>
                                          ))}
                                          {prob.companies.length > 4 && <span className="text-xs text-muted-foreground">+{prob.companies.length - 4}</span>}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <AppTooltip content="LeetCode">
                                            <a href={prob.leetcodeLink} target="_blank" rel="noreferrer" className="h-7 px-2.5 flex items-center justify-center rounded-md bg-obsidian-pane border border-obsidian-border text-xs font-medium text-muted-foreground hover:bg-obsidian-elevated hover:text-foreground transition-colors">
                                              LC
                                            </a>
                                          </AppTooltip>
                                          <AppTooltip content="GeeksforGeeks">
                                            <a href={prob.gfgLink} target="_blank" rel="noreferrer" className="h-7 px-2.5 flex items-center justify-center rounded-md bg-obsidian-pane border border-obsidian-border text-xs font-medium text-muted-foreground hover:bg-obsidian-elevated hover:text-foreground transition-colors">
                                              GFG
                                            </a>
                                          </AppTooltip>
                                          <Link to={`/practice/solution/${prob.id}/${toProblemSlug(prob.title)}`} className="h-7 px-3 rounded-md bg-foreground text-background text-xs font-medium hover:bg-foreground/85 inline-flex items-center gap-1">
                                            Solution <ArrowRight size={12} />
                                          </Link>
                                        </div>
                                      </div>

                                      <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-obsidian-border">
                                        <button type="button" onClick={() => openNotesPopup(prob.id)} disabled={isSavingNotes} className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border transition-colors ${hasNotes ? "bg-foreground/[0.08] border-obsidian-border text-foreground" : "bg-obsidian-pane border-obsidian-border text-muted-foreground hover:bg-obsidian-elevated hover:text-foreground"}`}>
                                          {isSavingNotes ? <Loader2 size={12} className="animate-spin" /> : <StickyNote size={12} />} {hasNotes ? "Edit note" : "Add note"}
                                        </button>
                                        <button type="button" onClick={() => void toggleSaveForRevision(prob.id)} className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border transition-colors ${isRevisionSaved ? "bg-foreground/[0.08] border-obsidian-border text-foreground" : "bg-obsidian-pane border-obsidian-border text-muted-foreground hover:bg-obsidian-elevated hover:text-foreground"}`}>
                                          <Sparkles size={12} /> {isRevisionSaved ? "Saved" : "Save"}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredTopics.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[0.875rem] border border-dashed border-obsidian-border bg-obsidian-pane px-6 py-14 text-center">
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
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-obsidian-border bg-obsidian-elevated px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw size={12} />
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {celebrationBursts.map((burst) => (
          <div key={burst.id} className="absolute" style={{ left: `${burst.x}px`, top: `${burst.y}px` }}>
            {burst.particles.map((p, i) => (
              <motion.span key={`${burst.id}-${i}`} className="absolute rounded-sm" style={{ backgroundColor: p.color, width: `${p.size}px`, height: `${p.size}px` }} initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }} animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3, rotate: p.rotate }} transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }} />
            ))}
            <motion.div className="absolute -left-7 -top-7 h-14 w-14 rounded-full border-2 border-amber-500/50" initial={{ scale: 0.25, opacity: 0.85 }} animate={{ scale: 1.7, opacity: 0 }} transition={{ duration: 0.65, ease: "easeOut" }} />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {activeNoteId && (
          <DraggableNoteEditor
            questionTitle={practiceData.flatMap((t) => t.subtopics).flatMap((s) => s.problems).find((p) => p.id === activeNoteId)?.title ?? "Note"}
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
