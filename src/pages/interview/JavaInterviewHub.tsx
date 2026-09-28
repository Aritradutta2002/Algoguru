import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Progress } from "@/components/ui/progress";
import { PageContainer } from "@/components/layout/PagePrimitives";
import { ResetProgressDialog } from "@/components/interview/ResetProgressDialog";
import { ContinueLearningCard } from "@/components/interview/java-hub/ContinueLearningCard";
import { CurriculumSection } from "@/components/interview/java-hub/CurriculumSection";
import { LocalSectionNavigation } from "@/components/interview/java-hub/LocalSectionNavigation";
import { PracticeResources } from "@/components/interview/java-hub/PracticeResources";
import { StudyPlanTimeline } from "@/components/interview/java-hub/StudyPlanTimeline";
import { handleSectionLinkClick, type SectionLink } from "@/components/interview/java-hub/useSectionNavigation";
import {
  buildPreparationSummary,
  buildStudyPlan,
  buildTopicStats,
  deriveStudyFocus,
  pickMostAsked,
  QUESTION_BANK_PATH,
  type StudyFocus,
} from "@/components/interview/java-hub/javaHubData";
import { coreJavaInterviewTopics } from "@/data/coreJavaInterviewData";
import { PRACTICE_PROBLEM_COUNT } from "@/data/backendInterview/practiceProblems";
import { useBackendInterviewProgress } from "@/hooks/useBackendInterviewProgress";
import { useCoreJavaUserState } from "@/hooks/useCoreJavaUserState";
import { getAllCoreJavaQuestions } from "@/lib/coreJavaQuestionIndex";
import "@/styles/core-java-interview.css";

const SECTIONS: readonly SectionLink[] = [
  { id: "overview", label: "Overview" },
  { id: "topics", label: "Topics" },
  { id: "practice", label: "Practice" },
  { id: "plan", label: "Study plan" },
];

const FOOTER_LINKS = [
  { id: "core-java-qa", label: "Core Java Q&A", to: "/interview/java/core-java-qa" },
  { id: "spring-boot", label: "Spring Boot & Backend", to: "/interview/java/spring-boot" },
  { id: "data-structure", label: "Data Structures", to: "/interview/java/data-structure" },
  { id: "system-design", label: "System Design", to: "/interview/java/system-design" },
  { id: "sql-structure", label: "SQL Questions", to: "/interview/java/sql-structure" },
];

