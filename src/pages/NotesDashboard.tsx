import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { coreJavaInterviewTopics } from "@/data/coreJavaInterviewData";
import { practiceData } from "@/data/practiceData";
import { systemDesignTopics } from "@/data/systemDesignInterviewData";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  FileText,
  Download,
  Trash2,
  StickyNote,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Eye,
  PencilLine,
  Save,
  X,
  CheckCircle2,
} from "lucide-react";
import jsPDF from "jspdf";
import {
  renderNoteMarkdown,
  parseNoteSegments,
} from "@/lib/renderNoteMarkdown";
import RichTextNoteEditor from "@/components/RichTextNoteEditor";
import { motion, AnimatePresence } from "framer-motion";
import { AppTooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  PageHeader,
  PageShell,
  Pill,
  Section,
  Surface,
  Toolbar,
} from "@/components/layout/PagePrimitives";

type NoteSource = "core-java" | "practice" | "system-design";

interface NoteEntry {
  source: NoteSource;
  questionId: string;
  notes: string;
  isCompleted: boolean;
  updatedAt: string;
}

const toProblemSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const makeNoteKey = (source: NoteSource, questionId: string) =>
  `${source}:${questionId}`;

const parseNoteKey = (
  key: string,
): { source: NoteSource; questionId: string } | null => {
  const parts = key.split(":");
  if (parts.length < 2) return null;
  const source = parts[0];
  const questionId = parts.slice(1).join(":");
  if (
    (source !== "core-java" &&
      source !== "practice" &&
      source !== "system-design") ||
    !questionId
  )
    return null;
  return { source, questionId };
};

