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
import { ALGOGURU_LIGHT_THEME, LEETCODE_DARK_THEME } from "@/lib/monacoTheme";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  Code,
  Copy,
  CornerDownLeft,
  ExternalLink,
  BookOpen,
  FileText,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  Play,
  ListChecks,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
  XCircle,
  Terminal,
  Maximize2,
  Minimize2,
  BrainCircuit,
  Sparkles,
} from "lucide-react";

import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GuruBot } from "@/components/GuruBot";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailyChallengeResponse } from "@/types/leetcode";
import type { SolutionBlock as SolutionBlockType } from "@/types/leetcode";
import {
  normalizeLanguageSlug,
  pickDefaultLanguage,
  splitEditorialMarkdown,
} from "@/lib/editorialPlayground";
import {
  generateHarnessMain,
  parseSolutionSignature,
  chunkTestCases,
} from "@/lib/javaHarness";
import { extractExpectedOutputs } from "@/lib/extractExpectedOutputs";
import {
  buildProblemSolverGuruContext,
  deriveGuruSuggestions,
} from "@/lib/guruContext";
import { toast } from "@/hooks/use-toast";
import * as prettier from "prettier/standalone";
import * as prettierPluginJava from "prettier-plugin-java";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vs,
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";
import "./ProblemSolver.css";

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
  return (
    n.includes("public int solve()") &&
    n.includes("return 0;") &&
    n.includes("Running Java solution")
  );
}
function buildStarterFromSnippet(snippet: string | undefined): string {
  if (!snippet) return DEFAULT_JAVA_TEMPLATE;
  const hasImport = /^\s*import\s+/m.test(snippet);
  return hasImport ? snippet : `import java.util.*;\n\n${snippet}`;
}

