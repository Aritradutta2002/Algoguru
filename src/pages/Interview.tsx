import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronLeft,
  Code2,
  Coffee,
  Layers,
  Rocket,
  Target,
} from "lucide-react";
import {
  PageShell,
  PageHeader,
  Section,
  SectionHeading,
  Surface,
  Pill,
} from "@/components/layout/PagePrimitives";
import { Button } from "@/components/ui/button";
import JavaInterviewHub from "./interview/JavaInterviewHub";
import CppInterviewHub from "./interview/CppInterviewHub";
import PythonInterviewHub from "./interview/PythonInterviewHub";

type InterviewLanguage = "java" | "cpp" | "python";

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
    icon: <Coffee size={24} />,
  },
  {
    id: "cpp",
    label: "C++",
    subtitle: "Performance-first problem solving",
    icon: <Code2 size={24} />,
  },
  {
    id: "python",
    label: "Python",
    subtitle: "Fast prototyping and concise coding",
    icon: <BrainCircuit size={24} />,
  },
];

const getLearningPathOptions = (
  language: InterviewLanguage,
): LearningPathOption[] => {
  if (language === "java") {
    return [
      {
        id: "data-structure",
        title: "Data Structure",
        subtitle: "Master core DSA patterns used in rounds",
        icon: <Target size={24} />,
        route: "data-structure",
      },
      {
        id: "core-java-qa",
        title: "Core Java Q&A",
        subtitle: "Most asked Java interview theory and scenarios",
        icon: <Coffee size={24} />,
        route: "core-java-qa",
      },
      {
        id: "spring-boot",
        title: "Spring Boot & Backend",
        subtitle: "Annotations, collections, concurrency, security & JWT",
        icon: <Rocket size={24} />,
        route: "spring-boot",
      },
      {
        id: "system-design",
        title: "System Design",
        subtitle: "Design thinking for scalable systems",
        icon: <Layers size={24} />,
        route: "system-design",
      },
      {
        id: "sql-structure",
        title: "SQL Questions",
        subtitle: "Interview-focused SQL concepts and patterns",
        icon: <Code2 size={24} />,
        route: "sql-structure",
      },
    ];
  }

  const isCpp = language === "cpp";

  return [
    {
      id: "data-structure",
      title: "Data Structure",
      subtitle: "Master core DSA patterns used in rounds",
      icon: <Target size={24} />,
      route: "data-structure",
    },
    {
      id: "language-questions",
      title: isCpp ? "C++ Questions" : "Python Questions",
      subtitle: isCpp
        ? "Most asked C++ interview theory and scenarios"
        : "Most asked Python interview theory and scenarios",
      icon: isCpp ? <Code2 size={24} /> : <BrainCircuit size={24} />,
      route: "language-questions",
    },
    {
      id: "system-design",
      title: "System Design",
      subtitle: "Design thinking for scalable systems",
      icon: <Layers size={24} />,
      route: "system-design",
    },
    {
      id: "sql-structure",
      title: "SQL Questions",
      subtitle: "Interview-focused SQL concepts and patterns",
      icon: <Code2 size={24} />,
      route: "sql-structure",
    },
  ];
};

const isInterviewLanguage = (
  value: string | undefined,
): value is InterviewLanguage =>
  value === "java" || value === "cpp" || value === "python";

export default function Interview() {
  const navigate = useNavigate();
  const { language } = useParams<{ language?: string }>();
  const selectedLanguage = isInterviewLanguage(language) ? language : null;
  const selectedLanguageOption = LANGUAGE_OPTIONS.find(
    (option) => option.id === selectedLanguage,
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
    <div className="ui-app-canvas">
      <PageShell>
        <PageHeader
          variant="display"
          kicker="Interview preparation"
          title={
            <>
              Interview <span className="text-primary">roadmap</span>
            </>
          }
          description="Start by selecting your preferred programming language. Then pick a focused learning path to jump into the interview track you need."
        />

        <Section spacing="compact">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <Pill tone={selectedLanguage ? "success" : "primary"} mono>
              {selectedLanguage ? <Check size={12} /> : null} 1. Select language
            </Pill>
            <ArrowRight size={14} className="text-muted-foreground/50" />
            <Pill tone={selectedLanguage ? "primary" : "neutral"} mono>
              2. Choose learning path
            </Pill>
          </div>

          {!selectedLanguage ? (
            <div className="ui-grid ui-grid--3">
              {LANGUAGE_OPTIONS.map((option) => (
                <Surface
                  key={option.id}
                  as="div"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/interview/${option.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/interview/${option.id}`);
                    }
                  }}
                  className="group relative flex min-h-[260px] cursor-pointer flex-col overflow-hidden p-7 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground">
                      {option.icon}
                    </span>
                    <span className="ui-meta">Step 1</span>
                  </div>
                  <div className="mt-7 flex-1">
                    <p className="ui-kicker">Language</p>
                    <h3 className="ui-h3 mt-2">{option.label}</h3>
                    <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                      {option.subtitle}
                    </p>
                  </div>
                  <div className="ui-rule mt-6" />
                  <div className="mt-4 flex items-center justify-between">
                    <span className="ui-meta">Start here</span>
                    <ArrowRight
                      size={16}
                      className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  </div>
                </Surface>
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  variant="line"
                  size="sm"
                  type="button"
                  onClick={() => navigate("/interview")}
                >
                  <ChevronLeft size={15} />
                  <span className="text-xs">Change language</span>
                </Button>
                <Pill tone="primary">
                  <Check size={13} />
                  Selected: {selectedLanguageOption?.label}
                </Pill>
              </div>

              <SectionHeading
                kicker="Step 2"
                title="Choose a learning path"
                description={`Focused tracks for ${selectedLanguageOption?.label ?? "your language"}. Each path opens a dedicated question set.`}
              />

              <div className="ui-grid ui-grid--2">
                {learningPathOptions.map((path) => (
                  <Surface
                    key={path.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(`/interview/${selectedLanguage}/${path.route}`)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(
                          `/interview/${selectedLanguage}/${path.route}`,
                        );
                      }
                    }}
                    className="group relative flex min-h-[240px] cursor-pointer flex-col overflow-hidden p-7 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground">
                        {path.icon}
                      </span>
                      <span className="ui-meta">Step 2</span>
                    </div>
                    <div className="mt-7 flex-1">
                      <p className="ui-kicker">Learning path</p>
                      <h3 className="ui-h3 mt-2">{path.title}</h3>
                      <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                        {path.subtitle}
                      </p>
                    </div>
                    <div className="ui-rule mt-6" />
                    <div className="mt-4 flex items-center justify-between">
                      <span className="ui-meta">
                        {selectedLanguageOption?.label}
                      </span>
                      <ArrowRight
                        size={16}
                        className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      />
                    </div>
                  </Surface>
                ))}
              </div>
            </div>
          )}
        </Section>
      </PageShell>
    </div>
  );
}
