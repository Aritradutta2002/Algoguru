// ProblemSolver — LeetCode Daily Challenge page.
//
// Two-pane resizable layout (problem details on the left, Monaco Java editor
// on the right). Fetches the daily challenge via `useDailyChallenge`, which
// hits the `leetcode-daily` Supabase edge function.
//
// All editor state is autosaved to localStorage keyed by `questionId` so the
// user does not lose work on reload or accidental navigation.

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ExternalLink,
  Hash,
  Loader2,
  RefreshCw,
  Tag,
  Trophy,
} from "lucide-react";

import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { useSettings } from "@/contexts/SettingsContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailyChallengeResponse } from "@/types/leetcode";

/* ------------------------------------------------------------------ */
/* Difficulty badge styling                                            */
/* ------------------------------------------------------------------ */

function difficultyClasses(difficulty: string): string {
  switch (difficulty) {
    case "Easy":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "Medium":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "Hard":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

/* ------------------------------------------------------------------ */
/* Java starter template                                               */
/* ------------------------------------------------------------------ */

const JAVA_TEMPLATE = `class Solution {
    public /* returnType */ /* methodName */(/* params */) {
        // TODO: implement
    }
}
`;

/* ------------------------------------------------------------------ */
/* Editor storage helpers                                              */
/* ------------------------------------------------------------------ */

function storageKey(questionId: string): string {
  return `problem_solver_java_code_${questionId}`;
}

function loadSavedCode(questionId: string): string | null {
  try {
    return localStorage.getItem(storageKey(questionId));
  } catch {
    return null;
  }
}

function saveCode(questionId: string, code: string): void {
  try {
    localStorage.setItem(storageKey(questionId), code);
  } catch {
    // localStorage may be unavailable (private mode, quota); fail silently.
  }
}

/* ------------------------------------------------------------------ */
/* Editor component                                                    */
/* ------------------------------------------------------------------ */

function CodeEditor({
  questionId,
  theme,
}: {
  questionId: string;
  theme: "dark" | "light";
}) {
  const [code, setCode] = useState<string>(() => {
    return loadSavedCode(questionId) ?? JAVA_TEMPLATE;
  });

  // Reset code when the underlying problem changes (new day).
  useEffect(() => {
    setCode(loadSavedCode(questionId) ?? JAVA_TEMPLATE);
  }, [questionId]);

  const handleChange = (value: string | undefined) => {
    const next = value ?? "";
    setCode(next);
    saveCode(questionId, next);
  };

  const handleMount: OnMount = (_editor, monaco) => {
    // No custom completion providers here — the problem page is intentionally
    // lightweight. Java keyword/bracket defaults are sufficient.
    void monaco;
  };

  return (
    <Editor
      height="100%"
      language="java"
      theme={theme === "light" ? "light" : "vs-dark"}
      value={code}
      onChange={handleChange}
      onMount={handleMount}
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
        tabSize: 4,
        insertSpaces: true,
        detectIndentation: false,
        wordWrap: "on",
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        suggest: { showKeywords: true, showSnippets: true },
        quickSuggestions: { other: true, comments: false, strings: true },
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton (loading)                                                  */
/* ------------------------------------------------------------------ */

function ProblemSkeleton() {
  return (
    <div className="flex h-full w-full">
      <div className="w-2/5 border-r border-border/50 p-8 space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-12" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-4 w-9/12" />
        <Skeleton className="h-4 w-8/12" />
      </div>
      <div className="flex-1 p-4">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Error state                                                         */
/* ------------------------------------------------------------------ */

function ErrorState({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Alert variant="destructive" className="max-w-xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Couldn't load today's challenge</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            {error.message ||
              "Something went wrong fetching the LeetCode daily challenge."}
          </p>
          <p className="mb-4 text-xs opacity-80">
            The backend service may be temporarily unavailable. You can still
            open today's problem on LeetCode directly.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={onRetry} variant="outline">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
            </Button>
            <Button size="sm" asChild variant="secondary">
              <a
                href="https://leetcode.com/problemset/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open LeetCode
              </a>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state (defensive — upstream returned no problem)              */
/* ------------------------------------------------------------------ */

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Alert className="max-w-xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No challenge available</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            LeetCode hasn't published a daily challenge yet, or the upstream
            service returned an unexpected empty payload.
          </p>
          <Button size="sm" onClick={onRetry} variant="outline">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function PageHeader({
  data,
}: {
  data: DailyChallengeResponse;
}) {
  const { problem, date, stale } = data;
  const formattedDate = useMemo(() => {
    try {
      return format(parseISO(date), "EEEE, MMMM d, yyyy");
    } catch {
      return date;
    }
  }, [date]);

  return (
    <div className="flex flex-col gap-3 border-b border-border/50 bg-background/60 px-6 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge
              className={difficultyClasses(problem.difficulty)}
              variant="outline"
            >
              {problem.difficulty}
            </Badge>
            {problem.acRate !== undefined && (
              <Badge variant="secondary" className="font-mono text-[10px]">
                <Trophy className="mr-1 h-3 w-3" />
                {problem.acRate.toFixed(1)}% accepted
              </Badge>
            )}
            {stale && (
              <Badge variant="outline" className="text-[10px] text-amber-600">
                Cached (upstream unavailable)
              </Badge>
            )}
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">
            {problem.title}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formattedDate}
        </span>
        <Button asChild size="sm" variant="outline">
          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> LeetCode
          </a>
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Problem details pane                                                */
/* ------------------------------------------------------------------ */

function ProblemDetails({ data }: { data: DailyChallengeResponse }) {
  const { problem, date } = data;
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Tags */}
      {problem.topicTags.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Tag className="h-3.5 w-3.5" /> Topics
          </div>
          <div className="flex flex-wrap gap-1.5">
            {problem.topicTags.map((t) => (
              <Badge key={t.name} variant="secondary" className="text-xs">
                {t.name}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Date (mobile-only; the header shows it on desktop) */}
      <section className="sm:hidden">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{date}</span>
        </div>
      </section>

      {/* Problem body — HTML from the trusted upstream wrapper. */}
      <section
        className="prose prose-sm dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
          prose-p:leading-relaxed prose-p:my-3
          prose-pre:bg-muted prose-pre:p-3 prose-pre:rounded-md prose-pre:overflow-x-auto
          prose-code:before:content-none prose-code:after:content-none
          prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-strong:text-foreground
          prose-ul:my-3 prose-ol:my-3
          prose-li:my-1"
      >
        <div dangerouslySetInnerHTML={{ __html: problem.content }} />
      </section>

      {/* Hints */}
      {problem.hints && problem.hints.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Hash className="h-3.5 w-3.5" /> Hints
          </div>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
            {problem.hints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProblemSolver() {
  const { theme } = useSettings();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useDailyChallenge();

  // Defensive: treat a payload with no `questionId` as "empty".
  const isEmpty = !!data && !data.problem?.questionId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-full min-h-0"
    >
      {/* Top bar: back button + page title */}
      <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link to="/" aria-label="Back to home">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              LeetCode
            </div>
            <h2 className="text-sm sm:text-base font-bold truncate">
              Daily Challenge
            </h2>
          </div>
        </div>
        {isFetching && !isLoading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Refreshing
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <ProblemSkeleton />
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
          <div className="flex flex-col h-full min-h-0">
            <PageHeader data={data} />
            <div className="flex-1 min-h-0">
              <PanelGroup
                direction="horizontal"
                autoSaveId="problem-solver-split"
                className="h-full"
              >
                <Panel
                  defaultSize={45}
                  minSize={25}
                  className="bg-background"
                >
                  <ProblemDetails data={data} />
                </Panel>
                <PanelResizeHandle className="w-1.5 bg-border/50 hover:bg-primary/40 transition-colors data-[resize-handle-state=drag]:bg-primary/60" />
                <Panel
                  defaultSize={55}
                  minSize={30}
                  className="bg-card"
                >
                  <CodeEditor
                    questionId={data.problem.questionId}
                    theme={theme}
                  />
                </Panel>
              </PanelGroup>
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
