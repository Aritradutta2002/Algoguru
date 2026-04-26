import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
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
  ChevronRight,
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
} from "lucide-react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as prettier from "prettier/standalone";
import * as prettierPluginJava from "prettier-plugin-java";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { ALL_SNIPPETS, PRIORITY_LABELS } from "@/data/javaSnippets";
import {
  STATIC_COMPLETIONS_MAP,
  INSTANCE_COMPLETIONS_MAP,
  ALL_INSTANCE_METHODS,
  JAVA_KEYWORDS,
  JAVA_TYPES,
} from "@/data/javaAutoComplete";
import { CP_TEMPLATES } from "@/data/cpTemplates";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { GuruBot } from "@/components/GuruBot";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import RichTextNoteEditor from "@/components/RichTextNoteEditor";
interface UserTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
}

const USER_TEMPLATES_KEY = "playground-user-templates";
const BUILTIN_OVERRIDES_KEY = "playground-builtin-overrides";

const loadUserTemplates = (): UserTemplate[] => {
  try {
    const raw = localStorage.getItem(USER_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveUserTemplates = (templates: UserTemplate[]) => {
  localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(templates));
};

const loadBuiltinOverrides = (): Record<
  string,
  { code: string; description: string }
> => {
  try {
    const raw = localStorage.getItem(BUILTIN_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveBuiltinOverrides = (
  overrides: Record<string, { code: string; description: string }>,
) => {
  localStorage.setItem(BUILTIN_OVERRIDES_KEY, JSON.stringify(overrides));
};
const WANDBOX_API = "https://wandbox.org/api/compile.json";

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
  { id: "dracula", label: "Dracula", icon: <Palette size={13} /> },
  { id: "vs-dark", label: "Dark", icon: <Moon size={13} /> },
  { id: "light", label: "Light", icon: <Sun size={13} /> },
  {
    id: "solarized-dark",
    label: "Solarized Dark",
    icon: <Palette size={13} />,
  },
  { id: "hc-black", label: "High Contrast", icon: <Palette size={13} /> },
];

// Shared CSS Patterns
const BUTTON_BASE_CLASSES =
  "flex items-center gap-2 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-lg active:scale-95";
const PANEL_HEADER_CLASSES =
  "flex items-center gap-3 px-5 py-3 border-b bg-muted/20 backdrop-blur-sm";
const PANEL_BORDER_STYLE = { borderColor: "hsl(var(--border) / 0.3)" };
const ICON_BUTTON_CLASSES =
  "flex items-center justify-center w-10 h-10 rounded-2xl border border-border/30 bg-muted/30 text-muted-foreground hover:bg-muted hover:border-primary/30 hover:text-primary transition-all duration-300 shadow-sm";
const DROPDOWN_ITEM_CLASSES =
  "w-full flex items-center gap-3 px-5 py-4 text-left group";
const DROPDOWN_ICON_BOX_CLASSES =
  "w-8 h-8 rounded-xl flex items-center justify-center";

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

    // Process closing braces FIRST â€” remove out-of-scope variables
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

    // Track method parameters â€” detect any line that looks like a method signature with params
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

export default function Playground() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const practiceId = searchParams.get("practice");
  const { templates: dbTemplates } = useCPTemplates();

  // Detect mobile viewport
  const isMobile = useMediaQuery("(max-width: 767px)");
  const ioPanelRef = useRef<ImperativePanelHandle>(null);
  const [ioCollapsed, setIoCollapsed] = useState(false);

  const expandIOPanel = useCallback(() => {
    setIoCollapsed(false);
    ioPanelRef.current?.resize(isMobile ? 40 : 45);
  }, [isMobile]);

  const practiceData = useMemo(() => {
    if (!practiceId) return null;
    try {
      const raw = localStorage.getItem("playground-practice-problem");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.id === practiceId) return data;
      }
    } catch {}
    return null;
  }, [practiceId]);

  const [code, setCode] = useState(() => {
    if (practiceData?.code?.[0]?.content) return practiceData.code[0].content;
    return DEFAULT_CODE["java"];
  });
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(THEMES[0]);
  const [availableLanguages] = useState(SUPPORTED_LANGUAGES);
  const [selectedLanguage, setSelectedLanguage] = useState(
    SUPPORTED_LANGUAGES[0],
  );
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stdin, setStdin] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [userTemplates, setUserTemplates] =
    useState<UserTemplate[]>(loadUserTemplates);
  const [builtinOverrides, setBuiltinOverrides] =
    useState<Record<string, { code: string; description: string }>>(
      loadBuiltinOverrides,
    );
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

  // Debugger state
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [isDebugMode, setIsDebugMode] = useState(false);

  // Settings sub-section toggles
  const [settingsCompilerOpen, setSettingsCompilerOpen] = useState(false);
  const [settingsThemeOpen, setSettingsThemeOpen] = useState(false);

  // GuruBot debug-coach mode
  const [guruBotOpen, setGuruBotOpen] = useState(false);

  // Cursor position for VS Code-style status bar
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });

  const [notesContent, setNotesContent] = useState("");
  const initialNotesLoaded = useRef(false);

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
      const dbId = practiceId || "playground-generic";

      // Upsert the notes
      const { error } = await supabase
        .from("practice_problem_user_state")
        .upsert(
          {
            user_id: user.id,
            problem_id: dbId,
            notes: notesContent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,problem_id" },
        );

      if (error) console.error("Failed to save notes to DB", error);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [notesContent, user, practiceId]);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<any[]>([]);
  const dbTemplatesRef = useRef(dbTemplates);
  dbTemplatesRef.current = dbTemplates;

  // Update breakpoint decorations whenever breakpoints change
  const updateBreakpointDecorations = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const newDecorations = Array.from(breakpoints).map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        linesDecorationsClassName: "breakpoint-decoration",
        className: "breakpoint-line-highlight",
      },
    }));

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations,
    );
  }, [breakpoints]);

  useEffect(() => {
    updateBreakpointDecorations();
  }, [breakpoints, updateBreakpointDecorations]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.defineTheme("dracula", DRACULA_THEME as any);
    monaco.editor.defineTheme("solarized-dark", SOLARIZED_DARK_THEME);

    // Track cursor position for VS Code-style Ln/Col status
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPos({ ln: e.position.lineNumber, col: e.position.column });
    });

    // Explicitly apply the theme since defining it inside onMount might be too late for the initial render
    monaco.editor.setTheme(currentTheme.id);

    // Add breakpoint click handler on gutter (line number margin)
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
    });

    // Register comprehensive Java auto-completions
    // 1. Dot-notation completions (e.g., Integer.bitCount, Math.max, list.add)
    monaco.languages.registerCompletionItemProvider("java", {
      triggerCharacters: ["."],
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // Match ClassName. or variable.
        const dotMatch = textUntilPosition.match(/(\w+)\.\s*(\w*)$/);
        if (!dotMatch) return { suggestions: [] };

        const className = dotMatch[1];
        const partial = dotMatch[2] || "";
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column - partial.length,
          endColumn: position.column,
        };

        const suggestions: any[] = [];

        // Check for static methods (e.g., Integer.bitCount, Math.abs)
        const staticMethods = STATIC_COMPLETIONS_MAP.get(className);
        if (staticMethods) {
          for (const m of staticMethods) {
            suggestions.push({
              label: m.label,
              kind:
                m.kind === "field"
                  ? monaco.languages.CompletionItemKind.Field
                  : monaco.languages.CompletionItemKind.Method,
              insertText: m.insertText,
              insertTextRules: m.insertText.includes("$")
                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
              detail: m.detail,
              documentation: m.documentation,
              sortText: `0_${m.label}`,
              range,
            });
          }
        }

        // Check for instance methods (e.g., list.add, map.put)
        const instanceMethods = INSTANCE_COMPLETIONS_MAP.get(className);

        if (instanceMethods) {
          for (const m of instanceMethods) {
            suggestions.push({
              label: m.label,
              kind:
                m.kind === "field"
                  ? monaco.languages.CompletionItemKind.Field
                  : monaco.languages.CompletionItemKind.Method,
              insertText: m.insertText,
              insertTextRules: m.insertText.includes("$")
                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
              detail: m.detail,
              documentation: m.documentation,
              sortText: `0_${m.label}`,
              range,
            });
          }
        }

        if (suggestions.length === 0) {
          const fullText = model.getValue();
          const varName = className;
          const typePatterns = [
            new RegExp(`(\\w+(?:<[^>]*>)?)\\s+${varName}\\s*[=;,)]`),
            new RegExp(`(\\w+(?:<[^>]*>)?)\\s+${varName}\\s*$`, "m"),
            new RegExp(`(\\w+(?:<[^>]*>)?)\\[\\]\\s+${varName}\\s*[=;,)]`),
            new RegExp(
              `for\\s*\\([^)]*?(\\w+(?:<[^>]*>)?)\\s+${varName}\\s*[;:]`,
            ),
          ];

          let resolvedType: string | null = null;
          for (const pattern of typePatterns) {
            const match = fullText.match(pattern);
            if (match) {
              resolvedType = match[1].replace(/<.*>/, "");
              break;
            }
          }

          if (resolvedType) {
            const typeMethods = INSTANCE_COMPLETIONS_MAP.get(resolvedType);
            if (typeMethods) {
              for (const m of typeMethods) {
                suggestions.push({
                  label: m.label,
                  kind:
                    m.kind === "field"
                      ? monaco.languages.CompletionItemKind.Field
                      : monaco.languages.CompletionItemKind.Method,
                  insertText: m.insertText,
                  insertTextRules: m.insertText.includes("$")
                    ? monaco.languages.CompletionItemInsertTextRule
                        .InsertAsSnippet
                    : undefined,
                  detail: m.detail,
                  documentation: m.documentation,
                  sortText: `0_${m.label}`,
                  range,
                });
              }
            }
          }

          if (
            suggestions.length === 0 &&
            className[0] === className[0].toLowerCase()
          ) {
            for (const m of ALL_INSTANCE_METHODS) {
              suggestions.push({
                label: m.label,
                kind:
                  m.kind === "field"
                    ? monaco.languages.CompletionItemKind.Field
                    : monaco.languages.CompletionItemKind.Method,
                insertText: m.insertText,
                insertTextRules: m.insertText.includes("$")
                  ? monaco.languages.CompletionItemInsertTextRule
                      .InsertAsSnippet
                  : undefined,
                detail: m.detail,
                documentation: m.documentation,
                sortText: `1_${m.label}`,
                range,
              });
            }
          }
        }

        return { suggestions };
      },
    });

    // 2. Snippet & keyword completions (non-dot context)
    monaco.languages.registerCompletionItemProvider("java", {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });
        if (textUntilPosition.match(/\w+\.\s*\w*$/)) {
          return { suggestions: [] };
        }

        const suggestions: any[] = [];

        for (const s of ALL_SNIPPETS) {
          suggestions.push({
            label: s.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: s.insertText,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: s.detail,
            documentation: s.documentation,
            filterText: `${s.label} ${s.detail}`,
            sortText: `${PRIORITY_LABELS.has(s.label) ? "0" : "1"}_${s.label.toLowerCase()}`,
            range,
          });
        }

        for (const kw of JAVA_KEYWORDS) {
          suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            detail: "keyword",
            sortText: `2_${kw}`,
            range,
          });
        }

        for (const t of JAVA_TYPES) {
          suggestions.push({
            label: t,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: t,
            detail: "type",
            sortText: `3_${t}`,
            range,
          });
        }

        return { suggestions };
      },
    });

    // 3. CP Templates from database â€” prefix-triggered snippets
    const FULL_TEMPLATE_PREFIXES = new Set([
      "template",
      "cpfull",
      "codeforces",
      "codeforces-contest",
      "codechef",
      "codechef-contest",
      "leetcode",
      "leetcode-contest",
      "interview",
    ]);

    monaco.languages.registerCompletionItemProvider("java", {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });
        if (textUntilPosition.match(/\w+\.\s*\w*$/)) {
          return { suggestions: [] };
        }

        const suggestions: any[] = [];
        for (const t of dbTemplatesRef.current) {
          const isFullTemplate = FULL_TEMPLATE_PREFIXES.has(t.prefix);
          suggestions.push({
            label: t.prefix,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: isFullTemplate ? t.code : t.code,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.None,
            detail: `âš¡ ${t.name}`,
            documentation: t.description,
            filterText: `${t.prefix} ${t.name}`,
            sortText: `0_${t.prefix}`,
            range: isFullTemplate
              ? {
                  startLineNumber: 1,
                  endLineNumber: model.getLineCount(),
                  startColumn: 1,
                  endColumn: model.getLineMaxColumn(model.getLineCount()),
                }
              : range,
          });
        }
        return { suggestions };
      },
    });

    // 4. User-defined symbol autocomplete (IntelliSense) â€” parses current code for variables, methods, classes
    const JAVA_RESERVED = new Set([
      "abstract",
      "assert",
      "boolean",
      "break",
      "byte",
      "case",
      "catch",
      "char",
      "class",
      "const",
      "continue",
      "default",
      "do",
      "double",
      "else",
      "enum",
      "extends",
      "final",
      "finally",
      "float",
      "for",
      "goto",
      "if",
      "implements",
      "import",
      "instanceof",
      "int",
      "interface",
      "long",
      "native",
      "new",
      "package",
      "private",
      "protected",
      "public",
      "return",
      "short",
      "static",
      "strictfp",
      "super",
      "switch",
      "synchronized",
      "this",
      "throw",
      "throws",
      "transient",
      "try",
      "void",
      "volatile",
      "while",
      "var",
      "record",
      "sealed",
      "permits",
      "yield",
      "true",
      "false",
      "null",
      "String",
      "System",
      "Math",
      "Integer",
      "Long",
      "Double",
      "Boolean",
      "Character",
      "Object",
      "Arrays",
      "Collections",
      "List",
      "Map",
      "Set",
      "HashMap",
      "ArrayList",
      "LinkedList",
      "TreeMap",
      "HashSet",
      "TreeSet",
      "Queue",
      "Stack",
      "Deque",
      "PriorityQueue",
      "Scanner",
      "StringBuilder",
      "BufferedReader",
      "InputStreamReader",
      "PrintWriter",
      "main",
      "args",
      "out",
      "in",
      "err",
    ]);

    monaco.languages.registerCompletionItemProvider("java", {
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });
        // Skip if in dot-context
        if (textUntilPosition.match(/\w+\.\s*\w*$/)) return { suggestions: [] };

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const fullText = model.getValue();
        const symbolMap = new Map<string, { kind: string; line: number }>();

        const lines = fullText.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const ln = lines[i];
          const trimmed = ln.trim();
          if (
            trimmed.startsWith("//") ||
            trimmed.startsWith("/*") ||
            trimmed.startsWith("*")
          )
            continue;

          // Classes: class Foo / interface Bar
          const classMatch = trimmed.match(/(?:class|interface|enum)\s+(\w+)/);
          if (classMatch && !JAVA_RESERVED.has(classMatch[1])) {
            symbolMap.set(classMatch[1], { kind: "class", line: i + 1 });
          }

          // Methods: returnType methodName(
          const methodMatch = trimmed.match(
            /(?:(?:public|private|protected|static|final|abstract|synchronized)\s+)*(?:\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)\s*\(/,
          );
          if (
            methodMatch &&
            !JAVA_RESERVED.has(methodMatch[1]) &&
            methodMatch[1] !== "if" &&
            methodMatch[1] !== "for" &&
            methodMatch[1] !== "while" &&
            methodMatch[1] !== "switch" &&
            methodMatch[1] !== "catch"
          ) {
            symbolMap.set(methodMatch[1], { kind: "method", line: i + 1 });
          }

          // Variables: Type varName = or Type varName; or Type varName,
          const varMatches = trimmed.matchAll(
            /(?:(?:final)\s+)?(\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)\s*[=;,)]/g,
          );
          for (const m of varMatches) {
            const typePart = m[1];
            const varName = m[2];
            if (
              !JAVA_RESERVED.has(varName) &&
              !JAVA_RESERVED.has(typePart) &&
              ![
                "class",
                "interface",
                "enum",
                "return",
                "throw",
                "new",
                "import",
                "package",
              ].includes(typePart)
            ) {
              if (
                !symbolMap.has(varName) ||
                symbolMap.get(varName)!.kind !== "method"
              ) {
                symbolMap.set(varName, { kind: "variable", line: i + 1 });
              }
            }
          }

          // var declarations: var x =
          const varDecl = trimmed.match(/(?:final\s+)?var\s+(\w+)\s*=/);
          if (varDecl && !JAVA_RESERVED.has(varDecl[1])) {
            symbolMap.set(varDecl[1], { kind: "variable", line: i + 1 });
          }

          // For-loop variables
          const forMatch = trimmed.match(
            /for\s*\(\s*(?:final\s+)?(?:\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)\s*[=:]/,
          );
          if (forMatch && !JAVA_RESERVED.has(forMatch[1])) {
            symbolMap.set(forMatch[1], { kind: "variable", line: i + 1 });
          }

          // Method parameters
          const paramSigMatch = trimmed.match(
            /\w+\s*\(([^)]+)\)\s*(?:throws\s+\w+(?:\s*,\s*\w+)*)?\s*\{?/,
          );
          if (paramSigMatch) {
            const params = paramSigMatch[1].split(",");
            for (const p of params) {
              const pm = p
                .trim()
                .match(/(?:final\s+)?(?:\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)$/);
              if (pm && !JAVA_RESERVED.has(pm[1])) {
                if (!symbolMap.has(pm[1])) {
                  symbolMap.set(pm[1], { kind: "parameter", line: i + 1 });
                }
              }
            }
          }

          // Constants: static final TYPE NAME =
          const constMatch = trimmed.match(
            /static\s+final\s+\w+(?:<[^>]*>)?\s+(\w+)\s*=/,
          );
          if (constMatch && !JAVA_RESERVED.has(constMatch[1])) {
            symbolMap.set(constMatch[1], { kind: "constant", line: i + 1 });
          }
        }

        const suggestions: any[] = [];
        for (const [name, info] of symbolMap) {
          let kind = monaco.languages.CompletionItemKind.Variable;
          let icon = "variable";
          if (info.kind === "method") {
            kind = monaco.languages.CompletionItemKind.Method;
            icon = "method";
          } else if (info.kind === "class") {
            kind = monaco.languages.CompletionItemKind.Class;
            icon = "class";
          } else if (info.kind === "constant") {
            kind = monaco.languages.CompletionItemKind.Constant;
            icon = "constant";
          } else if (info.kind === "parameter") {
            kind = monaco.languages.CompletionItemKind.Variable;
            icon = "param";
          }

          suggestions.push({
            label: name,
            kind,
            insertText: name,
            detail: `${icon} (line ${info.line})`,
            sortText: `0_${name.toLowerCase()}`,
            range,
          });
        }

        return { suggestions };
      },
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCode();
    });
  };

  const formatCode = useCallback(async () => {
    const raw = code;
    if (!raw.trim()) return;

    if (selectedLanguage.language === "java") {
      try {
        // Use Google Java Format API
        const response = await fetch(
          "https://java-format-api.vercel.app/api/format",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: raw }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.formatted) {
            setCode(data.formatted);
            setOutput("âœ“ Code formatted with Google Java Format");
            setTimeout(() => setOutput(""), 2000);
            return;
          }
        }

        // If API fails, use fallback formatter
        throw new Error("API formatting failed");
      } catch (error) {
        console.error("Google Java Format API error:", error);

        // Fallback: Enhanced Java formatting with proper indentation
        try {
          const lines = raw.split("\n");
          const formattedJava = [];
          let indent = 0;
          let inMultilineComment = false;
          let consecutiveBlankLines = 0;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Handle empty lines - max 1 consecutive
            if (!trimmed) {
              consecutiveBlankLines++;
              if (consecutiveBlankLines <= 1 && formattedJava.length > 0) {
                const prevLine = formattedJava[formattedJava.length - 1];
                if (
                  !prevLine.trim().endsWith("{") &&
                  !prevLine.trim().endsWith("*/")
                ) {
                  formattedJava.push("");
                }
              }
              continue;
            }

            consecutiveBlankLines = 0;

            // Handle multi-line comments
            if (trimmed.startsWith("/*")) inMultilineComment = true;
            if (inMultilineComment) {
              formattedJava.push("    ".repeat(indent) + trimmed);
              if (trimmed.endsWith("*/")) inMultilineComment = false;
              continue;
            }

            // Handle single-line comments
            if (trimmed.startsWith("//")) {
              formattedJava.push("    ".repeat(indent) + trimmed);
              continue;
            }

            // Handle annotations
            if (trimmed.startsWith("@")) {
              formattedJava.push("    ".repeat(indent) + trimmed);
              continue;
            }

            // Handle package and import statements
            if (
              trimmed.startsWith("package ") ||
              trimmed.startsWith("import ")
            ) {
              formattedJava.push(trimmed);
              continue;
            }

            // Count closing braces at start
            const startClosers = (trimmed.match(/^[}]+/g) || [""])[0].length;
            let currentIndent = Math.max(0, indent - startClosers);

            // Handle case/default labels
            if (trimmed.match(/^(case\s+.*:|default\s*:)/)) {
              currentIndent = Math.max(0, indent - 1);
            }

            // Apply indentation
            formattedJava.push("    ".repeat(currentIndent) + trimmed);

            // Calculate next line indent
            const codePart = trimmed.split("//")[0];
            const opens = (codePart.match(/\{/g) || []).length;
            const closes = (codePart.match(/\}/g) || []).length;
            indent += opens - closes;
            indent = Math.max(indent, 0);

            // Special case handling
            if (
              trimmed.match(/^(case\s+.*:|default\s*:)/) &&
              !trimmed.includes("{")
            ) {
              indent++;
            }
            if (trimmed === "break;" || trimmed === "return;") {
              indent = Math.max(0, indent - 1);
            }
          }

          setCode(formattedJava.join("\n"));
          setOutput("âœ“ Code formatted (fallback formatter)");
          setTimeout(() => setOutput(""), 2000);
        } catch (fallbackError) {
          console.error("Fallback formatting error:", fallbackError);
          setOutput("âœ— Formatting failed. Check your code syntax.");
          setTimeout(() => setOutput(""), 3000);
        }
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
      return;
    }

    setCode(raw);
  }, [code, selectedLanguage]);

  const resetCode = useCallback(() => {
    setCode(DEFAULT_CODE[selectedLanguage.language] || "");
    setOutput("");
    setStdin("");
    setBreakpoints(new Set());
    setIsDebugMode(false);
  }, [selectedLanguage.language]);

  const runCode = useCallback(
    async (debugRun = false) => {
      setIsRunning(true);
      setOutput("");
      try {
        let sourceCode = code;
        const isJava = selectedLanguage.language === "java";

        // If debug mode, instrument the code with print statements at breakpoints
        if (debugRun && breakpoints.size > 0 && isJava) {
          sourceCode = instrumentCodeForDebug(sourceCode, breakpoints);
          setOutput(
            "ðŸ” Debug mode: Instrumented " +
              breakpoints.size +
              " breakpoint(s)...\n\n",
          );
        }

        let processedCode = sourceCode;
        if (isJava) {
          processedCode = addAutoImports(sourceCode).replace(
            /public\s+class\s+/g,
            "class ",
          );
        }

        const res = await fetch(WANDBOX_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            compiler: selectedLanguage.version,
            code: processedCode,
            stdin: stdin || "",
            "compiler-option-raw": "",
            "runtime-option-raw": "",
            save: false,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          setOutput(
            (prev) =>
              prev +
              `âš  Compile service error (${res.status}): ${errorText || "Unknown error"}`,
          );
          return;
        }

        const data = await res.json();
        const parts = [];

        if (data.compiler_error || data.compiler_message) {
          const msg = data.compiler_error || data.compiler_message;
          if (msg.trim()) parts.push(`[Compiler]\n${msg}`);
        }
        if (data.program_output) {
          parts.push(data.program_output);
        }
        if (data.program_error) {
          parts.push(`[Runtime Error]\n${data.program_error}`);
        }

        const result =
          parts.join("\n") || "âœ“ Program executed successfully (no output)";
        if (debugRun && breakpoints.size > 0) {
          setOutput((prev) => prev + result);
        } else {
          setOutput(result);
        }
      } catch (err) {
        setOutput(
          (prev) =>
            prev +
            `âš  Could not connect to compiler.\n${err instanceof Error ? err.message : "Unknown error"}`,
        );
      } finally {
        setIsRunning(false);
      }
    },
    [code, stdin, selectedLanguage, breakpoints],
  );

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
      saveBuiltinOverrides(updated);
      setTemplateDialogOpen(false);
      return;
    }

    let updated: UserTemplate[];
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
    } else {
      const newTmpl: UserTemplate = {
        id: crypto.randomUUID(),
        name: templateName.trim(),
        description: templateDesc.trim(),
        code,
      };
      updated = [...userTemplates, newTmpl];
    }
    setUserTemplates(updated);
    saveUserTemplates(updated);
    setTemplateDialogOpen(false);
  };

  const handleResetBuiltinTemplate = (prefix: string) => {
    const updated = { ...builtinOverrides };
    delete updated[prefix];
    setBuiltinOverrides(updated);
    saveBuiltinOverrides(updated);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = userTemplates.filter((t) => t.id !== id);
    setUserTemplates(updated);
    saveUserTemplates(updated);
    setDeleteConfirmId(null);
  };

  // Run button component (reusable for both normal and fullscreen)
  const RunButton = ({ compact = false }: { compact?: boolean }) => (
    <button
      onClick={() => runCode(false)}
      disabled={isRunning || !code.trim()}
      className={`${BUTTON_BASE_CLASSES} disabled:opacity-50 ${
        compact ? "px-4 py-2 text-[10px]" : "px-6 py-2.5 text-[11px]"
      } bg-success text-success-foreground shadow-success/20 hover:bg-success/90`}
      title="Run (Ctrl+Enter)"
    >
      {isRunning ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Play size={14} fill="currentColor" strokeWidth={0} />
      )}
      {isRunning ? "Running..." : "Run"}
    </button>
  );

  // Debug button component
  const DebugButton = ({ compact = false }: { compact?: boolean }) => (
    <button
      onClick={() => runCode(true)}
      disabled={isRunning || !code.trim() || breakpoints.size === 0}
      className={`${BUTTON_BASE_CLASSES} disabled:opacity-50 ${
        compact ? "px-4 py-2 text-[10px]" : "px-6 py-2.5 text-[11px]"
      } ${
        breakpoints.size > 0
          ? "bg-primary text-primary-foreground shadow-primary/30 hover:bg-primary/90"
          : "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20"
      }`}
      title={
        breakpoints.size > 0
          ? `Debug with ${breakpoints.size} breakpoint(s)`
          : "Click line numbers to set breakpoints"
      }
    >
      <Bug size={14} />
      Debug{breakpoints.size > 0 ? ` (${breakpoints.size})` : ""}
    </button>
  );

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
      `Current stdin:\n${stdin || "(empty)"}`,
      `Current output / errors:\n${output || "(empty)"}`,
      `Current code:\n${code || "(empty)"}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [breakpoints, code, output, practiceData, selectedLanguage.label, stdin]);

  // Settings dropdown content (reusable)
  const SettingsDropdownContent = () => {
    console.log("SettingsDropdownContent rendering");
    return (
      <div
        className="fixed left-1/2 -translate-x-1/2 top-24 w-[90vw] max-w-md rounded-[28px] overflow-hidden z-[9999] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] border border-border/30 animate-in fade-in zoom-in-95 duration-200 max-h-[70vh] overflow-y-auto"
        style={{
          backgroundColor: "hsl(var(--card))",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-24 bg-primary/5 blur-[40px] rounded-full pointer-events-none" />

        {/* Language Section â€” Collapsible */}
        <div className="relative z-10">
          <button
            onClick={() => setSettingsCompilerOpen(!settingsCompilerOpen)}
            className={DROPDOWN_ITEM_CLASSES}
          >
            <div
              className={`${DROPDOWN_ICON_BOX_CLASSES} bg-primary/10 border border-primary/20 text-primary`}
            >
              <Settings size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Language
              </p>
              <p className="text-[11px] font-bold text-foreground truncate">
                {selectedLanguage.label}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`text-muted-foreground/70 transition-transform duration-300 ${settingsCompilerOpen ? "rotate-180" : ""}`}
            />
          </button>
          {settingsCompilerOpen && (
            <div className="px-2 pb-2">
              {availableLanguages.map((c) => (
                <button
                  key={c.language}
                  onClick={() => {
                    setSelectedLanguage(c);
                    setCode(DEFAULT_CODE[c.language] || "");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left rounded-xl transition-all border ${
                    selectedLanguage.language === c.language
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "hover:bg-muted/50 border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${selectedLanguage.language === c.language ? "bg-accent shadow-[0_0_8px_hsl(var(--accent))]" : "bg-muted-foreground/40"}`}
                  />
                  <span className="text-[11px] font-bold">{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mx-5 h-px bg-border/10" />

        {/* Editor Theme Section â€” Collapsible */}
        <div className="relative z-10">
          <button
            onClick={() => setSettingsThemeOpen(!settingsThemeOpen)}
            className={DROPDOWN_ITEM_CLASSES}
          >
            <div
              className={`${DROPDOWN_ICON_BOX_CLASSES} bg-accent/10 border border-accent/20 text-accent`}
            >
              <Palette size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Theme
              </p>
              <p className="text-[11px] font-bold text-foreground truncate">
                {currentTheme.label}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`text-muted-foreground/40 transition-transform duration-300 ${settingsThemeOpen ? "rotate-180" : ""}`}
            />
          </button>

          {settingsThemeOpen && (
            <div className="px-2 pb-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setCurrentTheme(t);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left rounded-xl transition-all border ${
                    currentTheme.id === t.id
                      ? "bg-accent/10 border-accent/20 text-accent"
                      : "hover:bg-muted/50 border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${currentTheme.id === t.id ? "bg-accent shadow-[0_0_8px_hsl(var(--accent))]" : "bg-muted-foreground/20"}`}
                  />
                  <span className="text-[11px] font-bold flex items-center gap-2">
                    {t.icon} {t.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mx-5 h-px bg-border/10" />

        {/* Actions */}
        <div className="relative z-10 p-2 grid grid-cols-2 gap-1">
          <button
            onClick={() => {
              copyCode();
            }}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all hover:bg-muted/50 border border-transparent hover:border-border/30 text-muted-foreground hover:text-foreground group"
          >
            <div
              className={`${DROPDOWN_ICON_BOX_CLASSES} bg-muted/50 group-hover:bg-card transition-colors`}
            >
              {copied ? (
                <Check size={14} className="text-success" />
              ) : (
                <Copy size={14} />
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>

          <button
            onClick={() => {
              downloadCode();
              setShowSettingsMenu(false);
            }}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all hover:bg-muted/50 border border-transparent hover:border-border/30 text-muted-foreground hover:text-foreground group"
          >
            <div
              className={`${DROPDOWN_ICON_BOX_CLASSES} bg-muted/50 group-hover:bg-card transition-colors`}
            >
              <Download size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">
              Source
            </span>
          </button>
        </div>

        <button
          onClick={() => {
            resetCode();
            setShowSettingsMenu(false);
          }}
          className="relative z-10 w-full flex items-center justify-center gap-2 px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-destructive hover:bg-destructive/10 transition-all border-t border-border/10"
        >
          <RotateCcw size={12} />
          Reset Playground
        </button>
      </div>
    );
  };

  return (
    <div
      className={`${isFullscreen ? "fixed inset-0 z-50 h-screen" : "h-[calc(100vh-3.5rem)]"} flex flex-col bg-background`}
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
        .monaco-editor .margin {
          cursor: pointer !important;
        }
      `}</style>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          ROW 1 â€” Activity / Language Bar
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div
        className="flex items-center justify-between px-2 border-b flex-shrink-0 select-none"
        style={{
          background: "hsl(var(--card))",
          borderColor: "hsl(var(--border)/0.25)",
          minHeight: 38,
        }}
      >
        {/* Left: Language + i + Auto */}
        <div className="flex items-center gap-1 h-full">
          <div className="relative flex-shrink-0">
            <button
              onClick={() => {
                setShowSettingsMenu(!showSettingsMenu);
                setSettingsCompilerOpen(true);
                setSettingsThemeOpen(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
            >
              <span className="text-[13px]">â˜•</span>
              <span>{selectedLanguage.label}</span>
              <ChevronDown
                size={11}
                className={`transition-transform duration-200 ${showSettingsMenu && settingsCompilerOpen ? "rotate-180" : ""}`}
              />
            </button>
            {showSettingsMenu && (
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowSettingsMenu(false)}
                  style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                />
                <SettingsDropdownContent />
              </>
            )}
          </div>
          <button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 transition-all text-[11px] italic font-serif font-bold">
            i
          </button>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-muted-foreground/60 border border-border/20 bg-muted/20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
            Auto
          </div>
        </div>

        {/* Right: icon toolbar */}
        <div className="flex items-center gap-0.5 h-full">
          {/* Templates */}
          <div className="relative">
            <button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              title="Templates"
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40 transition-all"
            >
              <FileCode size={15} />
            </button>
            {showTemplateMenu && (
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowTemplateMenu(false)}
                  style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                />
                <div
                  className="fixed left-1/2 -translate-x-1/2 top-20 w-[90vw] max-w-md rounded-[24px] overflow-hidden z-[9999] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] border border-border/30 max-h-[70vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
                  style={{
                    backgroundColor: "hsl(var(--card))",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-24 bg-primary/5 blur-[40px] rounded-full pointer-events-none" />
                  <div className="relative z-10 px-6 py-4 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/70 border-b border-border/10 bg-muted/10">
                    Standard Blueprints
                  </div>
                  <div className="relative z-10 p-2 space-y-1">
                    {CP_TEMPLATES.map((tmpl) => {
                      const override = builtinOverrides[tmpl.prefix];
                      const isOverridden = !!override;
                      return (
                        <div
                          key={tmpl.prefix}
                          className="group flex items-center rounded-2xl hover:bg-muted/50 transition-all duration-300 border border-transparent hover:border-border/10"
                        >
                          <button
                            onClick={() => {
                              setCode(override?.code ?? tmpl.code);
                              setOutput("");
                              setShowTemplateMenu(false);
                            }}
                            className="flex-1 flex flex-col gap-1 px-4 py-3 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-bold tracking-tight text-foreground">
                                {tmpl.name}
                              </span>
                              {isOverridden && (
                                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                                  edited
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground/60 leading-tight">
                              {override?.description ?? tmpl.description}
                            </span>
                          </button>
                          <div className="flex items-center gap-1 pr-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditBuiltinTemplate(tmpl);
                              }}
                              className="w-8 h-8 rounded-xl bg-card border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm"
                              title="Edit blueprint"
                            >
                              <Pencil size={12} />
                            </button>
                            {isOverridden && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResetBuiltinTemplate(tmpl.prefix);
                                }}
                                className="w-8 h-8 rounded-xl bg-card border border-border/30 flex items-center justify-center text-muted-foreground hover:text-warning hover:border-warning/30 transition-all shadow-sm"
                                title="Reset to original"
                              >
                                <RotateCcw size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {userTemplates.length > 0 && (
                    <>
                      <div className="relative z-10 px-6 py-4 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/70 border-y border-border/10 bg-muted/10 mt-2">
                        My Personal Vault
                      </div>
                      <div className="relative z-10 p-2 space-y-1">
                        {userTemplates.map((tmpl) => (
                          <div
                            key={tmpl.id}
                            className="group flex items-center rounded-2xl hover:bg-muted/50 transition-all duration-300 border border-transparent hover:border-border/10"
                          >
                            <button
                              onClick={() => {
                                setCode(tmpl.code);
                                setOutput("");
                                setShowTemplateMenu(false);
                              }}
                              className="flex-1 flex flex-col gap-1 px-4 py-3 text-left"
                            >
                              <span className="text-[12px] font-bold tracking-tight text-foreground">
                                {tmpl.name}
                              </span>
                              {tmpl.description && (
                                <span className="text-[10px] font-medium text-muted-foreground/60 leading-tight">
                                  {tmpl.description}
                                </span>
                              )}
                            </button>
                            <div className="flex items-center gap-1 pr-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditTemplate(tmpl);
                                }}
                                className="w-8 h-8 rounded-xl bg-card border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm"
                                title="Edit template"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(
                                    tmpl.id === deleteConfirmId
                                      ? null
                                      : tmpl.id,
                                  );
                                }}
                                className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all shadow-sm ${deleteConfirmId === tmpl.id ? "bg-destructive text-white border-destructive" : "bg-card border-border/30 text-muted-foreground hover:text-destructive hover:border-destructive/30"}`}
                                title="Delete template"
                              >
                                {deleteConfirmId === tmpl.id ? (
                                  <Check size={12} />
                                ) : (
                                  <Trash2 size={12} />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <button
                    onClick={openCreateTemplate}
                    className="relative z-10 w-full flex items-center justify-center gap-3 px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/5 transition-all border-t border-border/10 group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus size={14} />
                    </div>
                    Snapshot Editor to Template
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={copyCode}
            title="Copy code"
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40 transition-all"
          >
            {copied ? (
              <Check size={14} className="text-primary" />
            ) : (
              <Copy size={14} />
            )}
          </button>
          <button
            onClick={formatCode}
            title="Format code"
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40 transition-all"
          >
            <AlignLeft size={14} />
          </button>
          <button
            onClick={() => runCode(true)}
            disabled={isRunning || breakpoints.size === 0}
            title="Debug"
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-30"
          >
            <Bug size={14} />
          </button>
          <button
            onClick={() => resetCode()}
            title="Reset code"
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <RotateCcw size={14} />
          </button>
          <div className="w-px h-4 bg-border/30 mx-0.5" />
          <button
            onClick={() => setIsFullscreen((v) => !v)}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40 transition-all"
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
          <button
            onClick={() => {
              setShowSettingsMenu((v) => !v);
              setSettingsCompilerOpen(false);
              setSettingsThemeOpen(false);
            }}
            title="Settings"
            className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${showSettingsMenu && !settingsCompilerOpen ? "text-primary bg-primary/10" : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40"}`}
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          ROW 2 â€” Tab Bar + Run + Status
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div
        className="flex items-center border-b flex-shrink-0 select-none"
        style={{
          background: "hsl(var(--muted)/0.08)",
          borderColor: "hsl(var(--border)/0.2)",
          minHeight: 36,
        }}
      >
        {/* Left: file tabs */}
        <div className="flex items-center h-full">
          {/* Solution / Practice tab */}
          <div
            className="flex items-center h-full px-4 gap-2 text-[12px] font-medium border-r"
            style={{
              borderColor: "hsl(var(--border)/0.2)",
              background: "hsl(var(--card)/0.7)",
              color: "hsl(var(--foreground))",
            }}
          >
            <Code2 size={13} className="text-primary/70" />
            <span>
              {practiceData
                ? `Practice: ${practiceData.title?.slice(0, 20)}`
                : "Solution 1"}
            </span>
            {practiceData && (
              <button
                onClick={() => navigate("/playground")}
                className="ml-1 w-4 h-4 rounded-sm flex items-center justify-center hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-all"
              >
                <X size={10} />
              </button>
            )}
          </div>

          {/* Note tab â€” only visible when notes are open */}
          {practiceTab === "notes" && (
            <div
              className="flex items-center h-full px-3 gap-2 text-[12px] font-medium border-r"
              style={{
                borderColor: "hsl(var(--border)/0.2)",
                background: "hsl(var(--card)/0.7)",
                color: "hsl(var(--foreground))",
              }}
            >
              <StickyNote size={13} className="text-amber-400/80" />
              <span className="text-amber-400/90">Note</span>
              <button
                onClick={() => setPracticeTab("editor")}
                className="ml-0.5 w-4 h-4 rounded-sm flex items-center justify-center hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-all"
                title="Close note"
              >
                <X size={10} />
              </button>
            </div>
          )}

          {/* + new tab (save as template) */}
          <button
            onClick={openCreateTemplate}
            title="Save as template"
            className="flex items-center justify-center w-8 h-full text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30 transition-all border-r"
            style={{ borderColor: "hsl(var(--border)/0.2)" }}
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Run + Debug inline */}
        <div
          className="flex items-center gap-1 px-2 border-r"
          style={{ borderColor: "hsl(var(--border)/0.2)", height: "100%" }}
        >
          <RunButton compact />
          <DebugButton compact />
        </div>

        <div className="flex-1" />

        {/* Right status */}
        <div className="flex items-center gap-0 h-full">
          {/* GuruBot */}
          <button
            onClick={() => setGuruBotOpen(true)}
            className="flex items-center gap-1.5 px-3 h-full text-[11px] font-bold border-l hover:bg-primary/10 transition-all group"
            style={{
              borderColor: "hsl(var(--border)/0.2)",
              color: "hsl(var(--primary))",
            }}
            title="Open GuruBot"
          >
            <Bot size={13} />
            <span>GuruBot</span>
          </button>
          <div className="w-px h-4 bg-border/30" />
          {/* Notes button */}
          <button
            onClick={() =>
              setPracticeTab(practiceTab === "notes" ? "editor" : "notes")
            }
            className={`flex items-center gap-1 px-3 h-full text-[11px] font-bold border-l transition-all ${
              practiceTab === "notes"
                ? "text-amber-400 bg-amber-400/10"
                : "text-muted-foreground hover:bg-muted/30"
            }`}
            style={{ borderColor: "hsl(var(--border)/0.2)" }}
            title="Toggle Notes"
          >
            <StickyNote size={12} />
            <span>Notes</span>
          </button>
          <div className="w-px h-4 bg-border/30" />
          {/* Hint */}
          <button
            className="flex items-center gap-1 px-3 h-full text-[11px] font-bold border-l text-amber-400/80 hover:bg-amber-400/10 hover:text-amber-400 transition-all"
            style={{ borderColor: "hsl(var(--border)/0.2)" }}
            title="Hint"
          >
            <Lightbulb size={12} />
            <span>Hint</span>
          </button>
          <div className="w-px h-4 bg-border/30" />
          {/* Lock */}
          <button
            className="flex items-center justify-center w-8 h-full border-l text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30 transition-all"
            style={{ borderColor: "hsl(var(--border)/0.2)" }}
            title="Lock editor"
          >
            <Lock size={12} />
          </button>
          {/* Ln/Col */}
          <div
            className="flex items-center px-3 h-full border-l text-[11px] font-mono text-muted-foreground/50"
            style={{ borderColor: "hsl(var(--border)/0.2)" }}
          >
            Ln {cursorPos.ln}, Col {cursorPos.col}
          </div>
        </div>
      </div>

      {/* Editor + Output with resizable panels */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup
          direction={isMobile ? "vertical" : "horizontal"}
          className="h-full"
          autoSaveId="playground-editor-io-layout"
          onLayout={(sizes) => {
            if (!isMobile) setIoCollapsed((sizes[1] ?? 45) <= 8);
          }}
        >
          {/* Code Editor Panel */}
          <ResizablePanel defaultSize={isMobile ? 60 : 55} minSize={30}>
            <div className="flex flex-col h-full">
              {/* Problem panel */}

              {/* Problem panel */}
              {practiceData && practiceTab === "problem" ? (
                <div className="flex-1 min-h-0 overflow-y-auto p-10 bg-background relative">
                  {/* Background Glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

                  <div className="max-w-3xl mx-auto space-y-10 relative z-10">
                    {/* Problem header */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        {practiceData.difficulty && (
                          <span
                            className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
                              practiceData.difficulty === "Easy"
                                ? "bg-success/10 border-success/20 text-success"
                                : practiceData.difficulty === "Medium"
                                  ? "bg-warning/10 border-warning/20 text-warning"
                                  : "bg-accent/10 border-accent/20 text-accent"
                            }`}
                          >
                            {practiceData.difficulty}
                          </span>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                          Challenge Node
                        </span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground">
                        {practiceData.title}
                      </h2>
                    </div>

                    {/* Complexity */}
                    {(practiceData.timeComplexity ||
                      practiceData.spaceComplexity) && (
                      <div className="flex flex-wrap gap-3">
                        {practiceData.timeComplexity && (
                          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-muted/20 border border-border/30">
                            <Clock size={14} className="text-primary" />
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
                                Time
                              </span>
                              <span className="text-xs font-black font-mono text-foreground">
                                {practiceData.timeComplexity}
                              </span>
                            </div>
                          </div>
                        )}
                        {practiceData.spaceComplexity && (
                          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-muted/20 border border-border/30">
                            <Layers size={14} className="text-accent" />
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
                                Space
                              </span>
                              <span className="text-xs font-black font-mono text-foreground">
                                {practiceData.spaceComplexity}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Theory */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        <Sparkles size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                          Problem Architecture
                        </span>
                      </div>
                      <div className="rounded-[32px] p-8 bg-card border border-border/30 shadow-2xl shadow-black/5">
                        <ul className="space-y-4">
                          {practiceData.theory?.map(
                            (para: string, i: number) => (
                              <li key={i} className="flex items-start gap-4">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                                <span className="text-[15px] font-medium leading-relaxed text-foreground/70">
                                  {para.replace(/\*\*/g, "")}
                                </span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Key Points */}
                    {practiceData.keyPoints &&
                      practiceData.keyPoints.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-warning">
                            <Target size={14} />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                              Execution Strategy
                            </span>
                          </div>
                          <div className="rounded-[32px] p-8 bg-warning/5 border border-warning/20">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {practiceData.keyPoints.map(
                                (point: string, i: number) => (
                                  <li
                                    key={i}
                                    className="flex items-center gap-3 text-sm font-bold text-foreground/80"
                                  >
                                    <div className="w-8 h-8 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning flex-shrink-0">
                                      {i + 1}
                                    </div>
                                    {point}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>
                      )}

                    {/* Start coding CTA */}
                    <button
                      onClick={() => setPracticeTab("editor")}
                      className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.15em] text-[11px] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                      <Code2 size={16} />
                      Initialize Environment
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </button>
                  </div>
                </div>
              ) : practiceTab === "notes" ? (
                <div className="flex-1 min-h-0 bg-background relative overflow-y-auto">
                  <RichTextNoteEditor
                    value={notesContent}
                    onChange={setNotesContent}
                    placeholder="Type here...(Markdown is enabled)"
                    autoFocus
                  />
                  <div className="absolute bottom-2 left-4 text-xs text-muted-foreground">
                    Saved
                  </div>
                </div>
              ) : (
                /* Monaco Editor */
                <div className="flex-1 min-h-0">
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
                      fontSize: 14,
                      fontFamily:
                        "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
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
                      suggest: { showKeywords: true, showSnippets: true },
                      quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: true,
                      },
                      quickSuggestionsDelay: 0,
                      suggestOnTriggerCharacters: true,
                      snippetSuggestions: "top",
                      tabSize: 4,
                      wordWrap: "on",
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      glyphMargin: true,
                    }}
                  />
                </div>
              )}
            </div>
          </ResizablePanel>

          {/* Resize Handle */}
          <ResizableHandle
            withHandle
            className="w-[3px] bg-border/20 data-[panel-group-direction=vertical]:h-[3px]"
          />

          {/* Right Panel: Input (top) + Output (bottom) */}
          <ResizablePanel
            ref={ioPanelRef}
            defaultSize={45}
            minSize={isMobile ? 25 : 24}
            collapsible={!isMobile}
            collapsedSize={isMobile ? 25 : 6}
            onCollapse={() => setIoCollapsed(true)}
            onExpand={() => setIoCollapsed(false)}
          >
            {ioCollapsed && !isMobile ? (
              <button
                type="button"
                onClick={expandIOPanel}
                title="Expand input and output"
                className="group h-full w-full flex flex-col items-center justify-between overflow-hidden border-l border-primary/40 bg-muted/70 px-1 py-4 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
              >
                <ChevronRight
                  size={14}
                  className="rotate-180 text-primary/80 transition-transform group-hover:-translate-x-0.5"
                />

                <div className="flex flex-1 flex-col items-center justify-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-sm">
                      <Keyboard size={15} />
                    </div>
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-black uppercase tracking-[0.18em]">
                      Input
                    </span>
                  </div>

                  <div className="h-px w-7 bg-border/60" />

                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-success/25 bg-success/10 text-success shadow-sm">
                      <Terminal size={15} />
                    </div>
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-black uppercase tracking-[0.18em]">
                      Console
                    </span>
                  </div>
                </div>

                <span className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground/70">
                  I/O
                </span>
              </button>
            ) : (
              <ResizablePanelGroup
                direction="vertical"
                className="h-full"
                autoSaveId="playground-stdin-console-layout"
              >
                {/* Input Panel - always visible */}
                <ResizablePanel defaultSize={32} minSize={12}>
                  <div className="flex flex-col h-full bg-background">
                    <div
                      className={PANEL_HEADER_CLASSES}
                      style={PANEL_BORDER_STYLE}
                    >
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                        <Keyboard size={14} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                        Standard Input (stdin)
                      </span>
                    </div>
                    <textarea
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                      placeholder="Enter input for your program..."
                      className="flex-1 w-full px-6 py-4 font-mono text-sm resize-none outline-none bg-transparent placeholder:text-muted-foreground/50 text-foreground selection:bg-primary/20"
                    />
                  </div>
                </ResizablePanel>

                <ResizableHandle
                  withHandle
                  className="data-[panel-group-direction=vertical]:h-[3px] bg-border/20"
                />

                {/* Output Panel */}
                <ResizablePanel defaultSize={68} minSize={18}>
                  <div className="flex flex-col h-full bg-background">
                    <div
                      className={PANEL_HEADER_CLASSES}
                      style={PANEL_BORDER_STYLE}
                    >
                      <div className="w-7 h-7 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success shadow-sm">
                        <Terminal size={14} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                        Virtual Console
                      </span>
                      {isRunning && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest animate-pulse">
                          <Loader2 size={10} className="animate-spin" />
                          Executing
                        </div>
                      )}
                      {output && !isRunning && (
                        <button
                          onClick={() => setOutput("")}
                          className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border/30 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300"
                        >
                          <RotateCcw size={10} />
                          Flush
                        </button>
                      )}
                    </div>
                    <div className="flex-1 min-h-0 overflow-auto bg-zinc-950">
                      <pre
                        className="p-6 font-mono text-[13px] leading-relaxed whitespace-pre-wrap h-full selection:bg-primary/20"
                        style={{
                          color:
                            output.includes("Error") || output.includes("âš ")
                              ? "hsl(var(--destructive))"
                              : output.includes("[DEBUG")
                                ? "hsl(var(--warning))"
                                : "hsl(var(--success))",
                        }}
                      >
                        {output || (
                          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70 select-none pt-12">
                            <div className="w-16 h-16 rounded-[24px] border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                              <Play
                                size={24}
                                className="text-muted-foreground/40 translate-x-0.5"
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[11px] font-black uppercase tracking-widest">
                                Awaiting Command
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                                Press Ctrl+Enter to initialize
                              </p>
                            </div>
                          </div>
                        )}
                      </pre>
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Create / Edit Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent
          className="sm:max-w-md"
          style={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="text-base font-bold"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {editingBuiltinPrefix
                ? "Edit Built-in Template"
                : editingTemplate
                  ? "Edit Template"
                  : "Save as Template"}
            </DialogTitle>
            <DialogDescription
              className="text-xs"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {editingBuiltinPrefix
                ? "Update this built-in template's description. Current editor code will be saved as your custom version."
                : editingTemplate
                  ? "Update template name, description, and code (current editor code will be saved)."
                  : "Save your current editor code as a reusable template."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <label
                className="text-[11px] font-medium mb-1 block"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Template Name {editingBuiltinPrefix ? "" : "*"}
              </label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. My Graph Template"
                className="text-sm"
                disabled={!!editingBuiltinPrefix}
              />
            </div>
            <div>
              <label
                className="text-[11px] font-medium mb-1 block"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Description (optional)
              </label>
              <Textarea
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="e.g. BFS/DFS with adjacency list"
                className="text-sm min-h-[60px]"
                rows={2}
              />
            </div>
            <div
              className="text-[10px] px-2 py-1.5 rounded"
              style={{
                background: "hsl(var(--muted))",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              ðŸ’¡ The current editor code will be saved with this template.
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTemplateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveTemplate}
              disabled={!editingBuiltinPrefix && !templateName.trim()}
            >
              <Save size={13} className="mr-1" />
              {editingTemplate || editingBuiltinPrefix ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GuruBot debug-coach panel */}
      <GuruBot
        open={guruBotOpen}
        onClose={() => setGuruBotOpen(false)}
        debugMode={true}
        initialContext={guruBotContext}
      />
    </div>
  );
}
