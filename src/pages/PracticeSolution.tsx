import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, ExternalLink, Copy, Check, Clock3, Database, Layers, BookOpen, Tag, Sparkles } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { getPracticeSolutionDetail } from "@/lib/practiceSolutionUtils";
import { getSolutionByProblemId } from "@/data/practiceSolutions";

function difficultyBadge(diff: string) {
  if (diff === "Easy") return "bg-success/10 text-success border-success/30";
  if (diff === "Medium") return "bg-warning/10 text-warning border-warning/30";
  return "bg-destructive/10 text-destructive border-destructive/30";
}

const LANGUAGES = [
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "python", label: "Python" },
] as const;
type LangId = (typeof LANGUAGES)[number]["id"];

export default function PracticeSolution() {
  const { problemId } = useParams<{ problemId: string }>();
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<LangId>("java");
  const [copied, setCopied] = useState<LangId | null>(null);

  useEffect(() => {
    const host = pageRef.current?.closest("main");
    if (host) host.scrollTo({ top: 0, behavior: "auto" });
    else window.scrollTo({ top: 0, behavior: "auto" });
  }, [problemId]);

  if (!problemId) return <Navigate to="/practice" replace />;
  const detail = getPracticeSolutionDetail(problemId);
  const curated = getSolutionByProblemId(problemId);
  if (!detail) return <Navigate to="/practice" replace />;

  const solution = curated || {
    problemId: detail.problem.id,
    title: detail.problem.title,
    description: detail.description,
    approach: detail.approach,
    timeComplexity: detail.complexity.worst,
    spaceComplexity: detail.complexity.space,
    difficulty: detail.problem.difficulty,
    solutions: { java: detail.javaCode, cpp: detail.cppCode, python: detail.pythonCode },
    leetcodeLink: detail.problem.leetcodeLink,
    gfgLink: detail.problem.gfgLink,
    companies: detail.problem.companies,
    tags: [] as string[],
  };

  const getCode = (t: LangId) => (t === "cpp" ? solution.solutions.cpp : t === "python" ? solution.solutions.python : solution.solutions.java);
  const handleCopy = async (code: string, lang: LangId) => {
    await navigator.clipboard.writeText(code);
    setCopied(lang);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-20 backdrop-blur-md bg-background/90 border-b border-border">
        <div className="mx-auto max-w-7xl px-5 md:px-10 h-12 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight size={12} className="opacity-40 shrink-0" />
            <Link to="/practice" className="hover:text-foreground">Practice</Link>
            <ChevronRight size={12} className="opacity-40 shrink-0" />
            <span className="text-foreground truncate">Solution</span>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/practice" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted">
              <ArrowLeft size={13} /> Back
            </Link>
            <a href={solution.leetcodeLink} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:brightness-95">
              LeetCode <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-6 md:px-10 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[560px_1fr] xl:grid-cols-[580px_1fr] 2xl:grid-cols-[620px_1fr] gap-6 items-start">
          <div className="space-y-4 min-w-0">
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                  <BookOpen size={12} /> Editorial
                </div>
                <h1 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
                  {solution.title}
                </h1>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {solution.description}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${difficultyBadge(solution.difficulty)}`}>
                    {solution.difficulty}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted border border-border text-foreground">
                    <Clock3 size={12} className="text-muted-foreground" /> {solution.timeComplexity}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted border border-border text-foreground">
                    <Database size={12} className="text-muted-foreground" /> {solution.spaceComplexity}
                  </span>
                </div>

                {solution.companies.length > 0 && (
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Asked at</span>
                    {solution.companies.map((c) => (
                      <span key={c} className="px-2.5 py-1 rounded-md bg-muted border border-border text-xs font-medium text-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 md:px-8 py-3 bg-muted/40 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles size={12} className="text-primary" /> 3 languages · Copy-ready · Interview grade
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <a href={solution.leetcodeLink} target="_blank" rel="noreferrer" className="font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    LeetCode <ExternalLink size={12} />
                  </a>
                  <span className="text-border">·</span>
                  <a href={solution.gfgLink} target="_blank" rel="noreferrer" className="font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    GeeksforGeeks <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-6 md:p-7">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Layers size={15} />
                  </span>
                  Approach
                  <span className="text-sm font-normal text-muted-foreground">— step by step</span>
                </h2>
                <ol className="mt-5 space-y-3">
                  {solution.approach.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <p className="pt-0.5 text-sm leading-7 text-foreground/90">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {solution.tags.length > 0 && (
              <div className="rounded-2xl bg-card border border-border p-6">
                <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-3">
                  <Tag size={12} /> Related topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {solution.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/practice?tag=${tag.toLowerCase().replace(/\s+/g, "-")}`}
                      className="px-3 py-1.5 rounded-md bg-muted border border-border text-xs font-medium text-foreground hover:bg-card transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 lg:sticky lg:top-[60px] lg:h-[calc(100vh-76px)] flex flex-col">
            <div className="rounded-2xl bg-card border border-border overflow-hidden flex flex-col min-h-[560px] lg:flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setActiveTab(l.id)}
                      className={`px-3.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        activeTab === l.id
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(getCode(activeTab), activeTab)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:brightness-95"
                  >
                    {copied === activeTab ? <Check size={12} /> : <Copy size={12} />}
                    {copied === activeTab ? "Copied" : "Copy"}
                  </button>
                  <a href={solution.leetcodeLink} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-card text-xs font-medium text-foreground hover:bg-muted">
                    <ExternalLink size={12} /> Open
                  </a>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto">
                <CodeBlock hideHeader language={activeTab} code={getCode(activeTab)} />
              </div>

              <div className="px-4 py-2.5 bg-muted/30 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
                <span>LeetCode style · Dark editor · JetBrains Mono 13.5px</span>
                <span className="hidden sm:inline">Copy and run in your IDE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
