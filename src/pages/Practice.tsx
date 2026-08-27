import { useEffect, useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { practiceData } from "../data/practiceData";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Loader2, StickyNote, TrendingUp, Target, Code2, Layers, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DraggableNoteEditor } from "@/components/DraggableNoteEditor";
import { AppTooltip } from "@/components/ui/tooltip";

type CelebrationParticle = { x: number; y: number; size: number; color: string; delay: number; duration: number; rotate: number };
type CelebrationBurst = { id: number; x: number; y: number; particles: CelebrationParticle[] };

const CELEBRATION_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#eab308", "#10b981"];
const CELEBRATION_PARTICLE_COUNT = 18;

const TOPIC_ACCENTS: Record<string, { bg: string; text: string; border: string; soft: string }> = {
  array: { bg: "bg-blue-500", text: "text-blue-600", border: "border-blue-200", soft: "bg-blue-50 dark:bg-blue-950/30" },
  strings: { bg: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-200", soft: "bg-emerald-50 dark:bg-emerald-950/30" },
  "binary-search": { bg: "bg-amber-500", text: "text-amber-600", border: "border-amber-200", soft: "bg-amber-50 dark:bg-amber-950/30" },
  stack: { bg: "bg-purple-500", text: "text-purple-600", border: "border-purple-200", soft: "bg-purple-50 dark:bg-purple-950/30" },
  "linked-list": { bg: "bg-rose-500", text: "text-rose-600", border: "border-rose-200", soft: "bg-rose-50 dark:bg-rose-950/30" },
  "double-linked-list": { bg: "bg-pink-500", text: "text-pink-600", border: "border-pink-200", soft: "bg-pink-50 dark:bg-pink-950/30" },
  hashmap: { bg: "bg-cyan-500", text: "text-cyan-600", border: "border-cyan-200", soft: "bg-cyan-50 dark:bg-cyan-950/30" },
  heap: { bg: "bg-indigo-500", text: "text-indigo-600", border: "border-indigo-200", soft: "bg-indigo-50 dark:bg-indigo-950/30" },
  recursion: { bg: "bg-orange-500", text: "text-orange-600", border: "border-orange-200", soft: "bg-orange-50 dark:bg-orange-950/30" },
  tree: { bg: "bg-teal-500", text: "text-teal-600", border: "border-teal-200", soft: "bg-teal-50 dark:bg-teal-950/30" },
  "binary-search-tree": { bg: "bg-lime-600", text: "text-lime-700", border: "border-lime-200", soft: "bg-lime-50 dark:bg-lime-950/30" },
  graph: { bg: "bg-sky-600", text: "text-sky-700", border: "border-sky-200", soft: "bg-sky-50 dark:bg-sky-950/30" },
  backtracking: { bg: "bg-fuchsia-500", text: "text-fuchsia-600", border: "border-fuchsia-200", soft: "bg-fuchsia-50 dark:bg-fuchsia-950/30" },
  greedy: { bg: "bg-yellow-500", text: "text-yellow-700", border: "border-yellow-200", soft: "bg-yellow-50 dark:bg-yellow-950/30" },
  "dynamic-programming": { bg: "bg-violet-600", text: "text-violet-700", border: "border-violet-200", soft: "bg-violet-50 dark:bg-violet-950/30" },
  trie: { bg: "bg-emerald-600", text: "text-emerald-700", border: "border-emerald-200", soft: "bg-emerald-50 dark:bg-emerald-950/30" },
  "bit-manipulation": { bg: "bg-slate-600", text: "text-slate-700", border: "border-slate-200", soft: "bg-slate-50 dark:bg-slate-900/30" },
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,hsl(var(--primary)/0.12),transparent_35%),radial-gradient(circle_at_15%_50%,hsl(var(--accent)/0.06),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-20 lg:px-16">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
                <TrendingUp size={13} className="text-primary" /> Master data structures & algorithms
              </div>
              <h1 className="text-4xl font-bold leading-[1.04] tracking-[-0.04em] md:text-5xl lg:text-6xl">
                Master code. <span className="text-primary">Ace interviews.</span>
              </h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground md:text-lg">
                Curated by pattern — Array, String, Binary Search, Stack, Linked List, Heap, Tree & more. Track progress, save notes, and solve with editorial.
              </p>
              {loadingState && <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={15} className="animate-spin" /> Syncing your progress…</div>}
            </div>

            <div className="w-full lg:w-[340px] shrink-0 rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Target size={16} className="text-primary" /> Your progress</div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground">{solvedCount}/{totalProblems}</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{progressPct}% completed</span>
                <span>{totalProblems - solvedCount} remaining</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/40 border border-border p-2.5">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Solved</div>
                  <div className="text-sm font-semibold text-foreground mt-1">{solvedCount}</div>
                </div>
                <div className="rounded-lg bg-muted/40 border border-border p-2.5">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Saved</div>
                  <div className="text-sm font-semibold text-foreground mt-1">{savedForRevision.size}</div>
                </div>
                <div className="rounded-lg bg-primary text-primary-foreground p-2.5">
                  <div className="text-[10px] font-medium uppercase tracking-wider opacity-90">Total</div>
                  <div className="text-sm font-semibold mt-1">{totalProblems}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-14 lg:px-16">
        <div className="space-y-12">
          {practiceData.map((topic) => {
            const accent = TOPIC_ACCENTS[topic.id] ?? { bg: "bg-zinc-900", text: "text-zinc-900", border: "border-zinc-200", soft: "bg-zinc-50" };
            const topicTotal = topic.subtopics.reduce((a, s) => a + s.problems.length, 0);
            const topicSolved = topic.subtopics.reduce((a, s) => a + s.problems.filter((p) => completed.has(p.id)).length, 0);
            const topicPct = topicTotal ? Math.round((topicSolved / topicTotal) * 100) : 0;
            return (
              <div key={topic.id} className="space-y-5">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`hidden md:flex w-10 h-10 rounded-lg ${accent.bg} text-white items-center justify-center shrink-0`}>
                      <Layers size={18} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        {topic.title}
                        <span className={`hidden md:inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${accent.border} ${accent.soft} ${accent.text}`}>{topicSolved}/{topicTotal}</span>
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
                    const total = sub.problems.length;
                    const done = sub.problems.filter((p) => completed.has(p.id)).length;
                    const progress = total ? (done / total) * 100 : 0;
                    const isDone = done === total && total > 0;
                    return (
                      <div key={sub.id} className="group bg-card border border-border rounded-2xl overflow-hidden transition-all flex flex-col hover:border-primary/30">
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
