// ProblemSolver — LeetCode Daily Challenge page.
//
// Two-pane resizable layout (problem details on the left, Monaco Java editor
// + Wandbox Java Run & Compile runner on the right). Fetches the daily challenge
// via `useDailyChallenge`, which hits the `leetcode-daily` Supabase edge function.
//
// All editor state is autosaved to localStorage keyed by `questionId` so the
// user does not lose work on reload or accidental navigation.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code,
  Copy,
  ExternalLink,
  Lightbulb,
  Loader2,
  Maximize,
  MessageSquare,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  RotateCcw,
  Star,
  ThumbsUp,
  ThumbsDown,
  Trash2,
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
/* Constants                                                           */
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
    const missingImports = JAVA_AUTO_IMPORTS.filter(
      (statement) => !sourceCode.includes(statement),
    );
    let processedCode = missingImports.length
      ? `${missingImports.join("\n")}\n\n${sourceCode}`
      : sourceCode;

    processedCode = processedCode.replace(/public\s+class\s+/g, "class ");

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

    return { status: "success", output, executionTimeMs };
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
/* Micro-animation fade-in wrapper                                     */
/* ------------------------------------------------------------------ */

const fadeIn = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
};

/* ------------------------------------------------------------------ */
/* Code Editor + Test Cases Right Pane                                 */
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
  const [activeTestCase, setActiveTestCase] = useState(0);
  const editorRef = useRef<any>(null);

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
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      void handleRunCode();
    });
  };

  const isDark = theme === "dark";

  return (
    <PanelGroup
      direction="vertical"
      autoSaveId="editor-testcases-split-v2"
      className="h-full"
      style={{ background: isDark ? "#1a1a2e" : "#fafafa" }}
    >
      {/* ═════════ Editor Panel ═════════ */}
      <Panel defaultSize={62} minSize={30} className="flex flex-col min-h-0">
        {/* --- Editor Top Bar --- */}
        <div
          className="flex items-center justify-between px-3 py-1.5 shrink-0"
          style={{
            background: isDark
              ? "linear-gradient(180deg, rgba(30,30,55,1) 0%, rgba(26,26,46,1) 100%)"
              : "#f0f0f5",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
          }}
        >
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-semibold transition-all duration-200"
              style={{
                background: isDark
                  ? "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.12) 100%)"
                  : "rgba(99,102,241,0.08)",
                color: isDark ? "#a5b4fc" : "#6366f1",
                border: `1px solid ${isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)"}`,
              }}
            >
              <Code className="h-3.5 w-3.5" />
              Java 21
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyCode}
              className="h-7 w-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105"
              style={{
                color: copied ? "#34d399" : isDark ? "#94a3b8" : "#64748b",
                background: copied
                  ? isDark
                    ? "rgba(52,211,153,0.1)"
                    : "rgba(52,211,153,0.08)"
                  : "transparent",
              }}
              title="Copy code"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={handleResetCode}
              className="h-7 w-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105"
              style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              title="Reset to starter template"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <div
              className="w-px h-4 mx-1"
              style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)" }}
            />

            {/* Try button */}
            <button
              className="h-7 px-3 rounded-md text-xs font-bold transition-all duration-200 hover:scale-[1.02]"
              style={{
                color: "#f59e0b",
                background: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)",
                border: `1px solid rgba(245,158,11,0.15)`,
              }}
            >
              Try...
            </button>

            {/* Run Button (Rocket) */}
            <button
              onClick={() => { void handleRunCode(); }}
              disabled={isRunning}
              className="h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ml-1"
              style={{
                background: isRunning
                  ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                  : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                boxShadow: isRunning
                  ? "0 0 12px rgba(245,158,11,0.4), 0 2px 4px rgba(0,0,0,0.2)"
                  : "0 0 12px rgba(16,185,129,0.4), 0 2px 4px rgba(0,0,0,0.2)",
                color: "white",
              }}
              title="Run Code (Ctrl + Enter)"
            >
              {isRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Rocket className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* --- File Tabs --- */}
        <div
          className="flex items-center px-2 py-1 shrink-0 select-none"
          style={{
            background: isDark ? "rgba(26,26,46,0.8)" : "#f5f5f8",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-t-md text-xs font-medium cursor-pointer transition-colors duration-200"
            style={{
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              color: isDark ? "#e2e8f0" : "#1e293b",
              borderBottom: `2px solid ${isDark ? "#818cf8" : "#6366f1"}`,
            }}
          >
            Solution.java
          </div>
          <button
            className="h-6 w-6 ml-1 rounded flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ color: isDark ? "#64748b" : "#94a3b8" }}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* --- Monaco Editor --- */}
        <div className="flex-1 min-h-0 relative">
          <Editor
            height="100%"
            language="java"
            theme={isDark ? "vs-dark" : "light"}
            value={code}
            onChange={handleChange}
            onMount={handleMount}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
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

        {/* --- Editor Footer --- */}
        <div
          className="flex items-center justify-end px-3 py-1 shrink-0 select-none"
          style={{
            background: isDark ? "rgba(26,26,46,0.8)" : "#f5f5f8",
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1 text-[11px] font-mono cursor-pointer transition-colors duration-200"
              style={{ color: isDark ? "#64748b" : "#94a3b8" }}
            >
              14 <ChevronDown className="h-3 w-3" />
            </span>
            {[Code, Maximize].map((Icon, i) => (
              <Icon
                key={i}
                className="h-3.5 w-3.5 cursor-pointer transition-all duration-200 hover:scale-110"
                style={{ color: isDark ? "#64748b" : "#94a3b8" }}
              />
            ))}
          </div>
        </div>
      </Panel>

      {/* ═════════ Resize Handle ═════════ */}
      <PanelResizeHandle
        className="group shrink-0 flex items-center justify-center"
        style={{
          height: 6,
          background: isDark ? "#1a1a2e" : "#ebebf0",
          cursor: "row-resize",
        }}
      >
        <div
          className="w-8 h-1 rounded-full transition-all duration-300 group-hover:w-12"
          style={{
            background: isDark
              ? "rgba(255,255,255,0.12)"
              : "rgba(0,0,0,0.15)",
          }}
        />
      </PanelResizeHandle>

      {/* ═════════ Test Cases / Output Panel ═════════ */}
      <Panel defaultSize={38} minSize={15} className="flex flex-col min-h-0">
        {/* Test Cases Header */}
        <div
          className="flex items-center gap-3 px-3 pt-2 pb-0 shrink-0"
          style={{
            background: isDark ? "rgba(26,26,46,0.9)" : "#f5f5f8",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-bold transition-all duration-200"
            style={{
              background: isDark ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.06)",
              color: isDark ? "#c4b5fd" : "#7c3aed",
              borderBottom: `2px solid ${isDark ? "#8b5cf6" : "#7c3aed"}`,
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: isDark ? "#a78bfa" : "#8b5cf6" }} />
            Test Cases
          </button>

          {/* Run result status in header */}
          {isRunning && (
            <motion.div {...fadeIn} className="flex items-center gap-1.5 ml-auto">
              <Badge
                variant="outline"
                className="gap-1 text-[10px] font-semibold animate-pulse"
                style={{
                  background: "rgba(245,158,11,0.08)",
                  color: "#f59e0b",
                  borderColor: "rgba(245,158,11,0.2)",
                }}
              >
                <Loader2 className="h-3 w-3 animate-spin" /> Compiling…
              </Badge>
            </motion.div>
          )}
          {!isRunning && runResult && (
            <motion.div {...fadeIn} className="flex items-center gap-2 ml-auto">
              {runResult.status === "success" && (
                <Badge
                  variant="outline"
                  className="gap-1 text-[10px] font-semibold"
                  style={{
                    background: "rgba(16,185,129,0.08)",
                    color: "#34d399",
                    borderColor: "rgba(16,185,129,0.2)",
                  }}
                >
                  <CheckCircle2 className="h-3 w-3" /> Accepted
                </Badge>
              )}
              {runResult.status === "compile_error" && (
                <Badge
                  variant="outline"
                  className="gap-1 text-[10px] font-semibold"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    color: "#f87171",
                    borderColor: "rgba(239,68,68,0.2)",
                  }}
                >
                  <XCircle className="h-3 w-3" /> Compile Error
                </Badge>
              )}
              {runResult.status === "runtime_error" && (
                <Badge
                  variant="outline"
                  className="gap-1 text-[10px] font-semibold"
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    color: "#fbbf24",
                    borderColor: "rgba(245,158,11,0.2)",
                  }}
                >
                  <AlertTriangle className="h-3 w-3" /> Runtime Error
                </Badge>
              )}
              {runResult.status === "error" && (
                <Badge
                  variant="outline"
                  className="gap-1 text-[10px] font-semibold"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    color: "#f87171",
                    borderColor: "rgba(239,68,68,0.2)",
                  }}
                >
                  <XCircle className="h-3 w-3" /> Error
                </Badge>
              )}
              <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: "#64748b" }}>
                <Clock className="h-3 w-3" /> {runResult.executionTimeMs}ms
              </span>
            </motion.div>
          )}
        </div>

        {/* Test Cases Body */}
        <div
          className="flex-1 overflow-y-auto p-4"
          style={{ background: isDark ? "#16162a" : "#fafafa" }}
        >
          <AnimatePresence mode="wait">
            {isRunning ? (
              <motion.div
                key="running"
                {...fadeIn}
                className="flex flex-col items-center justify-center gap-3 py-8"
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center animate-pulse"
                  style={{
                    background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(251,191,36,0.1) 100%)",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#f59e0b" }} />
                </div>
                <span className="text-sm font-medium" style={{ color: "#f59e0b" }}>
                  Compiling & Running Java code…
                </span>
              </motion.div>
            ) : runResult ? (
              <motion.div key="result" {...fadeIn} className="space-y-4">
                {/* Clear button */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setRunResult(null)}
                    className="flex items-center gap-1 h-6 px-2 rounded text-[11px] font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      color: isDark ? "#64748b" : "#94a3b8",
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                    }}
                  >
                    <Trash2 className="h-3 w-3" /> Clear
                  </button>
                </div>

                {/* Output Block */}
                <div className="space-y-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.15em]"
                    style={{ color: isDark ? "#475569" : "#94a3b8" }}
                  >
                    Output
                  </span>
                  <div
                    className="p-4 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto"
                    style={{
                      background: isDark
                        ? "linear-gradient(135deg, rgba(30,30,55,0.8) 0%, rgba(22,22,42,0.9) 100%)"
                        : "#f0f0f5",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                      color:
                        runResult.status === "success"
                          ? "#34d399"
                          : runResult.status === "compile_error" || runResult.status === "error"
                            ? "#f87171"
                            : "#fbbf24",
                    }}
                  >
                    {runResult.output}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="testcases" {...fadeIn} className="space-y-5">
                {/* Case Tabs */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {["Case 1", "Case 2"].map((label, i) => (
                      <button
                        key={label}
                        onClick={() => setActiveTestCase(i)}
                        className="h-7 px-4 rounded-full text-xs font-semibold transition-all duration-300 hover:scale-[1.03]"
                        style={
                          activeTestCase === i
                            ? {
                                background: isDark
                                  ? "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(251,191,36,0.1) 100%)"
                                  : "rgba(245,158,11,0.1)",
                                color: "#f59e0b",
                                border: "1px solid rgba(245,158,11,0.25)",
                                boxShadow: "0 0 8px rgba(245,158,11,0.15)",
                              }
                            : {
                                background: "transparent",
                                color: isDark ? "#64748b" : "#94a3b8",
                                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
                              }
                        }
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      className="h-7 w-7 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                      style={{
                        color: isDark ? "#475569" : "#94a3b8",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      color: isDark ? "#64748b" : "#94a3b8",
                      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                    }}
                  >
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                </div>

                {/* Input Content */}
                <div className="space-y-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.15em]"
                    style={{ color: isDark ? "#475569" : "#94a3b8" }}
                  >
                    Input
                  </span>
                  <div
                    className="p-4 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto"
                    style={{
                      background: isDark
                        ? "linear-gradient(135deg, rgba(30,30,55,0.8) 0%, rgba(22,22,42,0.9) 100%)"
                        : "#f0f0f5",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                      color: isDark ? "#cbd5e1" : "#334155",
                    }}
                  >
                    {exampleTestcases || "No testcases provided."}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Alert variant="destructive" className="max-w-xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Couldn't load today's challenge</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            {error.message || "Something went wrong fetching the LeetCode daily challenge."}
          </p>
          <p className="mb-4 text-xs opacity-80">
            The backend service may be temporarily unavailable. You can still open today's problem on LeetCode directly.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={onRetry} variant="outline">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
            </Button>
            <Button size="sm" asChild variant="secondary">
              <a href="https://leetcode.com/problemset/" target="_blank" rel="noopener noreferrer">
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
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Alert className="max-w-xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No challenge available</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            LeetCode hasn't published a daily challenge yet, or the upstream service returned an unexpected empty payload.
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
/* Left Panel: Problem Description                                     */
/* ------------------------------------------------------------------ */

const LEFT_TABS = [
  { label: "Description", icon: "📄" },
  { label: "Editorial", icon: "📖" },
  { label: "Submissions", icon: "⏱" },
  { label: "Discussion", icon: "💬" },
] as const;

function ProblemDetails({ data }: { data: DailyChallengeResponse }) {
  const { problem, stale } = data;
  const [activeTab, setActiveTab] = useState(0);
  const [hintsOpen, setHintsOpen] = useState(false);

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: isDark ? "#16162a" : "#ffffff" }}>
      {/* ── Top Tabs ── */}
      <div
        className="flex items-center shrink-0 select-none overflow-x-auto"
        style={{
          background: isDark
            ? "linear-gradient(180deg, rgba(30,30,55,1) 0%, rgba(22,22,42,1) 100%)"
            : "linear-gradient(180deg, #f8f8fc 0%, #f0f0f5 100%)",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        {LEFT_TABS.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className="flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-all duration-300 relative whitespace-nowrap"
            style={{
              color:
                activeTab === i
                  ? isDark
                    ? "#fbbf24"
                    : "#d97706"
                  : isDark
                    ? "#64748b"
                    : "#94a3b8",
              fontWeight: activeTab === i ? 700 : 500,
            }}
          >
            <span className="text-sm">{tab.icon}</span>
            {tab.label}
            {activeTab === i && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                style={{
                  background: isDark
                    ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                    : "linear-gradient(90deg, #d97706, #f59e0b)",
                }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        <div className="p-6 space-y-6">
          {/* Title */}
          <motion.div {...fadeIn} className="space-y-4">
            <h1
              className="text-2xl font-bold tracking-tight leading-tight"
              style={{
                fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                color: isDark ? "#f1f5f9" : "#0f172a",
              }}
            >
              {problem.title}
            </h1>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Difficulty */}
              <span
                className="inline-flex items-center h-6 px-3 rounded-full text-xs font-bold tracking-wide"
                style={
                  problem.difficulty === "Hard"
                    ? {
                        background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)",
                        color: isDark ? "#f87171" : "#dc2626",
                        border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)"}`,
                      }
                    : problem.difficulty === "Medium"
                      ? {
                          background: isDark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.08)",
                          color: isDark ? "#fbbf24" : "#d97706",
                          border: `1px solid ${isDark ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.15)"}`,
                        }
                      : {
                          background: isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)",
                          color: isDark ? "#34d399" : "#059669",
                          border: `1px solid ${isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.15)"}`,
                        }
                }
              >
                {problem.difficulty}
              </span>

              {/* Hints */}
              {problem.hints && problem.hints.length > 0 && (
                <button
                  onClick={() => setHintsOpen(!hintsOpen)}
                  className="inline-flex items-center gap-1 h-6 px-3 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-[1.03]"
                  style={{
                    background: isDark ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.06)",
                    color: isDark ? "#a78bfa" : "#7c3aed",
                    border: `1px solid ${isDark ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.12)"}`,
                  }}
                >
                  <Lightbulb className="h-3 w-3" /> Hints
                </button>
              )}

              {/* Company */}
              <span
                className="inline-flex items-center h-6 px-3 rounded-full text-xs font-semibold"
                style={{
                  background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)",
                  color: isDark ? "#818cf8" : "#6366f1",
                  border: `1px solid ${isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.12)"}`,
                }}
              >
                Company
              </span>

              {/* Topics */}
              {problem.topicTags.length > 0 && problem.topicTags.slice(0, 3).map((t) => (
                <span
                  key={t.name}
                  className="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-medium"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                    color: isDark ? "#94a3b8" : "#64748b",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  }}
                >
                  {t.name}
                </span>
              ))}

              {stale && (
                <span
                  className="inline-flex items-center h-6 px-3 rounded-full text-[10px] font-bold ml-auto"
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245,158,11,0.15)",
                  }}
                >
                  Cached
                </span>
              )}
            </div>
          </motion.div>

          {/* Hints Collapsible */}
          <AnimatePresence>
            {hintsOpen && problem.hints && problem.hints.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div
                  className="p-4 rounded-xl space-y-2"
                  style={{
                    background: isDark ? "rgba(139,92,246,0.05)" : "rgba(139,92,246,0.03)",
                    border: `1px solid ${isDark ? "rgba(139,92,246,0.12)" : "rgba(139,92,246,0.1)"}`,
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "#a78bfa" }}>
                    Hints
                  </span>
                  <ol className="space-y-2 text-sm list-decimal pl-5">
                    {problem.hints.map((h, i) => (
                      <li
                        key={i}
                        dangerouslySetInnerHTML={{ __html: h }}
                        className="[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_code]:text-primary"
                        style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                      />
                    ))}
                  </ol>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Problem Description Body */}
          <motion.section
            {...fadeIn}
            className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
              prose-p:leading-relaxed prose-p:my-3
              prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:p-4 prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:border prose-pre:border-white/5
              prose-code:before:content-none prose-code:after:content-none
              prose-code:bg-muted/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-xs prose-code:text-primary prose-code:font-semibold
              prose-strong:text-foreground prose-strong:font-bold
              prose-ul:my-3 prose-ol:my-3 prose-li:my-1
              [&_.example-block]:p-4 [&_.example-block]:my-3 [&_.example-block]:rounded-xl [&_.example-block]:bg-muted/40 [&_.example-block]:border [&_.example-block]:border-border/50
              [&_.example-io]:font-mono [&_.example-io]:text-xs [&_.example-io]:font-semibold [&_.example-io]:text-primary"
          >
            <div dangerouslySetInnerHTML={{ __html: problem.content }} />
          </motion.section>
        </div>
      </div>

      {/* ── Bottom Toolbar ── */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0 select-none"
        style={{
          background: isDark
            ? "linear-gradient(180deg, rgba(22,22,42,1) 0%, rgba(26,26,46,1) 100%)"
            : "linear-gradient(180deg, #f8f8fc 0%, #f0f0f5 100%)",
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        <div className="flex items-center gap-1">
          {/* Thumbs Up */}
          <button
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-[1.05]"
            style={{
              color: isDark ? "#fbbf24" : "#d97706",
              background: isDark ? "rgba(251,191,36,0.06)" : "rgba(217,119,6,0.04)",
            }}
          >
            <ThumbsUp className="h-4 w-4" style={{ fill: isDark ? "rgba(251,191,36,0.2)" : "rgba(217,119,6,0.15)" }} />
            17
          </button>

          {/* Thumbs Down */}
          <button
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-[1.1]"
            style={{ color: isDark ? "#475569" : "#94a3b8" }}
          >
            <ThumbsDown className="h-4 w-4" />
          </button>

          {/* Star */}
          <button
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-[1.1]"
            style={{ color: isDark ? "#475569" : "#94a3b8" }}
          >
            <Star className="h-4 w-4" />
          </button>

          {/* Open on LeetCode */}
          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-[1.1]"
            style={{ color: isDark ? "#475569" : "#94a3b8" }}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-[1.1]"
            style={{ color: isDark ? "#475569" : "#94a3b8" }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          <div
            className="w-px h-5 mx-1"
            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)" }}
          />

          <Link
            to="/"
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-[1.1]"
            style={{ color: isDark ? "#64748b" : "#94a3b8" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <button
            disabled
            className="h-8 w-8 rounded-lg flex items-center justify-center opacity-30 cursor-not-allowed"
            style={{ color: isDark ? "#64748b" : "#94a3b8" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
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
  const isEmpty = !!data && !data.problem?.questionId;

  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-full min-h-0"
      style={{ background: isDark ? "#0f0f23" : "#f5f5fa" }}
    >
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <ProblemSkeleton />
        ) : isError ? (
          <ErrorState
            error={error instanceof Error ? error : new Error("Unknown error")}
            onRetry={() => { void refetch(); }}
          />
        ) : isEmpty ? (
          <EmptyState onRetry={() => { void refetch(); }} />
        ) : data ? (
          <PanelGroup
            direction="horizontal"
            autoSaveId="problem-solver-split-v3"
            className="h-full w-full overflow-hidden"
          >
            <Panel defaultSize={45} minSize={25}>
              <ProblemDetails data={data} />
            </Panel>

            <PanelResizeHandle className="group flex items-center justify-center" style={{ width: 6 }}>
              <div
                className="h-8 w-1 rounded-full transition-all duration-300 group-hover:h-12"
                style={{
                  background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)",
                }}
              />
            </PanelResizeHandle>

            <Panel defaultSize={55} minSize={30}>
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
