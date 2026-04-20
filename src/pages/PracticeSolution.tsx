import { useEffect, useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, ExternalLink, NotebookPen, Sparkles, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/CodeBlock";
import { getPracticeSolutionDetail } from "@/lib/practiceSolutionUtils";

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

export default function PracticeSolution() {
  const { problemId } = useParams<{ problemId: string }>();
  const pageRootRef = useRef<HTMLDivElement | null>(null);

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
  if (!detail) return <Navigate to="/practice" replace />;

  return (
    <div ref={pageRootRef} className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black animate-in fade-in duration-700">
      <section className="px-4 md:px-10 lg:px-16 py-10 md:py-14 max-w-7xl mx-auto relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[580px] h-[360px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight size={10} className="opacity-50" />
            <Link to="/practice" className="hover:text-primary transition-colors">Practice</Link>
            <ChevronRight size={10} className="opacity-50" />
            <span className="text-primary">Solution</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/40 text-[10px] font-bold uppercase tracking-widest">
            <NotebookPen size={12} className="text-primary" />
            <span className="text-muted-foreground">Problem Breakdown</span>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3 max-w-4xl">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-tight">
                {detail.problem.title}
              </h1>
              <p className="text-sm md:text-base font-medium text-muted-foreground leading-relaxed">
                {detail.description}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap md:justify-end">
              <Link
                to="/practice"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-card text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft size={14} />
                Back
              </Link>
              <a
                href={detail.problem.leetcodeLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-card text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                LeetCode
                <ExternalLink size={12} />
              </a>
              <a
                href={detail.problem.gfgLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-card text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                GeeksforGeeks
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-[10px] font-black uppercase border ${difficultyClasses(detail.problem.difficulty)}`}>
              {detail.problem.difficulty}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-bold uppercase border-border/70 bg-card">
              {detail.topic.title}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-bold uppercase border-border/70 bg-card">
              {detail.subtopic.title}
            </Badge>
            {!detail.hasCuratedMatch && (
              <Badge variant="outline" className="text-[10px] font-bold uppercase border-orange-400/40 bg-orange-400/10 text-orange-700 dark:text-orange-300">
                Auto-generated details
              </Badge>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-10 lg:px-16 pb-14 md:pb-20 max-w-7xl mx-auto space-y-7">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-1">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Timer size={12} /> Worst Case
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm md:text-base font-extrabold">{detail.complexity.worst}</CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-1">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Average Case</CardDescription>
            </CardHeader>
            <CardContent className="text-sm md:text-base font-extrabold">{detail.complexity.average}</CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-1">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Optimal Case</CardDescription>
            </CardHeader>
            <CardContent className="text-sm md:text-base font-extrabold">{detail.complexity.optimal}</CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-1">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Space</CardDescription>
            </CardHeader>
            <CardContent className="text-sm md:text-base font-extrabold">{detail.complexity.space}</CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="rounded-[28px] border lg:col-span-2">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg font-black uppercase tracking-wide flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                Approach
              </CardTitle>
              <CardDescription className="text-xs font-semibold">Step-by-step strategy used in the final solution.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 list-disc pl-5 text-sm font-medium leading-relaxed text-muted-foreground">
                {detail.approach.map((step, index) => (
                  <li key={`${detail.problem.id}-approach-${index}`} className="text-foreground/90">
                    {step}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase tracking-wide">Solutions by Language</CardTitle>
              <CardDescription className="text-xs font-semibold">Java, C++, and Python implementations using the same core logic.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="java" className="w-full">
                <TabsList className="w-full sm:w-auto rounded-xl">
                  <TabsTrigger value="java">Java</TabsTrigger>
                  <TabsTrigger value="cpp">C++</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                </TabsList>

                <TabsContent value="java">
                  <CodeBlock title={`${detail.problem.title} - Java`} language="java" code={detail.javaCode} />
                </TabsContent>

                <TabsContent value="cpp">
                  <CodeBlock title={`${detail.problem.title} - C++`} language="cpp" code={detail.cppCode} />
                </TabsContent>

                <TabsContent value="python">
                  <CodeBlock title={`${detail.problem.title} - Python`} language="python" code={detail.pythonCode} />
                </TabsContent>
              </Tabs>

              <div className="mt-4 text-xs font-semibold text-muted-foreground">
                Complexity reference: Worst {detail.complexity.worst}, Average {detail.complexity.average}, Optimal {detail.complexity.optimal}, Space {detail.complexity.space}.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
