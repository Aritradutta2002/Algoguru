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
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  Hash,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Rocket,
  Maximize,
  Settings,
  Layout,
  Tag,
  Terminal,
  Trash2,
  Trophy,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Star,
  MessageSquare,
  MoreHorizontal,
  FileText,
  BookOpen,
  Layers,
  Code
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
/* Code Editor & Test Cases Pane Components                           */
/* ------------------------------------------------------------------ */

function CodeEditorPane({
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
    <PanelGroup direction="vertical" autoSaveId="editor-testcases-split" className="h-full bg-[#1e1e1e]">
      <Panel defaultSize={60} minSize={30} className="flex flex-col h-full min-h-0 bg-[#1e1e1e]">
        {/* Editor Header / Action Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/20 bg-[#1e1e1e] shrink-0">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 font-medium bg-muted/20 hover:bg-muted/30 text-muted-foreground">
              Java 21 <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCopyCode}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Copy code"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleResetCode}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Reset code"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <div className="w-px h-4 bg-border/40 mx-1" />
            <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 font-medium">
              Try...
            </Button>
            <Button
              size="icon"
              onClick={() => { void handleRunCode(); }}
              disabled={isRunning}
              className="h-7 w-7 bg-emerald-600 hover:bg-emerald-500 text-white ml-1 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              title="Run Code (Ctrl + Enter)"
            >
              {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Editor File Tabs */}
        <div className="flex items-center px-2 py-1 bg-[#1e1e1e] border-b border-border/10 shrink-0 select-none">
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#2d2d2d] text-xs font-medium text-foreground cursor-pointer">
            Tab-1
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground">
            +
          </Button>
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
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
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

        {/* Editor Settings Footer */}
        <div className="flex items-center justify-end px-3 py-1.5 border-t border-border/20 bg-[#1e1e1e] shrink-0 text-muted-foreground select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] font-mono cursor-pointer hover:text-foreground">
              14 <ChevronDown className="h-3 w-3" />
            </span>
            <Code className="h-3.5 w-3.5 cursor-pointer hover:text-foreground" />
            <Layout className="h-3.5 w-3.5 cursor-pointer hover:text-foreground" />
            <Maximize className="h-3.5 w-3.5 cursor-pointer hover:text-foreground" />
          </div>
        </div>
      </Panel>

      <PanelResizeHandle className="h-1.5 bg-[#2d2d2d] hover:bg-primary/40 transition-colors data-[resize-handle-state=drag]:bg-primary/60 shrink-0" />

      {/* Bottom Panel: Test Cases & Output */}
      <Panel defaultSize={40} minSize={20} className="flex flex-col h-full min-h-0 bg-[#1e1e1e]">
        {/* Test Cases Header */}
        <div className="flex items-center gap-2 px-3 pt-2 shrink-0 border-b border-border/10 bg-[#1e1e1e]">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-t-md bg-[#2d2d2d] text-xs font-semibold text-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" /> Test Cases
          </button>
        </div>

        {/* Output & Test Cases Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Output / Execution result override (if we ran code) */}
          {isRunning ? (
            <div className="flex items-center gap-2 text-amber-400 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Compiling & Executing...</span>
            </div>
          ) : runResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {runResult.status === "success" && (
                    <Badge variant="outline" className="gap-1 text-[11px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Success
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
                <Button size="sm" variant="ghost" onClick={() => setRunResult(null)} className="h-7 text-xs text-muted-foreground">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              </div>

              <div className="space-y-1.5 select-text">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                  OUTPUT
                </div>
                <div className="p-3 rounded-lg bg-[#2a2a2a] border border-border/10 text-zinc-300 font-mono text-xs whitespace-pre-wrap">
                  {runResult.status === "compile_error" ? (
                    <span className="text-rose-400">{runResult.output}</span>
                  ) : runResult.status === "runtime_error" ? (
                    <span className="text-amber-300">{runResult.output}</span>
                  ) : runResult.status === "error" ? (
                    <span className="text-rose-400">{runResult.output}</span>
                  ) : (
                    <span className="text-emerald-300">{runResult.output}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Default Test Cases View
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" className="h-7 text-xs bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-full px-4 border border-amber-500/30">
                    Case 1
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs border border-border/30 text-muted-foreground rounded-full px-4 hover:text-foreground">
                    Case 2
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 border border-border/30 text-muted-foreground rounded-full hover:text-foreground">
                    +
                  </Button>
                </div>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground gap-1.5 hover:text-foreground">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                    RAW INPUT (EXAMPLE TESTCASES)
                  </div>
                  <div className="p-3 rounded-lg bg-[#2a2a2a] border border-border/10 text-zinc-300 font-mono text-xs whitespace-pre-wrap">
                    {exampleTestcases || "No testcases provided."}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Panel>
    </PanelGroup>
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
/* Problem details pane                                                */
/* ------------------------------------------------------------------ */

function ProblemDetails({ data }: { data: DailyChallengeResponse }) {
  const { problem, stale } = data;
  
  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Top Tabs */}
      <div className="flex items-center gap-6 px-4 pt-2 border-b border-border/40 shrink-0">
        <button className="flex items-center gap-1.5 pb-2 border-b-2 border-amber-500 text-sm font-semibold text-amber-500">
          <FileText className="h-4 w-4" /> Description
        </button>
        <button className="flex items-center gap-1.5 pb-2 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground">
          <BookOpen className="h-4 w-4" /> Editorial
        </button>
        <button className="flex items-center gap-1.5 pb-2 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground">
          <Clock className="h-4 w-4" /> Submissions
        </button>
        <button className="flex items-center gap-1.5 pb-2 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground">
          <MessageSquare className="h-4 w-4" /> Discussion
        </button>
      </div>

      {/* Problem Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">
            {problem.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={difficultyClasses(problem.difficulty)} variant="outline">
              {problem.difficulty}
            </Badge>
            <Badge variant="secondary" className="text-xs font-medium">
              Hints
            </Badge>
            <Badge variant="secondary" className="text-xs font-medium">
              Company
            </Badge>
            
            {stale && (
              <Badge variant="outline" className="text-[10px] text-amber-600 ml-auto">
                Cached (offline)
              </Badge>
            )}
          </div>
        </div>

        {/* Problem Description Body */}
        <section
          className="prose prose-sm dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
            prose-p:leading-relaxed prose-p:my-3
            prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:p-3.5 prose-pre:rounded-xl prose-pre:border prose-pre:border-border/50 prose-pre:overflow-x-auto
            prose-code:before:content-none prose-code:after:content-none
            prose-code:bg-muted/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs prose-code:text-primary
            prose-strong:text-foreground
            prose-ul:my-3 prose-ol:my-3 prose-li:my-1
            [&_.example-block]:p-4 [&_.example-block]:my-3 [&_.example-block]:rounded-xl [&_.example-block]:bg-muted/40 [&_.example-block]:border [&_.example-block]:border-border/50
            [&_.example-io]:font-mono [&_.example-io]:text-xs [&_.example-io]:font-semibold [&_.example-io]:text-primary"
        >
          <div dangerouslySetInnerHTML={{ __html: problem.content }} />
        </section>
      </div>

      {/* Bottom Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 bg-background shrink-0">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 hover:text-foreground">
            <ThumbsUp className="h-4 w-4 text-amber-500 fill-amber-500/20" /> 17
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-foreground">
            <ThumbsDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-foreground">
            <Star className="h-4 w-4" />
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-8 px-2 hover:text-foreground">
            <a href={problem.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 border-l border-border/50 pl-2">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 hover:text-foreground">
              <Link to="/">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-foreground" disabled>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function ProblemSolver() {
  const { theme } = useSettings();
  const { data, isLoading, isError, error, refetch } = useDailyChallenge();

  // Defensive: treat a payload with no `questionId` as "empty".
  const isEmpty = !!data && !data.problem?.questionId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-full min-h-0"
    >
      {/* Top nav bar was removed to match the LeetCode layout which integrates it into panels. */}
      {/* We are placing the problem layout directly taking the full vertical space. */}

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
          <PanelGroup
            direction="horizontal"
            autoSaveId="problem-solver-split-v2"
            className="h-full w-full overflow-hidden"
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
              <CodeEditorPane
                questionId={data.problem.questionId}
                theme={theme}
                exampleTestcases={data.problem.exampleTestcases}
              />
            </Panel>
          </PanelGroup>
        ) : null}
      </div>
    </motion.div>
  );
}
