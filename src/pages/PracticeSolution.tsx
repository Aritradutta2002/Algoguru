import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, ExternalLink, NotebookPen, Sparkles, Timer, Copy, Check, BookOpen, Zap, Trophy, Github, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/CodeBlock";
import { getPracticeSolutionDetail } from "@/lib/practiceSolutionUtils";
import { getSolutionByProblemId, ProblemSolution } from "@/data/practiceSolutions";
import { motion, AnimatePresence } from "framer-motion";

function difficultyClasses(difficulty: string): string {
  switch (difficulty) {
    case "Easy":
      return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30";
    case "Medium":
      return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
    case "Hard":
      return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30";
    default:
      return "";
  }
}

function difficultyIcon(difficulty: string) {
  switch (difficulty) {
    case "Easy": return <span className="text-green-500">●</span>;
    case "Medium": return <span className="text-yellow-500">●</span>;
    case "Hard": return <span className="text-red-500">●</span>;
    default: return <span>●</span>;
  }
}

const FloatingShapes = () => (
  <>
    <div className="absolute top-10 left-5 w-72 h-72 bg-primary/10 blur-3xl rounded-full animate-pulse" style={{ animationDelay: "0s" }} />
    <div className="absolute top-20 right-10 w-96 h-96 bg-primary/5 blur-3xl rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
    <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-primary/5 blur-3xl rounded-full animate-pulse" style={{ animationDelay: "4s" }} />
  </>
);

