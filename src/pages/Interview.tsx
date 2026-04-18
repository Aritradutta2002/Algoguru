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

type InterviewLanguage = "java" | "cpp" | "python";

interface LanguageOption {
  id: InterviewLanguage;
  label: string;
  subtitle: string;
  icon: JSX.Element;
  bg: string;
  textColor: string;
}

interface LearningPathOption {
  id: "data-structure" | "core-java-qa" | "system-design" | "sql-structure";
  title: string;
  subtitle: string;
  icon: JSX.Element;
  bg: string;
  textColor: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: "java",
    label: "Java",
    subtitle: "Strong OOP + backend interview focus",
    icon: <Coffee size={30} />,
    bg: "bg-[#A3E635]",
    textColor: "text-black",
  },
  {
    id: "cpp",
    label: "C++",
    subtitle: "Performance-first problem solving",
    icon: <Code2 size={30} />,
    bg: "bg-[#FFD500]",
    textColor: "text-black",
  },
  {
    id: "python",
    label: "Python",
    subtitle: "Fast prototyping and concise coding",
    icon: <BrainCircuit size={30} />,
    bg: "bg-[#00D4FF]",
    textColor: "text-black",
  },
];

const LEARNING_PATH_OPTIONS: LearningPathOption[] = [
  {
    id: "data-structure",
    title: "Data Structure for Interview",
    subtitle: "Master core DSA patterns used in rounds",
    icon: <Target size={28} />,
    bg: "bg-[#FFD500]",
    textColor: "text-black",
  },
  {
    id: "core-java-qa",
    title: "CORE JAVA Questions & Answers",
    subtitle: "Most asked Java interview theory and scenarios",
    icon: <Coffee size={28} />,
    bg: "bg-[#A3E635]",
    textColor: "text-black",
  },
  {
    id: "system-design",
    title: "System Design",
    subtitle: "Design thinking for scalable systems",
    icon: <Layers size={28} />,
    bg: "bg-[#FF3366]",
    textColor: "text-white",
  },
  {
    id: "sql-structure",
    title: "SQL Structure",
    subtitle: "Interview-focused SQL concepts and patterns",
    icon: <Code2 size={28} />,
    bg: "bg-[#7C3AED]",
    textColor: "text-white",
  },
];

const isInterviewLanguage = (value: string | undefined): value is InterviewLanguage =>
  value === "java" || value === "cpp" || value === "python";

export default function Interview() {
  const navigate = useNavigate();
  const { language } = useParams<{ language?: string }>();
  const selectedLanguage = isInterviewLanguage(language) ? language : null;
  const selectedLanguageOption = LANGUAGE_OPTIONS.find((option) => option.id === selectedLanguage);

  useEffect(() => {
    if (language && !selectedLanguage) {
      navigate("/interview", { replace: true });
    }
  }, [language, selectedLanguage, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground px-6 md:px-10 lg:px-16 py-10 md:py-14">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 neo-btn bg-card px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            <Target size={12} />
            Interview Preparation
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
            INTERVIEW ROADMAP
          </h1>
          <p className="text-sm font-semibold text-muted-foreground max-w-2xl leading-relaxed border-l-[3px] border-primary pl-4">
            Start by selecting your preferred programming language. In the next step, pick a
            focused learning path and jump into the interview track you need.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <div
            className={`px-3 py-1 border-2 border-border ${
              selectedLanguage ? "bg-card text-muted-foreground" : "bg-primary text-black"
            }`}
          >
            1. Select Language
          </div>
          <ArrowRight size={12} className="text-muted-foreground" />
          <div
            className={`px-3 py-1 border-2 border-border ${
              selectedLanguage ? "bg-primary text-black" : "bg-card text-muted-foreground"
            }`}
          >
            2. Choose Learning Path
          </div>
        </div>

        {!selectedLanguage ? (
          <div className="grid gap-6 md:grid-cols-3">
            {LANGUAGE_OPTIONS.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, type: "spring", stiffness: 90 }}
                whileHover={{ x: -2, y: -2, boxShadow: "5px 5px 0px 0px hsl(var(--border))" }}
                whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--border))" }}
                onClick={() => navigate(`/interview/${option.id}`)}
                className={`${option.bg} ${option.textColor} border-2 border-black dark:border-white p-5 text-left`}
                style={{ boxShadow: "3px 3px 0px 0px hsl(var(--border))" }}
              >
                <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] mb-4 px-1.5 py-0.5 bg-black/15">
                  Preferred Language
                </div>
                <div className="mb-4 p-2.5 bg-black/15 w-fit border-[1.5px] border-black/20">
                  {option.icon}
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black uppercase tracking-tight">{option.label}</h2>
                  <p className="text-xs font-bold opacity-85 leading-relaxed">{option.subtitle}</p>
                </div>
                <div className="mt-6 pt-3 border-t-[1.5px] border-black/25 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-75">
                    Step 1
                  </span>
                  <span className="text-xs font-black uppercase flex items-center gap-1">
                    Select <ArrowRight size={14} />
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                onClick={() => navigate("/interview")}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1.5 border-2 border-border bg-card hover:bg-muted/60 w-fit"
                style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}
              >
                <ChevronLeft size={14} />
                Change Language
              </button>
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-3 py-1.5 border-2 border-border bg-primary text-black w-fit">
                <Check size={13} />
                Selected: {selectedLanguageOption?.label}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {LEARNING_PATH_OPTIONS.map((path, index) => (
                <motion.button
                  key={path.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, type: "spring", stiffness: 90 }}
                  whileHover={{ x: -2, y: -2, boxShadow: "5px 5px 0px 0px hsl(var(--border))" }}
                  whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--border))" }}
                  onClick={() => navigate(`/interview/${selectedLanguage}/${path.id}`)}
                  className={`${path.bg} ${path.textColor} border-2 border-black dark:border-white p-5 text-left`}
                  style={{ boxShadow: "3px 3px 0px 0px hsl(var(--border))" }}
                >
                  <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] mb-4 px-1.5 py-0.5 bg-black/15">
                    Learning Path
                  </div>
                  <div className="mb-4 p-2.5 bg-black/15 w-fit border-[1.5px] border-black/20">
                    {path.icon}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight">
                      {path.title}
                    </h2>
                    <p className="text-xs font-bold opacity-90 leading-relaxed">{path.subtitle}</p>
                  </div>
                  <div className="mt-6 pt-3 border-t-[1.5px] border-black/25 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-75">
                      {selectedLanguageOption?.label}
                    </span>
                    <span className="text-xs font-black uppercase flex items-center gap-1">
                      Enter <ArrowRight size={14} />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
