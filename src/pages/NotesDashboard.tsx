import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { coreJavaInterviewTopics } from "@/data/coreJavaInterviewData";
import { practiceData } from "@/data/practiceData";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  FileText,
  Download,
  Trash2,
  StickyNote,
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Eye,
  PencilLine,
  Save,
  X,
  CheckCircle2,
} from "lucide-react";
import jsPDF from "jspdf";
import { renderNoteMarkdown, parseNoteSegments } from "@/lib/renderNoteMarkdown";
import RichTextNoteEditor from "@/components/RichTextNoteEditor";
import { motion, AnimatePresence } from "framer-motion";
import { AppTooltip } from "@/components/ui/tooltip";

type NoteSource = "core-java" | "practice";

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

const makeNoteKey = (source: NoteSource, questionId: string) => `${source}:${questionId}`;

const parseNoteKey = (key: string): { source: NoteSource; questionId: string } | null => {
  const parts = key.split(":");
  if (parts.length < 2) return null;
  const source = parts[0];
  const questionId = parts.slice(1).join(":");
  if ((source !== "core-java" && source !== "practice") || !questionId) return null;
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
  const [selectedNotes, setSelectedNotes] = useState<Record<string, boolean>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const saveFeedbackTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveFeedbackTimerRef.current) {
        window.clearTimeout(saveFeedbackTimerRef.current);
      }
    };
  }, []);

  const coreQuestionsById = useMemo(() => {
    const map = new Map<string, { question: string; topicId: string; topicTitle: string }>();
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

  const getNoteMeta = useCallback(
    (entry: NoteEntry) => {
      if (entry.source === "practice") {
        const practice = practiceProblemsById.get(entry.questionId);
        const title = practice?.title ?? entry.questionId;
        return {
          title,
          topic: practice?.topicTitle ?? "Practice",
          topicTag: practice ? `${practice.topicTitle} / ${practice.subtopicTitle}` : "Practice",
          sourceLabel: "Practice",
          contextPath: `/practice/solution/${entry.questionId}/${toProblemSlug(title)}`,
          contextCta: "View Problem",
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
    [coreQuestionsById, practiceProblemsById]
  );

  // Load notes from Supabase
  const loadNotes = useCallback(async () => {
    if (!user) {
      setNotesData([]);
      setNotesLoading(false);
      return;
    }

    setNotesLoading(true);

    const [coreResult, practiceResult] = await Promise.all([
      supabase
        .from("core_java_user_state")
        .select("question_id, notes, is_completed, updated_at")
        .eq("user_id", user.id),
      supabase
        .from("practice_problem_user_state")
        .select("problem_id, notes, is_completed, updated_at")
        .eq("user_id", user.id),
    ]);

    if (coreResult.error) {
      toast({ title: "Load failed", description: coreResult.error.message, variant: "destructive" });
    }
    if (practiceResult.error) {
      toast({ title: "Load failed", description: practiceResult.error.message, variant: "destructive" });
    }

    const coreEntries: NoteEntry[] = (coreResult.data ?? [])
      .filter((row) => row.notes && row.notes.trim())
      .map((row) => ({
        source: "core-java",
        questionId: row.question_id,
        notes: row.notes,
        isCompleted: row.is_completed,
        updatedAt: row.updated_at,
      }));

    const practiceEntries: NoteEntry[] = (practiceResult.data ?? [])
      .filter((row) => row.notes && row.notes.trim())
      .map((row) => ({
        source: "practice",
        questionId: row.problem_id,
        notes: row.notes,
        isCompleted: row.is_completed,
        updatedAt: row.updated_at,
      }));

    setNotesData(
      [...coreEntries, ...practiceEntries].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
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
        }
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
        }
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

    const table = entry.source === "practice" ? "practice_problem_user_state" : "core_java_user_state";
    const idColumn = entry.source === "practice" ? "problem_id" : "question_id";

    const { error } = await supabase
      .from(table)
      .update({ notes: "" })
      .eq("user_id", user.id)
      .eq(idColumn, entry.questionId);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setNotesData((prev) => prev.filter((n) => !(n.source === entry.source && n.questionId === entry.questionId)));
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

    const table = parsed.source === "practice" ? "practice_problem_user_state" : "core_java_user_state";
    const idColumn = parsed.source === "practice" ? "problem_id" : "question_id";

    const { error } = await supabase
      .from(table)
      .update({ notes: trimmed })
      .eq("user_id", user.id)
      .eq(idColumn, parsed.questionId);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      setSavingNoteId(null);
      setSavedNoteId(null);
      return;
    }

    if (!trimmed) {
      setNotesData((prev) =>
        prev.filter((entry) => !(entry.source === parsed.source && entry.questionId === parsed.questionId))
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
          entry.source === parsed.source && entry.questionId === parsed.questionId
            ? { ...entry, notes: trimmed, updatedAt: new Date().toISOString() }
            : entry
        )
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
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
    } else if (filterTopic !== "all") {
      const topicQuestionIds = coreJavaInterviewTopics.find((t) => t.id === filterTopic)?.questions.map((q) => q.id) ?? [];
      result = result.filter((n) => n.source === "core-java" && topicQuestionIds.includes(n.questionId));
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
  const selectedFilteredNotes = filteredNotes.filter((entry) => selectedNotes[makeNoteKey(entry.source, entry.questionId)]);
  const allFilteredSelected =
    filteredNotes.length > 0 &&
    filteredNotes.every((entry) => selectedNotes[makeNoteKey(entry.source, entry.questionId)]);
  const activeNoteEntry = useMemo(() => {
    if (!activeNoteId) return null;
    const parsed = parseNoteKey(activeNoteId);
    if (!parsed) return null;
    return notesData.find((entry) => entry.source === parsed.source && entry.questionId === parsed.questionId) ?? null;
  }, [activeNoteId, notesData]);
  const activeMeta = activeNoteEntry ? getNoteMeta(activeNoteEntry) : null;

  const exportNotesToPDF = useCallback((entries: NoteEntry[], filename: string, title: string) => {
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

        if (y > 260) { doc.addPage(); y = 20; }

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
            if (y > 275) { doc.addPage(); y = 20; }
            continue;
          }

          const fontSize = seg.heading ? 11 : 9;
          doc.setFontSize(fontSize);
          const fontStyle = seg.bold ? "bold" : seg.italic ? "italic" : "normal";
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
                if (y > 275) { doc.addPage(); y = 20; }
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
  }, [getNoteMeta]);

  const downloadAllNotesPDF = useCallback(() => {
    exportNotesToPDF(filteredNotes, "algoguru-notes-merged.pdf", "AlgoGuru — Merged Notes");
  }, [exportNotesToPDF, filteredNotes]);

  const downloadSelectedNotesPDF = useCallback(() => {
    const selectedEntry = selectedFilteredNotes[0];
    const selectedKey = selectedEntry
      ? makeNoteKey(selectedEntry.source, selectedEntry.questionId).replace(/:/g, "-")
      : "selected";
    exportNotesToPDF(
      selectedFilteredNotes,
      selectedFilteredNotes.length === 1
        ? `algoguru-note-${selectedKey}.pdf`
        : "algoguru-selected-notes.pdf",
      selectedFilteredNotes.length === 1 ? "AlgoGuru — Selected Note" : "AlgoGuru — Selected Notes"
    );
  }, [exportNotesToPDF, selectedFilteredNotes]);

  const downloadSingleNotePDF = useCallback((entry: NoteEntry) => {
    exportNotesToPDF([entry], `algoguru-note-${entry.source}-${entry.questionId}.pdf`, "AlgoGuru — Note");
  }, [exportNotesToPDF]);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={24} style={{ color: "hsl(var(--muted-foreground))" }} />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-background text-foreground selection:bg-primary selection:text-black animate-in fade-in duration-700">
      
      {/* Header Section */}
      <section className="px-4 md:px-10 lg:px-16 py-12 md:py-20 max-w-7xl mx-auto relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center md:text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <ArrowLeft size={12} />
                Back
              </button>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-primary/10 border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary">
                <BookOpen size={12} />
                <span>Knowledge Base</span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">
              My <span className="text-primary">Notes</span>
            </h1>
            
            <p className="text-base md:text-lg font-medium text-muted-foreground max-w-2xl leading-relaxed mx-auto md:mx-0">
              Manage your personal study material. {notesCount} note{notesCount !== 1 ? "s" : ""} saved across your journey. Persists across all your devices.
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-8">
              <button
                onClick={downloadAllNotesPDF}
                disabled={filteredNotes.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border bg-card text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted disabled:opacity-40"
              >
                <Download size={14} />
                Merge All PDF
              </button>
              <button
                onClick={downloadSelectedNotesPDF}
                disabled={selectedFilteredNotes.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border bg-card text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted disabled:opacity-40"
              >
                <Download size={14} />
                Selected PDF
              </button>
              <button
                onClick={() => navigate("/interview/java/core-java-qa")}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                <StickyNote size={14} />
                Add Interview Notes
              </button>
              <button
                onClick={() => navigate("/practice")}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border bg-card text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted"
              >
                <StickyNote size={14} />
                Add Practice Notes
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 md:px-12 lg:px-20 pb-18 lg:pb-24 max-w-7xl mx-auto w-full space-y-6 lg:space-y-8">
        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 p-4 rounded-[28px] border bg-card/50 backdrop-blur-sm">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input
              type="text"
              placeholder="Search through your notes..."
              value={searchNotes}
              onChange={(e) => setSearchNotes(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-[20px] bg-muted/20 border border-border/50 text-sm font-bold text-foreground outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="px-5 py-3 rounded-[20px] bg-muted/20 border border-border/50 text-xs font-bold uppercase tracking-widest text-muted-foreground outline-none focus:border-primary/50 transition-all cursor-pointer"
            >
              <option value="all">All Notes</option>
              <option value="practice">Practice</option>
              <option value="core-java">Interview (Core Java)</option>
              {coreJavaInterviewTopics.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <button
              onClick={toggleSelectAllFiltered}
              disabled={filteredNotes.length === 0}
              className="px-5 py-3 rounded-[20px] bg-muted/20 border border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all disabled:opacity-40"
            >
              {allFilteredSelected ? "Clear Selection" : "Select All"}
            </button>
          </div>
        </div>

        {filteredNotes.length > 0 && (
          <div className="flex items-center gap-2 px-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              {filteredNotes.length} visible · {selectedFilteredNotes.length} selected
            </span>
          </div>
        )}

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 bg-card/30 border border-dashed rounded-[40px]">
            <div className="w-20 h-20 rounded-[32px] bg-muted/30 flex items-center justify-center text-muted-foreground/20">
              <FileText size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight text-foreground">
                {notesCount === 0 ? "No notes yet" : "No matches found"}
              </h3>
              <p className="text-sm font-medium text-muted-foreground max-w-[300px] leading-relaxed">
                {notesCount === 0 
                  ? "Start building your knowledge base by adding notes in interview or practice pages." 
                  : "Try adjusting your filters or search terms to find what you're looking for."}
              </p>
            </div>
            {notesCount === 0 && (
              <button
                onClick={() => navigate("/practice")}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:bg-primary/90"
              >
                Go to Practice
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredNotes.map((entry) => {
              const noteMeta = getNoteMeta(entry);
              const noteId = makeNoteKey(entry.source, entry.questionId);
              const isExpanded = expandedNote === noteId;

              return (
                <motion.div
                  key={noteId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group bg-card border rounded-[32px] overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5"
                >
                  <div className="p-8 md:p-10 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={!!selectedNotes[noteId]}
                            onChange={() => toggleNoteSelection(noteId)}
                            className="w-5 h-5 rounded-lg border-2 border-border/50 text-primary focus:ring-primary/20 cursor-pointer transition-all"
                          />
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                            {noteMeta.topicTag}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-muted/20 border border-border/50 text-muted-foreground">
                            {noteMeta.sourceLabel}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                            {new Date(entry.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors">
                          {noteMeta.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <AppTooltip content="View">
                          <button onClick={() => openNoteModal(entry, false)} className="p-3 rounded-2xl bg-muted/30 text-primary hover:bg-primary/10 transition-all" aria-label="View note">
                            <Eye size={18} />
                          </button>
                        </AppTooltip>
                        <AppTooltip content="Edit">
                          <button onClick={() => openNoteModal(entry, true)} className="p-3 rounded-2xl bg-muted/30 text-warning hover:bg-warning/10 transition-all" aria-label="Edit note">
                            <PencilLine size={18} />
                          </button>
                        </AppTooltip>
                        <AppTooltip content="Download">
                          <button onClick={() => downloadSingleNotePDF(entry)} className="p-3 rounded-2xl bg-muted/30 text-success hover:bg-success/10 transition-all" aria-label="Download note">
                            <Download size={18} />
                          </button>
                        </AppTooltip>
                        <AppTooltip content="Delete">
                          <button 
                            onClick={() => deleteNote(entry)} 
                            disabled={deletingId === noteId}
                            className="p-3 rounded-2xl bg-muted/30 text-destructive hover:bg-destructive/10 transition-all" 
                            aria-label="Delete note"
                          >
                            {deletingId === noteId ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                          </button>
                        </AppTooltip>
                      </div>
                    </div>

                    <div className="relative">
                      <div
                        className={`text-sm md:text-base leading-relaxed font-medium text-muted-foreground prose-sm prose-p:my-2 max-w-full ${isExpanded ? "" : "line-clamp-4"}`}
                        dangerouslySetInnerHTML={{ __html: renderNoteMarkdown(entry.notes) }}
                      />
                      {entry.notes.length > 300 && (
                        <button
                          onClick={() => setExpandedNote(isExpanded ? null : noteId)}
                          className="mt-4 text-[11px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1.5"
                        >
                          {isExpanded ? "Show Less" : "Read Full Note"}
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {notesCount > 0 && (
          <div className="flex items-center justify-center gap-2 pt-12 border-t border-border/30">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
              Cloud Synced • Persists across devices
            </p>
          </div>
        )}
      </section>

      {/* Note Modal Overlay */}
      <AnimatePresence>
        {activeNoteEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
            onClick={closeNoteModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-[40px] border border-border/50 shadow-2xl bg-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-6 px-8 py-8 border-b border-border/50">
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-3">
                    {activeMeta && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                        {activeMeta.topicTag}
                      </span>
                    )}
                    {activeMeta && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-muted/20 border border-border/50 text-muted-foreground">
                        {activeMeta.sourceLabel}
                      </span>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                      {isEditingNote ? "Editing Note" : "Viewing Note"}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight text-foreground">
                    {activeMeta?.title ?? activeNoteEntry.questionId}
                  </h2>
                </div>
                <button onClick={closeNoteModal} className="p-3 rounded-2xl bg-muted/30 hover:bg-muted text-muted-foreground transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-10">
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
                    className="text-base md:text-lg leading-relaxed font-medium text-muted-foreground prose-lg prose-p:my-4 prose-pre:bg-muted/50 prose-pre:rounded-2xl prose-pre:p-6"
                    dangerouslySetInnerHTML={{ __html: renderNoteMarkdown(activeNoteEntry.notes) }}
                  />
                )}
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 px-8 py-8 border-t border-border/50 bg-muted/10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(activeMeta?.contextPath ?? "/notes")}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border bg-card text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted"
                  >
                    <StickyNote size={16} />
                    {activeMeta?.contextCta ?? "View Context"}
                  </button>
                  <button
                    onClick={() => downloadSingleNotePDF(activeNoteEntry)}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border bg-card text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted"
                  >
                    <Download size={16} />
                    Export PDF
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {isEditingNote ? (
                    <>
                      <button
                        onClick={() => { setNoteDraft(activeNoteEntry.notes); setIsEditingNote(false); }}
                        className="flex-1 md:flex-none px-6 py-3 rounded-xl border bg-card text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveNote}
                        disabled={savingNoteId === activeNoteId}
                        className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-primary/90 shadow-lg shadow-primary/20"
                      >
                        {savingNoteId === activeNoteId
                          ? <Loader2 size={16} className="animate-spin" />
                          : savedNoteId === activeNoteId
                            ? <CheckCircle2 size={16} />
                            : <Save size={16} />}
                        {savingNoteId === activeNoteId
                          ? "Saving..."
                          : savedNoteId === activeNoteId
                            ? "Saved"
                            : "Save Note"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditingNote(true)}
                      className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-primary/90 shadow-lg shadow-primary/20"
                    >
                      <PencilLine size={16} />
                      Edit Note
                    </button>
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
