// ProblemSolver — LeetCode Daily Challenge page.
//
// Two-pane resizable layout (problem details on the left, Monaco Java editor
// + Wandbox Java Run & Compile runner on the right). Fetches the daily challenge
// via `useDailyChallenge`, which hits the `leetcode-daily` Supabase edge function.
//
// User code is persisted to Supabase `daily_challenge_user_code` for logged-in users.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Code,
  Copy,
  ExternalLink,
  BookOpen,
  FileText,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  Rocket,
  RotateCcw,
  X,
  XCircle,
  BrainCircuit,
  Sparkles,
} from "lucide-react";

import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GuruBot } from "@/components/GuruBot";
import { SegmentedControl } from "@/components/layout/PagePrimitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailyChallengeResponse } from "@/types/leetcode";
import { generateHarnessMain, parseSolutionSignature, chunkTestCases } from "@/lib/javaHarness";
import { buildProblemSolverGuruContext, deriveGuruSuggestions } from "@/lib/guruContext";
import { toast } from "@/hooks/use-toast";
import * as prettier from "prettier/standalone";
import * as prettierPluginJava from "prettier-plugin-java";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs, vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
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

// Helpers for LeetCode-accurate starter detection
function normalizeForCompare(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
function isStarterLike(code: string, starter: string): boolean {
  return normalizeForCompare(code) === normalizeForCompare(starter);
}
function isGenericSolveTemplate(code: string): boolean {
  const n = normalizeForCompare(code);
  return n.includes("public int solve()") && n.includes("return 0;") && n.includes("Running Java solution");
}
function buildStarterFromSnippet(snippet: string | undefined): string {
  if (!snippet) return DEFAULT_JAVA_TEMPLATE;
  const hasImport = /^\s*import\s+/m.test(snippet);
  return hasImport ? snippet : `import java.util.*;\n\n${snippet}`;
}

async function purgeStaleSolveCodeFromDB(questionId: string, userId: string | null): Promise<void> {
  if (!userId) return;
  try {
    const { data } = await supabase
      .from("daily_challenge_user_code")
      .select("code")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .maybeSingle();
    const code = data?.code;
    if (!code) return;
    let shouldPurge = false;
    if (isGenericSolveTemplate(code)) shouldPurge = true;
    else if (code.startsWith("[")) {
      try {
        const parsed = JSON.parse(code);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((t: { content?: string }) => t.content && isGenericSolveTemplate(t.content))) shouldPurge = true;
      } catch {}
    }
    if (shouldPurge) {
      await supabase.from("daily_challenge_user_code").delete().eq("user_id", userId).eq("question_id", questionId);
    }
  } catch {}
}

const WANDBOX_API = "https://wandbox.org/api/compile.json";
const JAVA_AUTO_IMPORTS = [
  "import java.util.*;",
  "import java.util.stream.*;",
  "import java.io.*;",
  "import java.math.*;",
];

/**
 * Editor themes.
 *
 * Both themes keep the LeetCode-style tri-colour syntax (blue keywords,
 * teal types, cream identifiers) but every surface colour is drawn from the
 * app's own palette so the editor reads as part of the same product as the
 * rest of the workspace instead of a foreign widget bolted on.
 */
const LEETCODE_DARK_THEME = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "", foreground: "D4D0C8", background: "0E1016" },
    { token: "comment", foreground: "6A9955", fontStyle: "italic" },
    // Java primitive / type keywords → green (int, void, boolean, char, etc) — must come BEFORE generic keyword
    { token: "keyword.boolean", foreground: "4EC9B0" },
    { token: "keyword.byte", foreground: "4EC9B0" },
    { token: "keyword.char", foreground: "4EC9B0" },
    { token: "keyword.double", foreground: "4EC9B0" },
    { token: "keyword.float", foreground: "4EC9B0" },
    { token: "keyword.int", foreground: "4EC9B0" },
    { token: "keyword.long", foreground: "4EC9B0" },
    { token: "keyword.short", foreground: "4EC9B0" },
    { token: "keyword.void", foreground: "4EC9B0" },
    { token: "keyword.String", foreground: "4EC9B0" },
    { token: "keyword.Integer", foreground: "4EC9B0" },
    { token: "keyword.Long", foreground: "4EC9B0" },
    { token: "keyword.Double", foreground: "4EC9B0" },
    // generic keywords (public, private, class, etc) → blue
    { token: "keyword", foreground: "569CD6" },
    { token: "keyword.control", foreground: "569CD6" },
    { token: "storage", foreground: "569CD6" },
    { token: "storage.type", foreground: "4EC9B0" },
    // class / type names — green (String, Solution, DynamicArray)
    { token: "type", foreground: "4EC9B0" },
    { token: "type.identifier", foreground: "4EC9B0" },
    { token: "class", foreground: "4EC9B0", fontStyle: "bold" },
    { token: "interface", foreground: "4EC9B0" },
    { token: "entity.name.type", foreground: "4EC9B0" },
    { token: "entity.name.class", foreground: "4EC9B0" },
    // methods / variables / params — cream (sumGame, num, i, n, capacity)
    { token: "identifier", foreground: "DCDCAA" },
    { token: "entity.name.function", foreground: "DCDCAA" },
    { token: "support.function", foreground: "DCDCAA" },
    { token: "function", foreground: "DCDCAA" },
    { token: "method", foreground: "DCDCAA" },
    { token: "variable", foreground: "DCDCAA" },
    { token: "variable.parameter", foreground: "DCDCAA" },
    { token: "parameter", foreground: "DCDCAA" },
    { token: "annotation", foreground: "DCDCAA" },
    { token: "number", foreground: "B5CEA8" },
    { token: "string", foreground: "CE9178" },
    { token: "operator", foreground: "D4D4D4" },
    { token: "delimiter", foreground: "D4D4D4" },
    { token: "delimiter.bracket", foreground: "D4D4D4" },
    { token: "delimiter.parenthesis", foreground: "D4D4D4" },
  ],
  colors: {
    "editor.background": "#0E1016",
    "editor.foreground": "#D4D0C8",
    "editorLineNumber.foreground": "#5B6070",
    "editorLineNumber.activeForeground": "#C9C5BC",
    "editorGutter.background": "#0E1016",
    "editor.lineHighlightBackground": "#171A22",
    "editor.lineHighlightBorder": "#00000000",
    "editor.selectionBackground": "#3B4258AA",
    "editor.inactiveSelectionBackground": "#2A2F3DAA",
    "editorCursor.foreground": "#C9C5BC",
    "editorIndentGuide.background": "#262B36",
    "editorIndentGuide.activeBackground": "#4A5164",
    "editorBracketMatch.background": "#4A516455",
    "editorBracketMatch.border": "#7A8499",
    "scrollbar.shadow": "#00000000",
    "scrollbarSlider.background": "#5B607066",
    "scrollbarSlider.hoverBackground": "#7A8499B3",
    "scrollbarSlider.activeBackground": "#AEB6C666",
    "editorWidget.background": "#171A22",
    "editorSuggestWidget.background": "#171A22",
    "editorSuggestWidget.foreground": "#D4D0C8",
    "editorSuggestWidget.selectedBackground": "#262B36",
  },
} as const;

