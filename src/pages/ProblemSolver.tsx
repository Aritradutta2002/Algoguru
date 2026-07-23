// ProblemSolver — LeetCode Daily Challenge page.
//
// Two-pane resizable layout (problem details on the left, Monaco Java editor
// + Wandbox Java Run & Compile runner on the right). Fetches the daily challenge
// via `useDailyChallenge`, which hits the `leetcode-daily` Supabase edge function.
//
// User code is persisted to Supabase `daily_challenge_user_code` for logged-in
// users, with localStorage as a fallback for guests.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  Code,
  Copy,
  ExternalLink,
  Lightbulb,
  Loader2,
  Maximize,
  Plus,
  RefreshCw,
  Rocket,
  RotateCcw,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GuruBot } from "@/components/GuruBot";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailyChallengeResponse } from "@/types/leetcode";
import * as prettier from "prettier/standalone";
import * as prettierPluginJava from "prettier-plugin-java";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";

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
/* Code persistence: Supabase (logged-in) + localStorage (fallback)   */
/* ------------------------------------------------------------------ */

function lsKey(questionId: string): string {
  return `problem_solver_java_code_${questionId}`;
}

function readLocalCode(questionId: string): string | null {
  try {
    return localStorage.getItem(lsKey(questionId));
  } catch {
    return null;
  }
}

function writeLocalCode(questionId: string, code: string): void {
  try {
    localStorage.setItem(lsKey(questionId), code);
  } catch {
    /* quota / private mode — silently ignore */
  }
}

const loadNumberSetting = (key: string, fallback: number) => {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return Number(val);
  } catch (e) {}
  return fallback;
};

/** Load saved code: DB first (if logged-in), then localStorage fallback. */
async function loadCode(
  questionId: string,
  userId: string | null,
): Promise<string | null> {
  if (userId) {
    try {
      const { data } = await supabase
        .from("daily_challenge_user_code")
        .select("code")
        .eq("user_id", userId)
        .eq("question_id", questionId)
        .maybeSingle();
      if (data?.code) return data.code;
    } catch {
      /* DB unavailable — fall through to localStorage */
    }
  }
  return readLocalCode(questionId);
}

/** Persist code: write to both DB (if logged-in) and localStorage. */
async function persistCode(
  questionId: string,
  code: string,
  userId: string | null,
): Promise<void> {
  writeLocalCode(questionId, code);
  if (userId) {
    try {
      await supabase
        .from("daily_challenge_user_code")
        .upsert(
          { user_id: userId, question_id: questionId, code, updated_at: new Date().toISOString() },
          { onConflict: "user_id,question_id" },
        );
    } catch {
      /* DB write failed — localStorage already saved above */
    }
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

async function runJavaCode(sourceCode: string, stdin: string = ""): Promise<RunResult> {
  const startTime = Date.now();

  try {
    const missingImports = JAVA_AUTO_IMPORTS.filter(
      (s) => !sourceCode.includes(s),
    );
    let proc = missingImports.length
      ? `${missingImports.join("\n")}\n\n${sourceCode}`
      : sourceCode;

    proc = proc.replace(/public\s+class\s+/g, "class ");

    if (!/\bvoid\s+main\b/.test(proc)) {
      proc += `\n\nclass Main {\n    public static void main(String[] args) {\n        System.out.println("=== Java Compilation & Syntax Check Successful ===");\n        System.out.println("Tip: Add a main method to test your solution!");\n    }\n}`;
    }

    const res = await fetch(WANDBOX_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler: "openjdk-jdk-21+35",
        code: proc,
        stdin: stdin,
        "compiler-option-raw": "",
        "runtime-option-raw": "",
        save: false,
      }),
    });

    const ms = Date.now() - startTime;

    if (!res.ok) {
      return { status: "error", output: `HTTP ${res.status}: ${await res.text()}`, executionTimeMs: ms };
    }

    const d = (await res.json()) as Record<string, string | undefined>;

    if (d.compiler_error || d.compiler_message) {
      const msg = (d.compiler_error || d.compiler_message || "").trim();
      if (msg) return { status: "compile_error", output: msg, compilerMessage: msg, executionTimeMs: ms };
    }

    if (d.program_error?.trim()) {
      return {
        status: "runtime_error",
        output: `${d.program_output ? d.program_output + "\n" : ""}[Runtime Error]\n${d.program_error}`,
        executionTimeMs: ms,
      };
    }

    return {
      status: "success",
      output: d.program_output || d.program_message || "Program executed (no output).",
      executionTimeMs: ms,
    };
  } catch (err) {
    return {
      status: "error",
      output: `Could not connect to compiler.\n${err instanceof Error ? err.message : String(err)}`,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

/* ------------------------------------------------------------------ */
/* Editorial Code Block Helper                                         */
/* ------------------------------------------------------------------ */

/** Recursively extract text from React children (handles nested elements from rehype-raw). */
function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    return extractText((node as React.ReactElement).props.children);
  }
  return "";
}

function EditorialCodeBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace("language-", "") || "text";
  const codeText = extractText(children).replace(/\n$/, "");

  return (
    <div className="my-5 rounded-2xl overflow-hidden border border-border/40 shadow-xl bg-[#0D0D0D]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border/20">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
          {lang}
        </span>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(codeText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all hover:bg-white/10 text-muted-foreground hover:text-white min-h-[32px] active:scale-95"
        >
          {copied ? (
            <Check size={13} className="text-emerald-400" />
          ) : (
            <Copy size={13} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="text-[13.5px] leading-[1.6] font-mono overflow-x-auto">
        <SyntaxHighlighter
          language={lang}
          style={oneDark}
          customStyle={{
            margin: 0,
            border: "none",
            background: "transparent",
            padding: "1.25rem",
          }}
          wrapLongLines={false}
        >
          {codeText}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Micro-animation helpers                                             */
/* ------------------------------------------------------------------ */

const fadeIn = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
};

/* ------------------------------------------------------------------ */
/* Code Editor + Test Cases (Right Pane)                               */
/* ------------------------------------------------------------------ */

interface FileTab {
  id: string;
  name: string;
  content: string;
}

function CodeEditorPane({
  questionId,
  theme,
  exampleTestcases,
}: {
  questionId: string;
  theme: "dark" | "light";
  exampleTestcases?: string;
}) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [tabs, setTabs] = useState<FileTab[]>([{ id: "1", name: "Solution.java", content: DEFAULT_JAVA_TEMPLATE }]);
  const [activeTabId, setActiveTabId] = useState<string>("1");
  const code = tabs.find((t) => t.id === activeTabId)?.content ?? "";

  const setCode = useCallback(
    (newContent: string) => {
      setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, content: newContent } : t)));
    },
    [activeTabId],
  );

  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFormatted, setIsFormatted] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const editorRef = useRef<any>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [codeLoaded, setCodeLoaded] = useState(false);
  const [testcaseTabs, setTestcaseTabs] = useState<{ id: string, name: string, value: string }[]>(() => [
    { id: "1", name: "Case 1", value: exampleTestcases?.replace(/\\n/g, "\n") || "" }
  ]);
  const [activeTestcaseId, setActiveTestcaseId] = useState<string>("1");
  const [editorFontSize, setEditorFontSize] = useState(() => loadNumberSetting("problem-solver-font-size", 14));

  useEffect(() => {
    localStorage.setItem("problem-solver-font-size", String(editorFontSize));
  }, [editorFontSize]);

  // Update local testcases if exampleTestcases changes (e.g., new daily challenge)
  useEffect(() => {
    setTestcaseTabs([{ id: "1", name: "Case 1", value: exampleTestcases?.replace(/\\n/g, "\n") || "" }]);
    setActiveTestcaseId("1");
  }, [exampleTestcases]);

  // Load saved code from DB / localStorage on mount or question change
  useEffect(() => {
    let cancelled = false;
    setCodeLoaded(false);
    loadCode(questionId, userId).then((saved) => {
      if (!cancelled) {
        let parsedTabs: FileTab[] = [{ id: "1", name: "Solution.java", content: saved ?? DEFAULT_JAVA_TEMPLATE }];
        try {
          if (saved && saved.startsWith("[")) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsedTabs = parsed;
            }
          }
        } catch (e) {}
        
        setTabs(parsedTabs);
        setActiveTabId(parsedTabs[0].id);
        setRunResult(null);
        setCodeLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [questionId, userId]);

  const handleChange = useCallback(
    (value: string | undefined) => {
      const next = value ?? "";
      setCode(next);

      // Debounce DB writes to avoid hammering Supabase on every keystroke
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setTabs((currentTabs) => {
          const updatedTabs = currentTabs.map((t) => (t.id === activeTabId ? { ...t, content: next } : t));
          void persistCode(questionId, JSON.stringify(updatedTabs), userId);
          return updatedTabs;
        });
      }, 1500);
    },
    [questionId, userId, activeTabId],
  );

  const handleResetCode = useCallback(() => {
    setCode(DEFAULT_JAVA_TEMPLATE);
    setRunResult(null);
    setTabs((currentTabs) => {
      const updatedTabs = currentTabs.map((t) => (t.id === activeTabId ? { ...t, content: DEFAULT_JAVA_TEMPLATE } : t));
      void persistCode(questionId, JSON.stringify(updatedTabs), userId);
      return updatedTabs;
    });
  }, [questionId, userId, activeTabId]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    // Combine all tabs into one payload
    const combinedCode = tabs.map((t) => `// --- ${t.name} ---\n${t.content}`).join("\n\n");
    const currentTestcase = testcaseTabs.find((t) => t.id === activeTestcaseId)?.value || "";
    const result = await runJavaCode(combinedCode, currentTestcase);
    setRunResult(result);
    setIsRunning(false);
  }, [tabs, testcaseTabs, activeTestcaseId]);

  const formatCode = useCallback(async () => {
    const raw = code;
    if (!raw.trim()) return;
    try {
      const formatted = await prettier.format(raw, {
        parser: "java",
        plugins: [prettierPluginJava, (prettierPluginJava as any)?.default || {}],
      });
      setCode(formatted);
      setIsFormatted(true);
      setTimeout(() => setIsFormatted(false), 2000);
    } catch (error) {
      console.error("Formatting error:", error);
    }
  }, [code]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      void handleRunCode();
    });
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
      void formatCode();
    });
  };

  const isDark = theme === "dark";

  return (
    <PanelGroup
      direction="vertical"
      autoSaveId="editor-testcases-split-v3"
      className="h-full"
      style={{ background: "transparent" }}
    >
      {/* ═════════ Editor Panel ═════════ */}
      <Panel defaultSize={62} minSize={30} className="flex flex-col min-h-0 rounded-xl overflow-hidden shadow-sm" style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
        <div className="flex flex-col h-full" style={{ background: isDark ? "#16162a" : "#ffffff" }}>
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
          {/* Language label (static — only Java supported) */}
          <div className="flex items-center gap-2">
            <span
              className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-semibold"
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
            </span>
          </div>

          {/* Functional actions only */}
          <div className="flex items-center gap-1">
            {/* Copy */}
            <button
              onClick={handleCopyCode}
              className="h-7 w-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105"
              style={{
                color: copied ? "#34d399" : isDark ? "#94a3b8" : "#64748b",
                background: copied
                  ? isDark ? "rgba(52,211,153,0.1)" : "rgba(52,211,153,0.08)"
                  : "transparent",
              }}
              title="Copy code to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>

            {/* Format */}
            <button
              onClick={() => { void formatCode(); }}
              className="h-7 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-[1.02]"
              style={{
                color: isFormatted ? "#34d399" : isDark ? "#94a3b8" : "#64748b",
                background: isFormatted
                  ? isDark ? "rgba(52,211,153,0.1)" : "rgba(52,211,153,0.08)"
                  : "transparent",
              }}
              title="Format Code (Shift+Alt+F)"
            >
              {isFormatted ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Formatted</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={14} height={14} fill="currentColor">
                    <path d="M64 128C64 92.7 92.7 64 128 64L416 64C451.3 64 480 92.7 480 128L496 128C540.2 128 576 163.8 576 208L576 304C576 348.2 540.2 384 496 384L336 384C327.2 384 320 391.2 320 400L320 418.7C338.6 425.3 352 443.1 352 464L352 560C352 586.5 330.5 608 304 608L272 608C245.5 608 224 586.5 224 560L224 464C224 443.1 237.4 425.3 256 418.7L256 400C256 355.8 291.8 320 336 320L496 320C504.8 320 512 312.8 512 304L512 208C512 199.2 504.8 192 496 192L480 192C480 227.3 451.3 256 416 256L128 256C92.7 256 64 227.3 64 192L64 128z"/>
                  </svg>
                  <span className="text-xs font-medium">Format</span>
                </>
              )}
            </button>

            {/* Reset */}
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

            {/* Run (Rocket) */}
            <button
              onClick={() => { void handleRunCode(); }}
              disabled={isRunning}
              className="h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="flex items-center px-2 py-1 shrink-0 select-none overflow-x-auto"
          style={{
            background: isDark ? "rgba(26,26,46,0.8)" : "#f5f5f8",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`,
            scrollbarWidth: "none",
          }}
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className="group flex items-center gap-1.5 px-3 py-1 rounded-t-md text-xs font-medium cursor-pointer transition-all min-w-max"
              style={{
                background: activeTabId === tab.id
                  ? isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
                  : "transparent",
                color: activeTabId === tab.id
                  ? isDark ? "#e2e8f0" : "#1e293b"
                  : isDark ? "#94a3b8" : "#64748b",
                borderBottom: activeTabId === tab.id ? `2px solid ${isDark ? "#818cf8" : "#6366f1"}` : "2px solid transparent",
              }}
            >
              {tab.name}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newTabs = tabs.filter((t) => t.id !== tab.id);
                    setTabs(newTabs);
                    if (activeTabId === tab.id) {
                      setActiveTabId(newTabs[newTabs.length - 1].id);
                    }
                    void persistCode(questionId, JSON.stringify(newTabs), userId);
                  }}
                  className="p-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={() => {
              const newId = String(Date.now());
              const name = `Helper${tabs.length}.java`;
              const newTabs = [...tabs, { id: newId, name, content: "class " + name.replace(".java", "") + " {\n\n}\n" }];
              setTabs(newTabs);
              setActiveTabId(newId);
              void persistCode(questionId, JSON.stringify(newTabs), userId);
            }}
            className="ml-2 p-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* --- Monaco Editor --- */}
        <div className="flex-1 min-h-0 relative">
          {!codeLoaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: isDark ? "#1a1a2e" : "#fafafa" }}>
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: isDark ? "#64748b" : "#94a3b8" }} />
            </div>
          )}
          <Editor
            height="100%"
            language="java"
            theme={isDark ? "vs-dark" : "light"}
            value={code}
            onChange={handleChange}
            onMount={handleMount}
            options={{
              fontSize: editorFontSize,
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
          className="flex items-center justify-between px-3 py-1 shrink-0 select-none"
          style={{
            background: isDark ? "rgba(26,26,46,0.8)" : "#f5f5f8",
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
              Font Size
            </span>
            <select
              value={editorFontSize}
              onChange={(e) => setEditorFontSize(Number(e.target.value))}
              className="h-5 px-1 rounded text-[10px] font-mono outline-none dark:bg-zinc-800 dark:text-zinc-200 bg-white text-zinc-800"
              style={{
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              {[12, 14, 16, 18, 20].map((size) => (
                <option key={size} value={size} className="dark:bg-zinc-800 dark:text-zinc-200 bg-white text-zinc-800">{size}px</option>
              ))}
            </select>
          </div>
        </div>
        </div>
      </Panel>

      {/* ═════════ Resize Handle ═════════ */}
      <PanelResizeHandle
        className="group shrink-0 flex items-center justify-center relative z-50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        style={{ height: 16, cursor: "row-resize", background: "transparent" }}
      >
        <div
          className="w-12 h-1.5 rounded-full transition-all duration-300 group-hover:w-16 group-hover:bg-primary/50"
          style={{ background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)" }}
        />
      </PanelResizeHandle>

      {/* ═════════ Test Cases / Output Panel ═════════ */}
      <Panel defaultSize={38} minSize={15} className="flex flex-col min-h-0 rounded-xl overflow-hidden shadow-sm" style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
        <div className="flex flex-col h-full" style={{ background: isDark ? "#16162a" : "#ffffff" }}>
        {/* Header */}
        <div
          className="flex items-center gap-3 px-3 pt-2 pb-0 shrink-0"
          style={{
            background: isDark ? "rgba(26,26,46,0.9)" : "#f5f5f8",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-bold"
            style={{
              background: isDark ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.06)",
              color: isDark ? "#c4b5fd" : "#7c3aed",
              borderBottom: `2px solid ${isDark ? "#8b5cf6" : "#7c3aed"}`,
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: isDark ? "#a78bfa" : "#8b5cf6" }} />
            Test Cases
          </span>

          {/* Run status badges */}
          {isRunning && (
            <motion.div {...fadeIn} className="ml-auto">
              <Badge
                variant="outline"
                className="gap-1 text-[10px] font-semibold animate-pulse"
                style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", borderColor: "rgba(245,158,11,0.2)" }}
              >
                <Loader2 className="h-3 w-3 animate-spin" /> Compiling…
              </Badge>
            </motion.div>
          )}
          {!isRunning && runResult && (
            <motion.div {...fadeIn} className="flex items-center gap-2 ml-auto">
              <Badge
                variant="outline"
                className="gap-1 text-[10px] font-semibold"
                style={
                  runResult.status === "success"
                    ? { background: "rgba(16,185,129,0.08)", color: "#34d399", borderColor: "rgba(16,185,129,0.2)" }
                    : runResult.status === "compile_error" || runResult.status === "error"
                      ? { background: "rgba(239,68,68,0.08)", color: "#f87171", borderColor: "rgba(239,68,68,0.2)" }
                      : { background: "rgba(245,158,11,0.08)", color: "#fbbf24", borderColor: "rgba(245,158,11,0.2)" }
                }
              >
                {runResult.status === "success" ? (
                  <><CheckCircle2 className="h-3 w-3" /> Accepted</>
                ) : runResult.status === "compile_error" ? (
                  <><XCircle className="h-3 w-3" /> Compile Error</>
                ) : runResult.status === "runtime_error" ? (
                  <><AlertTriangle className="h-3 w-3" /> Runtime Error</>
                ) : (
                  <><XCircle className="h-3 w-3" /> Error</>
                )}
              </Badge>
              <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: "#64748b" }}>
                <Clock className="h-3 w-3" /> {runResult.executionTimeMs}ms
              </span>
            </motion.div>
          )}
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto p-4"
          style={{ background: isDark ? "#16162a" : "#fafafa" }}
        >
          <AnimatePresence mode="wait">
            {isRunning ? (
              <motion.div key="running" {...fadeIn} className="flex flex-col items-center justify-center gap-3 py-8">
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
                        runResult.status === "success" ? "#34d399"
                          : runResult.status === "compile_error" || runResult.status === "error" ? "#f87171"
                            : "#fbbf24",
                    }}
                  >
                    {runResult.output}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="testcases" {...fadeIn} className="space-y-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    {testcaseTabs.map((tc, index) => (
                      <div
                        key={tc.id}
                        onClick={() => setActiveTestcaseId(tc.id)}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all min-w-max select-none"
                        style={{
                          background: activeTestcaseId === tc.id
                            ? isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"
                            : "transparent",
                          color: activeTestcaseId === tc.id
                            ? isDark ? "#e2e8f0" : "#1e293b"
                            : isDark ? "#94a3b8" : "#64748b",
                        }}
                      >
                        {tc.name}
                        {testcaseTabs.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newTabs = testcaseTabs.filter((t) => t.id !== tc.id);
                              setTestcaseTabs(newTabs);
                              if (activeTestcaseId === tc.id) {
                                setActiveTestcaseId(newTabs[newTabs.length - 1].id);
                              }
                            }}
                            className="p-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10 ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newId = String(Date.now());
                        const name = `Case ${testcaseTabs.length + 1}`;
                        const newTabs = [...testcaseTabs, { id: newId, name, value: "" }];
                        setTestcaseTabs(newTabs);
                        setActiveTestcaseId(newId);
                      }}
                      className="ml-1 p-1.5 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                      title="Add new testcase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  <textarea
                    value={testcaseTabs.find((tc) => tc.id === activeTestcaseId)?.value || ""}
                    onChange={(e) => {
                      setTestcaseTabs((prev) =>
                        prev.map((tc) => (tc.id === activeTestcaseId ? { ...tc, value: e.target.value } : tc))
                      );
                    }}
                    placeholder="Enter custom testcase..."
                    className="w-full min-h-[150px] p-4 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto resize-y focus:outline-none"
                    style={{
                      background: isDark
                        ? "linear-gradient(135deg, rgba(30,30,55,0.8) 0%, rgba(22,22,42,0.9) 100%)"
                        : "#f0f0f5",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                      color: isDark ? "#cbd5e1" : "#334155",
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
  { label: "Guru AI", icon: "🤖" },
] as const;

function ProblemDetails({ data, theme }: { data: DailyChallengeResponse, theme: "dark" | "light" }) {
  const { problem, stale } = data;
  const [activeTab, setActiveTab] = useState(0);
  const [hintsOpen, setHintsOpen] = useState(false);

  const isDark = theme === "dark";

  // Build the full problem context for GuruBot
  const fullProblemContext = useMemo(() => {
    return `Title: ${problem.title}\nDifficulty: ${problem.difficulty}\n\nProblem Description:\n${problem.content}\n\nHints:\n${(problem.hints || []).join("\n")}`;
  }, [problem]);

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
              color: activeTab === i
                ? isDark ? "#fbbf24" : "#d97706"
                : isDark ? "#64748b" : "#94a3b8",
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
          <AnimatePresence mode="popLayout">
            {activeTab === 0 && (
              <motion.div
                key="problem-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <h1
                  className="text-2xl font-bold tracking-tight leading-tight"
                  style={{
                    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                    color: isDark ? "#f1f5f9" : "#0f172a",
                  }}
                >
                  {problem.title}
                </h1>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Difficulty */}
                  <span
                    className="inline-flex items-center h-6 px-3 rounded-full text-xs font-bold tracking-wide"
                    style={
                      problem.difficulty === "Hard"
                        ? { background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)", color: isDark ? "#f87171" : "#dc2626", border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)"}` }
                        : problem.difficulty === "Medium"
                          ? { background: isDark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.08)", color: isDark ? "#fbbf24" : "#d97706", border: `1px solid ${isDark ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.15)"}` }
                          : { background: isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)", color: isDark ? "#34d399" : "#059669", border: `1px solid ${isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.15)"}` }
                    }
                  >
                    {problem.difficulty}
                  </span>

                  {/* Hints toggle — only shown when hints exist */}
                  {problem.hints && problem.hints.length > 0 && (
                    <button
                      onClick={() => setHintsOpen(!hintsOpen)}
                      className="inline-flex items-center gap-1 h-6 px-3 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-[1.03]"
                      style={{
                        background: hintsOpen
                          ? isDark ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.1)"
                          : isDark ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.06)",
                        color: isDark ? "#a78bfa" : "#7c3aed",
                        border: `1px solid ${isDark ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.12)"}`,
                      }}
                    >
                      <Lightbulb className="h-3 w-3" /> Hints ({problem.hints.length})
                    </button>
                  )}

                  {/* Topic tags */}
                  {problem.topicTags.map((t) => (
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
                      style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.15)" }}
                    >
                      Cached
                    </span>
                  )}
                </div>

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
                        className="p-4 rounded-xl space-y-2 mt-4"
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
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 0 && (
            <motion.div
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
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div {...fadeIn} className="space-y-4">
              <h2
                className="text-xl font-bold tracking-tight"
                style={{
                  fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                  color: isDark ? "#f1f5f9" : "#0f172a",
                }}
              >
                Official Editorial
              </h2>
              {problem.solution ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none
                      prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                      prose-h1:text-2xl prose-h1:border-b prose-h1:border-border/40 prose-h1:pb-2
                      prose-h2:text-xl prose-h2:border-b prose-h2:border-border/40 prose-h2:pb-2 prose-h2:mt-10
                      prose-h3:text-lg prose-h3:mt-8
                      prose-p:leading-relaxed prose-p:my-4 prose-p:text-muted-foreground/90
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-foreground/90 prose-blockquote:shadow-sm prose-blockquote:my-6
                      prose-code:before:content-none prose-code:after:content-none
                      prose-code:bg-muted/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[13px] prose-code:text-primary prose-code:font-semibold
                      prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0 prose-pre:border-none
                      prose-strong:text-foreground prose-strong:font-bold
                      prose-ul:my-5 prose-ol:my-5 prose-li:my-2 prose-li:text-muted-foreground/90
                      prose-img:rounded-2xl prose-img:shadow-xl prose-img:border prose-img:border-border/30 prose-img:my-8
                      prose-table:w-full prose-table:rounded-xl prose-table:overflow-hidden prose-table:border prose-table:border-border/50 prose-table:my-8
                      prose-th:bg-muted/30 prose-th:p-4 prose-th:text-left prose-th:font-semibold
                      prose-td:p-4 prose-td:border-t prose-td:border-border/50
                      [&_.katex-display]:my-6 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-2
                      [&_.katex]:text-[1.05em]"
                  >
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeRaw, rehypeKatex]}
                      components={{
                        pre({ children }) {
                          return <>{children}</>;
                        },
                        code({ className, children, ...props }) {
                          const text = extractText(children);
                          const isBlock = className?.startsWith("language-") || text.includes("\n");
                          if (isBlock) {
                            return (
                              <EditorialCodeBlock className={className}>
                                {children}
                              </EditorialCodeBlock>
                            );
                          }
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {problem.solution}
                    </ReactMarkdown>
                  </div>
              ) : (
                <div
                  className="p-6 rounded-xl text-center space-y-3"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    border: `1px dashed ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                    No free official editorial is available for this problem.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 2 && (
            <motion.div {...fadeIn} className="h-[600px] rounded-xl overflow-hidden border border-border/30 relative">
              <GuruBot
                open={true}
                onClose={() => {}}
                embedded={true}
                debugMode={false}
                initialContext={`You are assisting a user in solving the following LeetCode daily challenge. Ensure your answers are helpful, precise, and act as a guide.\n\n${fullProblemContext}`}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Bottom Bar — only the functional "Open on LeetCode" + Back link ── */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0 select-none"
        style={{
          background: isDark
            ? "linear-gradient(180deg, rgba(22,22,42,1) 0%, rgba(26,26,46,1) 100%)"
            : "linear-gradient(180deg, #f8f8fc 0%, #f0f0f5 100%)",
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        {/* Back to home */}
        <Link
          to="/"
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.03]"
          style={{
            color: isDark ? "#94a3b8" : "#64748b",
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </Link>

        {/* Open on LeetCode */}
        <a
          href={problem.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-[1.03]"
          style={{
            color: isDark ? "#fbbf24" : "#d97706",
            background: isDark ? "rgba(251,191,36,0.06)" : "rgba(217,119,6,0.04)",
            border: `1px solid ${isDark ? "rgba(251,191,36,0.12)" : "rgba(217,119,6,0.1)"}`,
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open on LeetCode
        </a>
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
      className="flex flex-col h-full min-h-0 p-3 pb-0"
      style={{ background: isDark ? "#0a0a0f" : "#e2e8f0" }}
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
            autoSaveId="problem-solver-split-v4"
            className="h-full w-full"
          >
            <Panel defaultSize={45} minSize={25} className="rounded-xl overflow-hidden shadow-sm" style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
              <ProblemDetails data={data} theme={theme} />
            </Panel>

            <PanelResizeHandle className="group flex items-center justify-center relative z-50 cursor-col-resize hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ width: 16, background: "transparent" }}>
              <div
                className="h-12 w-1.5 rounded-full transition-all duration-300 group-hover:w-2 group-hover:bg-primary/50"
                style={{ background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)" }}
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
      
      {/* ── Page Footer (outside of panels) if needed, but we integrated into ProblemDetails earlier. 
          Actually wait, ProblemDetails has a bottom bar. The panels fill the space. 
          We just add a tiny bottom margin to the layout. */}
      <div className="h-3 shrink-0" />
    </motion.div>
  );
}
