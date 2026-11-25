"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Clock3,
  Database,
  Layers,
  BookOpen,
  Tag,
  Sparkles,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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

export interface PracticeSolutionViewData {
  problemId: string;
  title: string;
  description: string;
  approach: string[];
  timeComplexity: string;
  spaceComplexity: string;
  difficulty: "Easy" | "Medium" | "Hard";
  solutions: {
    java: string;
    cpp: string;
    python: string;
  };
  leetcodeLink: string;
  gfgLink: string;
  companies: string[];
  tags: string[];
}

export default function PracticeSolutionView({
  solution,
}: {
  solution: PracticeSolutionViewData;
}) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<LangId>("java");
  const [copied, setCopied] = useState<LangId | null>(null);

  useEffect(() => {
    const host = pageRef.current?.closest("main");
    if (host) host.scrollTo({ top: 0, behavior: "auto" });
    else window.scrollTo({ top: 0, behavior: "auto" });
  }, [solution.problemId]);

  const getCode = (t: LangId) =>
    t === "cpp"
      ? solution.solutions.cpp
      : t === "python"
        ? solution.solutions.python
        : solution.solutions.java;

  const handleCopy = async (code: string, lang: LangId) => {
    await navigator.clipboard.writeText(code);
    setCopied(lang);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-obsidian-void text-foreground">
      <div className="sticky top-0 z-20 backdrop-blur-md bg-obsidian-void/90 border-b border-obsidian-border">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 h-12 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <ChevronRight size={12} className="opacity-40 shrink-0" />
            <Link href="/practice" className="hover:text-foreground">
              Practice
            </Link>
            <ChevronRight size={12} className="opacity-40 shrink-0" />
            <span className="text-foreground truncate">Solution</span>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs font-medium"
            >
              <Link href="/practice">
                <ArrowLeft size={13} /> Back
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex h-8 gap-1.5 px-3 text-xs font-medium"
            >
              <a href={solution.leetcodeLink} target="_blank" rel="noreferrer">
                LeetCode <ExternalLink size={12} />
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[560px_1fr] xl:grid-cols-[580px_1fr] 2xl:grid-cols-[620px_1fr] gap-6 items-start">
          <div className="space-y-4 min-w-0">
            <Card className="rounded-[0.875rem] bg-obsidian-pane border-obsidian-border overflow-hidden shadow-none">
              <CardContent className="p-6 md:p-8">
                <p className="lp-kicker mb-3 inline-flex items-center gap-1.5">
                  <BookOpen size={12} /> Editorial
                </p>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.03em] text-foreground leading-tight">
                  {solution.title}
                </h1>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {solution.description}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium",
                      difficultyBadge(solution.difficulty),
                    )}
                  >
                    {solution.difficulty}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="gap-1.5 px-2.5 py-1 text-xs font-medium bg-obsidian-elevated border border-obsidian-border text-foreground"
                  >
                    <Clock3 size={12} className="text-muted-foreground" />{" "}
                    {solution.timeComplexity}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="gap-1.5 px-2.5 py-1 text-xs font-medium bg-obsidian-elevated border border-obsidian-border text-foreground"
                  >
                    <Database size={12} className="text-muted-foreground" />{" "}
                    {solution.spaceComplexity}
                  </Badge>
                </div>

                {solution.companies.length > 0 && (
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Asked at
                    </span>
                    {solution.companies.map((c) => (
                      <Badge
                        key={c}
                        variant="secondary"
                        className="px-2.5 py-1 bg-obsidian-elevated border border-obsidian-border text-xs font-medium text-foreground"
                      >
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter className="px-6 md:px-8 py-3 bg-obsidian-elevated/40 border-t border-obsidian-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles size={12} className="text-muted-foreground" /> 3
                  languages · Copy-ready · Interview grade
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <a
                    href={solution.leetcodeLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    LeetCode <ExternalLink size={12} />
                  </a>
                  <span className="text-obsidian-border">·</span>
                  <a
                    href={solution.gfgLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    GeeksforGeeks <ExternalLink size={12} />
                  </a>
                </div>
              </CardFooter>
            </Card>

            <Card className="rounded-[0.875rem] bg-obsidian-pane border-obsidian-border overflow-hidden shadow-none">
              <CardContent className="p-6 md:p-7">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span className="w-7 h-7 rounded-md border border-obsidian-border bg-obsidian-elevated text-muted-foreground flex items-center justify-center">
                    <Layers size={14} />
                  </span>
                  Approach
                  <span className="text-sm font-normal text-muted-foreground">
                    — step by step
                  </span>
                </h2>
                <ol className="mt-5 space-y-3">
                  {solution.approach.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full border border-obsidian-border bg-obsidian-elevated text-xs font-medium text-foreground tabular-nums flex items-center justify-center">
                        {i + 1}
                      </span>
                      <p className="pt-0.5 text-sm leading-7 text-foreground/90">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {solution.tags.length > 0 && (
              <Card className="rounded-[0.875rem] bg-obsidian-pane border-obsidian-border p-6 shadow-none">
                <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-3">
                  <Tag size={12} /> Related topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {solution.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="px-3 py-1.5 bg-obsidian-elevated border border-obsidian-border text-xs font-medium text-foreground hover:bg-foreground/[0.06] transition-colors"
                    >
                      <Link
                        href={`/practice?tag=${tag.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {tag}
                      </Link>
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="min-w-0 lg:sticky lg:top-[60px] lg:h-[calc(100vh-76px)] flex flex-col">
            <Card className="rounded-[0.875rem] bg-obsidian-pane border-obsidian-border overflow-hidden flex flex-col min-h-[560px] lg:flex-1 shadow-none">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as LangId)}
                className="flex flex-col flex-1 min-h-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-obsidian-elevated/40 border-b border-obsidian-border">
                  <TabsList className="h-auto p-1 rounded-lg bg-obsidian-elevated border border-obsidian-border">
                    {LANGUAGES.map((l) => (
                      <TabsTrigger
                        key={l.id}
                        value={l.id}
                        className="px-3.5 py-1 rounded-md text-xs font-medium data-[state=active]:bg-foreground/[0.08] data-[state=active]:text-foreground data-[state=active]:shadow-none"
                      >
                        {l.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleCopy(getCode(activeTab), activeTab)}
                      className="h-8 gap-1.5 px-3 text-xs font-medium"
                    >
                      {copied === activeTab ? (
                        <Check size={12} />
                      ) : (
                        <Copy size={12} />
                      )}
                      {copied === activeTab ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="hidden sm:inline-flex h-8 gap-1.5 px-3 text-xs font-medium"
                    >
                      <a
                        href={solution.leetcodeLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink size={12} /> Open
                      </a>
                    </Button>
                  </div>
                </div>

                {LANGUAGES.map((l) => (
                  <TabsContent
                    key={l.id}
                    value={l.id}
                    className="mt-0 flex-1 min-h-0 overflow-auto"
                  >
                    <CodeBlock
                      hideHeader
                      language={l.id}
                      code={getCode(l.id)}
                    />
                  </TabsContent>
                ))}
              </Tabs>

              <CardFooter className="px-4 py-2.5 bg-obsidian-elevated/40 border-t border-obsidian-border text-[11px] text-muted-foreground flex items-center justify-between">
                <span>
                  LeetCode style · Dark editor · JetBrains Mono 13.5px
                </span>
                <span className="hidden sm:inline">
                  Copy and run in your IDE
                </span>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
