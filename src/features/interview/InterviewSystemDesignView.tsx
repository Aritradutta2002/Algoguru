"use client";

import type { ReactNode } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart2,
  BookOpen,
  Check,
  Code2,
  FileText,
  Layers,
  PanelLeftOpen,
  Search,
  StickyNote,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppTooltip } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { CodeBlock } from "@/components/CodeBlock";
import { DiagramRenderer } from "@/components/DiagramRenderer";
import { DraggableNoteEditor } from "@/components/DraggableNoteEditor";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  systemDesignTopics,
  type SystemDesignQuestion,
} from "@/data/systemDesignInterviewData";
import { supabase } from "@/integrations/supabase/client";
import { exportNotesPdf } from "./exportNotesPdf";
import { InterviewNotesDrawer } from "./InterviewNotesDrawer";

type SolutionView = "theory" | "code" | "visual" | null;

interface QuestionCardProps {
  question: SystemDesignQuestion;
  idx: number;
  isDone: boolean;
  hasNote: boolean;
  activeView: SolutionView;
  onToggleDone: (id: string) => void;
  onToggleView: (id: string, view: Exclude<SolutionView, null>) => void;
  onOpenNote: (id: string) => void;
}

function renderTheoryContent(text: string) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        const parts: ReactNode[] = [];
        const regex = /(\*\*(.+?)\*\*)/g;
        let last = 0;
        let m: RegExpExecArray | null;
        let k = 0;
        while ((m = regex.exec(line)) !== null) {
          if (m.index > last) parts.push(line.slice(last, m.index));
          parts.push(
            <strong key={k++} className="font-bold text-foreground">
              {m[2]}
            </strong>,
          );
          last = m.index + m[0].length;
        }
        if (last < line.length) parts.push(line.slice(last));
        const content = parts.length ? parts : line;
        if (
          line.startsWith("**") &&
          line.endsWith("**") &&
          line.indexOf("**", 2) === line.length - 2
        ) {
          return (
            <p key={i} className="text-[17px] font-bold text-primary mt-5 mb-2">
              {line.replace(/\*\*/g, "")}
            </p>
          );
        }
        return (
          <p key={i} className="text-[16px] leading-[1.9] text-foreground/90">
            {content}
          </p>
        );
      })}
    </div>
  );
}

