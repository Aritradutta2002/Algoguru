import { useState, useRef, useEffect, lazy, Suspense } from "react";
import {
  ChevronDown,
  Loader2,
  MoreVertical,
  Play,
  Plus,
  RotateCcw,
  Send,
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
import { cn } from "@/lib/utils";

/**
 * Java code editor pane: file tab bar with its overflow menu, the
 * language / run / submit toolbar, the editor itself and the "Guide Me" prompt.
 *
 * Monaco is loaded lazily so it stays out of the contest landing and MCQ quiz
 * bundles — the existing `editor` chunk is already split in `vite.config.ts`,
 * and `React.lazy` keeps it from loading until an exam workspace mounts.
 */
const LazyLeetCodeEditor = lazy(() =>
  import("@/components/editor/LeetCodeEditor").then((module) => ({
    default: module.LeetCodeEditor,
  })),
);

function EditorSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full w-full items-center justify-center bg-background"
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
}) {
  const [wrapLines, setWrapLines] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

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

  return (
    <section
      aria-label={`Code editor for ${problem.title}`}
      className="flex h-full min-h-0 flex-col bg-background"
    >
      {/* File tab bar */}
      <div className="flex h-9 shrink-0 items-center border-b border-border/60 px-2">
        <span
          title="This question has a single file"
          className="flex h-full items-center gap-1.5 border-b-2 border-primary px-3"
        >
          <span className="text-xs font-medium text-primary">Tab-1</span>
          <X aria-hidden="true" className="h-3 w-3 text-muted-foreground" />
        </span>
        <button
          type="button"
          disabled
          title="Each question has a single file"
          aria-label="New file, unavailable: each question has a single file"
          className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-50"
        >
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        </button>

        <div ref={optionsRef} className="relative ml-auto">
          <button
            type="button"
            onClick={() => setOptionsOpen((current) => !current)}
            aria-expanded={optionsOpen}
            aria-haspopup="menu"
            aria-label="Editor options"
            title="Editor options"
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              optionsOpen
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <MoreVertical aria-hidden="true" className="h-4 w-4" />
          </button>

          {optionsOpen ? (
            <div
              role="menu"
              aria-label="Editor options"
              className="absolute right-0 top-[calc(100%+6px)] z-50 w-48 rounded-lg border border-border/70 bg-card p-1 shadow-2xl"
            >
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={wrapLines}
                onClick={() => setWrapLines((current) => !current)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-muted"
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
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                <RotateCcw aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                Reset code
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Language, run and submit */}
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 px-2">
        <button
          type="button"
          disabled
          title="Java is the only language in this contest"
          aria-label="Language: Java, the only option in this contest"
          className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-foreground opacity-90"
        >
          Java
          <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            onClick={onRun}
            disabled={actionsDisabled || busy}
            aria-label="Run code"
            title="Run code against the visible sample tests"
            className="h-8 w-8 rounded-lg border border-border/60 bg-card"
          >
            {busy && busyMode === "run" ? (
              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play aria-hidden="true" className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            disabled={actionsDisabled || busy}
            aria-label="Submit problem"
            className="h-8 gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500"
          >
            {busy && busyMode === "submit" ? (
              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send aria-hidden="true" className="h-3.5 w-3.5" />
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
        <div className="shrink-0 border-b border-border/60 bg-muted/30 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
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
      <div className="relative min-h-0 flex-1" tabIndex={-1}>
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

        <button
          type="button"
          onClick={() => setGuideOpen((current) => !current)}
          aria-expanded={guideOpen}
          className="absolute bottom-4 right-4 rounded-full bg-muted px-4 py-2 text-xs font-medium text-muted-foreground shadow-md transition-colors hover:bg-muted/80 hover:text-foreground"
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
            : "Drafts save automatically as you type."}
      </p>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="rounded-2xl border border-border bg-card/95 backdrop-blur-md sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Reset this question&apos;s code?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Your current solution for this question will be replaced with the
              starter code. Other questions are not affected. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep my code</AlertDialogCancel>
            <AlertDialogAction onClick={onReset} className="rounded-xl">
              Reset code
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