export default function NotesDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notesData, setNotesData] = useState<NoteEntry[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [searchNotes, setSearchNotes] = useState("");
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<Record<string, boolean>>(
    {},
  );
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const saveFeedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveFeedbackTimerRef.current) {
        window.clearTimeout(saveFeedbackTimerRef.current);
      }
    };
  }, []);

  const coreQuestionsById = useMemo(() => {
    const map = new Map<
      string,
      { question: string; topicId: string; topicTitle: string }
    >();
    for (const topic of coreJavaInterviewTopics) {
      for (const question of topic.questions) {
        map.set(question.id, {
          question: question.question,
          topicId: topic.id,
          topicTitle: topic.title,
        });
      }
    }
    return map;
  }, []);

  const practiceProblemsById = useMemo(() => {
    const map = new Map<
      string,
      {
        title: string;
        topicTitle: string;
        subtopicTitle: string;
      }
    >();

    for (const topic of practiceData) {
      for (const subtopic of topic.subtopics) {
        for (const problem of subtopic.problems) {
          map.set(problem.id, {
            title: problem.title,
            topicTitle: topic.title,
            subtopicTitle: subtopic.title,
          });
        }
      }
    }

    return map;
  }, []);

  const systemDesignQuestionsById = useMemo(() => {
    const map = new Map<
      string,
      { question: string; topicId: string; topicTitle: string }
    >();
    for (const topic of systemDesignTopics) {
      for (const question of topic.questions) {
        map.set(question.id, {
          question: question.question,
          topicId: topic.id,
          topicTitle: topic.title,
        });
      }
    }
    return map;
  }, []);

  const getNoteMeta = useCallback(
    (entry: NoteEntry) => {
      if (entry.source === "practice") {
        const practice = practiceProblemsById.get(entry.questionId);
        const title = practice?.title ?? entry.questionId;
        return {
          title,
          topic: practice?.topicTitle ?? "Practice",
          topicTag: practice
            ? `${practice.topicTitle} / ${practice.subtopicTitle}`
            : "Practice",
          sourceLabel: "Practice",
          contextPath: `/practice/solution/${entry.questionId}/${toProblemSlug(title)}`,
          contextCta: "View Problem",
        };
      }

      if (entry.source === "system-design") {
        const sd = systemDesignQuestionsById.get(entry.questionId);
        return {
          title: sd?.question ?? entry.questionId,
          topic: sd?.topicTitle ?? "System Design",
          topicTag: sd?.topicTitle ?? "System Design",
          sourceLabel: "System Design",
          contextPath: "/interview/java/system-design",
          contextCta: "View Context",
        };
      }

      const core = coreQuestionsById.get(entry.questionId);
      return {
        title: core?.question ?? entry.questionId,
        topic: core?.topicTitle ?? "Core Java",
        topicTag: core?.topicTitle ?? "Core Java",
        sourceLabel: "Interview",
        contextPath: "/interview/java/core-java-qa",
        contextCta: "View Context",
      };
    },
    [coreQuestionsById, practiceProblemsById, systemDesignQuestionsById],
  );

  // Load notes from Supabase
  const loadNotes = useCallback(async () => {
    if (!user) {
      setNotesData([]);
      setNotesLoading(false);
      return;
    }

    setNotesLoading(true);

    const [coreResult, practiceResult, systemDesignResult] = await Promise.all([
      supabase
        .from("core_java_user_state")
        .select("question_id, notes, is_completed, updated_at")
        .eq("user_id", user.id),
      supabase
        .from("practice_problem_user_state")
        .select("problem_id, notes, is_completed, updated_at")
        .eq("user_id", user.id),
      supabase
        .from("system_design_user_state")
        .select("question_id, notes, is_completed, updated_at")
        .eq("user_id", user.id),
    ]);

    if (coreResult.error) {
      toast({
        title: "Load failed",
        description: coreResult.error.message,
        variant: "destructive",
      });
    }
    if (practiceResult.error) {
      toast({
        title: "Load failed",
        description: practiceResult.error.message,
        variant: "destructive",
      });
    }
    if (systemDesignResult.error) {
      toast({
        title: "Load failed",
        description: systemDesignResult.error.message,
        variant: "destructive",
      });
    }

    const coreEntries: NoteEntry[] = (coreResult.data ?? [])
      .filter((row) => row.notes && row.notes.trim())
      .map((row) => ({
        source: "core-java" as NoteSource,
        questionId: row.question_id,
        notes: row.notes,
        isCompleted: row.is_completed,
        updatedAt: row.updated_at,
      }));

    const practiceEntries: NoteEntry[] = (practiceResult.data ?? [])
      .filter((row) => row.notes && row.notes.trim())
      .map((row) => ({
        source: "practice" as NoteSource,
        questionId: row.problem_id,
        notes: row.notes,
        isCompleted: row.is_completed,
        updatedAt: row.updated_at,
      }));

    const systemDesignEntries: NoteEntry[] = (systemDesignResult.data ?? [])
      .filter((row) => row.notes && row.notes.trim())
      .map((row) => ({
        source: "system-design" as NoteSource,
        questionId: row.question_id,
        notes: row.notes,
        isCompleted: row.is_completed,
        updatedAt: row.updated_at,
      }));

    setNotesData(
      [...coreEntries, ...practiceEntries, ...systemDesignEntries].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    );
    setNotesLoading(false);
  }, [user]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Real-time subscription: updates dashboard instantly when notes change from interview/practice pages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notes-dashboard-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "core_java_user_state",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotes();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "practice_problem_user_state",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotes();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "system_design_user_state",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotes();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadNotes]);

  const deleteNote = async (entry: NoteEntry) => {
    if (!user) return;
    const noteId = makeNoteKey(entry.source, entry.questionId);
    setDeletingId(noteId);

    const table =
      entry.source === "practice"
        ? "practice_problem_user_state"
        : entry.source === "system-design"
          ? "system_design_user_state"
          : "core_java_user_state";
    const idColumn = entry.source === "practice" ? "problem_id" : "question_id";

    const { error } = await supabase
      .from(table)
      .update({ notes: "" })
      .eq("user_id", user.id)
      .eq(idColumn, entry.questionId);

    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNotesData((prev) =>
        prev.filter(
          (n) =>
            !(n.source === entry.source && n.questionId === entry.questionId),
        ),
      );
      setSelectedNotes((prev) => {
        const next = { ...prev };
        delete next[noteId];
        return next;
      });
      if (activeNoteId === noteId) {
        setActiveNoteId(null);
        setNoteDraft("");
        setIsEditingNote(false);
      }
      toast({ title: "Note deleted" });
    }
    setDeletingId(null);
  };

  const openNoteModal = useCallback((entry: NoteEntry, editMode = false) => {
    setActiveNoteId(makeNoteKey(entry.source, entry.questionId));
    setNoteDraft(entry.notes);
    setIsEditingNote(editMode);
    setSavedNoteId(null);
  }, []);

  const closeNoteModal = useCallback(() => {
    setActiveNoteId(null);
    setNoteDraft("");
    setIsEditingNote(false);
    setSavedNoteId(null);
  }, []);

  const saveNote = useCallback(async () => {
    if (!user || !activeNoteId) return;

    const parsed = parseNoteKey(activeNoteId);
    if (!parsed) return;

    const trimmed = noteDraft.trim();
    setSavingNoteId(activeNoteId);

    const table =
      parsed.source === "practice"
        ? "practice_problem_user_state"
        : parsed.source === "system-design"
          ? "system_design_user_state"
          : "core_java_user_state";
    const idColumn =
      parsed.source === "practice" ? "problem_id" : "question_id";

    const { error } = await supabase
      .from(table)
      .update({ notes: trimmed })
      .eq("user_id", user.id)
      .eq(idColumn, parsed.questionId);

    if (error) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
      setSavingNoteId(null);
      setSavedNoteId(null);
      return;
    }

    if (!trimmed) {
      setNotesData((prev) =>
        prev.filter(
          (entry) =>
            !(
              entry.source === parsed.source &&
              entry.questionId === parsed.questionId
            ),
        ),
      );
      setSelectedNotes((prev) => {
        const next = { ...prev };
        delete next[activeNoteId];
        return next;
      });
      toast({ title: "Note removed" });
      closeNoteModal();
      setSavingNoteId(null);
      setSavedNoteId(null);
      return;
    }

    setNotesData((prev) =>
      prev
        .map((entry) =>
          entry.source === parsed.source &&
          entry.questionId === parsed.questionId
            ? { ...entry, notes: trimmed, updatedAt: new Date().toISOString() }
            : entry,
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    );
    toast({ title: "Note saved successfully" });
    setSavedNoteId(activeNoteId);
    if (saveFeedbackTimerRef.current) {
      window.clearTimeout(saveFeedbackTimerRef.current);
    }
    saveFeedbackTimerRef.current = window.setTimeout(() => {
      setSavedNoteId((prev) => (prev === activeNoteId ? null : prev));
    }, 2200);
    setSavingNoteId(null);
  }, [activeNoteId, closeNoteModal, noteDraft, user]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    let result = notesData;

    if (filterTopic === "practice") {
      result = result.filter((n) => n.source === "practice");
    } else if (filterTopic === "core-java") {
      result = result.filter((n) => n.source === "core-java");
    } else if (filterTopic === "system-design") {
      result = result.filter((n) => n.source === "system-design");
    } else if (filterTopic !== "all") {
      const topicQuestionIds =
        coreJavaInterviewTopics
          .find((t) => t.id === filterTopic)
          ?.questions.map((q) => q.id) ?? [];
      result = result.filter(
        (n) =>
          n.source === "core-java" && topicQuestionIds.includes(n.questionId),
      );
    }

    if (searchNotes.trim()) {
      const q = searchNotes.toLowerCase();
      result = result.filter((n) => {
        const meta = getNoteMeta(n);
        return (
          meta.title.toLowerCase().includes(q) ||
          meta.topic.toLowerCase().includes(q) ||
          n.notes.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [notesData, filterTopic, searchNotes, getNoteMeta]);

  const notesCount = notesData.length;
  const selectedFilteredNotes = filteredNotes.filter(
    (entry) => selectedNotes[makeNoteKey(entry.source, entry.questionId)],
  );
  const allFilteredSelected =
    filteredNotes.length > 0 &&
    filteredNotes.every(
      (entry) => selectedNotes[makeNoteKey(entry.source, entry.questionId)],
    );
  const activeNoteEntry = useMemo(() => {
    if (!activeNoteId) return null;
    const parsed = parseNoteKey(activeNoteId);
    if (!parsed) return null;
    return (
      notesData.find(
        (entry) =>
          entry.source === parsed.source &&
          entry.questionId === parsed.questionId,
      ) ?? null
    );
  }, [activeNoteId, notesData]);
  const activeMeta = activeNoteEntry ? getNoteMeta(activeNoteEntry) : null;

  const exportNotesToPDF = useCallback(
    (entries: NoteEntry[], filename: string, title: string) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const usableWidth = pageWidth - margin * 2;
      let y = 20;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, y);
      y += 10;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
      y += 8;
      doc.setTextColor(0, 0, 0);

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      if (entries.length === 0) {
        doc.setFontSize(12);
        doc.text("No notes to export.", margin, y);
      } else {
        for (const entry of entries) {
          const noteMeta = getNoteMeta(entry);

          if (y > 260) {
            doc.addPage();
            y = 20;
          }

          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 100, 200);
          doc.text(`${noteMeta.sourceLabel} • ${noteMeta.topicTag}`, margin, y);
          y += 5;

          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 0, 0);
          const qText = noteMeta.title;
          const qLines = doc.splitTextToSize(`Q: ${qText}`, usableWidth);
          doc.text(qLines, margin, y);
          y += qLines.length * 5 + 2;

          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);

          // Note content with formatting
          const segments = parseNoteSegments(entry.notes);
          let lineX = margin + 4;

          for (const seg of segments) {
            if (seg.text === "\n") {
              y += 4.5;
              lineX = margin + 4;
              if (y > 275) {
                doc.addPage();
                y = 20;
              }
              continue;
            }

            const fontSize = seg.heading ? 11 : 9;
            doc.setFontSize(fontSize);
            const fontStyle = seg.bold
              ? "bold"
              : seg.italic
                ? "italic"
                : "normal";
            doc.setFont("helvetica", fontStyle);

            const availableWidth = pageWidth - margin - lineX;
            const textWidth = doc.getTextWidth(seg.text);

            if (textWidth > availableWidth) {
              const words = seg.text.split(" ");
              let currentLine = "";
              for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const testWidth = doc.getTextWidth(testLine);
                if (testWidth > availableWidth && currentLine) {
                  doc.text(currentLine, lineX, y);
                  y += fontSize * 0.5;
                  lineX = margin + 4;
                  currentLine = word;
                  if (y > 275) {
                    doc.addPage();
                    y = 20;
                  }
                } else {
                  currentLine = testLine;
                }
              }
              if (currentLine) {
                doc.text(currentLine, lineX, y);
                lineX += doc.getTextWidth(currentLine) + 1;
              }
            } else {
              doc.text(seg.text, lineX, y);
              lineX += textWidth + 1;
            }
          }

          y += 8;

          doc.setDrawColor(230, 230, 230);
          doc.line(margin, y - 3, pageWidth - margin, y - 3);
          y += 2;
        }
      }

      doc.save(filename);
    },
    [getNoteMeta],
  );

  const downloadAllNotesPDF = useCallback(() => {
    exportNotesToPDF(
      filteredNotes,
      "algoguru-notes-merged.pdf",
      "AlgoGuru — Merged Notes",
    );
  }, [exportNotesToPDF, filteredNotes]);

  const downloadSelectedNotesPDF = useCallback(() => {
    const selectedEntry = selectedFilteredNotes[0];
    const selectedKey = selectedEntry
      ? makeNoteKey(selectedEntry.source, selectedEntry.questionId).replace(
          /:/g,
          "-",
        )
      : "selected";
    exportNotesToPDF(
      selectedFilteredNotes,
      selectedFilteredNotes.length === 1
        ? `algoguru-note-${selectedKey}.pdf`
        : "algoguru-selected-notes.pdf",
      selectedFilteredNotes.length === 1
        ? "AlgoGuru — Selected Note"
        : "AlgoGuru — Selected Notes",
    );
  }, [exportNotesToPDF, selectedFilteredNotes]);

  const downloadSingleNotePDF = useCallback(
    (entry: NoteEntry) => {
      exportNotesToPDF(
        [entry],
        `algoguru-note-${entry.source}-${entry.questionId}.pdf`,
        "AlgoGuru — Note",
      );
    },
    [exportNotesToPDF],
  );

  const toggleNoteSelection = useCallback((noteKey: string) => {
    setSelectedNotes((prev) => ({ ...prev, [noteKey]: !prev[noteKey] }));
  }, []);

  const toggleSelectAllFiltered = useCallback(() => {
    setSelectedNotes((prev) => {
      const next = { ...prev };

      if (allFilteredSelected) {
        for (const entry of filteredNotes) {
          delete next[makeNoteKey(entry.source, entry.questionId)];
        }
        return next;
      }

      for (const entry of filteredNotes) {
        next[makeNoteKey(entry.source, entry.questionId)] = true;
      }
      return next;
    });
  }, [allFilteredSelected, filteredNotes]);

  if (notesLoading && notesData.length === 0) {
    return (
      <div className="ui-app-canvas">
        <PageShell>
          <Section spacing="compact">
            <p className="ui-meta flex items-center gap-2">
              <Loader2 className="animate-spin" size={14} aria-hidden="true" />
              Loading your notes…
            </p>
          </Section>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="ui-app-canvas">
      <PageShell>
        <PageHeader
          variant="display"
          kicker="Knowledge base"
          title={
            <>
              My <span className="text-primary">notes</span>
            </>
          }
          description="Manage your personal study material. Notes persist across all your devices and flow back into the interview and practice tracks."
          meta={`${notesCount} note${notesCount === 1 ? "" : "s"} saved across your journey`}
          actions={
            <>
              <Button
                variant="line"
                size="sm"
                onClick={downloadAllNotesPDF}
                disabled={filteredNotes.length === 0}
              >
                <Download size={14} />
                <span className="text-xs">Merge all PDF</span>
              </Button>
              <Button
                variant="line"
                size="sm"
                onClick={downloadSelectedNotesPDF}
                disabled={selectedFilteredNotes.length === 0}
              >
                <Download size={14} />
                <span className="text-xs">Selected PDF</span>
              </Button>
              <Button
                variant="solid"
                size="sm"
                onClick={() => navigate("/interview/java/core-java-qa")}
              >
                <StickyNote size={14} />
                <span className="text-xs">Add interview notes</span>
              </Button>
            </>
          }
        />

        <Section spacing="compact">
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              variant="line"
              size="sm"
              onClick={() => navigate("/practice")}
            >
              <StickyNote size={14} />
              <span className="text-xs">Add practice notes</span>
            </Button>
            <Button
              variant="line"
              size="sm"
              onClick={() => navigate("/interview/java/system-design")}
            >
              <StickyNote size={14} />
              <span className="text-xs">Add system design notes</span>
            </Button>
          </div>

          <Toolbar className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search through your notes…"
                value={searchNotes}
                onChange={(e) => setSearchNotes(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                aria-label="Filter notes by track"
                className="h-9 cursor-pointer rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="all">All notes</option>
                <option value="practice">Practice</option>
                <option value="core-java">Interview (Core Java)</option>
                <option value="system-design">Interview (System Design)</option>
                {coreJavaInterviewTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
              <Button
                variant="line"
                size="sm"
                onClick={toggleSelectAllFiltered}
                disabled={filteredNotes.length === 0}
              >
                <span className="text-xs">
                  {allFilteredSelected ? "Clear selection" : "Select all"}
                </span>
              </Button>
            </div>
          </Toolbar>

          {filteredNotes.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="ui-meta">
                {filteredNotes.length} visible · {selectedFilteredNotes.length}{" "}
                selected
              </span>
            </div>
          )}

          {/* Notes Grid */}
          {filteredNotes.length === 0 ? (
            <EmptyState
              className="mt-6"
              icon={<FileText size={22} />}
              title={notesCount === 0 ? "No notes yet" : "No matches found"}
              description={
                notesCount === 0
                  ? "Start building your knowledge base by adding notes in interview or practice pages."
                  : "Try adjusting your filters or search terms to find what you're looking for."
              }
              action={
                notesCount === 0 ? (
                  <Button
                    variant="solid"
                    size="sm"
                    onClick={() => navigate("/practice")}
                  >
                    <span className="text-xs">Go to Practice</span>
                    <ArrowRight size={14} />
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="mt-6 grid gap-4">
              {filteredNotes.map((entry) => {
                const noteMeta = getNoteMeta(entry);
                const noteId = makeNoteKey(entry.source, entry.questionId);
                const isExpanded = expandedNote === noteId;

                return (
                  <motion.div
                    key={noteId}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Surface
                      as="article"
                      padding="none"
                      className="group overflow-hidden"
                    >
                      <div className="space-y-6 p-6 md:p-8">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={!!selectedNotes[noteId]}
                                onChange={() => toggleNoteSelection(noteId)}
                                aria-label={`Select note: ${noteMeta.title}`}
                                className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary/20"
                              />
                              <Pill tone="primary">{noteMeta.topicTag}</Pill>
                              <Pill>{noteMeta.sourceLabel}</Pill>
                              <span className="ui-meta">
                                {new Date(entry.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="text-lg font-medium leading-snug tracking-[-0.015em] text-foreground md:text-xl">
                              {noteMeta.title}
                            </h3>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <AppTooltip content="View">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openNoteModal(entry, false)}
                                aria-label="View note"
                              >
                                <Eye size={16} />
                              </Button>
                            </AppTooltip>
                            <AppTooltip content="Edit">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openNoteModal(entry, true)}
                                aria-label="Edit note"
                              >
                                <PencilLine size={16} />
                              </Button>
                            </AppTooltip>
                            <AppTooltip content="Download">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => downloadSingleNotePDF(entry)}
                                aria-label="Download note"
                              >
                                <Download size={16} />
                              </Button>
                            </AppTooltip>
                            <AppTooltip content="Delete">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => deleteNote(entry)}
                                disabled={deletingId === noteId}
                                aria-label="Delete note"
                                className="text-destructive hover:text-destructive"
                              >
                                {deletingId === noteId ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </Button>
                            </AppTooltip>
                          </div>
                        </div>

                        <div className="relative">
                          <div
                            className={`max-w-full text-sm leading-7 text-muted-foreground prose-p:my-2 prose-sm ${
                              isExpanded ? "" : "line-clamp-4"
                            }`}
                            dangerouslySetInnerHTML={{
                              __html: renderNoteMarkdown(entry.notes),
                            }}
                          />
                          {entry.notes.length > 300 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedNote(isExpanded ? null : noteId)
                              }
                              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                            >
                              {isExpanded ? "Show less" : "Read full note"}
                              {isExpanded ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </Surface>
                  </motion.div>
                );
              })}
            </div>
          )}

          {notesCount > 0 && (
            <div className="ui-rule mt-10 flex items-center justify-center gap-2 pt-6">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <p className="ui-meta">Cloud synced · Persists across devices</p>
            </div>
          )}
        </Section>
      </PageShell>

      {/* Note Modal Overlay */}
      <AnimatePresence>
        {activeNoteEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
            onClick={closeNoteModal}
            role="presentation"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="note-dialog-title"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="ui-surface relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden shadow-overlay"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-6 border-b border-border px-6 py-6 md:px-8">
                <div className="min-w-0 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {activeMeta && (
                      <Pill tone="primary">{activeMeta.topicTag}</Pill>
                    )}
                    {activeMeta && <Pill>{activeMeta.sourceLabel}</Pill>}
                    <span className="ui-meta">
                      {isEditingNote ? "Editing note" : "Viewing note"}
                    </span>
                  </div>
                  <h2
                    id="note-dialog-title"
                    className="text-lg font-medium leading-snug tracking-[-0.015em] text-foreground md:text-xl"
                  >
                    {activeMeta?.title ?? activeNoteEntry.questionId}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={closeNoteModal}
                  aria-label="Close note"
                >
                  <X size={18} />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8">
                {isEditingNote ? (
                  <RichTextNoteEditor
                    value={noteDraft}
                    onChange={(value) => {
                      setNoteDraft(value);
                      setSavedNoteId(null);
                    }}
                    placeholder="Refine your thoughts here..."
                    rows={12}
                    autoFocus
                  />
                ) : (
                  <div
                    className="text-[0.9375rem] leading-7 text-muted-foreground prose prose-headings:font-medium prose-p:my-4 prose-pre:rounded-control prose-pre:bg-muted/50 prose-pre:p-5"
                    dangerouslySetInnerHTML={{
                      __html: renderNoteMarkdown(activeNoteEntry.notes),
                    }}
                  />
                )}
              </div>

              <div className="flex flex-col justify-between gap-3 border-t border-border bg-muted/20 px-6 py-4 md:flex-row md:items-center md:px-8">
                <div className="flex items-center gap-2">
                  <Button
                    variant="line"
                    size="sm"
                    onClick={() =>
                      navigate(activeMeta?.contextPath ?? "/notes")
                    }
                  >
                    <StickyNote size={14} />
                    <span className="text-xs">
                      {activeMeta?.contextCta ?? "View context"}
                    </span>
                  </Button>
                  <Button
                    variant="line"
                    size="sm"
                    onClick={() => downloadSingleNotePDF(activeNoteEntry)}
                  >
                    <Download size={14} />
                    <span className="text-xs">Export PDF</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {isEditingNote ? (
                    <>
                      <Button
                        variant="line"
                        size="sm"
                        onClick={() => {
                          setNoteDraft(activeNoteEntry.notes);
                          setIsEditingNote(false);
                        }}
                      >
                        <span className="text-xs">Cancel</span>
                      </Button>
                      <Button
                        variant="solid"
                        size="sm"
                        onClick={saveNote}
                        disabled={savingNoteId === activeNoteId}
                      >
                        {savingNoteId === activeNoteId ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : savedNoteId === activeNoteId ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <Save size={14} />
                        )}
                        <span className="text-xs">
                          {savingNoteId === activeNoteId
                            ? "Saving…"
                            : savedNoteId === activeNoteId
                              ? "Saved"
                              : "Save note"}
                        </span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="solid"
                      size="sm"
                      onClick={() => setIsEditingNote(true)}
                    >
                      <PencilLine size={14} />
                      <span className="text-xs">Edit note</span>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
