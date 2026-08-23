import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, ExternalLink, Copy, Check, Clock3, Database, Layers, BookOpen, Tag, Sparkles } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { getPracticeSolutionDetail } from "@/lib/practiceSolutionUtils";
import { getSolutionByProblemId } from "@/data/practiceSolutions";

function difficultyBadge(diff: string) {
  if (diff === "Easy") return "bg-emerald-500 text-white border-emerald-500";
  if (diff === "Medium") return "bg-amber-500 text-white border-amber-500";
  return "bg-rose-500 text-white border-rose-500";
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
    <div ref={pageRef} className="min-h-screen bg-[#f6f7f9] dark:bg-[#070708] selection:bg-zinc-900 selection:text-white">
      {/* top subtle gradient */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />

      {/* breadcrumb bar — full width */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-[#f6f7f9]/80 dark:bg-[#070708]/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 min-w-0">
            <Link to="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">Home</Link>
            <ChevronRight size={12} className="opacity-40 shrink-0" />
            <Link to="/practice" className="hover:text-zinc-900 dark:hover:text-zinc-100">Practice</Link>
            <ChevronRight size={12} className="opacity-40 shrink-0" />
            <span className="text-zinc-900 dark:text-zinc-100 truncate">Solution</span>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/practice" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50">
              <ArrowLeft size={14} /> Back
            </Link>
            <a href={solution.leetcodeLink} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90">
              LeetCode <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* main — full screen grid */}
      <div className="mx-auto max-w-[1600px] px-4 md:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[560px_1fr] xl:grid-cols-[580px_1fr] 2xl:grid-cols-[620px_1fr] gap-6 items-start">
          {/* LEFT — reading column */}
          <div className="space-y-5 min-w-0">
            {/* Title card */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-extrabold tracking-widest uppercase shadow-sm">
                  <BookOpen size={12} /> Editorial
                </div>
                <h1 className="mt-4 text-[28px] md:text-[34px] font-black tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
                  {solution.title}
                </h1>
                <p className="mt-4 text-[15px] leading-7 text-zinc-600 dark:text-zinc-300">
                  {solution.description}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${difficultyBadge(solution.difficulty)}`}>
                    {solution.difficulty}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                    <Clock3 size={13} className="text-amber-500" /> {solution.timeComplexity}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                    <Database size={13} className="text-emerald-500" /> {solution.spaceComplexity}
                  </span>
                </div>

                {solution.companies.length > 0 && (
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold tracking-widest uppercase text-zinc-500">Asked at</span>
                    {solution.companies.map((c) => (
                      <span key={c} className="px-2.5 py-1 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 md:px-8 py-3 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  <Sparkles size={12} className="text-amber-500" /> 3 languages · Copy-ready · Interview grade
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <a href={solution.leetcodeLink} target="_blank" rel="noreferrer" className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 inline-flex items-center gap-1">
                    LeetCode <ExternalLink size={12} />
                  </a>
                  <span className="text-zinc-300">·</span>
                  <a href={solution.gfgLink} target="_blank" rel="noreferrer" className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 inline-flex items-center gap-1">
                    GeeksforGeeks <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* Approach card */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
              <div className="p-6 md:p-7">
                <h2 className="text-sm font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                    <Layers size={15} />
                  </span>
                  Approach
                  <span className="text-xs font-semibold text-zinc-500">— step by step</span>
                </h2>
                <ol className="mt-5 space-y-4">
                  {solution.approach.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-7 h-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black flex items-center justify-center">
                        {i + 1}
                      </span>
                      <p className="pt-0.5 text-[14.5px] leading-7 text-zinc-700 dark:text-zinc-300">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Tags */}
            {solution.tags.length > 0 && (
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
                <h3 className="text-xs font-black tracking-widest uppercase text-zinc-500 flex items-center gap-1.5 mb-3">
                  <Tag size={12} /> Related topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {solution.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/practice?tag=${tag.toLowerCase().replace(/\s+/g, "-")}`}
                      className="px-3.5 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — code column — full screen utilize */}
          <div className="min-w-0 lg:sticky lg:top-[60px] lg:h-[calc(100vh-76px)] flex flex-col">
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col min-h-[560px] lg:flex-1">
              {/* editor toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setActiveTab(l.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wide transition-all ${
                        activeTab === l.id
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow"
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(getCode(activeTab), activeTab)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90"
                  >
                    {copied === activeTab ? <Check size={13} /> : <Copy size={13} />}
                    {copied === activeTab ? "Copied" : "Copy"}
                  </button>
                  <a href={solution.leetcodeLink} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <ExternalLink size={12} /> Open
                  </a>
                </div>
              </div>

              {/* code — fills remaining height and scrolls */}
              <div className="flex-1 min-h-0 bg-[#1a1a1a] overflow-auto">
                <CodeBlock hideHeader language={activeTab} code={getCode(activeTab)} />
              </div>

              {/* bottom hint */}
              <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
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