/** Light counterpart — matches the app's white card surface. */
const ALGOGURU_LIGHT_THEME = {
  base: "vs" as const,
  inherit: true,
  rules: [
    { token: "", foreground: "1F2937", background: "FFFFFF" },
    { token: "comment", foreground: "6B7280", fontStyle: "italic" },
    { token: "keyword", foreground: "B45309" },
    { token: "keyword.control", foreground: "B45309" },
    { token: "storage", foreground: "B45309" },
    { token: "storage.type", foreground: "0F766E" },
    { token: "type", foreground: "0F766E" },
    { token: "type.identifier", foreground: "0F766E" },
    { token: "entity.name.type", foreground: "0F766E" },
    { token: "entity.name.class", foreground: "0F766E" },
    { token: "identifier", foreground: "1F2937" },
    { token: "entity.name.function", foreground: "1D4ED8" },
    { token: "support.function", foreground: "1D4ED8" },
    { token: "variable", foreground: "1F2937" },
    { token: "variable.parameter", foreground: "1F2937" },
    { token: "number", foreground: "047857" },
    { token: "string", foreground: "A1541F" },
    { token: "operator", foreground: "4B5563" },
    { token: "delimiter", foreground: "4B5563" },
  ],
  colors: {
    "editor.background": "#FFFFFF",
    "editor.foreground": "#1F2937",
    "editorLineNumber.foreground": "#9CA3AF",
    "editorLineNumber.activeForeground": "#4B5563",
    "editorGutter.background": "#FFFFFF",
    "editor.lineHighlightBackground": "#F5F6F8",
    "editor.lineHighlightBorder": "#00000000",
    "editor.selectionBackground": "#FCD9B6",
    "editor.inactiveSelectionBackground": "#F1F2F5",
    "editorCursor.foreground": "#1F2937",
    "editorIndentGuide.background": "#E6E8EC",
    "editorIndentGuide.activeBackground": "#C3C8D0",
    "editorBracketMatch.background": "#FDE3C2",
    "editorBracketMatch.border": "#D6A66A",
    "scrollbar.shadow": "#00000000",
    "scrollbarSlider.background": "#C3C8D080",
    "scrollbarSlider.hoverBackground": "#9CA3AFB3",
    "scrollbarSlider.activeBackground": "#6B728066",
    "editorWidget.background": "#FFFFFF",
    "editorSuggestWidget.background": "#FFFFFF",
    "editorSuggestWidget.foreground": "#1F2937",
    "editorSuggestWidget.selectedBackground": "#F1F2F5",
  },
} as const;

/* ------------------------------------------------------------------ */
/* Code persistence: Supabase only (logged-in users).                  */
/* ------------------------------------------------------------------ */

/** Load saved code: DB only (logged-in users). */
async function loadCode(
  questionId: string,
  userId: string | null,
): Promise<string | null> {
  if (!userId) return null;
  try {
    const { data } = await supabase
      .from("daily_challenge_user_code")
      .select("code")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .maybeSingle();
    if (data?.code) return data.code;
  } catch {
    /* DB unavailable */
  }
  return null;
}

