import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

import {
  Play,
  Loader2,
  Copy,
  Check,
  Terminal,
  Code2,
  RotateCcw,
  Sun,
  Moon,
  Palette,
  AlignLeft,
  ChevronDown,
  Keyboard,
  Settings,
  Maximize,
  Minimize,
  FileCode,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  BookOpen,
  ArrowLeft,
  Download,
  Bug,
  GitBranch,
  StickyNote,
  Bot,
  Lock,
  Lightbulb,
  GitMerge,
  SplitSquareHorizontal,
  Clock,
  Layers,
  Sparkles,
  Target,
  ArrowRight,
  SunMoon,
  WrapText,
  ListTree,
  Focus,
  CircleDot,
  ExternalLink,
} from "lucide-react";
import Editor, { OnMount } from "@monaco-editor/react";
import { LeetCodeEditor } from "@/components/editor/LeetCodeEditor";
import * as prettier from "prettier/standalone";
import * as prettierPluginJava from "prettier-plugin-java";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { CP_TEMPLATES } from "@/data/cpTemplates";
import { EditorCommandPalette } from "@/components/playground/EditorCommandPalette";
import { EditorQuickOpen } from "@/components/playground/EditorQuickOpen";
import { GoToLineDialog } from "@/components/playground/GoToLineDialog";
import { GuruSelectionMenu } from "@/components/playground/GuruSelectionMenu";
import { AiEditPreview } from "@/components/playground/AiEditPreview";
import {
  ProblemsList,
  DebuggerPanel,
  DocumentOutline,
} from "@/components/playground/EditorSidePanels";
import { PlaygroundProblemsLibrary } from "@/components/playground/PlaygroundProblemsLibrary";
import { fetchLeetCodeProblem, deriveTitleSlug, type LeetCodeProblem } from "@/lib/leetcodeProblem";
import { generateHarnessMain, parseSolutionSignature, chunkTestCases } from "@/lib/javaHarness";
import {
  buildMonacoEditorOptions,
  loadLocalEditorOptions,
  parseExtraEditorOptions,
  saveLocalEditorOptions,
  type ExtraEditorOptions,
} from "@/lib/playground/editorPrefs";
import {
  monacoSeverity,
  parseCompilerDiagnostics,
  type CompilerDiagnostic,
} from "@/lib/playground/compilerDiagnostics";
import { parseDebugTrace, type DebugFrame } from "@/lib/playground/debugTrace";
import { parseSimpleOutline, type JavaSymbol } from "@/lib/playground/javaSymbols";
import type { EditorCommand } from "@/components/playground/EditorCommandPalette";
import { registerPlaygroundJavaLanguage } from "@/lib/playground/registerJavaLanguage";
import {
  extractProposedCode,
  isValidProposedCode,
} from "@/lib/playground/extractProposedCode";
import {
  buildGuruSelectionPrompt,
  GURU_SELECTION_ACTIONS,
  type GuruSelectionAction,
} from "@/lib/playground/guruPrompts";
import { useCPTemplates } from "@/hooks/useCPTemplates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AppTooltip,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GuruBot } from "@/components/GuruBot";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { supabase } from "@/integrations/supabase/client";
import RichTextNoteEditor from "@/components/RichTextNoteEditor";
import { renderNoteMarkdown } from "@/lib/renderNoteMarkdown";
import { useToast } from "@/components/ui/use-toast";
interface UserTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
}

interface CodeTab {
  id: string;
  title: string;
  code: string;
  protected?: boolean;
}

/** Verdict shown in the LeetCode-style result header. */
type RunStatus =
  | "accepted"
  | "compile_error"
  | "runtime_error"
  | "service_error"
  | "debug";

const RUN_STATUS_META: Record<
  RunStatus,
  { label: string; tone: "pass" | "fail" | "warn" }
> = {
  accepted: { label: "Accepted", tone: "pass" },
  compile_error: { label: "Compile Error", tone: "fail" },
  runtime_error: { label: "Runtime Error", tone: "fail" },
  service_error: { label: "Judge Unavailable", tone: "warn" },
  debug: { label: "Debug Trace", tone: "warn" },
};

const IO_COLLAPSED_SIZE = 3.5;
const IO_EXPAND_TRIGGER_SIZE = 4.25;
const IO_DEFAULT_SIZE = 45;
const IO_GURU_DEFAULT_SIZE = 25;
const IO_MOBILE_DEFAULT_SIZE = 40;
const GURU_COLLAPSED_SIZE = 3.5;
const GURU_EXPAND_TRIGGER_SIZE = 4.25;
const GURU_DEFAULT_SIZE = 25;

const WANDBOX_API = "https://wandbox.org/api/compile.json";
const COMPILER_MARKER_OWNER = "algoguru-compiler";

const SUPPORTED_LANGUAGES = [
  {
    label: "Java",
    language: "java",
    version: "openjdk-jdk-21+35",
    extension: "java",
  },
  {
    label: "Python",
    language: "python",
    version: "cpython-3.14.0",
    extension: "py",
  },
  { label: "C++", language: "c++", version: "gcc-head", extension: "cpp" },
];

