import { memo, useCallback } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { buildMonacoEditorOptions, type ExtraEditorOptions } from "@/lib/playground/editorPrefs";

// Shared LeetCode dark theme — identical to ProblemSolver.tsx:134
export const LEETCODE_DARK_THEME = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "", foreground: "D4D0C8", background: "1B1A18" },
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
    { token: "annotation", foreground: "DCDCAA" },
    { token: "number", foreground: "B5CEA8" },
    { token: "string", foreground: "CE9178" },
    { token: "operator", foreground: "D4D4D4" },
    { token: "delimiter", foreground: "D4D4D4" },
    { token: "delimiter.bracket", foreground: "D4D4D4" },
    { token: "delimiter.parenthesis", foreground: "D4D4D4" },
  ],
  colors: {
    "editor.background": "#1B1A18",
    "editor.foreground": "#D4D0C8",
    "editorLineNumber.foreground": "#7D7A72",
    "editorLineNumber.activeForeground": "#C9C5BC",
    "editorGutter.background": "#1B1A18",
    "editor.lineHighlightBackground": "#26251F",
    "editor.lineHighlightBorder": "#00000000",
    "editor.selectionBackground": "#4A4436AA",
    "editor.inactiveSelectionBackground": "#3A3833AA",
    "editorCursor.foreground": "#C9C5BC",
    "editorIndentGuide.background": "#3B3934",
    "editorIndentGuide.activeBackground": "#6B675E",
    "editorBracketMatch.background": "#5C564755",
    "editorBracketMatch.border": "#8A8578",
    "scrollbar.shadow": "#00000000",
    "scrollbarSlider.background": "#79766E66",
    "scrollbarSlider.hoverBackground": "#64615AB3",
    "scrollbarSlider.activeBackground": "#BFBBB166",
    "editorWidget.background": "#232220",
    "editorSuggestWidget.background": "#232220",
    "editorSuggestWidget.foreground": "#D4D0C8",
    "editorSuggestWidget.selectedBackground": "#33312C",
  },
} as const;

interface LeetCodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: string;
  themeId: string; // "leetcode-dark" | "light" | etc - will be mapped to leetcode-dark/light
  fontSize: number;
  tabSize: number;
  readOnly?: boolean;
  relativeLineNumbers?: boolean;
  extraOptions?: ExtraEditorOptions;
  onMount?: OnMount;
}

function LeetCodeEditorInner({
  value,
  onChange,
  language,
  themeId,
  fontSize,
  tabSize,
  readOnly = false,
  relativeLineNumbers = false,
  extraOptions,
  onMount,
}: LeetCodeEditorProps) {
  const handleBeforeMount = useCallback((monaco: any) => {
    try {
      monaco.editor.defineTheme("leetcode-dark", LEETCODE_DARK_THEME as any);
    } catch {}
  }, []);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      try {
        monaco.editor.defineTheme("leetcode-dark", LEETCODE_DARK_THEME as any);
        // setTheme is handled by parent via themeId prop, but ensure defined
      } catch {}
      if (onMount) onMount(editor, monaco);
    },
    [onMount]
  );

  // Use shared buildMonacoEditorOptions for exact ProblemSolver parity, but allow playground extras
  const monacoOptions = buildMonacoEditorOptions({
    fontSize,
    tabSize,
    relativeLineNumbers: !!relativeLineNumbers,
    extras: extraOptions ?? { minimap: false, wordWrap: true, cursorSmooth: false, bracketPairColorization: true, formatOnType: false },
    readOnly: !!readOnly,
  });

  // Map language c++ -> cpp for Monaco
  const monacoLang = language === "c++" ? "cpp" : language;

  return (
    <Editor
      height="100%"
      language={monacoLang}
      theme={themeId}
      value={value}
      onChange={onChange}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      options={monacoOptions}
    />
  );
}

export const LeetCodeEditor = memo(LeetCodeEditorInner);
LeetCodeEditor.displayName = "LeetCodeEditor";
