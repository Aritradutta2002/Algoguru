import { useEffect, useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
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
    <div ref={pageRootRef} className="flex-1 h-full w-full max-w-6xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          to="/practice"
          className="inline-flex items-center gap-2 rounded-md border-2 border-border bg-card px-3 py-1.5 text-xs font-black uppercase tracking-wide hover:bg-secondary"
        >
          <ArrowLeft size={14} />
          Back to Practice
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={detail.problem.leetcodeLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border-2 border-border bg-card px-3 py-1.5 text-xs font-black uppercase tracking-wide hover:bg-secondary"
          >
            Practice in LeetCode
            <ExternalLink size={12} />
          </a>
          <a
            href={detail.problem.gfgLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border-2 border-border bg-card px-3 py-1.5 text-xs font-black uppercase tracking-wide hover:bg-secondary"
          >
            Practice in GeeksforGeeks
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <Card className="border-2 border-border shadow-[4px_4px_0_0_hsl(var(--border))]">
        <CardHeader className="space-y-3">
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
          <CardTitle className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            {detail.problem.title}
          </CardTitle>
          <CardDescription className="text-sm font-semibold leading-relaxed max-w-4xl">
            {detail.description}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-wide">Worst Case</CardDescription>
          </CardHeader>
          <CardContent className="text-sm font-bold">{detail.complexity.worst}</CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-wide">Average Case</CardDescription>
          </CardHeader>
          <CardContent className="text-sm font-bold">{detail.complexity.average}</CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-wide">Optimal Case</CardDescription>
          </CardHeader>
          <CardContent className="text-sm font-bold">{detail.complexity.optimal}</CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-wide">Space</CardDescription>
          </CardHeader>
          <CardContent className="text-sm font-bold">{detail.complexity.space}</CardContent>
        </Card>
      </div>

      <Card className="border-2 border-border shadow-[4px_4px_0_0_hsl(var(--border))]">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase tracking-wide">Approach</CardTitle>
          <CardDescription className="text-xs font-semibold">Step-by-step idea to solve the problem efficiently.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-disc pl-5 text-sm font-medium leading-relaxed">
            {detail.approach.map((step, index) => (
              <li key={`${detail.problem.id}-approach-${index}`}>{step}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-2 border-border shadow-[4px_4px_0_0_hsl(var(--border))]">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase tracking-wide">Solutions by Language</CardTitle>
          <CardDescription className="text-xs font-semibold">Java, C++, and Python versions with time complexity context.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="java" className="w-full">
            <TabsList className="w-full sm:w-auto">
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
            Time Complexity reference: Worst {detail.complexity.worst}, Average {detail.complexity.average}, Optimal {detail.complexity.optimal}.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
