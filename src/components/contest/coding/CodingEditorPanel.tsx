import { useState, useRef, useEffect, lazy, Suspense } from "react";
import type { OnMount } from "@monaco-editor/react";
import {
  ChevronDown,
  Loader2,
  Maximize2,
  Minimize2,
  MoreVertical,
  Play,
  Plus,
  Rocket,
  RotateCcw,
  WandSparkles,
  WrapText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CompilerDiagnostic } from "@/lib/playground/compilerDiagnostics";
import type { PublicCodingProblem } from "@/lib/contest/types";
import { formatJava } from "@/lib/contest/javaFormat";
import { cn } from "@/lib/utils";

/**
 * Java code editor pane: file tab bar, the language / format / fullscreen /
 * run / submit toolbar, the editor itself and the floating editor controls.
 *
 * Monaco is loaded lazily so it stays out of the contest landing and MCQ quiz
 * bundles — the existing `editor` chunk is already split in `vite.config.ts`,
 * and `React.lazy` keeps it from loading until an exam workspace mounts.
 */

type MonacoApi = Parameters<OnMount>[1];

/** One editor tab. The first tab of a question holds the graded solution. */
export interface EditorTabDescriptor {
  id: string;
  label: string;
  /** Scratch buffers live in this browser and are never part of a submission. */
  scratch: boolean;
}

const LazyLeetCodeEditor = lazy(() =>
  import("@/components/editor/LeetCodeEditor").then((module) => ({
    default: module.LeetCodeEditor,
  })),
);

let javaFormatterRegistered = false;

/**
 * Hand the workspace's Java re-indenter to Monaco once, so the standard Format
 * Document command — Shift+Alt+F, the context menu, the command palette — runs
 * exactly the same rules as the Format button.
 */
function ensureJavaFormatter(monaco: MonacoApi): void {
  if (javaFormatterRegistered) return;
  javaFormatterRegistered = true;
  monaco.languages.registerDocumentFormattingEditProvider("java", {
    displayName: "AlgoGuru Java formatter",
    provideDocumentFormattingEdits(model) {
      return [
        { range: model.getFullModelRange(), text: formatJava(model.getValue()) },
      ];
    },
  });
}

function EditorSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full w-full items-center justify-center bg-surface-panel"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground">Loading code editor…</span>
      </div>
    </div>
  );
}

