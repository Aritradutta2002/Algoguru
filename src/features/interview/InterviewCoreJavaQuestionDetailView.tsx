"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, List, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { CodeBlock } from "@/components/CodeBlock";
import {
  CoreJavaBookmarkButton,
  CoreJavaCopyTextButton,
  CoreJavaLearnedButton,
  CoreJavaShareButton,
} from "@/components/interview/CoreJavaActions";
import {
  DifficultyBadge,
  JavaVersionBadge,
  PriorityBadge,
} from "@/components/interview/CoreJavaBadges";
import { CoreJavaQuestionAnswer } from "@/components/interview/CoreJavaQuestionAnswer";
import {
  CoreJavaVisualizationBlock,
  hasCoreJavaVisualization,
} from "@/components/interview/CoreJavaVisualizationBlock";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  getCoreJavaQuestionDetailPath,
  getCoreJavaQuestionMeta,
} from "@/data/coreJavaInterviewMetadata";
import { useCoreJavaBookmarks } from "@/hooks/useCoreJavaBookmarks";
import { useCoreJavaUserState } from "@/hooks/useCoreJavaUserState";
import {
  scrollToSection,
  useOnThisPage,
  useReadingProgress,
  type TocSection,
} from "@/hooks/useOnThisPage";
import {
  getAdjacentCoreJavaQuestions,
  getAllCoreJavaQuestions,
  getCoreJavaQuestionById,
  getCoreJavaQuestionBySlug,
} from "@/lib/coreJavaQuestionIndex";
import { scrollPageToTop } from "@/lib/scrollUtils";
import { cn } from "@/lib/utils";
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

