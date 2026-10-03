import { lazy, Suspense } from "react";
import { Code2, FileCode, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      className="flex h-full w-full items-center justify-center bg-muted/20"
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
      className="flex h-full min-h-0 flex-col bg-background"
    >
      {/* Editor Tab Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border/80 bg-muted/20 px-3.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {/* File Tab */}
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-1 shadow-2xs">
            <FileCode aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
            <p className="truncate text-xs font-semibold text-foreground">Solution.java</p>
            <Badge variant="outline" className="hidden sm:inline-flex px-1.5 py-0 text-[10px] text-muted-foreground border-border/60">
              Java 17
            </Badge>
          </div>

          <p className="hidden md:block truncate font-mono text-[11px] text-muted-foreground max-w-xs">
            {problem.functionSignature}
          </p>
        </div>

        {/* Reset button & Dialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={readOnly}
              className="h-7 gap-1.5 rounded-lg border-border/70 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-border"
            >
              <RotateCcw aria-hidden="true" className="h-3 w-3" />
              <span>Reset code</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl border border-border bg-card/95 backdrop-blur-md sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">Reset this problem&apos;s code?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Your current solution for this problem will be replaced with the
                starter code. Other problems are not affected. This cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Keep my code</AlertDialogCancel>
              <AlertDialogAction onClick={onReset} className="rounded-xl">Reset code</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Editor Body */}
      <div
        className="min-h-0 flex-1 focus-within:ring-1 focus-within:ring-inset focus-within:ring-primary/40"
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

      {/* Editor Status Footer */}
      <div className="flex items-center justify-between border-t border-border/70 bg-muted/15 px-3.5 py-1.5 text-xs text-muted-foreground">
        <p>
          {readOnly
            ? "The editor is read-only while the exam is locked."
            : localDraftsOnly
              ? "Drafts are saved in this browser only for this development session."
              : "Drafts save automatically as you type."}
        </p>
        <span className="hidden sm:inline font-mono text-[11px] text-muted-foreground/80">
          Java Solution Class
        </span>
      </div>
    </section>
  );
}
