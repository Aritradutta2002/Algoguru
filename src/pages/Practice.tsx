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
  const noteSaveFeedbackTimersRef = useRef<Record<string, ReturnType<typeof window.setTimeout>>>({});

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
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,hsl(var(--primary)/0.13),transparent_38%),radial-gradient(circle_at_12%_55%,hsl(var(--accent)/0.07),transparent_30%)]" />
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="aurora-blob right-[6%] top-[-10%] h-64 w-64 bg-primary/10" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 py-12 md:px-10 md:py-16 lg:px-16">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-soft backdrop-blur-sm">
                <TrendingUp size={12} className="text-primary" /> Master data structures & algorithms
              </div>
              <h1 className="font-display text-4xl font-bold leading-[1.04] tracking-[-0.045em] md:text-5xl lg:text-[3.8rem]">
                Master code.{" "}
                <span className="text-gradient-brand">Ace interviews.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-muted-foreground md:text-base md:leading-8">
                Curated by pattern — Array, String, Binary Search, Stack, Linked
                List, Heap, Tree & more. Track progress, save notes, and solve
                with editorial.
              </p>
              {loadingState && (
                <div className="mt-4 inline-flex items-center gap-2 text-[12.5px] text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" /> Syncing your progress…
                </div>
              )}
            </div>

            <div className="premium-card w-full shrink-0 p-6 lg:w-[370px]">
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                    <Target size={14} className="text-primary" /> Your progress
                  </div>
                  <p className="mt-2 font-display text-[2rem] font-bold tracking-[-0.04em]">
                    {progressPct}%
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {solvedCount} of {totalProblems} problems solved
                  </p>
                </div>
                <ProgressRing
                  value={progressPct}
                  size={84}
                  label={`${progressPct}% of practice problems completed`}
                >
                  <Target size={19} className="text-primary" />
                </ProgressRing>
              </div>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400 transition-[width] duration-500 ease-premium"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
                  <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Solved
                  </div>
                  <div className="mt-1 text-[13px] font-semibold text-foreground">
                    {solvedCount}
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
                  <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Saved
                  </div>
                  <div className="mt-1 text-[13px] font-semibold text-foreground">
                    {savedForRevision.size}
                  </div>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5">
                  <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-primary/80">
                    Remaining
                  </div>
                  <div className="mt-1 text-[13px] font-semibold text-primary">
                    {totalProblems - solvedCount}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-10 lg:px-16">
        <div className="sticky top-0 z-20 -mx-5 mb-9 border-b border-border/60 bg-background/90 px-5 py-3 backdrop-blur-xl md:-mx-10 md:px-10 lg:-mx-16 lg:px-16">
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
                className="h-10 w-full rounded-xl border border-border bg-card/70 pl-9 pr-9 text-[13px] text-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.025)] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground/60 hover:border-primary/30 focus:border-primary focus:bg-card focus:ring-2 focus:ring-ring/15"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
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
                    "h-8 rounded-lg border px-3 text-[11.5px] font-semibold transition-all duration-200",
                    difficultyFilter === level
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border/70 bg-card/60 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground",
                  )}
                >
                  {level === "all" ? "All levels" : level}
                </button>
              ))}

              <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />

              <button
                type="button"
                onClick={() => setOnlyUnsolved((value) => !value)}
                aria-pressed={onlyUnsolved}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11.5px] font-semibold transition-all duration-200",
                  onlyUnsolved
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/70 bg-card/60 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground",
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
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11.5px] font-semibold transition-all duration-200",
                  onlySaved
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/70 bg-card/60 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground",
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
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accent.border} ${accent.soft} ${accent.text} md:flex`}>
                      <Layers size={18} />
                    </div>
                    <div>
                      <h2 className="flex items-center gap-3 font-display text-2xl font-bold tracking-tight text-foreground">
                        {topic.title}
                        <span className={`hidden items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold md:inline-flex ${accent.border} ${accent.soft} ${accent.text}`}>{topicSolved}/{topicTotal}</span>
                      </h2>
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground max-w-3xl">{topic.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                      <Code2 size={13} className={accent.text} /> {topicPct}% done
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
                      <div key={sub.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-200 hover:border-primary/30 hover:shadow-card">
                        <div className={`h-0.5 w-full ${isDone ? "bg-success" : "bg-muted"}`} />
                        <Accordion type="single" collapsible value={openSubtopicId === sub.id ? sub.id : undefined} onValueChange={(v) => setOpenSubtopicId(v === sub.id ? sub.id : null)} className="w-full">
                          <AccordionItem value={sub.id} className="border-none">
                            <AccordionTrigger className="hover:no-underline px-6 py-5 group/trigger">
                              <div className="flex flex-col items-start text-left gap-2.5 w-full pr-2">
                                <div className="flex items-center justify-between w-full gap-3">
                                  <h3 className="text-base font-semibold tracking-tight text-foreground group-hover/trigger:text-primary transition-colors line-clamp-1">
                                    {sub.title}
                                  </h3>
                                  <div className={`shrink-0 px-2.5 py-0.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 ${isDone ? "bg-success/10 border-success/30 text-success" : "bg-muted/40 border-border text-muted-foreground"}`}>
                                    {isDone && <CheckCircle2 size={12} />} {done}/{total}
                                  </div>
                                </div>
                                <p className="text-sm leading-6 text-muted-foreground line-clamp-2 max-w-[95%]">{sub.description}</p>
                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                                  <motion.div className={`h-full ${isDone ? "bg-success" : "bg-primary"}`} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
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
                                    <div key={prob.id} className={`group/row p-4 rounded-xl border transition-colors ${checked ? "border-success/40 bg-success/5" : "border-border bg-card hover:bg-muted/30"}`}>
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <Checkbox id={prob.id} checked={checked} onCheckedChange={() => void toggleProblem(prob.id)} className="h-4 w-4 rounded border-border data-[state=checked]:bg-success data-[state=checked]:border-success shrink-0" />
                                          <label htmlFor={prob.id} className={`text-sm font-medium cursor-pointer select-none truncate leading-5 ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                            {prob.title}
                                          </label>
                                          {checked && <CheckCircle2 size={14} className="text-success hidden sm:block" />}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${getDifficultyColor(prob.difficulty)}`}>{prob.difficulty}</span>
                                          {rowBusy && <Loader2 size={13} className="animate-spin text-muted-foreground" />}
                                        </div>
                                      </div>

                                      <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <div className="flex flex-wrap gap-1.5 mr-auto">
                                          {prob.companies.slice(0, 4).map((c) => (
                                            <span key={`${prob.id}-${c}`} className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted border border-border text-muted-foreground">
                                              {c}
                                            </span>
                                          ))}
                                          {prob.companies.length > 4 && <span className="text-xs text-muted-foreground">+{prob.companies.length - 4}</span>}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <AppTooltip content="LeetCode">
                                            <a href={prob.leetcodeLink} target="_blank" rel="noreferrer" className="h-7 px-2.5 flex items-center justify-center rounded-md bg-muted border border-border text-xs font-medium text-muted-foreground hover:bg-foreground hover:text-background transition-colors">
                                              LC
                                            </a>
                                          </AppTooltip>
                                          <AppTooltip content="GeeksforGeeks">
                                            <a href={prob.gfgLink} target="_blank" rel="noreferrer" className="h-7 px-2.5 flex items-center justify-center rounded-md bg-muted border border-border text-xs font-medium text-muted-foreground hover:bg-success hover:text-success-foreground hover:border-success transition-colors">
                                              GFG
                                            </a>
                                          </AppTooltip>
                                          <Link to={`/practice/solution/${prob.id}/${toProblemSlug(prob.title)}`} className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:brightness-95 inline-flex items-center gap-1">
                                            Solution <ArrowRight size={12} />
                                          </Link>
                                        </div>
                                      </div>

                                      <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-border">
                                        <button type="button" onClick={() => openNotesPopup(prob.id)} disabled={isSavingNotes} className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border transition-colors ${hasNotes ? "bg-primary/10 border-primary/30 text-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"}`}>
                                          {isSavingNotes ? <Loader2 size={12} className="animate-spin" /> : <StickyNote size={12} />} {hasNotes ? "Edit note" : "Add note"}
                                        </button>
                                        <button type="button" onClick={() => void toggleSaveForRevision(prob.id)} className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border transition-colors ${isRevisionSaved ? "bg-primary/10 border-primary/30 text-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"}`}>
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
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/50 text-muted-foreground">
                <Search size={20} />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold tracking-tight">
                No problems match those filters
              </h3>
              <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted-foreground">
                Try a shorter search, a different difficulty, or clear the
                saved/unsolved filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-[12px] font-semibold shadow-soft transition-colors hover:border-primary/30 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
