// ProblemSolver — LeetCode Daily Challenge page.
//
// Two-pane resizable layout (problem details on the left, Monaco Java editor
// + Wandbox Java Run & Compile runner on the right). Fetches the daily challenge
// via `useDailyChallenge`, which hits the `leetcode-daily` Supabase edge function.
//
// User code is persisted to Supabase `daily_challenge_user_code` for logged-in
// users, with localStorage as a fallback for guests.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  Minimize,
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
function migrateStaleSolveCode(questionId: string): void {
  try {
    const k = lsKey(questionId);
    const raw = localStorage.getItem(k);
    if (!raw) return;
    let shouldPurge = false;
    if (isGenericSolveTemplate(raw)) shouldPurge = true;
    else if (raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((t: { content?: string }) => t.content && isGenericSolveTemplate(t.content))) shouldPurge = true;
        if (Array.isArray(parsed) && parsed.length === 1 && parsed[0]?.content && isGenericSolveTemplate(parsed[0].content)) shouldPurge = true;
      } catch {}
    }
    if (shouldPurge) localStorage.removeItem(k);
  } catch {}
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

// LeetCode-exact 3-color dark theme — blue (keywords) + green (types) + cream (identifiers) like LeetCode screenshot
const LEETCODE_DARK_THEME = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "", foreground: "D4D4D4", background: "1A1A1A" },
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
    "editor.background": "#1A1A1A",
    "editor.foreground": "#D4D4D4",
    "editorLineNumber.foreground": "#858585",
    "editorLineNumber.activeForeground": "#C6C6C6",
    "editorGutter.background": "#1A1A1A",
    "editor.lineHighlightBackground": "#2D2D30",
    "editor.lineHighlightBorder": "#00000000",
    "editor.selectionBackground": "#264F78AA",
    "editor.inactiveSelectionBackground": "#3A3D41AA",
    "editorCursor.foreground": "#AEAFAD",
    "editorIndentGuide.background": "#404040",
    "editorIndentGuide.activeBackground": "#707070",
    "editorBracketMatch.background": "#515C6A55",
    "editorBracketMatch.border": "#888888",
    "scrollbar.shadow": "#00000000",
    "scrollbarSlider.background": "#79797966",
    "scrollbarSlider.hoverBackground": "#646464B3",
    "scrollbarSlider.activeBackground": "#BFBFBF66",
    "editorWidget.background": "#252526",
    "editorSuggestWidget.background": "#252526",
    "editorSuggestWidget.foreground": "#D4D4D4",
    "editorSuggestWidget.selectedBackground": "#2A2D2E",
  },
} as const;

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
  const [editorFontSize, setEditorFontSize] = useState(() => loadNumberSetting("problem-solver-font-size", 14));
  const [selectedCode, setSelectedCode] = useState("");

  useEffect(() => {
    localStorage.setItem("problem-solver-font-size", String(editorFontSize));
  }, [editorFontSize]);

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
    migrateStaleSolveCode(questionId);
    void purgeStaleSolveCodeFromDB(questionId, userId);
  }, [questionId, userId]);

  // Load saved code from DB / localStorage on mount or question change
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

        // If we discarded a stale generic save in favor of a real LeetCode starter, purge it permanently from DB + localStorage
        if (isDefault && hasRealSnippet && saved) {
          migrateStaleSolveCode(questionId);
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
      // Purge DB generic and persist healed content to both localStorage + DB
      void purgeStaleSolveCodeFromDB(questionId, userId).then(() => {
        void persistCode(questionId, JSON.stringify(healedTabs), userId);
      });
      setRunResult(null);
    }
  }, [initialJavaSnippet, hasRealStarter, codeLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

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
    // LeetCode-exact theme — defined once
    try {
      // @ts-ignore — Monaco theme API
      monaco.editor.defineTheme("leetcode-dark", LEETCODE_DARK_THEME as any);
      // apply immediately — force LeetCode dark regardless of isDark flash
      monaco.editor.setTheme(theme === "dark" ? "leetcode-dark" : "light");
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

  // Keep Monaco theme in sync with app theme (LeetCode dark vs light)
  useEffect(() => {
    try {
      const m: any = monacoRef.current;
      if (m?.editor) m.editor.setTheme(theme === "dark" ? "leetcode-dark" : "light");
      // also ensure defined if mount hasn't happened yet
      if (!m && typeof window !== "undefined" && (window as any).monaco?.editor) {
        (window as any).monaco.editor.defineTheme("leetcode-dark", LEETCODE_DARK_THEME as any);
        (window as any).monaco.editor.setTheme(theme === "dark" ? "leetcode-dark" : "light");
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
      autoSaveId="editor-testcases-split-v3"
      className="h-full"
      style={{ background: "transparent" }}
    >
      {/* ═════════ Editor Panel ═════════ */}
      <Panel defaultSize={62} minSize={30} className="flex flex-col min-h-0 rounded-xl overflow-hidden shadow-sm" style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
        <div className="flex flex-col h-full" style={{ background: isDark ? "#1A1A1A" : "#ffffff" }}>
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
              disabled={!codeLoaded || !hasRealStarter}
              className="h-7 w-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              title={
                !codeLoaded
                  ? "Loading saved code..."
                  : !hasRealStarter
                    ? "Daily challenge still loading — reset available once LeetCode signature is loaded"
                    : "Reset to starter template (today's LeetCode signature)"
              }
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
            <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: isDark ? "#1A1A1A" : "#fafafa" }}>
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: isDark ? "#64748b" : "#94a3b8" }} />
            </div>
          )}
          <Editor
            height="100%"
            language="java"
            theme={isDark ? "leetcode-dark" : "light"}
            value={code}
            onChange={handleChange}
            beforeMount={(monaco) => {
              try { monaco.editor.defineTheme("leetcode-dark", LEETCODE_DARK_THEME as any); } catch {}
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
              <motion.div key="running" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col items-center justify-center gap-5 py-10 relative overflow-hidden">
                {/* soft ambient glow */}
                <div className="absolute inset-0 pointer-events-none">
                  <motion.div animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.05, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-32 rounded-full blur-3xl" style={{ background: isDark ? "radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 35%, transparent 75%)" : "radial-gradient(ellipse at center, rgba(99,102,241,0.10) 0%, transparent 70%)" }} />
                </div>

                {/* orbital icon */}
                <div className="relative">
                  {/* outer orbit */}
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute -inset-3 rounded-2xl" style={{ border: `1px dashed ${isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.18)"}`, borderTopColor: isDark ? "rgba(99,102,241,0.45)" : "rgba(99,102,241,0.35)" }} />
                  {/* ping ring */}
                  <motion.div animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0, 0.25] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} className="absolute -inset-2 rounded-2xl" style={{ border: `1px solid ${isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.2)"}` }} />
                  <div className="relative h-14 w-14 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg" style={{ background: isDark ? "linear-gradient(135deg, #1e1e3f 0%, #1a1a2e 55%, #16162a 100%)" : "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)", border: `1px solid ${isDark ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.14)"}`, boxShadow: isDark ? "0 8px 32px rgba(99,102,241,0.20), inset 0 1px 0 rgba(255,255,255,0.06)" : "0 8px 24px rgba(99,102,241,0.12)" }}>
                    {/* shimmer sweep */}
                    <motion.div animate={{ x: ["-120%", "120%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }} className="absolute inset-0" style={{ background: `linear-gradient(100deg, transparent 20%, ${isDark ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.08)"} 30%, transparent 42%)` }} />
                    <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} style={{ display: "flex" }}>
                      <Code className="h-6 w-6" style={{ color: "#6366f1" }} />
                    </motion.div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)", border: `2px solid ${isDark ? "#16162a" : "#ffffff"}` }}>
                      <Rocket className="h-2.5 w-2.5 text-white" />
                    </span>
                  </div>
                </div>

                {/* title with shimmer + typing dots */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black tracking-[0.14em] uppercase" style={{ background: isDark ? "linear-gradient(90deg, #a5b4fc 0%, #c4b5fd 45%, #fbbf24 100%)" : "linear-gradient(90deg, #6366f1 0%, #8b5cf6 55%, #f59e0b 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                      Compiling & Running
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black tracking-widest uppercase" style={{ background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)", color: "#818cf8", border: `1px solid ${isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.14)"}` }}>
                      <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#10b981" }} /> Java 21
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold tracking-wide" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>javac • java • wandbox</span>
                    <span className="flex gap-1 ml-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span key={i} animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.85, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }} className="h-1.5 w-1.5 rounded-full" style={{ background: isDark ? "#6366f1" : "#6366f1" }} />
                      ))}
                    </span>
                  </div>
                </div>

                {/* faux terminal */}
                <div className="relative z-10 w-full max-w-[320px] rounded-xl overflow-hidden" style={{ background: isDark ? "rgba(13,13,22,0.85)" : "rgba(255,255,255,0.9)", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, boxShadow: isDark ? "0 10px 40px rgba(0,0,0,0.35)" : "0 10px 30px rgba(0,0,0,0.08)", backdropFilter: "blur(10px)" }}>
                  <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444" }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b" }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#10b981" }} />
                    <span className="ml-auto text-[10px] font-mono tracking-wide" style={{ color: isDark ? "#475569" : "#94a3b8" }}>prog.java</span>
                  </div>
                  <div className="px-3 py-2.5 font-mono text-[11px] leading-4 space-y-1">
                    <div className="flex gap-2"><span style={{ color: "#f59e0b" }}>$</span><motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ color: isDark ? "#cbd5e1" : "#334155" }}>javac -cp . Solution.java</motion.span></div>
                    <div className="flex gap-2"><span style={{ color: "#10b981" }}>✓</span><span style={{ color: isDark ? "#64748b" : "#94a3b8" }}>compiled in 0.42s</span></div>
                    <div className="flex gap-2"><span style={{ color: "#f59e0b" }}>$</span><motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ color: isDark ? "#cbd5e1" : "#334155" }}>java Main • {testcaseTabs.length} case{testcaseTabs.length > 1 ? "s" : ""}</motion.span><motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.7, repeat: Infinity }} style={{ color: "#6366f1" }}>▌</motion.span></div>
                  </div>
                  {/* progress bar */}
                  <div className="h-[2px] w-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                    <motion.div className="h-full" style={{ background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 45%, #f59e0b 100%)" }} initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ duration: 1.8, repeat: Infinity, ease: [0.4, 0, 0.2, 1], repeatDelay: 0.15 }} />
                  </div>
                </div>

                {/* stepper */}
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase" style={{ color: isDark ? "#475569" : "#94a3b8" }}>
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 8px rgba(16,185,129,0.5)" }} /> Compile</span>
                  <span style={{ color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }}>—</span>
                  <span className="flex items-center gap-1.5" style={{ color: "#f59e0b" }}><motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} className="h-1.5 w-1.5 rounded-full" style={{ background: "#f59e0b", boxShadow: "0 0 8px rgba(245,158,11,0.5)" }} /> Run</span>
                  <span style={{ color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }}>—</span>
                  <span className="flex items-center gap-1.5 opacity-60"><span className="h-1.5 w-1.5 rounded-full border" style={{ borderColor: isDark ? "#475569" : "#94a3b8" }} /> Verify</span>
                </div>
              </motion.div>
            ) : runResult ? (
              (() => {
                // Compile/runtime error -> show single error box
                if (runResult.status === "compile_error" || runResult.status === "runtime_error" || runResult.status === "error") {
                  return (
                    <motion.div key="result-error" {...fadeIn} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: runResult.status === "compile_error" ? "#f87171" : "#fbbf24" }}>
                          {runResult.status === "compile_error" ? <><XCircle className="h-4 w-4" /> Compile Error</> : <><AlertTriangle className="h-4 w-4" /> Runtime Error</>}
                        </span>
                        <button onClick={() => setRunResult(null)} className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium transition-all hover:scale-105" style={{ color: isDark ? "#94a3b8" : "#64748b", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                          <RotateCcw className="h-3.5 w-3.5" /> Reset
                        </button>
                      </div>
                      <div className="p-4 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto" style={{ background: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.06)", border: `1px solid ${isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.12)"}`, color: "#f87171" }}>
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
                    {/* Tabs row with pass/fail icons like screenshot */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {testcaseTabs.map((tc, i) => {
                        const st = caseStatuses[i];
                        const isActive = tc.id === activeTestcaseId;
                        const isPassed = st.passed;
                        const isFailed = !st.passed && !st.isCustom;
                        return (
                          <div key={tc.id} onClick={() => setActiveTestcaseId(tc.id)} className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all min-w-max select-none border" style={{
                            background: isActive ? (isFailed ? "rgba(239,68,68,0.1)" : isPassed && !st.isCustom ? "rgba(16,185,129,0.12)" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "transparent",
                            color: isFailed ? "#f87171" : isPassed && !st.isCustom ? "#10b981" : isActive ? (isDark ? "#e2e8f0" : "#1e293b") : (isDark ? "#64748b" : "#94a3b8"),
                            borderColor: isActive ? (isFailed ? "rgba(239,68,68,0.18)" : isPassed && !st.isCustom ? "rgba(16,185,129,0.18)" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "transparent",
                          }}>
                            {isFailed ? <X className="h-3.5 w-3.5" /> : isPassed && !st.isCustom ? <Check className="h-3.5 w-3.5" /> : null}
                            {tc.name}
                            {testcaseTabs.length > 1 && (
                              <button onClick={(e) => { e.stopPropagation(); const newTabs = testcaseTabs.filter((t) => t.id !== tc.id); setTestcaseTabs(newTabs); if (activeTestcaseId === tc.id) setActiveTestcaseId(newTabs[newTabs.length-1]?.id || "1"); }} className="p-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10 ml-1">
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      <button onClick={() => { const newId = String(Date.now()); const name = `Case ${testcaseTabs.length + 1}`; const newTabs = [...testcaseTabs, { id: newId, name, value: "" }]; setTestcaseTabs(newTabs); setActiveTestcaseId(newId); }} className="ml-1 p-1.5 rounded-full border border-dashed transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: isDark ? "#64748b" : "#94a3b8", borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)" }} title="Add custom testcase">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setRunResult(null)} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105" style={{ color: isDark ? "#94a3b8" : "#64748b", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
                        <RotateCcw className="h-3.5 w-3.5" /> Reset
                      </button>
                    </div>

                    {/* Overall status like screenshot: ✓ Accepted */}
                    <div className="flex items-center gap-2">
                      {allPassed ? <Check className="h-4 w-4" style={{ color: "#10b981" }} /> : <X className="h-4 w-4" style={{ color: "#f87171" }} />}
                      <span className="text-sm font-bold" style={{ color: allPassed ? "#10b981" : "#f87171" }}>{overallStatus}</span>
                      {hasExpected && <span className="text-xs" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>{passedCount} / {testcaseTabs.length} passed</span>}
                      <span className="ml-auto flex items-center gap-1 text-[10px] font-mono" style={{ color: "#64748b" }}><Clock className="h-3 w-3" /> {runResult.executionTimeMs}ms</span>
                    </div>

                    {/* Active case details - Input / Your Output / Expected Output */}
                    {activeTab && activeStatus && (
                      <div className="space-y-3">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>{inputLabel}</div>
                          <div className="w-full p-3 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap break-all border" style={{ background: isDark ? "rgba(30,30,55,0.6)" : "#f8f8fc", borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", color: isDark ? "#cbd5e1" : "#1e293b" }}>
                            {activeTab.value || "(empty)"}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>Your Output</div>
                            <div className="w-full p-3 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap break-all border" style={{ background: isDark ? "rgba(30,30,55,0.6)" : "#f8f8fc", borderColor: activeStatus.passed || activeStatus.isCustom ? (isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.2)") : (isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.2)"), color: activeStatus.passed || activeStatus.isCustom ? (isDark ? "#cbd5e1" : "#1e293b") : "#f87171" }}>
                              {activeStatus.your || "(no output)"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>Expected Output</div>
                            <div className="w-full p-3 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap break-all border" style={{ background: isDark ? "rgba(30,30,55,0.6)" : "#f8f8fc", borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", color: isDark ? "#cbd5e1" : "#1e293b" }}>
                              {activeStatus.isCustom ? <span style={{ color: isDark ? "#475569" : "#94a3b8", fontStyle: "italic" }}>No expected — custom case</span> : (activeStatus.expected || "(not found)")}
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

      {showResetConfirm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setShowResetConfirm(false)}
          />
          {/* modal — matches screenshot: dark rounded card */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-confirm-title"
            className="relative w-full max-w-[420px] rounded-2xl border shadow-2xl flex items-start gap-4 p-5 sm:p-6"
            style={{
              background: "#2a2a2a",
              borderColor: "rgba(255,255,255,0.08)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {/* green info circle */}
            <div className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center" style={{ background: "#22c55e" }}>
              <span className="text-white font-bold text-[18px] leading-none">i</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="reset-confirm-title" className="text-[15px] font-semibold text-white leading-tight">Are you sure?</h3>
              <p className="mt-1.5 text-[13px] leading-[1.45] text-[#a3a3a3]">
                Your current code will be discarded and reset to the default code!
              </p>
              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="h-8 px-4 rounded-lg text-[13px] font-medium transition-colors"
                  style={{ background: "#3a3a3a", color: "#d4d4d4" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#404040")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#3a3a3a")}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="h-8 px-5 rounded-lg text-[13px] font-semibold text-white transition-colors shadow-sm"
                  style={{ background: "#22c55e" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#16a34a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#22c55e")}
                >
                  Confirm
                </button>
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

function ProblemDetails({ data, theme, liveSync, onInsertCode }: { data: DailyChallengeResponse, theme: "dark" | "light", liveSync?: LiveEditorSync | null, onInsertCode?: (code: string) => void }) {
  const { problem, stale } = data;
  const [activeTab, setActiveTab] = useState(0);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isDark = theme === "dark";

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
    <div className="flex flex-col h-full overflow-hidden" style={{ background: isDark ? "#16162a" : "#ffffff" }}>
      {/* ── Top Tabs — single row when Guru AI active (all controls in one line) ── */}
      {activeTab !== 2 && (
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
      )}

      {/* ── Scrollable / Guru Content ── */}
      <div className={`flex-1 min-h-0 flex flex-col ${activeTab === 2 ? "overflow-hidden" : "overflow-y-auto"}`} style={{ scrollbarWidth: "thin" }}>
        <div className={activeTab === 2 ? "flex-1 min-h-0 flex flex-col p-2 md:p-3 bg-muted/[0.04]" : "p-6 space-y-6"}>
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
                              className="flex items-center gap-2 my-5 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 no-underline hover:no-underline"
                              style={{
                                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                                border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
                                color: isDark ? "#93c5fd" : "#2563eb",
                              }}
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
            <>
              <motion.div {...fadeIn} className={`flex flex-col flex-1 min-h-0 rounded-xl overflow-hidden border relative shadow-sm ${isFullscreen ? "hidden" : (isDark ? "border-[#262626] bg-[#0F0F0F]" : "border-zinc-200 bg-white")}`}>
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
                <div className={`fixed inset-0 z-[100] flex flex-col animate-in fade-in duration-200 ${isDark ? "bg-[#0F0F0F]" : "bg-white"}`}>
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
  const [liveSync, setLiveSync] = useState<LiveEditorSync | null>(null);
  const [guruInsert, setGuruInsert] = useState<{ code: string; nonce: number } | null>(null);
  const handleGuruInsert = useCallback((code: string) => {
    setGuruInsert({ code, nonce: Date.now() });
  }, []);

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
              <ProblemDetails data={data} theme={theme} liveSync={liveSync} onInsertCode={handleGuruInsert} />
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
                codeSnippets={data.problem.codeSnippets}
                problemContent={data.problem.content}
                onLiveSync={setLiveSync}
                insertTrigger={guruInsert}
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
