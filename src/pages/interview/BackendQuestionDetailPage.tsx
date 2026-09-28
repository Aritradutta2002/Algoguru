import { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronRight,
  Code2,
  Dumbbell,
  Lightbulb,
  List,
  MessageCircleQuestion,
  Sparkles,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { BackendAnswer, BackendInline } from "@/components/interview/BackendAnswer";
import { DifficultyBadge, PriorityBadge } from "@/components/interview/CoreJavaBadges";
import { useBackendInterviewProgress } from "@/hooks/useBackendInterviewProgress";
import { useOnThisPage, scrollToSection, type TocSection } from "@/hooks/useOnThisPage";
import {
  BACKEND_BASE_PATH,
  BACKEND_PRACTICE_PATH,
  BACKEND_QUESTIONS_PATH,
  BACKEND_TOTAL_QUESTIONS,
  backendQuestionIndex,
  getBackendNeighbours,
  getBackendQuestionById,
  getBackendQuestionBySlug,
} from "@/lib/backendQuestionIndex";
import { getPracticeProblemsForTopic } from "@/data/backendInterview/practiceProblems";
import { cn } from "@/lib/utils";
import { scrollPageToTop } from "@/lib/scrollUtils";
import "@/styles/core-java-interview.css";

export default function BackendQuestionDetailPage() {
  const { questionSlug, language = "java" } = useParams<{ questionSlug?: string; language?: string }>();
  const navigate = useNavigate();
  const progress = useBackendInterviewProgress();
  const rootRef = useRef<HTMLDivElement>(null);

  const entry = questionSlug ? getBackendQuestionBySlug(questionSlug) : undefined;

  useEffect(() => {
    if (!questionSlug) return;
    if (!entry) {
      navigate(BACKEND_QUESTIONS_PATH, { replace: true });
    }
  }, [entry, navigate, questionSlug]);

  useEffect(() => {
    if (!entry) return;
    document.title = `${entry.question.question} — Backend Interview | AlgoGuru`;
    scrollPageToTop(rootRef.current);
    return () => {
      document.title = "AlgoGuru";
    };
  }, [entry]);

  const sections = useMemo<TocSection[]>(() => {
    if (!entry) return [];
    const list: TocSection[] = [
      { id: "quick-answer", label: "Quick Answer" },
      { id: "detailed-answer", label: "Full Explanation" },
    ];
    if (entry.question.code) list.push({ id: "code-example", label: "Code Example" });
    list.push({ id: "key-takeaways", label: "What They're Testing" });
    if (entry.question.followUps?.length) list.push({ id: "follow-ups", label: "Follow-Up Questions" });
    list.push({ id: "practice", label: "Practice" });
    return list;
  }, [entry]);

  const activeSection = useOnThisPage({ sections });

  const neighbours = useMemo(
    () => (entry ? getBackendNeighbours(entry.question.id) : {}),
    [entry],
  );

  const practice = useMemo(
    () => (entry ? getPracticeProblemsForTopic(entry.topic.id).slice(0, 4) : []),
    [entry],
  );

  const related = useMemo(() => {
    if (!entry) return [];
    const sameTopic = entry.topic.id;
    return getBackendNeighboursByTopic(entry.question.id, sameTopic);
  }, [entry]);

  if (!entry) return null;

  const { question, meta, topic, number, slug } = entry;
  const [quickAnswer, ...rest] = question.answer.split("\n\n");
  const detailed = rest.join("\n\n");
  const studied = progress.studiedIds.has(question.id);
  const bookmarked = progress.bookmarkedIds.has(question.id);

  return (
    <div ref={rootRef} className="cjd-page min-h-full w-full">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="cjh-breadcrumb mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link to={`/interview/${language}`} className="capitalize transition-colors hover:text-foreground">
            {language}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={BACKEND_BASE_PATH} className="transition-colors hover:text-foreground">
            Spring Boot &amp; Backend
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            to={`${BACKEND_QUESTIONS_PATH}?topic=${topic.id}`}
            className="transition-colors hover:text-foreground"
          >
            {topic.shortTitle}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Q{number}</span>
        </nav>

        <div className="cjd-grid lg:flex lg:gap-8">
          {/* Main column */}
          <article className="cjd-article min-w-0 flex-1">
            <motion.header
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="cjd-surface rounded-2xl border border-border/50 bg-card/70 p-5 sm:p-6"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-mono font-semibold text-primary">
                  Question {number} of {BACKEND_TOTAL_QUESTIONS}
                </span>
                <span className="rounded-md border border-border/50 bg-muted/60 px-1.5 py-0.5 text-muted-foreground">
                  {topic.icon} {topic.shortTitle}
                </span>
                <DifficultyBadge difficulty={meta.difficulty} />
                <PriorityBadge priority={meta.priority} />
                {meta.versions?.map((v) => (
                  <span
                    key={v}
                    className="rounded-md border border-info/25 bg-info/10 px-1.5 py-0.5 text-info"
                  >
                    {v}
                  </span>
                ))}
                {meta.readMinutes && (
                  <span className="text-muted-foreground">{meta.readMinutes} min read</span>
                )}
              </div>

              <h1 className="cjq-detail-title text-2xl font-black leading-tight text-foreground sm:text-3xl">
                {question.question}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => progress.toggleStudied(question.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                    studied
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-border/60 text-muted-foreground hover:border-success/40 hover:text-success",
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                  {studied ? "Studied" : "Mark as studied"}
                </button>
                <button
                  type="button"
                  onClick={() => progress.toggleBookmark(question.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                    bookmarked
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary",
                  )}
                >
                  <Bookmark className={cn("h-3.5 w-3.5", bookmarked && "fill-current")} />
                  {bookmarked ? "Bookmarked" : "Bookmark"}
                </button>
              </div>

              {meta.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {meta.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`${BACKEND_QUESTIONS_PATH}?q=${encodeURIComponent(tag)}`}
                      className="rounded border border-border/40 px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </motion.header>

            {/* Quick answer */}
            <section id="quick-answer" className="cjd-section mt-6 scroll-mt-24">
              <h2 className="cjd-section-heading flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="cjd-section-icon flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                Quick Answer
              </h2>
              <div className="cjd-mental-model mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                <div className="cjq-reading">
                  <BackendAnswer answer={quickAnswer} />
                </div>
              </div>
            </section>

            {/* Detailed */}
            {detailed && (
              <section id="detailed-answer" className="cjd-section mt-8 scroll-mt-24">
                <h2 className="cjd-section-heading flex items-center gap-2 text-lg font-bold text-foreground">
                  <span className="cjd-section-icon flex h-7 w-7 items-center justify-center rounded-lg bg-info/10 text-info">
                    <List className="h-4 w-4" />
                  </span>
                  Full Explanation
                </h2>
                <div className="cjd-surface cjq-reading mt-3 rounded-2xl border border-border/50 bg-card/70 p-5 sm:p-6">
                  <BackendAnswer answer={detailed} />
                </div>
              </section>
            )}

            {/* Code */}
            {question.code && (
              <section id="code-example" className="cjd-section mt-8 scroll-mt-24">
                <h2 className="cjd-section-heading flex items-center gap-2 text-lg font-bold text-foreground">
                  <span className="cjd-section-icon flex h-7 w-7 items-center justify-center rounded-lg bg-success/10 text-success">
                    <Code2 className="h-4 w-4" />
                  </span>
                  Code Example
                </h2>
                <div className="mt-3">
                  <CodeBlock
                    title={`${question.id} · ${topic.shortTitle}`}
                    language={question.codeLanguage ?? "java"}
                    code={question.code}
                  />
                </div>
              </section>
            )}

            {/* Takeaway */}
            <section id="key-takeaways" className="cjd-section mt-8 scroll-mt-24">
              <h2 className="cjd-section-heading flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="cjd-section-icon flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10 text-warning">
                  <Lightbulb className="h-4 w-4" />
                </span>
                What They&apos;re Really Testing
              </h2>
              <div className="mt-3 rounded-2xl border border-warning/25 bg-warning/5 p-4 sm:p-5">
                <p className="text-sm leading-relaxed text-foreground">
                  <BackendInline text={question.explanation} />
                </p>
                <p className="mt-3 border-t border-warning/20 pt-3 text-xs italic leading-relaxed text-muted-foreground">
                  {topic.interviewerIntent}
                </p>
              </div>
            </section>

            {/* Follow ups */}
            {question.followUps && question.followUps.length > 0 && (
              <section id="follow-ups" className="cjd-section mt-8 scroll-mt-24">
                <h2 className="cjd-section-heading flex items-center gap-2 text-lg font-bold text-foreground">
                  <span className="cjd-section-icon flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <MessageCircleQuestion className="h-4 w-4" />
                  </span>
                  Follow-Up Questions
                </h2>
                <p className="mt-2 text-xs text-muted-foreground">
                  Where the interviewer goes next once you answer well. Have a sentence ready for each.
                </p>
                <ul className="mt-3 space-y-2">
                  {question.followUps.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex gap-3 rounded-xl border border-border/50 bg-card/60 p-3 text-sm text-foreground"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-bold text-muted-foreground">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">
                        <BackendInline text={item} />
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Practice + related */}
            <section id="practice" className="cjd-section mt-8 scroll-mt-24">
              <h2 className="cjd-section-heading flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="cjd-section-icon flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Dumbbell className="h-4 w-4" />
                </span>
                Now Practice It
              </h2>
              {practice.length > 0 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {practice.map((problem) => (
                    <Link
                      key={problem.id}
                      to={`${BACKEND_PRACTICE_PATH}/${problem.id}`}
                      className="group rounded-xl border border-border/50 bg-card/70 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {problem.difficulty} · {problem.estimatedMinutes} min
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                      <p className="mt-1.5 text-sm font-semibold leading-snug text-foreground">
                        {problem.title}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No dedicated exercise for this topic yet —{" "}
                  <Link to={BACKEND_PRACTICE_PATH} className="text-primary hover:underline">
                    browse the full practice lab
                  </Link>
                  .
                </p>
              )}

              {related.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-foreground">More from {topic.shortTitle}</h3>
                  <div className="mt-2 space-y-1.5">
                    {related.map((item) => (
                      <Link
                        key={item.question.id}
                        to={`${BACKEND_QUESTIONS_PATH}/${item.slug}`}
                        className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                      >
                        <span className="font-mono text-[11px] text-primary">Q{item.number}</span>
                        <span className="truncate">{item.question.question}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Prev / next */}
            <nav className="mt-10 grid gap-3 sm:grid-cols-2">
              {neighbours.previous ? (
                <Link
                  to={`${BACKEND_QUESTIONS_PATH}/${neighbours.previous.slug}`}
                  className="group rounded-xl border border-border/50 bg-card/60 p-4 transition-colors hover:border-primary/40"
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <ArrowLeft className="h-3 w-3" />
                    Previous
                  </span>
                  <p className="mt-1.5 line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                    {neighbours.previous.question.question}
                  </p>
                </Link>
              ) : (
                <span />
              )}
              {neighbours.next && (
                <Link
                  to={`${BACKEND_QUESTIONS_PATH}/${neighbours.next.slug}`}
                  className="group rounded-xl border border-border/50 bg-card/60 p-4 text-right transition-colors hover:border-primary/40"
                >
                  <span className="flex items-center justify-end gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Next
                    <ArrowRight className="h-3 w-3" />
                  </span>
                  <p className="mt-1.5 line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                    {neighbours.next.question.question}
                  </p>
                </Link>
              )}
            </nav>
          </article>

          {/* TOC */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                On this page
              </p>
              <ul className="space-y-0.5 border-l border-border/50">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "-ml-px block w-full border-l-2 px-3 py-1.5 text-left text-xs transition-colors",
                        activeSection === section.id
                          ? "border-primary font-semibold text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {section.label}
                    </button>
                  </li>
                ))}
              </ul>
              <Link
                to={`${BACKEND_QUESTIONS_PATH}?topic=${topic.id}`}
                className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <ArrowLeft className="h-3 w-3" />
                All {topic.shortTitle} questions
              </Link>
              <p className="mt-3 text-[11px] text-muted-foreground">
                {entry.positionInTopic} of {entry.topicSize} in this topic · <span className="font-mono">{slug}</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Up to four sibling questions from the same topic, centred on the current one. */
function getBackendNeighboursByTopic(currentId: string, topicId: string) {
  const current = getBackendQuestionById(currentId);
  if (!current) return [];
  const siblings = backendQuestionIndex.filter(
    (item) => item.topic.id === topicId && item.question.id !== currentId,
  );
  const start = Math.max(0, Math.min(current.positionInTopic - 3, siblings.length - 4));
  return siblings.slice(start, start + 4);
}
