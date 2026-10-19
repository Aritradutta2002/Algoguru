import { useEffect, useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { practiceData } from "../data/practiceData";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  Loader2,
  StickyNote,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DraggableNoteEditor } from "@/components/DraggableNoteEditor";
import { AppTooltip } from "@/components/ui/tooltip";
import {
  PageShell,
  PageHeader,
  Section,
  SectionHeading,
  Surface,
  Pill,
  Meter,
} from "@/components/layout/PagePrimitives";
import { Button } from "@/components/ui/button";

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

export default function Practice() {
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
  const [savedNotesFor, setSavedNotesFor] = useState<Record<string, boolean>>(
    {},
  );
  const [openSubtopicId, setOpenSubtopicId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [celebrationBursts, setCelebrationBursts] = useState<
    CelebrationBurst[]
  >([]);
  const celebrationIdRef = useRef(0);
  const noteSaveFeedbackTimersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      Object.values(noteSaveFeedbackTimersRef.current).forEach((timer) =>
        window.clearTimeout(timer),
      );
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
    load();
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
      if (trimmed.length > 0)
        setSavedForRevision((prev) => {
          const n = new Set(prev);
          n.add(id);
          return n;
        });
      setSavedNotesFor((prev) => ({ ...prev, [id]: true }));
      if (noteSaveFeedbackTimersRef.current[id])
        window.clearTimeout(noteSaveFeedbackTimersRef.current[id]);
      noteSaveFeedbackTimersRef.current[id] = window.setTimeout(() => {
        setSavedNotesFor((prev) => ({ ...prev, [id]: false }));
        delete noteSaveFeedbackTimersRef.current[id];
      }, 2200);
      toast({ title: trimmed.length > 0 ? "Notes saved" : "Notes cleared" });
    }
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

  return (
    <div className="ui-app-canvas">
      <PageShell>
        <PageHeader
          variant="display"
          kicker="Practice sheet"
          title="Master code. Ace interviews."
          description="Curated by pattern — Array, String, Binary Search, Stack, Linked List, Heap, Tree & more. Track progress, save notes, and solve with editorial."
          actions={
            <Surface padding="md">
              <div className="flex items-center justify-between gap-3">
                <span className="ui-meta">Your progress</span>
                <Pill mono>
                  {solvedCount}/{totalProblems}
                </Pill>
              </div>
              <Meter
                value={progressPct}
                label="Practice progress"
                className="mt-4"
              />
              <div className="mt-2.5 flex items-center justify-between gap-3 ui-meta">
                <span className="text-foreground">
                  {progressPct}% completed
                </span>
                <span>{totalProblems - solvedCount} remaining</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-border p-2.5">
                  <div className="ui-meta">Solved</div>
                  <div className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
                    {solvedCount}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-2.5">
                  <div className="ui-meta">Saved</div>
                  <div className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
                    {savedForRevision.size}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-2.5">
                  <div className="ui-meta">Total</div>
                  <div className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
                    {totalProblems}
                  </div>
                </div>
              </div>
            </Surface>
          }
        />

        <Section spacing="compact">
          {loadingState && (
            <div className="ui-meta mb-6 inline-flex items-center gap-2">
              <Loader2 size={15} className="animate-spin" /> Syncing your
              progress…
            </div>
          )}
          <div className="space-y-12">
            {practiceData.map((topic) => {
              const topicTotal = topic.subtopics.reduce(
                (a, s) => a + s.problems.length,
                0,
              );
              const topicSolved = topic.subtopics.reduce(
                (a, s) =>
                  a + s.problems.filter((p) => completed.has(p.id)).length,
                0,
              );
              const topicPct = topicTotal
                ? Math.round((topicSolved / topicTotal) * 100)
                : 0;
              return (
                <div key={topic.id} className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-control border border-border bg-card text-muted-foreground md:flex">
                      <Layers size={18} />
                    </div>
                    <SectionHeading
                      as="h3"
                      title={topic.title}
                      description={topic.description}
                      actions={
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm tabular-nums text-foreground">
                            {topicSolved}/{topicTotal}
                          </span>
                          <span className="ui-meta">{topicPct}% done</span>
                        </div>
                      }
                    />
                  </div>

                  <div className="grid gap-4 grid-cols-1">
                    {topic.subtopics.map((sub) => {
                      const total = sub.problems.length;
                      const done = sub.problems.filter((p) =>
                        completed.has(p.id),
                      ).length;
                      const progress = total ? (done / total) * 100 : 0;
                      const isDone = done === total && total > 0;
                      return (
                        <div
                          key={sub.id}
                          className="ui-surface ui-surface--interactive flex flex-col overflow-hidden"
                        >
                          <div
                            className={`h-0.5 w-full ${isDone ? "bg-success" : "bg-muted"}`}
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
                            <AccordionItem
                              value={sub.id}
                              className="border-none"
                            >
                              <AccordionTrigger className="hover:no-underline px-6 py-5">
                                <div className="flex flex-col items-start text-left gap-2.5 w-full pr-2">
                                  <div className="flex items-center justify-between w-full gap-3">
                                    <h3 className="text-base font-semibold tracking-tight text-foreground line-clamp-1">
                                      {sub.title}
                                    </h3>
                                    <Pill
                                      tone={isDone ? "success" : "neutral"}
                                      mono
                                      className="shrink-0"
                                    >
                                      {isDone && <CheckCircle2 size={12} />}{" "}
                                      {done}/{total}
                                    </Pill>
                                  </div>
                                  <p className="text-sm leading-6 text-muted-foreground line-clamp-2 max-w-[95%]">
                                    {sub.description}
                                  </p>
                                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                                    <motion.div
                                      className={`h-full ${isDone ? "bg-success" : "bg-primary"}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progress}%` }}
                                      transition={{ duration: 0.5 }}
                                    />
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 pb-6 pt-0">
                                <div className="space-y-2.5">
                                  {sub.problems.map((prob) => {
                                    const checked = completed.has(prob.id);
                                    const isRevisionSaved =
                                      savedForRevision.has(prob.id);
                                    const isSavingNotes =
                                      savingNotesFor[prob.id] ?? false;
                                    const hasNotes =
                                      (notesByProblem[prob.id] ?? "").trim()
                                        .length > 0;
                                    const rowBusy =
                                      upsertingProblemId === prob.id;
                                    return (
                                      <div
                                        key={prob.id}
                                        className={`ui-surface p-4 transition-colors ${checked ? "border-success/40 bg-success/5" : "hover:bg-muted/30"}`}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex items-center gap-3 min-w-0">
                                            <Checkbox
                                              id={prob.id}
                                              checked={checked}
                                              onCheckedChange={() =>
                                                void toggleProblem(prob.id)
                                              }
                                              className="h-4 w-4 rounded border-border data-[state=checked]:bg-success data-[state=checked]:border-success shrink-0"
                                            />
                                            <label
                                              htmlFor={prob.id}
                                              className={`text-sm font-medium cursor-pointer select-none truncate leading-5 ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}
                                            >
                                              {prob.title}
                                            </label>
                                            {checked && (
                                              <CheckCircle2
                                                size={14}
                                                className="text-success hidden sm:block"
                                              />
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <span
                                              className={`text-xs font-medium px-2 py-0.5 rounded-md border ${getDifficultyColor(prob.difficulty)}`}
                                            >
                                              {prob.difficulty}
                                            </span>
                                            {rowBusy && (
                                              <Loader2
                                                size={13}
                                                className="animate-spin text-muted-foreground"
                                              />
                                            )}
                                          </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                          <div className="flex flex-wrap gap-1.5 mr-auto">
                                            {prob.companies
                                              .slice(0, 4)
                                              .map((c) => (
                                                <span
                                                  key={`${prob.id}-${c}`}
                                                  className="ui-chip"
                                                >
                                                  {c}
                                                </span>
                                              ))}
                                            {prob.companies.length > 4 && (
                                              <span className="text-xs text-muted-foreground">
                                                +{prob.companies.length - 4}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <AppTooltip content="LeetCode">
                                              <Button
                                                variant="line"
                                                size="sm"
                                                asChild
                                              >
                                                <a
                                                  href={prob.leetcodeLink}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                >
                                                  <span className="text-xs">
                                                    LC
                                                  </span>
                                                </a>
                                              </Button>
                                            </AppTooltip>
                                            <AppTooltip content="GeeksforGeeks">
                                              <Button
                                                variant="line"
                                                size="sm"
                                                asChild
                                              >
                                                <a
                                                  href={prob.gfgLink}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                >
                                                  <span className="text-xs">
                                                    GFG
                                                  </span>
                                                </a>
                                              </Button>
                                            </AppTooltip>
                                            <Button
                                              variant="solid"
                                              size="sm"
                                              asChild
                                            >
                                              <Link
                                                to={`/practice/solution/${prob.id}/${toProblemSlug(prob.title)}`}
                                              >
                                                <span className="text-xs">
                                                  Solution
                                                </span>
                                                <ArrowRight size={12} />
                                              </Link>
                                            </Button>
                                          </div>
                                        </div>

                                        <div className="ui-rule mt-3 flex flex-wrap items-center gap-2 pt-3">
                                          <Button
                                            variant={
                                              hasNotes ? "solid" : "line"
                                            }
                                            size="sm"
                                            type="button"
                                            onClick={() =>
                                              openNotesPopup(prob.id)
                                            }
                                            disabled={isSavingNotes}
                                          >
                                            {isSavingNotes ? (
                                              <Loader2
                                                size={12}
                                                className="animate-spin"
                                              />
                                            ) : (
                                              <StickyNote size={12} />
                                            )}
                                            <span className="text-xs">
                                              {hasNotes
                                                ? "Edit note"
                                                : "Add note"}
                                            </span>
                                          </Button>
                                          <Button
                                            variant={
                                              isRevisionSaved ? "solid" : "line"
                                            }
                                            size="sm"
                                            type="button"
                                            onClick={() =>
                                              void toggleSaveForRevision(
                                                prob.id,
                                              )
                                            }
                                          >
                                            <Sparkles size={12} />
                                            <span className="text-xs">
                                              {isRevisionSaved
                                                ? "Saved"
                                                : "Save"}
                                            </span>
                                          </Button>
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
        </Section>
      </PageShell>

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
