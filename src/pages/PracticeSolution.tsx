import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, ExternalLink, Copy, Check, Clock3, Database, Layers, BookOpen, Tag, Sparkles } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { Button } from "@/components/ui/button";
import {
  PageShell,
  PageHeader,
  Section,
  Surface,
  Pill,
  SegmentedControl,
  type PillTone,
} from "@/components/layout/PagePrimitives";
import { getPracticeSolutionDetail } from "@/lib/practiceSolutionUtils";
import { getSolutionByProblemId } from "@/data/practiceSolutions";

function difficultyTone(diff: string): PillTone {
  if (diff === "Easy") return "success";
  if (diff === "Medium") return "warning";
  return "danger";
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
    <div ref={pageRef} className="ui-app-canvas">
      <PageShell width="wide">
        {/* ── Compact contextual bar: breadcrumb + primary exits ──── */}
        <div className="ui-toolbar">
          <nav className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight size={12} className="shrink-0 opacity-40" />
            <Link to="/practice" className="hover:text-foreground">Practice</Link>
            <ChevronRight size={12} className="shrink-0 opacity-40" />
            <span className="truncate px-1.5 text-foreground">Solution</span>
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button variant="line" size="sm" asChild>
              <Link to="/practice">
                <ArrowLeft size={13} /> Back
              </Link>
            </Button>
            <Button variant="solid" size="sm" className="hidden sm:inline-flex" asChild>
              <a href={solution.leetcodeLink} target="_blank" rel="noreferrer">
                LeetCode <ExternalLink size={12} />
              </a>
            </Button>
          </div>
        </div>

        <Section spacing="compact">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,600px)_minmax(0,1fr)]">
            {/* ── Editorial column ─────────────────────────────────── */}
            <div className="min-w-0 space-y-4">
              <PageHeader
                bare
                variant="standard"
                eyebrow={
                  <>
                    <BookOpen size={12} /> Editorial
                  </>
                }
                title={solution.title}
                description={solution.description}
                meta={
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={difficultyTone(solution.difficulty)}>
                      {solution.difficulty}
                    </Pill>
                    <Pill mono>
                      <Clock3 size={11} /> {solution.timeComplexity}
                    </Pill>
                    <Pill mono>
                      <Database size={11} /> {solution.spaceComplexity}
                    </Pill>
                  </div>
                }
              />

              {solution.companies.length > 0 && (
                <Surface padding="sm">
                  <div className="ui-meta">Asked at</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {solution.companies.map((c) => (
                      <Pill key={c} variant="chip">
                        {c}
                      </Pill>
                    ))}
                  </div>
                </Surface>
              )}

              <Surface>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-control border border-border bg-muted/60 text-primary">
                    <Layers size={15} />
                  </span>
                  <h2 className="ui-h3">Approach</h2>
                  <span className="ui-meta">step by step</span>
                </div>
                <ol className="mt-5 space-y-3">
                  {solution.approach.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60 font-mono text-[11px] font-medium tabular-nums text-foreground">
                        {i + 1}
                      </span>
                      <p className="pt-0.5 text-sm leading-7 text-foreground/90">{step}</p>
                    </li>
                  ))}
                </ol>
              </Surface>

              {solution.tags.length > 0 && (
                <Surface padding="sm">
                  <h3 className="ui-meta flex items-center gap-1.5">
                    <Tag size={12} /> Related topics
                  </h3>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {solution.tags.map((tag) => (
                      <Link key={tag} to={`/practice?tag=${tag.toLowerCase().replace(/\s+/g, "-")}`}>
                        <Pill variant="chip" className="hover:border-border-strong hover:text-foreground transition-colors">
                          {tag}
                        </Pill>
                      </Link>
                    ))}
                  </div>
                </Surface>
              )}

              <Surface padding="sm" className="flex flex-wrap items-center justify-between gap-2">
                <span className="ui-meta inline-flex items-center gap-1.5">
                  <Sparkles size={12} className="text-primary" /> 3 languages · Copy-ready · Interview grade
                </span>
                <span className="flex items-center gap-3">
                  <a href={solution.leetcodeLink} target="_blank" rel="noreferrer" className="ui-meta inline-flex items-center gap-1 hover:text-foreground">
                    LeetCode <ExternalLink size={11} />
                  </a>
                  <span className="ui-meta">·</span>
                  <a href={solution.gfgLink} target="_blank" rel="noreferrer" className="ui-meta inline-flex items-center gap-1 hover:text-foreground">
                    GeeksforGeeks <ExternalLink size={11} />
                  </a>
                </span>
              </Surface>
            </div>

            {/* ── Code workspace ───────────────────────────────────── */}
            <div className="flex min-w-0 flex-col lg:sticky lg:top-[60px] lg:h-[calc(100vh-76px)]">
              <Surface padding="none" className="flex min-h-[560px] flex-col overflow-hidden lg:flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-2.5">
                  <SegmentedControl<"java" | "cpp" | "python">
                    value={activeTab}
                    onChange={setActiveTab}
                    size="sm"
                    options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="solid"
                      size="sm"
                      onClick={() => handleCopy(getCode(activeTab), activeTab)}
                    >
                      {copied === activeTab ? <Check size={12} /> : <Copy size={12} />}
                      {copied === activeTab ? "Copied" : "Copy"}
                    </Button>
                    <Button variant="line" size="sm" className="hidden sm:inline-flex" asChild>
                      <a href={solution.leetcodeLink} target="_blank" rel="noreferrer">
                        <ExternalLink size={12} /> Open
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto">
                  <CodeBlock hideHeader language={activeTab} code={getCode(activeTab)} />
                </div>

                <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5">
                  <span className="ui-meta">LeetCode style · Dark editor · JetBrains Mono 13.5px</span>
                  <span className="ui-meta hidden sm:inline">Copy and run in your IDE</span>
                </div>
              </Surface>
            </div>
          </div>
        </Section>
      </PageShell>
    </div>
  );
}