const DEFAULT_CODE: Record<string, string> = {
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  python: `print("Hello, World!")`,
  "c++": `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
};

const THEMES = [
  { id: "leetcode-dark", label: "LeetCode Dark", icon: <Moon size={13} /> },
  { id: "vs-dark", label: "VS Dark", icon: <Moon size={13} /> },
  { id: "dracula", label: "Dracula", icon: <Palette size={13} /> },
  { id: "light", label: "LeetCode Light", icon: <Sun size={13} /> },
  {
    id: "solarized-dark",
    label: "Solarized Dark",
    icon: <Palette size={13} />,
  },
  { id: "hc-black", label: "High Contrast", icon: <Palette size={13} /> },
];

/**
 * Sentinel theme choice meaning "follow the app's light/dark mode".
 * Stored in playground_preferences.theme alongside real theme ids.
 */
const THEME_AUTO = "auto";

/** Which editor theme "auto" resolves to for each app mode. */
const AUTO_THEME_FOR_APP: Record<"dark" | "light", string> = {
  dark: "leetcode-dark",
  light: "light",
};

/**
 * The editor theme that was hardcoded as the default before "auto" existed.
 * A saved row holding it is indistinguishable from "user never chose a theme",
 * so it is read back as "auto" and the next save migrates the row.
 */
const LEGACY_DEFAULT_THEME = "leetcode-dark";

const isValidThemeChoice = (value: unknown): value is string =>
  value === THEME_AUTO || THEMES.some((t) => t.id === value);

const JAVA_AUTO_IMPORTS = [
  "import java.util.*;",
  "import java.util.stream.*;",
  "import java.io.*;",
  "import java.math.*;",
];

const addAutoImports = (source: string) => {
  const missingImports = JAVA_AUTO_IMPORTS.filter(
    (statement) => !source.includes(statement),
  );
  if (!missingImports.length) return source;

  const packageMatch = source.match(/^\s*package\s+[\w.]+\s*;\s*/);
  if (packageMatch?.[0]) {
    return `${packageMatch[0]}\n${missingImports.join("\n")}\n${source.slice(packageMatch[0].length)}`;
  }

  return `${missingImports.join("\n")}\n\n${source}`;
};

// LeetCode Dark theme definition — matched to ProblemSolver for identical editor
// experience. Syntax colours stay LeetCode-accurate, but every *surface* is drawn
// from the app's cool neutral palette so the editor sits inside the same card
// treatment as the rest of the workspace instead of reading as a warm foreign box.
const LEETCODE_DARK_THEME = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "", foreground: "D4D0C8", background: "0E1016" },
    { token: "comment", foreground: "6A9955", fontStyle: "italic" },
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
    { token: "keyword", foreground: "569CD6" },
    { token: "keyword.control", foreground: "569CD6" },
    { token: "storage", foreground: "569CD6" },
    { token: "storage.type", foreground: "4EC9B0" },
    { token: "type", foreground: "4EC9B0" },
    { token: "type.identifier", foreground: "4EC9B0" },
    { token: "class", foreground: "4EC9B0", fontStyle: "bold" },
    { token: "interface", foreground: "4EC9B0" },
    { token: "entity.name.type", foreground: "4EC9B0" },
    { token: "entity.name.class", foreground: "4EC9B0" },
    { token: "identifier", foreground: "DCDCAA" },
    { token: "entity.name.function", foreground: "DCDCAA" },
    { token: "support.function", foreground: "DCDCAA" },
    { token: "function", foreground: "DCDCAA" },
    { token: "method", foreground: "DCDCAA" },
    { token: "variable", foreground: "DCDCAA" },
    { token: "variable.parameter", foreground: "DCDCAA" },
    { token: "parameter", foreground: "DCDCAA" },
    { token: "annotation", foreground: "DCDcaa" },
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

// Dracula theme definition
const DRACULA_THEME = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "", foreground: "f8f8f2", background: "282a36" },
    { token: "comment", foreground: "6272a4", fontStyle: "italic" },
    { token: "keyword", foreground: "ff79c6" },
    { token: "string", foreground: "f1fa8c" },
    { token: "number", foreground: "bd93f9" },
    { token: "type", foreground: "8be9fd", fontStyle: "italic" },
    { token: "class", foreground: "50fa7b" },
    { token: "interface", foreground: "50fa7b" },
    { token: "function", foreground: "50fa7b" },
    { token: "variable", foreground: "f8f8f2" },
    { token: "operator", foreground: "ff79c6" },
    { token: "annotation", foreground: "f1fa8c" },
  ],
  colors: {
    "editor.background": "#282a36",
    "editor.foreground": "#f8f8f2",
    "editor.lineHighlightBackground": "#44475a",
    "editor.selectionBackground": "#44475a",
    "editorCursor.foreground": "#f8f8f0",
    "editorIndentGuide.background": "#44475a",
    "editorLineNumber.foreground": "#6272a4",
  },
};

// LeetCode Light theme definition (id kept as "light" so saved prefs keep working)
const LEETCODE_LIGHT_THEME = {
  base: "vs" as const,
  inherit: true,
  rules: [
    { token: "", foreground: "262626", background: "ffffff" },
    { token: "comment", foreground: "6a737d", fontStyle: "italic" },
    { token: "keyword", foreground: "d73a49" },
    { token: "string", foreground: "032f62" },
    { token: "number", foreground: "005cc5" },
    { token: "type", foreground: "6f42c1" },
    { token: "class", foreground: "6f42c1" },
    { token: "interface", foreground: "6f42c1" },
    { token: "function", foreground: "6f42c1" },
    { token: "variable", foreground: "24292e" },
    { token: "operator", foreground: "d73a49" },
    { token: "annotation", foreground: "e36209" },
  ],
  colors: {
    "editor.background": "#ffffff",
    "editor.foreground": "#262626",
    "editor.lineHighlightBackground": "#f6f8fa",
    "editor.selectionBackground": "#0366d625",
    "editorCursor.foreground": "#262626",
    "editorIndentGuide.background": "#eaecef",
    "editorLineNumber.foreground": "#b1b7bd",
    "editorLineNumber.activeForeground": "#262626",
    "editorBracketMatch.background": "#ffa11626",
    "editorBracketMatch.border": "#ffa116",
    "scrollbarSlider.background": "#8f929955",
    "scrollbarSlider.hoverBackground": "#8f929988",
  },
};

// Solarized Dark theme definition
const SOLARIZED_DARK_THEME = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "", foreground: "839496", background: "002b36" },
    { token: "comment", foreground: "586e75", fontStyle: "italic" },
    { token: "keyword", foreground: "859900" },
    { token: "string", foreground: "2aa198" },
    { token: "number", foreground: "d33682" },
    { token: "type", foreground: "b58900" },
    { token: "class", foreground: "b58900" },
    { token: "function", foreground: "268bd2" },
    { token: "variable", foreground: "268bd2" },
    { token: "operator", foreground: "859900" },
    { token: "annotation", foreground: "93a1a1" },
  ],
  colors: {
    "editor.background": "#002b36",
    "editor.foreground": "#839496",
    "editor.lineHighlightBackground": "#073642",
    "editor.selectionBackground": "#073642",
    "editorCursor.foreground": "#d30102",
    "editorWhitespace.foreground": "#073642",
    "editorLineNumber.foreground": "#586e75",
    "editorLineNumber.activeForeground": "#93a1a1",
    "editor.selectionHighlightBackground": "#073642aa",
  },
};

/**
 * Instrument Java code with debug print statements at specified breakpoint lines.
 * For each breakpoint line, we inject a System.out.println before that line
 * showing the line number and any visible local variables.
 */
// Types that are arrays and need Arrays.toString() or Arrays.deepToString()
const ARRAY_1D_PATTERN = /^\w+\[\]$/; // e.g., int[], String[]
const ARRAY_2D_PATTERN = /\[\]\[\]/; // e.g., int[][], String[][]
const ARRAY_ANY_PATTERN = /\[\]/; // any array

function instrumentCodeForDebug(
  source: string,
  breakpointLines: Set<number>,
): string {
  if (breakpointLines.size === 0) return source;

  const lines = source.split("\n");
  const result: string[] = [];

  // Track initialized variables with their scope depth
  // When brace depth drops below a variable's declared depth, it's out of scope
  const initializedVars: {
    name: string;
    line: number;
    isArray: boolean;
    is2dArray: boolean;
    scopeDepth: number;
  }[] = [];

  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    // Remove string/char literals to avoid counting braces inside them
    const codeOnly = trimmed
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''");

    const openBraces = (codeOnly.match(/{/g) || []).length;
    const closeBraces = (codeOnly.match(/}/g) || []).length;

    const prevDepth = braceDepth;

    // Process closing braces FIRST - remove out-of-scope variables
    if (closeBraces > 0) {
      const newDepthAfterClose = braceDepth - closeBraces;
      // Remove variables whose scope depth is greater than the new depth
      // (they were declared in a block we're leaving)
      for (let v = initializedVars.length - 1; v >= 0; v--) {
        if (initializedVars[v].scopeDepth > newDepthAfterClose) {
          initializedVars.splice(v, 1);
        }
      }
    }

    // Update brace depth
    braceDepth += openBraces - closeBraces;

    const inMethodBody = braceDepth >= 2 || prevDepth >= 2;

    // Track method parameters - detect any line that looks like a method signature with params
    // Matches: accessModifiers returnType methodName(Type param1, Type param2, ...) {
    if (openBraces > 0) {
      const methodSigMatch = trimmed.match(
        /\w+\s*\(([^)]+)\)\s*(?:throws\s+\w+(?:\s*,\s*\w+)*)?\s*\{/,
      );
      if (methodSigMatch) {
        const paramStr = methodSigMatch[1];
        const params = paramStr.split(",");
        for (const param of params) {
          const p = param.trim();
          const paramMatch = p.match(
            /^(?:final\s+)?(\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)$/,
          );
          if (paramMatch) {
            const typePart = paramMatch[1];
            const paramName = paramMatch[2];
            if (
              !initializedVars.some(
                (v) => v.name === paramName && v.scopeDepth === braceDepth,
              )
            ) {
              initializedVars.push({
                name: paramName,
                line: lineNum,
                isArray: ARRAY_ANY_PATTERN.test(typePart),
                is2dArray: ARRAY_2D_PATTERN.test(typePart),
                scopeDepth: braceDepth,
              });
            }
          }
        }
      }
    }

    // Only track variables inside method bodies
    if (inMethodBody) {
      // The scope depth for a variable is the current brace depth AFTER processing opens
      // For for-loop vars, they're scoped to the for block (depth after the for's '{')

      // Match for-loop variables FIRST (they exist at depth+1 since for opens a block)
      const forVarMatch = trimmed.match(
        /^for\s*\(\s*(?:final\s+)?(\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)\s*[=:]/,
      );
      if (forVarMatch) {
        const typePart = forVarMatch[1];
        initializedVars.push({
          name: forVarMatch[2],
          line: lineNum,
          isArray: ARRAY_ANY_PATTERN.test(typePart),
          is2dArray: ARRAY_2D_PATTERN.test(typePart),
          scopeDepth: braceDepth + 1,
        });
      }

      // Match initialized variable declarations: Type varName = ...
      if (!forVarMatch) {
        const initMatch = trimmed.match(
          /^(?:final\s+)?(\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)\s*=/,
        );
        if (initMatch) {
          const typePart = initMatch[1];
          const varName = initMatch[2];
          if (
            ![
              "class",
              "interface",
              "enum",
              "return",
              "throw",
              "new",
              "import",
              "package",
              "public",
              "private",
              "protected",
              "static",
              "void",
            ].includes(typePart)
          ) {
            initializedVars.push({
              name: varName,
              line: lineNum,
              isArray: ARRAY_ANY_PATTERN.test(typePart),
              is2dArray: ARRAY_2D_PATTERN.test(typePart),
              scopeDepth: braceDepth,
            });
          }
        }
      }

      // Match: var varName = ... (Java 10+)
      const varMatch = trimmed.match(/^(?:final\s+)?var\s+(\w+)\s*=/);
      if (varMatch) {
        initializedVars.push({
          name: varMatch[1],
          line: lineNum,
          isArray: false,
          is2dArray: false,
          scopeDepth: braceDepth,
        });
      }

      // Match multiple declarations: int a = 1, b = 2;
      const multiDeclMatch = trimmed.match(
        /^(?:final\s+)?(\w+(?:<[^>]*>)?)\s+\w+\s*=\s*[^,]+(?:,\s*(\w+)\s*=\s*[^,;]+)+/,
      );
      if (multiDeclMatch && !forVarMatch) {
        const afterType = trimmed.replace(
          /^(?:final\s+)?\w+(?:<[^>]*>)?\s+/,
          "",
        );
        const parts = afterType.split(",");
        for (const part of parts) {
          const nameMatch = part.trim().match(/^(\w+)\s*=/);
          if (
            nameMatch &&
            !initializedVars.some(
              (v) => v.name === nameMatch[1] && v.line === lineNum,
            )
          ) {
            initializedVars.push({
              name: nameMatch[1],
              line: lineNum,
              isArray: false,
              is2dArray: false,
              scopeDepth: braceDepth,
            });
          }
        }
      }
    }

    // Only inject debug prints if we were ALREADY inside a method body BEFORE this line
    // prevDepth >= 2 means we were inside method body before any braces on this line
    // This prevents injecting prints on method signature lines or class-level lines
    const canInject =
      prevDepth >= 2 &&
      !trimmed.startsWith("//") &&
      !trimmed.startsWith("/*") &&
      !trimmed.startsWith("*") &&
      trimmed.length > 0 &&
      trimmed !== "{" &&
      trimmed !== "}";

    if (breakpointLines.has(lineNum) && canInject) {
      const indent = line.match(/^(\s*)/)?.[1] || "";

      // Only include variables initialized BEFORE this line AND still in scope
      // Filter out main's "args" parameter as it's never useful for debugging
      const availableVars = initializedVars
        .filter((v) => v.line < lineNum && v.name !== "args")
        .slice(-8);

      let debugExpr: string;
      if (availableVars.length > 0) {
        const parts = availableVars.map((v) => {
          if (v.is2dArray) {
            return `" ${v.name}=" + java.util.Arrays.deepToString(${v.name})`;
          }
          if (v.isArray) {
            return `" ${v.name}=" + java.util.Arrays.toString(${v.name})`;
          }
          return `" ${v.name}=" + ${v.name}`;
        });
        debugExpr = `"[DEBUG L${lineNum}]" + ${parts.join(" + ")}`;
      } else {
        debugExpr = `"[DEBUG L${lineNum}] (reached)"`;
      }

      result.push(`${indent}System.out.println(${debugExpr});`);
    }

    result.push(line);
  }

  return result.join("\n");
}

function extractExpectedOutputs(html: string): string[] {
  if (!html) return [];
  try {
    if (typeof document !== "undefined") {
      const temp = document.createElement("div");
      temp.innerHTML = html;
      const outputs: string[] = [];
      temp.querySelectorAll(".example-block").forEach((block) => {
        const text = block.textContent || "";
        const m = text.match(/Output:\s*([^\n]+)/i);
        if (m) outputs.push(m[1].trim());
        else {
          const spans = block.querySelectorAll(".example-io");
          if (spans.length >= 2) outputs.push((spans[1].textContent || "").trim());
          else if (spans.length === 1 && text.toLowerCase().includes("output")) outputs.push((spans[0].textContent || "").trim());
        }
      });
      if (outputs.length > 0) return outputs.map((s) => s.replace(/\u00A0/g, " ").trim());
    }
  } catch {}
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

export default function Playground() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const practiceId = searchParams.get("practice");
  const { templates: dbTemplates } = useCPTemplates();

  // Detect mobile viewport
  const isMobile = useMediaQuery("(max-width: 767px)");
  const ioPanelRef = useRef<ImperativePanelHandle>(null);
  const [ioPanelOpen, setIoPanelOpen] = useState(true);
  const ioPanelSizeRef = useRef(IO_DEFAULT_SIZE);
  const [ioCollapsed, setIoCollapsed] = useState(false);

  const expandIOPanel = useCallback(
    (targetSize?: number) => {
      const expandedSize =
        targetSize ?? (isMobile ? IO_MOBILE_DEFAULT_SIZE : IO_DEFAULT_SIZE);
      setIoPanelOpen(true);
      ioPanelSizeRef.current = expandedSize;
      setIoCollapsed(false);
      requestAnimationFrame(() => {
        ioPanelRef.current?.resize(expandedSize);
      });
    },
    [isMobile],
  );

  const closeIOPanel = useCallback(() => {
    setIoPanelOpen(false);
    setIoCollapsed(false);
  }, []);

  const location = useLocation();
  const practiceData = useMemo(() => {
    if (!practiceId) return null;
    const state = location.state as { practiceProblem?: any } | null;
    const data = state?.practiceProblem;
    if (data && data.id === practiceId) return data;
    return null;
  }, [practiceId, location.state]);

  const initialCode = useMemo(() => {
    if (practiceData?.code?.[0]?.content) return practiceData.code[0].content;
    return DEFAULT_CODE["java"];
  }, [practiceData]);

  const [codeTabs, setCodeTabs] = useState<CodeTab[]>(() => [
    {
      id: "solution",
      title: "Solution",
      code: initialCode,
      protected: true,
    },
  ]);
  const [activeCodeTabId, setActiveCodeTabId] = useState("solution");
  const [selectedLanguage, setSelectedLanguage] = useState(
    SUPPORTED_LANGUAGES[0],
  );

  const activeCodeTab = useMemo(
    () => codeTabs.find((tab) => tab.id === activeCodeTabId) || codeTabs[0],
    [activeCodeTabId, codeTabs],
  );
  const code = activeCodeTab?.code || "";

  const setCode = useCallback(
    (nextCode: string) => {
      setCodeSaveStatus("Unsaved");
      setCodeTabs((tabs) =>
        tabs.map((tab) =>
          tab.id === activeCodeTabId ? { ...tab, code: nextCode } : tab,
        ),
      );
    },
    [activeCodeTabId],
  );

  const openNewCodeTab = useCallback(() => {
    const id = crypto.randomUUID();
    const codeTabCount = codeTabs.filter((tab) => tab.id !== "solution").length;
    setCodeTabs((tabs) => [
      ...tabs,
      {
        id,
        title: `Code ${codeTabCount + 2}`,
        code: DEFAULT_CODE[selectedLanguage.language] || "",
      },
    ]);
    setActiveCodeTabId(id);
    setPracticeTab("editor");
  }, [codeTabs, selectedLanguage.language]);

  const closedCodeTabsRef = useRef<CodeTab[]>([]);

  const closeCodeTab = useCallback((tabId: string) => {
    if (tabId === "solution") return;

    setCodeTabs((tabs) => {
      const closing = tabs.find((tab) => tab.id === tabId);
      if (closing && !closing.protected) {
        closedCodeTabsRef.current = [closing, ...closedCodeTabsRef.current].slice(0, 12);
      }
      return tabs.filter((tab) => tab.id !== tabId);
    });
    setActiveCodeTabId((currentId) =>
      currentId === tabId ? "solution" : currentId,
    );
    setPracticeTab("editor");
  }, []);

  const reopenLastClosedTab = useCallback(() => {
    const [next, ...rest] = closedCodeTabsRef.current;
    if (!next) return;
    closedCodeTabsRef.current = rest;
    setCodeTabs((tabs) =>
      tabs.some((tab) => tab.id === next.id) ? tabs : [...tabs, next],
    );
    setActiveCodeTabId(next.id);
    setPracticeTab("editor");
  }, []);

  const cycleCodeTab = useCallback((direction: 1 | -1) => {
    setPracticeTab("editor");
    setActiveCodeTabId((current) => {
      const ids = codeTabs.map((tab) => tab.id);
      if (!ids.length) return current;
      const idx = Math.max(0, ids.indexOf(current));
      const next = (idx + direction + ids.length) % ids.length;
      return ids[next];
    });
  }, [codeTabs]);

  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  // Result-panel metadata for the LeetCode-style status header
  const [runMeta, setRunMeta] = useState<{
    status: RunStatus;
    ms: number | null;
    stdinAtRun: string;
  } | null>(null);
  // Editor theme: "auto" follows the app's light/dark mode; any other value is
  // an explicit user override that sticks regardless of the app mode.
  const [themeChoice, setThemeChoice] = useState<string>(THEME_AUTO);
  const { theme: appTheme } = useSettings();
  const currentTheme = useMemo(() => {
    const resolvedId =
      themeChoice === THEME_AUTO
        ? AUTO_THEME_FOR_APP[appTheme === "light" ? "light" : "dark"]
        : themeChoice;
    return THEMES.find((t) => t.id === resolvedId) ?? THEMES[0];
  }, [themeChoice, appTheme]);

  const [availableLanguages] = useState(SUPPORTED_LANGUAGES);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsMenuType, setSettingsMenuType] = useState<"language" | "theme">("language");
  const [copied, setCopied] = useState(false);
  const [isFormatted, setIsFormatted] = useState(false);
  const [stdin, setStdin] = useState("");
  const [consoleTab, setConsoleTab] = useState<
    "testcase" | "result" | "problems" | "debug"
  >("testcase");
  // Practice library state
  const [activePracticeProblem, setActivePracticeProblem] = useState<LeetCodeProblem | null>(null);
  const [activePracticeSlug, setActivePracticeSlug] = useState<string | null>(null);
  const [practiceLoadingSlug, setPracticeLoadingSlug] = useState<string | null>(null);
  const [testcaseTabs, setTestcaseTabs] = useState<{ id: string; name: string; value: string }[]>([]);
  const [activeTestcaseId, setActiveTestcaseId] = useState<string>("1");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorLocked, setEditorLocked] = useState(false);
  const playgroundShellRef = useRef<HTMLDivElement>(null);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [builtinOverrides, setBuiltinOverrides] =
    useState<Record<string, { code: string; description: string }>>({});
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<UserTemplate | null>(
    null,
  );
  const [editingBuiltinPrefix, setEditingBuiltinPrefix] = useState<
    string | null
  >(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [practiceTab, setPracticeTab] = useState<
    "problem" | "editor" | "notes"
  >("editor");
  const [notesTabOpen, setNotesTabOpen] = useState(false);

  useEffect(() => {
    setCodeTabs((tabs) => [
      {
        id: "solution",
        title: "Solution",
        code: initialCode,
        protected: true,
      },
      ...tabs.filter((tab) => tab.id !== "solution"),
    ]);
    setActiveCodeTabId("solution");
    setPracticeTab("editor");
  }, [initialCode, practiceId]);

  // Debugger state
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [isDebugMode, setIsDebugMode] = useState(false);

  // Settings sub-section toggles
  const [settingsCompilerOpen, setSettingsCompilerOpen] = useState(false);
  const [settingsThemeOpen, setSettingsThemeOpen] = useState(false);

  // GuruBot debug-coach mode
  const guruPanelRef = useRef<ImperativePanelHandle>(null);
  const [guruBotOpen, setGuruBotOpen] = useState(false);
  const [guruBotCollapsed, setGuruBotCollapsed] = useState(false);
  const [selectedCodeForGuru, setSelectedCodeForGuru] = useState("");
  const [guruInitialPrompt, setGuruInitialPrompt] = useState("");
  const [askGuruPopup, setAskGuruPopup] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const openGuruBotPanel = useCallback((targetSize = GURU_DEFAULT_SIZE) => {
    setGuruBotOpen(true);
    setGuruBotCollapsed(false);
    requestAnimationFrame(() => {
      guruPanelRef.current?.resize(targetSize);
    });
  }, []);

  // Practice library helpers
  const buildTestTabsFromExample = useCallback((raw?: string, snippet?: string | null) => {
    const normalized = (raw || "").replace(/\\n/g, "\n");
    if (!normalized.trim()) return [{ id: "1", name: "Case 1", value: "" }];
    try {
      const javaCode = snippet || "";
      const sig = javaCode ? parseSolutionSignature(javaCode) : null;
      const paramCount = sig?.params.length ?? 1;
      const chunks = chunkTestCases(normalized, Math.max(paramCount, 1));
      if (chunks.length > 0) return chunks.map((c, i) => ({ id: String(i + 1), name: `Case ${i + 1}`, value: c.join("\n") }));
    } catch {}
    const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) return [{ id: "1", name: "Case 1", value: normalized }];
    return lines.map((l, i) => ({ id: String(i + 1), name: `Case ${i + 1}`, value: l }));
  }, []);

  const handleSelectPracticeProblem = useCallback(
    async (problem: { id: string; title: string }, leetData: LeetCodeProblem | null, javaSnippet: string, exampleTestcases: string) => {
      const slug = deriveTitleSlug(problem as any) || problem.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
      setActivePracticeSlug(slug);
      setActivePracticeProblem(leetData);

      // Determine starter code
      let starter = javaSnippet;
      if (!starter) {
        // fallback from LeetCode data if direct snippet not passed
        const javaFromData = leetData?.codeSnippets?.find((s) => s.langSlug === "java")?.code || "";
        starter = javaFromData;
      }
      if (!starter || starter.includes("public int solve()")) {
        // Fallback: use local DEFAULT_CODE enhanced with problem title
        starter = DEFAULT_CODE["java"];
      }
      // Auto-switch to Java when LeetCode snippet is Java (harness is Java-only)
      if (selectedLanguage.language !== "java") {
        const javaLang = SUPPORTED_LANGUAGES.find((l) => l.language === "java");
        if (javaLang) setSelectedLanguage(javaLang);
      }
      // Ensure imports handled on next run via addAutoImports; keep snippet as-is
      setCodeTabs((tabs) => tabs.map((tab) => (tab.id === activeCodeTabId ? { ...tab, code: starter } : tab)));
      setActiveCodeTabId("solution");

      const tabs = buildTestTabsFromExample(exampleTestcases || leetData?.exampleTestcases || "", starter);
      setTestcaseTabs(tabs);
      setActiveTestcaseId(tabs[0]?.id || "1");
      // legacy stdin mirror first case for backward compat
      setStdin(tabs[0]?.value || "");
      setConsoleTab("testcase");
      setDiagnostics([]);
      setOutput("");
      setRunMeta(null);
      // expand IO panel to show testcase
      expandIOPanel(isMobile ? IO_MOBILE_DEFAULT_SIZE : guruBotOpen ? IO_GURU_DEFAULT_SIZE : IO_DEFAULT_SIZE);
      setPracticeTab("editor");
      toast({
        title: leetData ? `Loaded: ${leetData.title}` : `Loaded: ${problem.title}`,
        description: leetData?.exampleTestcases ? `${tabs.length} sample case(s) ready — hit Run` : "Starter loaded — add input in the Testcase tab and hit Run.",
      });
    },
    [activeCodeTabId, buildTestTabsFromExample, expandIOPanel, guruBotOpen, isMobile, toast, selectedLanguage.language],
  );

  const handleFetchProblem = useCallback(
    async (titleSlug: string) => {
      setPracticeLoadingSlug(titleSlug);
      try {
        const data = await fetchLeetCodeProblem(titleSlug);
        return data;
      } finally {
        setPracticeLoadingSlug(null);
      }
    },
    [],
  );

  const expectedOutputs = useMemo(() => extractExpectedOutputs(activePracticeProblem?.content || ""), [activePracticeProblem]);

  const paramNames = useMemo(() => {
    try {
      const javaCode = activePracticeProblem?.codeSnippets?.find((s) => s.langSlug === "java")?.code || code;
      const sig = javaCode ? parseSolutionSignature(javaCode) : null;
      if (sig && sig.params.length > 0) return sig.params.map((p) => p.name);
    } catch {}
    return [] as string[];
  }, [activePracticeProblem, code]);

  // Editor preference state (cloud-synced via playground_preferences)
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [editorTabSize, setEditorTabSize] = useState(4);
  const [relativeLineNumbers, setRelativeLineNumbers] = useState(false);
  const [askGuruOnSelection, setAskGuruOnSelection] = useState(true);
  const askGuruOnSelectionRef = useRef(askGuruOnSelection);
  const [extraEditorOptions, setExtraEditorOptions] = useState<ExtraEditorOptions>(
    loadLocalEditorOptions,
  );
  const [zenMode, setZenMode] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickOpenOpen, setQuickOpenOpen] = useState(false);
  const [goToLineOpen, setGoToLineOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<CompilerDiagnostic[]>([]);
  const [debugFrames, setDebugFrames] = useState<DebugFrame[]>([]);
  const [debugLine, setDebugLine] = useState<number | null>(null);
  const [codeSaveStatus, setCodeSaveStatus] = useState<"Saved" | "Saving" | "Unsaved">(
    "Saved",
  );
  const [outlineSymbols, setOutlineSymbols] = useState<JavaSymbol[]>([]);
  const [aiEdit, setAiEdit] = useState<{ original: string; modified: string } | null>(
    null,
  );
  const editorDisposablesRef = useRef<{ dispose: () => void }[]>([]);
  const debugDecorationsRef = useRef<string[]>([]);
  const runCodeRef = useRef<(debug?: boolean) => void>(() => {});
  const formatCodeRef = useRef<() => void>(() => {});
  const pendingGuruWantsCodeRef = useRef(false);
  const aiSelectionRangeRef = useRef<any>(null);
  const codeRef = useRef(code);
  codeRef.current = code;
  const extraEditorOptionsRef = useRef(extraEditorOptions);
  extraEditorOptionsRef.current = extraEditorOptions;

  const revealLine = useCallback((line: number, column: number = 1) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.revealPositionInCenter({ lineNumber: line, column });
    editor.setPosition({ lineNumber: line, column });
    editor.focus();
  }, []);

  const toggleZenMode = useCallback(() => {
    setZenMode((v) => !v);
  }, []);

  const cursorRafRef = useRef<number | null>(null);
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });

  const [notesContent, setNotesContent] = useState("");
  const [notesPreviewOpen, setNotesPreviewOpen] = useState(false);
  const [notesSaveStatus, setNotesSaveStatus] = useState("Saved");
  const initialNotesLoaded = useRef(false);

  const saveNotesNow = useCallback(
    async (content = notesContent, showToast = false) => {
      if (!user) return;

      const dbId = practiceId || "playground-generic";
      const { error } = await supabase.from("practice_problem_user_state").upsert(
        {
          user_id: user.id,
          problem_id: dbId,
          notes: content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,problem_id" },
      );

      if (error) {
        console.error("Failed to save notes to DB", error);
        setNotesSaveStatus("Save failed");
        if (showToast) {
          toast({
            title: "Save failed",
            description: "Could not save your note. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      setNotesSaveStatus(content.trim() ? "Saved" : "Cleared");
      if (showToast) {
        toast({
          title: "Note saved",
          description: "Your playground note was saved successfully.",
        });
      }
    },
    [notesContent, practiceId, toast, user],
  );

  // Load notes from Supabase database
  useEffect(() => {
    if (!user) return;
    const fetchNotes = async () => {
      const dbId = practiceId || "playground-generic";
      const { data } = await supabase
        .from("practice_problem_user_state")
        .select("notes")
        .eq("user_id", user.id)
        .eq("problem_id", dbId)
        .single();

      if (data?.notes !== undefined) {
        setNotesContent(data.notes || "");
      }
      initialNotesLoaded.current = true;
    };
    fetchNotes();
  }, [user, practiceId]);

  // Save notes to Supabase (debounced)
  useEffect(() => {
    if (!initialNotesLoaded.current) return;
    if (!user) return;

    const timer = setTimeout(async () => {
      await saveNotesNow(notesContent);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [notesContent, saveNotesNow, user]);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Cloud persistence: preferences, templates, overrides,
  // workspace. Database-only for logged-in users.
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [cloudPrefsLoaded, setCloudPrefsLoaded] = useState(false);
  const workspaceLoadedRef = useRef(false);

  // Load preferences from DB (logged-in only).
  useEffect(() => {
    let cancelled = false;
    setCloudPrefsLoaded(false);

    if (!user) {
      workspaceLoadedRef.current = true;
      return;
    }

    const loadPrefs = async () => {
      const { data } = await supabase
        .from("playground_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        if (isValidThemeChoice(data.theme)) {
          setThemeChoice(
            data.theme === LEGACY_DEFAULT_THEME ? THEME_AUTO : data.theme,
          );
        }
        if (Number.isFinite(data.font_size)) setEditorFontSize(data.font_size);
        if ([2, 4, 8].includes(data.tab_size)) setEditorTabSize(data.tab_size);
        setRelativeLineNumbers(Boolean(data.relative_lines));
        setAskGuruOnSelection(Boolean(data.ask_guru_on_selection));
        const extras = parseExtraEditorOptions(
          (data as { editor_options?: unknown }).editor_options,
        );
        setExtraEditorOptions(extras);
        saveLocalEditorOptions(extras);
      }
      setCloudPrefsLoaded(true);
    };

    loadPrefs();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Persist preferences (debounced, DB only).
  useEffect(() => {
    if (!cloudPrefsLoaded && user) return;
    if (!user) return;

    const timer = setTimeout(() => {
      supabase.from("playground_preferences").upsert({
        user_id: user.id,
        theme: themeChoice,
        font_size: editorFontSize,
        tab_size: editorTabSize,
        relative_lines: relativeLineNumbers,
        ask_guru_on_selection: askGuruOnSelection,
        editor_options: extraEditorOptions,
      } as any);
    }, 800);
    return () => clearTimeout(timer);
  }, [
    cloudPrefsLoaded,
    user,
    themeChoice,
    editorFontSize,
    editorTabSize,
    relativeLineNumbers,
    extraEditorOptions,
    askGuruOnSelection,
  ]);

  const closeSettingsMenu = useCallback(() => {
    setShowSettingsMenu(false);
    saveLocalEditorOptions(extraEditorOptions);
    if (!user || !cloudPrefsLoaded) return;
      supabase.from("playground_preferences").upsert({
        user_id: user.id,
        theme: themeChoice,
        font_size: editorFontSize,
        tab_size: editorTabSize,
        relative_lines: relativeLineNumbers,
        ask_guru_on_selection: askGuruOnSelection,
        editor_options: extraEditorOptions,
      } as any);
  }, [
    user,
    cloudPrefsLoaded,
    themeChoice,
    editorFontSize,
    editorTabSize,
    relativeLineNumbers,
    extraEditorOptions,
    askGuruOnSelection,
  ]);

  useEffect(() => {
    saveLocalEditorOptions(extraEditorOptions);
  }, [extraEditorOptions]);

  // Load personal templates + built-in overrides from DB.
  useEffect(() => {
    let cancelled = false;

    if (!user) return;

    const loadTemplates = async () => {
      const [{ data: remoteTemplates }, { data: remoteOverrides }] =
        await Promise.all([
          supabase
            .from("playground_user_templates")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("playground_template_overrides")
            .select("*")
            .eq("user_id", user.id),
        ]);

      if (cancelled) return;

      const effectiveTemplates: any[] = remoteTemplates || [];

      if (!cancelled) {
        setUserTemplates(
          effectiveTemplates.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description ?? "",
            code: t.code ?? "",
          })),
        );
        const overrideMap: Record<
          string,
          { code: string; description: string }
        > = {};
        for (const row of remoteOverrides || []) {
          overrideMap[row.prefix] = {
            code: row.code ?? "",
            description: row.description ?? "",
          };
        }
        setBuiltinOverrides(overrideMap);
      }
    };

    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Restore last workspace (open code tabs) — DB only, generic playground only.
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      workspaceLoadedRef.current = true;
      return;
    }

    const restore = async () => {
      const { data } = await supabase
        .from("playground_workspace")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (
        !practiceId &&
        data &&
        Array.isArray(data.tabs) &&
        data.tabs.length
      ) {
        setCodeTabs(data.tabs as unknown as CodeTab[]);
        setActiveCodeTabId(
          (data.active_tab_id as string) || (data.tabs[0] as any)?.id,
        );
      }

      if (!cancelled) {
        workspaceLoadedRef.current = true;
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, [user, practiceId]);

  // Autosave workspace (debounced).
  useEffect(() => {
    if (!workspaceLoadedRef.current) return;
    if (practiceId) return;
    if (!user) return;

    const timer = setTimeout(async () => {
      setCodeSaveStatus("Saving");
      const { error } = await supabase.from("playground_workspace").upsert({
        user_id: user.id,
        tabs: codeTabs as unknown as any[],
        active_tab_id: activeCodeTabId,
      });
      if (!error) setCodeSaveStatus("Saved");
    }, 1200);

    return () => clearTimeout(timer);
  }, [codeTabs, activeCodeTabId, user, practiceId]);


  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<any[]>([]);
  const dbTemplatesRef = useRef(dbTemplates);
  dbTemplatesRef.current = dbTemplates;

  useEffect(() => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.includes("lc-playground") && !k.includes("v2")) {
          localStorage.removeItem(k);
        }
        if (k && k.startsWith("react-resizable-panels:lc-playground") && k && !k.includes("v2")) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (e.key === "Escape" && zenMode) {
        setZenMode(false);
        return;
      }
      if (isMod && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
        return;
      }
      if (isMod && !e.shiftKey && e.key.toLowerCase() === "p") {
        // Ctrl+P quick open (avoid clash with print)
        if (!e.altKey) {
          e.preventDefault();
          setQuickOpenOpen(true);
        }
        return;
      }
      if (isMod && e.key.toLowerCase() === "g" && !e.shiftKey) {
        // Ctrl+G is handled via Monaco but keep for safety when editor not focused
        if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
          e.preventDefault();
          setGoToLineOpen(true);
        }
        return;
      }
      if (isMod && e.key === "Tab") {
        e.preventDefault();
        cycleCodeTab(e.shiftKey ? -1 : 1);
        return;
      }
      if (isMod && e.key.toLowerCase() === "w") {
        const tab = codeTabs.find((t) => t.id === activeCodeTabId);
        if (tab && !tab.protected) {
          e.preventDefault();
          closeCodeTab(activeCodeTabId);
        }
        return;
      }
      if (isMod && e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        reopenLastClosedTab();
        return;
      }
      if (e.key === "F12") {
        // Let Monaco handle go-to-definition; no action
        return;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [zenMode, cycleCodeTab, closeCodeTab, reopenLastClosedTab, codeTabs, activeCodeTabId]);

  const toggleFullscreen = useCallback(async () => {
    const shell = playgroundShellRef.current;

    if (!shell || !document.fullscreenEnabled) {
      setIsFullscreen((value) => !value);
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await shell.requestFullscreen();
      }
    } catch {
      setIsFullscreen((value) => !value);
    }
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.updateOptions(
      buildMonacoEditorOptions({
        fontSize: editorFontSize,
        tabSize: editorTabSize,
        relativeLineNumbers,
        extras: extraEditorOptions,
        readOnly: editorLocked,
      }),
    );
    editor.getModel()?.updateOptions({
      tabSize: editorTabSize,
      insertSpaces: true,
    });
  }, [
    editorFontSize,
    editorTabSize,
    relativeLineNumbers,
    extraEditorOptions,
    editorLocked,
  ]);

  useEffect(() => {
    if (user && !practiceId) return;
    if (codeSaveStatus !== "Unsaved") return;
    const timer = setTimeout(() => setCodeSaveStatus("Saved"), 900);
    return () => clearTimeout(timer);
  }, [codeSaveStatus, user, practiceId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOutlineSymbols(parseSimpleOutline(code, selectedLanguage.language));
    }, 420);
    return () => clearTimeout(timer);
  }, [code, selectedLanguage.language]);

  useEffect(() => {
    askGuruOnSelectionRef.current = askGuruOnSelection;
    if (!askGuruOnSelection) setAskGuruPopup(null);
  }, [askGuruOnSelection]);

  const updateBreakpointDecorations = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const breakpointDecorations = Array.from(breakpoints).map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        linesDecorationsClassName: "breakpoint-decoration",
        className: "breakpoint-line-highlight",
        overviewRuler: {
          color: "#ef4444",
          position: monaco.editor.OverviewRulerLane.Left,
        },
      },
    }));

    const currentLine =
      debugLine != null
        ? [
            {
              range: new monaco.Range(debugLine, 1, debugLine, 1),
              options: {
                isWholeLine: true,
                className: "debug-current-line",
                glyphMarginClassName: "debug-current-glyph",
                overviewRuler: {
                  // Monaco needs a literal here (it cannot resolve CSS custom
                  // properties). Kept in step with --info, the same colour the
                  // .debug-current-line rule resolves to.
                  color: "#1a84d9",
                  position: monaco.editor.OverviewRulerLane.Center,
                },
              },
            },
          ]
        : [];

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      ...breakpointDecorations,
      ...currentLine,
    ]);
  }, [breakpoints, debugLine]);

  useEffect(() => {
    updateBreakpointDecorations();
  }, [breakpoints, debugLine, updateBreakpointDecorations]);

  useEffect(() => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;

    const markers = diagnostics.map((d) => ({
      severity: monacoSeverity(monaco, d.severity),
      message: d.message,
      startLineNumber: d.line,
      startColumn: d.column || 1,
      endLineNumber: d.endLine || d.line,
      endColumn: d.endColumn || (d.column ? d.column + 1 : model.getLineMaxColumn(d.line) || 1),
      source: "compiler",
    }));
    monaco.editor.setModelMarkers(model, COMPILER_MARKER_OWNER, markers);
  }, [diagnostics]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.defineTheme("leetcode-dark", LEETCODE_DARK_THEME as any);
    monaco.editor.defineTheme("dracula", DRACULA_THEME as any);
    monaco.editor.defineTheme("solarized-dark", SOLARIZED_DARK_THEME);
    monaco.editor.defineTheme("light", LEETCODE_LIGHT_THEME as any);

    editor.updateOptions(
      buildMonacoEditorOptions({
        fontSize: editorFontSize,
        tabSize: editorTabSize,
        relativeLineNumbers,
        extras: extraEditorOptionsRef.current,
        readOnly: editorLocked,
      }),
    );
    editor.getModel()?.updateOptions({
      tabSize: editorTabSize,
      insertSpaces: true,
    });

    const disposables: { dispose: () => void }[] = [];

    disposables.push(
      editor.onDidChangeCursorPosition((e: any) => {
        if (cursorRafRef.current) cancelAnimationFrame(cursorRafRef.current);
        cursorRafRef.current = requestAnimationFrame(() => {
          setCursorPos({ ln: e.position.lineNumber, col: e.position.column });
        });
      }),
    );

    disposables.push(
      editor.onDidChangeCursorSelection((e: any) => {
        if (!askGuruOnSelectionRef.current) {
          setAskGuruPopup(null);
          return;
        }

        const selectedText =
          editor.getModel()?.getValueInRange(e.selection)?.trim() || "";
        if (!selectedText || selectedText.length < 2 || e.selection.isEmpty()) {
          setAskGuruPopup(null);
          return;
        }

        const domNode = editor.getDomNode();
        const endPosition = {
          lineNumber: e.selection.endLineNumber,
          column: e.selection.endColumn,
        };
        const visiblePosition = editor.getScrolledVisiblePosition(endPosition);
        if (!domNode || !visiblePosition) return;

        const rect = domNode.getBoundingClientRect();
        aiSelectionRangeRef.current = e.selection;
        setSelectedCodeForGuru(selectedText);
        setAskGuruPopup({
          top: rect.top + visiblePosition.top + 22,
          left: Math.min(
            rect.left + visiblePosition.left + 8,
            window.innerWidth - 196,
          ),
        });
      }),
    );

    monaco.editor.setTheme(currentTheme.id);

    disposables.push(
      editor.onMouseDown((e: any) => {
        if (
          e.target?.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS ||
          e.target?.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN
        ) {
          const lineNumber = e.target.position?.lineNumber;
          if (lineNumber) {
            setBreakpoints((prev) => {
              const next = new Set(prev);
              if (next.has(lineNumber)) {
                next.delete(lineNumber);
              } else {
                next.add(lineNumber);
              }
              return next;
            });
          }
        }
      }),
    );

    registerPlaygroundJavaLanguage(monaco, () => dbTemplatesRef.current);

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCodeRef.current();
    });
    editor.addCommand(
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
      () => {
        formatCodeRef.current();
      },
    );
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
      () => setCommandPaletteOpen(true),
    );
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
      setQuickOpenOpen(true);
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
      setGoToLineOpen(true);
    });

    editorDisposablesRef.current = disposables;
    disposables.push(
      editor.onDidDispose(() => {
        disposables.forEach((d) => d.dispose());
        editorDisposablesRef.current = [];
        const model = editor.getModel();
        if (model) monaco.editor.setModelMarkers(model, COMPILER_MARKER_OWNER, []);
      }),
    );
    updateBreakpointDecorations();
  };


  const formatCode = useCallback(async () => {
    const raw = code;
    if (!raw.trim()) return;

    if (selectedLanguage.language === "java") {
      try {
        const formatted = await prettier.format(raw, {
          parser: "java",
          plugins: [prettierPluginJava, (prettierPluginJava as any)?.default || {}],
        });
        setCode(formatted);
        toast({
          title: "Code formatted successfully",
          description: "Your Java code has been formatted.",
        });
        setIsFormatted(true);
        setTimeout(() => {
          setIsFormatted(false);
        }, 2000);
      } catch (error) {
        console.error("Formatting error:", error);
        toast({
          title: "Formatting failed",
          description: "Check your code syntax.",
          variant: "destructive",
        });
      }
      return;
    }

    if (
      selectedLanguage.language === "python" ||
      selectedLanguage.language === "py"
    ) {
      const lines = raw.split("\n");
      const formattedPython = [];
      let previousBlank = false;

      for (const line of lines) {
        const trimmed = line.trim();

        const spacesMatches = line.match(/^\s*/);
        const spaces = spacesMatches
          ? spacesMatches[0].replace(/\t/g, "    ")
          : "";

        if (!trimmed) {
          if (!previousBlank) formattedPython.push("");
          previousBlank = true;
          continue;
        }
        previousBlank = false;

        formattedPython.push(spaces + trimmed);
      }
      setCode(formattedPython.join("\n"));
      toast({
        title: "Code formatted successfully",
        description: "Your Python code has been formatted.",
      });
      return;
    }

    if (
      selectedLanguage.language === "c++" ||
      selectedLanguage.language === "cpp"
    ) {
      const lines = raw.split("\n");
      const formattedCpp = [];
      let indent = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          formattedCpp.push("");
          continue;
        }

        if (trimmed.startsWith("#")) {
          formattedCpp.push(trimmed);
          continue;
        }

        let currentIndent = indent;

        // Count how many closing brackets are at the START of the current line
        const startClosers = (trimmed.match(/^[}\]\)]+/g) || [""])[0].length;
        currentIndent = Math.max(0, currentIndent - startClosers);

        if (trimmed.match(/^(public|private|protected)\s*:/)) {
          currentIndent = Math.max(0, currentIndent - 1);
        }

        formattedCpp.push("    ".repeat(currentIndent) + trimmed);

        // Calculate next line indent based on the whole line (excluding simple comments)
        const codePart = trimmed.split("//")[0];
        const opens = (codePart.match(/[{(\[]/g) || []).length;
        const closes = (codePart.match(/[}\]\)]/g) || []).length;
        indent += opens - closes;
        indent = Math.max(indent, 0);
      }
      setCode(formattedCpp.join("\n"));
      toast({
        title: "Code formatted successfully",
        description: "Your C++ code has been formatted.",
      });
      return;
    }

    setCode(raw);
    toast({
        title: "Code formatted successfully",
        description: "Your code has been formatted.",
    });
  }, [code, selectedLanguage, toast]);

  const resetCode = useCallback(() => {
    let nextCode = DEFAULT_CODE[selectedLanguage.language] || "";
    if (practiceId && practiceData?.code?.[0]?.content && selectedLanguage.language === "java") {
      nextCode = practiceData.code[0].content;
    } else if (activePracticeProblem) {
      const javaSnippet = activePracticeProblem.codeSnippets?.find((s) => s.langSlug === "java")?.code || "";
      if (javaSnippet && !javaSnippet.includes("public int solve()")) nextCode = javaSnippet;
    }
    
    setCodeTabs((tabs) =>
      tabs.map((tab) =>
        tab.id === activeCodeTabId ? { ...tab, code: nextCode } : tab,
      ),
    );
    
    setOutput("");
    // keep testcaseTabs but reset active input if LeetCode problem
    if (activePracticeProblem && testcaseTabs.length) {
      const first = testcaseTabs[0]?.value || "";
      setStdin(first);
    } else {
      setStdin("");
    }
    setBreakpoints(new Set());
    setIsDebugMode(false);
  }, [selectedLanguage.language, practiceId, practiceData, activeCodeTabId, activePracticeProblem, testcaseTabs]);

  const runCode = useCallback(
    async (debugRun = false) => {
      if (!ioPanelOpen || ioCollapsed) {
        expandIOPanel(
          isMobile
            ? IO_MOBILE_DEFAULT_SIZE
            : guruBotOpen
              ? IO_GURU_DEFAULT_SIZE
              : IO_DEFAULT_SIZE,
        );
      }

      setIsRunning(true);
      setIsDebugMode(debugRun);
      setOutput("");
      setRunMeta(null);
      setDiagnostics([]);
      setDebugFrames([]);
      setDebugLine(null);
      setConsoleTab(debugRun ? "debug" : "result");
      const startedAt = performance.now();
      // stdinAtRun will be resolved after harness decision; keep mutable
      let stdinAtRun = stdin;
      let status: RunStatus = debugRun ? "debug" : "accepted";
      try {
        let sourceCode = code;
        const isJava = selectedLanguage.language === "java";

        // If debug mode, instrument the code with print statements at breakpoints
        if (debugRun && breakpoints.size > 0 && isJava) {
          sourceCode = instrumentCodeForDebug(sourceCode, breakpoints);
          setOutput(
            `Debug mode: instrumented ${breakpoints.size} breakpoint(s)...\n\n`,
          );
        }

        // Harness path (when practice problem is loaded)
        let harness: string | null = null;
        let harnessStdin = "";
        if (isJava && !debugRun && (activePracticeProblem?.exampleTestcases || (testcaseTabs.length > 0 && activePracticeProblem))) {
          try {
            // Use testcaseTabs if present, else raw exampleTestcases
            const allInputs = testcaseTabs.length > 0 ? testcaseTabs.map((t) => t.value).join("\n") : activePracticeProblem?.exampleTestcases || "";
            harness = generateHarnessMain(sourceCode, allInputs);
          } catch (e) {
            console.warn("[Playground] harness generate failed", e);
          }
        }

        let processedCode = sourceCode;
        if (isJava) {
          processedCode = addAutoImports(sourceCode).replace(/public\s+class\s+/g, "class ");
        }
        // If harness exists, combine Solution + generated Main; stdin stays empty
        if (harness) {
          processedCode = `${processedCode}\n\n${harness}`;
          harnessStdin = "";
        } else {
          // Fallback: use active testcase tab or stdin textarea
          const activeCaseValue = testcaseTabs.find((t) => t.id === activeTestcaseId)?.value;
          harnessStdin = activeCaseValue ?? stdin ?? "";
        }
        // Ensure a Main class exists for Wandbox — harness already provides one, but if parsing
        // failed or no Leetcode problem is active, inject a minimal Main so compilation succeeds.
        if (isJava && !/\bclass\s+Main\b/.test(processedCode)) {
          // Retry harness using current tabs even when activePracticeProblem missing (e.g. GFG load with snippet)
          if (!harness && !debugRun) {
            try {
              const retryInputs = testcaseTabs.length > 0 ? testcaseTabs.map((t) => t.value).join("\n") : harnessStdin || "";
              if (retryInputs.trim()) {
                const retryHarness = generateHarnessMain(sourceCode, retryInputs);
                if (retryHarness) {
                  processedCode = `${processedCode}\n\n${retryHarness}`;
                  harness = retryHarness;
                  harnessStdin = "";
                }
              }
            } catch {}
          }
          if (!/\bclass\s+Main\b/.test(processedCode)) {
            processedCode += `\n\nclass Main {\n    public static void main(String[] args) {\n        System.out.println("=== Java Compilation & Syntax Check Successful ===");\n        System.out.println("Tip: Add a main method to test your solution!");\n    }\n}`;
          }
        }
        stdinAtRun = harness ? "" : harnessStdin;

        const res = await fetch(WANDBOX_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            compiler: selectedLanguage.version,
            code: processedCode,
            stdin: stdinAtRun || "",
            "compiler-option-raw": "",
            "runtime-option-raw": "",
            save: false,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          status = "service_error";
          setOutput(
            (prev) =>
              prev +
              `Compile service error (${res.status}): ${errorText || "Unknown error"}`,
          );
          return;
        }

        const data = await res.json();
        const parts = [];
        const compilerBlob = [data.compiler_error, data.compiler_message, data.program_error]
          .filter((chunk: unknown) => typeof chunk === "string" && chunk.trim())
          .join("\n");
        const nextDiagnostics = parseCompilerDiagnostics(compilerBlob);
        setDiagnostics(nextDiagnostics);
        if (nextDiagnostics.length > 0 && !debugRun) {
          setConsoleTab("problems");
        }

        if (data.compiler_error || data.compiler_message) {
          const msg = data.compiler_error || data.compiler_message;
          if (msg.trim()) {
            parts.push(`[Compiler]\n${msg}`);
            // A non-zero compiler status with no program output is a real
            // compile failure; warnings alone still produce a running program.
            if (data.status !== "0" && !data.program_output) {
              status = "compile_error";
            }
          }
        }
        if (data.program_output) {
          parts.push(data.program_output);
        }
        if (data.program_error) {
          parts.push(`[Runtime Error]\n${data.program_error}`);
          if (status === "accepted") status = "runtime_error";
        }

        const result =
          parts.join("\n") || "Program executed successfully (no output)";
        if (debugRun && breakpoints.size > 0) {
          setOutput((prev) => prev + result);
        } else {
          setOutput(result);
        }
        const frames = debugRun ? parseDebugTrace(result) : [];
        setDebugFrames(frames);
        setDebugLine(frames.length ? frames[frames.length - 1].line : null);
      } catch (err) {
        status = "service_error";
        setOutput(
          (prev) =>
            prev +
            `Could not connect to compiler.\n${err instanceof Error ? err.message : "Unknown error"}`,
        );
      } finally {
        setRunMeta({
          status,
          ms: Math.round(performance.now() - startedAt),
          stdinAtRun,
        });
        setIsRunning(false);
      }
    },
    [
      code,
      stdin,
      selectedLanguage,
      breakpoints,
      ioPanelOpen,
      ioCollapsed,
      isMobile,
      guruBotOpen,
      expandIOPanel,
      activePracticeProblem,
      testcaseTabs,
      activeTestcaseId,
    ],
  );

  useEffect(() => {
    runCodeRef.current = runCode;
  }, [runCode]);
  useEffect(() => {
    formatCodeRef.current = formatCode;
  }, [formatCode]);

  const downloadCode = useCallback(() => {
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    const fileName = classMatch ? `${classMatch[1]}.java` : "Main.java";
    const blob = new Blob([code], { type: "text/x-java-source" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [code]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setEditingBuiltinPrefix(null);
    setTemplateName("");
    setTemplateDesc("");
    setShowTemplateMenu(false);
    setTemplateDialogOpen(true);
  };

  const openEditTemplate = (tmpl: UserTemplate) => {
    setEditingTemplate(tmpl);
    setEditingBuiltinPrefix(null);
    setTemplateName(tmpl.name);
    setTemplateDesc(tmpl.description);
    setShowTemplateMenu(false);
    setTemplateDialogOpen(true);
  };

  const openEditBuiltinTemplate = (tmpl: (typeof CP_TEMPLATES)[0]) => {
    setEditingTemplate(null);
    setEditingBuiltinPrefix(tmpl.prefix);
    const override = builtinOverrides[tmpl.prefix];
    setTemplateName(tmpl.name);
    setTemplateDesc(override?.description ?? tmpl.description);
    setShowTemplateMenu(false);
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;

    if (editingBuiltinPrefix) {
      const updated = {
        ...builtinOverrides,
        [editingBuiltinPrefix]: { code, description: templateDesc.trim() },
      };
      setBuiltinOverrides(updated);
      setTemplateDialogOpen(false);

      if (user) {
        supabase
          .from("playground_template_overrides")
          .upsert({
            user_id: user.id,
            prefix: editingBuiltinPrefix,
            code,
            description: templateDesc.trim(),
          }, { onConflict: "user_id,prefix" });
      }
      return;
    }

    let updated: UserTemplate[];
    let savedTemplate: UserTemplate | null = null;
    if (editingTemplate) {
      updated = userTemplates.map((t) =>
        t.id === editingTemplate.id
          ? {
              ...t,
              name: templateName.trim(),
              description: templateDesc.trim(),
              code,
            }
          : t,
      );
      savedTemplate = updated.find((t) => t.id === editingTemplate.id) || null;
    } else {
      const newTmpl: UserTemplate = {
        id: crypto.randomUUID(),
        name: templateName.trim(),
        description: templateDesc.trim(),
        code,
      };
      savedTemplate = newTmpl;
      updated = [...userTemplates, newTmpl];
    }
    setUserTemplates(updated);
    setTemplateDialogOpen(false);

    if (user && savedTemplate) {
      if (editingTemplate) {
        supabase
          .from("playground_user_templates")
          .update({
            name: savedTemplate.name,
            description: savedTemplate.description,
            code: savedTemplate.code,
          })
          .eq("id", editingTemplate.id)
          .eq("user_id", user.id);
      } else {
        supabase
          .from("playground_user_templates")
          .insert({
            user_id: user.id,
            name: savedTemplate.name,
            description: savedTemplate.description,
            code: savedTemplate.code,
          })
          .select("id")
          .single()
          .then(({ data }) => {
            if (data?.id) {
              setUserTemplates((prev) =>
                prev.map((t) =>
                  t.id === savedTemplate!.id ? { ...t, id: data.id } : t,
                ),
              );
            }
          });
      }
    }
  };

  const handleResetBuiltinTemplate = (prefix: string) => {
    const updated = { ...builtinOverrides };
    delete updated[prefix];
    setBuiltinOverrides(updated);

    if (user) {
      supabase
        .from("playground_template_overrides")
        .delete()
        .eq("user_id", user.id)
        .eq("prefix", prefix);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = userTemplates.filter((t) => t.id !== id);
    setUserTemplates(updated);
    setDeleteConfirmId(null);

    if (user) {
      supabase
        .from("playground_user_templates")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
    }
  };

  // Run button — ProblemSolver rocket style
  const RunButton = ({ compact = false }: { compact?: boolean }) => (
    <AppTooltip content="Run (Ctrl+Enter)">
      <button
        onClick={() => runCode(false)}
        disabled={isRunning || !code.trim()}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-md font-semibold shadow-soft transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          compact ? "h-7 w-7" : "h-7 px-3",
          isRunning
            ? "bg-warning text-warning-foreground"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
          compact ? "text-xs" : "text-[13px]",
        )}
        aria-label="Run code"
        aria-busy={isRunning}
      >
        {isRunning ? (
          <Loader2 size={compact ? 13 : 14} className="animate-spin" />
        ) : compact ? (
          <Play size={13} fill="currentColor" strokeWidth={0} />
        ) : (
          <>
            <Play size={13} fill="currentColor" strokeWidth={0} />
            Run
          </>
        )}
      </button>
    </AppTooltip>
  );

  // Debug button — ProblemSolver style (outline with accent)
  const DebugButton = ({ compact = false }: { compact?: boolean }) => {
    const tooltip =
      breakpoints.size > 0
        ? `Debug with ${breakpoints.size} breakpoint(s)`
        : "Click line numbers to set breakpoints";

    return (
      <AppTooltip content={tooltip}>
        <button
          onClick={() => runCode(true)}
          disabled={isRunning || !code.trim() || breakpoints.size === 0}
          className={cn(
            "flex items-center justify-center gap-1 rounded-md border font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40",
            compact ? "h-7 w-7" : "h-7 px-3 text-[12px]",
            breakpoints.size > 0
              ? "border-purple-500/25 bg-purple-500/10 text-purple-500 dark:text-purple-400"
              : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          aria-label={tooltip}
        >
          <Bug size={13} />
          {!compact && <>Debug{breakpoints.size > 0 ? ` (${breakpoints.size})` : ""}</>}
        </button>
      </AppTooltip>
    );
  };

  const guruBotContext = useMemo(() => {
    const problemTheory = Array.isArray(practiceData?.theory)
      ? practiceData.theory.join("\n")
      : "";
    const keyPoints = Array.isArray(practiceData?.keyPoints)
      ? practiceData.keyPoints.join("\n")
      : "";
    const breakpointsText =
      breakpoints.size > 0
        ? Array.from(breakpoints)
            .sort((a, b) => a - b)
            .join(", ")
        : "none";

    return [
      "GuruBot coaching context:",
      practiceData
        ? [
            `Problem: ${practiceData.title || "Untitled"}`,
            `Problem id: ${practiceData.id || "unknown"}`,
            practiceData.difficulty
              ? `Difficulty: ${practiceData.difficulty}`
              : "",
            practiceData.timeComplexity
              ? `Expected time: ${practiceData.timeComplexity}`
              : "",
            practiceData.spaceComplexity
              ? `Expected space: ${practiceData.spaceComplexity}`
              : "",
          ]
            .filter(Boolean)
            .join("\n")
        : "Problem: General playground session",
      problemTheory ? `Problem statement / theory:\n${problemTheory}` : "",
      keyPoints ? `Key points / lesson hints:\n${keyPoints}` : "",
      `Language: ${selectedLanguage.label}`,
      `Breakpoints: ${breakpointsText}`,
      guruInitialPrompt ? `GuruBot request:\n${guruInitialPrompt}` : "",
      selectedCodeForGuru
        ? `Selected code for GuruBot:\n${selectedCodeForGuru}`
        : "",
      `Current stdin:\n${stdin || "(empty)"}`,
      `Current output / errors:\n${output || "(empty)"}`,
      `Current code:\n${code || "(empty)"}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [
    breakpoints,
    code,
    guruInitialPrompt,
    output,
    practiceData,
    selectedCodeForGuru,
    selectedLanguage.label,
    stdin,
  ]);

  // ── LeetCode-style result view: verdict headline + Input/Output cards ──
  const resultView = (() => {
    if (isRunning) {
      return (
        <div className="space-y-4 px-5 py-5">
          <div
            className="flex items-center gap-2.5 text-[15px] font-medium"
            style={{ color: "var(--lc-muted)" }}
          >
            <Loader2
              size={16}
              className="animate-spin"
              style={{ color: "var(--lc-accent)" }}
            />
            Judging…
          </div>
          <div className="space-y-2">
            {[100, 72, 88].map((w, i) => (
              <div
                key={i}
                className="h-3.5 animate-pulse rounded"
                style={{
                  width: `${w}%`,
                  background: "var(--lc-panel-3)",
                  animationDelay: `${i * 120}ms`,
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    if (!runMeta && !output) {
      return (
        <div
          className="flex h-full min-h-[220px] select-none flex-col items-center justify-center gap-3 px-6 text-center"
          style={{ color: "var(--lc-faint)" }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ border: "1px dashed var(--lc-border)" }}
          >
            <Play size={20} className="translate-x-0.5" />
          </div>
          <div className="space-y-1">
            <p className="text-[12.5px] font-medium">
              You must run your code first
            </p>
            <p className="text-[11px]">Press Ctrl+Enter to run</p>
          </div>
        </div>
      );
    }

    const status = runMeta?.status ?? "accepted";
    const meta = RUN_STATUS_META[status];
    const isFailure = meta.tone === "fail";
    const inputAtRun = runMeta?.stdinAtRun ?? stdin;

    // LeetCode harness per-testcase validation (when a practice problem is loaded)
    const isHarnessRun = Boolean(activePracticeProblem && testcaseTabs.length > 0 && !isFailure && output.trim());
    if (isHarnessRun) {
      const rawLines = output.trim().split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
      const perCaseOutputs = testcaseTabs.map((_, i) => rawLines[i] ?? "");
      const normalize = (s: string) => s.trim().replace(/\s+/g, " ").replace(/,\s/g, ",").replace(/\[\s/g, "[").replace(/\s\]/g, "]").toLowerCase();
      const caseStatuses = testcaseTabs.map((_, i) => {
        const your = perCaseOutputs[i] ?? "";
        const expected = expectedOutputs[i] ?? "";
        const isCustom = i >= expectedOutputs.length;
        if (your.startsWith("Runtime Error") || your.includes("Runtime Error on Case")) return { passed: false as boolean, your, expected, isCustom };
        if (isCustom) return { passed: true as boolean, your, expected: "", isCustom };
        return { passed: normalize(your) === normalize(expected), your, expected, isCustom };
      });
      const hasExpected = expectedOutputs.length > 0;
      const allPassed = hasExpected ? caseStatuses.filter((c) => !c.isCustom).every((c) => c.passed) && rawLines.length >= Math.min(testcaseTabs.length, expectedOutputs.length) : true;
      const passedCount = caseStatuses.filter((c) => c.passed).length;
      const totalCount = testcaseTabs.length;
      const overallStatusLabel = hasExpected ? (allPassed ? "Accepted" : "Wrong Answer") : "Executed";
      const overallTone = hasExpected ? (allPassed ? "pass" : "fail") : "pass";
      const activeIdx = Math.max(0, testcaseTabs.findIndex((t) => t.id === activeTestcaseId));
      const activeTab = testcaseTabs[activeIdx];
      const activeStatus = caseStatuses[activeIdx];
      const inputLabel = paramNames.length === 1 ? paramNames[0] : paramNames.length > 1 ? paramNames.join(", ") : "Input";

      return (
        <div className="space-y-4 px-5 py-5">
          {/* Overall verdict */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className={`lc-result-status lc-status-${overallTone}`}>
              {overallTone === "pass" ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
              {overallStatusLabel}
            </span>
            <span className="text-[12px] font-bold" style={{ color: overallTone === "pass" ? "var(--lc-green)" : "var(--lc-red)" }}>
              {passedCount} / {totalCount} passed
            </span>
            {runMeta?.ms != null && (
              <span className="lc-chip">
                <Clock size={11} /> {runMeta.ms} ms
              </span>
            )}
            <span className="lc-chip">{selectedLanguage.label}</span>
          </div>

          {/* Case tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {testcaseTabs.map((tc, i) => {
              const st = caseStatuses[i];
              const isActive = tc.id === activeTestcaseId;
              const isFailed = !st.passed && !st.isCustom;
              const isPassed = st.passed && !st.isCustom;
              return (
                <div
                  key={tc.id}
                  className={`group flex items-center gap-1 pl-3 pr-1 py-1 rounded-full text-[11px] font-bold border transition-colors min-w-max ${isActive ? (isFailed ? "bg-[color:var(--lc-red-soft)] text-[color:var(--lc-red)] border-[color:var(--lc-red)]" : isPassed ? "bg-[color:var(--lc-green-soft)] text-[color:var(--lc-green)] border-[color:var(--lc-green)]" : "bg-[color:var(--lc-panel-3)] text-[color:var(--lc-text)] border-[color:var(--lc-border)]") : "bg-transparent text-[color:var(--lc-muted)] border-transparent hover:text-[color:var(--lc-text)]"}`}
                >
                  <button onClick={() => setActiveTestcaseId(tc.id)} className="flex items-center gap-1 bg-transparent border-0 p-0 font-bold text-inherit">
                    {isFailed ? <X size={12} /> : isPassed ? <Check size={12} /> : null}
                    {tc.name}
                  </button>
                  {testcaseTabs.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newTabs = testcaseTabs.filter((t) => t.id !== tc.id);
                        const renamed = newTabs.map((t, idx) => ({ ...t, name: `Case ${idx + 1}` }));
                        setTestcaseTabs(renamed);
                        if (activeTestcaseId === tc.id) setActiveTestcaseId(renamed[0]?.id || "1");
                      }}
                      className="ml-1 rounded-full p-0.5 opacity-60 hover:bg-foreground/10 group-hover:opacity-100"
                      title="Remove case"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={() => {
                const newId = String(Date.now());
                setTestcaseTabs((prev) => [...prev, { id: newId, name: `Case ${prev.length + 1}`, value: "" }]);
                setActiveTestcaseId(newId);
                setConsoleTab("testcase");
              }}
              className="ml-1 px-2 py-1 rounded-full text-[11px] font-bold border border-dashed"
              style={{ color: "var(--lc-muted)", borderColor: "var(--lc-border)" }}
              title="Add custom testcase"
            >
              + Add
            </button>
          </div>

          {/* Active case cards */}
          {activeTab && activeStatus && (
            <div className="space-y-3">
              <div>
                <div className="lc-io-label">{inputLabel}</div>
                <div className="lc-io-card font-mono text-[12px] whitespace-pre-wrap break-all">{activeTab.value || "(empty)"}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="lc-io-label">Your Output</div>
                  <div className={`lc-io-card font-mono text-[12px] whitespace-pre-wrap break-all ${!activeStatus.passed && !activeStatus.isCustom ? "lc-io-card-error" : ""}`}>{activeStatus.your || "(no output)"}</div>
                </div>
                <div>
                  <div className="lc-io-label">Expected Output</div>
                  <div className="lc-io-card font-mono text-[12px] whitespace-pre-wrap break-all">
                    {activeStatus.isCustom ? <span style={{ color: "var(--lc-faint)", fontStyle: "italic" }}>No expected — custom case</span> : (activeStatus.expected || "(not found)")}
                  </div>
                </div>
              </div>
              {!activeStatus.passed && !activeStatus.isCustom && (
                <div className="text-[11px] font-medium" style={{ color: "var(--lc-red)" }}>
                  Mismatch — check your logic for this case. Expected vs your output differ after normalization.
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-5 px-5 py-5">
        {/* Verdict headline + runtime chip */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className={`lc-result-status lc-status-${meta.tone}`}>
            {meta.tone === "pass" ? (
              <Check size={18} strokeWidth={3} />
            ) : meta.tone === "fail" ? (
              <X size={18} strokeWidth={3} />
            ) : (
              <Bug size={17} strokeWidth={2.5} />
            )}
            {meta.label}
          </span>
          {runMeta?.ms != null && (
            <span className="lc-chip">
              <Clock size={11} />
              {runMeta.ms} ms
            </span>
          )}
          <span className="lc-chip">{selectedLanguage.label}</span>
        </div>

        {/* Input */}
        <div>
          <div className="lc-io-label">Input</div>
          <div
            className={`lc-io-card ${inputAtRun.trim() ? "" : "lc-io-card-empty"}`}
          >
            {inputAtRun.trim() || "No input provided"}
          </div>
        </div>

        {/* Output / stderr */}
        <div>
          <div className="lc-io-label">
            {isFailure ? "Error Message" : "Output"}
          </div>
          <div className={`lc-io-card ${isFailure ? "lc-io-card-error" : ""}`}>
            {output || <span className="lc-io-card-empty">No output</span>}
          </div>
        </div>
      </div>
    );
  })();

  // Settings dropdown content (reusable)
  const SettingsDropdownContent = () => {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className="absolute inset-0"
          style={{ background: "var(--lc-scrim)", backdropFilter: "blur(2px)" }}
          onClick={closeSettingsMenu}
          aria-label="Close settings"
        />
        <div
          className="lc-surface relative flex w-full max-w-lg animate-in flex-col overflow-hidden rounded-2xl duration-200 fade-in zoom-in-95"
          style={{ maxHeight: "85vh" }}
        >
          {/* Header */}
          <div
            className="flex flex-shrink-0 items-center justify-between px-5 py-3.5"
            style={{ borderBottom: "1px solid var(--lc-border)" }}
          >
            <h2
              className="flex items-center gap-2 text-[15px] font-semibold"
              style={{ color: "var(--lc-text)" }}
            >
              <Settings size={16} style={{ color: "var(--lc-accent)" }} />
              Settings
            </h2>
            <button
              onClick={closeSettingsMenu}
              className="lc-icon-btn !h-8 !w-8"
              aria-label="Close settings"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {/* ── Appearance ── */}
            <div className="lc-section-label">Appearance</div>
            <div className="mt-1">
              <div className="lc-setting-row">
                <div>
                  <p className="lc-setting-title">Editor Theme</p>
                  <p className="lc-setting-desc">
                    {themeChoice === THEME_AUTO
                      ? `Following the app's ${appTheme} mode — ${currentTheme.label}`
                      : "Fixed, regardless of the app's light/dark mode"}
                  </p>
                </div>
                <div className="w-48 flex-shrink-0">
                  <Select
                    value={themeChoice}
                    onValueChange={(val) => {
                      if (isValidThemeChoice(val)) setThemeChoice(val);
                    }}
                  >
                    <SelectTrigger
                      className="lc-field h-9 text-[13px] font-medium"
                      style={{ color: "var(--lc-text)" }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      container={playgroundShellRef.current}
                      className="z-[10000] rounded-lg"
                      style={{
                        background: "var(--lc-panel-2)",
                        border: "1px solid var(--lc-border)",
                        color: "var(--lc-text)",
                      }}
                    >
                      <SelectItem
                        value={THEME_AUTO}
                        className="cursor-pointer text-[13px]"
                      >
                        <div className="flex items-center gap-2.5">
                          <span style={{ color: "var(--lc-muted)" }}>
                            <SunMoon size={13} />
                          </span>
                          <span>Sync with App</span>
                        </div>
                      </SelectItem>
                      {THEMES.map((theme) => (
                        <SelectItem
                          key={theme.id}
                          value={theme.id}
                          className="cursor-pointer text-[13px]"
                        >
                          <div className="flex items-center gap-2.5">
                            <span style={{ color: "var(--lc-muted)" }}>
                              {theme.icon}
                            </span>
                            <span>{theme.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div
                className="lc-setting-row"
                style={{ borderTop: "1px solid var(--lc-border-soft)" }}
              >
                <div>
                  <p className="lc-setting-title">Font Size</p>
                  <p className="lc-setting-desc">Editor text size in pixels</p>
                </div>
                <div className="w-48 flex-shrink-0">
                  <Select
                    value={editorFontSize.toString()}
                    onValueChange={(val) => setEditorFontSize(Number(val))}
                  >
                    <SelectTrigger
                      className="lc-field h-9 text-[13px] font-medium"
                      style={{ color: "var(--lc-text)" }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      container={playgroundShellRef.current}
                      className="z-[10000] max-h-60 rounded-lg"
                      style={{
                        background: "var(--lc-panel-2)",
                        border: "1px solid var(--lc-border)",
                        color: "var(--lc-text)",
                      }}
                    >
                      {[10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24].map(
                        (size) => (
                          <SelectItem
                            key={size}
                            value={size.toString()}
                            className="cursor-pointer text-[13px]"
                          >
                            {size}px
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ── Editor ── */}
            <div
              className="lc-section-label mt-5 pt-4"
              style={{ borderTop: "1px solid var(--lc-border)" }}
            >
              Editor
            </div>
            <div className="mt-1">
              <div className="lc-setting-row">
                <div>
                  <p className="lc-setting-title">Tab Size</p>
                  <p className="lc-setting-desc">Spaces per indent level</p>
                </div>
                <div className="lc-segment flex-shrink-0">
                  {[2, 4, 8].map((size) => (
                    <button
                      key={size}
                      onClick={() => setEditorTabSize(size)}
                      data-active={editorTabSize === size}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="lc-setting-row"
                style={{ borderTop: "1px solid var(--lc-border-soft)" }}
              >
                <div>
                  <p className="lc-setting-title">Relative Line Numbers</p>
                  <p className="lc-setting-desc">
                    Show distance from the cursor line
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={relativeLineNumbers}
                  aria-label="Relative line numbers"
                  onClick={() => setRelativeLineNumbers((value) => !value)}
                  className="lc-switch"
                  data-on={relativeLineNumbers}
                >
                  <span />
                </button>
              </div>

              <div
                className="lc-setting-row"
                style={{ borderTop: "1px solid var(--lc-border-soft)" }}
              >
                <div>
                  <p className="lc-setting-title">Ask GuruBot on Selection</p>
                  <p className="lc-setting-desc">
                    Offer AI help when you highlight code
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={askGuruOnSelection}
                  aria-label="Ask GuruBot on selection"
                  onClick={() => setAskGuruOnSelection((value) => !value)}
                  className="lc-switch"
                  data-on={askGuruOnSelection}
                >
                  <span />
                </button>
              </div>

              <div
                className="lc-setting-row"
                style={{ borderTop: "1px solid var(--lc-border-soft)" }}
              >
                <div>
                  <p className="lc-setting-title">Minimap</p>
                  <p className="lc-setting-desc">Show overview minimap</p>
                </div>
                <button
                  role="switch"
                  aria-checked={extraEditorOptions.minimap}
                  aria-label="Toggle minimap"
                  onClick={() =>
                    setExtraEditorOptions((prev) => ({ ...prev, minimap: !prev.minimap }))
                  }
                  className="lc-switch"
                  data-on={extraEditorOptions.minimap}
                >
                  <span />
                </button>
              </div>

              <div
                className="lc-setting-row"
                style={{ borderTop: "1px solid var(--lc-border-soft)" }}
              >
                <div>
                  <p className="lc-setting-title">Word Wrap</p>
                  <p className="lc-setting-desc">Wrap long lines</p>
                </div>
                <button
                  role="switch"
                  aria-checked={extraEditorOptions.wordWrap}
                  aria-label="Toggle word wrap"
                  onClick={() =>
                    setExtraEditorOptions((prev) => ({ ...prev, wordWrap: !prev.wordWrap }))
                  }
                  className="lc-switch"
                  data-on={extraEditorOptions.wordWrap}
                >
                  <span />
                </button>
              </div>

              <div
                className="lc-setting-row"
                style={{ borderTop: "1px solid var(--lc-border-soft)" }}
              >
                <div>
                  <p className="lc-setting-title">Cursor Animation</p>
                  <p className="lc-setting-desc">Smooth cursor transition</p>
                </div>
                <button
                  role="switch"
                  aria-checked={extraEditorOptions.cursorSmooth}
                  aria-label="Toggle cursor animation"
                  onClick={() =>
                    setExtraEditorOptions((prev) => ({ ...prev, cursorSmooth: !prev.cursorSmooth }))
                  }
                  className="lc-switch"
                  data-on={extraEditorOptions.cursorSmooth}
                >
                  <span />
                </button>
              </div>

              <div
                className="lc-setting-row"
                style={{ borderTop: "1px solid var(--lc-border-soft)" }}
              >
                <div>
                  <p className="lc-setting-title">Bracket Pair Colorization</p>
                  <p className="lc-setting-desc">Color matching brackets</p>
                </div>
                <button
                  role="switch"
                  aria-checked={extraEditorOptions.bracketPairColorization}
                  aria-label="Toggle bracket colorization"
                  onClick={() =>
                    setExtraEditorOptions((prev) => ({
                      ...prev,
                      bracketPairColorization: !prev.bracketPairColorization,
                    }))
                  }
                  className="lc-switch"
                  data-on={extraEditorOptions.bracketPairColorization}
                >
                  <span />
                </button>
              </div>

              <div
                className="lc-setting-row"
                style={{ borderTop: "1px solid var(--lc-border-soft)" }}
              >
                <div>
                  <p className="lc-setting-title">Format on Type</p>
                  <p className="lc-setting-desc">Auto-format while typing</p>
                </div>
                <button
                  role="switch"
                  aria-checked={extraEditorOptions.formatOnType}
                  aria-label="Toggle format on type"
                  onClick={() =>
                    setExtraEditorOptions((prev) => ({
                      ...prev,
                      formatOnType: !prev.formatOnType,
                    }))
                  }
                  className="lc-switch"
                  data-on={extraEditorOptions.formatOnType}
                >
                  <span />
                </button>
              </div>
            </div>

            {/* ── Actions ── */}
            <div
              className="lc-section-label mt-5 pt-4"
              style={{ borderTop: "1px solid var(--lc-border)" }}
            >
              Actions
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                onClick={() => copyCode()}
                className="lc-hover flex flex-col items-center justify-center gap-2 rounded-lg px-2 py-3.5 text-[12px] font-medium"
                style={{
                  border: "1px solid var(--lc-border)",
                  color: "var(--lc-text)",
                }}
              >
                {copied ? (
                  <Check size={17} style={{ color: "var(--lc-green)" }} />
                ) : (
                  <Copy size={17} style={{ color: "var(--lc-muted)" }} />
                )}
                {copied ? "Copied" : "Copy Code"}
              </button>

              <button
                onClick={() => {
                  downloadCode();
                  closeSettingsMenu();
                }}
                className="lc-hover flex flex-col items-center justify-center gap-2 rounded-lg px-2 py-3.5 text-[12px] font-medium"
                style={{
                  border: "1px solid var(--lc-border)",
                  color: "var(--lc-text)",
                }}
              >
                <Download size={17} style={{ color: "var(--lc-muted)" }} />
                Download
              </button>

              <button
                onClick={() => {
                  resetCode();
                  closeSettingsMenu();
                }}
                className="flex flex-col items-center justify-center gap-2 rounded-lg px-2 py-3.5 text-[12px] font-medium transition-colors"
                style={{
                  border: "1px solid var(--lc-red)",
                  background: "var(--lc-red-soft)",
                  color: "var(--lc-red)",
                }}
              >
                <RotateCcw size={17} />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // â”€â”€ Derived layout flags â”€â”€
  const showLeftDescription = !zenMode && !isMobile && !!practiceData;
  const showMobileProblemView =
    isMobile && !!practiceData && practiceTab === "problem";
  const mainNotesActive = practiceTab === "notes" && !showLeftDescription;

  const difficultyClass =
    practiceData?.difficulty === "Easy"
      ? "lc-difficulty-easy"
      : practiceData?.difficulty === "Medium"
        ? "lc-difficulty-medium"
        : "lc-difficulty-hard";

  // â”€â”€ Notes surface (reused in left panel and main area) â”€â”€
  const notesToolbar = (
    <div
      className="flex flex-shrink-0 flex-wrap items-center gap-2 px-4 py-2.5"
      style={{ borderBottom: "1px solid var(--lc-border)" }}
    >
      <button
        type="button"
        onClick={() => setNotesPreviewOpen((open) => !open)}
        className={`lc-pill !py-1.5 !text-[12px] ${notesPreviewOpen ? "lc-pill-outline" : "lc-pill-muted"}`}
      >
        <BookOpen size={13} />
        {notesPreviewOpen ? "Edit" : "Preview"}
      </button>
      <button
        type="button"
        onClick={() => saveNotesNow(notesContent, true)}
        className="lc-pill lc-pill-green !py-1.5 !text-[12px]"
      >
        <Save size={13} />
        Save
      </button>
      <button
        type="button"
        onClick={() => {
          setNotesContent("");
          setNotesPreviewOpen(false);
          void saveNotesNow("");
        }}
        className="lc-pill lc-pill-muted !py-1.5 !text-[12px] hover:!text-[color:var(--lc-red)]"
      >
        <Trash2 size={13} />
        Clear
      </button>
      <div className="flex-1" />
      <span
        className="text-[11px] font-medium"
        style={{ color: "var(--lc-faint)" }}
      >
        {notesSaveStatus}
      </span>
    </div>
  );

  const notesBody = (
    <div className="min-h-0 flex-1 overflow-auto p-4">
      {notesPreviewOpen ? (
        <div
          className="note-rendered min-h-full whitespace-pre-wrap rounded-lg p-5 text-sm leading-relaxed"
          style={{
            border: "1px solid var(--lc-border)",
            background: "var(--lc-panel-2)",
            color: "var(--lc-text)",
          }}
          dangerouslySetInnerHTML={{
            __html:
              renderNoteMarkdown(notesContent) ||
              '<span class="text-muted-foreground">No notes to preview.</span>',
          }}
        />
      ) : (
        <RichTextNoteEditor
          value={notesContent}
          onChange={(value) => {
            setNotesContent(value);
            setNotesSaveStatus("Saving...");
          }}
          placeholder="Type here...(Markdown is enabled)"
          autoFocus
        />
      )}
    </div>
  );

  const notesSurface = (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{ background: "var(--lc-panel)" }}
    >
      {notesToolbar}
      {notesBody}
    </div>
  );

  return (
    // Outer page frame — identical treatment to Problem Solver so both
    // split-workspace pages sit in the same card on the same backdrop.
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex h-full min-h-0 flex-col bg-background",
        isFullscreen ? "fixed inset-0 z-50" : "p-3 md:p-4",
      )}
    >
      <div
        ref={playgroundShellRef}
        className={cn(
          "playground-shell relative flex min-h-0 flex-1 flex-col overflow-hidden bg-card text-card-foreground",
          isFullscreen ? "h-screen" : "rounded-2xl border border-border shadow-card",
        )}
      >
      {/* Breakpoint & debug CSS */}
      <style>{`
        .breakpoint-decoration {
          background: hsl(var(--destructive)) !important;
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          margin-left: 4px !important;
          margin-top: 6px !important;
          cursor: pointer !important;
        }
        .breakpoint-line-highlight {
          background: hsla(var(--destructive) / 0.08) !important;
        }
        .debug-current-line {
          background: hsl(var(--info) / 0.18) !important;
          border-left: 3px solid hsl(var(--info)) !important;
        }
        .debug-current-glyph {
          background: hsl(var(--info)) !important;
          width: 6px !important;
          margin-left: 5px !important;
          border-radius: 2px !important;
        }
        .monaco-editor .margin {
          cursor: pointer !important;
        }
      `}</style>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TOP BAR â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div
        className={cn(
          "flex h-11 flex-shrink-0 select-none items-center justify-between border-b border-border bg-muted/40 px-3",
          zenMode && "hidden",
        )}
      >
        {/* LEFT: language + workspace */}
        <div className="flex h-full min-w-0 flex-1 items-center gap-1">
          <div className="ml-1 flex h-full items-center gap-1">
          <div className="relative flex-shrink-0">
            <AppTooltip content="Change Language" side="bottom">
              <button
                onClick={() => {
                  if (showSettingsMenu && settingsMenuType !== "language") {
                    setShowSettingsMenu(false);
                  } else {
                    setShowSettingsMenu(true);
                    setSettingsMenuType("language");
                  }
                }}
                aria-label="Change Language"
                className="flex h-7 items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                <Code2 size={13} />
                <span>{selectedLanguage.label} 21</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    showSettingsMenu && settingsMenuType === "language"
                      ? "rotate-180"
                      : ""
                  }`}
                  style={{ color: "var(--lc-muted)" }}
                />
              </button>
            </AppTooltip>
            {showSettingsMenu && settingsMenuType === "language" && (
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowSettingsMenu(false)}
                />
                <div
                  className="lc-surface absolute left-0 top-10 z-[9999] min-w-[260px] animate-in overflow-hidden rounded-xl py-1 fade-in zoom-in-95"
                >
                  {availableLanguages.map((c) => {
                    const isActive = selectedLanguage.language === c.language;
                    return (
                      <button
                        key={c.language}
                        onClick={() => {
                          setSelectedLanguage(c);
                          setCode(DEFAULT_CODE[c.language] || "");
                          setShowSettingsMenu(false);
                        }}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] lc-hover"
                        style={{
                          color: isActive
                            ? "var(--lc-accent)"
                            : "var(--lc-text)",
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        <span>{c.label}</span>
                        <span
                          className="ml-4 font-mono text-[10px]"
                          style={{
                            color: isActive
                              ? "var(--lc-accent)"
                              : "var(--lc-faint)",
                          }}
                        >
                          {c.version || ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <div className="group relative flex-shrink-0">
            <button
              type="button"
              className="lc-icon-btn text-[13px] italic"
              aria-label={`Compiler Info: ${selectedLanguage.label} ${selectedLanguage.version}`}
            >
              i
            </button>
            <div
              className="lc-surface pointer-events-none absolute left-1/2 top-full z-[9999] mt-2 w-max max-w-[280px] -translate-x-1/2 rounded-lg px-3 py-2 text-[11px] opacity-0 transition-all duration-200 group-hover:opacity-100"
              style={{ color: "var(--lc-muted)" }}
            >
              <span className="font-semibold" style={{ color: "var(--lc-text)" }}>
                {selectedLanguage.label}
              </span>
              <span className="mx-1">version:</span>
              <span className="font-mono" style={{ color: "var(--lc-accent)" }}>
                {selectedLanguage.version}
              </span>
            </div>
          </div>
          <span
            className="hidden sm:inline-flex max-w-[140px] truncate text-[11px] font-medium"
            style={{ color: "var(--lc-muted)" }}
            title={activeCodeTab?.title}
          >
            · {activeCodeTab?.title}
          </span>
          </div>
        </div>

        {/* CENTER: primary Run + Debug */}
        <div className="hidden md:flex flex-shrink-0 items-center gap-2">
          <RunButton />
          <DebugButton />
          {diagnostics.length > 0 && (
            <span className="ml-1 hidden lg:inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--lc-red)" }}>
              {diagnostics.length} problem{diagnostics.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {/* RIGHT: secondary actions */}
        <div className="flex h-full min-w-0 flex-1 items-center justify-end gap-1">
          <div className="mr-1 flex h-full items-center gap-1">
          <TooltipProvider delayDuration={300}>
            {/* Templates */}
            <div className="relative flex h-full items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                    className="lc-icon-btn"
                    aria-label="Templates"
                  >
                    <FileCode size={17} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs font-medium">
                  <p>Templates</p>
                </TooltipContent>
              </Tooltip>

              {showTemplateMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setShowTemplateMenu(false)}
                    style={{ background: "var(--lc-scrim)" }}
                  />
                  <div
                    className="lc-surface fixed left-1/2 top-16 z-[9999] max-h-[70vh] w-[90vw] max-w-md -translate-x-1/2 animate-in overflow-hidden overflow-y-auto rounded-xl fade-in zoom-in-95 duration-200"
                  >
                    <div
                      className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em]"
                      style={{
                        borderBottom: "1px solid var(--lc-border)",
                        color: "var(--lc-muted)",
                      }}
                    >
                      Standard Templates
                    </div>
                    <div className="space-y-0.5 p-1.5">
                      {CP_TEMPLATES.map((tmpl) => {
                        const override = builtinOverrides[tmpl.prefix];
                        const isOverridden = !!override;
                        return (
                          <div
                            key={tmpl.prefix}
                            className="group flex items-center rounded-lg lc-hover"
                          >
                            <button
                              onClick={() => {
                                setCode(override?.code ?? tmpl.code);
                                setOutput("");
                                setShowTemplateMenu(false);
                              }}
                              className="flex flex-1 flex-col gap-0.5 px-3.5 py-2.5 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-[13px] font-medium"
                                  style={{ color: "var(--lc-text)" }}
                                >
                                  {tmpl.name}
                                </span>
                                {isOverridden && (
                                  <span
                                    className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                                    style={{
                                      background: "var(--lc-accent-soft)",
                                      color: "var(--lc-accent)",
                                    }}
                                  >
                                    edited
                                  </span>
                                )}
                              </div>
                              <span
                                className="text-[11px] leading-tight"
                                style={{ color: "var(--lc-muted)" }}
                              >
                                {override?.description ?? tmpl.description}
                              </span>
                            </button>
                            <div className="flex items-center gap-1 pr-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                              <AppTooltip content="Edit template">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditBuiltinTemplate(tmpl);
                                  }}
                                  className="flex h-7 w-7 items-center justify-center rounded-md lc-hover-strong"
                                  style={{ color: "var(--lc-muted)" }}
                                  aria-label="Edit template"
                                >
                                  <Pencil size={12} />
                                </button>
                              </AppTooltip>
                              {isOverridden && (
                                <AppTooltip content="Reset to original">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResetBuiltinTemplate(tmpl.prefix);
                                    }}
                                    className="flex h-7 w-7 items-center justify-center rounded-md lc-hover-strong"
                                    style={{ color: "var(--lc-yellow)" }}
                                    aria-label="Reset to original"
                                  >
                                    <RotateCcw size={12} />
                                  </button>
                                </AppTooltip>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {userTemplates.length > 0 && (
                      <>
                        <div
                          className="mt-1 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em]"
                          style={{
                            borderTop: "1px solid var(--lc-border)",
                            borderBottom: "1px solid var(--lc-border)",
                            color: "var(--lc-muted)",
                          }}
                        >
                          My Templates
                        </div>
                        <div className="space-y-0.5 p-1.5">
                          {userTemplates.map((tmpl) => (
                            <div
                              key={tmpl.id}
                              className="group flex items-center rounded-lg lc-hover"
                            >
                              <button
                                onClick={() => {
                                  setCode(tmpl.code);
                                  setOutput("");
                                  setShowTemplateMenu(false);
                                }}
                                className="flex flex-1 flex-col gap-0.5 px-3.5 py-2.5 text-left"
                              >
                                <span
                                  className="text-[13px] font-medium"
                                  style={{ color: "var(--lc-text)" }}
                                >
                                  {tmpl.name}
                                </span>
                                {tmpl.description && (
                                  <span
                                    className="text-[11px] leading-tight"
                                    style={{ color: "var(--lc-muted)" }}
                                  >
                                    {tmpl.description}
                                  </span>
                                )}
                              </button>
                              <div className="flex items-center gap-1 pr-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                                <AppTooltip content="Edit template">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditTemplate(tmpl);
                                    }}
                                    className="flex h-7 w-7 items-center justify-center rounded-md lc-hover-strong"
                                    style={{ color: "var(--lc-muted)" }}
                                    aria-label="Edit template"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                </AppTooltip>
                                <AppTooltip
                                  content={
                                    deleteConfirmId === tmpl.id
                                      ? "Click again to confirm delete"
                                      : "Delete template"
                                  }
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirmId(
                                        tmpl.id === deleteConfirmId
                                          ? null
                                          : tmpl.id,
                                      );
                                    }}
                                    className={`flex h-7 w-7 items-center justify-center rounded-md lc-hover-strong`}
                                    style={{
                                      color:
                                        deleteConfirmId === tmpl.id
                                          ? "hsl(var(--destructive-foreground))"
                                          : "var(--lc-muted)",
                                      background:
                                        deleteConfirmId === tmpl.id
                                          ? "var(--lc-red)"
                                          : "transparent",
                                    }}
                                    aria-label="Delete template"
                                  >
                                    {deleteConfirmId === tmpl.id ? (
                                      <Check size={12} />
                                    ) : (
                                      <Trash2 size={12} />
                                    )}
                                  </button>
                                </AppTooltip>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <button
                      onClick={openCreateTemplate}
                      className="group flex w-full items-center justify-center gap-2 px-6 py-3.5 text-[12px] font-medium lc-hover"
                      style={{
                        borderTop: "1px solid var(--lc-border)",
                        color: "var(--lc-accent)",
                      }}
                    >
                      <Plus size={14} />
                      Save current code as template
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Format */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={formatCode}
                  className="lc-icon-btn"
                  aria-label="Format code"
                >
                  {isFormatted ? (
                    <Check size={16} style={{ color: "var(--lc-green)" }} />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      width={16}
                      height={16}
                      fill="currentColor"
                    >
                      <path d="M64 128C64 92.7 92.7 64 128 64L416 64C451.3 64 480 92.7 480 128L496 128C540.2 128 576 163.8 576 208L576 304C576 348.2 540.2 384 496 384L336 384C327.2 384 320 391.2 320 400L320 418.7C338.6 425.3 352 443.1 352 464L352 560C352 586.5 330.5 608 304 608L272 608C245.5 608 224 586.5 224 560L224 464C224 443.1 237.4 425.3 256 418.7L256 400C256 355.8 291.8 320 336 320L496 320C504.8 320 512 312.8 512 304L512 208C512 199.2 504.8 192 496 192L480 192C480 227.3 451.3 256 416 256L128 256C92.7 256 64 227.3 64 192L64 128z" />
                    </svg>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-medium">
                <p>Format Code (Shift+Alt+F)</p>
              </TooltipContent>
            </Tooltip>

            {/* Reset */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => resetCode()}
                  className="lc-icon-btn hover:!text-[color:var(--lc-red)]"
                  aria-label="Reset Code"
                >
                  <RotateCcw size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-medium">
                <p>Reset Code</p>
              </TooltipContent>
            </Tooltip>

            <div
              className="mx-1 h-4 w-px"
              style={{ background: "var(--lc-border)" }}
            />

            {/* Fullscreen */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleFullscreen}
                  className="lc-icon-btn"
                  aria-label="Toggle fullscreen"
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-medium">
                <p>
                  {isFullscreen
                    ? "Exit Fullscreen (F11)"
                    : "Toggle Fullscreen (F11)"}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Outline */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setOutlineOpen((v) => !v)}
                  className={`lc-icon-btn ${outlineOpen ? "!text-[color:var(--lc-accent)]" : ""}`}
                  aria-label="Toggle outline"
                >
                  <ListTree size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-medium">
                <p>Outline</p>
              </TooltipContent>
            </Tooltip>

            {/* Zen Mode */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleZenMode}
                  className={`lc-icon-btn ${zenMode ? "!text-[color:var(--lc-accent)]" : ""}`}
                  aria-label={zenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
                >
                  <Focus size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-medium">
                <p>{zenMode ? "Exit Zen Mode (Esc)" : "Zen Mode"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Word Wrap quick toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setExtraEditorOptions((p) => ({ ...p, wordWrap: !p.wordWrap }))}
                  className={`lc-icon-btn ${extraEditorOptions.wordWrap ? "!text-[color:var(--lc-accent)]" : ""}`}
                  aria-label="Toggle word wrap"
                >
                  <WrapText size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-medium">
                <p>{extraEditorOptions.wordWrap ? "Disable Word Wrap" : "Enable Word Wrap"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    if (showSettingsMenu && settingsMenuType === "theme") {
                      setShowSettingsMenu(false);
                    } else {
                      setShowSettingsMenu(true);
                      setSettingsCompilerOpen(false);
                      setSettingsThemeOpen(true);
                      setSettingsMenuType("theme");
                    }
                  }}
                  className={`lc-icon-btn ${
                    showSettingsMenu && settingsMenuType === "theme"
                      ? "!text-[color:var(--lc-accent)]"
                      : ""
                  }`}
                  aria-label="Settings"
                >
                  <Settings size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-medium">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>

            {showSettingsMenu &&
              settingsMenuType === "theme" &&
              SettingsDropdownContent()}
          </TooltipProvider>
          </div>
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MAIN REGION â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="min-h-0 flex-1">
        <ResizablePanelGroup
          key={showLeftDescription ? "with-left" : "no-left"}
          direction={isMobile ? "vertical" : "horizontal"}
          className="h-full"
          autoSaveId={
            ioPanelOpen
              ? guruBotOpen && !isMobile
                ? "lc-playground-editor-io-guru-layout-v2"
                : "lc-playground-editor-io-layout-v2"
              : guruBotOpen && !isMobile
                ? "lc-playground-editor-guru-layout-v2"
                : "lc-playground-editor-layout-v2"
          }
          onLayout={(sizes) => {
            if (isMobile || !ioPanelOpen) return;

            const idx = showLeftDescription ? 2 : 1;
            const nextIoSize = sizes[idx] ?? IO_DEFAULT_SIZE;

            ioPanelSizeRef.current = nextIoSize;
            const nextCollapsed = nextIoSize <= IO_EXPAND_TRIGGER_SIZE;
            if (nextCollapsed !== ioCollapsed) {
              setIoCollapsed(nextCollapsed);
            }
          }}
        >
          {/* â”€â”€ Left: Description / Notes (desktop + practice problem) â”€â”€ */}
          {!zenMode && !isMobile && practiceData && (
            <>
              <ResizablePanel
                defaultSize={34}
                minSize={20}
                maxSize={55}
                className="overflow-hidden p-1 sm:p-2"
              >
                <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                  {/* Panel tabs */}
                  <div className="flex h-[42px] flex-shrink-0 select-none items-center border-b border-border px-5">
                    <button
                      onClick={() => setPracticeTab("problem")}
                      className={`lc-tab ${practiceTab !== "notes" ? "lc-tab-active" : ""}`}
                    >
                      Description
                    </button>
                    <button
                      onClick={() => setPracticeTab("notes")}
                      className={`lc-tab ${practiceTab === "notes" ? "lc-tab-active" : ""}`}
                    >
                      Notes
                    </button>
                  </div>

                  {practiceTab === "notes" ? (
                    notesSurface
                  ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <div className="mx-auto max-w-2xl space-y-8 px-6 py-7">
                        {/* Title + difficulty */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex items-center gap-1.5 text-[13px] font-medium ${difficultyClass}`}
                            >
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{
                                  background: "currentColor",
                                }}
                              />
                              {practiceData.difficulty || "Medium"}
                            </span>
                          </div>
                          <h1
                            className="text-[22px] font-semibold leading-snug"
                            style={{ color: "var(--lc-text)" }}
                          >
                            {practiceData.title}
                          </h1>
                        </div>

                        {/* Complexity chips */}
                        {(practiceData.timeComplexity ||
                          practiceData.spaceComplexity) && (
                          <div className="flex flex-wrap gap-2">
                            {practiceData.timeComplexity && (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[12px]"
                                style={{
                                  background: "var(--lc-panel-2)",
                                  border: "1px solid var(--lc-border)",
                                  color: "var(--lc-muted)",
                                }}
                              >
                                <Clock size={12} />
                                Time {practiceData.timeComplexity}
                              </span>
                            )}
                            {practiceData.spaceComplexity && (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[12px]"
                                style={{
                                  background: "var(--lc-panel-2)",
                                  border: "1px solid var(--lc-border)",
                                  color: "var(--lc-muted)",
                                }}
                              >
                                <Layers size={12} />
                                Space {practiceData.spaceComplexity}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Statement */}
                        <div className="lc-description space-y-4">
                          {practiceData.theory?.map(
                            (para: string, i: number) => (
                              <p key={i}>{para.replace(/\*\*/g, "")}</p>
                            ),
                          )}
                        </div>

                        {/* Key points */}
                        {practiceData.keyPoints &&
                          practiceData.keyPoints.length > 0 && (
                            <div className="space-y-3 pt-2">
                              <div
                                className="flex items-center gap-2 text-[13px] font-semibold"
                                style={{ color: "var(--lc-text)" }}
                              >
                                <Target size={14} style={{ color: "var(--lc-accent)" }} />
                                Key Points
                              </div>
                              <ul className="space-y-2.5">
                                {practiceData.keyPoints.map(
                                  (point: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3">
                                      <span
                                        className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                                        style={{
                                          background: "var(--lc-accent-soft)",
                                          color: "var(--lc-accent)",
                                        }}
                                      >
                                        {i + 1}
                                      </span>
                                      <span
                                        className="text-[13.5px] leading-relaxed"
                                        style={{ color: "var(--lc-muted)" }}
                                      >
                                        {point}
                                      </span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}

                        {/* Start coding CTA (mobile-friendly affordance kept) */}
                        <button
                          onClick={() => setPracticeTab("editor")}
                          className="lc-pill lc-pill-green mt-2"
                        >
                          <Code2 size={14} />
                          Start Coding
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </ResizablePanel>
              <ResizableHandle className="lc-resizer w-2" />
            </>
          )}

          {/* â”€â”€ Right region: editor + console dock (+ GuruBot far right) â”€â”€ */}
          <ResizablePanel
            defaultSize={
              isMobile ? 60 : showLeftDescription ? 66 : guruBotOpen ? 75 : 100
            }
            minSize={30}
            className="flex flex-col overflow-hidden p-1 sm:p-2"
          >
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              {/* File tab strip — ProblemSolver style */}
              <div
                className="flex min-h-[34px] flex-shrink-0 select-none items-center overflow-x-auto border-b border-border bg-muted/40 px-2 py-1"
                style={{ scrollbarWidth: "none" }}
              >
                {/* Mobile-only Description tab */}
                {isMobile && practiceData && (
                  <div
                    className={`lc-filetab ${practiceTab === "problem" ? "lc-filetab-active" : ""}`}
                  >
                    <button
                      onClick={() => setPracticeTab("problem")}
                      className="lc-filetab-label"
                    >
                      <BookOpen
                        size={13}
                        style={{
                          color:
                            practiceTab === "problem"
                              ? "var(--lc-accent)"
                              : "var(--lc-faint)",
                        }}
                      />
                      <span>Description</span>
                    </button>
                  </div>
                )}

                {codeTabs.map((tab) => {
                  const isActive =
                    practiceTab !== "problem" &&
                    practiceTab !== "notes" &&
                    activeCodeTabId === tab.id;
                  const isPracticeSolution =
                    tab.id === "solution" && !!practiceData;

                  return (
                    <div
                      key={tab.id}
                      className={`lc-filetab ${isActive ? "lc-filetab-active" : ""}`}
                    >
                      <button
                        onClick={() => {
                          setActiveCodeTabId(tab.id);
                          setPracticeTab("editor");
                        }}
                        className="lc-filetab-label"
                        aria-label={`Switch to ${tab.title}`}
                      >
                        <Code2
                          size={13}
                          style={{
                            color: isActive
                              ? "var(--lc-accent)"
                              : "var(--lc-faint)",
                          }}
                        />
                        <span>{tab.title}</span>
                      </button>

                      {!tab.protected && (
                        <button
                          onClick={() => closeCodeTab(tab.id)}
                          className="lc-filetab-close"
                          aria-label={`Close ${tab.title}`}
                        >
                          <X size={11} />
                        </button>
                      )}

                      {isPracticeSolution && (
                        <AppTooltip content="Close practice problem">
                          <button
                            onClick={() => navigate("/playground")}
                            className="lc-filetab-close"
                            aria-label="Close practice problem"
                          >
                            <X size={11} />
                          </button>
                        </AppTooltip>
                      )}
                    </div>
                  );
                })}

                {/* Notes tab (only when not shown in the left panel) */}
                {!showLeftDescription && notesTabOpen && (
                  <div
                    className={`lc-filetab ${practiceTab === "notes" ? "lc-filetab-active" : ""}`}
                  >
                    <button
                      onClick={() => setPracticeTab("notes")}
                      className="lc-filetab-label"
                      aria-label="Switch to Notes"
                    >
                      <StickyNote
                        size={13}
                        style={{
                          color:
                            practiceTab === "notes"
                              ? "var(--lc-accent)"
                              : "var(--lc-faint)",
                        }}
                      />
                      <span>Notes</span>
                    </button>
                    <button
                      onClick={() => {
                        setNotesTabOpen(false);
                        if (practiceTab === "notes") setPracticeTab("editor");
                      }}
                      className="lc-filetab-close"
                      aria-label="Close Notes tab"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}

                <AppTooltip content="New code tab" side="bottom">
                  <button
                    onClick={openNewCodeTab}
                    aria-label="New code tab"
                    className="lc-filetab-add"
                  >
                    <Plus size={15} />
                  </button>
                </AppTooltip>

                <div className="flex-1" />
              </div>

              {/* View area: problem (mobile) / notes / monaco */}
              {showMobileProblemView ? (
                <div
                  className="relative min-h-0 flex-1 overflow-y-auto"
                  style={{ background: "var(--lc-panel)" }}
                >
                  <div className="mx-auto max-w-2xl space-y-7 px-6 py-7">
                    <div className="space-y-3">
                      <span
                        className={`flex items-center gap-1.5 text-[13px] font-medium ${difficultyClass}`}
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: "currentColor" }}
                        />
                        {practiceData.difficulty || "Medium"}
                      </span>
                      <h1
                        className="text-[22px] font-semibold leading-snug"
                        style={{ color: "var(--lc-text)" }}
                      >
                        {practiceData.title}
                      </h1>
                    </div>

                    {(practiceData.timeComplexity ||
                      practiceData.spaceComplexity) && (
                      <div className="flex flex-wrap gap-2">
                        {practiceData.timeComplexity && (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[12px]"
                            style={{
                              background: "var(--lc-panel-2)",
                              border: "1px solid var(--lc-border)",
                              color: "var(--lc-muted)",
                            }}
                          >
                            <Clock size={12} />
                            Time {practiceData.timeComplexity}
                          </span>
                        )}
                        {practiceData.spaceComplexity && (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[12px]"
                            style={{
                              background: "var(--lc-panel-2)",
                              border: "1px solid var(--lc-border)",
                              color: "var(--lc-muted)",
                            }}
                          >
                            <Layers size={12} />
                            Space {practiceData.spaceComplexity}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="lc-description space-y-4">
                      {practiceData.theory?.map(
                        (para: string, i: number) => (
                          <p key={i}>{para.replace(/\*\*/g, "")}</p>
                        ),
                      )}
                    </div>

                    {practiceData.keyPoints &&
                      practiceData.keyPoints.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <div
                            className="flex items-center gap-2 text-[13px] font-semibold"
                            style={{ color: "var(--lc-text)" }}
                          >
                            <Target
                              size={14}
                              style={{ color: "var(--lc-accent)" }}
                            />
                            Key Points
                          </div>
                          <ul className="space-y-2.5">
                            {practiceData.keyPoints.map(
                              (point: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-3"
                                >
                                  <span
                                    className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                                    style={{
                                      background: "var(--lc-accent-soft)",
                                      color: "var(--lc-accent)",
                                    }}
                                  >
                                    {i + 1}
                                  </span>
                                  <span
                                    className="text-[13.5px] leading-relaxed"
                                    style={{ color: "var(--lc-muted)" }}
                                  >
                                    {point}
                                  </span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}

                    <button
                      onClick={() => setPracticeTab("editor")}
                      className="lc-pill lc-pill-green mt-2"
                    >
                      <Code2 size={14} />
                      Start Coding
                    </button>
                  </div>
                </div>
              ) : mainNotesActive ? (
                <div
                  className="min-h-0 flex-1"
                  style={{ background: "var(--lc-panel)" }}
                >
                  {notesSurface}
                </div>
              ) : (
                /* Monaco Editor */
                <div className="min-h-0 flex-1">
                  <Editor
                    height="100%"
                    language={
                      selectedLanguage.language === "c++"
                        ? "cpp"
                        : selectedLanguage.language
                    }
                    theme={currentTheme.id}
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    onMount={handleEditorMount}
                    options={{
                      fontSize: editorFontSize,
                      lineHeight: Math.round(editorFontSize * 1.62),
                      // Same stack as Problem Solver so code renders identically
                      // across both workspaces.
                      fontFamily:
                        '"Consolas","Cascadia Code","JetBrains Mono","Fira Code",Menlo,Monaco,"Courier New",monospace',
                      fontLigatures: false,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      padding: { top: 12, bottom: 12 },
                      lineNumbers: relativeLineNumbers ? "relative" : "on",
                      lineNumbersMinChars: 3,
                      lineDecorationsWidth: 12,
                      renderLineHighlight: "line",
                      bracketPairColorization: { enabled: true },
                      guides: { bracketPairs: false, indentation: false },
                      autoClosingBrackets: "always",
                      autoClosingQuotes: "always",
                      formatOnPaste: false,
                      suggest: { showKeywords: true, showSnippets: true },
                      quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: true,
                      },
                      quickSuggestionsDelay: 0,
                      suggestOnTriggerCharacters: true,
                      snippetSuggestions: "top",
                      tabSize: editorTabSize,
                      insertSpaces: true,
                      detectIndentation: false,
                      wordWrap: "on",
                      smoothScrolling: false,
                      cursorBlinking: "blink",
                      cursorSmoothCaretAnimation: "off",
                      glyphMargin: true,
                      readOnly: editorLocked,
                      renderWhitespace: "none",
                      overviewRulerBorder: false,
                      overviewRulerLanes: 0,
                      roundedSelection: false,
                      scrollbar: {
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                        useShadows: false,
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </ResizablePanel>

          {!zenMode && ioPanelOpen && (
            <>
              {/* Resize handle between editor and console dock */}
              <ResizableHandle
                className={`lc-resizer ${
                  isMobile ? "h-2" : "w-2"
                }`}
              />

              {/* Console dock */}
              <ResizablePanel
                ref={ioPanelRef}
                defaultSize={guruBotOpen && !isMobile ? 25 : IO_DEFAULT_SIZE}
                minSize={isMobile ? 25 : 5}
                collapsible={!isMobile}
                collapsedSize={isMobile ? 25 : IO_COLLAPSED_SIZE}
                onResize={(size) => {
                  if (isMobile) return;

                  ioPanelSizeRef.current = size;
                  const nextCollapsed = size <= IO_EXPAND_TRIGGER_SIZE;
                  if (nextCollapsed !== ioCollapsed) {
                    setIoCollapsed(nextCollapsed);
                  }
                }}
                onCollapse={() => {
                  ioPanelSizeRef.current = IO_COLLAPSED_SIZE;
                  if (!ioCollapsed) {
                    setIoCollapsed(true);
                  }
                }}
                onExpand={() => {
                  const nextSize =
                    ioPanelSizeRef.current > IO_EXPAND_TRIGGER_SIZE
                      ? ioPanelSizeRef.current
                      : IO_DEFAULT_SIZE;
                  ioPanelSizeRef.current = nextSize;
                  if (ioCollapsed) {
                    setIoCollapsed(false);
                  }
                }}
                className="overflow-hidden p-1 sm:p-2"
              >
                {ioCollapsed && !isMobile ? (
                  <AppTooltip content="Expand console" side="left">
                    <button
                      type="button"
                      onClick={() =>
                        expandIOPanel(
                          guruBotOpen ? IO_GURU_DEFAULT_SIZE : IO_DEFAULT_SIZE,
                        )
                      }
                      aria-label="Expand console"
                      className="group flex h-full w-full cursor-pointer select-none flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border bg-card px-0 py-4 shadow-soft lc-hover"
                      style={{ color: "var(--lc-accent)" }}
                    >
                      <Keyboard size={18} />
                      <span className="rotate-180 text-[11px] font-medium tracking-widest [writing-mode:vertical-rl]" style={{ color: "var(--lc-text)" }}>
                        Console
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          closeIOPanel();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            closeIOPanel();
                          }
                        }}
                        aria-label="Close console"
                        className="flex h-5 w-5 items-center justify-center rounded-md lc-hover-strong"
                        style={{ color: "var(--lc-muted)" }}
                      >
                        <X size={12} />
                      </span>
                    </button>
                  </AppTooltip>
                ) : (
                  <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                    {/* Console action bar: tabs + Run/Debug */}
                    <div className="flex h-11 flex-shrink-0 select-none items-center justify-between gap-3 border-b border-border bg-muted/40 px-4">
                      <div className="flex items-center">
                        <button
                          onClick={() => setConsoleTab("testcase")}
                          className={`lc-tab !mb-0 ${consoleTab === "testcase" ? "lc-tab-active" : ""}`}
                        >
                          Testcase
                        </button>
                        <button
                          onClick={() => setConsoleTab("result")}
                          className={`lc-tab !mb-0 flex items-center gap-2 ${consoleTab === "result" ? "lc-tab-active" : ""}`}
                        >
                          Result
                          {isRunning ? (
                            <Loader2
                              size={12}
                              className="animate-spin"
                              style={{ color: "var(--lc-accent)" }}
                            />
                          ) : runMeta ? (
                            <span
                              className="inline-block h-[7px] w-[7px] rounded-full"
                              style={{
                                background:
                                  RUN_STATUS_META[runMeta.status].tone === "pass"
                                    ? "var(--lc-green)"
                                    : RUN_STATUS_META[runMeta.status].tone ===
                                        "fail"
                                      ? "var(--lc-red)"
                                      : "var(--lc-yellow)",
                              }}
                            />
                          ) : null}
                        </button>
                        <button
                          onClick={() => setConsoleTab("problems")}
                          className={`lc-tab !mb-0 flex items-center gap-1.5 ${consoleTab === "problems" ? "lc-tab-active" : ""}`}
                          aria-label={`Problems ${diagnostics.length ? `(${diagnostics.length})` : ""}`}
                        >
                          Problems
                          {diagnostics.length > 0 && (
                            <span
                              className="inline-flex min-w-[16px] justify-center rounded-full px-1 text-[10px] font-semibold leading-none py-0.5"
                              style={{
                                background: diagnostics.some((d) => d.severity === "error")
                                  ? "var(--lc-red)"
                                  : "var(--lc-yellow)",
                                color: "hsl(var(--destructive-foreground))",
                              }}
                            >
                              {diagnostics.length}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setConsoleTab("debug")}
                          className={`lc-tab !mb-0 flex items-center gap-1.5 ${consoleTab === "debug" ? "lc-tab-active" : ""}`}
                        >
                          Debug
                          {breakpoints.size > 0 && (
                            <span
                              className="inline-flex min-w-[16px] justify-center rounded-full px-1 text-[10px] font-semibold leading-none py-0.5"
                              style={{ background: "var(--lc-red)", color: "hsl(var(--destructive-foreground))" }}
                            >
                              {breakpoints.size}
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {output && !isRunning && (
                          <AppTooltip content="Clear output">
                            <button
                              onClick={() => {
                                setOutput("");
                                setRunMeta(null);
                              }}
                              className="lc-icon-btn !h-7 !w-7"
                              aria-label="Clear output"
                            >
                              <RotateCcw size={13} />
                            </button>
                          </AppTooltip>
                        )}
                      </div>
                    </div>

                    {/* Console body */}
                    {consoleTab === "testcase" ? (
                      <div className="min-h-0 flex-1 overflow-auto p-3 flex flex-col gap-3">
                        {activePracticeProblem && testcaseTabs.length > 0 ? (
                          <>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {testcaseTabs.map((tc) => (
                                <div
                                  key={tc.id}
                                  className={`group flex items-center gap-1 pl-3 pr-1 py-1 rounded-full text-[11px] font-bold border transition-colors ${activeTestcaseId === tc.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground hover:text-foreground"}`}
                                >
                                  <button onClick={() => setActiveTestcaseId(tc.id)} className="bg-transparent border-0 p-0 font-bold text-inherit">
                                    {tc.name}
                                  </button>
                                  {testcaseTabs.length > 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newTabs = testcaseTabs.filter((t) => t.id !== tc.id);
                                        // re-index names
                                        const renamed = newTabs.map((t, idx) => ({ ...t, name: `Case ${idx + 1}` }));
                                        setTestcaseTabs(renamed);
                                        if (activeTestcaseId === tc.id) setActiveTestcaseId(renamed[0]?.id || "1");
                                        // sync stdin to active
                                        if (renamed[0]) setStdin(renamed.find((t) => t.id === activeTestcaseId)?.value || renamed[0].value);
                                      }}
                                      className="ml-1 rounded-full p-0.5 opacity-60 hover:bg-foreground/10 group-hover:opacity-100"
                                      title="Remove case"
                                    >
                                      <X size={10} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const newId = String(Date.now());
                                  setTestcaseTabs((prev) => [...prev, { id: newId, name: `Case ${prev.length + 1}`, value: "" }]);
                                  setActiveTestcaseId(newId);
                                }}
                                className="px-2 py-1 rounded-full text-[11px] font-bold border border-dashed"
                                style={{ color: "var(--lc-muted)", borderColor: "var(--lc-border)" }}
                              >
                                + Add
                              </button>
                            </div>
                            <div className="lc-io-label flex items-center justify-between">
                              <span>Input — {activePracticeProblem.title} ({activePracticeProblem.difficulty})</span>
                              {activePracticeProblem.link && (
                                <a href={activePracticeProblem.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium hover:underline" style={{ color: "var(--lc-accent)" }}>
                                  LeetCode <ExternalLink size={11} />
                                </a>
                              )}
                            </div>
                            <textarea
                              value={testcaseTabs.find((t) => t.id === activeTestcaseId)?.value || ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setTestcaseTabs((prev) => prev.map((t) => (t.id === activeTestcaseId ? { ...t, value: v } : t)));
                                setStdin(v);
                              }}
                              placeholder="Edit test case… each param on new line, e.g. [2,7,11,15]&#10;9"
                              spellCheck={false}
                              className="lc-field min-h-[120px] w-full resize-none px-3.5 py-3 font-mono text-[13px] leading-relaxed flex-1"
                            />
                            <div className="text-[11px] leading-relaxed p-2 rounded-lg border" style={{ color: "var(--lc-muted)", borderColor: "var(--lc-border-soft)", background: "var(--lc-panel-2)" }}>
                              <span style={{ color: "var(--lc-text)" }}>{testcaseTabs.length} case(s)</span> ready — hit <b>Run</b> to execute. Add cases or switch tabs before Run.
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="lc-io-label">stdin</div>
                            <textarea
                              value={stdin}
                              onChange={(e) => setStdin(e.target.value)}
                              placeholder="Enter input for your program…"
                              spellCheck={false}
                              className="lc-field min-h-[120px] w-full resize-none px-3.5 py-3 font-mono text-[13px] leading-relaxed"
                              style={{ height: "calc(100% - 26px)" }}
                            />
                            {activePracticeProblem && (
                              <div className="text-[11px] p-2 rounded border" style={{ color: "var(--lc-muted)", borderColor: "var(--lc-border-soft)" }}>
                                No sample testcases for this problem — using raw stdin mode.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : consoleTab === "problems" ? (
                      <div className="min-h-0 flex-1 overflow-auto flex flex-col">
                        <div className="shrink-0 p-2" style={{ borderBottom: "1px solid var(--lc-border-soft)" }}>
                          <ProblemsList
                            diagnostics={diagnostics}
                            onJump={(line, col) => {
                              const editor = editorRef.current;
                              if (!editor) return;
                              editor.revealPositionInCenter({ lineNumber: line, column: col });
                              editor.setPosition({ lineNumber: line, column: col });
                              editor.focus();
                            }}
                          />
                        </div>
                        <div className="flex-1 min-h-[280px] overflow-hidden flex flex-col" style={{ background: "var(--lc-panel)" }}>
                          <div className="px-3 py-2 flex items-center gap-2 shrink-0" style={{ borderBottom: "1px solid var(--lc-border)", background: "var(--lc-panel-2)" }}>
                            <span className="text-[12px] font-bold" style={{ color: "var(--lc-text)" }}>
                              Practice Library
                            </span>
                          </div>
                          <div className="flex-1 min-h-0 overflow-auto">
                            <PlaygroundProblemsLibrary
                              onFetchProblem={handleFetchProblem}
                              deriveSlug={deriveTitleSlug as any}
                              onSelectProblem={handleSelectPracticeProblem}
                              loadingSlug={practiceLoadingSlug}
                              activeSlug={activePracticeSlug}
                            />
                          </div>
                        </div>
                      </div>
                    ) : consoleTab === "debug" ? (
                      <div className="min-h-0 flex-1 overflow-auto">
                        <DebuggerPanel
                          frames={debugFrames}
                          breakpointCount={breakpoints.size}
                          onJump={(line) => {
                            const editor = editorRef.current;
                            if (!editor) return;
                            editor.revealLineInCenter(line);
                            editor.setPosition({ lineNumber: line, column: 1 });
                            editor.focus();
                          }}
                        />
                      </div>
                    ) : (
                      <div className="min-h-0 flex-1 overflow-auto">
                        {resultView}
                      </div>
                    )}
                  </div>
                )}
              </ResizablePanel>
            </>
          )}

          {!zenMode && guruBotOpen && !isMobile && (
            <>
              <ResizableHandle className="lc-resizer w-2" />

              <ResizablePanel
                ref={guruPanelRef}
                defaultSize={GURU_DEFAULT_SIZE}
                minSize={8}
                maxSize={45}
                collapsible
                collapsedSize={GURU_COLLAPSED_SIZE}
                onResize={(size) => {
                  setGuruBotCollapsed(size <= GURU_EXPAND_TRIGGER_SIZE);
                }}
                onCollapse={() => setGuruBotCollapsed(true)}
                className="overflow-hidden p-1 sm:p-2"
              >
                {guruBotCollapsed ? (
                  <AppTooltip content="Expand GuruBot" side="left">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => openGuruBotPanel()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openGuruBotPanel();
                        }
                      }}
                      aria-label="Expand GuruBot"
                      className="group flex h-full w-full cursor-pointer select-none flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border bg-card px-0 py-4 shadow-soft lc-hover"
                      style={{ color: "var(--lc-accent)" }}
                    >
                      <Bot size={18} />
                      <span className="rotate-180 text-[11px] font-medium tracking-widest [writing-mode:vertical-rl]" style={{ color: "var(--lc-text)" }}>
                        GuruBot
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGuruBotOpen(false);
                        }}
                        aria-label="Close GuruBot"
                        className="flex h-5 w-5 items-center justify-center rounded-md lc-hover-strong"
                        style={{ color: "var(--lc-muted)" }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </AppTooltip>
                ) : (
                  <div className="h-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                    <GuruBot
                      open={guruBotOpen}
                      onClose={() => setGuruBotOpen(false)}
                      debugMode={true}
                      initialContext={guruBotContext}
                      initialPrompt={guruInitialPrompt}
                      embedded={true}
                      onAssistantComplete={(text) => {
                        if (!pendingGuruWantsCodeRef.current) return;
                        const proposed = extractProposedCode(text);
                        if (isValidProposedCode(proposed) && selectedCodeForGuru) {
                          setAiEdit({ original: selectedCodeForGuru, modified: proposed });
                        }
                        pendingGuruWantsCodeRef.current = false;
                      }}
                      onInsertCode={(code) => {
                        if (aiSelectionRangeRef.current && isValidProposedCode(code)) {
                          const editor = editorRef.current;
                          const monaco = monacoRef.current;
                          if (editor && monaco) {
                            const range = aiSelectionRangeRef.current;
                            editor.executeEdits("guru-insert", [
                              { range: new monaco.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn), text: code },
                            ]);
                            return;
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• STATUS BAR â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div
        className={cn(
          "flex h-[30px] flex-shrink-0 select-none items-center justify-between border-t border-border bg-muted/40 px-3",
          zenMode && "hidden",
        )}
      >
        {/* Left: cursor + editor info */}
        <div
          className="flex items-center gap-3 font-mono text-[11px]"
          style={{ color: "var(--lc-muted)" }}
        >
          <span>
            Ln {cursorPos.ln}, Col {cursorPos.col}
          </span>
          <span>Spaces: {editorTabSize}</span>
          <span>{selectedLanguage.label}</span>
          <span className="hidden sm:inline-flex">UTF-8</span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            {themeChoice === THEME_AUTO && (
              <SunMoon size={10} style={{ color: "var(--lc-accent)" }} />
            )}
            {currentTheme.label}
          </span>
          <span
            className="hidden sm:inline-flex items-center gap-1"
            style={{
              color:
                codeSaveStatus === "Unsaved"
                  ? "var(--lc-yellow)"
                  : codeSaveStatus === "Saving"
                    ? "var(--lc-accent)"
                    : "var(--lc-muted)",
            }}
            aria-live="polite"
            aria-label={`Save status: ${codeSaveStatus}`}
          >
            <CircleDot size={10} />
            {codeSaveStatus}
          </span>
          {runMeta?.ms != null && (
            <span className="hidden sm:inline-flex items-center gap-1" style={{ color: "var(--lc-muted)" }}>
              <Clock size={10} />
              {runMeta.ms} ms
            </span>
          )}
          {editorLocked && (
            <span
              className="flex items-center gap-1"
              style={{ color: "var(--lc-accent)" }}
            >
              <Lock size={10} />
              Read-only
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center">
          <AppTooltip
            content={
              guruBotOpen && !guruBotCollapsed ? "Close GuruBot" : "Open GuruBot"
            }
          >
            <button
              onClick={() => {
                if (!guruBotOpen || guruBotCollapsed) {
                  openGuruBotPanel();
                } else {
                  setGuruBotOpen(false);
                }
              }}
              className="flex h-full items-center gap-1.5 px-3 text-[11px] font-medium transition-colors hover:text-[color:var(--lc-accent)]"
              style={{
                color:
                  guruBotOpen && !guruBotCollapsed
                    ? "var(--lc-accent)"
                    : "var(--lc-muted)",
              }}
              aria-label={
                guruBotOpen && !guruBotCollapsed ? "Close GuruBot" : "Open GuruBot"
              }
            >
              <Bot size={13} />
              <span>GuruBot</span>
            </button>
          </AppTooltip>

          <div
            className="mx-1 h-3.5 w-px"
            style={{ background: "var(--lc-border)" }}
          />

          {/* Notes */}
          <AppTooltip content="Open Notes">
            <button
              onClick={() => {
                setNotesTabOpen(true);
                setPracticeTab((prev) =>
                  prev === "notes" ? "editor" : "notes",
                );
              }}
              className="flex h-full items-center gap-1 px-3 text-[11px] font-medium lc-hover"
              style={{
                color:
                  practiceTab === "notes"
                    ? "var(--lc-accent)"
                    : "var(--lc-muted)",
              }}
              aria-label="Open Notes"
            >
              <StickyNote size={12} />
              <span>Notes</span>
            </button>
          </AppTooltip>

          <div
            className="mx-1 h-3.5 w-px"
            style={{ background: "var(--lc-border)" }}
          />

          {/* Hint */}
          <AppTooltip content="Ask GuruBot for a hint">
            <button
              onClick={() => {
                setGuruInitialPrompt(
                  practiceData
                    ? `Give me one small nudge for "${practiceData.title}" — point me at the next idea to try, but do not reveal the full solution.`
                    : "Give me one small hint about my current code — point out the next thing to look at, without writing the solution for me.",
                );
                openGuruBotPanel();
              }}
              className="flex h-full items-center gap-1 px-3 text-[11px] font-medium lc-hover"
              style={{ color: "var(--lc-yellow)" }}
              aria-label="Ask GuruBot for a hint"
            >
              <Lightbulb size={12} />
              <span>Hint</span>
            </button>
          </AppTooltip>

          {/* Lock */}
          <AppTooltip
            content={editorLocked ? "Unlock editor" : "Lock editor (read-only)"}
          >
            <button
              onClick={() => setEditorLocked((locked) => !locked)}
              className="lc-icon-btn !h-full !w-8 !rounded-none"
              style={{
                color: editorLocked ? "var(--lc-accent)" : "var(--lc-faint)",
              }}
              aria-label={editorLocked ? "Unlock editor" : "Lock editor"}
              aria-pressed={editorLocked}
            >
              <Lock size={12} />
            </button>
          </AppTooltip>
        </div>
      </div>

      {zenMode && (
        <div className="absolute top-3 right-3 z-50">
          <button
            onClick={toggleZenMode}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-[11px] font-bold text-card-foreground shadow-overlay"
          >
            <Focus size={13} style={{ color: "var(--lc-accent)" }} />
            Exit Zen Mode
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "var(--lc-panel-2)", color: "var(--lc-muted)", border: "1px solid var(--lc-border)" }}>Esc</span>
          </button>
        </div>
      )}

      {/* GuruBot selection menu */}
      {askGuruPopup && askGuruOnSelection && !aiEdit && (
        <GuruSelectionMenu
          top={askGuruPopup.top}
          left={askGuruPopup.left}
          onDismiss={() => setAskGuruPopup(null)}
          onAction={(action: GuruSelectionAction) => {
            const prompt = buildGuruSelectionPrompt(action, selectedCodeForGuru, selectedLanguage.label);
            const info = GURU_SELECTION_ACTIONS.find((a) => a.id === action);
            pendingGuruWantsCodeRef.current = Boolean(info?.wantsCode);
            if (info?.wantsCode) {
              aiSelectionRangeRef.current = editorRef.current?.getSelection() ?? null;
            }
            setGuruInitialPrompt(prompt);
            openGuruBotPanel();
            setAskGuruPopup(null);
          }}
        />
      )}

      {/* Create / Edit Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        {/* NOTE: DialogContent portals to <body>, so it sits outside
            .playground-shell and the --lc-* tokens do not resolve here.
            Everything in this subtree must use the app-wide tokens. */}
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {editingBuiltinPrefix
                ? "Edit Built-in Template"
                : editingTemplate
                  ? "Edit Template"
                  : "Save as Template"}
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              {editingBuiltinPrefix
                ? "Update this built-in template's description. Current editor code will be saved as your custom version."
                : editingTemplate
                  ? "Update template name, description, and code (current editor code will be saved)."
                  : "Save your current editor code as a reusable template."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
                htmlFor="lc-template-name"
              >
                Template Name {editingBuiltinPrefix ? "" : "*"}
              </label>
              <Input
                id="lc-template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. My Graph Template"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                disabled={!!editingBuiltinPrefix}
              />
            </div>
            <div>
              <label
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
                htmlFor="lc-template-desc"
              >
                Description (optional)
              </label>
              <Textarea
                id="lc-template-desc"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="e.g. BFS/DFS with adjacency list"
                className="min-h-[74px] rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                rows={2}
              />
            </div>
            <div className="rounded-lg bg-primary/10 px-3.5 py-2.5 text-[12px] text-primary">
              The current editor code will be saved with this template.
            </div>
          </div>
          <DialogFooter className="gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveTemplate}
              disabled={!editingBuiltinPrefix && !templateName.trim()}
            >
              <Save size={15} />
              {editingTemplate || editingBuiltinPrefix ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI diff preview */}
      {aiEdit && (
        <AiEditPreview
          original={aiEdit.original}
          modified={aiEdit.modified}
          language={selectedLanguage.language}
          theme={currentTheme.id}
          onReject={() => setAiEdit(null)}
          onAccept={() => {
            const editor = editorRef.current;
            const monaco = monacoRef.current;
            if (!editor || !monaco) {
              setAiEdit(null);
              return;
            }
            const range = aiSelectionRangeRef.current;
            const model = editor.getModel();
            if (model && range && isValidProposedCode(aiEdit.modified)) {
              // Replace selected range with proposed code, preserving undo
              editor.executeEdits("guru-accept", [
                {
                  range: new monaco.Range(
                    range.startLineNumber,
                    range.startColumn,
                    range.endLineNumber,
                    range.endColumn,
                  ),
                  text: aiEdit.modified,
                },
              ]);
              // Fallback: if range empty or selection lost, replace whole model content where original matches
              // Keep cursor at start of inserted block
              editor.focus();
            } else if (isValidProposedCode(aiEdit.modified)) {
              setCode(aiEdit.modified);
            }
            setAiEdit(null);
            aiSelectionRangeRef.current = null;
            pendingGuruWantsCodeRef.current = false;
          }}
        />
      )}

      {/* Command Palette */}
      {(() => {
        const commands: EditorCommand[] = [
          { id: "run", label: "Run Code", shortcut: "Ctrl+Enter", run: () => runCode(false) },
          { id: "debug", label: "Debug", shortcut: breakpoints.size ? `Debug (${breakpoints.size})` : "Debug", run: () => runCode(true) },
          { id: "format", label: "Format Code", shortcut: "Shift+Alt+F", run: () => formatCode() },
          { id: "reset", label: "Reset Code", run: () => resetCode() },
          { id: "copy", label: "Copy Code", shortcut: "Ctrl+C", run: () => copyCode() },
          { id: "fullscreen", label: isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen", shortcut: "F11", run: () => toggleFullscreen() },
          { id: "wordwrap", label: extraEditorOptions.wordWrap ? "Disable Word Wrap" : "Enable Word Wrap", run: () => setExtraEditorOptions((p) => ({ ...p, wordWrap: !p.wordWrap })) },
          { id: "minimap", label: extraEditorOptions.minimap ? "Disable Minimap" : "Enable Minimap", run: () => setExtraEditorOptions((p) => ({ ...p, minimap: !p.minimap })) },
          { id: "relative", label: relativeLineNumbers ? "Disable Relative Line Numbers" : "Enable Relative Line Numbers", run: () => setRelativeLineNumbers((v) => !v) },
          { id: "font-inc", label: "Increase Font Size", shortcut: "Ctrl+=", run: () => setEditorFontSize((s) => Math.min(24, s + 1)) },
          { id: "font-dec", label: "Decrease Font Size", shortcut: "Ctrl+-", run: () => setEditorFontSize((s) => Math.max(10, s - 1)) },
          { id: "settings", label: "Open Editor Settings", run: () => { setSettingsMenuType("theme"); setShowSettingsMenu(true); } },
          { id: "new-tab", label: "New Code Tab", shortcut: "Ctrl+N", run: () => openNewCodeTab() },
          { id: "close-tab", label: "Close Current Tab", shortcut: "Ctrl+W", run: () => { if (activeCodeTabId !== "solution") closeCodeTab(activeCodeTabId); } },
          { id: "zen", label: zenMode ? "Exit Zen Mode" : "Enter Zen Mode", shortcut: "Esc", run: () => toggleZenMode() },
          { id: "outline", label: outlineOpen ? "Close Outline" : "Show Outline", run: () => setOutlineOpen((v) => !v) },
          { id: "goto", label: "Go to Line", shortcut: "Ctrl+G", run: () => setGoToLineOpen(true) },
          { id: "quickopen", label: "Quick Open Tabs", shortcut: "Ctrl+P", run: () => setQuickOpenOpen(true) },
        ];
        return <EditorCommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} commands={commands} />;
      })()}

      <EditorQuickOpen
        open={quickOpenOpen}
        onOpenChange={setQuickOpenOpen}
        tabs={codeTabs}
        activeId={activeCodeTabId}
        onSelect={(id) => {
          setActiveCodeTabId(id);
          setPracticeTab("editor");
        }}
      />

      <GoToLineDialog
        open={goToLineOpen}
        onOpenChange={setGoToLineOpen}
        maxLine={code.split("\n").length}
        onGo={(line) => revealLine(line)}
      />

      {/* Outline drawer */}
      {outlineOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setOutlineOpen(false)} aria-label="Close outline" />
          <div
            className="relative w-[320px] max-w-[85vw] h-full overflow-hidden lc-surface flex flex-col"
            style={{ background: "var(--lc-panel)" }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--lc-border)" }}>
              <span className="text-[13px] font-semibold flex items-center gap-2" style={{ color: "var(--lc-text)" }}>
                <ListTree size={14} /> Outline
              </span>
              <button onClick={() => setOutlineOpen(false)} className="lc-icon-btn !h-7 !w-7" aria-label="Close outline">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <DocumentOutline
                symbols={outlineSymbols}
                onJump={(line, col) => {
                  revealLine(line, col);
                  setOutlineOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile GuruBot fallback */}
      {guruBotOpen && isMobile && (
        <GuruBot
          open={guruBotOpen}
          onClose={() => setGuruBotOpen(false)}
          debugMode={true}
          initialContext={guruBotContext}
          initialPrompt={guruInitialPrompt}
          onAssistantComplete={(text) => {
            if (!pendingGuruWantsCodeRef.current) return;
            const proposed = extractProposedCode(text);
            if (isValidProposedCode(proposed) && selectedCodeForGuru) {
              setAiEdit({ original: selectedCodeForGuru, modified: proposed });
            }
            pendingGuruWantsCodeRef.current = false;
          }}
          onInsertCode={(code) => {
            // fallback insert for non-selection edits
            if (aiSelectionRangeRef.current && isValidProposedCode(code)) {
              const editor = editorRef.current;
              const monaco = monacoRef.current;
              if (editor && monaco) {
                const range = aiSelectionRangeRef.current;
                editor.executeEdits("guru-insert", [
                  { range: new monaco.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn), text: code },
                ]);
                return;
              }
            }
            // else ignore, user can Use in editor via CodeBlock button
          }}
        />
      )}
      </div>
    </motion.div>
  );
}
