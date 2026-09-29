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
import { useOnThisPage, useReadingProgress, scrollToSection, type TocSection } from "@/hooks/useOnThisPage";
import {
  getAllCoreJavaQuestions,
  getCoreJavaQuestionBySlug,
  getAdjacentCoreJavaQuestions,
  getCoreJavaQuestionById,
} from "@/lib/coreJavaQuestionIndex";
import { getCoreJavaQuestionDetailPath, getCoreJavaQuestionMeta } from "@/data/coreJavaInterviewMetadata";
import { cn } from "@/lib/utils";
import { scrollPageToTop } from "@/lib/scrollUtils";
import "@/styles/core-java-interview.css";

function buildTocSections(questionId: string): TocSection[] {
  const question = getCoreJavaQuestionById(questionId);
  const sections: TocSection[] = [{ id: "answer", label: "Answer" }];
  if (hasCoreJavaVisualization(questionId)) {
    sections.push({ id: "visualization", label: "Diagram" });
  }
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
  const { doneMap, toggleDone, isUpserting } = useCoreJavaUserState();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerButtonRef = useRef<HTMLButtonElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const entry = questionSlug ? getCoreJavaQuestionBySlug(questionSlug) : undefined;
  const question = entry?.question;
  const topic = entry?.topic;
  const meta = entry?.meta ?? {};
  const progress = useReadingProgress();
  const tocSections = useMemo(() => (entry ? buildTocSections(entry.question.id) : []), [entry]);
  const activeSection = useOnThisPage({ sections: tocSections });

  // Question index for the left rail, grouped by topic in roadmap order.
  const indexGroups = useMemo(() => {
    const groups: { id: string; title: string; icon?: string; items: { id: string; slug: string; title: string; n: number }[] }[] = [];
    const byId = new Map<string, (typeof groups)[number]>();
    for (const e of getAllCoreJavaQuestions()) {
      let g = byId.get(e.topic.id);
      if (!g) {
        g = { id: e.topic.id, title: e.topic.title, icon: e.topic.icon, items: [] };
        byId.set(e.topic.id, g);
        groups.push(g);
      }
      g.items.push({ id: e.question.id, slug: e.slug, title: e.question.question, n: e.index + 1 });
    }
    return groups;
  }, []);

  // Always open a question at the top when the route changes.
  useEffect(() => {
    scrollPageToTop(pageRef.current, "auto");
  }, [questionSlug]);

  useEffect(() => {
    if (question) {
      document.title = `${question.question} — Core Java Interview | AlgoGuru`;
    }
    return () => {
      document.title = "AlgoGuru";
    };
  }, [question]);

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

  if (!entry || !question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
        <p className="text-lg font-semibold mb-2">Question not found</p>
        <p className="text-sm text-muted-foreground mb-6">
          The question you&apos;re looking for doesn&apos;t exist or the link is broken.
        </p>
        <button
          onClick={() => navigate(`/interview/${language ?? "java"}/core-java-qa`)}
          className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Back to Core Java Q&amp;A
        </button>
      </div>
    );
  }

  const { previous, next } = getAdjacentCoreJavaQuestions(question.id);
  const listPath = `/interview/${language ?? "java"}/core-java-qa`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : getCoreJavaQuestionDetailPath(question);
  const questionNumber = String(entry.index + 1).padStart(2, "0");
  const progressPct = Math.round(progress * 100);

  /** Section ordinal follows the visible order, so it never skips a block. */
  const sectionNumber = (id: string) => {
    const i = tocSections.findIndex((s) => s.id === id);
    return i < 0 ? "" : String(i + 1).padStart(2, "0");
  };

  const handleQuestionNavigate = (slug: string) => {
    navigate(`/interview/${language ?? "java"}/core-java-qa/${slug}`);
    scrollPageToTop(pageRef.current, "auto");
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
    <div ref={pageRef} className="cjq-reader cjd-page min-h-screen">
      {/* ── Sticky reading bar ──────────────────────────────────────── */}
      <div className="cjq-reader-bar">
        <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6">
          <div className="flex items-center gap-3 h-14">
            <Link
              to={listPath}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold text-[hsl(var(--reader-note))] hover:text-[hsl(var(--reader-heading))] hover:bg-[hsl(var(--reader-accent)/0.08)] transition-colors"
              aria-label="Back to question list"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">All questions</span>
            </Link>

            <button
              ref={drawerButtonRef}
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold text-[hsl(var(--reader-note))] hover:text-[hsl(var(--reader-heading))] hover:bg-[hsl(var(--reader-accent)/0.08)] transition-colors lg:hidden"
              aria-label="Browse all questions"
            >
              <List size={14} />
            </button>

            <span className="cjq-chip cjq-chip--accent shrink-0">Q{questionNumber}</span>
            <span className="cjq-chip hidden md:inline-flex shrink-0">
              {topic?.icon} {topic?.title}
            </span>

            <span className="flex-1 min-w-0 truncate text-sm font-semibold text-[hsl(var(--reader-heading))] hidden lg:block">
              {question.question}
            </span>

            <div className="flex-1" />

            <span className="hidden md:inline font-mono text-[11px] tabular-nums text-[hsl(var(--reader-note))]">
              {progressPct}%
            </span>
            <CoreJavaBookmarkButton
              questionId={question.id}
              isBookmarked={isBookmarked(question.id)}
              onToggle={handleBookmark}
              compact
            />
            <CoreJavaLearnedButton
              questionId={question.id}
              isLearned={!!doneMap[question.id]}
              isUpserting={isUpserting(question.id)}
              onToggle={handleLearned}
              compact
            />
            <CoreJavaShareButton url={shareUrl} title={question.question} compact />
          </div>
          <div
            className="cjq-progress"
            role="progressbar"
            aria-label="Reading progress"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="cjq-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Document grid: index · prose · contents ──────────────────── */}
      <div className="px-4 md:px-6 py-6 md:py-10">
        <div className="cjq-doc-grid">
          {/* Left rail — every question, grouped by topic */}
          <aside className="hidden lg:block">
            <div className="cjq-index">
              <div className="cjq-index-head">
                <span>Core Java</span>
                <span className="tabular-nums">{entry.index + 1}/{getAllCoreJavaQuestions().length}</span>
              </div>
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-full text-left cjq-index-link"
              >
                <List size={12} className="inline mr-1 -mt-0.5" aria-hidden="true" />
                Browse all topics
              </button>
              {indexGroups.map((group) => (
                <div key={group.id}>
                  <div className="cjq-index-group">
                    {group.icon} {group.title}
                  </div>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleQuestionNavigate(item.slug)}
                      aria-current={item.id === question.id ? "true" : undefined}
                      className={cn(
                        "cjq-index-link",
                        item.id === question.id && "cjq-index-link--active"
                      )}
                    >
                      <span className="cjq-index-num">{String(item.n).padStart(2, "0")}</span>
                      {item.title}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </aside>

          {/* The answer itself */}
          <main className="cjq-doc">
            <nav aria-label="Breadcrumb" className="cjq-crumbs">
              <Link to="/">Home</Link>
              <ChevronRight size={11} className="cjq-crumbs-sep" aria-hidden="true" />
              <Link to="/interview/java">Interview</Link>
              <ChevronRight size={11} className="cjq-crumbs-sep" aria-hidden="true" />
              <Link to={listPath}>Core Java</Link>
              <ChevronRight size={11} className="cjq-crumbs-sep" aria-hidden="true" />
              <span className="truncate max-w-[240px] text-[hsl(var(--reader-heading))]">{question.question}</span>
            </nav>

            <header>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="cjq-chip cjq-chip--accent">Q{questionNumber}</span>
                {meta.difficulty && <DifficultyBadge difficulty={meta.difficulty} />}
                {meta.priority && <PriorityBadge priority={meta.priority} />}
                {meta.javaVersions?.slice(0, 2).map((v) => (
                  <JavaVersionBadge key={v} version={v} />
                ))}
                {meta.tags?.slice(0, 3).map((tag) => (
                  <span key={tag} className="cjq-chip">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 id="question-title" className="cjq-doc-qtitle mt-4">
                {question.question}
              </h1>
            </header>

            <section aria-labelledby="question-text-label">
              <span className="cjq-doc-label" id="question-text-label">
                Question
              </span>
              <p className="cjq-doc-ask mt-2">{question.question}</p>
              {question.explanation && (
                <p className="cjq-doc-note mt-3">
                  <b>In short: </b>
                  {question.explanation}
                </p>
              )}
            </section>

            <section id="answer" className="scroll-mt-28" aria-labelledby="answer-heading">
              <h2 id="answer-heading" className="cjq-doc-h2">
                <span className="cjq-doc-h2-num">{sectionNumber("answer")}</span>
                Answer
              </h2>
              <div className="cjq-doc-box mt-4">
                <CoreJavaQuestionAnswer answer={question.answer} />
              </div>
            </section>

            {hasCoreJavaVisualization(question.id) && (
              <section id="visualization" className="scroll-mt-28" aria-labelledby="visualization-heading">
                <h2 id="visualization-heading" className="cjq-doc-h2">
                  <span className="cjq-doc-h2-num">{sectionNumber("visualization")}</span>
                  Diagram
                </h2>
                <div className="mt-4">
                  <CoreJavaVisualizationBlock questionId={question.id} />
                </div>
              </section>
            )}

            {question.code && (
              <section id="code-example" className="scroll-mt-28" aria-labelledby="code-example-heading">
                <h2 id="code-example-heading" className="cjq-doc-h2">
                  <span className="cjq-doc-h2-num">{sectionNumber("code-example")}</span>
                  Code Example
                </h2>
                <div className="mt-4">
                  <CodeBlock
                    surface="reader"
                    language={question.codeLanguage || "java"}
                    code={question.code}
                    title="Example"
                  />
                </div>
              </section>
            )}

            {question.explanation && (
              <section id="key-takeaways" className="scroll-mt-28" aria-labelledby="key-takeaways-heading">
                <h2 id="key-takeaways-heading" className="cjq-doc-h2">
                  <span className="cjq-doc-h2-num">{sectionNumber("key-takeaways")}</span>
                  Key Takeaways
                </h2>
                <div className="cjq-doc-box mt-4">
                  <p className="cjq-ans-p">{question.explanation}</p>
                </div>
              </section>
            )}

            {meta.relatedQuestionIds && meta.relatedQuestionIds.length > 0 && (
              <section id="related-questions" className="scroll-mt-28" aria-labelledby="related-questions-heading">
                <h2 id="related-questions-heading" className="cjq-doc-h2">
                  <span className="cjq-doc-h2-num">{sectionNumber("related-questions")}</span>
                  Related Questions
                </h2>
                <div className="cjq-related mt-4">
                  {meta.relatedQuestionIds.map((rid) => {
                    const related = getCoreJavaQuestionById(rid);
                    if (!related) return null;
                    return (
                      <Link
                        key={rid}
                        to={getCoreJavaQuestionDetailPath(related.question)}
                        className="cjq-related-link group"
                      >
                        <span className="cjq-chip cjq-chip--accent">
                          Q{String(related.index + 1).padStart(2, "0")}
                        </span>
                        <span className="cjq-related-q">{related.question.question}</span>
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[hsl(var(--reader-link))]">
                          Read <ArrowRight size={12} />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="cjq-actions">
              <CoreJavaBookmarkButton
                questionId={question.id}
                isBookmarked={isBookmarked(question.id)}
                onToggle={handleBookmark}
              />
              <CoreJavaLearnedButton
                questionId={question.id}
                isLearned={!!doneMap[question.id]}
                isUpserting={isUpserting(question.id)}
                onToggle={handleLearned}
              />
              <CoreJavaShareButton url={shareUrl} title={question.question} />
              <CoreJavaCopyTextButton
                text={`${question.question}\n\n${question.explanation ?? ""}\n\n${question.answer}`}
                label="Copy answer"
              />
            </div>

            {/* Previous | Next — the documentation footer */}
            <nav className="cjq-prevnext" aria-label="Question pagination">
              {previous ? (
                <Link to={`/interview/${language ?? "java"}/core-java-qa/${previous.slug}`} className="cjq-pn">
                  <ArrowLeft size={14} aria-hidden="true" />
                  <span>
                    <span className="cjq-pn-label">Previous </span>
                    {previous.question.question}
                  </span>
                </Link>
              ) : (
                <Link to={listPath} className="cjq-pn">
                  <ArrowLeft size={14} aria-hidden="true" />
                  <span>
                    <span className="cjq-pn-label">Back to </span>All questions
                  </span>
                </Link>
              )}

              <span className="cjq-pn-sep" aria-hidden="true">
                |
              </span>

              {next ? (
                <Link to={`/interview/${language ?? "java"}/core-java-qa/${next.slug}`} className="cjq-pn cjq-pn--next">
                  <span className="text-right">
                    <span className="cjq-pn-label">Next </span>
                    {next.question.question}
                  </span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              ) : (
                <Link to={listPath} className="cjq-pn cjq-pn--next">
                  <span className="text-right">
                    <span className="cjq-pn-label">Back to </span>All questions
                  </span>
                </Link>
              )}
            </nav>
          </main>

          {/* Right rail — on this page */}
          <aside className="hidden xl:block">
            <div className="sticky top-24">
              <span className="cjq-toc-head">On this page</span>
              <nav aria-label="On this page">
                {tocSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    aria-current={activeSection === section.id ? "true" : undefined}
                    className={cn("cjq-toc-link", activeSection === section.id && "cjq-toc-link--active")}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Mobile drawer: browse the index ──────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Browse questions">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="cjq-reader absolute left-0 top-0 bottom-0 w-[300px] max-w-[85vw] border-r border-[hsl(var(--reader-border))] flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--reader-border))]">
              <span className="text-sm font-bold flex items-center gap-2">
                <BookOpen size={15} className="text-[hsl(var(--reader-accent))]" /> All questions
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg hover:bg-[hsl(var(--reader-accent)/0.08)] transition-colors"
                aria-label="Close questions drawer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <button
                onClick={() => navigate(listPath)}
                className="w-full text-left px-3 py-2.5 rounded-lg border border-[hsl(var(--reader-accent)/0.3)] bg-[hsl(var(--reader-accent)/0.1)] text-[hsl(var(--reader-accent))] text-sm font-semibold mb-3"
              >
                ← Back to the question list
              </button>
              {indexGroups.map((group) => (
                <div key={group.id} className="mb-2">
                  <div className="cjq-index-group">
                    {group.icon} {group.title}
                  </div>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleQuestionNavigate(item.slug);
                        setDrawerOpen(false);
                      }}
                      className={cn("cjq-index-link", item.id === question.id && "cjq-index-link--active")}
                    >
                      <span className="cjq-index-num">{String(item.n).padStart(2, "0")}</span>
                      {item.title}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
