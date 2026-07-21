// ProblemSolver — LeetCode Daily Challenge page.
//
// Two-pane resizable layout (problem details on the left, Monaco Java editor
// + Wandbox Java Run & Compile runner on the right). Fetches the daily challenge
// via `useDailyChallenge`, which hits the `leetcode-daily` Supabase edge function.
//
// All editor state is autosaved to localStorage keyed by `questionId` so the
// user does not lose work on reload or accidental navigation.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  Hash,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Tag,
  Terminal,
  Trash2,
  Trophy,
  XCircle,
} from "lucide-react";

import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { useSettings } from "@/contexts/SettingsContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailyChallengeResponse } from "@/types/leetcode";

/* ------------------------------------------------------------------ */
/* Difficulty badge styling                                            */
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
      return "bg-muted text-muted-foreground border-border";
  }
}

/* ------------------------------------------------------------------ */
/* Default Java starter template                                      */
/* ------------------------------------------------------------------ */

const DEFAULT_JAVA_TEMPLATE = `import java.util.*;

class Solution {
    public int solve() {
        // TODO: Write your solution logic here
        return 0;
    }

    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println("Running Java solution...");
        System.out.println("Result: " + sol.solve());
    }
}
`;

const WANDBOX_API = "https://wandbox.org/api/compile.json";
const JAVA_AUTO_IMPORTS = [
  "import java.util.*;",
  "import java.util.stream.*;",
  "import java.io.*;",
  "import java.math.*;",
];

/* ------------------------------------------------------------------ */
/* Editor storage helpers                                              */
/* ------------------------------------------------------------------ */

function storageKey(questionId: string): string {
  return `problem_solver_java_code_${questionId}`;
}

function loadSavedCode(questionId: string): string | null {
  try {
    return localStorage.getItem(storageKey(questionId));
  } catch {
    return null;
  }
}

function saveCode(questionId: string, code: string): void {
  try {
    localStorage.setItem(storageKey(questionId), code);
  } catch {
    // localStorage may be unavailable (private mode, quota); fail silently.
  }
}

/* ------------------------------------------------------------------ */
/* Java Code Execution Helper via Wandbox                              */
/* ------------------------------------------------------------------ */

interface RunResult {
  status: "success" | "compile_error" | "runtime_error" | "error";
  output: string;
  compilerMessage?: string;
  executionTimeMs: number;
}

async function runJavaCode(
  sourceCode: string,
  stdin: string = "",
): Promise<RunResult> {
  const startTime = Date.now();

  try {
    // 1. Add auto imports if missing
    const missingImports = JAVA_AUTO_IMPORTS.filter(
      (statement) => !sourceCode.includes(statement),
    );
    let processedCode = missingImports.length
      ? `${missingImports.join("\n")}\n\n${sourceCode}`
      : sourceCode;

    // 2. Wandbox runs file as prog.java — strip 'public' before 'class' so Java doesn't complain about filename
    processedCode = processedCode.replace(/public\s+class\s+/g, "class ");

    // 3. If no main method exists, append a runner class Main so compilation/syntax check runs cleanly
    if (!/\bvoid\s+main\b/.test(processedCode)) {
      processedCode += `\n\nclass Main {\n    public static void main(String[] args) {\n        System.out.println("=== Java Compilation & Syntax Check Successful ===");\n        System.out.println("Tip: Add a 'public static void main(String[] args)' method to test your solution methods with custom inputs!");\n    }\n}`;
    }

    const res = await fetch(WANDBOX_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler: "openjdk-jdk-21+35",
        code: processedCode,
        stdin: stdin || "",
        "compiler-option-raw": "",
        "runtime-option-raw": "",
        save: false,
      }),
    });

    const executionTimeMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text();
      return {
        status: "error",
        output: `Compiler API HTTP ${res.status}: ${errText || "Request failed"}`,
        executionTimeMs,
      };
    }

    const data = (await res.json()) as {
      status?: string;
      compiler_error?: string;
      compiler_message?: string;
      program_output?: string;
      program_error?: string;
      program_message?: string;
    };

    if (data.compiler_error || data.compiler_message) {
      const errMsg = (data.compiler_error || data.compiler_message || "").trim();
      if (errMsg) {
        return {
          status: "compile_error",
          output: errMsg,
          compilerMessage: errMsg,
          executionTimeMs,
        };
      }
    }

    if (data.program_error && data.program_error.trim()) {
      return {
        status: "runtime_error",
        output: `${data.program_output ? data.program_output + "\n" : ""}[Runtime Error]\n${data.program_error}`,
        executionTimeMs,
      };
    }

    const output =
      data.program_output || data.program_message || "Program executed successfully (no output).";

    return {
      status: "success",
      output,
      executionTimeMs,
    };
  } catch (err) {
    const executionTimeMs = Date.now() - startTime;
    return {
      status: "error",
      output: `Could not connect to Java compilation service.\nError: ${err instanceof Error ? err.message : String(err)}`,
      executionTimeMs,
    };
  }
}

