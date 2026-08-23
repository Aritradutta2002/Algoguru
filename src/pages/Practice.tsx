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
      case "Easy": return "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20";
      case "Medium": return "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20";
      case "Hard": return "bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/20";
      default: return "bg-zinc-500 text-white";
    }
  };

  const totalProblems = useMemo(() => practiceData.reduce((acc, t) => acc + t.subtopics.reduce((a, s) => a + s.problems.length, 0), 0), []);
  const solvedCount = completed.size;
  const progressPct = totalProblems ? Math.round((solvedCount / totalProblems) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#08080a] selection:bg-amber-500/20 selection:text-amber-900 dark:selection:bg-amber-500/30 dark:selection:text-amber-100">
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />

      {/* HERO — larger fonts, better contrast */}
      <div className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.07] via-transparent to-rose-500/[0.06] dark:from-amber-500/[0.08] dark:to-rose-500/[0.06]" />
        <div className="absolute -top-24 -right-24 w-[520px] h-[520px] bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[520px] h-[520px] bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative mx-auto max-w-[1600px] px-4 md:px-6 lg:px-8 py-10 md:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black tracking-widest uppercase shadow-sm">
                <TrendingUp size={13} className="text-amber-400 dark:text-amber-600" /> Master Data Structures & Algorithms
              </div>
              <h1 className="mt-4 text-[32px] md:text-[46px] lg:text-[54px] font-black tracking-tight leading-[0.95]">
                <span className="text-zinc-900 dark:text-white">Master</span> <span className="text-amber-500">Code.</span> <span className="text-zinc-900 dark:text-white">Ace</span> <span className="text-zinc-400 dark:text-zinc-500">Interviews.</span>
              </h1>
              <p className="mt-4 text-[16px] md:text-[17px] leading-7 text-zinc-700 dark:text-zinc-300 max-w-2xl font-medium">
                Curated by pattern — Array, String, Binary Search, Stack, Linked List, Heap, Tree & more. Track progress, save notes, and solve with editorial.
              </p>
              {loadingState && <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-600"><Loader2 size={15} className="animate-spin" /> Syncing your progress...</div>}
            </div>

            <div className="w-full lg:w-[380px] shrink-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[15px] font-bold text-zinc-900 dark:text-white"><Target size={17} className="text-amber-500" /> Your Progress</div>
                <span className="text-sm font-black px-2.5 py-1 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">{solvedCount}/{totalProblems}</span>
              </div>
              <div className="mt-4 h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-sm font-medium">
                <span className="font-bold text-zinc-900 dark:text-white">{progressPct}% completed</span>
                <span className="text-zinc-600 dark:text-zinc-400">{totalProblems - solvedCount} remaining</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3">
                  <div className="text-xs font-bold tracking-widest uppercase text-zinc-600 dark:text-zinc-400">Solved</div>
                  <div className="text-base font-black text-zinc-900 dark:text-white mt-1">{solvedCount}</div>
                </div>
                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3">
                  <div className="text-xs font-bold tracking-widest uppercase text-zinc-600 dark:text-zinc-400">Saved</div>
                  <div className="text-base font-black text-zinc-900 dark:text-white mt-1">{savedForRevision.size}</div>
                </div>
                <div className="rounded-xl bg-amber-500 text-white p-3 shadow-sm">
                  <div className="text-xs font-bold tracking-widest uppercase opacity-90">Total</div>
                  <div className="text-base font-black mt-1">{totalProblems}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT — full width, larger fonts */}
      <div className="mx-auto max-w-[1600px] px-4 md:px-6 lg:px-8 py-8">
        <div className="space-y-12">
          {practiceData.map((topic) => {
            const accent = TOPIC_ACCENTS[topic.id] ?? { bg: "bg-zinc-900", text: "text-zinc-900", border: "border-zinc-200", soft: "bg-zinc-50" };
            const topicTotal = topic.subtopics.reduce((a, s) => a + s.problems.length, 0);
            const topicSolved = topic.subtopics.reduce((a, s) => a + s.problems.filter((p) => completed.has(p.id)).length, 0);
            const topicPct = topicTotal ? Math.round((topicSolved / topicTotal) * 100) : 0;
            return (
              <div key={topic.id} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-5">
                  <div className="flex items-start gap-4">
                    <div className={`hidden md:flex w-11 h-11 rounded-xl ${accent.bg} text-white items-center justify-center shadow-sm shrink-0`}>
                      <Layers size={19} />
                    </div>
                    <div>
                      <h2 className="text-[22px] md:text-[26px] font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
                        {topic.title}
                        <span className={`hidden md:inline-flex px-2.5 py-1 rounded-full text-xs font-black tracking-widest uppercase border ${accent.border} ${accent.soft} ${accent.text}`}>{topicSolved}/{topicTotal}</span>
                      </h2>
                      <p className="mt-1.5 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300 max-w-3xl font-medium">{topic.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-300">
                      <Code2 size={15} className={accent.text} /> {topicPct}% done
                    </div>
                    <div className="md:hidden px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-black">{topicSolved}/{topicTotal}</div>
                  </div>
                </div>

                <div className="grid gap-6 lg:gap-6 grid-cols-1 xl:grid-cols-2">
                  {topic.subtopics.map((sub) => {
                    const total = sub.problems.length;
                    const done = sub.problems.filter((p) => completed.has(p.id)).length;
                    const progress = total ? (done / total) * 100 : 0;
                    const isDone = done === total && total > 0;
                    return (
                      <div key={sub.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                        <div className={`h-1 w-full ${isDone ? "bg-emerald-500" : `bg-gradient-to-r ${accent.bg === "bg-blue-500" ? "from-blue-500 to-cyan-500" : accent.bg === "bg-emerald-500" ? "from-emerald-500 to-teal-500" : accent.bg === "bg-amber-500" ? "from-amber-500 to-orange-500" : accent.bg === "bg-purple-500" ? "from-purple-500 to-pink-500" : accent.bg === "bg-rose-500" ? "from-rose-500 to-pink-500" : "from-zinc-900 to-zinc-700"}`}`} />
                        <Accordion type="single" collapsible value={openSubtopicId === sub.id ? sub.id : undefined} onValueChange={(v) => setOpenSubtopicId(v === sub.id ? sub.id : null)} className="w-full">
                          <AccordionItem value={sub.id} className="border-none">
                            <AccordionTrigger className="hover:no-underline p-6 group/trigger">
                              <div className="flex flex-col items-start text-left gap-2.5 w-full pr-2">
                                <div className="flex items-center justify-between w-full gap-3">
                                  <h3 className="text-[16px] md:text-[17px] font-black tracking-tight text-zinc-900 dark:text-white group-hover/trigger:text-amber-600 transition-colors line-clamp-1">
                                    {sub.title}
                                  </h3>
                                  <div className={`shrink-0 px-3 py-1 text-sm font-black rounded-full border flex items-center gap-1.5 ${isDone ? "bg-emerald-500 border-emerald-500 text-white" : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"}`}>
                                    {isDone && <CheckCircle2 size={13} />} {done}/{total}
                                  </div>
                                </div>
                                <p className="text-[14px] leading-6 text-zinc-700 dark:text-zinc-300 line-clamp-2 max-w-[95%] font-medium">{sub.description}</p>
                                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
                                  <motion.div className={`h-full ${isDone ? "bg-emerald-500" : "bg-zinc-900 dark:bg-white"}`} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 pt-0">
                              <div className="space-y-3.5">
                                {sub.problems.map((prob) => {
                                  const checked = completed.has(prob.id);
                                  const isRevisionSaved = savedForRevision.has(prob.id);
                                  const isSavingNotes = savingNotesFor[prob.id] ?? false;
                                  const hasNotes = (notesByProblem[prob.id] ?? "").trim().length > 0;
                                  const rowBusy = upsertingProblemId === prob.id;
                                  return (
                                    <div key={prob.id} className={`group/row p-4 md:p-5 rounded-xl border transition-all ${checked ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/20" : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm"}`}>
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3.5 min-w-0">
                                          <Checkbox id={prob.id} checked={checked} onCheckedChange={() => void toggleProblem(prob.id)} className="h-5 w-5 rounded-md border-2 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 shrink-0" />
                                          <label htmlFor={prob.id} className={`text-[15px] font-bold cursor-pointer select-none truncate leading-5 ${checked ? "text-zinc-500 line-through" : "text-zinc-900 dark:text-white"}`}>
                                            {prob.title}
                                          </label>
                                          {checked && <CheckCircle2 size={15} className="text-emerald-500 hidden sm:block" />}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${getDifficultyColor(prob.difficulty)}`}>{prob.difficulty}</span>
                                          {rowBusy && <Loader2 size={15} className="animate-spin text-zinc-500" />}
                                        </div>
                                      </div>

                                      <div className="mt-3.5 flex flex-wrap items-center gap-2">
                                        <div className="flex flex-wrap gap-1.5 mr-auto">
                                          {prob.companies.slice(0, 4).map((c) => (
                                            <span key={`${prob.id}-${c}`} className="text-xs font-bold px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                                              {c}
                                            </span>
                                          ))}
                                          {prob.companies.length > 4 && <span className="text-xs font-bold text-zinc-500">+{prob.companies.length - 4}</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <AppTooltip content="LeetCode">
                                            <a href={prob.leetcodeLink} target="_blank" rel="noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 transition-colors">
                                              <span className="text-xs font-black">LC</span>
                                            </a>
                                          </AppTooltip>
                                          <AppTooltip content="GeeksforGeeks">
                                            <a href={prob.gfgLink} target="_blank" rel="noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors">
                                              <span className="text-xs font-black">GFG</span>
                                            </a>
                                          </AppTooltip>
                                          <Link to={`/practice/solution/${prob.id}/${toProblemSlug(prob.title)}`} className="px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black hover:opacity-90 inline-flex items-center gap-1.5">
                                            Solution <ArrowRight size={13} />
                                          </Link>
                                        </div>
                                      </div>

                                      <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3.5 border-t border-zinc-200 dark:border-zinc-700/50">
                                        <button type="button" onClick={() => openNotesPopup(prob.id)} disabled={isSavingNotes} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${hasNotes ? "bg-amber-500 border-amber-500 text-white" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"}`}>
                                          {isSavingNotes ? <Loader2 size={13} className="animate-spin" /> : <StickyNote size={13} />} {hasNotes ? "Edit Note" : "Add Note"}
                                        </button>
                                        <button type="button" onClick={() => void toggleSaveForRevision(prob.id)} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border ${isRevisionSaved ? "bg-amber-500 border-amber-500 text-white" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"}`}>
                                          <Sparkles size={13} /> {isRevisionSaved ? "Saved" : "Save"}
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
