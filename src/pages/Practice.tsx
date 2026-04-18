import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { practiceData } from "../data/practiceData";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Loader2, Notebook, Save, TrendingUp, X } from "lucide-react";
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

function toProblemSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

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
    <div className="flex-1 min-h-screen bg-background text-foreground selection:bg-primary selection:text-black animate-in fade-in duration-700">
      
      {/* Header Section */}
      <section className="px-6 md:px-10 lg:px-16 py-16 md:py-20 max-w-7xl mx-auto relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center md:text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-[10px] font-bold uppercase tracking-widest mb-6">
              <TrendingUp size={12} className="text-primary" />
              <span className="text-muted-foreground">Master Data Structures & Algorithms</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-tight flex flex-wrap gap-x-3 items-center justify-center md:justify-start">
              <span className="text-foreground">Master</span>
              <span className="text-primary">Code.</span>
              <span className="text-foreground">Ace</span>
              <span className="text-warning">Interviews.</span>
            </h1>

            {loadingState && (
              <div className="mt-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/80">
                <Loader2 size={14} className="animate-spin" />
                Syncing your progress...
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-6 md:px-12 lg:px-20 pb-24 max-w-7xl mx-auto w-full space-y-16">
        {practiceData.map((topic) => {
          return (
            <div key={topic.id} className="space-y-8">
              <div className="space-y-2 border-b border-border/50 pb-6">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
                  {topic.title}
                </h2>
                <p className="text-sm font-medium text-muted-foreground/90">{topic.description}</p>
              </div>

              <div className="grid gap-6">
                {topic.subtopics.map((sub) => {
                  const total = sub.problems.length;
                  const completedSub = sub.problems.filter((p) => completed.has(p.id)).length;
                  const progress = total > 0 ? (completedSub / total) * 100 : 0;
                  const isDone = completedSub === total && total > 0;

                  return (
                    <div key={sub.id} className="group bg-card border rounded-[24px] overflow-hidden transition-all hover:shadow-xl hover:shadow-primary/5">
                      <Accordion
                        type="single"
                        collapsible
                        value={openSubtopicId === sub.id ? sub.id : undefined}
                        onValueChange={(nextValue) => setOpenSubtopicId(nextValue === sub.id ? sub.id : null)}
                        className="w-full"
                      >
                        <AccordionItem value={sub.id} className="border-none">
                          <AccordionTrigger className="hover:no-underline p-6 group">
                            <div className="flex flex-col items-start text-left gap-2 w-full pr-4">
                              <div className="flex items-center justify-between w-full">
                                <h3 className="text-lg font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                                  {sub.title}
                                </h3>
                                <div className={`px-2.5 py-1 text-[10px] font-bold rounded-full border flex items-center gap-1.5 transition-colors ${isDone ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted/80 text-muted-foreground'}`}>
                                  {isDone && <CheckCircle2 size={12} />}
                                  {completedSub}/{total}
                                </div>
                              </div>
                              <p className="text-xs font-medium text-muted-foreground/90 leading-relaxed max-w-[90%]">
                                {sub.description}
                              </p>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6 pt-0">
                            {/* Progress bar */}
                            <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-8">
                              <motion.div 
                                className="h-full bg-primary" 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5, type: "spring" }}
                              />
                            </div>
                            
                            <div className="space-y-4">
                              {sub.problems.map((prob) => {
                                const checked = completed.has(prob.id);
                                const isRevisionSaved = savedForRevision.has(prob.id);
                                const isSavingNotes = savingNotesFor[prob.id] ?? false;
                                const hasNotes = (notesByProblem[prob.id] ?? "").trim().length > 0;
                                const rowBusy = upsertingProblemId === prob.id;
                                return (
                                  <div
                                    key={prob.id}
                                    className={`p-4 border rounded-2xl transition-all ${
                                      checked
                                      ? "border-primary/20 bg-primary/[0.02]"
                                      : "border-border/50 hover:bg-muted/30"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-center gap-4">
                                        <Checkbox 
                                          id={prob.id} 
                                          checked={checked} 
                                          onCheckedChange={() => void toggleProblem(prob.id)} 
                                          className="h-5 w-5 rounded-md border-2 transition-all data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                        <label 
                                          htmlFor={prob.id} 
                                          className={`text-sm font-bold cursor-pointer select-none transition-all ${
                                            checked ? 'text-muted-foreground/80 line-through' : 'text-foreground'
                                          }`}
                                        >
                                          {prob.title}
                                        </label>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyColor(prob.difficulty)}`}>
                                          {prob.difficulty}
                                        </span>
                                        {rowBusy && <Loader2 size={14} className="animate-spin text-primary" />}
                                      </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                      <div className="flex flex-wrap gap-1.5 mr-auto">
                                        {prob.companies.map((company) => (
                                          <span
                                            key={`${prob.id}-${company}`}
                                            className="text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-md bg-muted/80 border border-border/50 text-muted-foreground"
                                          >
                                            {company}
                                          </span>
                                        ))}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <a
                                          href={prob.leetcodeLink}
                                          target="_blank"
                                          rel="noreferrer"
                                          title="Practice in LeetCode"
                                          className="flex h-8 w-8 items-center justify-center rounded-xl border bg-card text-muted-foreground transition-all hover:bg-primary hover:border-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20"
                                        >
                                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 32 32">
                                            <path d="M21.469 23.907l-3.595 3.473c-0.624 0.625-1.484 0.885-2.432 0.885s-1.807-0.26-2.432-0.885l-5.776-5.812c-0.62-0.625-0.937-1.537-0.937-2.485 0-0.952 0.317-1.812 0.937-2.432l5.76-5.844c0.62-0.619 1.5-0.859 2.448-0.859s1.808 0.26 2.432 0.885l3.595 3.473c0.687 0.688 1.823 0.663 2.536-0.052 0.708-0.713 0.735-1.848 0.047-2.536l-3.473-3.511c-0.901-0.891-2.032-1.505-3.261-1.787l3.287-3.333c0.688-0.687 0.667-1.823-0.047-2.536s-1.849-0.735-2.536-0.052l-13.469 13.469c-1.307 1.312-1.989 3.113-1.989 5.113 0 1.996 0.683 3.86 1.989 5.168l5.797 5.812c1.307 1.307 3.115 1.937 5.115 1.937 1.995 0 3.801-0.683 5.109-1.989l3.479-3.521c0.688-0.683 0.661-1.817-0.052-2.531s-1.849-0.74-2.531-0.052zM27.749 17.349h-13.531c-0.932 0-1.692 0.801-1.692 1.791 0 0.991 0.76 1.797 1.692 1.797h13.531c0.933 0 1.693-0.807 1.693-1.797 0-0.989-0.76-1.791-1.693-1.791z" />
                                          </svg>
                                        </a>

                                        <a
                                          href={prob.gfgLink}
                                          target="_blank"
                                          rel="noreferrer"
                                          title="Practice in GeeksforGeeks"
                                          className="flex h-8 w-8 items-center justify-center rounded-xl border bg-card text-muted-foreground transition-all hover:bg-primary hover:border-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20"
                                        >
                                          <img
                                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/GeeksForGeeks_logo.png/1280px-GeeksForGeeks_logo.png"
                                            alt="GFG"
                                            className="h-3.5 w-3.5 object-contain transition-all group-hover:invert-0"
                                            loading="lazy"
                                          />
                                        </a>

                                        <Link
                                          to={`/practice/solution/${prob.id}/${toProblemSlug(prob.title)}`}
                                          className="px-3 py-1.5 rounded-xl border bg-card text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-primary"
                                        >
                                          Solution
                                        </Link>
                                      </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-border/30">
                                      <button
                                        type="button"
                                        onClick={() => openNotesPopup(prob.id, prob.title)}
                                        disabled={isSavingNotes}
                                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-60 ${
                                          hasNotes
                                            ? "border-primary/30 bg-primary/10 text-primary"
                                            : "border-border/50 bg-muted/30 hover:bg-muted text-muted-foreground"
                                        }`}
                                      >
                                        {isSavingNotes ? <Loader2 size={12} className="animate-spin" /> : <Notebook size={12} />}
                                        {hasNotes ? "View Note" : "Add Note"}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => void toggleSaveForRevision(prob.id)}
                                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                                          isRevisionSaved
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border/50 bg-muted/30 hover:bg-muted text-muted-foreground"
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
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

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