/* ------------------------------------------------------------------ */
/* Code Editor Panel Component                                        */
/* ------------------------------------------------------------------ */

function CodeEditorPanel({
  questionId,
  theme,
  exampleTestcases,
}: {
  questionId: string;
  theme: "dark" | "light";
  exampleTestcases?: string;
}) {
  const [code, setCode] = useState<string>(() => {
    return loadSavedCode(questionId) ?? DEFAULT_JAVA_TEMPLATE;
  });

  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"output" | "testcases">("output");
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  const editorRef = useRef<any>(null);

  // Reset code when problem changes (new day)
  useEffect(() => {
    setCode(loadSavedCode(questionId) ?? DEFAULT_JAVA_TEMPLATE);
    setRunResult(null);
  }, [questionId]);

  const handleChange = (value: string | undefined) => {
    const next = value ?? "";
    setCode(next);
    saveCode(questionId, next);
  };

  const handleResetCode = () => {
    setCode(DEFAULT_JAVA_TEMPLATE);
    saveCode(questionId, DEFAULT_JAVA_TEMPLATE);
    setRunResult(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setConsoleOpen(true);
    setActiveTab("output");

    const result = await runJavaCode(code);
    setRunResult(result);
    setIsRunning(false);
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register Ctrl+Enter / Cmd+Enter shortcut for Run & Compile
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      void handleRunCode();
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-card">
      {/* Editor Header / Action Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs font-mono font-bold bg-background">
            <Code2 className="h-3.5 w-3.5 text-primary" />
            Java 21 (JDK)
          </Badge>
          <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
            Autosaved
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyCode}
            className="h-8 text-xs gap-1.5"
            title="Copy code to clipboard"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetCode}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            title="Reset to starter template"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              void handleRunCode();
            }}
            disabled={isRunning}
            className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
            title="Run and compile Java solution (Ctrl + Enter)"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            <span>{isRunning ? "Compiling..." : "Run & Compile"}</span>
          </Button>
        </div>
      </div>

      {/* Monaco Editor canvas */}
      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language="java"
          theme={theme === "light" ? "light" : "vs-dark"}
          value={code}
          onChange={handleChange}
          onMount={handleMount}
          options={{
            fontSize: 14,
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            lineNumbers: "on",
            renderLineHighlight: "line",
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            formatOnPaste: true,
            tabSize: 4,
            insertSpaces: true,
            detectIndentation: false,
            wordWrap: "on",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            suggest: { showKeywords: true, showSnippets: true },
            quickSuggestions: { other: true, comments: false, strings: true },
          }}
        />
      </div>

      {/* Bottom Collapsible Console & Output Panel */}
      <div className="border-t border-border/60 bg-muted/20 shrink-0">
        {/* Console Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border/40 select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              <Terminal className="h-3.5 w-3.5 text-primary" />
              Console Output
            </button>

            {/* Run Status Badges */}
            {isRunning && (
              <Badge variant="outline" className="gap-1 text-[11px] bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" /> Compiling & Running...
              </Badge>
            )}

            {!isRunning && runResult && (
              <div className="flex items-center gap-2">
                {runResult.status === "success" && (
                  <Badge variant="outline" className="gap-1 text-[11px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Compiled & Executed
                  </Badge>
                )}
                {runResult.status === "compile_error" && (
                  <Badge variant="outline" className="gap-1 text-[11px] bg-rose-500/10 text-rose-600 border-rose-500/30">
                    <XCircle className="h-3 w-3 text-rose-500" /> Compilation Error
                  </Badge>
                )}
                {runResult.status === "runtime_error" && (
                  <Badge variant="outline" className="gap-1 text-[11px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                    <AlertTriangle className="h-3 w-3 text-amber-500" /> Runtime Error
                  </Badge>
                )}
                {runResult.status === "error" && (
                  <Badge variant="outline" className="gap-1 text-[11px] bg-rose-500/10 text-rose-600 border-rose-500/30">
                    <XCircle className="h-3 w-3 text-rose-500" /> Error
                  </Badge>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                  <Clock className="h-3 w-3" />
                  {runResult.executionTimeMs} ms
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {exampleTestcases && (
              <Button
                size="sm"
                variant={activeTab === "testcases" ? "secondary" : "ghost"}
                onClick={() => {
                  setActiveTab("testcases");
                  setConsoleOpen(true);
                }}
                className="h-6 text-[11px] px-2"
              >
                Testcases
              </Button>
            )}

            <Button
              size="sm"
              variant={activeTab === "output" ? "secondary" : "ghost"}
              onClick={() => {
                setActiveTab("output");
                setConsoleOpen(true);
              }}
              className="h-6 text-[11px] px-2"
            >
              Output
            </Button>

            {runResult && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRunResult(null)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Clear console output"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title={consoleOpen ? "Collapse console" : "Expand console"}
            >
              {consoleOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Console Body */}
        {consoleOpen && (
          <div className="p-3 bg-zinc-950 text-zinc-100 font-mono text-xs leading-relaxed max-h-[220px] min-h-[110px] overflow-y-auto">
            {activeTab === "testcases" ? (
              <div className="space-y-2 select-text">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Example Testcases (from LeetCode)
                </div>
                <pre className="p-3 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 whitespace-pre-wrap">
                  {exampleTestcases}
                </pre>
              </div>
            ) : isRunning ? (
              <div className="flex items-center gap-2 text-amber-400 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending Java code to OpenJDK 21 compiler runner...</span>
              </div>
            ) : runResult ? (
              <div className="space-y-2 select-text">
                {runResult.status === "compile_error" ? (
                  <div className="text-rose-400 whitespace-pre-wrap">
                    {runResult.output}
                  </div>
                ) : runResult.status === "runtime_error" ? (
                  <div className="text-amber-300 whitespace-pre-wrap">
                    {runResult.output}
                  </div>
                ) : runResult.status === "error" ? (
                  <div className="text-rose-400 whitespace-pre-wrap">
                    {runResult.output}
                  </div>
                ) : (
                  <div className="text-emerald-300 whitespace-pre-wrap">
                    {runResult.output}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-zinc-500 py-4 text-center select-none">
                Click <span className="text-emerald-400 font-bold">Run & Compile</span> or press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">Ctrl + Enter</kbd> to compile and execute your Java code.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton (loading)                                                  */
/* ------------------------------------------------------------------ */

function ProblemSkeleton() {
  return (
    <div className="flex h-full w-full">
      <div className="w-2/5 border-r border-border/50 p-8 space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-12" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-4 w-9/12" />
        <Skeleton className="h-4 w-8/12" />
      </div>
      <div className="flex-1 p-4">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Error state                                                         */
/* ------------------------------------------------------------------ */

function ErrorState({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Alert variant="destructive" className="max-w-xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Couldn't load today's challenge</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            {error.message ||
              "Something went wrong fetching the LeetCode daily challenge."}
          </p>
          <p className="mb-4 text-xs opacity-80">
            The backend service may be temporarily unavailable. You can still
            open today's problem on LeetCode directly.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={onRetry} variant="outline">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
            </Button>
            <Button size="sm" asChild variant="secondary">
              <a
                href="https://leetcode.com/problemset/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open LeetCode
              </a>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state (defensive — upstream returned no problem)              */
/* ------------------------------------------------------------------ */

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Alert className="max-w-xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No challenge available</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            LeetCode hasn't published a daily challenge yet, or the upstream
            service returned an unexpected empty payload.
          </p>
          <Button size="sm" onClick={onRetry} variant="outline">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function PageHeader({
  data,
}: {
  data: DailyChallengeResponse;
}) {
  const { problem, date, stale } = data;
  const formattedDate = useMemo(() => {
    try {
      return format(parseISO(date), "EEEE, MMMM d, yyyy");
    } catch {
      return date;
    }
  }, [date]);

  return (
    <div className="flex flex-col gap-3 border-b border-border/50 bg-background/60 px-6 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between shrink-0">
      <div className="flex items-start gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge
              className={difficultyClasses(problem.difficulty)}
              variant="outline"
            >
              {problem.difficulty}
            </Badge>
            {problem.acRate !== undefined && (
              <Badge variant="secondary" className="font-mono text-[10px]">
                <Trophy className="mr-1 h-3 w-3" />
                {problem.acRate.toFixed(1)}% accepted
              </Badge>
            )}
            {stale && (
              <Badge variant="outline" className="text-[10px] text-amber-600">
                Cached (upstream unavailable)
              </Badge>
            )}
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">
            {problem.title}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formattedDate}
        </span>
        <Button asChild size="sm" variant="outline">
          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> LeetCode
          </a>
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Problem details pane                                                */
/* ------------------------------------------------------------------ */

function ProblemDetails({ data }: { data: DailyChallengeResponse }) {
  const { problem, date } = data;
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Topics */}
      {problem.topicTags.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Tag className="h-3.5 w-3.5" /> Topics
          </div>
          <div className="flex flex-wrap gap-1.5">
            {problem.topicTags.map((t) => (
              <Badge key={t.name} variant="secondary" className="text-xs">
                {t.name}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Date (mobile-only; header shows desktop) */}
      <section className="sm:hidden">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{date}</span>
        </div>
      </section>

      {/* Problem Description Body — HTML from upstream wrapper */}
      <section
        className="prose prose-sm dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
          prose-p:leading-relaxed prose-p:my-3
          prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:p-3.5 prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:border prose-pre:border-border/50
          prose-code:before:content-none prose-code:after:content-none
          prose-code:bg-muted/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs prose-code:text-primary
          prose-strong:text-foreground
          prose-ul:my-3 prose-ol:my-3 prose-li:my-1
          [&_.example-block]:p-4 [&_.example-block]:my-3 [&_.example-block]:rounded-xl [&_.example-block]:bg-muted/40 [&_.example-block]:border [&_.example-block]:border-border/50
          [&_.example-io]:font-mono [&_.example-io]:text-xs [&_.example-io]:font-semibold [&_.example-io]:text-primary"
      >
        <div dangerouslySetInnerHTML={{ __html: problem.content }} />
      </section>

      {/* Hints */}
      {problem.hints && problem.hints.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Hash className="h-3.5 w-3.5" /> Hints
          </div>
          <ol className="space-y-2 text-sm list-decimal pl-5">
            {problem.hints.map((h, i) => (
              <li
                key={i}
                dangerouslySetInnerHTML={{ __html: h }}
                className="text-muted-foreground [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_code]:text-primary"
              />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function ProblemSolver() {
  const { theme } = useSettings();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useDailyChallenge();

  // Defensive: treat a payload with no `questionId` as "empty".
  const isEmpty = !!data && !data.problem?.questionId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-full min-h-0"
    >
      {/* Top bar: back button + page title */}
      <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link to="/" aria-label="Back to home">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              LeetCode
            </div>
            <h2 className="text-sm sm:text-base font-bold truncate">
              Daily Challenge
            </h2>
          </div>
        </div>
        {isFetching && !isLoading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Refreshing
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <ProblemSkeleton />
        ) : isError ? (
          <ErrorState
            error={error instanceof Error ? error : new Error("Unknown error")}
            onRetry={() => {
              void refetch();
            }}
          />
        ) : isEmpty ? (
          <EmptyState
            onRetry={() => {
              void refetch();
            }}
          />
        ) : data ? (
          <div className="flex flex-col h-full min-h-0">
            <PageHeader data={data} />
            <div className="flex-1 min-h-0">
              <PanelGroup
                direction="horizontal"
                autoSaveId="problem-solver-split"
                className="h-full"
              >
                <Panel
                  defaultSize={45}
                  minSize={25}
                  className="bg-background"
                >
                  <ProblemDetails data={data} />
                </Panel>
                <PanelResizeHandle className="w-1.5 bg-border/50 hover:bg-primary/40 transition-colors data-[resize-handle-state=drag]:bg-primary/60" />
                <Panel
                  defaultSize={55}
                  minSize={30}
                  className="bg-card"
                >
                  <CodeEditorPanel
                    questionId={data.problem.questionId}
                    theme={theme}
                    exampleTestcases={data.problem.exampleTestcases}
                  />
                </Panel>
              </PanelGroup>
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