export function CodingEditorPanel({
  problem,
  value,
  onChange,
  readOnly,
  diagnostics,
  onReset,
  onRun,
  onSubmit,
  busy,
  busyMode,
  actionsDisabled,
  localDraftsOnly,
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onCloseTab,
  canAddTab,
  canFormat,
  fullscreen,
  onToggleFullscreen,
}: {
  problem: PublicCodingProblem;
  value: string;
  onChange: (next: string) => void;
  readOnly: boolean;
  diagnostics: CompilerDiagnostic[];
  onReset: () => void;
  onRun: () => void;
  onSubmit: () => void;
  busy: boolean;
  busyMode: "run" | "submit" | null;
  actionsDisabled: boolean;
  localDraftsOnly: boolean;
  tabs: EditorTabDescriptor[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onCloseTab: (tabId: string) => void;
  canAddTab: boolean;
  canFormat: boolean;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const [wrapLines, setWrapLines] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  useEffect(() => {
    if (!optionsOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && optionsRef.current?.contains(target)) return;
      setOptionsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [optionsOpen]);

  const handleFormat = () => {
    if (!canFormat) return;
    onChange(formatJava(value));
  };

  return (
    <section
      aria-label={`Code editor for ${problem.title}`}
      className="flex h-full min-h-0 flex-col bg-surface-panel"
    >
      {/* File tab bar — the active tab sits raised on the chrome strip. */}
      <div className="flex h-10 shrink-0 items-stretch border-b border-surface-line bg-surface-chrome">
        <div
          role="tablist"
          aria-label="Editor files"
          className="flex min-w-0 items-stretch overflow-x-auto"
        >
          {tabs.map((tab) => {
            const active = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                className={cn(
                  "group/tab flex h-10 shrink-0 items-center rounded-t-lg pl-4 pr-1.5",
                  active ? "bg-surface-panel" : "hover:bg-surface-raised/60",
                )}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectTab(tab.id)}
                  title={
                    tab.scratch
                      ? `${tab.label} — scratch tab, saved in this browser only and never submitted`
                      : `${tab.label} — your solution for this question`
                  }
                  className={cn(
                    "max-w-[9rem] truncate text-sm font-medium transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground group-hover/tab:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
                <button
                  type="button"
                  onClick={() => onCloseTab(tab.id)}
                  disabled={readOnly || !tab.scratch}
                  aria-label={
                    tab.scratch
                      ? `Close ${tab.label}`
                      : `${tab.label} holds the graded solution and cannot be closed`
                  }
                  title={
                    tab.scratch
                      ? `Close ${tab.label}`
                      : "This tab holds the solution that is submitted."
                  }
                  className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onAddTab}
          disabled={readOnly || !canAddTab}
          aria-label="Add a scratch tab"
          title={
            canAddTab
              ? "Add a scratch tab — a second buffer in this browser, never submitted"
              : "You have reached the scratch tab limit for this contest"
          }
          className="ml-1 flex h-8 shrink-0 items-center gap-1.5 self-center rounded-md px-2 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
        </button>

        <div ref={optionsRef} className="relative ml-auto shrink-0 self-stretch pr-3">
          <button
            type="button"
            onClick={() => setOptionsOpen((current) => !current)}
            aria-expanded={optionsOpen}
            aria-haspopup="menu"
            aria-label="Editor options"
            title="Editor options"
            className={cn(
              "mt-1 flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              optionsOpen
                ? "bg-surface-raised text-foreground"
                : "text-muted-foreground hover:bg-surface-raised hover:text-foreground",
            )}
          >
            <MoreVertical aria-hidden="true" className="h-4 w-4" />
          </button>

          {optionsOpen ? (
            <div
              role="menu"
              aria-label="Editor options"
              className="absolute right-3 top-[calc(100%+6px)] z-50 w-52 rounded-xl border border-surface-line bg-surface-chrome p-1 shadow-2xl"
            >
              <button
                type="button"
                role="menuitem"
                disabled={!canFormat}
                onClick={() => {
                  setOptionsOpen(false);
                  handleFormat();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-surface-raised disabled:opacity-40"
              >
                <WandSparkles aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                Format code
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  ⇧⌥F
                </span>
              </button>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={wrapLines}
                onClick={() => setWrapLines((current) => !current)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-surface-raised"
              >
                <WrapText aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                Soft wrap
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={readOnly}
                onClick={() => {
                  setOptionsOpen(false);
                  setResetOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-surface-raised disabled:opacity-40"
              >
                <RotateCcw aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                {activeTab?.scratch ? "Clear this tab" : "Reset code"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Language, run and submit */}
      <div className="flex h-[45px] shrink-0 items-center justify-between gap-2 border-b border-surface-line px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            disabled
            title="Java is the only language in this contest"
            aria-label="Language: Java, the only option in this contest"
            className="flex h-8 items-center gap-1.5 rounded-md px-1 text-sm font-medium text-foreground"
          >
            Java
            <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          </button>

          {activeTab?.scratch ? (
            <span
              title="Scratch tabs are saved in this browser only and are never submitted."
              className="truncate rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400"
            >
              Scratch — not submitted
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Button
            type="button"
            size="icon"
            onClick={onRun}
            disabled={actionsDisabled || busy}
            aria-label="Run code"
            title="Run code against the visible sample tests"
            className="h-9 w-9 rounded-lg border border-surface-line bg-surface-panel text-foreground hover:bg-surface-raised"
          >
            {busy && busyMode === "run" ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Play aria-hidden="true" className="h-4 w-4 fill-current" />
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            disabled={actionsDisabled || busy}
            aria-label="Submit problem"
            className="h-9 gap-2 rounded-lg bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/30 hover:bg-emerald-500/15 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {busy && busyMode === "submit" ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket aria-hidden="true" className="h-4 w-4" />
            )}
            <span>{busy && busyMode === "submit" ? "Submitting…" : "Submit"}</span>
          </Button>
          <span aria-live="polite" className="sr-only">
            {busy
              ? `${busyMode === "run" ? "Running" : "Submitting"} in progress`
              : "Idle"}
          </span>
        </div>
      </div>

      {/* Guide Me */}
      {guideOpen ? (
        <div className="shrink-0 border-b border-surface-line bg-surface-chrome px-4 py-2.5 text-xs leading-5 text-muted-foreground">
          <p className="text-foreground">
            Topic tags: {problem.topics.join(", ") || "none listed"}.
          </p>
          <p className="mt-1 font-mono text-primary">{problem.functionSignature}</p>
          <p className="mt-1">
            {problem.timeLimitMs} ms · {problem.memoryLimitMb} MB · grade on the
            visible sample tests first.
          </p>
        </div>
      ) : null}

      {/* Editor */}
      <div className="contest-editor-surface relative min-h-0 flex-1" tabIndex={-1}>
        <Suspense fallback={<EditorSkeleton />}>
          <LazyLeetCodeEditor
            language="java"
            themeId="leetcode-dark"
            value={value}
            onChange={(next: string | undefined) => onChange(next ?? "")}
            readOnly={readOnly}
            fontSize={15}
            lineHeight={24}
            tabSize={4}
            extraOptions={{
              minimap: false,
              wordWrap: wrapLines,
              cursorSmooth: false,
              bracketPairColorization: true,
              formatOnType: false,
            }}
            onMount={(_editor, monaco) => {
              ensureJavaFormatter(monaco);
              monaco.editor.setModelMarkers(
                monaco.editor.getModels()[0] ?? null,
                "java",
                diagnostics.map((diagnostic) => ({
                  startLineNumber: Math.max(1, diagnostic.line),
                  endLineNumber: Math.max(1, diagnostic.line),
                  startColumn: 1,
                  endColumn: 200,
                  message: diagnostic.message,
                  severity: monaco.MarkerSeverity.Error,
                })),
              );
            }}
          />
        </Suspense>

        {/* Floating editor controls: format and full screen. */}
        <div className="absolute bottom-5 left-5 flex items-center overflow-hidden rounded-full bg-surface-chrome shadow-lg">
          <button
            type="button"
            onClick={handleFormat}
            disabled={!canFormat}
            aria-label="Format code"
            title="Format code (Shift+Alt+F)"
            className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <WandSparkles aria-hidden="true" className="h-4 w-4" />
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-surface-line" />
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-pressed={fullscreen}
            aria-label="Editor full screen"
            title={
              fullscreen ? "Editor full screen — on (Esc to exit)" : "Editor full screen"
            }
            className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
          >
            {fullscreen ? (
              <Minimize2 aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Maximize2 aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setGuideOpen((current) => !current)}
          aria-expanded={guideOpen}
          className="absolute bottom-5 right-5 rounded-full bg-surface-chrome px-4 py-2 text-xs font-medium text-foreground/80 shadow-lg transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          Guide Me
        </button>
      </div>

      {/* Honest status line */}
      <p className="sr-only">
        {readOnly
          ? "The editor is read-only while the exam is locked."
          : localDraftsOnly
            ? "Drafts are saved in this browser only for this development session."
            : activeTab?.scratch
              ? "This scratch tab is saved in this browser only and is never submitted."
              : "Drafts save automatically as you type."}
      </p>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="rounded-2xl border border-surface-line bg-surface-chrome backdrop-blur-md sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {activeTab?.scratch ? "Clear this scratch tab?" : "Reset this question's code?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {activeTab?.scratch
                ? "Everything in this scratch tab will be removed. Your solution tab and the other questions are not affected."
                : "Your current solution for this question will be replaced with the starter code. Your scratch tabs and the other questions are not affected. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep my code</AlertDialogCancel>
            <AlertDialogAction onClick={onReset} className="rounded-xl">
              {activeTab?.scratch ? "Clear tab" : "Reset code"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
