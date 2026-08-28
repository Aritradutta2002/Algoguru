import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  List,
  X,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { CoreJavaQuestionAnswer } from "@/components/interview/CoreJavaQuestionAnswer";
import { CoreJavaVisualizationBlock, hasCoreJavaVisualization } from "@/components/interview/CoreJavaVisualizationBlock";
import {
  CoreJavaBookmarkButton,
  CoreJavaLearnedButton,
  CoreJavaShareButton,
  CoreJavaCopyTextButton,
} from "@/components/interview/CoreJavaActions";
import { DifficultyBadge, PriorityBadge, JavaVersionBadge } from "@/components/interview/CoreJavaBadges";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useCoreJavaBookmarks } from "@/hooks/useCoreJavaBookmarks";
import { useCoreJavaUserState } from "@/hooks/useCoreJavaUserState";
import { useOnThisPage, useReadingProgress, useReadingPositionPersist, scrollToSection, type TocSection } from "@/hooks/useOnThisPage";
import {
  getCoreJavaQuestionBySlug,
  getAdjacentCoreJavaQuestions,
  getCoreJavaQuestionById,
} from "@/lib/coreJavaQuestionIndex";
import { getCoreJavaQuestionDetailPath, getCoreJavaQuestionMeta } from "@/data/coreJavaInterviewMetadata";
import { cn } from "@/lib/utils";
import { scrollPageToTop } from "@/lib/scrollUtils";
import "@/styles/core-java-interview.css";

function buildTocSections(questionId: string): TocSection[] {
  const sections: TocSection[] = [{ id: "quick-answer", label: "Quick Answer" }];
  if (hasCoreJavaVisualization(questionId)) {
    sections.push({ id: "visualization", label: "Visualization" });
  }
  sections.push({ id: "detailed-answer", label: "Detailed Explanation" });
  const question = getCoreJavaQuestionById(questionId);
  if (question?.question.code) {
    sections.push({ id: "code-example", label: "Code Example" });
  }
  if (question?.question.explanation) {
    sections.push({ id: "key-takeaways", label: "Key Takeaways" });
  }
  const meta = getCoreJavaQuestionMeta(questionId);
  if (meta.relatedQuestionIds?.length) {
    sections.push({ id: "related-questions", label: "Related Questions" });
  }
  return sections;
}