export default function InterviewCoreJavaQuestionDetailView({
  language: languageProp,
  questionSlug: questionSlugProp,
}: {
  language?: string;
  questionSlug?: string;
}) {
  const params = useParams<{ questionSlug?: string; language?: string }>();
  const questionSlug = questionSlugProp ?? params.questionSlug;
  const language = languageProp ?? params.language;
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { isBookmarked, toggleBookmark } = useCoreJavaBookmarks();
  const { doneMap, toggleDone, isUpserting } = useCoreJavaUserState();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mobileDrawerOpenerRef = useRef<HTMLButtonElement>(null);
  const desktopDrawerOpenerRef = useRef<HTMLButtonElement>(null);
  const questionTitleRef = useRef<HTMLHeadingElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const drawerContentId = "core-java-question-drawer";

  const entry = questionSlug ? getCoreJavaQuestionBySlug(questionSlug) : undefined;
  const question = entry?.question;
  const topic = entry?.topic;
  const meta = entry?.meta ?? {};
  const progress = useReadingProgress();
  const tocSections = useMemo(
    () => (entry ? buildTocSections(entry.question.id) : []),
    [entry],
  );
  const activeSection = useOnThisPage({ sections: tocSections });

  const indexGroups = useMemo(() => {
    const groups: {
      id: string;
      title: string;
      icon?: string;
      items: { id: string; slug: string; title: string; n: number }[];
    }[] = [];
    const byId = new Map<string, (typeof groups)[number]>();
    for (const e of getAllCoreJavaQuestions()) {
      let g = byId.get(e.topic.id);
      if (!g) {
        g = { id: e.topic.id, title: e.topic.title, icon: e.topic.icon, items: [] };
        byId.set(e.topic.id, g);
        groups.push(g);
      }
      g.items.push({
        id: e.question.id,
        slug: e.slug,
        title: e.question.question,
        n: e.index + 1,
      });
    }
    return groups;
  }, []);

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

  const listPath = `/interview/${language ?? "java"}/core-java-qa`;

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerNavigate = (navigate: () => void) => {
    pendingNavigationRef.current = navigate;
    setDrawerOpen(false);
  };

  const getDrawerFocusTarget = () => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const visibleOpener = isDesktop
      ? desktopDrawerOpenerRef.current
      : mobileDrawerOpenerRef.current;

    return visibleOpener?.isConnected ? visibleOpener : questionTitleRef.current;
  };

  if (!entry || !question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
        <p className="text-lg font-semibold mb-2">Question not found</p>
        <p className="text-sm text-muted-foreground mb-6">
          The question you&apos;re looking for doesn&apos;t exist or the link is broken.
        </p>
        <Button type="button" variant="accent" onClick={() => router.push(listPath)}>
          Back to Core Java Q&amp;A
        </Button>
      </div>
    );
  }

  const { previous, next } = getAdjacentCoreJavaQuestions(question.id);
  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : getCoreJavaQuestionDetailPath(question);
  const questionNumber = String(entry.index + 1).padStart(2, "0");
  const progressPct = Math.round(progress * 100);

  const sectionNumber = (id: string) => {
    const i = tocSections.findIndex((s) => s.id === id);
    return i < 0 ? "" : String(i + 1).padStart(2, "0");
  };

  const handleQuestionNavigate = (slug: string) => {
    router.push(`${listPath}/${slug}`);
    scrollPageToTop(pageRef.current, "auto");
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
    <div ref={pageRef} className="cjq-reader cjd-page min-h-screen">
      <div className="cjq-reader-bar">
        <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6">
          <div className="flex items-center gap-3 h-14">
            <Link
              href={listPath}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold text-[hsl(var(--reader-note))] hover:text-[hsl(var(--reader-heading))] hover:bg-[hsl(var(--reader-accent)/0.08)] transition-colors"
              aria-label="Back to question list"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">All questions</span>
            </Link>

            <Button variant="bare" size="bare"
              ref={mobileDrawerOpenerRef}
              type="button"
              onClick={handleDrawerOpen}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold text-[hsl(var(--reader-note))] hover:text-[hsl(var(--reader-heading))] hover:bg-[hsl(var(--reader-accent)/0.08)] transition-colors lg:hidden"
              aria-label="Browse all questions"
              aria-haspopup="dialog"
              aria-expanded={drawerOpen}
              aria-controls={drawerContentId}
            >
              <List size={14} />
            </Button>

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
              isLearned={Boolean(doneMap[question.id])}
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

      <div className="px-4 md:px-6 py-6 md:py-10">
        <div className="cjq-doc-grid">
          <aside className="hidden lg:block">
            <div className="cjq-index">
              <div className="cjq-index-head">
                <span>Core Java</span>
                <span className="tabular-nums">
                  {entry.index + 1}/{getAllCoreJavaQuestions().length}
                </span>
              </div>
              <Button variant="bare" size="bare"
                ref={desktopDrawerOpenerRef}
                type="button"
                onClick={handleDrawerOpen}
                className="w-full text-left cjq-index-link"
                aria-haspopup="dialog"
                aria-expanded={drawerOpen}
                aria-controls={drawerContentId}
              >
                <List size={12} className="inline mr-1 -mt-0.5" aria-hidden="true" />
                Browse all topics
              </Button>
              {indexGroups.map((group) => (
                <div key={group.id}>
                  <div className="cjq-index-group">
                    {group.icon} {group.title}
                  </div>
                  {group.items.map((item) => (
                    <Button variant="bare" size="bare"
                      key={item.id}
                      type="button"
                      onClick={() => handleQuestionNavigate(item.slug)}
                      aria-current={item.id === question.id ? "true" : undefined}
                      className={cn(
                        "cjq-index-link",
                        item.id === question.id && "cjq-index-link--active",
                      )}
                    >
                      <span className="cjq-index-num">
                        {String(item.n).padStart(2, "0")}
                      </span>
                      {item.title}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </aside>

          <main className="cjq-doc">
            <nav aria-label="Breadcrumb" className="cjq-crumbs">
              <Link href="/">Home</Link>
              <ChevronRight size={11} className="cjq-crumbs-sep" aria-hidden="true" />
              <Link href="/interview/java">Interview</Link>
              <ChevronRight size={11} className="cjq-crumbs-sep" aria-hidden="true" />
              <Link href={listPath}>Core Java</Link>
              <ChevronRight size={11} className="cjq-crumbs-sep" aria-hidden="true" />
              <span className="truncate max-w-[240px] text-[hsl(var(--reader-heading))]">
                {question.question}
              </span>
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
              <h1
                ref={questionTitleRef}
                id="question-title"
                tabIndex={-1}
                className="cjq-doc-qtitle mt-4"
              >
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
              <section
                id="visualization"
                className="scroll-mt-28"
                aria-labelledby="visualization-heading"
              >
                <h2 id="visualization-heading" className="cjq-doc-h2">
                  <span className="cjq-doc-h2-num">
                    {sectionNumber("visualization")}
                  </span>
                  Diagram
                </h2>
                <div className="mt-4">
                  <CoreJavaVisualizationBlock questionId={question.id} />
                </div>
              </section>
            )}

            {question.code && (
              <section
                id="code-example"
                className="scroll-mt-28"
                aria-labelledby="code-example-heading"
              >
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
              <section
                id="key-takeaways"
                className="scroll-mt-28"
                aria-labelledby="key-takeaways-heading"
              >
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
              <section
                id="related-questions"
                className="scroll-mt-28"
                aria-labelledby="related-questions-heading"
              >
                <h2 id="related-questions-heading" className="cjq-doc-h2">
                  <span className="cjq-doc-h2-num">
                    {sectionNumber("related-questions")}
                  </span>
                  Related Questions
                </h2>
                <div className="cjq-related mt-4">
                  {meta.relatedQuestionIds.map((rid) => {
                    const related = getCoreJavaQuestionById(rid);
                    if (!related) return null;
                    return (
                      <Link
                        key={rid}
                        href={getCoreJavaQuestionDetailPath(related.question)}
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
                isLearned={Boolean(doneMap[question.id])}
                isUpserting={isUpserting(question.id)}
                onToggle={handleLearned}
              />
              <CoreJavaShareButton url={shareUrl} title={question.question} />
              <CoreJavaCopyTextButton
                text={`${question.question}\n\n${question.explanation ?? ""}\n\n${question.answer}`}
                label="Copy answer"
              />
            </div>

            <nav className="cjq-prevnext" aria-label="Question pagination">
              {previous ? (
                <Link href={`${listPath}/${previous.slug}`} className="cjq-pn">
                  <ArrowLeft size={14} aria-hidden="true" />
                  <span>
                    <span className="cjq-pn-label">Previous </span>
                    {previous.question.question}
                  </span>
                </Link>
              ) : (
                <Link href={listPath} className="cjq-pn">
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
                <Link href={`${listPath}/${next.slug}`} className="cjq-pn cjq-pn--next">
                  <span className="text-right">
                    <span className="cjq-pn-label">Next </span>
                    {next.question.question}
                  </span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              ) : (
                <Link href={listPath} className="cjq-pn cjq-pn--next">
                  <span className="text-right">
                    <span className="cjq-pn-label">Back to </span>All questions
                  </span>
                </Link>
              )}
            </nav>
          </main>

          <aside className="hidden xl:block">
            <div className="sticky top-24">
              <span className="cjq-toc-head">On this page</span>
              <nav aria-label="On this page">
                {tocSections.map((section) => (
                  <Button variant="bare" size="bare"
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    aria-current={activeSection === section.id ? "true" : undefined}
                    className={cn(
                      "cjq-toc-link",
                      activeSection === section.id && "cjq-toc-link--active",
                    )}
                  >
                    {section.label}
                  </Button>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          id={drawerContentId}
          side="left"
          overlayClassName="z-[80]"
          showClose={false}
          aria-modal="true"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            getDrawerFocusTarget()?.focus();
            const navigate = pendingNavigationRef.current;
            pendingNavigationRef.current = null;
            navigate?.();
          }}
          className="cjq-reader z-[80] flex h-full w-[300px] max-w-[85vw] flex-col overflow-hidden border-r border-[hsl(var(--reader-border))] bg-[hsl(var(--reader-page))] p-0 backdrop-blur-none sm:max-w-[300px]"
        >
          <div className="flex shrink-0 items-center justify-between px-5 py-4 border-b border-[hsl(var(--reader-border))]">
            <div>
              <SheetTitle className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--reader-heading))]">
                <BookOpen
                  size={15}
                  className="text-[hsl(var(--reader-accent))]"
                />
                All questions
              </SheetTitle>
              <SheetDescription className="sr-only">
                Browse Core Java interview topics and questions.
              </SheetDescription>
            </div>
            <Button variant="bare" size="bare"
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-lg hover:bg-[hsl(var(--reader-accent)/0.08)] transition-colors"
              aria-label="Close questions drawer"
            >
              <X size={16} />
            </Button>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-4">
              <Button variant="bare" size="bare"
                type="button"
                onClick={() => handleDrawerNavigate(() => router.push(listPath))}
                className="w-full text-left px-3 py-2.5 rounded-lg border border-[hsl(var(--reader-accent)/0.3)] bg-[hsl(var(--reader-accent)/0.1)] text-[hsl(var(--reader-accent))] text-sm font-semibold mb-3"
              >
                ← Back to the question list
              </Button>
              {indexGroups.map((group) => (
                <div key={group.id} className="mb-2">
                  <div className="cjq-index-group">
                    {group.icon} {group.title}
                  </div>
                  {group.items.map((item) => (
                    <Button variant="bare" size="bare"
                      key={item.id}
                      type="button"
                      onClick={() =>
                        handleDrawerNavigate(() => handleQuestionNavigate(item.slug))
                      }
                      aria-current={item.id === question.id ? "true" : undefined}
                      className={cn(
                        "cjq-index-link",
                        item.id === question.id && "cjq-index-link--active",
                      )}
                    >
                      <span className="cjq-index-num">
                        {String(item.n).padStart(2, "0")}
                      </span>
                      {item.title}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
