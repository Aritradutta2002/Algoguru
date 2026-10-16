import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { practiceData } from "../data/practiceData";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  CheckCircle2,
  Loader2,
  StickyNote,
  Target,
  Sparkles,
  ArrowRight,
  Search,
  X,
  Bookmark,
  ExternalLink,
  SlidersHorizontal,
  List,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DraggableNoteEditor } from "@/components/DraggableNoteEditor";
import { AppTooltip } from "@/components/ui/tooltip";
import { DifficultyBadge, Kbd, StatTile } from "@/components/layout/PagePrimitives";

type CelebrationParticle = { x: number; y: number; size: number; color: string; delay: number; duration: number; rotate: number };
type CelebrationBurst = { id: number; x: number; y: number; particles: CelebrationParticle[] };

const CELEBRATION_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#eab308", "#10b981"];
const CELEBRATION_PARTICLE_COUNT = 16;

function toProblemSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

export default function Practice() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const query = searchParams.get("q") ?? "";
  const difficultyFilter = searchParams.get("difficulty") ?? "all";
  const statusFilter = searchParams.get("status") ?? "all";
  const viewMode = searchParams.get("view") ?? "grouped"; // "grouped" | "table"

  const setQueryParam = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === "all" || (key === "view" && value === "grouped")) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [savedForRevision, setSavedForRevision] = useState<Set<string>>(new Set());
  const [notesByProblem, setNotesByProblem] = useState<Record<string, string>>({});
  const [loadingState, setLoadingState] = useState(false);
  const [upsertingProblemId, setUpsertingProblemId] = useState<string | null>(null);
  const [savingNotesFor, setSavingNotesFor] = useState<Record<string, boolean>>({});
  const [openSubtopicId, setOpenSubtopicId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [celebrationBursts, setCelebrationBursts] = useState<CelebrationBurst[]>([]);
  const celebrationIdRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Flattened problems for fast searching and table view
  const allProblems = useMemo(() => {
    return practiceData.flatMap((topic) =>
      topic.subtopics.flatMap((sub) =>
        sub.problems.map((prob) => ({
          ...prob,
          topicId: topic.id,
          topicTitle: topic.title,
          subtopicId: sub.id,
          subtopicTitle: sub.title,
        }))
      )
    );
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    let easyTotal = 0;
    let easySolved = 0;
    let medTotal = 0;
    let medSolved = 0;
    let hardTotal = 0;
    let hardSolved = 0;

    for (const p of allProblems) {
      const isSolved = completed.has(p.id);
      if (p.difficulty === "Easy") {
        easyTotal++;
        if (isSolved) easySolved++;
      } else if (p.difficulty === "Medium") {
        medTotal++;
        if (isSolved) medSolved++;
      } else if (p.difficulty === "Hard") {
        hardTotal++;
        if (isSolved) hardSolved++;
      }
    }

    const total = allProblems.length;
    const solved = completed.size;
    const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

    return {
      total,
      solved,
      pct,
      easyTotal,
      easySolved,
      medTotal,
      medSolved,
      hardTotal,
      hardSolved,
    };
  }, [allProblems, completed]);

  // Load user state from Supabase
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
        toast({ title: "Failed to load progress", description: error.message, variant: "destructive" });
        setLoadingState(false);
        return;
      }
      const c = new Set<string>();
      const r = new Set<string>();
      const n: Record<string, string> = {};
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
    return () => {
      mounted = false;
    };
  }, [user]);

  // Keyboard shortcut to focus search with '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const upsertUserState = async (
    problemId: string,
    patch: Partial<{ notes: string; is_completed: boolean; is_saved_for_revision: boolean }>
  ) => {
    if (!user) {
      toast({ title: "Please sign in", description: "Sign in to save your solution progress and notes.", variant: "destructive" });
      return false;
    }
    const { error } = await supabase
      .from("practice_problem_user_state")
      .upsert({ user_id: user.id, problem_id: problemId, ...patch }, { onConflict: "user_id,problem_id" });
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
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
    toast({ title: next ? "Bookmarked for revision" : "Removed bookmark" });
  };

  const saveNotes = async (id: string, nextNotes: string) => {
    const trimmed = nextNotes.trim();
    setSavingNotesFor((prev) => ({ ...prev, [id]: true }));
    const ok = await upsertUserState(
      id,
      trimmed.length > 0 ? { notes: nextNotes, is_saved_for_revision: true } : { notes: nextNotes }
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
        setSavedForRevision((prev) => new Set(prev).add(id));
      }
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
      const s = 50 + Math.random() * 70;
      return {
        x: Math.cos(a) * s,
        y: Math.sin(a) * s - (25 + Math.random() * 25),
        size: 4 + Math.round(Math.random() * 3),
        color: CELEBRATION_COLORS[i % CELEBRATION_COLORS.length],
        delay: Math.random() * 0.06,
        duration: 0.6 + Math.random() * 0.3,
        rotate: Math.random() * 360,
      };
    });
    setCelebrationBursts((prev) => [...prev, { id: burstId, x, y, particles }]);
    window.setTimeout(() => setCelebrationBursts((prev) => prev.filter((b) => b.id !== burstId)), 1100);
  };

  const openNotesPopup = (id: string) => {
    setNoteDraft(notesByProblem[id] ?? "");
    setActiveNoteId(id);
  };

  // Filter predicate
  const matchesProblem = useCallback(
    (prob: { id: string; title: string; difficulty: string; companies: string[] }) => {
      // Query filter
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const titleMatch = prob.title.toLowerCase().includes(q);
        const compMatch = prob.companies.some((c) => c.toLowerCase().includes(q));
        if (!titleMatch && !compMatch) return false;
      }

      // Difficulty filter
      if (difficultyFilter !== "all" && prob.difficulty.toLowerCase() !== difficultyFilter.toLowerCase()) {
        return false;
      }

      // Status filter
      if (statusFilter === "solved" && !completed.has(prob.id)) return false;
      if (statusFilter === "todo" && completed.has(prob.id)) return false;
      if (statusFilter === "saved" && !savedForRevision.has(prob.id)) return false;

      return true;
    },
    [query, difficultyFilter, statusFilter, completed, savedForRevision]
  );

  // Filtered flat problems for Table view
  const filteredProblems = useMemo(() => {
    return allProblems.filter(matchesProblem);
  }, [allProblems, matchesProblem]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* ── Page Header ── */}
      <section className="border-b border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                <Target size={14} />
                <span>Curated Problem Bank</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Practice Problems
              </h1>
              <p className="mt-1 text-sm text-muted-foreground max-w-xl">
                Master 500+ interview problems categorized across 14 algorithmic patterns.
              </p>
              {loadingState && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 size={13} className="animate-spin text-primary" />
                  <span>Syncing saved progress...</span>
                </div>
              )}
            </div>

            {/* Progress summary card */}
            <div className="w-full lg:w-80 shrink-0 rounded-surface border border-border bg-card p-4 shadow-elev-0">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-foreground">Completion</span>
                <span className="font-mono text-muted-foreground">
                  {stats.solved} / {stats.total} ({stats.pct}%)
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-muted rounded-pill overflow-hidden flex">
                <div
                  className="bg-primary transition-all duration-300"
                  style={{ width: `${stats.pct}%` }}
                />
              </div>

              {/* Easy / Med / Hard breakdown */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/60 text-center">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">Easy</span>
                  <p className="text-xs font-mono font-medium text-foreground mt-0.5">
                    {stats.easySolved}/{stats.easyTotal}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400">Medium</span>
                  <p className="text-xs font-mono font-medium text-foreground mt-0.5">
                    {stats.medSolved}/{stats.medTotal}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-rose-600 dark:text-rose-400">Hard</span>
                  <p className="text-xs font-mono font-medium text-foreground mt-0.5">
                    {stats.hardSolved}/{stats.hardTotal}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Filters & Toolbar Bar ── */}
      <div className="sticky top-[52px] z-30 bg-background/95 backdrop-blur-md border-b border-border shadow-elev-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search input */}
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search problem or company (e.g. Two Sum, Google)..."
                value={query}
                onChange={(e) => setQueryParam("q", e.target.value)}
                className="w-full h-8 pl-8 pr-12 text-xs rounded-control border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {query ? (
                  <button
                    onClick={() => setQueryParam("q", "")}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <Kbd>/</Kbd>
                )}
              </div>
            </div>

            {/* Filter segments */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Difficulty filter */}
              <div className="inline-flex rounded-control border border-border bg-muted/40 p-0.5">
                {[
                  { id: "all", label: "All" },
                  { id: "easy", label: "Easy" },
                  { id: "medium", label: "Med" },
                  { id: "hard", label: "Hard" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setQueryParam("difficulty", item.id)}
                    className={`h-7 px-2.5 rounded-[4px] font-medium transition-colors ${
                      difficultyFilter === item.id
                        ? "bg-card text-foreground shadow-elev-0"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Status filter */}
              <div className="inline-flex rounded-control border border-border bg-muted/40 p-0.5">
                {[
                  { id: "all", label: "All" },
                  { id: "todo", label: "Todo" },
                  { id: "solved", label: "Solved" },
                  { id: "saved", label: "Bookmarked" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setQueryParam("status", item.id)}
                    className={`h-7 px-2.5 rounded-[4px] font-medium transition-colors ${
                      statusFilter === item.id
                        ? "bg-card text-foreground shadow-elev-0"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* View mode toggle */}
              <div className="inline-flex rounded-control border border-border bg-muted/40 p-0.5">
                <button
                  onClick={() => setQueryParam("view", "grouped")}
                  aria-label="Pattern view"
                  className={`h-7 px-2 rounded-[4px] transition-colors ${
                    viewMode === "grouped"
                      ? "bg-card text-foreground shadow-elev-0"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Grouped by pattern"
                >
                  <Layers size={14} />
                </button>
                <button
                  onClick={() => setQueryParam("view", "table")}
                  aria-label="Table view"
                  className={`h-7 px-2 rounded-[4px] transition-colors ${
                    viewMode === "table"
                      ? "bg-card text-foreground shadow-elev-0"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Flat table view"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Problems List / Table ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {viewMode === "table" ? (
          /* ── Table View ── */
          <div className="rounded-surface border border-border bg-card overflow-hidden shadow-elev-0">
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Showing {filteredProblems.length} problems</span>
              <span className="hidden sm:inline">Click problem to open solution</span>
            </div>

            {filteredProblems.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No problems found matching your filters.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredProblems.map((prob) => {
                  const isChecked = completed.has(prob.id);
                  const isSaved = savedForRevision.has(prob.id);
                  const hasNotes = (notesByProblem[prob.id] ?? "").trim().length > 0;

                  return (
                    <div
                      key={prob.id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors group text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          id={`table-${prob.id}`}
                          checked={isChecked}
                          onCheckedChange={() => void toggleProblem(prob.id)}
                          className="shrink-0"
                        />
                        <Link
                          to={`/practice/solution/${prob.id}/${toProblemSlug(prob.title)}`}
                          className={`truncate font-medium hover:text-primary transition-colors ${
                            isChecked ? "text-muted-foreground line-through" : "text-foreground"
                          }`}
                        >
                          {prob.title}
                        </Link>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden md:inline text-[11px] text-muted-foreground font-mono">
                          {prob.subtopicTitle}
                        </span>
                        <DifficultyBadge difficulty={prob.difficulty} />

                        {/* Hover Quick Actions */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openNotesPopup(prob.id)}
                            className={`p-1 rounded hover:bg-muted transition-colors ${
                              hasNotes ? "text-primary" : "text-muted-foreground"
                            }`}
                            title={hasNotes ? "Edit note" : "Add note"}
                          >
                            <StickyNote size={13} />
                          </button>
                          <button
                            onClick={() => void toggleSaveForRevision(prob.id)}
                            className={`p-1 rounded hover:bg-muted transition-colors ${
                              isSaved ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                            }`}
                            title={isSaved ? "Bookmarked" : "Bookmark"}
                          >
                            <Bookmark size={13} />
                          </button>
                          {prob.leetcodeLink && (
                            <a
                              href={prob.leetcodeLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                              title="Open on LeetCode"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                          <Link
                            to={`/practice/solution/${prob.id}/${toProblemSlug(prob.title)}`}
                            className="p-1 rounded text-primary hover:bg-muted transition-colors"
                            title="View editorial"
                          >
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── Grouped View by Pattern ── */
          <div className="space-y-6">
            {practiceData.map((topic) => {
              // Filter subtopics and problems within this topic
              const visibleSubtopics = topic.subtopics
                .map((sub) => ({
                  ...sub,
                  problems: sub.problems.filter(matchesProblem),
                }))
                .filter((sub) => sub.problems.length > 0);

              if (visibleSubtopics.length === 0) return null;

              const topicTotal = topic.subtopics.reduce((acc, s) => acc + s.problems.length, 0);
              const topicSolved = topic.subtopics.reduce(
                (acc, s) => acc + s.problems.filter((p) => completed.has(p.id)).length,
                0
              );

              return (
                <div key={topic.id} className="rounded-surface border border-border bg-card overflow-hidden shadow-elev-0">
                  {/* Topic Header */}
                  <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                        <span>{topic.title}</span>
                        <span className="text-xs font-mono font-normal text-muted-foreground">
                          ({topicSolved}/{topicTotal} solved)
                        </span>
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{topic.description}</p>
                    </div>
                  </div>

                  {/* Subtopics Accordions */}
                  <Accordion
                    type="single"
                    collapsible
                    value={openSubtopicId ?? undefined}
                    onValueChange={(val) => setOpenSubtopicId(val || null)}
                    className="divide-y divide-border"
                  >
                    {visibleSubtopics.map((sub) => {
                      const subDone = sub.problems.filter((p) => completed.has(p.id)).length;
                      const subTotal = sub.problems.length;
                      const isDone = subDone === subTotal && subTotal > 0;

                      return (
                        <AccordionItem key={sub.id} value={sub.id} className="border-b-0">
                          <AccordionTrigger className="px-4 sm:px-5 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between w-full pr-4 text-xs text-left">
                              <span className="font-medium text-foreground tracking-tight">
                                {sub.title}
                              </span>
                              <span
                                className={`font-mono text-[11px] px-2 py-0.5 rounded border ${
                                  isDone
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                    : "bg-muted border-border text-muted-foreground"
                                }`}
                              >
                                {subDone}/{subTotal}
                              </span>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="px-4 sm:px-5 pb-4 pt-1">
                            <div className="divide-y divide-border/60 rounded-control border border-border/80 bg-background/50 overflow-hidden">
                              {sub.problems.map((prob) => {
                                const checked = completed.has(prob.id);
                                const isRevisionSaved = savedForRevision.has(prob.id);
                                const hasNotes = (notesByProblem[prob.id] ?? "").trim().length > 0;

                                return (
                                  <div
                                    key={prob.id}
                                    id={prob.id}
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 transition-colors ${
                                      checked ? "bg-muted/30" : "hover:bg-muted/20"
                                    }`}
                                  >
                                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                                      <Checkbox
                                        id={prob.id}
                                        checked={checked}
                                        onCheckedChange={() => void toggleProblem(prob.id)}
                                        className="mt-0.5 sm:mt-0 shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <Link
                                          to={`/practice/solution/${prob.id}/${toProblemSlug(prob.title)}`}
                                          className={`text-xs font-medium hover:text-primary transition-colors truncate block ${
                                            checked ? "text-muted-foreground line-through" : "text-foreground"
                                          }`}
                                        >
                                          {prob.title}
                                        </Link>
                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                          {prob.companies.slice(0, 3).map((comp) => (
                                            <span
                                              key={comp}
                                              className="text-[10px] px-1.5 py-0.5 rounded border border-border/60 bg-muted/40 text-muted-foreground font-mono"
                                            >
                                              {comp}
                                            </span>
                                          ))}
                                          {prob.companies.length > 3 && (
                                            <span className="text-[10px] text-muted-foreground">
                                              +{prob.companies.length - 3}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                                      <DifficultyBadge difficulty={prob.difficulty} />

                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => openNotesPopup(prob.id)}
                                          className={`inline-flex items-center gap-1 h-7 px-2 rounded-control text-xs border transition-colors ${
                                            hasNotes
                                              ? "border-primary/30 bg-primary/10 text-primary"
                                              : "border-border bg-card text-muted-foreground hover:bg-muted"
                                          }`}
                                          title={hasNotes ? "Edit notes" : "Add notes"}
                                        >
                                          <StickyNote size={12} />
                                          <span className="hidden sm:inline">Note</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => void toggleSaveForRevision(prob.id)}
                                          className={`inline-flex items-center gap-1 h-7 px-2 rounded-control text-xs border transition-colors ${
                                            isRevisionSaved
                                              ? "border-amber-500/30 bg-amber-500/10 text-amber-500 fill-amber-500"
                                              : "border-border bg-card text-muted-foreground hover:bg-muted"
                                          }`}
                                          title={isRevisionSaved ? "Saved" : "Save"}
                                        >
                                          <Bookmark size={12} />
                                        </button>

                                        {prob.leetcodeLink && (
                                          <a
                                            href={prob.leetcodeLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="h-7 px-2 rounded-control border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-mono inline-flex items-center"
                                            title="LeetCode"
                                          >
                                            LC
                                          </a>
                                        )}

                                        <Link
                                          to={`/practice/solution/${prob.id}/${toProblemSlug(prob.title)}`}
                                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-control text-xs font-medium bg-primary text-primary-foreground hover:bg-accent-hover transition-colors"
                                        >
                                          <span>Solve</span>
                                          <ArrowRight size={11} />
                                        </Link>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Completion Particle Effects ── */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {celebrationBursts.map((burst) => (
          <div key={burst.id} className="absolute" style={{ left: `${burst.x}px`, top: `${burst.y}px` }}>
            {burst.particles.map((p, i) => (
              <motion.span
                key={`${burst.id}-${i}`}
                className="absolute rounded-sm"
                style={{ backgroundColor: p.color, width: `${p.size}px`, height: `${p.size}px` }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.2, rotate: p.rotate }}
                transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* ── Draggable Note Editor Modal ── */}
      <AnimatePresence>
        {activeNoteId && (
          <DraggableNoteEditor
            questionTitle={
              allProblems.find((p) => p.id === activeNoteId)?.title ?? "Note"
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
