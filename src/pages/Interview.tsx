import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronLeft,
  Code2,
  Coffee,
  Rocket,
  Target,
} from "lucide-react";
import JavaInterviewHub from "./interview/JavaInterviewHub";
import CppInterviewHub from "./interview/CppInterviewHub";
import PythonInterviewHub from "./interview/PythonInterviewHub";
import { PageContainer, PageHeader } from "@/components/layout/PagePrimitives";

type InterviewLanguage = "java" | "cpp" | "python";

const MotionLink = motion(Link);

interface LanguageOption {
  id: InterviewLanguage;
  label: string;
  subtitle: string;
  icon: JSX.Element;
}

interface LearningPathOption {
  id:
    | "data-structure"
    | "core-java-qa"
    | "language-questions"
    | "spring-boot"
    | "system-design"
    | "sql-structure";
  title: string;
  subtitle: string;
  icon: JSX.Element;
  route: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: "java",
    label: "Java",
    subtitle: "Strong OOP and backend interview focus",
    icon: <Coffee size={22} />,
  },
  {
    id: "cpp",
    label: "C++",
    subtitle: "Performance-first problem solving",
    icon: <Code2 size={22} />,
  },
  {
    id: "python",
    label: "Python",
    subtitle: "Fast prototyping and concise coding",
    icon: <BrainCircuit size={22} />,
  },
];

const getLearningPathOptions = (language: InterviewLanguage): LearningPathOption[] => {
  if (language === "java") {
    return [
      {
        id: "data-structure",
        title: "Data Structure",
        subtitle: "Master core DSA patterns used in rounds",
        icon: <Target size={22} />,
        route: "data-structure",
      },
      {
        id: "core-java-qa",
        title: "Core Java Q&A",
        subtitle: "Most asked Java interview theory and scenarios",
        icon: <Coffee size={22} />,
        route: "core-java-qa",
      },
      {
        id: "spring-boot",
        title: "Spring Boot & Backend",
        subtitle: "Annotations, collections, concurrency, security & JWT",
        icon: <Rocket size={22} />,
        route: "spring-boot",
      },
      {
        id: "system-design",
        title: "System Design",
        subtitle: "Design thinking for scalable systems",
        icon: <BrainCircuit size={22} />,
        route: "system-design",
      },
      {
        id: "sql-structure",
        title: "SQL Questions",
        subtitle: "Interview-focused SQL concepts and patterns",
        icon: <Code2 size={22} />,
        route: "sql-structure",
      },
    ];
  }

  const commonTracks: LearningPathOption[] = [
    {
      id: "data-structure",
      title: "Data Structure",
      subtitle: "Core DSA foundations for interviews",
      icon: <Target size={22} />,
      route: "data-structure",
    },
    {
      id: "language-questions",
      title: `${language.toUpperCase()} Interview Q&A`,
      subtitle: "Language-specific concepts, tricks and trade-offs",
      icon: <Code2 size={22} />,
      route: "language-questions",
    },
    {
      id: "system-design",
      title: "System Design",
      subtitle: "High-level and low-level system design fundamentals",
      icon: <BrainCircuit size={22} />,
      route: "system-design",
    },
    {
      id: "sql-structure",
      title: "SQL Questions",
      subtitle: "Interview-focused SQL concepts and patterns",
      icon: <Code2 size={22} />,
      route: "sql-structure",
    },
  ];

  return commonTracks;
};

export default function Interview() {
  const navigate = useNavigate();
  const { language } = useParams<{ language?: string }>();

  const selectedLanguage: InterviewLanguage | null =
    language === "java" || language === "cpp" || language === "python"
      ? language
      : null;

  const selectedLanguageOption = LANGUAGE_OPTIONS.find(
    (item) => item.id === selectedLanguage,
  );

  const learningPathOptions = selectedLanguage
    ? getLearningPathOptions(selectedLanguage)
    : [];

  useEffect(() => {
    if (language && !selectedLanguage) {
      navigate("/interview", { replace: true });
    }
  }, [language, selectedLanguage, navigate]);

  if (selectedLanguage === "java") {
    return <JavaInterviewHub />;
  }
  if (selectedLanguage === "cpp") {
    return <CppInterviewHub />;
  }
  if (selectedLanguage === "python") {
    return <PythonInterviewHub />;
  }

  return (
    <div className="min-h-screen bg-obsidian-void text-foreground">
      <PageHeader
        eyebrow="Comprehensive interview preparation"
        title="Your interview roadmap"
        description="Start by selecting your preferred programming language. Then pick a focused learning path to jump into the interview track you need."
      />

      <PageContainer className="py-10 md:py-14 space-y-8">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium ${!selectedLanguage ? "border-primary/40 bg-primary/10 text-primary" : "border-obsidian-border bg-obsidian-pane text-muted-foreground"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" /> 1. Select language
          </span>
          <ArrowRight size={14} className="text-muted-foreground/40" />
          <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium ${selectedLanguage ? "border-primary/40 bg-primary/10 text-primary" : "border-obsidian-border bg-obsidian-pane text-muted-foreground"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" /> 2. Choose learning path
          </span>
        </div>

        {!selectedLanguage ? (
          <div className="grid gap-4 md:grid-cols-3">
            {LANGUAGE_OPTIONS.map((option, index) => (
              <MotionLink
                key={option.id}
                to={`/interview/${option.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
                className="group relative flex min-h-[240px] flex-col overflow-hidden rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-6 transition-colors hover:bg-obsidian-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative flex h-full flex-col">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-obsidian-border bg-obsidian-elevated text-foreground">
                      {option.icon}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Step 1
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-xs text-muted-foreground">Language</p>
                    <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary">
                      {option.label}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {option.subtitle}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-obsidian-border pt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      Start here
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-md border border-obsidian-border bg-obsidian-elevated text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </MotionLink>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/interview")}
                className="inline-flex items-center gap-2 rounded-lg border border-obsidian-border bg-obsidian-pane px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-obsidian-elevated hover:text-foreground"
              >
                <ChevronLeft size={14} />
                Change language
              </button>
              <div className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Check size={14} />
                Selected: {selectedLanguageOption?.label}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {learningPathOptions.map((path, index) => (
                <MotionLink
                  key={path.id}
                  to={`/interview/${selectedLanguage}/${path.route}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
                  className="group relative flex min-h-[220px] flex-col overflow-hidden rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-6 transition-colors hover:bg-obsidian-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative flex h-full flex-col">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-obsidian-border bg-obsidian-elevated text-foreground">
                        {path.icon}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Step 2
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="mb-1 text-xs text-muted-foreground">Learning path</p>
                      <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary">
                        {path.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {path.subtitle}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-obsidian-border pt-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        {selectedLanguageOption?.label}
                      </span>
                      <span className="flex h-7 w-7 items-center justify-center rounded-md border border-obsidian-border bg-obsidian-elevated text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </MotionLink>
              ))}
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
