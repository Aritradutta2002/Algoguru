"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  List,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { CodeBlock } from "@/components/CodeBlock";
import { CppQuestionAnswer } from "@/components/interview/CppQuestionAnswer";
import {
  CppBookmarkButton,
  CppLearnedButton,
  CppShareButton,
  CppCopyTextButton,
} from "@/components/interview/CppActions";
import {
  CppDifficultyBadge,
  CppPriorityBadge,
} from "@/components/interview/CppBadges";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  useOnThisPage,
  useReadingProgress,
  useReadingPositionPersist,
  scrollToSection,
  type TocSection,
} from "@/hooks/useOnThisPage";
import type { InterviewQuestion, InterviewTopic } from "@/data/coreJavaInterviewData";
import type { Difficulty, InterviewPriority } from "@/data/cppInterviewMetadata";
import { cn } from "@/lib/utils";
import { scrollPageToTop } from "@/lib/scrollUtils";
import "@/styles/core-java-interview.css";

export interface LanguageDetailEntry {
  question: InterviewQuestion;
  topic: InterviewTopic;
  index: number;
  slug: string;
  meta: {
    difficulty?: Difficulty;
    priority?: InterviewPriority;
    tags?: string[];
    relatedQuestionIds?: string[];
  };
}

export interface LanguageQuestionDetailConfig {
  language?: string;
  questionSlug?: string;
  defaultLanguageSlug: "cpp" | "python";
  languageLabel: string;
  codeLanguage: string;
  getEntryBySlug: (slug: string) => LanguageDetailEntry | undefined;
  getEntryById: (id: string) => LanguageDetailEntry | undefined;
  getAdjacent: (id: string) => {
    previous?: LanguageDetailEntry;
    next?: LanguageDetailEntry;
  };
  getDetailPath: (question: InterviewQuestion) => string;
  hasVisualization?: (questionId: string) => boolean;
  renderVisualization?: (questionId: string) => ReactNode;
  renderVersionBadges?: (entry: LanguageDetailEntry) => ReactNode;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
  doneMap: Record<string, boolean>;
  toggleDone: (id: string) => void;
  isUpserting: (id: string) => boolean;
  userStateLoading: boolean;
  readingSectionMap: Record<string, string>;
  saveReadingSection: (id: string, sectionId: string) => void;
}

