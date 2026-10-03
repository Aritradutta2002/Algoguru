import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleSlash,
  Code2,
  Loader2,
  PlayCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { resolveContestSessionService } from "@/lib/contest/contestServices";
import { configuredSessionMode } from "@/lib/contest/sessionService";
import { CODING_FINALIZATION_LABELS } from "@/lib/contest/types";
import type { CodingContestResultData } from "@/lib/contest/types";
import { CodingDifficultyBadge } from "@/components/contest/coding/CodingProblemPanel";
import { ContestModeNotice } from "@/components/contest/ContestModeNotice";
import { formatExamTime } from "@/lib/formatTime";

/**
 * Coding contest result report.
 *
 * Renders aggregates and per-problem outcomes only. Hidden test inputs, hidden
 * expected outputs and reference solutions are never present in the payload
 * this page receives, so there is nothing here to leak — and no state to clear
 * either.
 */

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof CheckCircle2;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function CodingContestResult() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const mode = useMemo(() => configuredSessionMode(), []);
  const service = useMemo(
    () => resolveContestSessionService(mode, user?.id ?? "anonymous"),
    [mode, user?.id],
  );

  const [data, setData] = useState<CodingContestResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!sessionId) {
      setError("No contest session was specified.");
      return;
    }
    void (async () => {
      try {
        const result = await service.getResult(sessionId);
        if (!cancelled) setData(result);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "This result could not be loaded.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [service, sessionId]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <AlertTriangle aria-hidden="true" className="mx-auto h-8 w-8 text-destructive" />
        <h1 className="mt-4 font-display text-xl font-semibold">Result unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-6" onClick={() => navigate("/contest")}>
          Return to Contest
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-muted-foreground" />
        <p role="status" className="text-sm text-muted-foreground">
          Loading your result…
        </p>
      </div>
    );
  }

  const { session, results, problems, authoritative } = data;
  const processing = session.status === "processing";
  const solved = results.filter((result) => result.solved).length;
  const testsPassed = results.reduce((total, result) => total + result.passed, 0);
  const testsTotal = results.reduce((total, result) => total + result.total, 0);
  const timeUsedSeconds = session.submittedAt
    ? Math.max(
        0,
        Math.round((session.submittedAt - session.startedAt) / 1000),
      )
    : 0;
  const canStartAnother = session.status === "finalized";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/contest">
          <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
          Return to Contest
        </Link>
      </Button>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            <Code2 aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
            Java Coding Contest
          </Badge>
          <Badge variant="outline">
            {session.finalizationReason
              ? CODING_FINALIZATION_LABELS[session.finalizationReason]
              : session.status}
          </Badge>
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {processing ? "Evaluating your submission" : "Contest complete"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {session.finalizationReason
            ? CODING_FINALIZATION_LABELS[session.finalizationReason]
            : "Your contest is being finalized."}
          {session.submittedAt
            ? ` · Submitted ${new Date(session.submittedAt).toLocaleString()}`
            : ""}
        </p>
      </header>

      {!authoritative ? (
        <div className="mt-6">
          <ContestModeNotice />
        </div>
      ) : null}

      {processing ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-8 space-y-4"
        >
          <div className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
          <div className="h-40 w-full animate-pulse rounded-2xl bg-muted/60" />
          <span className="sr-only">
            Your submission is still being evaluated. This page will not update
            automatically.
          </span>
        </div>
      ) : (
        <>
          <section aria-label="Summary" className="mt-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Score" value={`${solved} / ${results.length}`} icon={CheckCircle2} />
              <StatCard label="Problems solved" value={`${solved}`} icon={Code2} />
              <StatCard
                label="Tests passed"
                value={testsTotal ? `${testsPassed} / ${testsTotal}` : "—"}
                icon={CheckCircle2}
              />
              <StatCard
                label="Time used"
                value={formatExamTime(timeUsedSeconds)}
                icon={PlayCircle}
              />
            </div>
          </section>

          <section aria-labelledby="coding-results" className="mt-8">
            <h2 id="coding-results" className="font-display text-lg font-semibold">
              Problems
            </h2>
            <ul className="mt-4 space-y-4">
              {problems.map((problem) => {
                const result = results.find(
                  (item) => item.problemId === problem.id,
                );
                return (
                  <li
                    key={problem.id}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {result?.solved ? (
                        <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                      ) : result?.submitted ? (
                        <XCircle aria-hidden="true" className="h-4 w-4 text-rose-600" />
                      ) : (
                        <CircleSlash aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h3 className="text-sm font-semibold">{problem.title}</h3>
                      <CodingDifficultyBadge difficulty={problem.difficulty} />
                      <span className="text-xs text-muted-foreground">
                        {result?.solved
                          ? "Solved"
                          : result?.submitted
                            ? "Submitted, not solved"
                            : "Not submitted"}
                      </span>
                    </div>

                    {result && result.total > 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {result.passed} of {result.total} tests passed
                      </p>
                    ) : null}

                    {result?.submittedCode ? (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-medium text-primary">
                          View submitted Java code
                        </summary>
                        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs">
                          {result.submittedCode}
                        </pre>
                      </details>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/contest">
            <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
            Return to Contest
          </Link>
        </Button>
        {canStartAnother ? (
          <Button asChild variant="outline">
            <Link to="/contest/coding">
              <PlayCircle aria-hidden="true" className="mr-2 h-4 w-4" />
              Start another contest
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default CodingContestResult;