/** Persist code: DB only (logged-in users). */
async function persistCode(
  questionId: string,
  code: string,
  userId: string | null,
): Promise<void> {
  if (!userId) return;
  try {
    await supabase
      .from("daily_challenge_user_code")
      .upsert(
        { user_id: userId, question_id: questionId, code, updated_at: new Date().toISOString() },
        { onConflict: "user_id,question_id" },
      );
  } catch {
    /* DB write failed — silently ignore */
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

    if (!/\bclass\s+Main\b/.test(proc)) {
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
  const lang = (className?.replace("language-", "") || "text").toLowerCase();
  const codeText = extractText(children).replace(/\n$/, "");

  return (
    <div className="my-5 rounded-xl overflow-hidden border border-[#2e2e2e] bg-[#1a1a1a]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#232323] border-b border-[#2e2e2e]">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-mono tracking-wide uppercase bg-[#2d2d2d] text-zinc-400 border border-[#3a3a3a]">
          {lang}
        </span>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(codeText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
            copied ? "bg-[#1f3a2a] text-emerald-400" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08]"
          }`}
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="bg-[#1a1a1a] overflow-x-auto">
        <SyntaxHighlighter
          language={lang}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            border: "none",
            background: "#1a1a1a",
            backgroundColor: "#1a1a1a",
            padding: "1rem 1.25rem",
            fontSize: "13.5px",
            lineHeight: "1.65",
          }}
          codeTagProps={{
            style: {
              fontFamily: '"JetBrains Mono","Fira Code",monospace',
              fontSize: "13.5px",
              lineHeight: "1.65",
              background: "transparent",
            },
          }}
          wrapLongLines={false}
          PreTag="div"
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
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

/* ------------------------------------------------------------------ */
/* Shared pane surface — the app-wide card treatment                   */
/* ------------------------------------------------------------------ */

/** Rounded card shell used by every pane of the workspace. */
function PaneShell({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Code Editor + Test Cases (Right Pane)                               */
/* ------------------------------------------------------------------ */

interface FileTab {
  id: string;
  name: string;
  content: string;
}

function extractExpectedOutputs(html: string): string[] {
  if (!html) return [];
  try {
    // Browser DOM parse
    if (typeof document !== "undefined") {
      const temp = document.createElement("div");
      temp.innerHTML = html;
      const outputs: string[] = [];
      // LeetCode standard: each example-block contains Output
      temp.querySelectorAll(".example-block").forEach((block) => {
        const text = block.textContent || "";
        // Look for Output: ... next line / span
        const m = text.match(/Output:\s*([^\n]+)/i);
        if (m) outputs.push(m[1].trim());
        else {
          // fallback: look for example-io inside block where preceding strong is Output
          const spans = block.querySelectorAll(".example-io");
          // Heuristic: second span per block is output when first is input
          if (spans.length >= 2) outputs.push((spans[1].textContent || "").trim());
          else if (spans.length === 1 && text.toLowerCase().includes("output")) outputs.push((spans[0].textContent || "").trim());
        }
      });
      if (outputs.length > 0) return outputs.map((s) => s.replace(/\u00A0/g, " ").trim());
    }
  } catch {}
  // Regex fallback
  const re = /Output:\s*<\/strong>\s*<span[^>]*class="example-io"[^>]*>([^<]+)<\/span>/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[1].trim());
  if (out.length === 0) {
    const re2 = /Output:\s*([^<\n]+)/gi;
    while ((m = re2.exec(html)) !== null) out.push(m[1].trim().replace(/<\/?[^>]+>/g, ""));
  }
  return out.map((s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").trim());
}

export interface LiveEditorSync {
  code: string;
  tabs: FileTab[];
  testcaseTabs: { id: string; name: string; value: string }[];
  runResult: RunResult | null;
  isRunning: boolean;
  selectedCode: string;
  expectedOutputs: string[];
}

function CodeEditorPane({
  questionId,
  theme,
  exampleTestcases,
  codeSnippets,
  problemContent,
  onLiveSync,
  insertTrigger,
}: {
  questionId: string;
  theme: "dark" | "light";
  exampleTestcases?: string;
  codeSnippets?: { langSlug: string; code: string }[];
  problemContent?: string;
  onLiveSync?: (state: LiveEditorSync) => void;
  insertTrigger?: { code: string; nonce: number } | null;
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
  const monacoRef = useRef<any>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [codeLoaded, setCodeLoaded] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const buildTestTabs = useCallback((raw?: string, snippet?: string | null) => {
    const normalized = (raw || "").replace(/\\n/g, "\n");
    if (!normalized.trim()) return [{ id: "1", name: "Case 1", value: "" }];
    // Try to chunk by param count if we have signature available
    try {
      const javaCode = snippet || codeSnippets?.find((s) => s.langSlug === "java")?.code || "";
      const sig = javaCode ? parseSolutionSignature(javaCode) : null;
      const paramCount = sig?.params.length ?? 1;
      const chunks = chunkTestCases(normalized, Math.max(paramCount, 1));
      if (chunks.length > 0) {
        return chunks.map((c, i) => ({ id: String(i + 1), name: `Case ${i + 1}`, value: c.join("\n") }));
      }
    } catch {}
    // Fallback: one tab per non-empty line
    const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) return [{ id: "1", name: "Case 1", value: normalized }];
    return lines.map((l, i) => ({ id: String(i + 1), name: `Case ${i + 1}`, value: l }));
  }, [codeSnippets]);

  const [testcaseTabs, setTestcaseTabs] = useState<{ id: string, name: string, value: string }[]>(() => buildTestTabs(exampleTestcases));
  const [activeTestcaseId, setActiveTestcaseId] = useState<string>("1");
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [selectedCode, setSelectedCode] = useState("");

  // Update local testcases if exampleTestcases changes (e.g., new daily challenge)
  useEffect(() => {
    const snippet = codeSnippets?.find((s) => s.langSlug === "java")?.code || null;
    setTestcaseTabs(buildTestTabs(exampleTestcases, snippet));
    setActiveTestcaseId("1");
  }, [exampleTestcases, codeSnippets, buildTestTabs]);

  // Expected outputs parsed from problem HTML (LeetCode example blocks)
  const expectedOutputs = useMemo(() => extractExpectedOutputs(problemContent || ""), [problemContent]);

  // Derive param names for input label (e.g., N, s, nums)
  const paramNames = useMemo(() => {
    try {
      const javaCode = codeSnippets?.find((s) => s.langSlug === "java")?.code || "";
      const sig = javaCode ? parseSolutionSignature(javaCode) : null;
      if (sig && sig.params.length > 0) return sig.params.map((p) => p.name);
    } catch {}
    return [] as string[];
  }, [codeSnippets]);

  const initialJavaSnippet = useMemo(() => {
    const javaCode = codeSnippets?.find((s) => s.langSlug === "java")?.code;
    return buildStarterFromSnippet(javaCode);
  }, [codeSnippets]);

  const hasRealStarter = useMemo(() => {
    return !isGenericSolveTemplate(initialJavaSnippet) && initialJavaSnippet !== DEFAULT_JAVA_TEMPLATE;
  }, [initialJavaSnippet]);

  // Proactively purge stale solve() cache for this question (permanent migration: local + DB)
  useEffect(() => {
    void purgeStaleSolveCodeFromDB(questionId, userId);
  }, [questionId, userId]);

  // Load saved code from DB on mount or question change
  useEffect(() => {
    let cancelled = false;
    setCodeLoaded(false);
    // If starter is still generic and we have codeSnippets pending, wait; the second effect below will swap it
    loadCode(questionId, userId).then((saved) => {
      if (!cancelled) {
        const starter = initialJavaSnippet;
        const isGenericStarter = isGenericSolveTemplate(starter);
        let isDefault = false;
        const defaultNorm = normalizeForCompare(DEFAULT_JAVA_TEMPLATE);
        const starterNorm = normalizeForCompare(starter);

        const checkIsStarter = (codeStr: string) => {
          const n = normalizeForCompare(codeStr);
          return n === defaultNorm || n === starterNorm || isGenericSolveTemplate(codeStr);
        };

        // Permanent rule: never restore a generic solve() template if starter is real LeetCode signature
        const hasRealSnippet = !isGenericStarter && starter !== DEFAULT_JAVA_TEMPLATE;

        if (saved && isGenericSolveTemplate(saved) && hasRealSnippet) {
          isDefault = true;
        } else if (saved && !saved.startsWith("[")) {
          if (checkIsStarter(saved)) isDefault = hasRealSnippet ? true : isDefault || checkIsStarter(saved);
          if (isGenericSolveTemplate(saved) && hasRealSnippet) isDefault = true;
        } else if (saved && saved.startsWith("[")) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length >= 1 && parsed.every((t: { content?: string }) => t.content && isGenericSolveTemplate(t.content)) && hasRealSnippet) {
              isDefault = true;
            } else if (Array.isArray(parsed) && parsed.length === 1 && checkIsStarter(parsed[0].content)) {
              isDefault = hasRealSnippet ? true : true;
            }
          } catch {}
        } else if (saved === DEFAULT_JAVA_TEMPLATE) {
          isDefault = true;
        }

        let parsedTabs: FileTab[] = [{ id: "1", name: "Solution.java", content: (saved && !isDefault) ? saved : starter }];
        try {
          if (saved && !isDefault && saved.startsWith("[")) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // If saved content is actually starter-like but starter changed (new LeetCode problem),
              // prefer the new starter instead of stale saved
              const firstContent = parsed[0]?.content || "";
              if ((checkIsStarter(firstContent) || isGenericSolveTemplate(firstContent)) && normalizeForCompare(firstContent) !== starterNorm) {
                parsedTabs = [{ id: "1", name: "Solution.java", content: starter }];
              } else {
                // Also if any tab is generic solve template and we have real snippet, replace whole set
                if (hasRealSnippet && parsed.some((t: { content?: string }) => t.content && isGenericSolveTemplate(t.content))) {
                  parsedTabs = [{ id: "1", name: "Solution.java", content: starter }];
                } else {
                  parsedTabs = parsed;
                }
              }
            }
          } else if (saved && !isDefault && !saved.startsWith("[")) {
            parsedTabs = [{ id: "1", name: "Solution.java", content: saved }];
          }
        } catch {}

        // If we discarded a stale generic save in favor of a real LeetCode starter, purge it permanently from DB
        if (isDefault && hasRealSnippet && saved) {
          void purgeStaleSolveCodeFromDB(questionId, userId);
          // Persist the real starter so next load doesn't need to heal again
          const healedPersistence = JSON.stringify(parsedTabs);
          void persistCode(questionId, healedPersistence, userId);
        }
        
        setTabs(parsedTabs);
        setActiveTabId(parsedTabs[0].id);
        setRunResult(null);
        setCodeLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [questionId, userId, initialJavaSnippet]);

  // Permanent auto-heal: if editor is currently showing generic solve() but a real snippet arrives late (async), swap it live
  useEffect(() => {
    if (!codeLoaded) return;
    const starter = initialJavaSnippet;
    if (isGenericSolveTemplate(starter)) return; // starter itself is still generic, nothing to heal to
    if (!hasRealStarter) return;
    const current = tabs.find((t) => t.id === activeTabId)?.content ?? tabs[0]?.content ?? "";
    if (isGenericSolveTemplate(current)) {
      // Replace stale generic with real LeetCode signature permanently
      const healedTabs = tabs.map((t) => (t.id === activeTabId ? { ...t, content: starter } : t));
      setTabs(healedTabs);
      // Purge DB generic and persist healed content to DB
      void purgeStaleSolveCodeFromDB(questionId, userId).then(() => {
        void persistCode(questionId, JSON.stringify(healedTabs), userId);
      });
      setRunResult(null);
    }
  }, [initialJavaSnippet, hasRealStarter, codeLoaded]);

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
    // Never reset to the generic solve() fallback — it means today's LeetCode snippet hasn't loaded yet
    if (!hasRealStarter || isGenericSolveTemplate(initialJavaSnippet)) {
      toast({
        title: "Daily challenge still loading",
        description: "Please wait a moment — the LeetCode signature is being fetched. Try reset again once loaded.",
      });
      return;
    }
    // Show confirmation popup matching design: "Are you sure? Your current code will be discarded..."
    setShowResetConfirm(true);
  }, [hasRealStarter, initialJavaSnippet]);

  const handleConfirmReset = useCallback(() => {
    setShowResetConfirm(false);
    // If current code is already the real starter, no-op (avoid needless DB write)
    const current = tabs.find((t) => t.id === activeTabId)?.content ?? tabs[0]?.content ?? "";
    if (normalizeForCompare(current) === normalizeForCompare(initialJavaSnippet)) {
      setRunResult(null);
      return;
    }
    setCode(initialJavaSnippet);
    setRunResult(null);
    setTabs((currentTabs) => {
      const updatedTabs = currentTabs.map((t) => (t.id === activeTabId ? { ...t, content: initialJavaSnippet } : t));
      // Ensure any previously persisted generic is cleared before writing real starter
      void purgeStaleSolveCodeFromDB(questionId, userId).then(() => {
        void persistCode(questionId, JSON.stringify(updatedTabs), userId);
      });
      return updatedTabs;
    });
    toast({ title: "Code reset", description: "Restored today's LeetCode starter template." });
  }, [questionId, userId, activeTabId, initialJavaSnippet, tabs]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    const solutionCode = tabs.find((t) => t.name === "Solution.java")?.content || tabs[0]?.content || "";
    const helperCode = tabs.filter((t) => t.name !== "Solution.java").map((t) => `// --- ${t.name} ---\n${t.content}`).join("\n\n");
    const baseCode = helperCode ? `${solutionCode}\n\n${helperCode}` : solutionCode;

    // Try LeetCode-accurate harness first
    let harness: string | null = null;
    try {
      // Build harness from ALL testcase tabs combined (real LeetCode behavior)
      const allInputs = testcaseTabs.map((tc) => tc.value).join("\n");
      const fullExample = allInputs || exampleTestcases || "";
      harness = generateHarnessMain(baseCode, fullExample);
    } catch {}

    let result: RunResult;
    if (harness) {
      // Harness mode — compile Solution + generated Main, no stdin
      const combinedWithHarness = `${baseCode}\n\n${harness}`;
      result = await runJavaCode(combinedWithHarness, "");
    } else {
      // Fallback: legacy stdin mode (for unsupported types or no example)
      const combinedCode = tabs.map((t) => `// --- ${t.name} ---\n${t.content}`).join("\n\n");
      const currentTestcase = testcaseTabs.find((t) => t.id === activeTestcaseId)?.value || "";
      result = await runJavaCode(combinedCode, currentTestcase);
    }
    setRunResult(result);
    setIsRunning(false);
  }, [tabs, testcaseTabs, activeTestcaseId, exampleTestcases]);

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
    monacoRef.current = monaco;
    // Editor themes — defined once, then applied for the active mode
    try {
      monaco.editor.defineTheme("algoguru-dark", LEETCODE_DARK_THEME as any);
      monaco.editor.defineTheme("algoguru-light", ALGOGURU_LIGHT_THEME as any);
      monaco.editor.setTheme(theme === "dark" ? "algoguru-dark" : "algoguru-light");
    } catch {}
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      void handleRunCode();
    });
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
      void formatCode();
    });
    // track selection for Guru context (auto-attach selected snippet)
    editor.onDidChangeCursorSelection((e: any) => {
      try {
        const sel = editor.getModel()?.getValueInRange(e.selection)?.trim() || "";
        if (sel && sel.length >= 2 && sel.length <= 2000) setSelectedCode(sel);
        else if (!sel) setSelectedCode("");
      } catch {}
    });
  };

  // Keep Monaco theme in sync with the app theme
  useEffect(() => {
    const nextTheme = theme === "dark" ? "algoguru-dark" : "algoguru-light";
    try {
      const m: any = monacoRef.current;
      if (m?.editor) {
        m.editor.setTheme(nextTheme);
        return;
      }
      // Fallback: editor not mounted yet — apply through the global Monaco instance
      if (typeof window !== "undefined" && (window as any).monaco?.editor) {
        const g = (window as any).monaco.editor;
        g.defineTheme("algoguru-dark", LEETCODE_DARK_THEME as any);
        g.defineTheme("algoguru-light", ALGOGURU_LIGHT_THEME as any);
        g.setTheme(nextTheme);
      }
    } catch {}
  }, [theme]);

  // Sync live editor state to parent for Guru context (auto-attach)
  useEffect(() => {
    if (!onLiveSync) return;
    onLiveSync({
      code,
      tabs,
      testcaseTabs,
      runResult,
      isRunning,
      selectedCode,
      expectedOutputs,
    });
  }, [code, tabs, testcaseTabs, runResult, isRunning, selectedCode, expectedOutputs, onLiveSync]);

  // Insert code from Guru AI directly into Monaco (user choice via "Use in editor")
  useEffect(() => {
    if (!insertTrigger?.code) return;
    const incoming = insertTrigger.code.trim();
    if (!incoming) return;
    // Heuristic: if incoming looks like a full class/file, replace active tab; else insert at cursor
    const looksFullFile = /class\s+Solution|public\s+class|import\s+java/.test(incoming);
    if (looksFullFile) {
      setTabs((prev) => {
        const updated = prev.map((t) => (t.id === activeTabId ? { ...t, content: incoming } : t));
        void persistCode(questionId, JSON.stringify(updated), userId);
        return updated;
      });
      // also focus editor and reveal
      setTimeout(() => {
        const ed = editorRef.current;
        if (ed) {
          ed.focus();
          // move cursor to top
          ed.setPosition({ lineNumber: 1, column: 1 });
          ed.revealLineNearTop(1);
        }
      }, 50);
    } else {
      // Insert snippet at cursor position
      const ed = editorRef.current;
      if (ed) {
        const sel = ed.getSelection();
        const id = { major: 1, minor: 1 };
        const op = { identifier: id, range: sel, text: "\n" + incoming + "\n", forceMoveMarkers: true };
        ed.executeEdits("guru-insert", [op]);
        ed.focus();
        const newCode = ed.getValue();
        setTabs((prev) => {
          const updated = prev.map((t) => (t.id === activeTabId ? { ...t, content: newCode } : t));
          void persistCode(questionId, JSON.stringify(updated), userId);
          return updated;
        });
      } else {
        // fallback: append
        setCode((code ? code + "\n\n" : "") + incoming);
      }
    }
  }, [insertTrigger, activeTabId, questionId, userId]);

  // Close reset confirm on Escape
  useEffect(() => {
    if (!showResetConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowResetConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showResetConfirm]);

  const isDark = theme === "dark";

  return (
    <>
    <PanelGroup
      direction="vertical"
      autoSaveId="editor-testcases-split-v4"
      className="h-full"
    >
      {/* ═════════ Editor Panel ═════════ */}
      <Panel defaultSize={62} minSize={30} className="min-h-0">
        <PaneShell className="p-0">
        {/* --- Editor Top Bar --- */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-1.5">
          {/* Language label (static — only Java supported) */}
          <div className="flex items-center gap-2">
            <span className="flex h-7 items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary">
              <Code className="h-3.5 w-3.5" />
              Java 21
            </span>
          </div>

          {/* Functional actions only */}
          <div className="flex items-center gap-1">
            {/* Copy */}
            <button
              type="button"
              onClick={handleCopyCode}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                copied
                  ? "bg-success/10 text-success"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title="Copy code to clipboard"
              aria-label="Copy code to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>

            {/* Format */}
            <button
              type="button"
              onClick={() => { void formatCode(); }}
              className={cn(
                "flex h-7 items-center justify-center gap-1.5 rounded-md px-2 transition-colors",
                isFormatted
                  ? "bg-success/10 text-success"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
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
              type="button"
              onClick={handleResetCode}
              disabled={!codeLoaded || !hasRealStarter}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              title={
                !codeLoaded
                  ? "Loading saved code..."
                  : !hasRealStarter
                    ? "Daily challenge still loading — reset available once LeetCode signature is loaded"
                    : "Reset to starter template (today's LeetCode signature)"
              }
              aria-label="Reset to starter template"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <div className="mx-1 h-4 w-px bg-border" />

            {/* Run */}
            <button
              type="button"
              onClick={() => { void handleRunCode(); }}
              disabled={isRunning}
              className={cn(
                "flex h-7 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold shadow-soft transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                isRunning
                  ? "bg-warning text-warning-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
              title="Run Code (Ctrl + Enter)"
            >
              {isRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Rocket className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{isRunning ? "Running" : "Run"}</span>
            </button>
          </div>
        </div>

        {/* --- File Tabs --- */}
        <div
          className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-card px-2 py-1 select-none"
          style={{ scrollbarWidth: "none" }}
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                "group flex min-w-max cursor-pointer items-center gap-1.5 rounded-t-md px-3 py-1 text-xs font-medium transition-colors",
                activeTabId === tab.id
                  ? "border-b-2 border-primary text-foreground"
                  : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.name}
              {tabs.length > 1 && (
                <button
                  type="button"
                  aria-label={`Close ${tab.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newTabs = tabs.filter((t) => t.id !== tab.id);
                    setTabs(newTabs);
                    if (activeTabId === tab.id) {
                      setActiveTabId(newTabs[newTabs.length - 1].id);
                    }
                    void persistCode(questionId, JSON.stringify(newTabs), userId);
                  }}
                  className="rounded-sm p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            aria-label="Add file"
            onClick={() => {
              const newId = String(Date.now());
              const name = `Helper${tabs.length}.java`;
              const newTabs = [...tabs, { id: newId, name, content: "class " + name.replace(".java", "") + " {\n\n}\n" }];
              setTabs(newTabs);
              setActiveTabId(newId);
              void persistCode(questionId, JSON.stringify(newTabs), userId);
            }}
            className="ml-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* --- Monaco Editor --- */}
        <div className="relative min-h-0 flex-1 bg-code-bg">
          {!codeLoaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-code-bg">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <Editor
            height="100%"
            language="java"
            theme={isDark ? "algoguru-dark" : "algoguru-light"}
            value={code}
            onChange={handleChange}
            beforeMount={(monaco) => {
              try {
                monaco.editor.defineTheme("algoguru-dark", LEETCODE_DARK_THEME as any);
                monaco.editor.defineTheme("algoguru-light", ALGOGURU_LIGHT_THEME as any);
              } catch {}
            }}
            onMount={handleMount}
            options={{
              fontSize: editorFontSize,
              // LeetCode editor — Consolas-like, tight tracking (matches screenshot)
              fontFamily: '"Consolas","Cascadia Code","JetBrains Mono","Fira Code",Menlo,Monaco,"Courier New",monospace',
              fontLigatures: false,
              fontWeight: "400",
              lineHeight: 19,
              letterSpacing: 0,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 10, bottom: 10 },
              lineNumbers: "on",
              lineNumbersMinChars: 2,
              glyphMargin: true,
              folding: true,
              foldingHighlight: false,
              renderLineHighlight: "line",
              renderLineHighlightOnlyWhenFocus: false,
              bracketPairColorization: { enabled: true },
              guides: { indentation: true, bracketPairs: "active" },
              autoClosingBrackets: "always",
              autoClosingQuotes: "always",
              autoClosingOvertype: "always",
              formatOnPaste: false,
              tabSize: 4,
              insertSpaces: true,
              detectIndentation: false,
              wordWrap: "on",
              smoothScrolling: true,
              cursorBlinking: "blink",
              cursorSmoothCaretAnimation: "off",
              cursorWidth: 2,
              suggest: { showKeywords: true, showSnippets: true },
              quickSuggestions: { other: true, comments: false, strings: true },
              scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8, useShadows: false },
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              overviewRulerLanes: 0,
              renderWhitespace: "none",
              matchBrackets: "always",
              occurrencesHighlight: "off",
              selectionHighlight: false,
              codeLens: false,
              links: false,
            }}
          />
        </div>

        {/* --- Editor Footer --- */}
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/40 px-3 py-1 select-none">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Font Size
            </span>
            <select
              value={editorFontSize}
              onChange={(e) => setEditorFontSize(Number(e.target.value))}
              aria-label="Editor font size"
              className="h-5 rounded border border-input bg-background px-1 font-mono text-[10px] text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {[12, 14, 16, 18, 20].map((size) => (
                <option key={size} value={size} className="bg-background text-foreground">{size}px</option>
              ))}
            </select>
          </div>
        </div>
        </PaneShell>
      </Panel>

      {/* ═════════ Resize Handle ═════════ */}
      <PanelResizeHandle
        className="group relative z-50 flex h-3 shrink-0 items-center justify-center cursor-row-resize"
      >
        <div className="h-1.5 w-12 rounded-full bg-border transition-all duration-300 group-hover:w-16 group-hover:bg-primary/60 group-active:bg-primary" />
      </PanelResizeHandle>

      {/* ═════════ Test Cases / Output Panel ═════════ */}
      <Panel defaultSize={38} minSize={15} className="min-h-0">
        <PaneShell className="p-0">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-muted/40 px-3 py-1.5">
          <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Test Cases
          </span>

          {/* Run status badges */}
          {isRunning && (
            <motion.div {...fadeIn} className="ml-auto">
              <Badge
                variant="outline"
                className="animate-pulse gap-1 border-warning/30 bg-warning/10 text-[10px] font-semibold text-warning"
              >
                <Loader2 className="h-3 w-3 animate-spin" /> Compiling…
              </Badge>
            </motion.div>
          )}
          {!isRunning && runResult && (
            <motion.div {...fadeIn} className="ml-auto flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 text-[10px] font-semibold",
                  runResult.status === "success" && "border-success/30 bg-success/10 text-success",
                  (runResult.status === "compile_error" || runResult.status === "error") && "border-destructive/30 bg-destructive/10 text-destructive",
                  runResult.status === "runtime_error" && "border-warning/30 bg-warning/10 text-warning",
                )}
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
              <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" /> {runResult.executionTimeMs}ms
              </span>
            </motion.div>
          )}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-background p-4">
          <AnimatePresence mode="wait">
            {isRunning ? (
              <motion.div key="running" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="relative flex flex-col items-center justify-center gap-4 overflow-hidden py-10">
                {/* soft ambient glow */}
                <div className="pointer-events-none absolute inset-0">
                  <motion.div animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.05, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} className="absolute left-1/2 top-1/2 h-32 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
                </div>

                {/* orbital icon */}
                <div className="relative">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute -inset-3 rounded-2xl border border-dashed border-primary/25 border-t-primary/60" />
                  <motion.div animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0, 0.25] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} className="absolute -inset-2 rounded-2xl border border-primary/30" />
                  <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                    <motion.div animate={{ x: ["-120%", "120%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }} className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent" />
                    <Loader2 className="relative h-6 w-6 animate-spin text-primary" />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-warning">
                      <Rocket className="h-2.5 w-2.5 text-warning-foreground" />
                    </span>
                  </div>
                </div>

                {/* title + typing dots */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold tracking-tight text-foreground">
                      Compiling &amp; Running
                    </span>
                    <span className="hidden items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground sm:inline-flex">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Java 21
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">javac • java • wandbox</span>
                    <span className="ml-1 flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span key={i} animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.85, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }} className="h-1.5 w-1.5 rounded-full bg-primary" />
                      ))}
                    </span>
                  </div>
                </div>

                {/* faux terminal */}
                <div className="relative z-10 w-full max-w-[320px] overflow-hidden rounded-xl border border-border bg-card shadow-soft">
                  <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-3 py-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                    <span className="ml-auto font-mono text-[10px] tracking-wide text-muted-foreground">prog.java</span>
                  </div>
                  <div className="space-y-1 px-3 py-2.5 font-mono text-[11px] leading-4">
                    <div className="flex gap-2"><span className="text-primary">$</span><motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-foreground">javac -cp . Solution.java</motion.span></div>
                    <div className="flex gap-2"><span className="text-success">✓</span><span className="text-muted-foreground">compiled in 0.42s</span></div>
                    <div className="flex gap-2"><span className="text-primary">$</span><motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-foreground">java Main • {testcaseTabs.length} case{testcaseTabs.length > 1 ? "s" : ""}</motion.span><motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.7, repeat: Infinity }} className="text-primary">▌</motion.span></div>
                  </div>
                  {/* progress bar */}
                  <div className="h-[2px] w-full overflow-hidden bg-border">
                    <motion.div className="h-full bg-gradient-to-r from-primary via-accent to-warning" initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ duration: 1.8, repeat: Infinity, ease: [0.4, 0, 0.2, 1], repeatDelay: 0.15 }} />
                  </div>
                </div>

                {/* stepper */}
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Compile</span>
                  <span className="text-border">—</span>
                  <span className="flex items-center gap-1.5 text-warning"><motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} className="h-1.5 w-1.5 rounded-full bg-warning" /> Run</span>
                  <span className="text-border">—</span>
                  <span className="flex items-center gap-1.5 opacity-60"><span className="h-1.5 w-1.5 rounded-full border border-muted-foreground/50" /> Verify</span>
                </div>
              </motion.div>
            ) : runResult ? (
              (() => {
                // Compile/runtime error -> show single error box
                if (runResult.status === "compile_error" || runResult.status === "runtime_error" || runResult.status === "error") {
                  return (
                    <motion.div key="result-error" {...fadeIn} className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={cn(
                            "flex items-center gap-1.5 text-sm font-bold",
                            runResult.status === "compile_error" ? "text-destructive" : "text-warning",
                          )}
                        >
                          {runResult.status === "compile_error" ? <><XCircle className="h-4 w-4" /> Compile Error</> : <><AlertTriangle className="h-4 w-4" /> Runtime Error</>}
                        </span>
                        <button
                          type="button"
                          onClick={() => setRunResult(null)}
                          className="flex h-7 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Reset
                        </button>
                      </div>
                      <div className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-destructive/30 bg-destructive/5 p-4 font-mono text-xs leading-relaxed text-destructive">
                        {runResult.output}
                      </div>
                    </motion.div>
                  );
                }
                // Success -> LeetCode-style per-case view (screenshot match)
                const rawLines = runResult.output.trim().split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
                // For harness we printed one line per case; if more lines due to stacktrace, take first N
                const perCaseOutputs = testcaseTabs.map((_, i) => rawLines[i] ?? "");
                const normalize = (s: string) => s.trim().replace(/\s+/g, " ").replace(/,\s/g, ",").replace(/\[\s/g, "[").replace(/\s\]/g, "]").toLowerCase();
                const caseStatuses = testcaseTabs.map((_, i) => {
                  const your = perCaseOutputs[i] ?? "";
                  const expected = expectedOutputs[i] ?? "";
                  const isCustom = i >= expectedOutputs.length;
                  if (your.startsWith("Runtime Error")) return { passed: false, your, expected, isCustom };
                  if (isCustom) return { passed: true, your, expected: "", isCustom };
                  return { passed: normalize(your) === normalize(expected), your, expected, isCustom };
                });
                const hasExpected = expectedOutputs.length > 0;
                const allPassed = hasExpected ? caseStatuses.filter((c) => !c.isCustom).every((c) => c.passed) && rawLines.length >= Math.min(testcaseTabs.length, expectedOutputs.length) : true;
                const passedCount = caseStatuses.filter((c) => c.passed).length;
                const activeIdx = Math.max(0, testcaseTabs.findIndex((t) => t.id === activeTestcaseId));
                const activeStatus = caseStatuses[activeIdx];
                const activeTab = testcaseTabs[activeIdx];
                const inputLabel = paramNames.length === 1 ? paramNames[0] : paramNames.length > 1 ? paramNames.join(", ") : "Input";
                const overallStatus = hasExpected ? (allPassed ? "Accepted" : "Wrong Answer") : "Executed";
                return (
                  <motion.div key="result-success" {...fadeIn} className="space-y-4">
                    {/* Tabs row with pass/fail icons */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {testcaseTabs.map((tc, i) => {
                        const st = caseStatuses[i];
                        const isActive = tc.id === activeTestcaseId;
                        const isPassed = st.passed;
                        const isFailed = !st.passed && !st.isCustom;
                        return (
                          <div
                            key={tc.id}
                            onClick={() => setActiveTestcaseId(tc.id)}
                            className={cn(
                              "group flex min-w-max cursor-pointer select-none items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                              isFailed && (isActive ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-transparent text-destructive hover:bg-destructive/5"),
                              !isFailed && isPassed && !st.isCustom && (isActive ? "border-success/30 bg-success/10 text-success" : "border-transparent text-success hover:bg-success/5"),
                              !isFailed && !(isPassed && !st.isCustom) && (isActive ? "border-border bg-muted text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"),
                            )}
                          >
                            {isFailed ? <X className="h-3.5 w-3.5" /> : isPassed && !st.isCustom ? <Check className="h-3.5 w-3.5" /> : null}
                            {tc.name}
                            {testcaseTabs.length > 1 && (
                              <button
                                type="button"
                                aria-label={`Remove ${tc.name}`}
                                onClick={(e) => { e.stopPropagation(); const newTabs = testcaseTabs.filter((t) => t.id !== tc.id); setTestcaseTabs(newTabs); if (activeTestcaseId === tc.id) setActiveTestcaseId(newTabs[newTabs.length-1]?.id || "1"); }}
                                className="ml-1 rounded-sm p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => { const newId = String(Date.now()); const name = `Case ${testcaseTabs.length + 1}`; const newTabs = [...testcaseTabs, { id: newId, name, value: "" }]; setTestcaseTabs(newTabs); setActiveTestcaseId(newId); }}
                        className="ml-1 rounded-lg border border-dashed border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Add custom testcase"
                        aria-label="Add custom testcase"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRunResult(null)}
                        className="ml-auto flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset
                      </button>
                    </div>

                    {/* Overall status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "flex items-center gap-2 text-sm font-bold",
                          allPassed ? "text-success" : "text-destructive",
                        )}
                      >
                        {allPassed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        {overallStatus}
                      </span>
                      {hasExpected && <span className="text-xs text-muted-foreground">{passedCount} / {testcaseTabs.length} passed</span>}
                      <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {runResult.executionTimeMs}ms
                      </span>
                    </div>

                    {/* Active case details - Input / Your Output / Expected Output */}
                    {activeTab && activeStatus && (
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{inputLabel}</div>
                          <div className="w-full whitespace-pre-wrap break-all rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
                            {activeTab.value || "(empty)"}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div>
                            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Your Output</div>
                            <div
                              className={cn(
                                "w-full whitespace-pre-wrap break-all rounded-xl border p-3 font-mono text-xs leading-relaxed",
                                activeStatus.passed || activeStatus.isCustom
                                  ? "border-success/30 bg-muted/40 text-foreground"
                                  : "border-destructive/30 bg-destructive/5 text-destructive",
                              )}
                            >
                              {activeStatus.your || "(no output)"}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Expected Output</div>
                            <div className="w-full whitespace-pre-wrap break-all rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
                              {activeStatus.isCustom
                                ? <span className="italic text-muted-foreground/70">No expected — custom case</span>
                                : (activeStatus.expected || "(not found)")}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })()
            ) : (
              <motion.div key="testcases" {...fadeIn} className="space-y-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    {testcaseTabs.map((tc) => (
                      <div
                        key={tc.id}
                        onClick={() => setActiveTestcaseId(tc.id)}
                        className={cn(
                          "group flex min-w-max cursor-pointer select-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                          activeTestcaseId === tc.id
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        )}
                      >
                        {tc.name}
                        {testcaseTabs.length > 1 && (
                          <button
                            type="button"
                            aria-label={`Remove ${tc.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const newTabs = testcaseTabs.filter((t) => t.id !== tc.id);
                              setTestcaseTabs(newTabs);
                              if (activeTestcaseId === tc.id) {
                                setActiveTestcaseId(newTabs[newTabs.length - 1].id);
                              }
                            }}
                            className="ml-1 rounded-sm p-0.5 opacity-0 transition-opacity hover:bg-muted-foreground/20 group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newId = String(Date.now());
                        const name = `Case ${testcaseTabs.length + 1}`;
                        const newTabs = [...testcaseTabs, { id: newId, name, value: "" }];
                        setTestcaseTabs(newTabs);
                        setActiveTestcaseId(newId);
                      }}
                      className="ml-1 rounded-lg border border-dashed border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Add new testcase"
                      aria-label="Add new testcase"
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
                    aria-label="Test case input"
                    className="min-h-[150px] w-full resize-y rounded-xl border border-input bg-background p-4 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </PaneShell>
      </Panel>
    </PanelGroup>

      {showResetConfirm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setShowResetConfirm(false)}
          />
          {/* modal */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-confirm-title"
            className="relative flex w-full max-w-[420px] items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-overlay sm:p-6"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-warning/25 bg-warning/10 text-warning">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 id="reset-confirm-title" className="text-[15px] font-semibold leading-tight text-foreground">
                Are you sure?
              </h3>
              <p className="mt-1.5 text-[13px] leading-[1.45] text-muted-foreground">
                Your current code will be discarded and reset to the default code!
              </p>
              <div className="mt-5 flex items-center justify-end gap-2.5">
                <Button variant="outline" size="sm" onClick={() => setShowResetConfirm(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleConfirmReset}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton (loading)                                                  */
/* ------------------------------------------------------------------ */

function ProblemSkeleton({ compact = false }: { compact?: boolean }) {
  const problemPane = (
    <PaneShell className="p-5 md:p-6">
      <div className="space-y-4">
        <Skeleton className="h-7 w-3/4" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <div className="space-y-2.5 pt-1">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-11/12" />
          <Skeleton className="h-3.5 w-10/12" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="space-y-2.5">
          <Skeleton className="h-3.5 w-9/12" />
          <Skeleton className="h-3.5 w-8/12" />
        </div>
      </div>
    </PaneShell>
  );

  const editorPane = (
    <PaneShell className="p-0">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <Skeleton className="h-6 w-24 rounded-md" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
      <div className="flex-1 min-h-0 p-4">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>
    </PaneShell>
  );

  if (compact) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="min-h-0 flex-1">{problemPane}</div>
        <div className="min-h-0 flex-1">{editorPane}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 gap-3">
      <div className="w-[45%] min-w-0">{problemPane}</div>
      <div className="min-w-0 flex-1">{editorPane}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Error state                                                         */
/* ------------------------------------------------------------------ */

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl border border-destructive/30 bg-destructive/5 p-5 shadow-card md:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-destructive/25 bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Couldn't load today's challenge
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              {error.message || "Something went wrong fetching the LeetCode daily challenge."}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground/80">
              The backend service may be temporarily unavailable. You can still open today's problem on LeetCode directly.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={onRetry}>
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="https://leetcode.com/problemset/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Open LeetCode
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              No challenge available
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              LeetCode hasn't published a daily challenge yet, or the upstream service returned an unexpected empty payload.
            </p>
            <div className="mt-5">
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Left Panel: Problem Description                                     */
/* ------------------------------------------------------------------ */

const LEFT_TABS = [
  { label: "Description", icon: FileText },
  { label: "Editorial", icon: BookOpen },
  { label: "Guru AI", icon: Sparkles },
] as const;

/** Token-driven difficulty treatment shared with the rest of the app. */
const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "border-success/30 bg-success/10 text-success",
  Medium: "border-warning/30 bg-warning/10 text-warning",
  Hard: "border-destructive/30 bg-destructive/10 text-destructive",
};

// `theme` is accepted for API symmetry with the editor pane (the panel itself
// is fully theme-token driven, so it does not need to branch on it).
function ProblemDetails({ data, liveSync, onInsertCode }: { data: DailyChallengeResponse, theme?: "dark" | "light", liveSync?: LiveEditorSync | null, onInsertCode?: (code: string) => void }) {
  const { problem, stale } = data;
  const [activeTab, setActiveTab] = useState(0);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  // Build the full problem context for GuruBot — auto-attached live code/testcases/run
  const guruContext = useMemo(() => {
    return buildProblemSolverGuruContext({
      title: problem.title,
      difficulty: problem.difficulty,
      contentHtml: problem.content,
      exampleTestcases: problem.exampleTestcases,
      codeSnippets: problem.codeSnippets,
      hints: problem.hints,
      topicTags: problem.topicTags,
      link: problem.link,
      currentCode: liveSync?.code || "",
      testcaseTabs: liveSync?.testcaseTabs,
      runResult: liveSync?.runResult || null,
      selectedCode: liveSync?.selectedCode || "",
    });
  }, [problem, liveSync]);

  const guruSuggestions = useMemo(() => {
    const hasCode = Boolean(liveSync?.code && liveSync.code.trim().length > 30 && !liveSync.code.includes("TODO: Write your solution"));
    const hasRun = Boolean(liveSync?.runResult);
    return deriveGuruSuggestions({ hasCode, hasRun, runStatus: liveSync?.runResult?.status, exampleTestcases: problem.exampleTestcases });
  }, [liveSync, problem.exampleTestcases]);

  const codeStats = useMemo(() => {
    if (!liveSync?.code) return null;
    const loc = liveSync.code.split("\n").length;
    const chars = liveSync.code.length;
    return { loc, chars, runStatus: liveSync.runResult?.status };
  }, [liveSync]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-card text-card-foreground">
      {/* ── Top Tabs — hidden when Guru AI is open (it renders its own title bar) ── */}
      {activeTab !== 2 && (
      <div
        className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-muted/40 px-2 select-none"
        role="tablist"
        aria-label="Problem sections"
      >
        {LEFT_TABS.map((tab, i) => {
          const Icon = tab.icon;
          const active = activeTab === i;
          return (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(i)}
              className={cn(
                "relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-[13px] transition-colors md:px-4",
                active
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {active && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-primary"
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
            </button>
          );
        })}
        </div>
      )}

      {/* ── Scrollable / Guru Content ── */}
      <div className={`flex-1 min-h-0 flex flex-col ${activeTab === 2 ? "overflow-hidden" : "overflow-y-auto"}`} style={{ scrollbarWidth: "thin" }}>
        <div className={activeTab === 2 ? "flex-1 min-h-0 flex flex-col p-2 md:p-3" : "p-5 md:p-6 space-y-5"}>
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
                <h1 className="text-2xl leading-tight font-bold tracking-tight text-foreground">
                  {problem.title}
                </h1>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Difficulty */}
                  <span
                    className={cn(
                      "inline-flex h-6 items-center rounded-full border px-3 text-xs font-semibold tracking-wide",
                      DIFFICULTY_STYLES[problem.difficulty] ?? "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {problem.difficulty}
                  </span>

                  {/* Hints toggle — only shown when hints exist */}
                  {problem.hints && problem.hints.length > 0 && (
                    <button
                      type="button"
                      aria-expanded={hintsOpen}
                      onClick={() => setHintsOpen(!hintsOpen)}
                      className={cn(
                        "inline-flex h-6 items-center gap-1 rounded-full border px-3 text-xs font-semibold transition-colors",
                        hintsOpen
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Lightbulb className="h-3 w-3" /> Hints ({problem.hints.length})
                    </button>
                  )}

                  {/* Topic tags */}
                  {problem.topicTags.map((t) => (
                    <span
                      key={t.name}
                      className="inline-flex h-6 items-center rounded-md border border-border bg-muted px-2.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {t.name}
                    </span>
                  ))}

                  {stale && (
                    <span className="ml-auto inline-flex h-6 items-center rounded-full border border-warning/30 bg-warning/10 px-3 text-[10px] font-bold uppercase tracking-wide text-warning">
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
                        <div className="mt-4 space-y-2 rounded-xl border border-border bg-muted/40 p-4">
                          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                            Hints
                          </span>
                          <ol className="problem-description space-y-2 pl-5 text-sm">
                            {problem.hints.map((h, i) => (
                              <li
                                key={i}
                                dangerouslySetInnerHTML={{ __html: h }}
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
              className="problem-description max-w-none [&_.example-block]:p-4 [&_.example-block]:my-3 [&_.example-block]:rounded-xl [&_.example-block]:bg-muted/40 [&_.example-block]:border [&_.example-block]:border-border/50 [&_.example-io]:font-mono [&_.example-io]:text-xs [&_.example-io]:font-semibold [&_.example-io]:text-primary"
            >
              <div dangerouslySetInnerHTML={{ __html: problem.content }} />
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div {...fadeIn} className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Official Editorial
              </h2>
              {problem.solution ? (
                  <div className="editorial-content">
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
                        },
                        img({ src, alt, ...props }) {
                          return (
                            <img
                              src={src}
                              alt={alt || ""}
                              {...props}
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          );
                        },
                        iframe({ src }) {
                          const url = src || "";
                          return (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="my-5 flex items-center gap-2 rounded-xl border border-border bg-muted px-5 py-3.5 text-sm font-semibold text-foreground no-underline transition-colors hover:bg-muted/70 hover:no-underline"
                            >
                              <ExternalLink size={16} />
                              View Implementation on LeetCode
                            </a>
                          );
                        },
                      }}
                    >
                      {problem.solution}
                    </ReactMarkdown>
                  </div>
              ) : (
                <div className="space-y-4 rounded-xl border border-dashed border-border bg-muted/30 p-6">
                  <p className="text-center text-sm font-medium leading-6 text-muted-foreground">
                    The official editorial couldn't be loaded for this problem — it may be LeetCode-premium only.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        label: "LeetCode Editorial",
                        href: `https://leetcode.com/problems/${problem.titleSlug}/editorial/`,
                        icon: <ExternalLink size={14} />,
                      },
                      {
                        label: "Community Solutions",
                        href: `https://leetcode.com/problems/${problem.titleSlug}/solutions/`,
                        icon: <ExternalLink size={14} />,
                      },
                      {
                        label: "Video Walkthrough",
                        href: `https://www.youtube.com/results?search_query=${encodeURIComponent(problem.title + " leetcode solution")}`,
                        icon: <ExternalLink size={14} />,
                      },
                      {
                        label: "Ask Guru AI",
                        action: () => setActiveTab(2),
                        icon: <BrainCircuit size={14} />,
                      },
                    ].map((l) =>
                      l.action ? (
                        <button
                          key={l.label}
                          type="button"
                          onClick={l.action}
                          className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                        >
                          {l.icon}
                          {l.label}
                        </button>
                      ) : (
                        <a
                          key={l.label}
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground no-underline transition-colors hover:bg-muted"
                        >
                          {l.icon}
                          {l.label}
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 2 && (
            <>
              <motion.div {...fadeIn} className={`flex flex-1 min-h-0 flex-col overflow-hidden rounded-xl border ${isFullscreen ? "hidden" : "border-border bg-card shadow-soft"}`}>
                <GuruBot
                  open={true}
                  onClose={() => setActiveTab(0)}
                  embedded={true}
                  debugMode={true}
                  initialContext={guruContext}
                  questionId={problem.questionId}
                  suggestedPrompts={guruSuggestions}
                  onInsertCode={onInsertCode}
                  showGuruTitle={true}
                  onToggleFullscreen={() => setIsFullscreen(true)}
                  isFullscreen={false}
                />
              </motion.div>
              {isFullscreen && createPortal(
                <div className={`fixed inset-0 z-[100] flex flex-col animate-in fade-in duration-200 bg-background`}>
                  <GuruBot
                    open={true}
                    onClose={() => setIsFullscreen(false)}
                    embedded={true}
                    debugMode={true}
                    initialContext={guruContext}
                    questionId={problem.questionId}
                    suggestedPrompts={guruSuggestions}
                    onInsertCode={onInsertCode}
                    showGuruTitle={true}
                    onToggleFullscreen={() => setIsFullscreen(false)}
                    isFullscreen={true}
                  />
                </div>,
                document.body
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Bottom Bar — back link + external problem link ── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-2.5 select-none">
        {/* Back to home */}
        <Link
          to="/"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </Link>

        {/* Open on LeetCode */}
        <a
          href={problem.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
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
  const [liveSync, setLiveSync] = useState<LiveEditorSync | null>(null);
  const [guruInsert, setGuruInsert] = useState<{ code: string; nonce: number } | null>(null);
  const handleGuruInsert = useCallback((code: string) => {
    setGuruInsert({ code, nonce: Date.now() });
  }, []);

  // Below `lg` a side-by-side split leaves both panes too narrow, so we fall
  // back to a single pane with a switcher — the same responsive contract the
  // rest of the app uses for split workspaces.
  const isCompact = useMediaQuery("(max-width: 1023px)");
  const [pane, setPane] = useState<"problem" | "code">("problem");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-0 flex-col bg-background p-3 md:p-4"
    >
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <ProblemSkeleton compact={isCompact} />
        ) : isError ? (
          <ErrorState
            error={error instanceof Error ? error : new Error("Unknown error")}
            onRetry={() => { void refetch(); }}
          />
        ) : isEmpty ? (
          <EmptyState onRetry={() => { void refetch(); }} />
        ) : data ? (
          isCompact ? (
            <div className="flex h-full min-h-0 flex-col gap-3">
              <SegmentedControl<"problem" | "code">
                value={pane}
                onChange={setPane}
                fullWidth
                className="shrink-0"
                options={[
                  { value: "problem", label: "Problem", icon: <FileText className="h-3.5 w-3.5" /> },
                  { value: "code", label: "Editor", icon: <Code className="h-3.5 w-3.5" /> },
                ]}
              />
              <div className="min-h-0 flex-1">
                {pane === "problem" ? (
                  <PaneShell>
                    <ProblemDetails data={data} theme={theme} liveSync={liveSync} onInsertCode={handleGuruInsert} />
                  </PaneShell>
                ) : (
                  <CodeEditorPane
                    questionId={data.problem.questionId}
                    theme={theme}
                    exampleTestcases={data.problem.exampleTestcases}
                    codeSnippets={data.problem.codeSnippets}
                    problemContent={data.problem.content}
                    onLiveSync={setLiveSync}
                    insertTrigger={guruInsert}
                  />
                )}
              </div>
            </div>
          ) : (
            <PanelGroup
              direction="horizontal"
              autoSaveId="problem-solver-split-v5"
              className="h-full w-full"
            >
              <Panel defaultSize={45} minSize={25} className="min-w-0">
                <PaneShell>
                  <ProblemDetails data={data} theme={theme} liveSync={liveSync} onInsertCode={handleGuruInsert} />
                </PaneShell>
              </Panel>

              <PanelResizeHandle className="group relative z-50 flex w-3 shrink-0 items-center justify-center cursor-col-resize">
                <div className="h-12 w-1.5 rounded-full bg-border transition-all duration-300 group-hover:w-2 group-hover:bg-primary/60 group-active:bg-primary" />
              </PanelResizeHandle>

              <Panel defaultSize={55} minSize={30} className="min-w-0">
                <CodeEditorPane
                  questionId={data.problem.questionId}
                  theme={theme}
                  exampleTestcases={data.problem.exampleTestcases}
                  codeSnippets={data.problem.codeSnippets}
                  problemContent={data.problem.content}
                  onLiveSync={setLiveSync}
                  insertTrigger={guruInsert}
                />
              </Panel>
            </PanelGroup>
          )
        ) : null}
      </div>
    </motion.div>
  );
}
