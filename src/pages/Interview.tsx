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
  Rocket,
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
  color: string;
  route: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: "java",
    label: "Java",
    subtitle: "Strong OOP and backend interview focus",
    icon: <Coffee size={24} />,
    color: "#2563EB",
  },
  {
    id: "cpp",
    label: "C++",
    subtitle: "Performance-first problem solving",
    icon: <Code2 size={24} />,
    color: "#60A5FA",
  },
  {
    id: "python",
    label: "Python",
    subtitle: "Fast prototyping and concise coding",
    icon: <BrainCircuit size={24} />,
    color: "#93C5FD",
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
        color: "#60A5FA",
        route: "data-structure",
      },
      {
        id: "core-java-qa",
        title: "Core Java Q&A",
        subtitle: "Most asked Java interview theory and scenarios",
        icon: <Coffee size={24} />,
        color: "#2563EB",
        route: "core-java-qa",
      },
      {
        id: "spring-boot",
        title: "Spring Boot & Backend",
        subtitle: "Annotations, collections, concurrency, security & JWT",
        icon: <Rocket size={24} />,
        color: "#93C5FD",
        route: "spring-boot",
      },
      {
        id: "system-design",
        title: "System Design",
        subtitle: "Design thinking for scalable systems",
        icon: <Layers size={24} />,
        color: "#9BE2C3",
        route: "system-design",
      },
      {
        id: "sql-structure",
        title: "SQL Questions",
        subtitle: "Interview-focused SQL concepts and patterns",
        icon: <Code2 size={24} />,
        color: "#F472B6",
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
      color: "#60A5FA",
      route: "data-structure",
    },
    {
      id: "language-questions",
      title: isCpp ? "C++ Questions" : "Python Questions",
      subtitle: isCpp
        ? "Most asked C++ interview theory and scenarios"
        : "Most asked Python interview theory and scenarios",
      icon: isCpp ? <Code2 size={24} /> : <BrainCircuit size={24} />,
      color: isCpp ? "#60A5FA" : "#93C5FD",
      route: "language-questions",
    },
    {
      id: "system-design",
      title: "System Design",
      subtitle: "Design thinking for scalable systems",
      icon: <Layers size={24} />,
      color: "#9BE2C3",
      route: "system-design",
    },
    {
      id: "sql-structure",
      title: "SQL Questions",
      subtitle: "Interview-focused SQL concepts and patterns",
      icon: <Code2 size={24} />,
      color: "#F472B6",
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

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_-10%,hsl(var(--primary)/0.16),transparent_38%),radial-gradient(circle_at_8%_20%,hsl(var(--accent)/0.10),transparent_30%),radial-gradient(circle_at_50%_110%,hsl(var(--primary)/0.06),transparent_40%)]" />
          <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(hsl(var(--foreground)/0.06)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
              <Target size={13} className="text-primary" /> Comprehensive interview preparation
            </div>

            <h1 className="max-w-3xl font-display text-[2.75rem] font-bold leading-[1.04] tracking-[-0.045em] sm:text-5xl md:text-6xl">
              Interview{" "}
              <span className="bg-gradient-to-r from-primary via-[#60A5FA] to-accent bg-clip-text text-transparent">roadmap</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
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
                className="group relative flex min-h-[280px] cursor-pointer flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-card transition-all duration-300 ease-premium hover:border-transparent hover:shadow-overlay"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: "radial-gradient(130% 100% at 50% 0%, " + option.color + "16, transparent 55%)" }}
                />
                <div
                  className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 ease-premium group-hover:scale-x-100"
                  style={{ background: "linear-gradient(90deg, " + option.color + ", transparent)" }}
                />
                <div className="relative flex h-full flex-col">
                  <div className="mb-7 flex items-center justify-between">
                    <div
                      className="rounded-2xl border p-3.5 shadow-soft transition-transform duration-300 ease-premium group-hover:-rotate-3 group-hover:scale-110"
                      style={{ background: option.color + "12", borderColor: option.color + "26", color: option.color }}
                    >
                      {option.icon}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Step 1
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Language</p>
                    <h3 className="font-display text-[1.55rem] font-bold leading-tight tracking-[-0.02em] group-hover:text-primary transition-colors">
                      {option.label}
                    </h3>
                    <p className="mt-3 text-[14.5px] leading-7 text-muted-foreground">
                      {option.subtitle}
                    </p>
                  </div>
                  <div className="mt-7 flex items-center justify-between border-t border-border/70 pt-5">
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: option.color }} />
                      Start here
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                      <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
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
                  className="group relative flex min-h-[260px] cursor-pointer flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-card transition-all duration-300 ease-premium hover:border-transparent hover:shadow-overlay"
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: "radial-gradient(130% 100% at 50% 0%, " + path.color + "16, transparent 55%)" }}
                  />
                  <div
                    className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 ease-premium group-hover:scale-x-100"
                    style={{ background: "linear-gradient(90deg, " + path.color + ", transparent)" }}
                  />
                  <div className="relative flex h-full flex-col">
                    <div className="mb-7 flex items-center justify-between">
                      <div
                        className="rounded-2xl border p-3.5 shadow-soft transition-transform duration-300 ease-premium group-hover:-rotate-3 group-hover:scale-110"
                        style={{ background: path.color + "12", borderColor: path.color + "26", color: path.color }}
                      >
                        {path.icon}
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Step 2
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Learning path</p>
                      <h3 className="font-display text-[1.55rem] font-bold leading-tight tracking-[-0.02em] group-hover:text-primary transition-colors">
                        {path.title}
                      </h3>
                      <p className="mt-3 text-[14.5px] leading-7 text-muted-foreground">
                        {path.subtitle}
                      </p>
                    </div>
                    <div className="mt-7 flex items-center justify-between border-t border-border/70 pt-5">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: path.color }} />
                        {selectedLanguageOption?.label}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
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
