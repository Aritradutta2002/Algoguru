export interface ExtraEditorOptions {
  minimap: boolean;
  wordWrap: boolean;
  cursorSmooth: boolean;
  bracketPairColorization: boolean;
  formatOnType: boolean;
}

export const DEFAULT_EXTRA_EDITOR_OPTIONS: ExtraEditorOptions = {
  minimap: true,
  wordWrap: true,
  cursorSmooth: false,
  bracketPairColorization: true,
  formatOnType: false,
};

const LOCAL_KEY = "algoguru.playground.editor_options";

export function parseExtraEditorOptions(value: unknown): ExtraEditorOptions {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_EXTRA_EDITOR_OPTIONS };
  }
  const raw = value as Record<string, unknown>;
  return {
    minimap: typeof raw.minimap === "boolean" ? raw.minimap : DEFAULT_EXTRA_EDITOR_OPTIONS.minimap,
    wordWrap:
      typeof raw.wordWrap === "boolean"
        ? raw.wordWrap
        : DEFAULT_EXTRA_EDITOR_OPTIONS.wordWrap,
    cursorSmooth:
      typeof raw.cursorSmooth === "boolean"
        ? raw.cursorSmooth
        : DEFAULT_EXTRA_EDITOR_OPTIONS.cursorSmooth,
    bracketPairColorization:
      typeof raw.bracketPairColorization === "boolean"
        ? raw.bracketPairColorization
        : DEFAULT_EXTRA_EDITOR_OPTIONS.bracketPairColorization,
    formatOnType:
      typeof raw.formatOnType === "boolean"
        ? raw.formatOnType
        : DEFAULT_EXTRA_EDITOR_OPTIONS.formatOnType,
  };
}

export function loadLocalEditorOptions(): ExtraEditorOptions {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { ...DEFAULT_EXTRA_EDITOR_OPTIONS };
    return parseExtraEditorOptions(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_EXTRA_EDITOR_OPTIONS };
  }
}

export function saveLocalEditorOptions(options: ExtraEditorOptions) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(options));
  } catch {
    /* ignore quota / private mode */
  }
}

export function buildMonacoEditorOptions({
  fontSize,
  tabSize,
  relativeLineNumbers,
  extras,
  readOnly,
}: {
  fontSize: number;
  tabSize: number;
  relativeLineNumbers: boolean;
  extras: ExtraEditorOptions;
  readOnly: boolean;
}) {
  return {
    fontSize,
    lineHeight: 19,
    fontFamily: '"Consolas","Cascadia Code","JetBrains Mono","Fira Code",Menlo,Monaco,"Courier New",monospace',
    fontLigatures: false,
    fontWeight: "400" as const,
    letterSpacing: 0,
    minimap: { enabled: extras.minimap, autohide: false, maxColumn: 120, renderCharacters: true, scale: 1 },
    scrollBeyondLastLine: false,
    padding: { top: 12, bottom: 12 },
    lineNumbers: relativeLineNumbers ? ("relative" as const) : ("on" as const),
    lineNumbersMinChars: 3,
    lineDecorationsWidth: 12,
    renderLineHighlight: "line" as const,
    renderLineHighlightOnlyWhenFocus: false,
    bracketPairColorization: { enabled: extras.bracketPairColorization },
    guides: { bracketPairs: false, indentation: false, highlightActiveIndentation: false },
    autoClosingBrackets: "always" as const,
    autoClosingQuotes: "always" as const,
    autoClosingOvertype: "always" as const,
    formatOnPaste: false,
    formatOnType: extras.formatOnType,
    mouseWheelZoom: true,
    folding: true,
    foldingHighlight: false,
    foldingStrategy: "auto" as const,
    showFoldingControls: "mouseover" as const,
    autoIndent: "full" as const,
    trimAutoWhitespace: true,
    stickyTabStops: true,
    matchBrackets: "always" as const,
    cursorSurroundingLines: 3,
    cursorSurroundingLinesStyle: "default" as const,
    cursorWidth: 2,
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showMethods: true,
      showFunctions: true,
      showFields: true,
      showVariables: true,
      showClasses: true,
      showWords: false,
      snippetsPreventQuickSuggestions: false,
      preview: true,
      showInlineDetails: true,
      filterGraceful: true,
      localityBonus: true,
    },
    inlineSuggest: { enabled: false },
    parameterHints: { enabled: true, cycle: true },
    hover: { enabled: true, delay: 280 },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
    quickSuggestionsDelay: 40,
    suggestOnTriggerCharacters: true,
    snippetSuggestions: "top" as const,
    tabSize,
    insertSpaces: true,
    detectIndentation: false,
    wordWrap: extras.wordWrap ? ("on" as const) : ("off" as const),
    smoothScrolling: false,
    cursorBlinking: extras.cursorSmooth ? ("smooth" as const) : ("blink" as const),
    cursorSmoothCaretAnimation: extras.cursorSmooth ? ("on" as const) : ("off" as const),
    glyphMargin: true,
    readOnly,
    renderWhitespace: "none" as const,
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    overviewRulerLanes: 0,
    roundedSelection: false,
    definitionLinkOpensInPeek: false,
    occurrencesHighlight: "off" as const,
    selectionHighlight: false,
    codeLens: false,
    links: false,
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
      useShadows: false,
    },
  };
}
