import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { coreJavaInterviewTopics } from "@/data/coreJavaInterviewData";
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
} from "lucide-react";
import jsPDF from "jspdf";
import { renderNoteMarkdown, parseNoteSegments } from "@/lib/renderNoteMarkdown";

interface NoteEntry {
  questionId: string;
  notes: string;
  isCompleted: boolean;
  updatedAt: string;
}

export default function NotesDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notesData, setNotesData] = useState<NoteEntry[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [searchNotes, setSearchNotes] = useState("");
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  // Load notes from Supabase
  const loadNotes = useCallback(async () => {
    if (!user) return;
    setNotesLoading(true);
    const { data, error } = await supabase
      .from("core_java_user_state")
      .select("question_id, notes, is_completed, updated_at")
      .eq("user_id", user.id);

    if (!error && data) {
      const entries: NoteEntry[] = data
        .filter((row) => row.notes && row.notes.trim())
        .map((row) => ({
          questionId: row.question_id,
          notes: row.notes,
          isCompleted: row.is_completed,
          updatedAt: row.updated_at,
        }));
      setNotesData(entries);
    }
    setNotesLoading(false);
  }, [user]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Real-time subscription: updates dashboard instantly when notes change from Q&A page
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("core-java-notes-changes")
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadNotes]);

  const deleteNote = async (questionId: string) => {
    if (!user) return;
    setDeletingId(questionId);
    const { error } = await supabase
      .from("core_java_user_state")
      .update({ notes: "" })
      .eq("user_id", user.id)
      .eq("question_id", questionId);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setNotesData((prev) => prev.filter((n) => n.questionId !== questionId));
      toast({ title: "Note deleted" });
    }
    setDeletingId(null);
  };

  // Filtered notes
  const filteredNotes = useMemo(() => {
    let result = notesData;
    if (filterTopic !== "all") {
      const topicQuestionIds = coreJavaInterviewTopics.find((t) => t.id === filterTopic)?.questions.map((q) => q.id) ?? [];
      result = result.filter((n) => topicQuestionIds.includes(n.questionId));
    }
    if (searchNotes.trim()) {
      const q = searchNotes.toLowerCase();
      result = result.filter((n) => {
        const question = coreJavaInterviewTopics.flatMap((t) => t.questions).find((q) => q.id === n.questionId);
        const qText = question?.question?.toLowerCase() ?? "";
        return qText.includes(q) || n.notes.toLowerCase().includes(q);
      });
    }
    return result;
  }, [notesData, filterTopic, searchNotes]);

  const notesCount = notesData.length;

  const downloadNotesPDF = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const usableWidth = pageWidth - margin * 2;
    let y = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Core Java Q&A — My Notes", margin, y);
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

    const allQuestions = coreJavaInterviewTopics.flatMap((t) => t.questions);

    if (filteredNotes.length === 0) {
      doc.setFontSize(12);
      doc.text("No notes to export.", margin, y);
    } else {
      for (const entry of filteredNotes) {
        const question = allQuestions.find((q) => q.id === entry.questionId);
        const topic = coreJavaInterviewTopics.find((t) => t.questions.some((q) => q.id === entry.questionId));

        if (y > 260) { doc.addPage(); y = 20; }

        if (topic) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 100, 200);
          doc.text(`${topic.icon} ${topic.title}`, margin, y);
          y += 5;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        const qText = question ? question.question : entry.questionId;
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

    doc.save("core-java-notes.pdf");
  }, [filteredNotes]);

  if (notesLoading && notesData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={24} style={{ color: "hsl(var(--muted-foreground))" }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-6 hover:underline"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {/* Notes Header */}
      <div className="border-2 border-black dark:border-white bg-card p-4"
        style={{ boxShadow: "4px 4px 0px 0px hsl(var(--border))" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <BookOpen size={20} style={{ color: "hsl(var(--primary))" }} />
            <div>
              <h1 className="text-base md:text-lg font-black uppercase tracking-tight">My Notes</h1>
              <p className="text-[11px] font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
                {notesCount} note{notesCount !== 1 ? "s" : ""} saved — persists across devices & cache clears
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadNotesPDF}
              disabled={filteredNotes.length === 0}
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border-2 border-border bg-card transition-colors hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}
            >
              <Download size={11} />
              Download PDF
            </button>
            <button
              onClick={() => navigate("/interview/java/core-java-qa")}
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border-2 border-black dark:border-white"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                boxShadow: "2px 2px 0px 0px hsl(var(--border))",
              }}
            >
              <StickyNote size={11} />
              Add Notes
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
          <input
            type="text"
            placeholder="Search notes or questions..."
            value={searchNotes}
            onChange={(e) => setSearchNotes(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border-2 border-border bg-card focus:outline-none focus:border-primary"
            style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}
          />
        </div>
        <select
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
          className="px-3 py-2 text-xs font-semibold border-2 border-border bg-card focus:outline-none focus:border-primary"
          style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}
        >
          <option value="all">All Topics</option>
          {coreJavaInterviewTopics.map((t) => (
            <option key={t.id} value={t.id}>{t.icon} {t.title}</option>
          ))}
        </select>
      </div>

      {/* Notes Table / Cards */}
      {notesLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin" size={24} style={{ color: "hsl(var(--muted-foreground))" }} />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border mt-4">
          <FileText size={40} className="mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
            {notesCount === 0 ? "No notes saved yet" : "No notes match your filters"}
          </p>
          <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            {notesCount === 0
              ? "Go to Core Java Q&A and click \"Add Note\" on any question"
              : "Try adjusting your search or topic filter"}
          </p>
          {notesCount === 0 && (
            <button
              onClick={() => navigate("/interview/java/core-java-qa")}
              className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-2 border-2 border-black dark:border-white"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                boxShadow: "2px 2px 0px 0px hsl(var(--border))",
              }}
            >
              <BookOpen size={12} />
              Go to Core Java Q&A
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2 mt-4">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[2fr_3fr_1fr_80px] gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-border bg-muted/30"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            <span>Topic / Question</span>
            <span>Note</span>
            <span>Last Updated</span>
            <span className="text-center">Actions</span>
          </div>

          {filteredNotes.map((entry) => {
            const question = coreJavaInterviewTopics.flatMap((t) => t.questions).find((q) => q.id === entry.questionId);
            const topic = coreJavaInterviewTopics.find((t) => t.questions.some((q) => q.id === entry.questionId));
            const isExpanded = expandedNote === entry.questionId;

            return (
              <div
                key={entry.questionId}
                className="border-2 border-border bg-card transition-colors hover:border-primary/40"
                style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}
              >
                {/* Desktop Row */}
                <div className="hidden md:grid grid-cols-[2fr_3fr_1fr_80px] gap-3 items-start px-4 py-3">
                  {/* Topic + Question */}
                  <div className="min-w-0">
                    {topic && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 mr-1"
                        style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.2)" }}>
                        {topic.icon} {topic.title}
                      </span>
                    )}
                    <p className="text-xs font-bold mt-1 leading-snug truncate" title={question?.question}>
                      {question?.question ?? entry.questionId}
                    </p>
                  </div>

                  {/* Note content */}
                  <div className="min-w-0">
                    <div
                      className={`text-xs leading-relaxed note-rendered ${isExpanded ? "" : "line-clamp-2"}`}
                      style={{ color: "hsl(var(--foreground))" }}
                      dangerouslySetInnerHTML={{ __html: renderNoteMarkdown(entry.notes) }}
                    />
                    {entry.notes.length > 120 && (
                      <button
                        onClick={() => setExpandedNote(isExpanded ? null : entry.questionId)}
                        className="text-[10px] font-bold mt-1 hover:underline"
                        style={{ color: "hsl(var(--primary))" }}
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>

                  {/* Last updated */}
                  <span className="text-[10px] font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {new Date(entry.updatedAt).toLocaleDateString()}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => navigate("/interview/java/core-java-qa")}
                      className="p-1.5 hover:bg-muted rounded"
                      title="Go to question"
                    >
                      <StickyNote size={13} style={{ color: "hsl(var(--warning))" }} />
                    </button>
                    <button
                      onClick={() => deleteNote(entry.questionId)}
                      disabled={deletingId === entry.questionId}
                      className="p-1.5 hover:bg-destructive/10 rounded"
                      title="Delete note"
                    >
                      {deletingId === entry.questionId ? (
                        <Loader2 size={13} className="animate-spin" style={{ color: "hsl(var(--destructive))" }} />
                      ) : (
                        <Trash2 size={13} style={{ color: "hsl(var(--destructive))" }} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile Card */}
                <div className="md:hidden px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {topic && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 mr-1"
                          style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.2)" }}>
                          {topic.icon} {topic.title}
                        </span>
                      )}
                      <p className="text-xs font-bold mt-1 leading-snug">{question?.question ?? entry.questionId}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => navigate("/interview/java/core-java-qa")}
                        className="p-1 hover:bg-muted rounded"
                        title="Go to question"
                      >
                        <StickyNote size={13} style={{ color: "hsl(var(--warning))" }} />
                      </button>
                      <button
                        onClick={() => deleteNote(entry.questionId)}
                        disabled={deletingId === entry.questionId}
                        className="p-1 hover:bg-destructive/10 rounded"
                        title="Delete note"
                      >
                        {deletingId === entry.questionId ? (
                          <Loader2 size={13} className="animate-spin" style={{ color: "hsl(var(--destructive))" }} />
                        ) : (
                          <Trash2 size={13} style={{ color: "hsl(var(--destructive))" }} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div
                    className={`text-xs leading-relaxed pl-2 border-l-2 border-warning/30 note-rendered ${isExpanded ? "" : "line-clamp-3"}`}
                    style={{ color: "hsl(var(--foreground))" }}
                    dangerouslySetInnerHTML={{ __html: renderNoteMarkdown(entry.notes) }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {new Date(entry.updatedAt).toLocaleDateString()}
                    </span>
                    {entry.notes.length > 80 && (
                      <button
                        onClick={() => setExpandedNote(isExpanded ? null : entry.questionId)}
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold"
                        style={{ color: "hsl(var(--primary))" }}
                      >
                        {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        {isExpanded ? "Less" : "More"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer status */}
      {notesCount > 0 && (
        <div className="text-center py-2 mt-2">
          <p className="text-[10px] font-semibold" style={{ color: "hsl(var(--success))" }}>
            ✓ All notes are saved to your account — they persist even after clearing browser cache
          </p>
        </div>
      )}
    </div>
  );
}
