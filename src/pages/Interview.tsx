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
    subtitle: "Strong OOP + backend interview focus",
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

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black animate-in fade-in duration-700">
      
      {/* Header Section */}
      <section className="px-4 md:px-10 lg:px-16 py-12 md:py-20 max-w-7xl mx-auto relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center md:text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-[10px] font-bold uppercase tracking-widest mb-6">
              <Target size={12} className="text-primary" />
              <span className="text-muted-foreground">Comprehensive Interview Preparation</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-black uppercase tracking-tighter mb-6">
              Interview <span className="text-primary">Roadmap</span>
            </h1>
            
            <p className="text-base md:text-lg font-medium text-muted-foreground max-w-2xl leading-relaxed mx-auto md:mx-0">
              Start by selecting your preferred programming language. Then, pick a focused learning path to jump into the interview track you need.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 md:px-12 lg:px-20 pb-18 lg:pb-24 max-w-7xl mx-auto w-full space-y-9 lg:space-y-12">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
          <div
            className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
              selectedLanguage ? "bg-muted/50 text-muted-foreground" : "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
            }`}
          >
            1. Select Language
          </div>
          <ArrowRight size={14} className="text-muted-foreground/40" />
          <div
            className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
              selectedLanguage ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/50 text-muted-foreground"
            }`}
          >
            2. Choose Learning Path
          </div>
        </div>

        {!selectedLanguage ? (
          <div className="grid gap-6 md:grid-cols-3">
            {LANGUAGE_OPTIONS.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                onClick={() => navigate(`/interview/${option.id}`)}
                className="group relative bg-card border rounded-[32px] p-8 cursor-pointer overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5"
              >
                <div 
                  className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity"
                  style={{ background: option.color }}
                />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div 
                      className="p-3.5 rounded-2xl border transition-colors"
                      style={{ background: `${option.color}10`, borderColor: `${option.color}20`, color: option.color }}
                    >
                      {option.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-muted border text-muted-foreground">
                      Step 1
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-3 group-hover:text-primary transition-colors">
                      {option.label}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-8">
                      {option.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {option.label}
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                      Select <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <button
                onClick={() => navigate("/interview")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-card text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft size={16} />
                Change Language
              </button>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-primary/10 border-primary/20 text-[11px] font-bold uppercase tracking-widest text-primary">
                <Check size={14} />
                Selected: {selectedLanguageOption?.label}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {learningPathOptions.map((path, index) => (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/interview/${selectedLanguage}/${path.route}`)}
                  className="group relative bg-card border rounded-[32px] p-8 cursor-pointer overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5"
                >
                  <div 
                    className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity"
                    style={{ background: path.color }}
                  />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                      <div 
                        className="p-3.5 rounded-2xl border transition-colors"
                        style={{ background: `${path.color}10`, borderColor: `${path.color}20`, color: path.color }}
                      >
                        {path.icon}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-muted border text-muted-foreground">
                        Step 2
                      </span>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-2xl font-black uppercase tracking-tight mb-3 group-hover:text-primary transition-colors">
                        {path.title}
                      </h3>
                      <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-8">
                        {path.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-border/50">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {selectedLanguageOption?.label}
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                        Enter <ArrowRight size={14} />
                      </div>
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
