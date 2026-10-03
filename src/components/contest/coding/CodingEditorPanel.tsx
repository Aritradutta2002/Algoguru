import { lazy, Suspense } from "react";
import { RotateCcw } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { CompilerDiagnostic } from "@/lib/playground/compilerDiagnostics";
import type { PublicCodingProblem } from "@/lib/contest/types";

/**
 * Java code editor panel.
 *
 * Monaco is loaded lazily so it stays out of the contest landing and MCQ quiz
 * bundles — the existing `editor` chunk is already split in `vite.config.ts`,
 * and `React.lazy` keeps it from loading until an exam workspace mounts.
 */
// Monaco is a heavy dependency; loading it lazily keeps it out of the contest
// landing and MCQ quiz bundles. The `editor` chunk is already split in
// vite.config.ts, and `React.lazy` defers the load until an exam mounts.
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
      className="h-full w-full animate-pulse bg-muted/40"
    >
      <span className="sr-only">Loading code editor…</span>
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
  localDraftsOnly,
}: {
  problem: PublicCodingProblem;
  value: string;
  onChange: (next: string) => void;
  readOnly: boolean;
  diagnostics: CompilerDiagnostic[];
  onReset: () => void;
  localDraftsOnly: boolean;
}) {
  return (
    <section
      aria-label={`Code editor for ${problem.title}`}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">Solution.java</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {problem.functionSignature}
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={readOnly}>
              <RotateCcw aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
              Reset code
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset this problem&apos;s code?</AlertDialogTitle>
              <AlertDialogDescription>
                Your current solution for this problem will be replaced with the
                starter code. Other problems are not affected. This cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep my code</AlertDialogCancel>
              <AlertDialogAction onClick={onReset}>Reset code</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div
        className="min-h-0 flex-1 focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring"
        tabIndex={-1}
      >
        <Suspense fallback={<EditorSkeleton />}>
          <LazyLeetCodeEditor
            language="java"
            themeId="leetcode-dark"
            value={value}
            onChange={(next: string | undefined) => onChange(next ?? "")}
            readOnly={readOnly}
            fontSize={14}
            tabSize={4}
            extraOptions={{
              minimap: false,
              wordWrap: false,
              cursorSmooth: false,
              bracketPairColorization: true,
              formatOnType: false,
            }}
            onMount={(_editor, monaco) => {
              // Compile diagnostics are surfaced as Monaco markers so they line
              // up with the source instead of being a detached list.
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
      </div>

      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        {readOnly
          ? "The editor is read-only while the exam is locked."
          : localDraftsOnly
            ? "Drafts are saved in this browser only for this development session."
            : "Drafts save automatically as you type."}
      </p>
    </section>
  );
}
