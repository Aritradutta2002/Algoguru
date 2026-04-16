import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { practiceData } from "../data/practiceData";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, CheckCircle2, Code2, Loader2, Notebook, Save, TrendingUp, X } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

const CELEBRATION_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#eab308", "#10b981"];
const CELEBRATION_PARTICLE_COUNT = 18;

export default function Practice() {
  const NOTE_POPUP_WIDTH = 520;
  const NOTE_POPUP_HEIGHT = 420;
  const NOTE_POPUP_MARGIN = 16;

  const { user } = useAuth();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [savedForRevision, setSavedForRevision] = useState<Set<string>>(new Set());
  const [notesByProblem, setNotesByProblem] = useState<Record<string, string>>({});
  const [loadingState, setLoadingState] = useState(false);
  const [upsertingProblemId, setUpsertingProblemId] = useState<string | null>(null);
  const [savingNotesFor, setSavingNotesFor] = useState<Record<string, boolean>>({});
  const [openSubtopicId, setOpenSubtopicId] = useState<string | null>(null);
  const [activeNotesProblem, setActiveNotesProblem] = useState<{ id: string; title: string } | null>(null);
  const [notesPopupPosition, setNotesPopupPosition] = useState({ x: 24, y: 120 });
  const [isDraggingNotesPopup, setIsDraggingNotesPopup] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [celebrationBursts, setCelebrationBursts] = useState<CelebrationBurst[]>([]);
  const celebrationIdRef = useRef(0);

  useEffect(() => {
    if (!user) {
      setCompleted(new Set());
      setSavedForRevision(new Set());
      setNotesByProblem({});
      return;
    }

    let mounted = true;

    const loadUserProblemState = async () => {
      setLoadingState(true);
      const { data, error } = await supabase
        .from("practice_problem_user_state")
        .select("problem_id, notes, is_completed, is_saved_for_revision")
        .eq("user_id", user.id);

      if (!mounted) return;

      if (error) {
        toast({ title: "Load failed", description: error.message, variant: "destructive" });
        setLoadingState(false);
        return;
      }

      const completedSet = new Set<string>();
      const revisionSet = new Set<string>();
      const notesMap: Record<string, string> = {};

      for (const row of data ?? []) {
        if (row.is_completed) completedSet.add(row.problem_id);
        if (row.is_saved_for_revision) revisionSet.add(row.problem_id);
        if (row.notes) notesMap[row.problem_id] = row.notes;
      }

      setCompleted(completedSet);
      setSavedForRevision(revisionSet);
      setNotesByProblem(notesMap);
      setLoadingState(false);
    };

    loadUserProblemState();

    return () => {
      mounted = false;
    };
  }, [user]);

  const upsertUserState = async (
    problemId: string,
    patch: Partial<{ notes: string; is_completed: boolean; is_saved_for_revision: boolean }>,
  ) => {
    if (!user) {
      toast({ title: "Please sign in", description: "Login is required to save progress.", variant: "destructive" });
      return false;
    }

    const { error } = await supabase
      .from("practice_problem_user_state")
      .upsert(
        {
          user_id: user.id,
          problem_id: problemId,
          ...patch,
        },
        { onConflict: "user_id,problem_id" },
      );

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return false;
    }

    return true;
  };

  const toggleProblem = async (id: string) => {
    const currentlyCompleted = completed.has(id);
    const nextCompleted = !currentlyCompleted;

    setCompleted((prev) => {
      const next = new Set(prev);
      if (nextCompleted) next.add(id);
      else next.delete(id);
      return next;
    });

    setUpsertingProblemId(id);
    const ok = await upsertUserState(id, { is_completed: nextCompleted });
    setUpsertingProblemId(null);

    if (!ok) {
      setCompleted((prev) => {
        const rollback = new Set(prev);
        if (currentlyCompleted) rollback.add(id);
        else rollback.delete(id);
        return rollback;
      });
      return;
    }

    if (nextCompleted) {
      triggerCompletionCelebration(id);
    }
  };

  const toggleSaveForRevision = async (id: string) => {
    const currentlySaved = savedForRevision.has(id);
    const nextSaved = !currentlySaved;

    setSavedForRevision((prev) => {
      const next = new Set(prev);
      if (nextSaved) next.add(id);
      else next.delete(id);
      return next;
    });

    setUpsertingProblemId(id);
    const ok = await upsertUserState(id, { is_saved_for_revision: nextSaved });
    setUpsertingProblemId(null);

    if (!ok) {
      setSavedForRevision((prev) => {
        const rollback = new Set(prev);
        if (currentlySaved) rollback.add(id);
        else rollback.delete(id);
        return rollback;
      });
      return;
    }

    toast({ title: nextSaved ? "Saved for revision" : "Removed from revision" });
  };

  const saveNotes = async (id: string) => {
    const notes = notesByProblem[id] ?? "";
    setSavingNotesFor((prev) => ({ ...prev, [id]: true }));
    const ok = await upsertUserState(id, { notes });
    setSavingNotesFor((prev) => ({ ...prev, [id]: false }));

    if (ok) {
      toast({ title: "Notes saved" });
    }
  };

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const triggerCompletionCelebration = (problemId: string) => {
    const sourceElement = document.getElementById(problemId);
    const sourceRect = sourceElement?.getBoundingClientRect();
    const burstX = sourceRect ? sourceRect.left + sourceRect.width / 2 : window.innerWidth / 2;
    const burstY = sourceRect ? sourceRect.top + sourceRect.height / 2 : Math.min(window.innerHeight * 0.35, 240);

    celebrationIdRef.current += 1;
    const burstId = celebrationIdRef.current;

    const particles: CelebrationParticle[] = Array.from({ length: CELEBRATION_PARTICLE_COUNT }, (_, index) => {
      const angle = (Math.PI * 2 * index) / CELEBRATION_PARTICLE_COUNT;
      const spread = 60 + Math.random() * 80;

      return {
        x: Math.cos(angle) * spread,
        y: Math.sin(angle) * spread - (30 + Math.random() * 30),
        size: 5 + Math.round(Math.random() * 4),
        color: CELEBRATION_COLORS[index % CELEBRATION_COLORS.length],
        delay: Math.random() * 0.08,
        duration: 0.65 + Math.random() * 0.45,
        rotate: Math.random() * 540 - 270,
      };
    });

    setCelebrationBursts((prev) => [...prev, { id: burstId, x: burstX, y: burstY, particles }]);

    window.setTimeout(() => {
      setCelebrationBursts((prev) => prev.filter((burst) => burst.id !== burstId));
    }, 1300);
  };

  const openNotesPopup = (id: string, title: string) => {
    const popupWidth = Math.min(NOTE_POPUP_WIDTH, window.innerWidth - NOTE_POPUP_MARGIN * 2);
    const centeredX = Math.max(NOTE_POPUP_MARGIN, Math.round((window.innerWidth - popupWidth) / 2));
    const topY = Math.max(NOTE_POPUP_MARGIN, Math.round(window.innerHeight * 0.12));

    setNotesPopupPosition({ x: centeredX, y: topY });
    setActiveNotesProblem({ id, title });
  };

  const startDraggingNotesPopup = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    setIsDraggingNotesPopup(true);
    setDragOffset({
      x: event.clientX - notesPopupPosition.x,
      y: event.clientY - notesPopupPosition.y,
    });
  };

  useEffect(() => {
    if (!isDraggingNotesPopup) return;

    const handlePointerMove = (event: PointerEvent) => {
      const popupWidth = Math.min(NOTE_POPUP_WIDTH, window.innerWidth - NOTE_POPUP_MARGIN * 2);
      const popupHeight = Math.min(NOTE_POPUP_HEIGHT, window.innerHeight - NOTE_POPUP_MARGIN * 2);
      const maxX = window.innerWidth - popupWidth - NOTE_POPUP_MARGIN;
      const maxY = window.innerHeight - popupHeight - NOTE_POPUP_MARGIN;

      const nextX = clamp(event.clientX - dragOffset.x, NOTE_POPUP_MARGIN, maxX);
      const nextY = clamp(event.clientY - dragOffset.y, NOTE_POPUP_MARGIN, maxY);

      setNotesPopupPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      setIsDraggingNotesPopup(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragOffset.x, dragOffset.y, isDraggingNotesPopup]);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy": return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30";
      case "Medium": return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
      case "Hard": return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30";
      default: return "";
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col items-center p-6 md:p-10 w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="text-center space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 neo-badge bg-primary text-black px-3 py-1 text-xs font-black uppercase tracking-widest mb-2 border-2 border-black">
          <TrendingUp size={14} /> Master DSA
        </div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Pattern Wise Sheet</h1>
        <p className="text-muted-foreground font-semibold leading-relaxed">
          Master data structures and algorithms topic by topic. Track your progress and ace technical interviews.
        </p>
        {loadingState && (
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            Syncing your notes and revision list
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="w-full space-y-12">
        {practiceData.map((topic) => {
          
          return (
            <div key={topic.id} className="space-y-6">
              <div className="space-y-2 border-b-2 border-primary/20 pb-4">
                <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                  {topic.title}
                </h2>
                <p className="text-sm font-semibold text-muted-foreground">{topic.description}</p>
              </div>

              <div className="grid gap-6">
                {topic.subtopics.map((sub) => {
                  const total = sub.problems.length;
                  const completedSub = sub.problems.filter((p) => completed.has(p.id)).length;
                  const progress = total > 0 ? (completedSub / total) * 100 : 0;
                  const isDone = completedSub === total && total > 0;

                  return (
                    <Card key={sub.id} className="border-2 border-border shadow-[4px_4px_0_0_hsl(var(--border))] hover:shadow-[0px_0px_0_0_hsl(var(--border))] transition-all">
                      <Accordion
                        type="single"
                        collapsible
                        value={openSubtopicId === sub.id ? sub.id : undefined}
                        onValueChange={(nextValue) => setOpenSubtopicId(nextValue === sub.id ? sub.id : null)}
                        className="w-full"
                      >
                        <AccordionItem value={sub.id} className="border-none">
                          <CardHeader className="pb-3 pt-5 px-5">
                            <AccordionTrigger className="hover:no-underline py-0 group">
                              <div className="flex flex-col items-start text-left gap-1 space-y-1">
                                <div className="flex items-center justify-between w-full">
                                  <CardTitle className="text-lg font-black uppercase group-hover:text-primary transition-colors">
                                    {sub.title}
                                  </CardTitle>
                                  <div className={`px-2 py-1 text-xs font-bold rounded-md border-2 border-border flex items-center gap-1.5 ${isDone ? 'bg-primary text-black' : 'bg-card'}`}>
                                    {isDone && <CheckCircle2 size={12} />}
                                    {completedSub}/{total}
                                  </div>
                                </div>
                                <CardDescription className="text-xs font-semibold leading-relaxed mr-6 max-w-[85%]">
                                  {sub.description}
                                </CardDescription>
                              </div>
                            </AccordionTrigger>
                          </CardHeader>
                          <AccordionContent className="px-5 pb-5">
                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-5">
                              <motion.div 
                                className="h-full bg-primary" 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5, type: "spring" }}
                              />
                            </div>
                            
                            <div className="space-y-3 mt-4">
                              {sub.problems.map((prob) => {
                                const checked = completed.has(prob.id);
                                const isRevisionSaved = savedForRevision.has(prob.id);
                                const isSavingNotes = savingNotesFor[prob.id] ?? false;
                                const hasNotes = (notesByProblem[prob.id] ?? "").trim().length > 0;
                                const rowBusy = upsertingProblemId === prob.id;
                                return (
                                  <div
                                    key={prob.id}
                                    className={`p-3 border-2 rounded-md transition-colors ${
                                      checked
                                      ? "border-primary/50 bg-primary/5 shadow-sm"
                                      : "border-border/50 hover:bg-secondary/30"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                      <Checkbox 
                                        id={prob.id} 
                                        checked={checked} 
                                        onCheckedChange={() => void toggleProblem(prob.id)} 
                                        className="h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                                      />
                                      <label 
                                        htmlFor={prob.id} 
                                        className={`text-sm font-semibold cursor-pointer select-none transition-all ${
                                          checked ? 'line-through opacity-60' : ''
                                        }`}
                                      >
                                        {prob.title}
                                      </label>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={`text-[10px] font-black uppercase rounded-sm border ${getDifficultyColor(prob.difficulty)}`}>
                                          {prob.difficulty}
                                        </Badge>
                                        {rowBusy && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
                                      </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                      {prob.companies.map((company) => (
                                        <Badge
                                          key={`${prob.id}-${company}`}
                                          variant="outline"
                                          className="text-[10px] font-bold border-border/70 bg-card"
                                        >
                                          {company}
                                        </Badge>
                                      ))}

                                      <a
                                        href={prob.leetcodeLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Practice in LeetCode"
                                        aria-label="Practice in LeetCode"
                                        className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md border-2 border-border bg-card text-primary transition-colors hover:bg-primary hover:text-black"
                                      >
                                        <Code2 size={14} />
                                      </a>

                                      <a
                                        href={prob.gfgLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Practice in GeeksforGeeks"
                                        aria-label="Practice in GeeksforGeeks"
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border-2 border-border bg-card text-primary transition-colors hover:bg-primary hover:text-black"
                                      >
                                        <BookOpen size={14} />
                                      </a>

                                      <a
                                        href={prob.solutionLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-black uppercase tracking-wide text-primary hover:underline"
                                      >
                                        Solution
                                      </a>

                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => openNotesPopup(prob.id, prob.title)}
                                        disabled={isSavingNotes}
                                        className={`inline-flex items-center gap-1 rounded-md border-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide disabled:opacity-60 ${
                                          hasNotes
                                            ? "border-primary bg-primary/15 text-primary"
                                            : "border-border bg-card hover:bg-secondary"
                                        }`}
                                      >
                                        {isSavingNotes ? <Loader2 size={12} className="animate-spin" /> : <Notebook size={12} />}
                                        Note
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => void toggleSaveForRevision(prob.id)}
                                        className={`inline-flex items-center rounded-md border-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                                          isRevisionSaved
                                            ? "border-primary bg-primary text-black"
                                            : "border-border bg-card hover:bg-secondary"
                                        }`}
                                      >
                                        {isRevisionSaved ? "Saved for Revision" : "Save for Revision"}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
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
      </div>

      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {celebrationBursts.map((burst) => (
          <div
            key={burst.id}
            className="absolute"
            style={{ left: `${burst.x}px`, top: `${burst.y}px` }}
          >
            {burst.particles.map((particle, index) => (
              <motion.span
                key={`${burst.id}-${index}`}
                className="absolute rounded-sm"
                style={{
                  backgroundColor: particle.color,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                animate={{ x: particle.x, y: particle.y, opacity: 0, scale: 0.3, rotate: particle.rotate }}
                transition={{ duration: particle.duration, delay: particle.delay, ease: "easeOut" }}
              />
            ))}

            <motion.div
              className="absolute -left-7 -top-7 h-14 w-14 rounded-full border-2 border-primary/50"
              initial={{ scale: 0.25, opacity: 0.85 }}
              animate={{ scale: 1.7, opacity: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            />
          </div>
        ))}
      </div>

      {activeNotesProblem && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div
            className="absolute pointer-events-auto w-[min(520px,calc(100vw-2rem))] max-h-[min(420px,calc(100vh-2rem))] overflow-hidden rounded-xl border-2 border-border bg-card shadow-[8px_8px_0_0_hsl(var(--border))]"
            style={{ left: `${notesPopupPosition.x}px`, top: `${notesPopupPosition.y}px` }}
          >
            <div
              onPointerDown={startDraggingNotesPopup}
              className="flex cursor-move items-center justify-between border-b-2 border-border bg-secondary/50 px-3 py-2 select-none"
            >
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide">
                <Notebook size={14} />
                Notes
              </div>
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setActiveNotesProblem(null)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border-2 border-border bg-card hover:bg-secondary"
                aria-label="Close notes"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid gap-3 p-3">
              <p className="truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {activeNotesProblem.title}
              </p>
              <textarea
                value={notesByProblem[activeNotesProblem.id] ?? ""}
                onChange={(event) =>
                  setNotesByProblem((prev) => ({
                    ...prev,
                    [activeNotesProblem.id]: event.target.value,
                  }))
                }
                placeholder="Add your personal notes for this problem..."
                rows={10}
                className="min-h-[220px] w-full rounded-md border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void saveNotes(activeNotesProblem.id)}
                  disabled={savingNotesFor[activeNotesProblem.id] ?? false}
                  className="inline-flex items-center gap-1 rounded-md border-2 border-border bg-card px-2.5 py-1 text-[10px] font-black uppercase tracking-wide hover:bg-secondary disabled:opacity-60"
                >
                  {(savingNotesFor[activeNotesProblem.id] ?? false)
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Save size={12} />}
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}