export default function InterviewCoreJavaQuestionDetailPage() {
  const { questionSlug, language } = useParams<{ questionSlug?: string; language?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { isBookmarked, toggleBookmark } = useCoreJavaBookmarks();
  const {
    doneMap,
    toggleDone,
    isUpserting,
    loading: userStateLoading,
    readingSectionMap,
    saveReadingSection,
  } = useCoreJavaUserState();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const entry = questionSlug ? getCoreJavaQuestionBySlug(questionSlug) : undefined;
  const question = entry?.question;
  const topic = entry?.topic;
  const meta = entry?.meta ?? {};
  const progress = useReadingProgress();
  const tocSections = useMemo(() => (entry ? buildTocSections(entry.question.id) : []), [entry]);
  const activeSection = useOnThisPage({ sections: tocSections });

  // Persist reading position (debounced) to the per-user database row.
  useReadingPositionPersist(activeSection, (sectionId) => {
    if (question?.id) saveReadingSection(question.id, sectionId);
  });

  // Restore reading position once when the page loads (no jumpy behavior —
  // only after user state finished loading and only if the user actually
  // has a saved section for this question).
  const restoredForRef = useRef<string | null>(null);
  const skipRestoreRef = useRef(false);
  useEffect(() => {
    if (!question || restoredForRef.current === question.id || userStateLoading) return;
    if (skipRestoreRef.current) {
      // Prev/next navigation intentionally starts at the top.
      skipRestoreRef.current = false;
      restoredForRef.current = question.id;
      return;
    }
    restoredForRef.current = question.id;
    const saved = readingSectionMap[question.id];
    if (saved && document.getElementById(saved)) {
      // Defer until after first paint so we don't fight the scroll restore.
      requestAnimationFrame(() => {
        scrollToSection(saved);
      });
    }
  }, [question?.id, readingSectionMap, userStateLoading]);

  // SEO title
  useEffect(() => {
    if (question) {
      document.title = `${question.question} — Core Java Interview | AlgoGuru`;
    }
    return () => {
      document.title = "AlgoGuru";
    };
  }, [question]);

  // Close drawer on Escape + focus trap basics
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        drawerButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // Progressive disclosure: first section is the quick answer; the full
  // answer becomes a deep-dive section when it contains more than one block.
  const answerSections = useMemo(
    () => (question?.answer ? question.answer.split("\n\n").filter(Boolean) : []),
    [question?.answer]
  );

  if (!entry || !question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
        <p className="text-lg font-semibold mb-2">Question not found</p>
        <p className="text-sm text-muted-foreground mb-6">
          The question you're looking for doesn't exist or the link is broken.
        </p>
        <button
          onClick={() => navigate(`/interview/${language ?? "java"}/core-java-qa`)}
          className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Back to Core Java Q&A
        </button>
      </div>
    );
  }

  const { previous, next } = getAdjacentCoreJavaQuestions(question.id);
  const listPath = `/interview/${language ?? "java"}/core-java-qa`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : getCoreJavaQuestionDetailPath(question);
  const quickAnswer = answerSections[0] ?? "";
  const hasDeepDive = answerSections.length > 1;

  const handleQuestionNavigate = (slug: string) => {
    skipRestoreRef.current = true;
    navigate(`/interview/${language ?? "java"}/core-java-qa/${slug}`);
    scrollPageToTop(document.querySelector(".cjd-page"), "auto");
  };

  const handleBookmark = (id: string) => {
    if (!user && !authLoading) {
      toast({
        title: "Please sign in",
        description: "Login is required to save bookmarks. Your bookmarks are stored per account.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    toggleBookmark(id);
  };

  const handleLearned = (id: string) => {
    if (!user && !authLoading) {
      toast({
        title: "Please sign in",
        description: "Login is required to save progress. Your progress is stored per account.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    toggleDone(id);
  };

  return (
    <div className="cjd-page min-h-screen bg-background text-foreground">
      {/* ── Sticky reading header ─────────────────────────────────── */}
      <header className="cjd-sticky-bar sticky top-0 z-30 border-b bg-card/95 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center gap-3 py-2.5">
          <Link
            to={listPath}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-lg border border-border/40 bg-muted/30 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Back to question list"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">All Questions</span>
          </Link>
          <span className="font-mono text-[11px] font-bold text-primary shrink-0">
            Q{String(entry.index + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-semibold truncate flex-1 min-w-0 hidden sm:block">
            {question.question}
          </span>
          {/* Reading progress */}
          <div className="hidden md:flex items-center gap-2 w-32">
            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden" role="progressbar" aria-label="Reading progress" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{Math.round(progress * 100)}%</span>
          </div>
          <CoreJavaBookmarkButton questionId={question.id} isBookmarked={isBookmarked(question.id)} onToggle={handleBookmark} compact />
          <CoreJavaLearnedButton questionId={question.id} isLearned={!!doneMap[question.id]} isUpserting={isUpserting(question.id)} onToggle={handleLearned} compact />
          <CoreJavaShareButton url={shareUrl} title={question.question} compact />
        </div>
      </header>

      {/* ── Three-column layout ───────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-10 cjd-grid">
        {/* Left sidebar — question navigation */}
        <aside className="cjd-sidebar hidden lg:block">
          <div className="cjd-sidebar-inner sticky top-[57px] max-h-[calc(100vh-116px)] overflow-y-auto pr-2">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={14} className="text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground font-mono">
                Java Interview
              </span>
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-full text-left px-3 py-2 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/50 transition-colors mb-2"
            >
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <List size={12} />
                Browse all topics
              </span>
            </button>
            <nav aria-label="Question navigation">
              {previous && (
                <button
                  onClick={() => handleQuestionNavigate(previous.slug)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-mono mb-0.5">
                    ← Previous
                  </span>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground leading-snug line-clamp-2">
                    {previous.question.question}
                  </span>
                </button>
              )}
              {next && (
                <button
                  onClick={() => handleQuestionNavigate(next.slug)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-mono mb-0.5">
                    Next →
                  </span>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground leading-snug line-clamp-2">
                    {next.question.question}
                  </span>
                </button>
              )}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="cjd-main min-w-0">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-6 flex-wrap font-mono">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight size={11} aria-hidden="true" />
            <Link to="/interview/java" className="hover:text-primary transition-colors">Interview</Link>
            <ChevronRight size={11} aria-hidden="true" />
            <Link to={listPath} className="hover:text-primary transition-colors">Core Java</Link>
            <ChevronRight size={11} aria-hidden="true" />
            <span className="text-foreground/80 truncate max-w-[220px]">{question.question}</span>
          </nav>

          <article className="cjd-article" aria-labelledby="question-title">
            {/* ── Question header ─────────────────────────────────── */}
            <header className="cjd-question-header mb-8">
              <div className="flex items-center gap-2.5 flex-wrap mb-4">
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary">
                  Q{String(entry.index + 1).padStart(2, "0")}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">{topic?.icon} {topic?.title}</span>
                {meta.difficulty && <DifficultyBadge difficulty={meta.difficulty} />}
                {meta.priority && <PriorityBadge priority={meta.priority} />}
                {meta.javaVersions?.map((v) => <JavaVersionBadge key={v} version={v} />)}
                {meta.tags && meta.tags.length > 0 && (
                  <span className="hidden md:flex items-center gap-1.5">
                    {meta.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] font-mono text-muted-foreground/70 px-2 py-0.5 rounded-full bg-muted/40 border border-border/30">
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              <h1 id="question-title" className="text-2xl md:text-[32px] lg:text-[36px] font-bold tracking-tight leading-[1.25] mb-4">
                {question.question}
              </h1>
              {question.explanation && (
                <p className="cjd-mental-model text-[15px] md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary/50 pl-4">
                  <span className="font-semibold text-foreground">In short: </span>
                  {question.explanation}
                </p>
              )}
            </header>

            {/* ── Quick Answer ────────────────────────────────────── */}
            <section id="quick-answer" className="cjd-section scroll-mt-36" aria-labelledby="quick-answer-heading">
              <h2 id="quick-answer-heading" className="cjd-section-heading">
                <span className="cjd-section-icon">⚡</span>
                Quick Answer
              </h2>
              <div className="cjd-surface rounded-xl p-5 md:p-6">
                <CoreJavaQuestionAnswer answer={quickAnswer} />
              </div>
            </section>

            {/* ── Visualization ───────────────────────────────────── */}
            {hasCoreJavaVisualization(question.id) && (
              <div id="visualization" className="scroll-mt-36">
                <CoreJavaVisualizationBlock questionId={question.id} />
              </div>
            )}

            {/* ── Deep dive (progressive disclosure) ──────────────── */}
            {hasDeepDive && (
              <section id="detailed-answer" className="cjd-section scroll-mt-36" aria-labelledby="detailed-answer-heading">
                <h2 id="detailed-answer-heading" className="cjd-section-heading">
                  <span className="cjd-section-icon">📚</span>
                  Detailed Explanation
                </h2>
                <div className="cjd-surface rounded-xl p-5 md:p-6">
                  <CoreJavaQuestionAnswer answer={answerSections.slice(1).join("\n\n")} />
                </div>
              </section>
            )}

            {/* ── Code example ────────────────────────────────────── */}
            {question.code && (
              <section id="code-example" className="cjd-section scroll-mt-36" aria-labelledby="code-example-heading">
                <h2 id="code-example-heading" className="cjd-section-heading">
                  <span className="cjd-section-icon">💻</span>
                  Code Example
                </h2>
                <CodeBlock language={question.codeLanguage || "java"} code={question.code} title="Example" />
              </section>
            )}

            {/* ── Key takeaways ───────────────────────────────────── */}
            {question.explanation && (
              <section id="key-takeaways" className="cjd-section scroll-mt-36" aria-labelledby="key-takeaways-heading">
                <h2 id="key-takeaways-heading" className="cjd-section-heading">
                  <span className="cjd-section-icon">🧠</span>
                  Key Takeaways
                </h2>
                <div className="cjd-surface rounded-xl p-5 md:p-6">
                  <p className="text-[15px] leading-[1.8] text-foreground/90">
                    {question.explanation}
                  </p>
                </div>
              </section>
            )}

            {/* ── Related questions ───────────────────────────────── */}
            {meta.relatedQuestionIds && meta.relatedQuestionIds.length > 0 && (
              <section id="related-questions" className="cjd-section scroll-mt-36" aria-labelledby="related-questions-heading">
                <h2 id="related-questions-heading" className="cjd-section-heading">
                  <span className="cjd-section-icon">🔗</span>
                  Related Questions
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {meta.relatedQuestionIds.map((rid) => {
                    const related = getCoreJavaQuestionById(rid);
                    if (!related) return null;
                    return (
                      <Link
                        key={rid}
                        to={getCoreJavaQuestionDetailPath(related.question)}
                        className="cjd-surface rounded-xl p-4 border border-border/40 hover:border-primary/40 hover:bg-muted/30 transition-all group"
                      >
                        <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                          Q{String(related.index + 1).padStart(2, "0")} · {related.topic.title}
                        </span>
                        <span className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
                          {related.question.question}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary mt-2">
                          Read <ArrowRight size={12} />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Question actions ────────────────────────────────── */}
            <div className="flex items-center gap-2.5 flex-wrap mt-10 pt-6 border-t border-border/30">
              <CoreJavaBookmarkButton questionId={question.id} isBookmarked={isBookmarked(question.id)} onToggle={handleBookmark} />
              <CoreJavaLearnedButton questionId={question.id} isLearned={!!doneMap[question.id]} isUpserting={isUpserting(question.id)} onToggle={handleLearned} />
              <CoreJavaShareButton url={shareUrl} title={question.question} />
              {question.explanation && (
                <CoreJavaCopyTextButton text={`${question.question}\n\n${question.explanation}`} label="Copy Summary" />
              )}
            </div>

            {/* ── Previous / Next ─────────────────────────────────── */}
            <nav className="grid sm:grid-cols-2 gap-3 mt-8" aria-label="Question pagination">
              {previous ? (
                <button
                  onClick={() => handleQuestionNavigate(previous.slug)}
                  className="cjd-surface rounded-xl p-4 text-left border border-border/40 hover:border-primary/40 hover:bg-muted/30 transition-all group"
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 font-mono mb-1.5">
                    <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" /> Previous
                  </span>
                  <span className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {previous.question.question}
                  </span>
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}
              {next && (
                <button
                  onClick={() => handleQuestionNavigate(next.slug)}
                  className="cjd-surface rounded-xl p-4 text-right border border-border/40 hover:border-primary/40 hover:bg-muted/30 transition-all group"
                >
                  <span className="flex items-center justify-end gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 font-mono mb-1.5">
                    Next <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                  <span className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {next.question.question}
                  </span>
                </button>
              )}
            </nav>
          </article>
        </main>

        {/* Right TOC */}
        <aside className="cjd-toc hidden xl:block">
          <div className="sticky top-[57px]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground font-mono block mb-3">
              On This Page
            </span>
            <nav aria-label="On this page" className="space-y-0.5">
              {tocSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  aria-current={activeSection === section.id ? "true" : undefined}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-md text-xs border-l-2 transition-colors",
                    activeSection === section.id
                      ? "border-primary text-primary font-semibold bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      {/* ── Mobile drawer: browse topics ─────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Browse topics">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div
            ref={drawerRef}
            className="absolute left-0 top-0 bottom-0 w-[300px] max-w-[85vw] bg-card border-r border-border/50 shadow-overlay flex flex-col animate-in slide-in-from-left duration-200"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <span className="text-sm font-bold flex items-center gap-2">
                <BookOpen size={15} className="text-primary" /> Topics
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close topics drawer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <button
                onClick={() => navigate(listPath)}
                className="w-full text-left px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-3"
              >
                ← All Core Java Questions
              </button>
              {/* Simple topic list linking to the list page */}
              {entry && (
                <button
                  onClick={() => {
                    navigate(`${listPath}?topic=${entry.topic.id}`);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-muted/40 border border-border/40 text-sm font-semibold mb-2"
                >
                  {entry.topic.icon} {entry.topic.title} (current)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
