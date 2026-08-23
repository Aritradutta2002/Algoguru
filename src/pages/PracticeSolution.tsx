import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, ExternalLink, Copy, Check, Clock3, Database, Layers, BookOpen, Tag } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { getPracticeSolutionDetail } from "@/lib/practiceSolutionUtils";
import { getSolutionByProblemId } from "@/data/practiceSolutions";

function difficultyBadge(diff: string) {
  if (diff === "Easy") return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  if (diff === "Medium") return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
  return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
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
    <div ref={pageRef} className="min-h-screen bg-[#fcfcfd] dark:bg-[#0a0a0a] selection:bg-zinc-900 selection:text-white">
      {/* subtle page background pattern */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.04),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.04),transparent_55%)]" />

      <div className="relative mx-auto max-w-[900px] px-4 md:px-6 py-8 md:py-10">
        {/* Breadcrumb */}
        <nav className="mb-7 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
          <Link to="/" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Home</Link>
          <ChevronRight size={12} className="opacity-40" />
          <Link to="/practice" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Practice</Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-zinc-900 dark:text-zinc-100">Solution</span>
        </nav>

        {/* Title card — clean reading focus */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden mb-6">
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[10px] font-bold tracking-widest uppercase mb-4">
                  <BookOpen size={12} /> Editorial
                </div>
                <h1 className="text-[26px] md:text-[32px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15] text-balance">
                  {solution.title}
                </h1>
                <p className="mt-3 text-[15px] leading-7 text-zinc-600 dark:text-zinc-400 max-w-[68ch]">
                  {solution.description}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${difficultyBadge(solution.difficulty)}`}>
                    {solution.difficulty}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    <Clock3 size={12} className="text-zinc-500" /> {solution.timeComplexity}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    <Database size={12} className="text-zinc-500" /> {solution.spaceComplexity}
                  </span>
                </div>

                {solution.companies.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium text-zinc-500 mr-1">Asked at</span>
                    {solution.companies.map((c) => (
                      <span key={c} className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Link to="/practice" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                  <ArrowLeft size={14} /> Back
                </Link>
              </div>
            </div>
          </div>

          {/* bottom action bar inside card */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 md:px-8 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="hidden sm:inline">Practice on</span>
              <a href={solution.leetcodeLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white">
                LeetCode <ExternalLink size={12} />
              </a>
              <span className="opacity-30">·</span>
              <a href={solution.gfgLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white">
                GeeksforGeeks <ExternalLink size={12} />
              </a>
            </div>
            <Link to="/practice" className="sm:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              <ArrowLeft size={12} /> Back to practice
            </Link>
          </div>
        </div>

        {/* Approach — excellent reading */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-5">
            <span className="w-7 h-7 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center">
              <Layers size={14} />
            </span>
            Approach
            <span className="ml-1 text-xs font-normal text-zinc-500">— step by step</span>
          </h2>
          <ol className="space-y-4">
            {solution.approach.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="shrink-0 w-7 h-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="pt-1 text-[14.5px] leading-7 text-zinc-700 dark:text-zinc-300">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* Code — LeetCode style, full width */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm">
              {LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setActiveTab(l.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                    activeTab === l.id
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(getCode(activeTab), activeTab)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {copied === activeTab ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied === activeTab ? "Copied" : "Copy code"}
              </button>
              <a
                href={solution.leetcodeLink}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                <ExternalLink size={13} /> Open
              </a>
            </div>
          </div>

          <div className="bg-[#1a1a1a]">
            <CodeBlock hideHeader language={activeTab} code={getCode(activeTab)} />
          </div>
        </div>

        {/* Tags — minimal, good looking */}
        {solution.tags.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6">
            <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mb-3">
              <Tag size={12} /> Related topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {solution.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/practice?tag=${tag.toLowerCase().replace(/\s+/g, "-")}`}
                  className="px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <Link to="/practice" className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium">
            <ArrowLeft size={13} /> All problems
          </Link>
          <span className="hidden sm:inline">Read · Understand · Code</span>
        </div>
      </div>
    </div>
  );
}