export function LanguageQuestionDetailView({
  language: languageProp,
  questionSlug: questionSlugProp,
  defaultLanguageSlug,
  languageLabel,
  codeLanguage,
  getEntryBySlug,
  getEntryById,
  getAdjacent,
  getDetailPath,
  hasVisualization,
  renderVisualization,
  renderVersionBadges,
  isBookmarked,
  toggleBookmark,
  doneMap,
  toggleDone,
  isUpserting,
  userStateLoading,
  readingSectionMap,
  saveReadingSection,
}: LanguageQuestionDetailConfig) {
  const params = useParams<{ questionSlug?: string; language?: string }>();
  const questionSlug = questionSlugProp ?? params.questionSlug;
  const language = languageProp ?? params.language;
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const topicsDrawerId = useId();
  const mobileOpenerRef = useRef<HTMLButtonElement | null>(null);
  const desktopOpenerRef = useRef<HTMLButtonElement | null>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const pendingNavigationRef = useRef<string | null>(null);

  const entry = questionSlug ? getEntryBySlug(questionSlug) : undefined;
  const question = entry?.question;
  const topic = entry?.topic;
  const meta = entry?.meta ?? {};
  const progress = useReadingProgress();

  const tocSections = useMemo<TocSection[]>(() => {
    if (!entry) return [];
    const sections: TocSection[] = [{ id: "quick-answer", label: "Quick Answer" }];
    if (hasVisualization?.(entry.question.id)) {
      sections.push({ id: "visualization", label: "Visualization" });
    }
    sections.push({ id: "detailed-answer", label: "Detailed Explanation" });
    if (entry.question.code) {
      sections.push({ id: "code-example", label: "Code Example" });
    }
    if (entry.question.explanation) {
      sections.push({ id: "key-takeaways", label: "Key Takeaways" });
    }
    if (entry.meta.relatedQuestionIds?.length) {
      sections.push({ id: "related-questions", label: "Related Questions" });
    }
    return sections;
  }, [entry, hasVisualization]);

  const activeSection = useOnThisPage({ sections: tocSections });

  useReadingPositionPersist(activeSection, (sectionId) => {
    if (question?.id) saveReadingSection(question.id, sectionId);
  });

  const restoredForRef = useRef<string | null>(null);
  const skipRestoreRef = useRef(false);
  useEffect(() => {
    if (!question || restoredForRef.current === question.id || userStateLoading)
      return;
    if (skipRestoreRef.current) {
      skipRestoreRef.current = false;
      restoredForRef.current = question.id;
      return;
    }
    restoredForRef.current = question.id;
    const saved = readingSectionMap[question.id];
    if (saved && document.getElementById(saved)) {
      requestAnimationFrame(() => {
        scrollToSection(saved);
      });
    }
  }, [question, readingSectionMap, userStateLoading]);

  useEffect(() => {
    if (question) {
      document.title = `${question.question} — ${languageLabel} Interview | AlgoGuru`;
    }
    return () => {
      document.title = "AlgoGuru";
    };
  }, [question, languageLabel]);

  const answerSections = useMemo(
    () => (question?.answer ? question.answer.split("\n\n").filter(Boolean) : []),
    [question?.answer],
  );

  const effectiveLanguage = language ?? defaultLanguageSlug;
  const listPath = `/interview/${effectiveLanguage}/language-questions`;

  if (!entry || !question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
        <p className="text-lg font-semibold mb-2">Question not found</p>
        <p className="text-sm text-muted-foreground mb-6">
          The question you&apos;re looking for doesn&apos;t exist or the link is broken.
        </p>
        <Button type="button" variant="accent" onClick={() => router.push(listPath)}>
          Back to {languageLabel} Q&amp;A
        </Button>
      </div>
    );
  }

  const { previous, next } = getAdjacent(question.id);
  const shareUrl =
    typeof window !== "undefined" ? window.location.href : getDetailPath(question);
  const quickAnswer = answerSections[0] ?? "";
  const hasDeepDive = answerSections.length > 1;

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerNavigate = (destination: string) => {
    pendingNavigationRef.current = destination;
    setDrawerOpen(false);
  };

  const handleQuestionNavigate = (slug: string) => {
    skipRestoreRef.current = true;
    router.push(`${listPath}/${slug}`);
    scrollPageToTop(document.querySelector(".cjd-page"), "auto");
  };

  const handleBookmark = (id: string) => {
    if (!user && !authLoading) {
      toast({
        title: "Please sign in",
        description:
          "Login is required to save bookmarks. Your bookmarks are stored per account.",
        variant: "destructive",
      });
      router.push("/auth");
      return;
    }
    toggleBookmark(id);
  };

  const handleLearned = (id: string) => {
    if (!user && !authLoading) {
      toast({
        title: "Please sign in",
        description:
          "Login is required to save progress. Your progress is stored per account.",
        variant: "destructive",
      });
      router.push("/auth");
      return;
    }
    toggleDone(id);
  };

  return (
    <div className="cjd-page min-h-screen bg-background text-foreground">
      <header className="cjd-sticky-bar sticky top-0 z-30 border-b bg-card/95 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center gap-3 py-2.5">
          <Link
            href={listPath}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-lg border border-border/40 bg-muted/30 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Back to question list"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">All Questions</span>
          </Link>
          <Button
            ref={mobileOpenerRef}
            variant="bare"
            size="bare"
            type="button"
            onClick={handleDrawerOpen}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Browse all topics"
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            aria-controls={topicsDrawerId}
          >
            <List size={14} aria-hidden="true" />
          </Button>
          <span className="font-mono text-[11px] font-bold text-primary shrink-0">
            Q{String(entry.index + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-semibold truncate flex-1 min-w-0 hidden sm:block">
            {question.question}
          </span>
          <div className="hidden md:flex items-center gap-2 w-32">
            <div
              className="flex-1 h-1 rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-label="Reading progress"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-primary transition-[width] duration-150"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <CppBookmarkButton
            questionId={question.id}
            isBookmarked={isBookmarked(question.id)}
            onToggle={handleBookmark}
            compact
          />
          <CppLearnedButton
            questionId={question.id}
            isLearned={Boolean(doneMap[question.id])}
            isUpserting={isUpserting(question.id)}
            onToggle={handleLearned}
            compact
          />
          <CppShareButton url={shareUrl} title={question.question} compact />
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-10 cjd-grid">
        <aside className="cjd-sidebar hidden lg:block">
          <div className="cjd-sidebar-inner sticky top-[57px] max-h-[calc(100vh-116px)] overflow-y-auto pr-2">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={14} className="text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                {languageLabel} Interview
              </span>
            </div>
            <Button variant="bare" size="bare"
              ref={desktopOpenerRef}
              type="button"
              onClick={handleDrawerOpen}
              className="w-full text-left px-3 py-2 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/50 transition-colors mb-2"
              aria-haspopup="dialog"
              aria-expanded={drawerOpen}
              aria-controls={topicsDrawerId}
            >
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <List size={12} />
                Browse all topics
              </span>
            </Button>
            <nav aria-label="Question navigation">
              {previous && (
                <Button variant="bare" size="bare"
                  type="button"
                  onClick={() => handleQuestionNavigate(previous.slug)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <span className="block text-xs font-medium text-muted-foreground/60 mb-0.5">
                    ← Previous
                  </span>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground leading-snug line-clamp-2">
                    {previous.question.question}
                  </span>
                </Button>
              )}
              {next && (
                <Button variant="bare" size="bare"
                  type="button"
                  onClick={() => handleQuestionNavigate(next.slug)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <span className="block text-xs font-medium text-muted-foreground/60 mb-0.5">
                    Next →
                  </span>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground leading-snug line-clamp-2">
                    {next.question.question}
                  </span>
                </Button>
              )}
            </nav>
          </div>
        </aside>

        <main className="cjd-main min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-6 flex-wrap font-mono"
          >
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight size={11} aria-hidden="true" />
            <Link
              href={`/interview/${effectiveLanguage}`}
              className="hover:text-primary transition-colors"
            >
              Interview
            </Link>
            <ChevronRight size={11} aria-hidden="true" />
            <Link href={listPath} className="hover:text-primary transition-colors">
              {languageLabel}
            </Link>
            <ChevronRight size={11} aria-hidden="true" />
            <span className="text-foreground/80 truncate max-w-[220px]">
              {question.question}
            </span>
          </nav>

          <article className="cjd-article" aria-labelledby="question-title">
            <header className="cjd-question-header mb-8">
              <div className="flex items-center gap-2.5 flex-wrap mb-4">
                <Badge className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary">
                  Q{String(entry.index + 1).padStart(2, "0")}
                </Badge>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {topic?.icon} {topic?.title}
                </span>
                {meta.difficulty && <CppDifficultyBadge difficulty={meta.difficulty} />}
                {meta.priority && <CppPriorityBadge priority={meta.priority} />}
                {renderVersionBadges?.(entry)}
                {meta.tags && meta.tags.length > 0 && (
                  <span className="hidden md:flex items-center gap-1.5">
                    {meta.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[10px] font-mono text-muted-foreground/70 px-2 py-0.5 rounded-full bg-muted/40 border-border/30"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </span>
                )}
              </div>
              <h1
                ref={questionHeadingRef}
                id="question-title"
                tabIndex={-1}
                className="text-2xl md:text-[32px] lg:text-[36px] font-bold tracking-tight leading-[1.25] mb-4"
              >
                {question.question}
              </h1>
              {question.explanation && (
                <p className="cjd-mental-model text-[15px] md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary/50 pl-4">
                  <span className="font-semibold text-foreground">In short: </span>
                  {question.explanation}
                </p>
              )}
            </header>

            <section
              id="quick-answer"
              className="cjd-section scroll-mt-36"
              aria-labelledby="quick-answer-heading"
            >
              <h2 id="quick-answer-heading" className="cjd-section-heading">
                <span className="cjd-section-icon">⚡</span>
                Quick Answer
              </h2>
              <div className="cjd-surface rounded-xl p-5 md:p-6">
                <CppQuestionAnswer answer={quickAnswer} />
              </div>
            </section>

            {hasVisualization?.(question.id) && (
              <div id="visualization" className="scroll-mt-36">
                {renderVisualization?.(question.id)}
              </div>
            )}

            {hasDeepDive && (
              <section
                id="detailed-answer"
                className="cjd-section scroll-mt-36"
                aria-labelledby="detailed-answer-heading"
              >
                <h2 id="detailed-answer-heading" className="cjd-section-heading">
                  <span className="cjd-section-icon">📚</span>
                  Detailed Explanation
                </h2>
                <div className="cjd-surface rounded-xl p-5 md:p-6">
                  <CppQuestionAnswer answer={answerSections.slice(1).join("\n\n")} />
                </div>
              </section>
            )}

            {question.code && (
              <section
                id="code-example"
                className="cjd-section scroll-mt-36"
                aria-labelledby="code-example-heading"
              >
                <h2 id="code-example-heading" className="cjd-section-heading">
                  <span className="cjd-section-icon">💻</span>
                  Code Example
                </h2>
                <CodeBlock
                  language={question.codeLanguage || codeLanguage}
                  code={question.code}
                  title="Example"
                />
              </section>
            )}

            {question.explanation && (
              <section
                id="key-takeaways"
                className="cjd-section scroll-mt-36"
                aria-labelledby="key-takeaways-heading"
              >
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

            {meta.relatedQuestionIds && meta.relatedQuestionIds.length > 0 && (
              <section
                id="related-questions"
                className="cjd-section scroll-mt-36"
                aria-labelledby="related-questions-heading"
              >
                <h2 id="related-questions-heading" className="cjd-section-heading">
                  <span className="cjd-section-icon">🔗</span>
                  Related Questions
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {meta.relatedQuestionIds.map((rid) => {
                    const related = getEntryById(rid);
                    if (!related) return null;
                    return (
                      <Link
                        key={rid}
                        href={getDetailPath(related.question)}
                        className="cjd-surface rounded-xl p-4 border border-border/40 hover:border-primary/40 hover:bg-muted/30 transition-all group"
                      >
                        <span className="block text-xs font-mono font-medium text-muted-foreground/60 mb-1.5">
                          Q{String(related.index + 1).padStart(2, "0")} ·{" "}
                          {related.topic.title}
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

            <div className="flex items-center gap-2.5 flex-wrap mt-10 pt-6 border-t border-border/30">
              <CppBookmarkButton
                questionId={question.id}
                isBookmarked={isBookmarked(question.id)}
                onToggle={handleBookmark}
              />
              <CppLearnedButton
                questionId={question.id}
                isLearned={Boolean(doneMap[question.id])}
                isUpserting={isUpserting(question.id)}
                onToggle={handleLearned}
              />
              <CppShareButton url={shareUrl} title={question.question} />
              {question.explanation && (
                <CppCopyTextButton
                  text={`${question.question}\n\n${question.explanation}`}
                  label="Copy Summary"
                />
              )}
            </div>

            <nav className="grid sm:grid-cols-2 gap-3 mt-8" aria-label="Question pagination">
              {previous ? (
                <Button variant="bare" size="bare"
                  type="button"
                  onClick={() => handleQuestionNavigate(previous.slug)}
                  className="cjd-surface rounded-xl p-4 text-left border border-border/40 hover:border-primary/40 hover:bg-muted/30 transition-all group"
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 mb-1.5">
                    <ArrowLeft
                      size={12}
                      className="group-hover:-translate-x-0.5 transition-transform"
                    />{" "}
                    Previous
                  </span>
                  <span className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {previous.question.question}
                  </span>
                </Button>
              ) : (
                <div className="hidden sm:block" />
              )}
              {next && (
                <Button variant="bare" size="bare"
                  type="button"
                  onClick={() => handleQuestionNavigate(next.slug)}
                  className="cjd-surface rounded-xl p-4 text-right border border-border/40 hover:border-primary/40 hover:bg-muted/30 transition-all group"
                >
                  <span className="flex items-center justify-end gap-1.5 text-xs font-medium text-muted-foreground/70 mb-1.5">
                    Next{" "}
                    <ArrowRight
                      size={12}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </span>
                  <span className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {next.question.question}
                  </span>
                </Button>
              )}
            </nav>
          </article>
        </main>

        <aside className="cjd-toc hidden xl:block">
          <div className="sticky top-[57px]">
            <span className="text-xs font-medium text-muted-foreground block mb-3">
              On This Page
            </span>
            <nav aria-label="On this page" className="space-y-0.5">
              {tocSections.map((section) => (
                <Button variant="bare" size="bare"
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  aria-current={activeSection === section.id ? "true" : undefined}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-md text-xs border-l-2 transition-colors",
                    activeSection === section.id
                      ? "border-primary text-primary font-semibold bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                >
                  {section.label}
                </Button>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          id={topicsDrawerId}
          side="left"
          overlayClassName="z-[80]"
          showClose={false}
          aria-modal="true"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const visibleOpener = window.matchMedia("(min-width: 1024px)").matches
              ? desktopOpenerRef.current
              : mobileOpenerRef.current;
            const focusTarget = visibleOpener?.isConnected
              ? visibleOpener
              : questionHeadingRef.current;
            if (focusTarget?.isConnected) {
              focusTarget.focus();
            }

            const destination = pendingNavigationRef.current;
            pendingNavigationRef.current = null;
            if (destination) {
              router.push(destination);
            }
          }}
          className="z-[80] flex h-full w-[300px] max-w-[85vw] flex-col overflow-hidden border-r border-border/50 bg-card p-0 shadow-overlay backdrop-blur-none sm:max-w-[300px]"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border/30 px-5 py-4">
            <div>
              <SheetTitle className="flex items-center gap-2 text-sm font-bold">
                <BookOpen size={15} className="text-primary" aria-hidden="true" />
                Topics
              </SheetTitle>
              <SheetDescription className="sr-only">
                Browse {languageLabel} interview topics and questions.
              </SheetDescription>
            </div>
            <Button variant="bare" size="bare"
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close topics drawer"
            >
              <X size={16} />
            </Button>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-4">
              <Button variant="bare" size="bare"
                type="button"
                onClick={() => handleDrawerNavigate(listPath)}
                className="w-full text-left px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-3"
              >
                ← All {languageLabel} Questions
              </Button>
              {entry && (
                <Button variant="bare" size="bare"
                  type="button"
                  onClick={() =>
                    handleDrawerNavigate(`${listPath}?topic=${entry.topic.id}`)
                  }
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-muted/40 border border-border/40 text-sm font-semibold mb-2"
                >
                  {entry.topic.icon} {entry.topic.title} (current)
                </Button>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