export default function JavaInterviewHub() {
  const { doneMap, updatedAtMap, loading, toggleDone } = useCoreJavaUserState();
  const practice = useBackendInterviewProgress();
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    const previous = document.title;
    document.title = "Java Backend Interview Preparation | AlgoGuru";
    return () => {
      document.title = previous;
    };
  }, []);

  /* ── Derived once; every section reads from here ─────────────── */

  const topicStats = useMemo(() => buildTopicStats(coreJavaInterviewTopics, doneMap), [doneMap]);

  const summary = useMemo(
    () => buildPreparationSummary(topicStats, practice.practiceSolvedCount, PRACTICE_PROBLEM_COUNT),
    [topicStats, practice.practiceSolvedCount]
  );

  const focus: StudyFocus = useMemo(
    () => (loading ? { kind: "loading" } : deriveStudyFocus(topicStats, updatedAtMap)),
    [loading, topicStats, updatedAtMap]
  );

  const weeks = useMemo(() => buildStudyPlan(topicStats), [topicStats]);
  const hotQuestions = useMemo(() => pickMostAsked(getAllCoreJavaQuestions(), 6), []);
  const mustKnow = useMemo(() => topicStats.reduce((sum, stat) => sum + stat.mustKnow, 0), [topicStats]);

  const handleResetConfirm = useCallback(() => {
    for (const id of Object.keys(doneMap)) {
      if (doneMap[id]) void toggleDone(id);
    }
    setResetOpen(false);
  }, [doneMap, toggleDone]);

  // While progress is loading, the primary action stays honest: it opens the
  // question bank instead of claiming a "start" or "continue" state too early.
  const primaryAction =
    focus.kind === "loading"
      ? { label: "Open question bank", href: QUESTION_BANK_PATH }
      : { label: focus.ctaLabel, href: focus.ctaHref };

  return (
    <div className="cjh-page">
      <PageContainer className="cjh-page-inner">
        {/* A. Breadcrumb */}
        <Breadcrumb className="cjh-breadcrumb" aria-label="Breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/interview">Interview Prep</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/interview/java">Java</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Backend</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* B. Local section navigation */}
        <LocalSectionNavigation sections={SECTIONS} />

        {/* B. Dashboard header (Two-column desktop overview) */}
        <header id="overview" className="cjh-header cjh-anchor">
          <div className="cjh-header-main">
            <p className="cjh-header-eyebrow">
              Interview prep track
            </p>
            <h1 className="cjh-header-title">Java Backend Interview Preparation</h1>
            <p className="cjh-header-desc">
              Study the questions Java backend interviewers ask, in curriculum order, with full
              answers, practice labs and a fast revision path.
            </p>

            <div className="cjh-header-actions">
              <Link to={primaryAction.href} className="cjh-btn-primary">
                {primaryAction.label}
                <ArrowRight size={15} />
              </Link>
              <a
                href="#topics"
                className="cjh-btn-secondary"
                onClick={(event) => handleSectionLinkClick(event, "topics")}
              >
                Browse all topics
              </a>
            </div>
          </div>

          <aside className="cjh-progress-panel" aria-label="Preparation progress">
            <h2 className="cjh-progress-panel-title">Preparation progress</h2>
            <div className="cjh-progress-panel-stat">
              <span className="cjh-progress-panel-pct">{loading ? "—" : `${summary.overallPct}%`}</span>
              <span className="cjh-progress-panel-label">Complete</span>
            </div>
            {!loading && summary.totalQuestions > 0 && (
              <Progress
                value={summary.overallPct}
                className="cjh-summary-bar"
                aria-label={`Overall preparation progress: ${summary.studiedQuestions} of ${summary.totalQuestions} questions studied`}
              />
            )}
            <dl className="cjh-summary">
              <div className="cjh-summary-item">
                <dt>Overall complete</dt>
                <dd className="cjh-num">{loading ? "—" : `${summary.overallPct}%`}</dd>
              </div>
              <div className="cjh-summary-item">
                <dt>Questions studied</dt>
                <dd className="cjh-num">
                  {loading ? "—" : `${summary.studiedQuestions} of ${summary.totalQuestions}`}
                </dd>
              </div>
              <div className="cjh-summary-item">
                <dt>Topics complete</dt>
                <dd className="cjh-num">
                  {loading ? "—" : `${summary.completedTopics} of ${summary.totalTopics}`}
                </dd>
              </div>
              {summary.practiceTotal > 0 && (
                <div className="cjh-summary-item">
                  <dt>Practice solved</dt>
                  <dd className="cjh-num">
                    {summary.practiceSolved} of {summary.practiceTotal}
                  </dd>
                </div>
              )}
            </dl>
          </aside>
        </header>

        {/* C. Continue learning */}
        <section className="cjh-section cjh-anchor" aria-labelledby="continue-heading">
          <h2 id="continue-heading" className="cjh-section-title cjh-section-title--lg">
            Continue learning
          </h2>
          <ContinueLearningCard focus={focus} />
        </section>

        {/* D. Curriculum */}
        <section id="topics" className="cjh-section cjh-anchor" aria-labelledby="topics-heading">
          <div className="cjh-section-head">
            <h2 id="topics-heading" className="cjh-section-title cjh-section-title--lg">
              Topics
            </h2>
            <p className="cjh-section-desc">
              The curriculum in order. Each row shows how far you are and opens the topic in the
              question bank.
            </p>
          </div>
          <CurriculumSection topics={topicStats} hotQuestions={hotQuestions} />
        </section>

        {/* E. Practice and resources */}
        <section id="practice" className="cjh-section cjh-anchor" aria-labelledby="practice-heading">
          <div className="cjh-section-head">
            <h2 id="practice-heading" className="cjh-section-title cjh-section-title--lg">
              Practice and resources
            </h2>
            <p className="cjh-section-desc">
              Question banks, practice labs and references, each keeping its own progress.
            </p>
          </div>
          <PracticeResources
            summary={summary}
            backendStudied={practice.studiedCount}
            mustKnow={mustKnow}
          />
        </section>

        {/* F. Four-week study plan */}
        <section id="plan" className="cjh-section cjh-anchor" aria-labelledby="plan-heading">
          <div className="cjh-section-head">
            <h2 id="plan-heading" className="cjh-section-title cjh-section-title--lg">
              Four-week study plan
            </h2>
            <p className="cjh-section-desc">
              A recommended order over the curriculum. Week progress reflects the questions you
              have studied.
            </p>
          </div>
          <StudyPlanTimeline weeks={weeks} />
        </section>

        {/* Learning-progress management: resets live here, out of the main flow */}
        <section className="cjh-manage" aria-labelledby="manage-heading">
          <div className="cjh-manage-copy">
            <h2 id="manage-heading" className="cjh-manage-title">
              Learning progress
            </h2>
            <p className="cjh-manage-desc">
              Marks you make are saved to your AlgoGuru account as you study.
            </p>
          </div>
          {!loading && summary.studiedQuestions > 0 && (
            <button type="button" className="cjh-btn-quiet-danger" onClick={() => setResetOpen(true)}>
              Reset progress
            </button>
          )}
        </section>

        {/* G. Footer */}
        <footer className="cjh-footer">
          <p className="cjh-footer-note">
            Java backend interview preparation — study in order, revise by priority.
          </p>
          <nav className="cjh-footer-nav" aria-label="Interview tracks">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.id} to={link.to} className="cjh-footer-link">
                {link.label}
              </Link>
            ))}
          </nav>
        </footer>
      </PageContainer>

      <ResetProgressDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        onConfirm={handleResetConfirm}
        title="Reset Java interview progress?"
        description="This clears how far you are in the Core Java question bank. It deletes:"
        impactLines={[
          `Completion marks on ${summary.studiedQuestions} studied Core Java questions, saved in your AlgoGuru account`,
        ]}
        reversibility="It cannot be undone, but you can mark questions as studied again at any time. Notes, bookmarks and practice-lab progress are kept."
      />
    </div>
  );
}