const _QuestionCard = ({
  question,
  idx,
  isDone,
  hasNote,
  activeView,
  onToggleDone,
  onToggleView,
  onOpenNote,
}: QuestionCardProps) => {
  return (
    <Card
      className={`rounded-2xl transition-all duration-200 overflow-hidden relative shadow-none ${
        isDone
          ? "bg-success/5 border-success/20"
          : activeView
            ? "bg-card border-primary/30 shadow-sm"
            : "bg-card border-border/40 hover:border-border/60"
      }`}
    >
      {activeView && !isDone && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl" />
      )}
      <div className="p-5 md:p-7">
        <div className="flex items-start gap-4">
          <Button variant="bare" size="bare"
            type="button"
            onClick={() => onToggleDone(question.id)}
            title={isDone ? "Mark undone" : "Mark as done"}
            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              isDone
                ? "bg-success border-success text-white shadow-sm"
                : "border-border/50 hover:border-success/60 bg-card hover:bg-success/10"
            }`}
          >
            {isDone && <Check size={14} strokeWidth={3} />}
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[11px] font-mono font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md">
                Q{String(idx + 1).padStart(2, "0")}
              </span>
              {isDone && (
                <Badge className="text-[10px] font-bold text-success bg-success/10 rounded-full border-transparent">
                  Done
                </Badge>
              )}
              {hasNote && (
                <Badge className="text-[10px] font-bold text-warning bg-warning/10 rounded-full border-transparent">
                  Note Added
                </Badge>
              )}
              {question.diagram && (
                <Badge className="text-[10px] font-bold text-info bg-info/10 rounded-full border-transparent">
                  Visual
                </Badge>
              )}
            </div>
            <h3
              className={`text-[20px] font-[700] leading-[1.55] mb-3 ${
                isDone ? "opacity-40 line-through text-foreground" : "text-foreground"
              }`}
            >
              {question.question}
            </h3>
            {question.explanation && (
              <p
                className={`text-[16px] leading-[1.8] mb-5 ${
                  isDone ? "opacity-40" : "text-muted-foreground"
                }`}
              >
                {question.explanation}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-border/20">
              <Button
                type="button"
                variant={activeView === "theory" ? "accent" : "ghost"}
                onClick={() => onToggleView(question.id, "theory")}
                aria-expanded={activeView === "theory"}
                className={`h-auto px-5 py-2 rounded-full text-[13.5px] font-semibold ${
                  activeView === "theory"
                    ? "shadow-md shadow-primary/20"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <FileText size={15} /> Theory
              </Button>
              {question.diagram && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onToggleView(question.id, "visual")}
                  aria-expanded={activeView === "visual"}
                  className={`h-auto px-5 py-2 rounded-full text-[13.5px] font-semibold ${
                    activeView === "visual"
                      ? "bg-info text-white shadow-md shadow-info/20 hover:bg-info/90 hover:text-white"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <BarChart2 size={15} /> Visual
                </Button>
              )}
              {question.code && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onToggleView(question.id, "code")}
                  aria-expanded={activeView === "code"}
                  className={`h-auto px-5 py-2 rounded-full text-[13.5px] font-semibold ${
                    activeView === "code"
                      ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Code2 size={15} /> Code
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenNote(question.id)}
                aria-label={hasNote ? "Edit note" : "Add note"}
                className={`h-auto px-5 py-2 rounded-full text-[13.5px] font-semibold ${
                  hasNote
                    ? "bg-warning/15 text-warning hover:bg-warning/25 hover:text-warning"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <StickyNote size={15} /> {hasNote ? "Edit Note" : "Add Note"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {activeView && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/20" />
            <div className="p-5 md:p-7 space-y-4">
              {activeView === "theory" && (
                <div className="bg-muted/30 rounded-xl p-6 md:p-8 border border-border/20 shadow-inner">
                  {renderTheoryContent(question.answer)}
                </div>
              )}
              {activeView === "visual" && question.diagram && (
                <div className="overflow-x-auto">
                  <DiagramRenderer diagram={question.diagram} />
                </div>
              )}
              {activeView === "code" && question.code && (
                <div className="rounded-xl overflow-hidden shadow-lg border border-border/30">
                  <CodeBlock
                    language={question.codeLanguage || "java"}
                    code={question.code}
                    title="Example"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

function areCardsEqual(prev: QuestionCardProps, next: QuestionCardProps) {
  return (
    prev.isDone === next.isDone &&
    prev.hasNote === next.hasNote &&
    prev.activeView === next.activeView &&
    prev.question.id === next.question.id &&
    prev.idx === next.idx
  );
}

const QuestionCard = memo(_QuestionCard, areCardsEqual);

export default function InterviewSystemDesignView({
  language: languageProp,
}: {
  language?: string;
}) {
  const params = useParams<{ language?: string }>();
  const language = languageProp ?? params.language;
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const backRoute = language ? `/interview/${language}` : "/interview";

  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [solutionViewMap, setSolutionViewMap] = useState<
    Record<string, SolutionView>
  >({});
  const [showOnlyUndone, setShowOnlyUndone] = useState(false);
  const [topicSidebarOpen, setTopicSidebarOpen] = useState(false);
  const [upsertingId, setUpsertingId] = useState<string | null>(null);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const { setOpen: setGlobalSidebarOpen, toggleSidebar } = useSidebar();
  const sidebarWasOpen = useRef<boolean | null>(null);

  useEffect(() => {
    const sidebarEl = document.querySelector('[data-sidebar="sidebar"]');
    const isExpanded = sidebarEl?.closest('[data-state="expanded"]') !== null;
    sidebarWasOpen.current = isExpanded;
    setGlobalSidebarOpen(false);
    return () => {
      if (sidebarWasOpen.current) setGlobalSidebarOpen(true);
    };
  }, [setGlobalSidebarOpen]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeTopicsOnDesktop = () => {
      if (desktopQuery.matches) setTopicSidebarOpen(false);
    };
    closeTopicsOnDesktop();
    window.addEventListener("resize", closeTopicsOnDesktop);
    return () => window.removeEventListener("resize", closeTopicsOnDesktop);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        if (activeNoteId) setActiveNoteId(null);
        if (showNotesPanel) setShowNotesPanel(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeNoteId, showNotesPanel]);

  useEffect(() => {
    const hash =
      typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
    if (!hash) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
        setSolutionViewMap((prev) => ({ ...prev, [hash]: "theory" }));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setDoneMap({});
      setNotesMap({});
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("system_design_user_state")
        .select("question_id, notes, is_completed")
        .eq("user_id", user.id);
      if (error) {
        console.warn("Could not load system_design_user_state:", error.message);
        return;
      }
      const done: Record<string, boolean> = {};
      const notes: Record<string, string> = {};
      for (const row of data ?? []) {
        if (row.is_completed) done[row.question_id] = true;
        if (row.notes) notes[row.question_id] = row.notes;
      }
      setDoneMap(done);
      setNotesMap(notes);
    })();
  }, [authLoading, user]);

  const requireLogin = useCallback(
    (action: string) => {
      toast({
        title: "Please sign in",
        description: `Login required to ${action}.`,
        variant: "destructive",
      });
      router.push("/auth");
    },
    [router, toast],
  );

  const upsertUserState = useCallback(
    async (
      questionId: string,
      patch: Partial<{ notes: string; is_completed: boolean }>,
    ) => {
      if (!user) {
        requireLogin("save progress");
        return false;
      }
      setUpsertingId(questionId);
      const { error } = await supabase
        .from("system_design_user_state")
        .upsert(
          { user_id: user.id, question_id: questionId, ...patch },
          { onConflict: "user_id,question_id" },
        );
      setUpsertingId(null);
      if (error) {
        toast({
          title: "Save failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
      return true;
    },
    [user, requireLogin, toast],
  );

  const toggleDone = useCallback(
    async (id: string) => {
      setDoneMap((prev) => {
        const next = !prev[id];
        upsertUserState(id, { is_completed: next }).then((ok) => {
          if (!ok) setDoneMap((p) => ({ ...p, [id]: !next }));
        });
        return { ...prev, [id]: next };
      });
    },
    [upsertUserState],
  );

  const openNote = useCallback(
    (id: string) => {
      setActiveNoteId(id);
      setNoteDraft(notesMap[id] || "");
    },
    [notesMap],
  );

  const saveNote = async () => {
    if (!activeNoteId) return;
    const ok = await upsertUserState(activeNoteId, { notes: noteDraft });
    if (ok) {
      setNotesMap((prev) => ({ ...prev, [activeNoteId]: noteDraft }));
      setActiveNoteId(null);
      setNoteDraft("");
    }
  };

  const deleteNoteFromPanel = async (id: string) => {
    setDeletingNoteId(id);
    const ok = await upsertUserState(id, { notes: "" });
    if (ok) {
      setNotesMap((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
    }
    setDeletingNoteId(null);
  };

  const toggleSolutionView = useCallback(
    (id: string, view: Exclude<SolutionView, null>) => {
      setSolutionViewMap((prev) => ({
        ...prev,
        [id]: prev[id] === view ? null : view,
      }));
    },
    [],
  );

  const totalQuestions = useMemo(
    () => systemDesignTopics.reduce((s, t) => s + t.questions.length, 0),
    [],
  );
  const doneCount = useMemo(
    () => Object.values(doneMap).filter(Boolean).length,
    [doneMap],
  );
  const progressPct =
    totalQuestions > 0 ? Math.round((doneCount / totalQuestions) * 100) : 0;

  const filteredTopics = useMemo(() => {
    if (!debouncedSearch.trim() && !showOnlyUndone) return systemDesignTopics;
    const q = debouncedSearch.toLowerCase().trim();
    return systemDesignTopics
      .map((topic) => ({
        ...topic,
        questions: topic.questions.filter((question) => {
          const matchesSearch =
            !q ||
            question.question.toLowerCase().includes(q) ||
            question.answer.toLowerCase().includes(q);
          const matchesUndone = !showOnlyUndone || !doneMap[question.id];
          return matchesSearch && matchesUndone;
        }),
      }))
      .filter((t) => t.questions.length > 0);
  }, [debouncedSearch, showOnlyUndone, doneMap]);

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic((prev) => {
      const next = prev === topicId ? null : topicId;
      if (next) {
        setTimeout(() => {
          const el = document.getElementById(`topic-${next}`);
          if (el) {
            window.scrollTo({
              top: el.getBoundingClientRect().top + window.scrollY - 80,
              behavior: "smooth",
            });
          }
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return next;
    });
  };

  const allQuestions = useMemo(
    () => systemDesignTopics.flatMap((t) => t.questions),
    [],
  );

  const handleDownloadPdf = useCallback(() => {
    const items = Object.entries(notesMap)
      .filter(([, note]) => Boolean(note))
      .map(([id, note]) => ({
        title: allQuestions.find((q) => q.id === id)?.question ?? id,
        note,
      }));
    void exportNotesPdf(
      "System Design Interview Notes",
      "System-Design-Notes.pdf",
      items,
    );
  }, [allQuestions, notesMap]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-black">
      <header className="shrink-0 bg-card/90 backdrop-blur-xl border-b border-border/30 relative z-30">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <Button variant="bare" size="bare"
              type="button"
              onClick={() => router.push(backRoute)}
              className="group flex items-center justify-center w-9 h-9 rounded-full border border-border/40 bg-card hover:bg-muted/60 transition-all shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft
                size={16}
                className="text-muted-foreground group-hover:text-primary transition-transform group-hover:-translate-x-0.5"
              />
            </Button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0 hidden sm:block">
                <Layers size={16} className="text-primary" />
              </div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight truncate">
                System <span className="text-primary">Design</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end shrink-0">
            <div className="relative hidden md:block">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 z-10"
              />
              <Input
                type="text"
                placeholder="Search questions…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 h-9 text-sm border-border/40 bg-muted/20 rounded-full w-48 lg:w-64"
              />
            </div>

            <Button
              type="button"
              variant={showOnlyUndone ? "accent" : "outline"}
              size="sm"
              onClick={() => setShowOnlyUndone((v) => !v)}
              className={`rounded-full text-sm font-semibold hidden sm:inline-flex ${
                !showOnlyUndone
                  ? "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  : ""
              }`}
            >
              {showOnlyUndone ? "Show All" : "Undone Only"}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNotesPanel(true)}
              className="rounded-full text-sm font-semibold border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground gap-2"
            >
              <StickyNote size={14} />
              <span className="hidden sm:inline">Notes</span>
              {Object.keys(notesMap).length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-warning/20 text-warning text-[11px] font-bold">
                  {Object.keys(notesMap).length}
                </span>
              )}
            </Button>

            <AppTooltip content="Toggle App Sidebar">
              <Button variant="bare" size="bare"
                type="button"
                onClick={toggleSidebar}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 transition-all ml-1"
                aria-label="Toggle Sidebar"
              >
                <PanelLeftOpen size={16} />
              </Button>
            </AppTooltip>

            <Sheet
              open={topicSidebarOpen}
              onOpenChange={setTopicSidebarOpen}
            >
              <SheetTrigger asChild>
                <Button variant="bare" size="bare"
                  type="button"
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-border/40 bg-primary/10 text-primary hover:bg-primary/20 shrink-0 lg:hidden transition-all"
                  aria-label="Open Topics"
                >
                  <BookOpen size={16} />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                showClose={false}
                aria-modal="true"
                overlayClassName="lg:hidden"
                className="flex h-full w-[280px] max-w-[85vw] flex-col overflow-hidden border-r border-border/40 bg-card p-0 shadow-overlay backdrop-blur-none lg:hidden sm:max-w-[280px]"
              >
                <div className="flex shrink-0 items-center justify-between p-5">
                  <div>
                    <SheetTitle className="text-xs font-semibold text-muted-foreground">
                      Topics
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                      Choose a topic to filter the system design questions.
                    </SheetDescription>
                  </div>
                  <SheetClose asChild>
                    <Button variant="bare" size="bare"
                      type="button"
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Close topics drawer"
                    >
                      <X size={16} />
                    </Button>
                  </SheetClose>
                </div>
                <ScrollArea className="min-h-0 flex-1">
                  <div className="space-y-1.5 px-5 pb-5">
                    {systemDesignTopics.map((topic) => {
                      const topicDone = topic.questions.filter(
                        (q) => doneMap[q.id],
                      ).length;
                      const pct =
                        topic.questions.length > 0
                          ? Math.round((topicDone / topic.questions.length) * 100)
                          : 0;
                      return (
                        <Button variant="bare" size="bare"
                          key={topic.id}
                          type="button"
                          onClick={() => {
                            handleTopicClick(topic.id);
                            setTopicSidebarOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 rounded-xl transition-all border bg-transparent border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg shrink-0">{topic.icon}</span>
                            <span className="text-[13px] font-semibold truncate flex-1">
                              {topic.title}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground/60 shrink-0">
                              {topicDone}/{topic.questions.length}
                            </span>
                          </div>
                          <div className="ml-[34px] h-[3px] rounded-full bg-muted/60 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: "hsl(var(--primary))",
                              }}
                            />
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="h-[2px] w-full bg-muted/40 relative">
          <motion.div
            className="absolute left-0 top-0 bottom-0 bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </header>

      <div className="md:hidden px-4 py-3 bg-card border-b border-border/20 shrink-0">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 z-10"
          />
          <Input
            type="text"
            placeholder="Search questions…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border-border/40 bg-muted/20 rounded-full w-full"
          />
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            type="button"
            variant={showOnlyUndone ? "accent" : "outline"}
            size="sm"
            onClick={() => setShowOnlyUndone((v) => !v)}
            className="rounded-full text-[13px] font-semibold whitespace-nowrap shrink-0"
          >
            {showOnlyUndone ? "Show All" : "Undone Only"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex relative" style={{ minHeight: 0 }}>
        <aside className="hidden lg:flex w-[260px] xl:w-[300px] shrink-0 border-r border-border/40 bg-card/30 flex-col sticky top-0 self-start">
          <ScrollArea className="h-[calc(100vh-56px)]">
            <div className="p-5 pb-3">
              <h2 className="text-xs font-semibold text-muted-foreground mb-4 flex items-center justify-between">
                <span>Topics</span>
                <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded-full text-foreground/80 lowercase tracking-normal">
                  {doneCount}/{totalQuestions} done
                </span>
              </h2>

              <Button variant="bare" size="bare"
                type="button"
                onClick={() => handleTopicClick("")}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all mb-2 border ${
                  !selectedTopic
                    ? "bg-primary/10 border-primary/20 text-foreground"
                    : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🏗️</span>
                  <span className="text-sm font-semibold">All Topics</span>
                </div>
              </Button>

              <div className="space-y-1.5">
                {systemDesignTopics.map((topic) => {
                  const topicDone = topic.questions.filter((q) => doneMap[q.id]).length;
                  const pct =
                    topic.questions.length > 0
                      ? Math.round((topicDone / topic.questions.length) * 100)
                      : 0;
                  const isActive = selectedTopic === topic.id;
                  return (
                    <Button variant="bare" size="bare"
                      key={topic.id}
                      type="button"
                      onClick={() => handleTopicClick(topic.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${
                        isActive
                          ? "bg-primary/5 border-primary/20 text-foreground shadow-sm"
                          : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <span className="text-lg shrink-0">{topic.icon}</span>
                        <span className="text-[13px] font-semibold truncate flex-1 leading-tight">
                          {topic.title}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground/60 shrink-0">
                          {topicDone}/{topic.questions.length}
                        </span>
                      </div>
                      <div className="ml-[34px] h-[3px] rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background:
                              pct === 100 ? "hsl(var(--success))" : "hsl(var(--primary))",
                          }}
                        />
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="w-full px-4 md:px-8 lg:px-10 xl:px-14 py-6 pb-24">
            <div className="space-y-10">
              {!user && !authLoading && (
                <Alert className="p-5 rounded-2xl border-warning/30 bg-warning/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <AlertTitle className="text-sm font-bold text-warning mb-1">
                      Your progress isn&apos;t being saved
                    </AlertTitle>
                    <AlertDescription className="text-[13px] text-muted-foreground leading-relaxed">
                      Sign in to permanently save your progress and notes across devices.
                    </AlertDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={() => router.push("/auth")}
                    className="px-6 py-2.5 rounded-full bg-warning text-warning-foreground font-bold text-sm shrink-0 hover:bg-warning/90 h-auto"
                  >
                    Sign In
                  </Button>
                </Alert>
              )}

              {filteredTopics.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                    <Search size={28} className="text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    No questions found
                  </h3>
                  <p className="text-[15px] text-muted-foreground">
                    Try adjusting your search or removing filters.
                  </p>
                  {(searchQuery || showOnlyUndone) && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setSearchQuery("");
                        setShowOnlyUndone(false);
                        setSelectedTopic(null);
                      }}
                      className="mt-6 px-6 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              )}

              {filteredTopics.map((topic) => {
                if (selectedTopic && topic.id !== selectedTopic) return null;
                const topicDone = topic.questions.filter((q) => doneMap[q.id]).length;
                return (
                  <div
                    key={topic.id}
                    id={`topic-${topic.id}`}
                    className="space-y-5 scroll-mt-24"
                  >
                    <div className="flex items-center gap-4 pb-5 border-b-2 border-border/30">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl shrink-0">
                        {topic.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-[22px] font-semibold tracking-tight">
                          {topic.title}
                        </h2>
                        <p className="text-[14px] text-muted-foreground font-medium">
                          {topicDone}/{topic.questions.length} completed
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="w-32 h-[4px] rounded-full bg-muted/40 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${
                                topic.questions.length > 0
                                  ? Math.round((topicDone / topic.questions.length) * 100)
                                  : 0
                              }%`,
                              background:
                                topicDone === topic.questions.length
                                  ? "hsl(var(--success))"
                                  : "hsl(var(--primary))",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {topic.questions.map((question, idx) => (
                        <div key={question.id} id={question.id}>
                          <QuestionCard
                            question={question}
                            idx={idx}
                            isDone={Boolean(doneMap[question.id])}
                            hasNote={Boolean(notesMap[question.id])}
                            activeView={solutionViewMap[question.id] ?? null}
                            onToggleDone={toggleDone}
                            onToggleView={toggleSolutionView}
                            onOpenNote={openNote}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {activeNoteId && (
          <DraggableNoteEditor
            questionTitle={
              allQuestions.find((q) => q.id === activeNoteId)?.question ?? "Note"
            }
            value={noteDraft}
            onChange={setNoteDraft}
            onClose={() => setActiveNoteId(null)}
            onSave={saveNote}
            isSaving={Boolean(upsertingId)}
          />
        )}
      </AnimatePresence>

      <InterviewNotesDrawer
        open={showNotesPanel}
        onClose={() => setShowNotesPanel(false)}
        notesMap={notesMap}
        getQuestionMeta={(id) => ({
          title: allQuestions.find((q) => q.id === id)?.question ?? id,
        })}
        deletingNoteId={deletingNoteId}
        onDeleteNote={deleteNoteFromPanel}
        onEditNote={openNote}
        onDownloadPdf={handleDownloadPdf}
      />
    </div>
  );
}