async function purgeStaleSolveCodeFromDB(
  questionId: string,
  userId: string | null,
): Promise<void> {
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
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every(
            (t: { content?: string }) =>
              t.content && isGenericSolveTemplate(t.content),
          )
        )
          shouldPurge = true;
      } catch {}
    }
    if (shouldPurge) {
      await supabase
        .from("daily_challenge_user_code")
        .delete()
        .eq("user_id", userId)
        .eq("question_id", questionId);
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
        {
          user_id: userId,
          question_id: questionId,
          code,
          updated_at: new Date().toISOString(),
        },
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

async function runJavaCode(
  sourceCode: string,
  stdin: string = "",
): Promise<RunResult> {
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
      return {
        status: "error",
        output: `HTTP ${res.status}: ${await res.text()}`,
        executionTimeMs: ms,
      };
    }

    const d = (await res.json()) as Record<string, string | undefined>;

    if (d.compiler_error || d.compiler_message) {
      const msg = (d.compiler_error || d.compiler_message || "").trim();
      if (msg)
        return {
          status: "compile_error",
          output: msg,
          compilerMessage: msg,
          executionTimeMs: ms,
        };
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
      output:
        d.program_output ||
        d.program_message ||
        "Program executed (no output).",
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

/** Toolbar buttons shared by both editorial code block flavours. */
function CodeBlockActions({
  codeText,
  onInsert,
}: {
  codeText: string;
  onInsert?: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-1">
      {onInsert && (
        <button
          onClick={() => onInsert(codeText)}
          title="Insert this solution into the code editor"
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08]"
        >
          <CornerDownLeft size={13} />
          Insert into editor
        </button>
      )}
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(codeText);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
          copied
            ? "bg-[#1f3a2a] text-emerald-400"
            : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08]"
        }`}
      >
        {copied ? (
          <Check size={13} className="text-emerald-400" />
        ) : (
          <Copy size={13} />
        )}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/** Shared dark code-block chrome: toolbar row + highlighted body. */
function CodeBlockShell({
  toolbarLeft,
  actions,
  lang,
  codeText,
}: {
  toolbarLeft: React.ReactNode;
  actions: React.ReactNode;
  lang: string;
  codeText: string;
}) {
  return (
    <div className="my-5 rounded-xl overflow-hidden border border-[#2e2e2e] bg-[#1a1a1a]">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#232323] border-b border-[#2e2e2e]">
        {toolbarLeft}
        {actions}
      </div>
      <div className="bg-[#1a1a1a] overflow-x-auto">
        <SyntaxHighlighter
          language={lang}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1.25rem 1.5rem",
            background: "#1a1a1a",
            fontSize: "0.82rem",
          }}
          codeTagProps={{
            style: { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
          }}
        >
          {codeText}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

/** Static block for a plain fenced code block inside editorial prose. */
function EditorialCodeBlock({
  children,
  className,
  onInsert,
}: {
  children: React.ReactNode;
  className?: string;
  /** When provided, offer a one-click "Insert into editor" action. */
  onInsert?: (code: string) => void;
}) {
  const lang = (className?.replace("language-", "") || "text").toLowerCase();
  const codeText = extractText(children).replace(/\n$/, "");

  return (
    <CodeBlockShell
      lang={lang}
      codeText={codeText}
      toolbarLeft={
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-mono tracking-wide uppercase bg-[#2d2d2d] text-zinc-400 border border-[#3a3a3a]">
          {lang}
        </span>
      }
      actions={<CodeBlockActions codeText={codeText} onInsert={onInsert} />}
    />
  );
}

/**
 * Editorial implementation block with a language switcher.
 *
 * LeetCode stores each approach's code in a playground holding the same
 * solution in ~9 languages; this exposes that whole set instead of the single
 * language the old fenced-block rendering baked in.
 */
function EditorialSolutionBlock({
  block,
  editorLanguage,
  onInsert,
}: {
  block: SolutionBlockType;
  /** The reader's current editor language, preferred as the default. */
  editorLanguage?: string | null;
  onInsert?: (code: string) => void;
}) {
  const languages = block.languages;
  const initial = useMemo(() => {
    const available = languages.map((l) => l.langSlug);
    const authorPick = normalizeLanguageSlug(block.defaultLangSlug);
    // Prefer the reader's own language, then the author's, then the usual order.
    return (
      pickDefaultLanguage(available, editorLanguage) ??
      pickDefaultLanguage(available, authorPick) ??
      available[0]
    );
  }, [languages, editorLanguage, block.defaultLangSlug]);

  const [active, setActive] = useState(initial);

  // The response can swap under us (cache refetch, date rollover); keep the
  // selection valid rather than rendering a language that no longer exists.
  useEffect(() => setActive(initial), [initial]);

  const current = languages.find((l) => l.langSlug === active) ?? languages[0];
  if (!current) return null;
  const codeText = current.code.replace(/\n$/, "");

  return (
    <CodeBlockShell
      lang={current.langSlug}
      codeText={codeText}
      toolbarLeft={
        <label className="flex items-center gap-2 min-w-0">
          <span className="sr-only">Solution language</span>
          <select
            value={current.langSlug}
            onChange={(e) => setActive(e.target.value)}
            className="appearance-none rounded-md border border-[#3a3a3a] bg-[#2d2d2d] py-1 pl-2.5 pr-7 text-[11px] font-medium tracking-wide text-zinc-200 outline-none transition-colors hover:bg-[#333] focus:border-primary/60 cursor-pointer"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.5rem center",
            }}
          >
            {languages.map((l) => (
              <option
                key={l.langSlug}
                value={l.langSlug}
                className="bg-[#232323] text-zinc-100"
              >
                {l.label}
              </option>
            ))}
          </select>
          {languages.length > 1 && (
            <span className="hidden sm:inline text-[10px] font-medium text-zinc-500">
              {languages.length} languages
            </span>
          )}
        </label>
      }
      actions={<CodeBlockActions codeText={codeText} onInsert={onInsert} />}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Micro-animation helpers                                             */
/* ------------------------------------------------------------------ */

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.15 },
};

function handleTabListKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'),
  );
  const current = tabs.indexOf(event.target as HTMLElement);
  if (current < 0) return;
  event.preventDefault();
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
          tabs.length;
  tabs[next]?.focus();
  tabs[next]?.click();
}

/* ------------------------------------------------------------------ */
/* Shared pane surface — the app-wide card treatment                   */
/* ------------------------------------------------------------------ */

/** A shared surface keeps problem, editor, and console chrome consistent. */
function PaneShell({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "solver-pane flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground",
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

  const [tabs, setTabs] = useState<FileTab[]>([
    { id: "1", name: "Solution.java", content: DEFAULT_JAVA_TEMPLATE },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("1");
  const code = tabs.find((t) => t.id === activeTabId)?.content ?? "";

  const setCode = useCallback(
    (newContent: string) => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId ? { ...t, content: newContent } : t,
        ),
      );
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
  const buildTestTabs = useCallback(
    (raw?: string, snippet?: string | null) => {
      const normalized = (raw || "").replace(/\\n/g, "\n");
      if (!normalized.trim()) return [{ id: "1", name: "Case 1", value: "" }];
      // Try to chunk by param count if we have signature available
      try {
        const javaCode =
          snippet ||
          codeSnippets?.find((s) => s.langSlug === "java")?.code ||
          "";
        const sig = javaCode ? parseSolutionSignature(javaCode) : null;
        const paramCount = sig?.params.length ?? 1;
        const chunks = chunkTestCases(normalized, Math.max(paramCount, 1));
        if (chunks.length > 0) {
          return chunks.map((c, i) => ({
            id: String(i + 1),
            name: `Case ${i + 1}`,
            value: c.join("\n"),
          }));
        }
      } catch {}
      // Fallback: one tab per non-empty line
      const lines = normalized
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length <= 1)
        return [{ id: "1", name: "Case 1", value: normalized }];
      return lines.map((l, i) => ({
        id: String(i + 1),
        name: `Case ${i + 1}`,
        value: l,
      }));
    },
    [codeSnippets],
  );

  const [testcaseTabs, setTestcaseTabs] = useState<
    { id: string; name: string; value: string }[]
  >(() => buildTestTabs(exampleTestcases));
  const [activeTestcaseId, setActiveTestcaseId] = useState<string>("1");
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [selectedCode, setSelectedCode] = useState("");
  // Bottom console view: testcase editor vs. LeetCode-style Test Result
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">(
    "testcase",
  );
  // Testcase panel collapse — when dragged small, only the tab strip stays visible
  const [testPanelCollapsed, setTestPanelCollapsed] = useState(false);
  const testPanelRef = useRef<ImperativePanelHandle>(null);
  // Fullscreen editor mode — editor takes over the whole workspace (Esc exits)
  const [editorFullscreen, setEditorFullscreen] = useState(false);

  useEffect(() => {
    if (!editorFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditorFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editorFullscreen]);

  // Update local testcases if exampleTestcases changes (e.g., new daily challenge)
  useEffect(() => {
    const snippet =
      codeSnippets?.find((s) => s.langSlug === "java")?.code || null;
    setTestcaseTabs(buildTestTabs(exampleTestcases, snippet));
    setActiveTestcaseId("1");
  }, [exampleTestcases, codeSnippets, buildTestTabs]);

  // Expected outputs parsed from problem HTML (LeetCode example blocks)
  const expectedOutputs = useMemo(
    () => extractExpectedOutputs(problemContent || ""),
    [problemContent],
  );

  // Derive param names for input label (e.g., N, s, nums)
  const paramNames = useMemo(() => {
    try {
      const javaCode =
        codeSnippets?.find((s) => s.langSlug === "java")?.code || "";
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
    return (
      !isGenericSolveTemplate(initialJavaSnippet) &&
      initialJavaSnippet !== DEFAULT_JAVA_TEMPLATE
    );
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
          return (
            n === defaultNorm ||
            n === starterNorm ||
            isGenericSolveTemplate(codeStr)
          );
        };

        // Permanent rule: never restore a generic solve() template if starter is real LeetCode signature
        const hasRealSnippet =
          !isGenericStarter && starter !== DEFAULT_JAVA_TEMPLATE;

        if (saved && isGenericSolveTemplate(saved) && hasRealSnippet) {
          isDefault = true;
        } else if (saved && !saved.startsWith("[")) {
          if (checkIsStarter(saved))
            isDefault = hasRealSnippet
              ? true
              : isDefault || checkIsStarter(saved);
          if (isGenericSolveTemplate(saved) && hasRealSnippet) isDefault = true;
        } else if (saved && saved.startsWith("[")) {
          try {
            const parsed = JSON.parse(saved);
            if (
              Array.isArray(parsed) &&
              parsed.length >= 1 &&
              parsed.every(
                (t: { content?: string }) =>
                  t.content && isGenericSolveTemplate(t.content),
              ) &&
              hasRealSnippet
            ) {
              isDefault = true;
            } else if (
              Array.isArray(parsed) &&
              parsed.length === 1 &&
              checkIsStarter(parsed[0].content)
            ) {
              isDefault = hasRealSnippet ? true : true;
            }
          } catch {}
        } else if (saved === DEFAULT_JAVA_TEMPLATE) {
          isDefault = true;
        }

        let parsedTabs: FileTab[] = [
          {
            id: "1",
            name: "Solution.java",
            content: saved && !isDefault ? saved : starter,
          },
        ];
        try {
          if (saved && !isDefault && saved.startsWith("[")) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // If saved content is actually starter-like but starter changed (new LeetCode problem),
              // prefer the new starter instead of stale saved
              const firstContent = parsed[0]?.content || "";
              if (
                (checkIsStarter(firstContent) ||
                  isGenericSolveTemplate(firstContent)) &&
                normalizeForCompare(firstContent) !== starterNorm
              ) {
                parsedTabs = [
                  { id: "1", name: "Solution.java", content: starter },
                ];
              } else {
                // Also if any tab is generic solve template and we have real snippet, replace whole set
                if (
                  hasRealSnippet &&
                  parsed.some(
                    (t: { content?: string }) =>
                      t.content && isGenericSolveTemplate(t.content),
                  )
                ) {
                  parsedTabs = [
                    { id: "1", name: "Solution.java", content: starter },
                  ];
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
    return () => {
      cancelled = true;
    };
  }, [questionId, userId, initialJavaSnippet]);

  // Permanent auto-heal: if editor is currently showing generic solve() but a real snippet arrives late (async), swap it live
  useEffect(() => {
    if (!codeLoaded) return;
    const starter = initialJavaSnippet;
    if (isGenericSolveTemplate(starter)) return; // starter itself is still generic, nothing to heal to
    if (!hasRealStarter) return;
    const current =
      tabs.find((t) => t.id === activeTabId)?.content ?? tabs[0]?.content ?? "";
    if (isGenericSolveTemplate(current)) {
      // Replace stale generic with real LeetCode signature permanently
      const healedTabs = tabs.map((t) =>
        t.id === activeTabId ? { ...t, content: starter } : t,
      );
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
          const updatedTabs = currentTabs.map((t) =>
            t.id === activeTabId ? { ...t, content: next } : t,
          );
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
        description:
          "Please wait a moment — the LeetCode signature is being fetched. Try reset again once loaded.",
      });
      return;
    }
    // Show confirmation popup matching design: "Are you sure? Your current code will be discarded..."
    setShowResetConfirm(true);
  }, [hasRealStarter, initialJavaSnippet]);

  const handleConfirmReset = useCallback(() => {
    setShowResetConfirm(false);
    // If current code is already the real starter, no-op (avoid needless DB write)
    const current =
      tabs.find((t) => t.id === activeTabId)?.content ?? tabs[0]?.content ?? "";
    if (
      normalizeForCompare(current) === normalizeForCompare(initialJavaSnippet)
    ) {
      setRunResult(null);
      return;
    }
    setCode(initialJavaSnippet);
    setRunResult(null);
    setTabs((currentTabs) => {
      const updatedTabs = currentTabs.map((t) =>
        t.id === activeTabId ? { ...t, content: initialJavaSnippet } : t,
      );
      // Ensure any previously persisted generic is cleared before writing real starter
      void purgeStaleSolveCodeFromDB(questionId, userId).then(() => {
        void persistCode(questionId, JSON.stringify(updatedTabs), userId);
      });
      return updatedTabs;
    });
    toast({
      title: "Code reset",
      description: "Restored today's LeetCode starter template.",
    });
  }, [questionId, userId, activeTabId, initialJavaSnippet, tabs]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    const solutionCode =
      tabs.find((t) => t.name === "Solution.java")?.content ||
      tabs[0]?.content ||
      "";
    const helperCode = tabs
      .filter((t) => t.name !== "Solution.java")
      .map((t) => `// --- ${t.name} ---\n${t.content}`)
      .join("\n\n");
    const baseCode = helperCode
      ? `${solutionCode}\n\n${helperCode}`
      : solutionCode;

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
      const combinedCode = tabs
        .map((t) => `// --- ${t.name} ---\n${t.content}`)
        .join("\n\n");
      const currentTestcase =
        testcaseTabs.find((t) => t.id === activeTestcaseId)?.value || "";
      result = await runJavaCode(combinedCode, currentTestcase);
    }
    setRunResult(result);
    setIsRunning(false);
    // Auto-switch to the LeetCode-style Test Result view (re-expand if collapsed)
    setConsoleTab("result");
    if (testPanelCollapsed) testPanelRef.current?.expand();
  }, [
    tabs,
    testcaseTabs,
    activeTestcaseId,
    exampleTestcases,
    testPanelCollapsed,
  ]);

  const formatCode = useCallback(async () => {
    const raw = code;
    if (!raw.trim()) return;
    try {
      const formatted = await prettier.format(raw, {
        parser: "java",
        plugins: [
          prettierPluginJava,
          (prettierPluginJava as any)?.default || {},
        ],
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
      monaco.editor.setTheme(
        theme === "dark" ? "algoguru-dark" : "algoguru-light",
      );
    } catch {}
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      void handleRunCode();
    });
    editor.addCommand(
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
      () => {
        void formatCode();
      },
    );
    // track selection for Guru context (auto-attach selected snippet)
    editor.onDidChangeCursorSelection((e: any) => {
      try {
        const sel =
          editor.getModel()?.getValueInRange(e.selection)?.trim() || "";
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
  }, [
    code,
    tabs,
    testcaseTabs,
    runResult,
    isRunning,
    selectedCode,
    expectedOutputs,
    onLiveSync,
  ]);

  // Insert code from Guru AI directly into Monaco (user choice via "Use in editor")
  useEffect(() => {
    if (!insertTrigger?.code) return;
    const incoming = insertTrigger.code.trim();
    if (!incoming) return;
    // Heuristic: if incoming looks like a full class/file, replace active tab; else insert at cursor
    const looksFullFile = /class\s+Solution|public\s+class|import\s+java/.test(
      incoming,
    );
    if (looksFullFile) {
      setTabs((prev) => {
        const updated = prev.map((t) =>
          t.id === activeTabId ? { ...t, content: incoming } : t,
        );
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
        const op = {
          identifier: id,
          range: sel,
          text: "\n" + incoming + "\n",
          forceMoveMarkers: true,
        };
        ed.executeEdits("guru-insert", [op]);
        ed.focus();
        const newCode = ed.getValue();
        setTabs((prev) => {
          const updated = prev.map((t) =>
            t.id === activeTabId ? { ...t, content: newCode } : t,
          );
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
        autoSaveId="editor-testcases-split-v6"
        className="h-full"
      >
        {/* ═════════ Editor Panel ═════════ */}
        <Panel defaultSize={64} minSize={30} className="min-h-0">
          <PaneShell
            className={cn(
              "p-0",
              editorFullscreen && "fixed inset-0 z-[90] rounded-none",
            )}
          >
            {/* --- Editor Top Bar --- */}
            <div className="solver-panel-header flex shrink-0 items-center justify-between gap-2 border-b border-border px-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Code
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <h2 className="text-[13px] font-semibold">Code</h2>
                <span className="ml-1 border-l border-border pl-3 text-xs text-muted-foreground">
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
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>

                {/* Format */}
                <button
                  type="button"
                  onClick={() => {
                    void formatCode();
                  }}
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
                      <Code className="h-3.5 w-3.5" />
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

                {/* Fullscreen editor toggle */}
                <button
                  type="button"
                  onClick={() => setEditorFullscreen((v) => !v)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title={
                    editorFullscreen
                      ? "Exit fullscreen (Esc)"
                      : "Fullscreen editor"
                  }
                  aria-label={
                    editorFullscreen
                      ? "Exit fullscreen editor"
                      : "Fullscreen editor"
                  }
                >
                  {editorFullscreen ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* --- File Tabs --- */}
            <div
              className="solver-file-tabs flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2 select-none"
              role="tablist"
              aria-label="Editor files"
              onKeyDown={handleTabListKeyDown}
              style={{ scrollbarWidth: "thin" }}
            >
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={cn(
                    "group flex h-9 min-w-max items-center gap-1 border-b-2 px-2 text-xs transition-colors",
                    activeTabId === tab.id
                      ? "border-b-2 border-primary text-foreground"
                      : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTabId === tab.id}
                    tabIndex={activeTabId === tab.id ? 0 : -1}
                    onClick={() => setActiveTabId(tab.id)}
                    className="flex h-full items-center gap-2 rounded-sm px-1"
                  >
                    <FileText
                      className="h-3.5 w-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {tab.name}
                  </button>
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
                        void persistCode(
                          questionId,
                          JSON.stringify(newTabs),
                          userId,
                        );
                      }}
                      className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                  const newTabs = [
                    ...tabs,
                    {
                      id: newId,
                      name,
                      content:
                        "class " + name.replace(".java", "") + " {\n\n}\n",
                    },
                  ];
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
            <div className="solver-editor-surface relative min-h-0 flex-1">
              {!codeLoaded && (
                <div
                  className="solver-editor-surface absolute inset-0 z-10 flex items-center justify-center"
                  role="status"
                  aria-label="Loading saved code"
                >
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
                    monaco.editor.defineTheme(
                      "algoguru-dark",
                      LEETCODE_DARK_THEME as any,
                    );
                    monaco.editor.defineTheme(
                      "algoguru-light",
                      ALGOGURU_LIGHT_THEME as any,
                    );
                  } catch {}
                }}
                onMount={handleMount}
                options={{
                  fontSize: editorFontSize,

                  fontFamily:
                    '"Consolas","Cascadia Code","JetBrains Mono","Fira Code",Menlo,Monaco,"Courier New",monospace',
                  fontLigatures: false,
                  fontWeight: "400",
                  lineHeight: Math.round(editorFontSize * 1.65),
                  letterSpacing: 0,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 18, bottom: 18 },
                  lineNumbers: "on",
                  lineNumbersMinChars: 2,
                  glyphMargin: false,
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
                  quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: true,
                  },
                  scrollbar: {
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8,
                    useShadows: false,
                  },
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
            <div className="solver-editor-footer flex shrink-0 items-center justify-between gap-3 border-t border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="solver-font-size"
                  className="text-[11px] text-muted-foreground"
                >
                  Font size
                </label>
                <select
                  id="solver-font-size"
                  value={editorFontSize}
                  onChange={(e) => setEditorFontSize(Number(e.target.value))}
                  aria-label="Editor font size"
                  className="h-7 rounded border border-border bg-card px-1.5 text-[11px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {[12, 14, 16, 18, 20].map((size) => (
                    <option
                      key={size}
                      value={size}
                      className="bg-background text-foreground"
                    >
                      {size}px
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex"
                  aria-hidden="true"
                >
                  Ctrl <span className="text-muted-foreground/50">+</span> Enter
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void handleRunCode();
                  }}
                  disabled={isRunning || !codeLoaded}
                  aria-label={isRunning ? "Running code" : "Run code"}
                  aria-keyshortcuts="Control+Enter Meta+Enter"
                  className="solver-run-button inline-flex h-8 items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  title="Run code (Ctrl or ⌘ + Enter)"
                >
                  {isRunning ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  {isRunning ? "Running…" : "Run code"}
                </button>
              </div>
            </div>
          </PaneShell>
        </Panel>

        {/* ═════════ Resize Handle ═════════ */}
        <PanelResizeHandle
          className="solver-resize-handle group relative z-10 flex h-2 shrink-0 cursor-row-resize items-center justify-center"
          aria-label="Resize editor and test console"
        >
          <div className="h-0.5 w-8 rounded-full bg-border transition-colors group-hover:bg-primary group-active:bg-primary" />
        </PanelResizeHandle>

        {/* ═════════ Test Cases / Output Panel ═════════ */}
        <Panel
          ref={testPanelRef}
          defaultSize={36}
          minSize={22}
          collapsible
          collapsedSize={7}
          onCollapse={() => setTestPanelCollapsed(true)}
          onExpand={() => setTestPanelCollapsed(false)}
          className="min-h-0"
        >
          <PaneShell className="p-0">
            {/* Header — LeetCode-style tabs (click strip to re-expand when collapsed) */}
            <div
              className={cn(
                "solver-panel-header flex shrink-0 items-center gap-1 border-b border-border px-2",
                testPanelCollapsed && "cursor-pointer",
              )}
              onClick={() => {
                if (testPanelCollapsed) testPanelRef.current?.expand();
              }}
              role="tablist"
              aria-label="Test console"
              onKeyDown={handleTabListKeyDown}
            >
              <button
                type="button"
                role="tab"
                aria-selected={consoleTab === "testcase"}
                tabIndex={consoleTab === "testcase" ? 0 : -1}
                aria-controls="solver-console-panel"
                id="solver-testcases-tab"
                onClick={() => setConsoleTab("testcase")}
                className={cn(
                  "solver-console-tab flex h-11 items-center gap-2 border-b-2 border-transparent px-3 text-xs font-medium transition-colors",
                  consoleTab === "testcase"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ListChecks className="h-3.5 w-3.5" />
                Test cases
                <span className="solver-count" aria-hidden="true">
                  {testcaseTabs.length}
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={consoleTab === "result"}
                tabIndex={consoleTab === "result" ? 0 : -1}
                aria-controls="solver-console-panel"
                id="solver-results-tab"
                onClick={() => setConsoleTab("result")}
                className={cn(
                  "solver-console-tab flex h-11 items-center gap-2 border-b-2 border-transparent px-3 text-xs font-medium transition-colors",
                  consoleTab === "result"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Terminal className="h-3.5 w-3.5" />
                Results
                {runResult && (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      runResult.status === "success"
                        ? "bg-primary"
                        : "bg-destructive",
                    )}
                  />
                )}
              </button>

              <button
                type="button"
                className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={
                  testPanelCollapsed
                    ? "Expand test console"
                    : "Collapse test console"
                }
                onClick={(event) => {
                  event.stopPropagation();
                  if (testPanelCollapsed) testPanelRef.current?.expand();
                  else testPanelRef.current?.collapse();
                }}
              >
                {testPanelCollapsed ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Body — hidden while collapsed so only the tab strip shows */}
            {!testPanelCollapsed && (
              <div
                id="solver-console-panel"
                role="tabpanel"
                aria-labelledby={
                  consoleTab === "testcase"
                    ? "solver-testcases-tab"
                    : "solver-results-tab"
                }
                className="solver-console-body min-h-0 flex-1 overflow-y-auto p-4"
              >
                <AnimatePresence mode="wait">
                  {isRunning ? (
                    <motion.div
                      key="running"
                      {...fadeIn}
                      role="status"
                      className="flex min-h-36 items-center justify-center gap-3 py-8"
                    >
                      <Loader2
                        className="h-5 w-5 animate-spin text-primary"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Running your code
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Compiling Java 21 and running your test input. This
                          may take a moment.
                        </p>
                      </div>
                    </motion.div>
                  ) : consoleTab === "result" && runResult ? (
                    (() => {
                      // Compile/runtime error -> show single error box
                      if (
                        runResult.status === "compile_error" ||
                        runResult.status === "runtime_error" ||
                        runResult.status === "error"
                      ) {
                        return (
                          <motion.div
                            key="result-error"
                            {...fadeIn}
                            className="space-y-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={cn(
                                  "flex items-center gap-1.5 text-sm font-bold",
                                  runResult.status === "compile_error"
                                    ? "text-destructive"
                                    : "text-warning",
                                )}
                              >
                                {runResult.status === "compile_error" ? (
                                  <>
                                    <XCircle className="h-4 w-4" /> Compile
                                    Error
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="h-4 w-4" />{" "}
                                    Runtime Error
                                  </>
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => setRunResult(null)}
                                className="flex h-7 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Reset
                              </button>
                            </div>
                            <div className="overflow-x-auto whitespace-pre-wrap rounded-md border border-destructive/25 bg-destructive/5 p-3 font-mono text-xs leading-relaxed text-destructive">
                              {runResult.output}
                            </div>
                          </motion.div>
                        );
                      }
                      // Success -> LeetCode-style per-case view (screenshot match)
                      const rawLines = runResult.output
                        .trim()
                        .split("\n")
                        .map((l) => l.trim())
                        .filter((l) => l.length > 0);
                      // For harness we printed one line per case; if more lines due to stacktrace, take first N
                      const perCaseOutputs = testcaseTabs.map(
                        (_, i) => rawLines[i] ?? "",
                      );
                      const normalize = (s: string) =>
                        s
                          .trim()
                          .replace(/\s+/g, " ")
                          .replace(/,\s/g, ",")
                          .replace(/\[\s/g, "[")
                          .replace(/\s\]/g, "]")
                          .toLowerCase();
                      const caseStatuses = testcaseTabs.map((_, i) => {
                        const your = perCaseOutputs[i] ?? "";
                        const expected = expectedOutputs[i] ?? "";
                        const isCustom = i >= expectedOutputs.length;
                        if (your.startsWith("Runtime Error"))
                          return { passed: false, your, expected, isCustom };
                        if (isCustom)
                          return { passed: true, your, expected: "", isCustom };
                        return {
                          passed: normalize(your) === normalize(expected),
                          your,
                          expected,
                          isCustom,
                        };
                      });
                      const hasExpected = expectedOutputs.length > 0;
                      const allPassed = hasExpected
                        ? caseStatuses
                            .filter((c) => !c.isCustom)
                            .every((c) => c.passed) &&
                          rawLines.length >=
                            Math.min(
                              testcaseTabs.length,
                              expectedOutputs.length,
                            )
                        : true;
                      const passedCount = caseStatuses.filter(
                        (c) => c.passed,
                      ).length;
                      const activeIdx = Math.max(
                        0,
                        testcaseTabs.findIndex(
                          (t) => t.id === activeTestcaseId,
                        ),
                      );
                      const activeStatus = caseStatuses[activeIdx];
                      const activeTab = testcaseTabs[activeIdx];
                      const inputLabel =
                        paramNames.length === 1
                          ? paramNames[0]
                          : paramNames.length > 1
                            ? paramNames.join(", ")
                            : "Input";
                      const overallStatus = hasExpected
                        ? allPassed
                          ? "Tests passed"
                          : "Wrong answer"
                        : "Executed";
                      return (
                        <motion.div
                          key="result-success"
                          {...fadeIn}
                          className="space-y-5"
                        >
                          {/* Big LeetCode-style verdict */}
                          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                            <span
                              className={cn(
                                "text-xl font-semibold leading-tight tracking-tight",
                                allPassed ? "text-success" : "text-destructive",
                              )}
                            >
                              {overallStatus}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              Total time: {runResult.executionTimeMs} ms
                            </span>
                            {hasExpected && (
                              <span className="text-sm text-muted-foreground">
                                · {passedCount} / {testcaseTabs.length} cases
                                passed
                              </span>
                            )}
                          </div>

                          {/* Case pills with checkbox styling */}
                          <div className="flex flex-wrap items-center gap-2.5">
                            {testcaseTabs.map((tc, i) => {
                              const st = caseStatuses[i];
                              const isActive = tc.id === activeTestcaseId;
                              const isFailed = !st.passed && !st.isCustom;
                              return (
                                <div
                                  key={tc.id}
                                  className={cn(
                                    "group flex min-w-max select-none items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors",
                                    isActive
                                      ? "bg-muted text-foreground"
                                      : "text-foreground/85 hover:bg-muted/60 hover:text-foreground",
                                  )}
                                >
                                  <button
                                    type="button"
                                    aria-pressed={isActive}
                                    onClick={() => setActiveTestcaseId(tc.id)}
                                    className="flex items-center gap-2 rounded-sm py-2"
                                  >
                                    {isFailed ? (
                                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                    )}
                                    {tc.name}
                                  </button>
                                  {testcaseTabs.length > 1 && (
                                    <button
                                      type="button"
                                      aria-label={`Remove ${tc.name}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newTabs = testcaseTabs.filter(
                                          (t) => t.id !== tc.id,
                                        );
                                        setTestcaseTabs(newTabs);
                                        if (activeTestcaseId === tc.id)
                                          setActiveTestcaseId(
                                            newTabs[newTabs.length - 1]?.id ||
                                              "1",
                                          );
                                      }}
                                      className="ml-1 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted-foreground/15 hover:text-foreground"
                                    >
                                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => {
                                const newId = String(Date.now());
                                const name = `Case ${testcaseTabs.length + 1}`;
                                const newTabs = [
                                  ...testcaseTabs,
                                  { id: newId, name, value: "" },
                                ];
                                setTestcaseTabs(newTabs);
                                setActiveTestcaseId(newId);
                              }}
                              className="ml-1 rounded-lg border border-dashed border-border px-2.5 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              title="Add custom testcase"
                              aria-label="Add custom testcase"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRunResult(null);
                                setConsoleTab("testcase");
                              }}
                              className="ml-auto flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Reset
                            </button>
                          </div>

                          {/* Active case details — big LeetCode-style Input / Output */}
                          {activeTab && activeStatus && (
                            <div className="space-y-4">
                              <div>
                                <div className="mb-2 text-sm font-semibold text-foreground/90">
                                  Input
                                </div>
                                <div className="w-full rounded-md border border-border bg-muted/30 px-3 py-2.5 font-mono text-[13px] leading-relaxed">
                                  {(() => {
                                    const lines = (activeTab.value || "").split(
                                      "\n",
                                    );
                                    const perParam =
                                      paramNames.length > 1 &&
                                      lines.length === paramNames.length;
                                    if (perParam) {
                                      return lines.map((l, li) => (
                                        <div
                                          key={li}
                                          className={
                                            li > 0 ? "mt-2" : undefined
                                          }
                                        >
                                          <span className="text-muted-foreground">
                                            {paramNames[li]} ={" "}
                                          </span>
                                          <span className="break-all font-semibold text-foreground">
                                            {l}
                                          </span>
                                        </div>
                                      ));
                                    }
                                    return (
                                      <>
                                        <div className="text-muted-foreground">
                                          {inputLabel} =
                                        </div>
                                        <div className="mt-1 break-all whitespace-pre-wrap font-semibold text-foreground">
                                          {activeTab.value || "(empty)"}
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div>
                                <div className="mb-2 text-sm font-semibold text-foreground/90">
                                  Output
                                </div>
                                <div
                                  className={cn(
                                    "w-full break-all whitespace-pre-wrap rounded-md border px-3 py-2.5 font-mono text-[13px] leading-relaxed",
                                    activeStatus.passed || activeStatus.isCustom
                                      ? "border-border/60 bg-muted/40 text-foreground"
                                      : "border-destructive/30 bg-destructive/5 text-destructive",
                                  )}
                                >
                                  {activeStatus.your || "(no output)"}
                                </div>
                              </div>
                              {!activeStatus.passed &&
                                !activeStatus.isCustom && (
                                  <div>
                                    <div className="mb-2 text-sm font-semibold text-foreground/90">
                                      Expected Output
                                    </div>
                                    <div className="w-full break-all whitespace-pre-wrap rounded-md border border-border bg-muted/30 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-foreground">
                                      {activeStatus.expected || "(not found)"}
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })()
                  ) : consoleTab === "result" ? (
                    <motion.div
                      key="no-results"
                      {...fadeIn}
                      className="flex min-h-36 flex-col items-center justify-center px-4 py-6 text-center"
                    >
                      <Terminal
                        className="mb-3 h-5 w-5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-medium text-foreground">
                        No results yet
                      </p>
                      <p className="mt-1.5 max-w-64 text-xs leading-5 text-muted-foreground">
                        Run your code to see output and compare it with the
                        example test cases.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="testcases"
                      {...fadeIn}
                      className="space-y-4"
                    >
                      <div className="flex flex-col space-y-3">
                        <div
                          className="flex items-center gap-2 overflow-x-auto pb-1"
                          style={{ scrollbarWidth: "none" }}
                        >
                          {testcaseTabs.map((tc) => (
                            <div
                              key={tc.id}
                              className={cn(
                                "group flex min-w-max select-none items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors",
                                activeTestcaseId === tc.id
                                  ? "bg-muted text-foreground"
                                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                              )}
                            >
                              <button
                                type="button"
                                aria-pressed={activeTestcaseId === tc.id}
                                onClick={() => setActiveTestcaseId(tc.id)}
                                className="rounded-sm py-2"
                              >
                                {tc.name}
                              </button>
                              {testcaseTabs.length > 1 && (
                                <button
                                  type="button"
                                  aria-label={`Remove ${tc.name}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newTabs = testcaseTabs.filter(
                                      (t) => t.id !== tc.id,
                                    );
                                    setTestcaseTabs(newTabs);
                                    if (activeTestcaseId === tc.id) {
                                      setActiveTestcaseId(
                                        newTabs[newTabs.length - 1].id,
                                      );
                                    }
                                  }}
                                  className="ml-1 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted-foreground/15 hover:text-foreground"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newId = String(Date.now());
                              const name = `Case ${testcaseTabs.length + 1}`;
                              const newTabs = [
                                ...testcaseTabs,
                                { id: newId, name, value: "" },
                              ];
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

                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <label
                            htmlFor="solver-test-input"
                            className="text-xs font-medium text-foreground"
                          >
                            Input
                          </label>
                          <span
                            id="solver-input-help"
                            className="text-[11px] text-muted-foreground"
                          >
                            One argument per line · JSON format
                          </span>
                        </div>
                        <textarea
                          id="solver-test-input"
                          aria-describedby="solver-input-help"
                          spellCheck={false}
                          value={
                            testcaseTabs.find(
                              (tc) => tc.id === activeTestcaseId,
                            )?.value || ""
                          }
                          onChange={(e) => {
                            setTestcaseTabs((prev) =>
                              prev.map((tc) =>
                                tc.id === activeTestcaseId
                                  ? { ...tc, value: e.target.value }
                                  : tc,
                              ),
                            );
                          }}
                          placeholder="Enter custom testcase..."
                          aria-label="Test case input"
                          className="solver-test-input min-h-28 w-full resize-y rounded-md border border-border bg-muted/30 p-3 font-mono text-[13px] leading-6 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </PaneShell>
        </Panel>
      </PanelGroup>

      {showResetConfirm &&
        createPortal(
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
                <h3
                  id="reset-confirm-title"
                  className="text-[15px] font-semibold leading-tight text-foreground"
                >
                  Reset this file?
                </h3>
                <p className="mt-1.5 text-[13px] leading-[1.45] text-muted-foreground">
                  Your changes to this file will be replaced with the starter
                  template. This cannot be undone.
                </p>
                <div className="mt-5 flex items-center justify-end gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleConfirmReset}>
                    Reset code
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
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
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-5 md:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-destructive/25 bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Couldn't load today's challenge
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              {error.message ||
                "Something went wrong fetching the LeetCode daily challenge."}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground/80">
              The backend service may be temporarily unavailable. You can still
              open today's problem on LeetCode directly.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={onRetry}>
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a
                  href="https://leetcode.com/problemset/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-5 md:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              No challenge available
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              LeetCode hasn't published a daily challenge yet, or the upstream
              service returned an unexpected empty payload.
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
/* Editorial body — prose + language-switchable implementation blocks   */
/* ------------------------------------------------------------------ */

/** Renders one chunk of editorial prose. */
function EditorialMarkdown({
  markdown,
  onInsertCode,
}: {
  markdown: string;
  onInsertCode?: (code: string) => void;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={{
        pre({ children }) {
          return <>{children}</>;
        },
        code({ className, children, ...props }) {
          const text = extractText(children);
          const isBlock =
            className?.startsWith("language-") || text.includes("\n");
          if (isBlock) {
            return (
              <EditorialCodeBlock className={className} onInsert={onInsertCode}>
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
          // Implementations are normally resolved into language-switchable
          // blocks. An iframe only survives when the server could not fetch the
          // playground, so present an honest fallback rather than a bare link.
          return (
            <div className="editorial-unavailable-card">
              <span className="editorial-unavailable-title">
                Solution code couldn't be loaded
              </span>
              <p className="editorial-unavailable-note">
                This implementation lives in a LeetCode playground that can't be
                embedded here. Open it on LeetCode to read the code.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="editorial-unavailable-link"
              >
                <ExternalLink size={16} />
                View Implementation on LeetCode
              </a>
            </div>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

/**
 * Renders the editorial: prose chunks interleaved with the resolved
 * implementation blocks, which carry every language LeetCode published.
 */
function EditorialBody({
  markdown,
  blocks,
  editorLanguage,
  onInsertCode,
}: {
  markdown: string;
  blocks?: SolutionBlockType[];
  editorLanguage?: string | null;
  onInsertCode?: (code: string) => void;
}) {
  const segments = useMemo(
    () => splitEditorialMarkdown(markdown, blocks),
    [markdown, blocks],
  );

  return (
    <>
      {segments.map((seg, i) =>
        seg.kind === "markdown" ? (
          <EditorialMarkdown
            key={`md-${i}`}
            markdown={seg.content}
            onInsertCode={onInsertCode}
          />
        ) : seg.block ? (
          <EditorialSolutionBlock
            key={`block-${seg.index}-${i}`}
            block={seg.block}
            editorLanguage={editorLanguage}
            onInsert={onInsertCode}
          />
        ) : (
          // Token with no matching block — don't leak a raw HTML comment.
          <div
            key={`missing-${seg.index}-${i}`}
            className="editorial-unavailable-card"
          >
            <span className="editorial-unavailable-title">
              Solution code couldn't be loaded
            </span>
            <p className="editorial-unavailable-note">
              This implementation is unavailable right now. Try again shortly,
              or ask Guru AI for a walkthrough.
            </p>
          </div>
        ),
      )}
    </>
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
  Easy: "solver-difficulty-easy",
  Medium: "solver-difficulty-medium",
  Hard: "solver-difficulty-hard",
};

// `theme` is accepted for API symmetry with the editor pane (the panel itself
// is fully theme-token driven, so it does not need to branch on it).
function ProblemDetails({
  data,
  liveSync,
  onInsertCode,
}: {
  data: DailyChallengeResponse;
  theme?: "dark" | "light";
  liveSync?: LiveEditorSync | null;
  onInsertCode?: (code: string) => void;
}) {
  const { problem, stale } = data;
  const [activeTab, setActiveTab] = useState(0);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
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
    const hasCode = Boolean(
      liveSync?.code &&
      liveSync.code.trim().length > 30 &&
      !liveSync.code.includes("TODO: Write your solution"),
    );
    const hasRun = Boolean(liveSync?.runResult);
    return deriveGuruSuggestions({
      hasCode,
      hasRun,
      runStatus: liveSync?.runResult?.status,
      exampleTestcases: problem.exampleTestcases,
    });
  }, [liveSync, problem.exampleTestcases]);

  return (
    <div className="solver-problem flex h-full min-h-0 flex-col overflow-hidden bg-card text-card-foreground">
      <div
        className="solver-panel-header flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2 select-none"
        role="tablist"
        aria-label="Problem sections"
        onKeyDown={handleTabListKeyDown}
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
              tabIndex={active ? 0 : -1}
              aria-controls="solver-problem-panel"
              id={`solver-section-${i}`}
              onClick={() => setActiveTab(i)}
              className={cn(
                "solver-section-tab relative flex h-11 items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 text-xs transition-colors md:px-4",
                active
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        id="solver-problem-panel"
        role="tabpanel"
        aria-labelledby={`solver-section-${activeTab}`}
        className={`solver-problem-scroll flex-1 min-h-0 flex flex-col ${activeTab === 2 ? "overflow-hidden" : "overflow-y-auto"}`}
        tabIndex={0}
      >
        <div
          className={
            activeTab === 2
              ? "flex-1 min-h-0 flex flex-col p-2"
              : "solver-reading p-5 md:p-7 space-y-6"
          }
        >
          <AnimatePresence mode="popLayout">
            {activeTab === 0 && (
              <motion.div
                key="problem-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.2 }}
                className="space-y-3 border-b border-border pb-5"
              >
                <div className="space-y-1">
                  <h2 className="sr-only">Daily challenge</h2>
                  <p aria-hidden="true" className="solver-eyebrow">
                    Daily challenge
                  </p>
                  <h3 className="solver-problem-title text-2xl leading-snug font-semibold tracking-tight text-foreground">
                    {problem.title}
                  </h3>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Difficulty */}
                  <span
                    className={cn(
                      "solver-difficulty inline-flex items-center gap-1.5 text-xs font-medium",
                      DIFFICULTY_STYLES[problem.difficulty] ??
                        "text-muted-foreground",
                    )}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-current"
                      aria-hidden="true"
                    />
                    {problem.difficulty}
                  </span>
                  {typeof problem.acRate === "number" &&
                    Number.isFinite(problem.acRate) && (
                      <span className="ml-1 border-l border-border pl-3 text-xs text-muted-foreground">
                        {problem.acRate.toFixed(1)}% acceptance
                      </span>
                    )}

                  {/* Hints toggle — only shown when hints exist */}
                  {problem.hints && problem.hints.length > 0 && (
                    <button
                      type="button"
                      aria-expanded={hintsOpen}
                      onClick={() => setHintsOpen(!hintsOpen)}
                      className={cn(
                        "ml-auto inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors",
                        hintsOpen
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Lightbulb className="h-3.5 w-3.5" /> Hints (
                      {problem.hints.length})
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform",
                          hintsOpen && "rotate-180",
                        )}
                      />
                    </button>
                  )}

                  {stale && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" /> Cached challenge
                    </span>
                  )}
                </div>

                {problem.topicTags.length > 0 && (
                  <div
                    className="flex flex-wrap gap-1.5"
                    aria-label="Problem topics"
                  >
                    {problem.topicTags.map((topic) => (
                      <span
                        key={topic.name}
                        className="rounded bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground"
                      >
                        {topic.name}
                      </span>
                    ))}
                  </div>
                )}

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
                      <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
                        <span className="text-xs font-medium text-foreground">
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
              className="solver-prose problem-description max-w-none"
            >
              <div dangerouslySetInnerHTML={{ __html: problem.content }} />
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div {...fadeIn} className="space-y-4">
              <div className="border-b border-border pb-5">
                <p className="solver-eyebrow mb-2">
                  Approach &amp; explanation
                </p>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Official editorial
                </h2>
              </div>
              {problem.solution ? (
                <div className="editorial-content">
                  <EditorialBody
                    markdown={problem.solution}
                    blocks={problem.solutionBlocks}
                    // The workspace editor is Java-only, so default the
                    // editorial to Java rather than the editorial author's
                    // own language choice (often C++).
                    editorLanguage="java"
                    onInsertCode={onInsertCode}
                  />
                </div>
              ) : (
                <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-5">
                  <p className="text-center text-sm font-medium leading-6 text-muted-foreground">
                    We couldn't retrieve the solution code for this problem. The
                    official editorial may be LeetCode-premium only, or the
                    source may be temporarily unreachable — try the links below
                    or ask Guru AI for a walkthrough.
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
                      ),
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 2 && (
            <>
              <motion.div
                {...fadeIn}
                className={`flex flex-1 min-h-0 flex-col overflow-hidden rounded-md ${isFullscreen ? "hidden" : "bg-card"}`}
              >
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
              {isFullscreen &&
                createPortal(
                  <div
                    className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
                    onClick={() => setIsFullscreen(false)}
                  >
                    <div
                      className="h-full w-full sm:w-[38vw] sm:max-w-[38vw] sm:min-w-[380px] flex flex-col shadow-2xl border-l border-border bg-background animate-in slide-in-from-right duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                    </div>
                  </div>,
                  document.body,
                )}
            </>
          )}
        </div>
      </div>

      {/* ── Bottom Bar — back link + external problem link ── */}
      <div className="solver-problem-footer flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-2.5">
        {/* Back to home */}
        <Link
          to="/"
          className="inline-flex h-7 items-center gap-1.5 rounded px-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All topics
        </Link>

        {/* Open on LeetCode */}
        <a
          href={problem.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-7 items-center gap-1.5 rounded px-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Open on LeetCode <ExternalLink className="h-3 w-3" />
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
  const [guruInsert, setGuruInsert] = useState<{
    code: string;
    nonce: number;
  } | null>(null);
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
      className="solver-workspace flex h-full min-h-0 flex-col"
      data-solver-theme={theme}
    >
      <div className="solver-workspace-content flex-1 min-h-0 px-2 pb-2 md:px-3 md:pb-3 pt-3">
        {isLoading ? (
          <ProblemSkeleton compact={isCompact} />
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
          isCompact ? (
            <div className="flex h-full min-h-0 flex-col gap-3">
              <div
                className="flex shrink-0 gap-1 rounded-lg border border-border bg-muted/50 p-1"
                role="tablist"
                aria-label="Workspace panels"
                onKeyDown={handleTabListKeyDown}
              >
                {(
                  [
                    { value: "problem", label: "Problem", icon: FileText },
                    { value: "code", label: "Editor", icon: Code },
                  ] as const
                ).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    id={`solver-mobile-${value}-tab`}
                    type="button"
                    role="tab"
                    aria-selected={pane === value}
                    aria-controls={`solver-mobile-${value}-panel`}
                    tabIndex={pane === value ? 0 : -1}
                    onClick={() => setPane(value)}
                    className={cn(
                      "flex h-8 flex-1 items-center justify-center gap-2 rounded-md text-xs font-medium transition-colors",
                      pane === value
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1">
                <div
                  id="solver-mobile-problem-panel"
                  role="tabpanel"
                  aria-labelledby="solver-mobile-problem-tab"
                  className={cn(
                    "h-full min-h-0",
                    pane !== "problem" && "hidden",
                  )}
                  hidden={pane !== "problem"}
                >
                  <PaneShell>
                    <ProblemDetails
                      data={data}
                      theme={theme}
                      liveSync={liveSync}
                      onInsertCode={handleGuruInsert}
                    />
                  </PaneShell>
                </div>
                <div
                  id="solver-mobile-code-panel"
                  role="tabpanel"
                  aria-labelledby="solver-mobile-code-tab"
                  className={cn("h-full min-h-0", pane !== "code" && "hidden")}
                  hidden={pane !== "code"}
                >
                  <CodeEditorPane
                    questionId={data.problem.questionId}
                    theme={theme}
                    exampleTestcases={data.problem.exampleTestcases}
                    codeSnippets={data.problem.codeSnippets}
                    problemContent={data.problem.content}
                    onLiveSync={setLiveSync}
                    insertTrigger={guruInsert}
                  />
                </div>
              </div>
            </div>
          ) : (
            <PanelGroup
              direction="horizontal"
              autoSaveId="problem-solver-split-v6"
              className="h-full w-full"
            >
              <Panel defaultSize={44} minSize={30} className="min-w-0">
                <PaneShell>
                  <ProblemDetails
                    data={data}
                    theme={theme}
                    liveSync={liveSync}
                    onInsertCode={handleGuruInsert}
                  />
                </PaneShell>
              </Panel>

              <PanelResizeHandle
                className="solver-resize-handle group relative z-10 flex w-2 shrink-0 cursor-col-resize items-center justify-center"
                aria-label="Resize problem and editor panes"
              >
                <div className="h-8 w-0.5 rounded-full bg-border transition-colors group-hover:bg-primary group-active:bg-primary" />
              </PanelResizeHandle>

              <Panel defaultSize={56} minSize={35} className="min-w-0">
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
