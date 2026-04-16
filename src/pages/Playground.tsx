import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import {
  Play, Loader2, Copy, Check, Terminal,
  Code2, RotateCcw, Sun, Moon, Palette,
  AlignLeft, ChevronDown, ChevronRight, Keyboard, Settings, Maximize, Minimize,
  FileCode, Plus, Pencil, Trash2, Save, X,
  BookOpen, ArrowLeft, Download, Bug,
} from "lucide-react";
import Editor, { OnMount } from "@monaco-editor/react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ALL_SNIPPETS, PRIORITY_LABELS } from "@/data/javaSnippets";
import { STATIC_COMPLETIONS_MAP, INSTANCE_COMPLETIONS_MAP, ALL_INSTANCE_METHODS, JAVA_KEYWORDS, JAVA_TYPES } from "@/data/javaAutoComplete";
import { CP_TEMPLATES } from "@/data/cpTemplates";
import { useCPTemplates } from "@/hooks/useCPTemplates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  } catch { return []; }
};

const saveUserTemplates = (templates: UserTemplate[]) => {
  localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(templates));
};

const loadBuiltinOverrides = (): Record<string, { code: string; description: string }> => {
  try {
    const raw = localStorage.getItem(BUILTIN_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveBuiltinOverrides = (overrides: Record<string, { code: string; description: string }>) => {
  localStorage.setItem(BUILTIN_OVERRIDES_KEY, JSON.stringify(overrides));
};
const FALLBACK_JAVA_COMPILERS = [
  { label: "Java 17", compiler: "openjdk-jdk-17.0.1+12" },
  { label: "Java 15", compiler: "openjdk-jdk-15+36" },
];

const THEMES = [
  { id: "vs-dark", label: "Dark", icon: <Moon size={13} /> },
  { id: "light", label: "Light", icon: <Sun size={13} /> },
  { id: "solarized-dark", label: "Solarized Dark", icon: <Palette size={13} /> },
  { id: "hc-black", label: "High Contrast", icon: <Palette size={13} /> },
];

const DEFAULT_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;

const WANDBOX_API = "https://wandbox.org/api/compile.json";

const JAVA_AUTO_IMPORTS = [
  "import java.util.*;",
  "import java.util.stream.*;",
  "import java.io.*;",
  "import java.math.*;",
];

const addAutoImports = (source: string) => {
  const missingImports = JAVA_AUTO_IMPORTS.filter((statement) => !source.includes(statement));
  if (!missingImports.length) return source;

  const packageMatch = source.match(/^\s*package\s+[\w.]+\s*;\s*/);
  if (packageMatch?.[0]) {
    return `${packageMatch[0]}\n${missingImports.join("\n")}\n${source.slice(packageMatch[0].length)}`;
  }

  return `${missingImports.join("\n")}\n\n${source}`;
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
const ARRAY_1D_PATTERN = /^\w+\[\]$/;  // e.g., int[], String[]
const ARRAY_2D_PATTERN = /\[\]\[\]/;    // e.g., int[][], String[][]
const ARRAY_ANY_PATTERN = /\[\]/;       // any array

function instrumentCodeForDebug(source: string, breakpointLines: Set<number>): string {
  if (breakpointLines.size === 0) return source;

  const lines = source.split("\n");
  const result: string[] = [];

  // Track initialized variables with their scope depth
  // When brace depth drops below a variable's declared depth, it's out of scope
  const initializedVars: { name: string; line: number; isArray: boolean; is2dArray: boolean; scopeDepth: number }[] = [];

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
    
    // Process closing braces FIRST — remove out-of-scope variables
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

    // Track method parameters — detect any line that looks like a method signature with params
    // Matches: accessModifiers returnType methodName(Type param1, Type param2, ...) {
    if (openBraces > 0) {
      const methodSigMatch = trimmed.match(/\w+\s*\(([^)]+)\)\s*(?:throws\s+\w+(?:\s*,\s*\w+)*)?\s*\{/);
      if (methodSigMatch) {
        const paramStr = methodSigMatch[1];
        const params = paramStr.split(",");
        for (const param of params) {
          const p = param.trim();
          const paramMatch = p.match(/^(?:final\s+)?(\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)$/);
          if (paramMatch) {
            const typePart = paramMatch[1];
            const paramName = paramMatch[2];
            if (!initializedVars.some(v => v.name === paramName && v.scopeDepth === braceDepth)) {
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
      const forVarMatch = trimmed.match(/^for\s*\(\s*(?:final\s+)?(\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)\s*[=:]/);
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
          /^(?:final\s+)?(\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)\s*=/
        );
        if (initMatch) {
          const typePart = initMatch[1];
          const varName = initMatch[2];
          if (!["class", "interface", "enum", "return", "throw", "new", "import", "package", "public", "private", "protected", "static", "void"].includes(typePart)) {
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
        initializedVars.push({ name: varMatch[1], line: lineNum, isArray: false, is2dArray: false, scopeDepth: braceDepth });
      }

      // Match multiple declarations: int a = 1, b = 2;
      const multiDeclMatch = trimmed.match(/^(?:final\s+)?(\w+(?:<[^>]*>)?)\s+\w+\s*=\s*[^,]+(?:,\s*(\w+)\s*=\s*[^,;]+)+/);
      if (multiDeclMatch && !forVarMatch) {
        const afterType = trimmed.replace(/^(?:final\s+)?\w+(?:<[^>]*>)?\s+/, "");
        const parts = afterType.split(",");
        for (const part of parts) {
          const nameMatch = part.trim().match(/^(\w+)\s*=/);
          if (nameMatch && !initializedVars.some(v => v.name === nameMatch[1] && v.line === lineNum)) {
            initializedVars.push({ name: nameMatch[1], line: lineNum, isArray: false, is2dArray: false, scopeDepth: braceDepth });
          }
        }
      }
    }

    // Only inject debug prints if we were ALREADY inside a method body BEFORE this line
    // prevDepth >= 2 means we were inside method body before any braces on this line
    // This prevents injecting prints on method signature lines or class-level lines
    const canInject = prevDepth >= 2 && 
      !trimmed.startsWith("//") && !trimmed.startsWith("/*") && !trimmed.startsWith("*") && 
      trimmed.length > 0 && trimmed !== "{" && trimmed !== "}";

    if (breakpointLines.has(lineNum) && canInject) {
      const indent = line.match(/^(\s*)/)?.[1] || "";
      
      // Only include variables initialized BEFORE this line AND still in scope
      // Filter out main's "args" parameter as it's never useful for debugging
      const availableVars = initializedVars
        .filter(v => v.line < lineNum && v.name !== "args")
        .slice(-8);
      
      let debugExpr: string;
      if (availableVars.length > 0) {
        const parts = availableVars.map(v => {
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const practiceId = searchParams.get("practice");
  const { templates: dbTemplates } = useCPTemplates();

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
    return DEFAULT_CODE;
  });
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(THEMES[0]);
  const [availableCompilers, setAvailableCompilers] = useState(FALLBACK_JAVA_COMPILERS);
  const [selectedCompiler, setSelectedCompiler] = useState(FALLBACK_JAVA_COMPILERS[0]);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stdin, setStdin] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>(loadUserTemplates);
  const [builtinOverrides, setBuiltinOverrides] = useState<Record<string, { code: string; description: string }>>(loadBuiltinOverrides);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<UserTemplate | null>(null);
  const [editingBuiltinPrefix, setEditingBuiltinPrefix] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [practiceTab, setPracticeTab] = useState<"problem" | "editor">("editor");
  
  // Debugger state
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [isDebugMode, setIsDebugMode] = useState(false);
  
  // Settings sub-section toggles
  const [settingsCompilerOpen, setSettingsCompilerOpen] = useState(false);
  const [settingsThemeOpen, setSettingsThemeOpen] = useState(false);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<any[]>([]);
  const dbTemplatesRef = useRef(dbTemplates);
  dbTemplatesRef.current = dbTemplates;

  useEffect(() => {
    // Fetch actual available Java compilers from Wandbox
    fetch("https://wandbox.org/api/list.json")
      .then((res) => res.json())
      .then((list: any[]) => {
        const javaCompilers = list
          .filter((c: any) => c.language === "Java")
          .map((c: any) => {
            const name = c.name as string;
            const versionMatch = name.match(/(\d+)[\+\.\-]/);
            const major = versionMatch ? versionMatch[1] : "";
            const label = major ? `JDK ${major}` : name;
            return { label, compiler: name };
          });
        if (javaCompilers.length > 0) {
          setAvailableCompilers(javaCompilers);
          setSelectedCompiler(javaCompilers[0]);
        } else {
          setAvailableCompilers(FALLBACK_JAVA_COMPILERS);
          setSelectedCompiler(FALLBACK_JAVA_COMPILERS[0]);
        }
      })
      .catch(() => {
        setAvailableCompilers(FALLBACK_JAVA_COMPILERS);
        setSelectedCompiler(FALLBACK_JAVA_COMPILERS[0]);
      });
  }, []);

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

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [breakpoints]);

  useEffect(() => {
    updateBreakpointDecorations();
  }, [breakpoints, updateBreakpointDecorations]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.defineTheme("solarized-dark", SOLARIZED_DARK_THEME);

    // Add breakpoint click handler on gutter (line number margin)
    editor.onMouseDown((e: any) => {
      if (e.target?.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS ||
          e.target?.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
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
              kind: m.kind === "field" ? monaco.languages.CompletionItemKind.Field : monaco.languages.CompletionItemKind.Method,
              insertText: m.insertText,
              insertTextRules: m.insertText.includes("$") ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
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
              kind: m.kind === "field" ? monaco.languages.CompletionItemKind.Field : monaco.languages.CompletionItemKind.Method,
              insertText: m.insertText,
              insertTextRules: m.insertText.includes("$") ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
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
            new RegExp(`for\\s*\\([^)]*?(\\w+(?:<[^>]*>)?)\\s+${varName}\\s*[;:]`),
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
                  kind: m.kind === "field" ? monaco.languages.CompletionItemKind.Field : monaco.languages.CompletionItemKind.Method,
                  insertText: m.insertText,
                  insertTextRules: m.insertText.includes("$") ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
                  detail: m.detail,
                  documentation: m.documentation,
                  sortText: `0_${m.label}`,
                  range,
                });
              }
            }
          }

          if (suggestions.length === 0 && className[0] === className[0].toLowerCase()) {
            for (const m of ALL_INSTANCE_METHODS) {
              suggestions.push({
                label: m.label,
                kind: m.kind === "field" ? monaco.languages.CompletionItemKind.Field : monaco.languages.CompletionItemKind.Method,
                insertText: m.insertText,
                insertTextRules: m.insertText.includes("$") ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
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
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
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

    // 3. CP Templates from database — prefix-triggered snippets
    const FULL_TEMPLATE_PREFIXES = new Set([
      "template", "cpfull", "codeforces", "codeforces-contest",
      "codechef", "codechef-contest", "leetcode", "leetcode-contest", "interview",
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
            detail: `⚡ ${t.name}`,
            documentation: t.description,
            filterText: `${t.prefix} ${t.name}`,
            sortText: `0_${t.prefix}`,
            range: isFullTemplate
              ? { startLineNumber: 1, endLineNumber: model.getLineCount(), startColumn: 1, endColumn: model.getLineMaxColumn(model.getLineCount()) }
              : range,
          });
        }
        return { suggestions };
      },
    });

    // 4. User-defined symbol autocomplete (IntelliSense) — parses current code for variables, methods, classes
    const JAVA_RESERVED = new Set([
      "abstract","assert","boolean","break","byte","case","catch","char","class","const",
      "continue","default","do","double","else","enum","extends","final","finally","float",
      "for","goto","if","implements","import","instanceof","int","interface","long","native",
      "new","package","private","protected","public","return","short","static","strictfp",
      "super","switch","synchronized","this","throw","throws","transient","try","void",
      "volatile","while","var","record","sealed","permits","yield","true","false","null",
      "String","System","Math","Integer","Long","Double","Boolean","Character","Object",
      "Arrays","Collections","List","Map","Set","HashMap","ArrayList","LinkedList","TreeMap",
      "HashSet","TreeSet","Queue","Stack","Deque","PriorityQueue","Scanner","StringBuilder",
      "BufferedReader","InputStreamReader","PrintWriter","main","args","out","in","err",
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
          if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;

          // Classes: class Foo / interface Bar
          const classMatch = trimmed.match(/(?:class|interface|enum)\s+(\w+)/);
          if (classMatch && !JAVA_RESERVED.has(classMatch[1])) {
            symbolMap.set(classMatch[1], { kind: "class", line: i + 1 });
          }

          // Methods: returnType methodName(
          const methodMatch = trimmed.match(/(?:(?:public|private|protected|static|final|abstract|synchronized)\s+)*(?:\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)\s*\(/);
          if (methodMatch && !JAVA_RESERVED.has(methodMatch[1]) && methodMatch[1] !== "if" && methodMatch[1] !== "for" && methodMatch[1] !== "while" && methodMatch[1] !== "switch" && methodMatch[1] !== "catch") {
            symbolMap.set(methodMatch[1], { kind: "method", line: i + 1 });
          }

          // Variables: Type varName = or Type varName; or Type varName,
          const varMatches = trimmed.matchAll(/(?:(?:final)\s+)?(\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)\s*[=;,)]/g);
          for (const m of varMatches) {
            const typePart = m[1];
            const varName = m[2];
            if (!JAVA_RESERVED.has(varName) && !JAVA_RESERVED.has(typePart) &&
                !["class","interface","enum","return","throw","new","import","package"].includes(typePart)) {
              if (!symbolMap.has(varName) || symbolMap.get(varName)!.kind !== "method") {
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
          const forMatch = trimmed.match(/for\s*\(\s*(?:final\s+)?(?:\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)\s*[=:]/);
          if (forMatch && !JAVA_RESERVED.has(forMatch[1])) {
            symbolMap.set(forMatch[1], { kind: "variable", line: i + 1 });
          }

          // Method parameters
          const paramSigMatch = trimmed.match(/\w+\s*\(([^)]+)\)\s*(?:throws\s+\w+(?:\s*,\s*\w+)*)?\s*\{?/);
          if (paramSigMatch) {
            const params = paramSigMatch[1].split(",");
            for (const p of params) {
              const pm = p.trim().match(/(?:final\s+)?(?:\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)$/);
              if (pm && !JAVA_RESERVED.has(pm[1])) {
                if (!symbolMap.has(pm[1])) {
                  symbolMap.set(pm[1], { kind: "parameter", line: i + 1 });
                }
              }
            }
          }

          // Constants: static final TYPE NAME =
          const constMatch = trimmed.match(/static\s+final\s+\w+(?:<[^>]*>)?\s+(\w+)\s*=/);
          if (constMatch && !JAVA_RESERVED.has(constMatch[1])) {
            symbolMap.set(constMatch[1], { kind: "constant", line: i + 1 });
          }
        }

        const suggestions: any[] = [];
        for (const [name, info] of symbolMap) {
          let kind = monaco.languages.CompletionItemKind.Variable;
          let icon = "variable";
          if (info.kind === "method") { kind = monaco.languages.CompletionItemKind.Method; icon = "method"; }
          else if (info.kind === "class") { kind = monaco.languages.CompletionItemKind.Class; icon = "class"; }
          else if (info.kind === "constant") { kind = monaco.languages.CompletionItemKind.Constant; icon = "constant"; }
          else if (info.kind === "parameter") { kind = monaco.languages.CompletionItemKind.Variable; icon = "param"; }

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

  const formatCode = useCallback(() => {
    const raw = code;
    if (!raw.trim()) return;

    const lines = raw.split('\n');
    const formatted: string[] = [];
    let indent = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) { formatted.push(''); continue; }

      const closers = (trimmed.match(/^[}\])]/g) || []).length;
      if (closers > 0 && indent > 0) indent--;

      formatted.push('    '.repeat(Math.max(indent, 0)) + trimmed);

      const opens = (trimmed.match(/[{(\[]/g) || []).length;
      const closes = (trimmed.match(/[}\])]/g) || []).length;
      indent += opens - closes;
      if (closers > 0) indent += closers;
      indent = Math.max(indent, 0);
    }

    setCode(formatted.join('\n'));
  }, [code]);

  const resetCode = useCallback(() => {
    setCode(DEFAULT_CODE);
    setOutput("");
    setStdin("");
    setBreakpoints(new Set());
    setIsDebugMode(false);
  }, []);

  const runCode = useCallback(async (debugRun = false) => {
    setIsRunning(true);
    setOutput("");
    try {
      let sourceCode = code;
      
      // If debug mode, instrument the code with print statements at breakpoints
      if (debugRun && breakpoints.size > 0) {
        sourceCode = instrumentCodeForDebug(sourceCode, breakpoints);
        setOutput("🔍 Debug mode: Instrumented " + breakpoints.size + " breakpoint(s)...\n\n");
      }

      const processedCode = addAutoImports(sourceCode).replace(/public\s+class\s+/g, "class ");
      const res = await fetch(WANDBOX_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: processedCode,
          compiler: selectedCompiler.compiler,
          stdin,
          "compiler-option-raw": "",
          "runtime-option-raw": "",
          save: false,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setOutput((prev) => prev + `⚠ Compile service error (${res.status}): ${errorText || "Unknown error"}`);
        return;
      }

      const data = await res.json();
      const parts: string[] = [];

      if (data.compiler_error) {
        parts.push(`⚠ Compilation Error:\n${data.compiler_error}`);
      }
      if (data.compiler_message && !data.compiler_error) {
        parts.push(`Compiler: ${data.compiler_message}`);
      }
      if (data.program_output) {
        parts.push(data.program_output);
      }
      if (data.program_error) {
        parts.push(`\n⚠ Runtime Error:\n${data.program_error}`);
      }

      const result = parts.join("\n") || "✓ Program executed successfully (no output)";
      if (debugRun && breakpoints.size > 0) {
        setOutput((prev) => prev + result);
      } else {
        setOutput(result);
      }
    } catch (err) {
      setOutput((prev) => prev + `⚠ Could not connect to compiler.\n${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsRunning(false);
    }
  }, [code, stdin, selectedCompiler, breakpoints]);

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

  const openEditBuiltinTemplate = (tmpl: typeof CP_TEMPLATES[0]) => {
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
          ? { ...t, name: templateName.trim(), description: templateDesc.trim(), code }
          : t
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
      className="flex items-center gap-1.5 rounded-lg font-bold transition-all disabled:opacity-50"
      style={{
        background: "hsl(142 71% 45%)",
        color: "#fff",
        padding: compact ? "4px 12px" : "6px 14px",
        fontSize: "12px",
      }}
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
      className="flex items-center gap-1.5 rounded-lg font-bold transition-all disabled:opacity-50"
      style={{
        background: breakpoints.size > 0 ? "hsl(25 95% 53%)" : "hsl(var(--muted))",
        color: breakpoints.size > 0 ? "#fff" : "hsl(var(--muted-foreground))",
        padding: compact ? "4px 10px" : "6px 12px",
        fontSize: "11px",
      }}
      title={breakpoints.size > 0 ? `Debug with ${breakpoints.size} breakpoint(s)` : "Click line numbers to set breakpoints"}
    >
      <Bug size={13} />
      Debug{breakpoints.size > 0 ? ` (${breakpoints.size})` : ""}
    </button>
  );

  // Settings dropdown content (reusable)
  const SettingsDropdownContent = () => (
    <div
      className="absolute right-0 top-full mt-1 w-64 rounded-xl overflow-hidden z-50 shadow-xl"
      style={{ backgroundColor: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", border: "1px solid hsl(var(--border))" }}
    >
      {/* Compiler Section — Collapsible */}
      <button
        onClick={() => setSettingsCompilerOpen(!settingsCompilerOpen)}
        className="w-full flex items-center gap-2 px-3 pt-3 pb-2 text-left"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
          ☕ Compiler
        </span>
        <span className="text-[9px] font-mono ml-1 px-1.5 py-0.5 rounded" style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}>
          {selectedCompiler.label}
        </span>
        {settingsCompilerOpen ? <ChevronDown size={11} className="ml-auto" style={{ color: "hsl(var(--muted-foreground))" }} /> : <ChevronRight size={11} className="ml-auto" style={{ color: "hsl(var(--muted-foreground))" }} />}
      </button>
      {settingsCompilerOpen && (
        <div className="pb-1">
          {availableCompilers.map((c) => (
            <button
              key={c.compiler}
              onClick={() => { setSelectedCompiler(c); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-colors hover:bg-muted"
              style={{
                color: selectedCompiler.compiler === c.compiler ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                fontWeight: selectedCompiler.compiler === c.compiler ? 600 : 400,
                paddingLeft: "24px",
              }}
            >
              {c.label}
              {selectedCompiler.compiler === c.compiler && <Check size={11} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}

      <div className="mx-3 my-0.5 border-t" style={{ borderColor: "hsl(var(--border))" }} />

      {/* Editor Theme Section — Collapsible */}
      <button
        onClick={() => setSettingsThemeOpen(!settingsThemeOpen)}
        className="w-full flex items-center gap-2 px-3 pt-2 pb-2 text-left"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
          🎨 Editor Theme
        </span>
        <span className="text-[9px] font-mono ml-1 px-1.5 py-0.5 rounded" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
          {currentTheme.label}
        </span>
        {settingsThemeOpen ? <ChevronDown size={11} className="ml-auto" style={{ color: "hsl(var(--muted-foreground))" }} /> : <ChevronRight size={11} className="ml-auto" style={{ color: "hsl(var(--muted-foreground))" }} />}
      </button>
      {settingsThemeOpen && (
        <div className="pb-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => { setCurrentTheme(t); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-colors hover:bg-muted"
              style={{
                color: currentTheme.id === t.id ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                fontWeight: currentTheme.id === t.id ? 600 : 400,
                paddingLeft: "24px",
              }}
            >
              {t.icon} {t.label}
              {currentTheme.id === t.id && <Check size={11} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}

      <div className="mx-3 my-0.5 border-t" style={{ borderColor: "hsl(var(--border))" }} />

      {/* Actions — flat */}
      <div className="px-3 pt-2 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
          Actions
        </span>
      </div>
      <button
        onClick={() => { copyCode(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] transition-colors hover:bg-muted"
        style={{ color: "hsl(var(--foreground))" }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "Copied!" : "Copy Code"}
      </button>
      <button
        onClick={() => { downloadCode(); setShowSettingsMenu(false); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] transition-colors hover:bg-muted"
        style={{ color: "hsl(var(--foreground))" }}
      >
        <Download size={13} />
        Download .java
      </button>
      <button
        onClick={() => { resetCode(); setShowSettingsMenu(false); }}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[11px] transition-colors hover:bg-muted"
        style={{ color: "hsl(var(--foreground))" }}
      >
        <RotateCcw size={13} />
        Reset to Default
      </button>
    </div>
  );

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-[calc(100vh-3.5rem)]'} flex flex-col`} style={{ background: "hsl(var(--background))" }}>
      {/* Breakpoint & debug CSS */}
      <style>{`
        .breakpoint-decoration {
          background: hsl(0 72% 51%) !important;
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          margin-left: 4px !important;
          margin-top: 6px !important;
          cursor: pointer !important;
        }
        .breakpoint-line-highlight {
          background: hsla(0, 72%, 51%, 0.08) !important;
        }
        .monaco-editor .margin {
          cursor: pointer !important;
        }
      `}</style>

      {/* Header */}
      {!isFullscreen && (
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0 gap-2 flex-wrap"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}
          >
            <Code2 size={16} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
              {practiceData ? `Practice: ${practiceData.title}` : "Java Playground"}
            </h1>
            <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
              {practiceData ? practiceData.difficulty || "Practice Mode" : "Write · Compile · Run"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Templates */}
          <div className="relative">
            <button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-muted"
              style={{ color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}
            >
              <FileCode size={13} />
              Templates
              <ChevronDown size={11} />
            </button>
            {showTemplateMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTemplateMenu(false)} />
                <div
                  className="absolute left-0 top-full mt-1 w-80 rounded-xl overflow-hidden z-50 shadow-xl max-h-[70vh] overflow-y-auto"
                  style={{ backgroundColor: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", border: "1px solid hsl(var(--border))" }}
                >
                  <div className="px-3 pt-3 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                      CP Templates by Aritra Dutta
                    </span>
                  </div>
                  {CP_TEMPLATES.map((tmpl) => {
                    const override = builtinOverrides[tmpl.prefix];
                    const isOverridden = !!override;
                    return (
                      <div key={tmpl.prefix} className="group flex items-center hover:bg-muted transition-colors">
                        <button
                          onClick={() => {
                            setCode(override?.code ?? tmpl.code);
                            setOutput("");
                            setShowTemplateMenu(false);
                          }}
                          className="flex-1 flex flex-col gap-0.5 px-3 py-2 text-left"
                        >
                          <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "hsl(var(--foreground))" }}>
                            {tmpl.name}
                            {isOverridden && (
                              <span className="text-[8px] px-1 py-0.5 rounded font-medium" style={{ background: "hsl(var(--primary)/0.15)", color: "hsl(var(--primary))" }}>
                                edited
                              </span>
                            )}
                          </span>
                          <span className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {override?.description ?? tmpl.description}
                          </span>
                        </button>
                        <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditBuiltinTemplate(tmpl); }}
                            className="p-1 rounded hover:bg-accent/50 transition-colors"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                            title="Edit template (saves current editor code)"
                          >
                            <Pencil size={11} />
                          </button>
                          {isOverridden && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleResetBuiltinTemplate(tmpl.prefix); }}
                              className="p-1 rounded hover:bg-accent/50 transition-colors"
                              style={{ color: "hsl(var(--muted-foreground))" }}
                              title="Reset to original"
                            >
                              <RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {userTemplates.length > 0 && (
                    <>
                      <div className="mx-3 my-1 border-t" style={{ borderColor: "hsl(var(--border))" }} />
                      <div className="px-3 pt-2 pb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                          My Templates
                        </span>
                      </div>
                      {userTemplates.map((tmpl) => (
                        <div key={tmpl.id} className="group flex items-center hover:bg-muted transition-colors">
                          <button
                            onClick={() => {
                              setCode(tmpl.code);
                              setOutput("");
                              setShowTemplateMenu(false);
                            }}
                            className="flex-1 flex flex-col gap-0.5 px-3 py-2 text-left"
                          >
                            <span className="text-[11px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                              {tmpl.name}
                            </span>
                            {tmpl.description && (
                              <span className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                                {tmpl.description}
                              </span>
                            )}
                          </button>
                          <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditTemplate(tmpl); }}
                              className="p-1 rounded hover:bg-accent/50 transition-colors"
                              style={{ color: "hsl(var(--muted-foreground))" }}
                              title="Edit template"
                            >
                              <Pencil size={11} />
                            </button>
                            {deleteConfirmId === tmpl.id ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(tmpl.id); }}
                                className="p-1 rounded text-[9px] font-bold"
                                style={{ color: "hsl(var(--destructive))" }}
                                title="Confirm delete"
                              >
                                <Check size={11} />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(tmpl.id); }}
                                className="p-1 rounded hover:bg-accent/50 transition-colors"
                                style={{ color: "hsl(var(--muted-foreground))" }}
                                title="Delete template"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  <div className="mx-3 my-1 border-t" style={{ borderColor: "hsl(var(--border))" }} />
                  <button
                    onClick={openCreateTemplate}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[11px] font-medium transition-colors hover:bg-muted"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    <Plus size={13} />
                    Save Current Code as Template
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Format */}
          <button
            onClick={formatCode}
            title="Format Code"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-muted"
            style={{ color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}
          >
            <AlignLeft size={13} />
            Format
          </button>

          {/* Debug */}
          <DebugButton />

          {/* Run — LeetCode style */}
          <RunButton />

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(true)}
            title="Fullscreen Mode"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-muted"
            style={{ color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}
          >
            <Maximize size={13} />
          </button>

          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => { setShowSettingsMenu(!showSettingsMenu); setSettingsCompilerOpen(false); setSettingsThemeOpen(false); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-muted"
              style={{ color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}
            >
              <Settings size={13} />
              <ChevronDown size={11} />
            </button>
            {showSettingsMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSettingsMenu(false)} />
                <SettingsDropdownContent />
              </>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Fullscreen toggle bar */}
      {isFullscreen && (
        <div className="flex items-center justify-between px-4 py-1.5 border-b flex-shrink-0" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted)/0.3)" }}>
          <span className="text-xs font-mono font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
            ☕ Java Playground — Fullscreen
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={formatCode}
              title="Format Code"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all hover:bg-muted"
              style={{ color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}
            >
              <AlignLeft size={13} />
              Format
            </button>
            <DebugButton compact />
            <RunButton compact />
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all hover:bg-muted"
              style={{ color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}
            >
              <Minimize size={13} />
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Editor + Output with resizable panels */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Code Editor Panel */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <div className="flex flex-col h-full">
              {/* Tab bar */}
              <div className="flex items-center gap-0 px-2 py-1 border-b" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted)/0.3)" }}>
                {practiceData && (
                  <button
                    onClick={() => setPracticeTab("problem")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all mr-1"
                    style={{
                      background: practiceTab === "problem" ? "hsl(var(--card))" : "transparent",
                      color: practiceTab === "problem" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      boxShadow: practiceTab === "problem" ? "var(--shadow-card)" : "none",
                    }}
                  >
                    <BookOpen size={12} />
                    Problem
                  </button>
                )}
                <button
                  onClick={() => setPracticeTab("editor")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                  style={{
                    background: (!practiceData || practiceTab === "editor") ? "hsl(var(--card))" : "transparent",
                    color: (!practiceData || practiceTab === "editor") ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                    boxShadow: (!practiceData || practiceTab === "editor") ? "var(--shadow-card)" : "none",
                  }}
                >
                  <Code2 size={12} />
                  Editor
                </button>
                <span className="text-[9px] font-mono ml-auto px-2 py-0.5 rounded" style={{ background: "hsl(var(--success)/0.1)", color: "hsl(var(--success))" }}>
                  {selectedCompiler.label}
                </span>
                {breakpoints.size > 0 && (
                  <span className="text-[9px] font-mono ml-1 px-2 py-0.5 rounded" style={{ background: "hsla(0, 72%, 51%, 0.1)", color: "hsl(0 72% 51%)" }}>
                    {breakpoints.size} BP
                  </span>
                )}
                {practiceData && (
                  <button
                    onClick={() => navigate("/playground")}
                    title="Exit practice mode"
                    className="ml-1.5 p-1 rounded hover:bg-muted transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Problem panel */}
              {practiceData && practiceTab === "problem" ? (
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6" style={{ background: "hsl(var(--card))" }}>
                  <div className="max-w-2xl">
                    {/* Problem header */}
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
                        {practiceData.title}
                      </h2>
                      {practiceData.difficulty && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                          style={{
                            background: practiceData.difficulty === "Easy" ? "hsl(var(--success)/0.1)" : practiceData.difficulty === "Medium" ? "hsl(var(--warning)/0.1)" : "hsl(var(--accent)/0.1)",
                            color: practiceData.difficulty === "Easy" ? "hsl(var(--success))" : practiceData.difficulty === "Medium" ? "hsl(var(--warning))" : "hsl(var(--accent))",
                          }}
                        >
                          {practiceData.difficulty}
                        </span>
                      )}
                    </div>

                    {/* Complexity */}
                    {(practiceData.timeComplexity || practiceData.spaceComplexity) && (
                      <div className="flex gap-2.5 mb-6">
                        {practiceData.timeComplexity && (
                          <span className="text-xs font-mono px-3 py-1.5 rounded-lg" style={{ background: "hsl(var(--primary)/0.06)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.12)" }}>
                            Time: {practiceData.timeComplexity}
                          </span>
                        )}
                        {practiceData.spaceComplexity && (
                          <span className="text-xs font-mono px-3 py-1.5 rounded-lg" style={{ background: "hsl(var(--accent)/0.06)", color: "hsl(var(--accent))", border: "1px solid hsl(var(--accent)/0.12)" }}>
                            Space: {practiceData.spaceComplexity}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Theory */}
                    <div className="rounded-xl p-5 mb-6" style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))" }}>
                      <ul className="space-y-3">
                        {practiceData.theory?.map((para: string, i: number) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-[8px] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--primary)/0.6)" }} />
                            <span className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground)/0.8)" }}>
                              {para.replace(/\*\*/g, "")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Key Points */}
                    {practiceData.keyPoints && practiceData.keyPoints.length > 0 && (
                      <div className="rounded-xl p-5 mb-6" style={{ background: "hsl(var(--primary)/0.04)", border: "1px solid hsl(var(--primary)/0.1)" }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-3 font-mono" style={{ color: "hsl(var(--primary))" }}>
                          ★ Key Points
                        </div>
                        <ul className="space-y-2">
                          {practiceData.keyPoints.map((point: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "hsl(var(--foreground)/0.85)" }}>
                              <span className="mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--primary))" }} />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Start coding CTA */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPracticeTab("editor")}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: "var(--gradient-primary)",
                        color: "hsl(var(--primary-foreground))",
                        boxShadow: "0 4px 20px hsl(var(--primary)/0.3)",
                      }}
                    >
                      <Code2 size={15} />
                      Start Coding →
                    </motion.button>
                  </div>
                </div>
              ) : (
                /* Monaco Editor */
                <div className="flex-1 min-h-0">
                  <Editor
                    height="100%"
                    language="java"
                    theme={currentTheme.id}
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    onMount={handleEditorMount}
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
                      suggest: { showKeywords: true, showSnippets: true },
                      quickSuggestions: { other: true, comments: false, strings: true },
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
          <ResizableHandle withHandle />

          {/* Right Panel: Input (top) + Output (bottom) */}
          <ResizablePanel defaultSize={45} minSize={20}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Input Panel - always visible */}
              <ResizablePanel defaultSize={30} minSize={15}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 px-3 py-1.5 border-b" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted)/0.3)" }}>
                    <Keyboard size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                    <span className="text-xs font-mono font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Standard Input (stdin)</span>
                  </div>
                  <textarea
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder="Enter input for your program..."
                    className="flex-1 w-full px-4 py-2.5 font-mono text-base resize-none outline-none"
                    style={{ background: "hsl(var(--card))", color: "hsl(var(--foreground))", caretColor: "hsl(var(--primary))" }}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Output Panel */}
              <ResizablePanel defaultSize={70} minSize={20}>
                <div className="flex flex-col h-full">
                  <div
                    className="flex items-center gap-2 px-4 py-1.5 border-b"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted)/0.3)" }}
                  >
                    <Terminal size={12} style={{ color: "hsl(var(--success))" }} />
                    <span className="text-[10px] font-mono font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Output
                    </span>
                    {isRunning && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                        style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}
                      >
                        compiling...
                      </motion.span>
                    )}
                    {output && !isRunning && (
                      <button
                        onClick={() => setOutput("")}
                        className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded hover:bg-muted"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-h-0 overflow-auto">
                    <pre
                      className="p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap h-full"
                      style={{
                        background: "hsl(var(--card))",
                        color: output.includes("Error") || output.includes("⚠")
                          ? "hsl(var(--accent))"
                          : output.includes("[DEBUG")
                          ? "hsl(25 95% 53%)"
                          : "hsl(var(--success))",
                      }}
                    >
                      {output || (
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>
                          Click <strong>Run</strong> or press <kbd className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>Ctrl+Enter</kbd> to compile & run...
                          {"\n\n"}
                          <span style={{ color: "hsl(var(--muted-foreground)/0.6)" }}>
                            💡 Click line numbers to set breakpoints, then use <strong>Debug</strong> to trace variable values.
                          </span>
                        </span>
                      )}
                    </pre>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Create / Edit Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-md" style={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>
              {editingBuiltinPrefix ? "Edit Built-in Template" : editingTemplate ? "Edit Template" : "Save as Template"}
            </DialogTitle>
            <DialogDescription className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              {editingBuiltinPrefix
                ? "Update this built-in template's description. Current editor code will be saved as your custom version."
                : editingTemplate
                ? "Update template name, description, and code (current editor code will be saved)."
                : "Save your current editor code as a reusable template."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <label className="text-[11px] font-medium mb-1 block" style={{ color: "hsl(var(--muted-foreground))" }}>
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
              <label className="text-[11px] font-medium mb-1 block" style={{ color: "hsl(var(--muted-foreground))" }}>
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
            <div className="text-[10px] px-2 py-1.5 rounded" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
              💡 The current editor code will be saved with this template.
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveTemplate} disabled={!editingBuiltinPrefix && !templateName.trim()}>
              <Save size={13} className="mr-1" />
              {editingTemplate || editingBuiltinPrefix ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
