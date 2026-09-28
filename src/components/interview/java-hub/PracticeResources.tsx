import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Dumbbell, Flame, Layers, Database, Rocket, Tag, Target } from "lucide-react";
import { ANNOTATION_COUNT } from "@/data/backendInterview/annotations";
import { BACKEND_TOTAL_QUESTIONS } from "@/lib/backendQuestionIndex";
import {
  ANNOTATIONS_PATH,
  MOST_ASKED_HREF,
  PRACTICE_PATH,
  QUESTION_BANK_PATH,
  type PreparationSummary,
} from "./javaHubData";

interface PracticeResourcesProps {
  summary: PreparationSummary;
  /** Questions marked studied on the Spring Boot track (localStorage). */
  backendStudied: number;
  /** Questions whose interview priority is "very-high". */
  mustKnow: number;
}

export function PracticeResources({ summary, backendStudied, mustKnow }: PracticeResourcesProps) {
  const rows = [
    {
      id: "question-bank",
      icon: BookOpen,
      title: "Core Java question bank",
      description: "Every curriculum question with a full answer and runnable examples.",
      meta: summary.totalQuestions > 0
        ? `${summary.studiedQuestions} of ${summary.totalQuestions} studied`
        : null,
      href: QUESTION_BANK_PATH,
      action: "Open question bank",
    },
    {
      id: "spring-boot-bank",
      icon: Rocket,
      title: "Spring Boot and backend bank",
      description: "Annotations, Boot internals, concurrency, security and JWT, in depth.",
      meta: backendStudied > 0
        ? `${backendStudied} of ${BACKEND_TOTAL_QUESTIONS} studied`
        : `${BACKEND_TOTAL_QUESTIONS} questions`,
      href: "/interview/java/spring-boot/questions",
      action: "Open Spring Boot questions",
    },
    ...(summary.practiceTotal > 0
      ? [
          {
            id: "practice-labs",
            icon: Dumbbell,
            title: "Practice problems",
            description: "Scenario-based labs you implement before reading the solution.",
            meta: `${summary.practiceSolved} of ${summary.practiceTotal} solved`,
            href: PRACTICE_PATH,
            action: "Solve the next problem",
          },
        ]
      : []),
    {
      id: "annotations",
      icon: Tag,
      title: "Annotation reference",
      description: "What each annotation does and how the framework processes it internally.",
      meta: ANNOTATION_COUNT > 0 ? `${ANNOTATION_COUNT} annotations` : null,
      href: ANNOTATIONS_PATH,
      action: "Browse annotation reference",
    },
    {
      id: "must-know",
      icon: Flame,
      title: "Must-know revision",
      description: "The very-high priority questions, filtered for a fast pre-interview run.",
      meta: mustKnow > 0 ? `${mustKnow} must-know questions` : null,
      href: MOST_ASKED_HREF,
      action: "Review must-know questions",
    },
    {
      id: "data-structure",
      icon: Target,
      title: "Data structures",
      description: "The DSA patterns and Java idioms interviewers probe in screening rounds.",
      meta: null,
      href: "/interview/java/data-structure",
      action: "Open data structures",
    },
    {
      id: "system-design",
      icon: Layers,
      title: "System design",
      description: "Load balancing, caching, data stores and the trade-offs behind each choice.",
      meta: null,
      href: "/interview/java/system-design",
      action: "Open system design",
    },
    {
      id: "sql-structure",
      icon: Database,
      title: "SQL questions",
      description: "Joins, subqueries, window functions and query tuning at interview depth.",
      meta: null,
      href: "/interview/java/sql-structure",
      action: "Open SQL questions",
    },
  ];

  return (
    <ul className="cjh-resources">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <li key={row.id} className="cjh-resource">
            <span className="cjh-resource-icon" aria-hidden="true">
              <Icon size={17} />
            </span>
            <div className="cjh-resource-body">
              <h3 className="cjh-resource-title">{row.title}</h3>
              <p className="cjh-resource-desc">{row.description}</p>
              {row.meta && <p className="cjh-resource-meta">{row.meta}</p>}
            </div>
            <Link to={row.href} className="cjh-link cjh-resource-action">
              {row.action}
              <ArrowRight size={13} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
