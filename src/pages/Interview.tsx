import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronLeft,
  Code2,
  Coffee,
  Layers,
  Target,
} from "lucide-react";
import JavaInterviewHub from "./interview/JavaInterviewHub";
import CppInterviewHub from "./interview/CppInterviewHub";
import PythonInterviewHub from "./interview/PythonInterviewHub";

type InterviewLanguage = "java" | "cpp" | "python";

interface LanguageOption {
  id: InterviewLanguage;
  label: string;
  subtitle: string;
  icon: JSX.Element;
  color: string;
}

interface LearningPathOption {
  id: "data-structure" | "core-java-qa" | "language-questions" | "system-design" | "sql-structure";
  title: string;
  subtitle: string;
  icon: JSX.Element;
  color: string;
  route: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: "java",
    label: "Java",
    subtitle: "Strong OOP and backend interview focus",
    icon: <Coffee size={24} />,
    color: "hsl(var(--primary))",
  },
  {
    id: "cpp",
    label: "C++",
    subtitle: "Performance-first problem solving",
    icon: <Code2 size={24} />,
    color: "hsl(var(--accent))",
  },
  {
    id: "python",
    label: "Python",
    subtitle: "Fast prototyping and concise coding",
    icon: <BrainCircuit size={24} />,
    color: "hsl(var(--info))",
  },
];

const getLearningPathOptions = (language: InterviewLanguage): LearningPathOption[] => {
  if (language === "java") {
    return [
      {
        id: "data-structure",
        title: "Data Structure",
        subtitle: "Master core DSA patterns used in rounds",
        icon: <Target size={24} />,
        color: "hsl(var(--accent))",
        route: "data-structure",
      },
      {
        id: "core-java-qa",
        title: "Core Java Q&A",
        subtitle: "Most asked Java interview theory and scenarios",
        icon: <Coffee size={24} />,
        color: "hsl(var(--primary))",
        route: "core-java-qa",
      },
      {
        id: "system-design",
        title: "System Design",
        subtitle: "Design thinking for scalable systems",
        icon: <Layers size={24} />,
        color: "hsl(var(--destructive))",
        route: "system-design",
      },
      {
        id: "sql-structure",
        title: "SQL Questions",
        subtitle: "Interview-focused SQL concepts and patterns",
        icon: <Code2 size={24} />,
        color: "hsl(var(--primary))",
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
      color: "hsl(var(--accent))",
      route: "data-structure",
    },
    {
      id: "language-questions",
      title: isCpp ? "C++ Questions" : "Python Questions",
      subtitle: isCpp
        ? "Most asked C++ interview theory and scenarios"
        : "Most asked Python interview theory and scenarios",
      icon: isCpp ? <Code2 size={24} /> : <BrainCircuit size={24} />,
      color: isCpp ? "hsl(var(--accent))" : "hsl(var(--info))",
      route: "language-questions",
    },
    {
      id: "system-design",
      title: "System Design",
      subtitle: "Design thinking for scalable systems",
      icon: <Layers size={24} />,
      color: "hsl(var(--destructive))",
      route: "system-design",
    },
    {
      id: "sql-structure",
      title: "SQL Questions",
      subtitle: "Interview-focused SQL concepts and patterns",
      icon: <Code2 size={24} />,
      color: "hsl(var(--primary))",
      route: "sql-structure",
    },
  ];
};

const isInterviewLanguage = (value: string | undefined): value is InterviewLanguage =>
  value === "java" || value === "cpp" || value === "python";

export default function Interview() {
  const navigate = useNavigate();
  const { language } = useParams<{ language?: string }>();
  const selectedLanguage = isInterviewLanguage(language) ? language : null;
  const selectedLanguageOption = LANGUAGE_OPTIONS.find((option) => option.id === selectedLanguage);
  const learningPathOptions = selectedLanguage ? getLearningPathOptions(selectedLanguage) : [];

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
    <div className="bg-background text-foreground selection:bg-primary/25">

      <section className="relative border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.10),transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
              <Target size={13} className="text-primary" /> Comprehensive interview preparation
            </div>

            <h1 className="max-w-3xl text-4xl font-bold leading-[1.04] tracking-[-0.045em] md:text-6xl">
              Interview <span className="text-primary">roadmap</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Start by selecting your preferred programming language. Then pick a focused learning path to jump into the interview track you need.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-20 lg:px-16 space-y-10">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${!selectedLanguage ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" /> 1. Select language
          </span>
          <ArrowRight size={14} className="text-muted-foreground/40" />
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${selectedLanguage ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" /> 2. Choose learning path
          </span>
        </div>

        {!selectedLanguage ? (
          <div className="grid gap-4 md:grid-cols-3">
            {LANGUAGE_OPTIONS.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/interview/${option.id}`)}
                className="group relative flex min-h-[260px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/35 hover:shadow-lg hover:shadow-black/5"
              >
                <div className="flex h-full flex-col">
                  <div className="mb-7 flex items-center justify-between">
                    <div
                      className="rounded-xl border p-3"
                      style={{ background: `${option.color}10`, borderColor: `${option.color}25`, color: option.color }}
                    >
                      {option.icon}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Step 1
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">
                      {option.label}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {option.subtitle}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
                    <span className="text-xs text-muted-foreground">{option.label}</span>
                    <ArrowRight size={16} className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={() => navigate("/interview")}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft size={15} />
                Change language
              </button>
              <div className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-2 text-sm font-medium text-primary">
                <Check size={14} />
                Selected: {selectedLanguageOption?.label}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {learningPathOptions.map((path, index) => (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  onClick={() => navigate(`/interview/${selectedLanguage}/${path.route}`)}
                  className="group relative flex min-h-[240px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/35 hover:shadow-lg hover:shadow-black/5"
                >
                  <div className="flex h-full flex-col">
                    <div className="mb-7 flex items-center justify-between">
                      <div
                        className="rounded-xl border p-3"
                        style={{ background: `${path.color}10`, borderColor: `${path.color}25`, color: path.color }}
                      >
                        {path.icon}
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Step 2
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">
                        {path.title}
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {path.subtitle}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
                      <span className="text-xs text-muted-foreground">
                        {selectedLanguageOption?.label}
                      </span>
                      <ArrowRight size={16} className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
