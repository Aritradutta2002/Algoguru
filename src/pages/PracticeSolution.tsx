import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Timer,
  Copy,
  Check,
  BookOpen,
  Zap,
  Trophy,
  Github,
  Star,
  Code2,
  Hash,
  Layers,
  Lightbulb,
  Target,
  Cpu,
  Database,
  Gauge,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/CodeBlock";
import { getPracticeSolutionDetail } from "@/lib/practiceSolutionUtils";
import { getSolutionByProblemId } from "@/data/practiceSolutions";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function difficultyClasses(difficulty: string): string {
  switch (difficulty) {
    case "Easy":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "Medium":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "Hard":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
    default:
      return "";
  }
}

function difficultyDot(difficulty: string) {
  const color =
    difficulty === "Easy"
      ? "bg-emerald-500"
      : difficulty === "Medium"
        ? "bg-amber-500"
        : "bg-rose-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

const LANGUAGES = [
  { id: "java", label: "Java", icon: "☕", accent: "from-orange-500 to-red-500" },
  { id: "cpp", label: "C++", icon: "⚡", accent: "from-blue-500 to-indigo-500" },
  { id: "python", label: "Python", icon: "🐍", accent: "from-yellow-400 to-emerald-500" },
] as const;

type LangId = (typeof LANGUAGES)[number]["id"];

function getTagIcon(tag: string): string {
  const icons: Record<string, string> = {
    Array: "📊",
    "Hash Table": "🔑",
    String: "📝",
    "Two Pointers": "↔️",
    "Sliding Window": "🪟",
    Sorting: "🔄",
    Stack: "📚",
    "Monotonic Stack": "📈",
    "Linked List": "🔗",
    "Dynamic Programming": "🎯",
    Greedy: "⚡",
    "Binary Search": "🔍",
    Tree: "🌳",
    Graph: "🕸️",
    Heap: "🏔️",
    Design: "🎨",
    Matrix: "⬜",
    "Bit Manipulation": "🔢",
  };
  return icons[tag] || "📌";
}

/* ------------------------------------------------------------------ */
/* Decorative background                                              */
/* ------------------------------------------------------------------ */

const FloatingShapes = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div
      className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-[120px] animate-pulse"
      style={{ animationDelay: "0s" }}
    />
    <div
      className="absolute top-1/3 -right-24 w-[32rem] h-[32rem] rounded-full bg-primary/5 blur-[140px] animate-pulse"
      style={{ animationDelay: "2s" }}
    />
    <div
      className="absolute bottom-0 left-1/4 w-[24rem] h-[24rem] rounded-full bg-primary/5 blur-[120px] animate-pulse"
      style={{ animationDelay: "4s" }}
    />
    <div
      className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
      style={{
        backgroundImage:
          "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  </div>
);

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function PracticeSolution() {
  const { problemId } = useParams<{ problemId: string }>();
  const pageRootRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<LangId>("java");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const scrollHost = pageRootRef.current?.closest("main");
    if (scrollHost) {
      scrollHost.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [problemId]);

  if (!problemId) return <Navigate to="/practice" replace />;

  const detail = getPracticeSolutionDetail(problemId);
  const curatedSolution = getSolutionByProblemId(problemId);

  if (!detail) return <Navigate to="/practice" replace />;

  const solution = curatedSolution || {
    problemId: detail.problem.id,
    title: detail.problem.title,
    description: detail.description,
    approach: detail.approach,
    timeComplexity: detail.complexity.worst,
    spaceComplexity: detail.complexity.space,
    difficulty: detail.problem.difficulty,
    solutions: {
      java: detail.javaCode,
      cpp: detail.cppCode,
      python: detail.pythonCode,
    },
    leetcodeLink: detail.problem.leetcodeLink,
    gfgLink: detail.problem.gfgLink,
    companies: detail.problem.companies,
    tags: [] as string[],
  };

  const handleCopy = async (code: string, lang: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(lang);
    setTimeout(() => setCopied(null), 2000);
  };

  const getCodeForTab = (tab: string) =>
    tab === "cpp"
      ? solution.solutions.cpp
      : tab === "python"
        ? solution.solutions.python
        : solution.solutions.java;

  const activeLang = LANGUAGES.find((l) => l.id === activeTab)!;

  return (
    <div
      ref={pageRootRef}
      className="relative min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground"
    >
      <FloatingShapes />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-8 md:py-12 space-y-10">
        {/* ---------------------------------------------------------- */}
        {/* Hero                                                       */}
        {/* ---------------------------------------------------------- */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight size={12} className="opacity-40" />
            <Link to="/practice" className="hover:text-primary transition-colors">
              Practice
            </Link>
            <ChevronRight size={12} className="opacity-40" />
            <span className="text-primary">Solution</span>
          </nav>

          {/* Title block */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-[10px] font-bold uppercase tracking-widest text-primary">
                <BookOpen size={12} />
                Problem Breakdown
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05] bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                {solution.title}
              </h1>

              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {solution.description}
              </p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge
                  variant="outline"
                  className={`gap-1.5 px-3 py-1 text-[11px] font-bold uppercase ${difficultyClasses(solution.difficulty)}`}
                >
                  {difficultyDot(solution.difficulty)}
                  {solution.difficulty}
                </Badge>
                <Badge
                  variant="outline"
                  className="gap-1.5 px-3 py-1 text-[11px] font-bold uppercase border-border/70 bg-card/60 backdrop-blur-sm"
                >
                  <Timer size={11} /> {solution.timeComplexity}
                </Badge>
                <Badge
                  variant="outline"
                  className="gap-1.5 px-3 py-1 text-[11px] font-bold uppercase border-border/70 bg-card/60 backdrop-blur-sm"
                >
                  <Database size={11} /> {solution.spaceComplexity}
                </Badge>
                {!curatedSolution && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1 text-[11px] font-bold uppercase border-orange-400/40 bg-orange-400/10 text-orange-600 dark:text-orange-300"
                  >
                    Auto-generated
                  </Badge>
                )}
              </div>

              {/* Companies */}
              {solution.companies.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Trophy size={13} className="text-primary" />
                  <span>Asked at</span>
                  <div className="flex flex-wrap gap-1.5">
                    {solution.companies.map((company) => (
                      <span
                        key={company}
                        className="px-2.5 py-0.5 rounded-md border border-border/50 bg-muted/40 text-[10px] font-semibold"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end lg:w-auto">
              <Link
                to="/practice"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:border-border"
              >
                <ArrowLeft size={14} />
                Back
              </Link>
              <a
                href={solution.leetcodeLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:border-border group"
              >
                <Github size={14} className="transition-transform group-hover:scale-110" />
                LeetCode
              </a>
              <a
                href={solution.gfgLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:border-border group"
              >
                <ExternalLink size={13} className="transition-transform group-hover:scale-110" />
                GeeksforGeeks
              </a>
            </div>
          </div>
        </motion.header>

        {/* ---------------------------------------------------------- */}
        {/* Complexity cards                                          */}
        {/* ---------------------------------------------------------- */}
        <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <ComplexityCard
            icon={<Timer size={18} />}
            label="Time"
            value={solution.timeComplexity}
            tone="blue"
            delay={0}
          />
          <ComplexityCard
            icon={<Database size={18} />}
            label="Space"
            value={solution.spaceComplexity}
            tone="green"
            delay={0.08}
          />
          <ComplexityCard
            icon={<Gauge size={18} />}
            label="Difficulty"
            value={solution.difficulty}
            tone={solution.difficulty === "Easy" ? "green" : solution.difficulty === "Medium" ? "amber" : "red"}
            delay={0.16}
          />
          <ComplexityCard
            icon={<Star size={18} />}
            label="Optimal"
            value="Yes"
            tone="purple"
            delay={0.24}
          />
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Approach + Insights                                       */}
        {/* ---------------------------------------------------------- */}
        <section className="grid gap-6 lg:grid-cols-5">
          {/* Approach */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="relative h-full rounded-2xl border bg-gradient-to-br from-card to-card/60 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-primary/40 to-transparent" />
              <CardHeader className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles size={22} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black uppercase tracking-wide">
                      Approach
                    </CardTitle>
                    <CardDescription className="text-xs font-medium">
                      Step-by-step strategy
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <ol className="relative space-y-5 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-border/60">
                  {solution.approach.map((step, index) => (
                    <motion.li
                      key={`${solution.problemId}-step-${index}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.08, duration: 0.35 }}
                      className="relative flex gap-4"
                    >
                      <div className="z-10 flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 border-primary/40 flex items-center justify-center text-primary font-bold text-xs">
                        {index + 1}
                      </div>
                      <p className="pt-1 text-sm leading-relaxed text-foreground/90">{step}</p>
                    </motion.li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </motion.div>

          {/* Insights */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="lg:col-span-3"
          >
            <Card className="relative h-full rounded-2xl border bg-gradient-to-br from-card to-card/60 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-500/40 to-transparent" />
              <CardHeader className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Lightbulb size={22} className="text-emerald-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black uppercase tracking-wide">
                      Key Insights
                    </CardTitle>
                    <CardDescription className="text-xs font-medium">
                      Critical observations
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InsightCard
                    icon={<Target size={16} />}
                    title="Pattern"
                    desc="Identify the core algorithmic pattern (two pointers, sliding window, DP, etc.)"
                  />
                  <InsightCard
                    icon={<Zap size={16} />}
                    title="Complexity"
                    desc={`Achieves ${solution.timeComplexity} time and ${solution.spaceComplexity} space`}
                  />
                  <InsightCard
                    icon={<Layers size={16} />}
                    title="Edge Cases"
                    desc="Handle empty inputs, single elements, duplicates, and boundary conditions"
                  />
                  <InsightCard
                    icon={<Cpu size={16} />}
                    title="Optimization"
                    desc="In-place modifications where possible to reduce extra space usage"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Code solutions                                            */}
        {/* ---------------------------------------------------------- */}
        <section className="grid gap-6 lg:grid-cols-5">
          {/* Language sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="rounded-2xl border bg-gradient-to-b from-card to-card/60 backdrop-blur-sm lg:sticky lg:top-24">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-black uppercase tracking-wide flex items-center gap-2">
                  <Code2 size={18} className="text-primary" />
                  Languages
                </CardTitle>
                <CardDescription className="text-xs">Pick a solution</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-2">
                {LANGUAGES.map((lang) => {
                  const isActive = activeTab === lang.id;
                  return (
                    <button
                      key={lang.id}
                      onClick={() => setActiveTab(lang.id)}
                      className={`w-full text-left p-3.5 rounded-xl transition-all duration-300 flex items-center gap-3 border ${
                        isActive
                          ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/10"
                          : "bg-muted/20 border-border/40 hover:bg-muted/40 hover:border-border"
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-lg bg-gradient-to-br ${lang.accent} flex items-center justify-center text-lg shadow-sm`}
                      >
                        {lang.icon}
                      </span>
                      <span className="font-bold uppercase tracking-wider text-sm">
                        {lang.label}
                      </span>
                      {isActive && (
                        <motion.span
                          layoutId="lang-dot"
                          className="ml-auto w-2 h-2 rounded-full bg-primary"
                        />
                      )}
                    </button>
                  );
                })}

                <div className="mt-5 pt-5 border-t border-border/40 space-y-2">
                  <button
                    onClick={() => handleCopy(getCodeForTab(activeTab), activeTab)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                  >
                    {copied === activeTab ? (
                      <>
                        <Check size={14} className="text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy Code
                      </>
                    )}
                  </button>
                  <a
                    href={solution.leetcodeLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 bg-muted/20 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                  >
                    <ExternalLink size={14} />
                    View on LeetCode
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Code display */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="lg:col-span-4"
          >
            <Card className="rounded-2xl border bg-gradient-to-br from-card to-card/60 backdrop-blur-sm overflow-hidden">
              {/* Editor header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/70" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/70" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
                  </div>
                  <span className="font-mono text-xs font-medium text-muted-foreground">
                    {solution.title} · {activeLang.label}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(getCodeForTab(activeTab), activeTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    copied === activeTab
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {copied === activeTab ? (
                    <>
                      <Check size={12} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Code body */}
              <div className="p-5 min-h-[420px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CodeBlock title="" language={activeTab} code={getCodeForTab(activeTab)} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Tags / Related                                            */}
        {/* ---------------------------------------------------------- */}
        {solution.tags.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            <Card className="rounded-2xl border bg-gradient-to-br from-card to-card/60 backdrop-blur-sm">
              <CardHeader className="p-6 pb-3">
                <CardTitle className="text-lg font-black uppercase tracking-wide flex items-center gap-2">
                  <Hash size={18} className="text-primary" />
                  Related Topics
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  Practice similar problems to master this pattern
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {solution.tags.slice(0, 6).map((tag) => (
                    <Link
                      key={tag}
                      to={`/practice?tag=${tag.toLowerCase().replace(/\s+/g, "-")}`}
                      className="group p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-all flex items-center gap-3"
                    >
                      <span className="text-xl">{getTagIcon(tag)}</span>
                      <div className="flex-1">
                        <div className="font-bold text-sm uppercase tracking-wide text-primary">
                          {tag}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Explore {tag} problems
                        </div>
                      </div>
                      <ArrowRight
                        size={14}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                      />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ComplexityCard({
  icon,
  label,
  value,
  tone,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "blue" | "green" | "amber" | "red" | "purple";
  delay: number;
}) {
  const tones: Record<string, string> = {
    blue: "from-blue-500/15 to-blue-500/5 text-blue-500 border-blue-500/20",
    green: "from-emerald-500/15 to-emerald-500/5 text-emerald-500 border-emerald-500/20",
    amber: "from-amber-500/15 to-amber-500/5 text-amber-500 border-amber-500/20",
    red: "from-rose-500/15 to-rose-500/5 text-rose-500 border-rose-500/20",
    purple: "from-purple-500/15 to-purple-500/5 text-purple-500 border-purple-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="relative h-full rounded-2xl border bg-card/70 backdrop-blur-sm overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        <div className={`absolute inset-0 bg-gradient-to-br ${tones[tone]} opacity-60`} />
        <div className="relative p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-background/60 border ${tones[tone]}`}>
              {icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {label}
            </span>
          </div>
          <div className="text-xl md:text-2xl font-extrabold font-mono">{value}</div>
        </div>
      </Card>
    </motion.div>
  );
}

function InsightCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-muted/20 border border-border/40 hover:border-primary/20 hover:bg-muted/40 transition-all">
      <div className="flex items-center gap-2 mb-2 text-primary">
        {icon}
        <h4 className="font-bold text-xs uppercase tracking-wide">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