export default function PracticeSolution() {
  const { problemId } = useParams<{ problemId: string }>();
  const pageRootRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<"java" | "cpp" | "python">("java");
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

  // Use curated solution if available, otherwise fall back to auto-generated
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
      python: detail.pythonCode
    },
    leetcodeLink: detail.problem.leetcodeLink,
    gfgLink: detail.problem.gfgLink,
    companies: detail.problem.companies,
    tags: []
  };

  const handleCopy = async (code: string, lang: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(lang);
    setTimeout(() => setCopied(null), 2000);
  };

  const getCodeForTab = (tab: string) => {
    switch (tab) {
      case "java": return solution.solutions.java;
      case "cpp": return solution.solutions.cpp;
      case "python": return solution.solutions.python;
      default: return solution.solutions.java;
    }
  };

  const getLanguageLabel = (tab: string) => {
    switch (tab) {
      case "java": return "Java";
      case "cpp": return "C++";
      case "python": return "Python";
      default: return "Java";
    }
  };

  const getLanguageIcon = (tab: string) => {
    switch (tab) {
      case "java": return "☕";
      case "cpp": return "⚡";
      case "python": return "🐍";
      default: return "☕";
    }
  };

  return (
    <div ref={pageRootRef} className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <FloatingShapes />
      
      {/* Hero Section */}
      <section className="px-4 md:px-10 lg:px-16 py-10 md:py-14 max-w-7xl mx-auto relative overflow-hidden z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="text-[10px]">🏠</span> Home
            </Link>
            <ChevronRight size={10} className="opacity-50" />
            <Link to="/practice" className="hover:text-primary transition-colors">Practice</Link>
            <ChevronRight size={10} className="opacity-50" />
            <span className="text-primary font-black">Solution</span>
          </div>

          {/* Category Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-gradient-to-r from-primary/10 to-primary/5 text-[10px] font-bold uppercase tracking-widest"
          >
            <BookOpen size={14} className="text-primary" />
            <span className="text-muted-foreground">Problem Breakdown</span>
          </motion.div>

          {/* Title & Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          >
            <div className="space-y-3 max-w-4xl">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                {solution.title}
              </h1>
              <p className="text-sm md:text-base font-medium text-muted-foreground leading-relaxed max-w-3xl">
                {solution.description}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap md:justify-end">
              <Link
                to="/practice"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-card/80 backdrop-blur-sm text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-foreground border-border/50"
              >
                <ArrowLeft size={14} />
                Back to Practice
              </Link>
              <a
                href={solution.leetcodeLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-card/80 backdrop-blur-sm text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-foreground border-border/50 group"
              >
                <Github size={14} className="transition-transform group-hover:scale-110" />
                LeetCode
              </a>
              <a
                href={solution.gfgLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-card/80 backdrop-blur-sm text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-foreground border-border/50 group"
              >
                <ExternalLink size={12} className="transition-transform group-hover:scale-110" />
                GeeksforGeeks
              </a>
            </div>
          </motion.div>

          {/* Meta Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <Badge 
              variant="outline" 
              className={`text-[10px] font-black uppercase border gap-1.5 flex items-center ${difficultyClasses(solution.difficulty)}`}
            >
              {difficultyIcon(solution.difficulty)}
              {solution.difficulty}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-bold uppercase border-border/70 bg-card/80 backdrop-blur-sm">
              <Zap size={10} className="mr-1" /> {solution.timeComplexity}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-bold uppercase border-border/70 bg-card/80 backdrop-blur-sm">
              <span className="mr-1">💾</span> {solution.spaceComplexity}
            </Badge>
            {!curatedSolution && (
              <Badge variant="outline" className="text-[10px] font-bold uppercase border-orange-400/40 bg-orange-400/10 text-orange-700 dark:text-orange-300">
                Auto-generated
              </Badge>
            )}
          </motion.div>

          {/* Companies */}
          {solution.companies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              <Trophy size={12} className="text-primary" />
              <span>Asked at:</span>
              {solution.companies.map((company, i) => (
                <Badge key={company} variant="secondary" className="text-[9px] font-medium h-5 px-2.5 border-border/50 bg-muted/50 hover:bg-muted transition-colors">
                  {company}
                </Badge>
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Complexity Cards */}
      <section className="px-4 md:px-10 lg:px-16 pb-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <ComplexityCard 
            icon={<Timer size={16} />} 
            label="Time Complexity" 
            value={solution.timeComplexity}
            color="blue"
            delay={0}
          />
          <ComplexityCard 
            icon={<span className="text-[14px]">💾</span>} 
            label="Space Complexity" 
            value={solution.spaceComplexity}
            color="green"
            delay={0.1}
          />
          <ComplexityCard 
            icon={<Zap size={16} />} 
            label="Difficulty" 
            value={solution.difficulty}
            color={solution.difficulty === "Easy" ? "green" : solution.difficulty === "Medium" ? "yellow" : "red"}
            delay={0.2}
          />
          <ComplexityCard 
            icon={<Star size={16} />} 
            label="Optimal Approach" 
            value="Yes"
            color="purple"
            delay={0.3}
          />
        </motion.div>
      </section>

      {/* Main Content */}
      <section className="px-4 md:px-10 lg:px-16 pb-14 md:pb-20 max-w-7xl mx-auto space-y-8">
        {/* Approach Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="lg:grid lg:grid-cols-5 lg:gap-6"
        >
          <Card className="rounded-2xl border bg-gradient-to-br from-card to-card/80 backdrop-blur-sm lg:col-span-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/20" />
            <CardHeader className="space-y-3 p-6 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles size={24} className="text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-wide">Solution Approach</CardTitle>
                  <CardDescription className="text-sm font-medium">Step-by-step strategy for the optimal solution</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pb-6">
              <ol className="space-y-4">
                {solution.approach.map((step, index) => (
                  <motion.li
                    key={`${solution.problemId}-approach-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                    className="flex gap-4 group relative"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                      {index + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-foreground/90 leading-relaxed text-base">{step}</p>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Key Insights Card */}
          <Card className="rounded-2xl border bg-gradient-to-br from-card to-card/80 backdrop-blur-sm lg:col-span-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
            <CardHeader className="space-y-3 p-6 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Zap size={24} className="text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-wide">Key Insights</CardTitle>
                  <CardDescription className="text-sm font-medium">Critical observations for solving this problem</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pb-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <InsightCard 
                  icon="🎯" 
                  title="Pattern Recognition" 
                  desc="Identify the core algorithmic pattern (two pointers, sliding window, DP, etc.)" 
                />
                <InsightCard 
                  icon="⚡" 
                  title="Optimal Complexity" 
                  desc={`Achieves ${solution.timeComplexity} time and ${solution.spaceComplexity} space`} 
                />
                <InsightCard 
                  icon="🔄" 
                  title="Edge Cases" 
                  desc="Handle empty arrays, single elements, all same values, and boundary conditions" 
                />
                <InsightCard 
                  icon="💡" 
                  title="Space Optimization" 
                  desc="In-place modifications where possible to achieve O(1) extra space" 
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Code Solutions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="lg:grid lg:grid-cols-5 lg:gap-6"
        >
          {/* Language Tabs Sidebar */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl border bg-gradient-to-b from-card to-card/80 backdrop-blur-sm sticky top-24 h-fit">
              <CardHeader className="p-6 pb-3">
                <CardTitle className="text-lg font-black uppercase tracking-wide flex items-center gap-2">
                  <span className="text-[16px]">💻</span>
                  Solutions
                </CardTitle>
                <CardDescription className="text-xs font-medium">Switch between languages</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-2" role="tablist">
                  {(["java", "cpp", "python"] as const).map((lang) => (
                    <button
                      key={lang}
                      role="tab"
                      aria-selected={activeTab === lang}
                      onClick={() => setActiveTab(lang)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-center gap-3 group ${
                        activeTab === lang
                          ? "bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/10"
                          : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border"
                      }`}
                    >
                      <span className="text-2xl">{getLanguageIcon(lang)}</span>
                      <span className="font-bold uppercase tracking-wider text-sm">{getLanguageLabel(lang)}</span>
                      {activeTab === lang && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto w-2 h-2 rounded-full bg-primary"
                        />
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-border/50 space-y-2">
                  <button
                    onClick={() => handleCopy(getCodeForTab(activeTab), activeTab)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                  >
                    {copied === activeTab ? (
                      <>
                        <Check size={16} className="text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy Code
                      </>
                    )}
                  </button>
                  <a
                    href={solution.leetcodeLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 bg-muted/30 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                  >
                    <ExternalLink size={16} />
                    View on LeetCode
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Code Display Area */}
          <div className="lg:col-span-4">
            <Card className="rounded-2xl border bg-gradient-to-br from-card to-card/80 backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 via-transparent to-transparent px-6 py-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                      <div className="w-3 h-3 rounded-full bg-green-500/70" />
                    </div>
                    <span className="font-mono text-sm font-medium text-muted-foreground">{solution.title} - {getLanguageLabel(activeTab)}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(getCodeForTab(activeTab), activeTab)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      copied === activeTab
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {copied === activeTab ? (
                      <>
                        <Check size={12} className="text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="p-6 min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <CodeBlock 
                      title="" 
                      language={activeTab} 
                      code={getCodeForTab(activeTab)} 
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Related Problems */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <Card className="rounded-2xl border bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-xl font-black uppercase tracking-wide flex items-center gap-2">
                <BookOpen size={24} className="text-primary" />
                Related Problems
              </CardTitle>
              <CardDescription className="text-sm font-medium">Practice similar problems to master this pattern</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {solution.tags.slice(0, 6).map((tag, i) => (
                  <Link
                    key={tag}
                    to={`/practice?tag=${tag.toLowerCase().replace(/\s+/g, '-')}`}
                    className="p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{getTagIcon(tag)}</span>
                      <span className="font-bold text-sm uppercase tracking-wide text-primary">{tag}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Explore {tag} problems</p>
                    <ArrowLeft size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}

// Helper Components
function ComplexityCard({ icon, label, value, color, delay }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: string; 
  delay: number;
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    green: "bg-green-500/10 text-green-500 border-green-500/20",
    yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/20",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + delay, duration: 0.4 }}
    >
      <Card className="rounded-2xl border bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full">
        <CardHeader className="pb-2">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} w-fit`}>
            {icon}
            <CardDescription className="text-[10px] font-black uppercase tracking-widest">{label}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-2xl md:text-3xl font-extrabold font-mono">
          {value}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InsightCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/20 hover:bg-muted/50 transition-all">
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="font-bold text-sm uppercase tracking-wide mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function getTagIcon(tag: string): string {
  const icons: Record<string, string> = {
    "Array": "📊",
    "Hash Table": "🔑",
    "String": "📝",
    "Two Pointers": "↔️",
    "Sliding Window": "🪟",
    "Sorting": "🔄",
    "Stack": "📚",
    "Monotonic Stack": "📈",
    "Linked List": "🔗",
    "Dynamic Programming": "🎯",
    "Greedy": "⚡",
    "Binary Search": "🔍",
    "Tree": "🌳",
    "Graph": "🕸️",
    "Heap": "🏔️",
    "Design": "🎨",
    "Matrix": "⬜",
    "Bit Manipulation": "🔢",
  };
  return icons[tag] || "📌";
}
