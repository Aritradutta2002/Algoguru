import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Code2,
  Eye,
  Keyboard,
  MonitorPlay,
  Server,
  ShieldAlert,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ContestModeNotice } from "@/components/contest/ContestModeNotice";
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
import { useAuth } from "@/contexts/AuthContext";
import {
  CODING_CONTEST_CONFIG,
  CODING_CONTEST_DURATION_LABEL,
} from "@/lib/contest/config";
import { resolveContestSessionService } from "@/lib/contest/contestServices";
import {
  configuredSessionMode,
  isBackendUnavailable,
  isContestServiceError,
  type ContestSessionMode,
} from "@/lib/contest/sessionService";
import { MAX_EXAM_WARNINGS } from "@/lib/examConstants";
import { PUBLIC_JAVA_PROBLEMS } from "@/lib/codingContest/javaProblemBank";
import { cn } from "@/lib/utils";

/**
 * Java coding contest instructions.
 *
 * Nothing is created until the learner ticks the acknowledgement box AND
 * confirms the final dialog, so an accidental visit never burns a contest or
 * starts a clock.
 */

const PROBLEM_COUNT = PUBLIC_JAVA_PROBLEMS.filter((p) => p.isPublished).length;

interface Rule {
  icon: typeof Clock3;
  title: string;
  detail: string;
}

const RULES: Rule[] = [
  {
    icon: Code2,
    title: "Java only",
    detail:
      "This contest runs on Java. The editor starts from a Solution class and you fill in the requested method.",
  },
  {
    icon: Clock3,
    title: `${CODING_CONTEST_DURATION_LABEL} time limit`,
    detail:
      "You have exactly 30 minutes from the moment fullscreen is entered. The timer does not pause, not even while you are locked out.",
  },
  {
    icon: CheckCircle2,
    title: `${CODING_CONTEST_CONFIG.minProblems} or ${CODING_CONTEST_CONFIG.maxProblems} interview problems`,
    detail: `Your ${CODING_CONTEST_CONFIG.minProblems}–${CODING_CONTEST_CONFIG.maxProblems} problems are assigned at random from ${PROBLEM_COUNT} published problems, and you may move between them freely.`,
  },
  {
    icon: Eye,
    title: "Visible samples and hidden tests",
    detail:
      "Each problem shows sample inputs and their expected output. Final evaluation uses a separate set of hidden tests that never leaves the server.",
  },
  {
    icon: Timer,
    title: "Automatic submission at zero",
    detail:
      "When the countdown reaches zero the contest submits your latest saved code and closes. You cannot keep working past the deadline.",
  },
  {
    icon: Code2,
    title: "Code is saved per problem",
    detail:
      "Switching problems never loses your work. Each problem keeps its own draft, restored when you come back or refresh the page.",
  },
  {
    icon: MonitorPlay,
    title: "Fullscreen is required",
    detail:
      "The contest starts only after the browser is genuinely in fullscreen. Exiting fullscreen locks the workspace until you return.",
  },
  {
    icon: ShieldAlert,
    title: "Focus and tab-switch policy",
    detail: `Leaving fullscreen, switching tabs or blurring the window each count as a warning. The exam locks, your code is preserved, and the timer keeps running. After ${MAX_EXAM_WARNINGS} warnings the contest is submitted automatically.`,
  },
  {
    icon: Server,
    title: "Compilation and execution limits",
    detail:
      "Code is compiled and run on a server-side sandbox with a CPU, memory and wall-clock limit. Network access and filesystem writes are blocked. Requests that exceed the limit are marked as timed out.",
  },
  {
    icon: CheckCircle2,
    title: "Scoring",
    detail:
      "A problem counts as solved only when every hidden test passes. You score one point per solved problem, whether you submitted it or let the deadline submit your draft.",
  },
  {
    icon: AlertTriangle,
    title: "Final submission is final",
    detail:
      "Finishing the contest cannot be undone. You can still submit individual problems while time remains, but the overall result is fixed once the contest closes.",
  },
];

export function CodingContestInstructions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<ContestSessionMode>(configuredSessionMode);
  const [probing, setProbing] = useState(mode === "remote");
  const [unavailableReason, setUnavailableReason] = useState<string | null>(
    mode === "remote" ? null : null,
  );
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Probe the authoritative session service on mount so the learner finds out
   * before they commit, not after they confirm.
   *
   * When it is unreachable we do NOT block the exam. We fall back to the local
   * adapter and say so loudly and permanently (see `ContestModeNotice`), because
   * a dead-end error page is a worse outcome than an honestly labelled
   * practice run. Nothing is ever scored either way — the local adapter runs no
   * hidden tests.
   */
  const probe = useCallback(async () => {
    setProbing(true);
    setError(null);
    try {
      const service = resolveContestSessionService(
        "remote",
        user?.id ?? "anonymous",
      );
      // A deliberately impossible id. If the function is deployed it answers
      // with 404 (it ran the ownership check), which still PROVES reachability.
      // Anything else — network failure, function missing, 5xx — means the
      // authoritative backend is not usable.
      await service.getSession("00000000-0000-0000-0000-000000000000");
      setMode("remote");
      setUnavailableReason(null);
    } catch (caught) {
      const answered =
        isContestServiceError(caught) &&
        (caught.code === "not_found" || caught.code === "unauthorized");
      if (answered) {
        setMode("remote");
        setUnavailableReason(null);
        return;
      }
      setMode("local");
      setUnavailableReason(
        "The contest session service is not reachable from this browser.",
      );
    } finally {
      setProbing(false);
    }
  }, [user?.id]);

  // Probe once per identity. A ref guards it so re-renders (and the state
  // changes `probe` itself causes) cannot retrigger a probe loop.
  const probedFor = useRef<string | null>(null);
  useEffect(() => {
    const key = user?.id ?? "anonymous";
    if (probedFor.current === key) return;
    probedFor.current = key;
    void probe();
  }, [probe, user?.id]);

  const startContest = async () => {
    setCreating(true);
    setError(null);
    // The probe may still be in flight when the learner confirms, so do not
    // trust the resolved `mode` alone: try it, and on an unreachable backend
    // immediately retry locally instead of dead-ending.
    const attempt = async (candidate: ContestSessionMode) => {
      const service = resolveContestSessionService(
        candidate,
        user?.id ?? "anonymous",
      );
      return service.createSession();
    };

    try {
      let bundle;
      try {
        bundle = await attempt(mode);
      } catch (caught) {
        if (!isBackendUnavailable(caught) || mode === "local") throw caught;
        setMode("local");
        setUnavailableReason(
          "The contest session service could not create your session.",
        );
        bundle = await attempt("local");
      }
      setConfirmOpen(false);
      navigate(`/contest/coding/session/${bundle.session.id}`);
    } catch (caught) {
      setConfirmOpen(false);
      setError(
        caught instanceof Error
          ? caught.message
          : "The contest could not be started. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground">
          <Link to="/contest">
            <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
            Return to Contest
          </Link>
        </Button>

        {/* Hero Banner */}
        <header className="relative mt-5 overflow-hidden rounded-3xl border border-border/80 bg-card/60 p-6 backdrop-blur-xl sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full opacity-10 blur-3xl"
            style={{ background: "hsl(var(--primary))" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full opacity-10 blur-3xl"
            style={{ background: "hsl(var(--primary))" }}
          />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="secondary" className="px-3 py-1 font-medium bg-primary/10 text-primary border border-primary/20">
                <Code2 aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                Java
              </Badge>
              <Badge variant="outline" className="px-3 py-1 font-normal text-muted-foreground border-border/60">
                <Clock3 aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                {CODING_CONTEST_DURATION_LABEL}
              </Badge>
              <Badge variant="outline" className="px-3 py-1 font-normal text-muted-foreground border-border/60">
                <CheckCircle2 aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                {CODING_CONTEST_CONFIG.minProblems}–{CODING_CONTEST_CONFIG.maxProblems} Problems
              </Badge>
            </div>

            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              Java Coding Contest
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Read these rules before you begin. Once you start, the clock is
              running and the rules apply for the full {CODING_CONTEST_DURATION_LABEL}.
            </p>

            {/* Quick Spec Pills */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-center sm:text-left">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="mt-1 font-mono text-base font-semibold">{CODING_CONTEST_DURATION_LABEL}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-center sm:text-left">
                <p className="text-xs text-muted-foreground">Problems</p>
                <p className="mt-1 font-mono text-base font-semibold">{CODING_CONTEST_CONFIG.minProblems}–{CODING_CONTEST_CONFIG.maxProblems} Assigned</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-center sm:text-left">
                <p className="text-xs text-muted-foreground">Environment</p>
                <p className="mt-1 font-mono text-base font-semibold">Java 17</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-center sm:text-left">
                <p className="text-xs text-muted-foreground">Monitoring</p>
                <p className="mt-1 font-mono text-base font-semibold">Fullscreen & Focus</p>
              </div>
            </div>
          </div>
        </header>

        {unavailableReason ? (
          <div className="mt-6">
            <ContestModeNotice
              reason={unavailableReason}
              onRetry={() => void probe()}
              retrying={probing}
            />
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-6 flex flex-col gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="flex items-start gap-2">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
              />
              <span>{error}</span>
            </p>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => void startContest()}
            >
              Try again
            </Button>
          </div>
        ) : null}

        {/* Contest Rules Section */}
        <section
          aria-labelledby="contest-rules"
          className="mt-8 rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-xl sm:p-8"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div>
              <h2 id="contest-rules" className="font-display text-lg font-semibold tracking-tight">
                Contest rules
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Please review the guidelines carefully before starting your challenge.
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {RULES.length} Rules
            </Badge>
          </div>

          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {RULES.map((rule) => (
              <li
                key={rule.title}
                className="group flex gap-3.5 rounded-2xl border border-border/60 bg-muted/15 p-4 transition-all hover:border-primary/40 hover:bg-muted/30"
              >
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                  <rule.icon aria-hidden="true" className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{rule.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {rule.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Acknowledgement & Launch Section */}
        <section
          aria-labelledby="contest-acknowledgement"
          className="mt-6 rounded-3xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 p-6 backdrop-blur-xl sm:p-8"
        >
          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/30">
            <Checkbox
              id="contest-rules-acknowledged"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="contest-rules-acknowledged"
              className="cursor-pointer select-none text-sm font-medium leading-relaxed"
            >
              I have read and understood the contest rules
            </label>
          </div>

          <AlertDialog
            open={confirmOpen}
            onOpenChange={(open) => !creating && setConfirmOpen(open)}
          >
            <AlertDialogContent className="rounded-3xl border border-border bg-card/95 backdrop-blur-xl sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-xl">Start the Java coding contest?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3 text-left pt-2 text-sm">
                  <span className="block text-foreground/90">
                    You will get {CODING_CONTEST_CONFIG.minProblems} or{" "}
                    {CODING_CONTEST_CONFIG.maxProblems} random problems and{" "}
                    {CODING_CONTEST_DURATION_LABEL} to solve them.
                  </span>
                  <span className="block text-muted-foreground">
                    The clock starts as soon as you enter fullscreen, it never
                    pauses, and leaving fullscreen counts as a warning.
                  </span>
                  <span className="block font-semibold text-primary">
                    This cannot be undone once started.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="pt-2">
                <AlertDialogCancel disabled={creating} className="rounded-xl">Not yet</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-xl shadow-md"
                  onClick={(event) => {
                    // Keep the dialog mounted while the session is created.
                    event.preventDefault();
                    void startContest();
                  }}
                  disabled={creating}
                >
                  {creating ? "Creating your contest…" : "Confirm and start"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 rounded-xl font-medium shadow-md transition-all hover:shadow-primary/20 hover:scale-[1.01]"
              disabled={!acknowledged || creating}
              onClick={() => setConfirmOpen(true)}
            >
              <Keyboard aria-hidden="true" className="mr-2 h-4 w-4" />
              {creating ? "Creating your contest…" : "Start Contest"}
            </Button>
            {!acknowledged ? (
              <p className="text-xs text-muted-foreground">
                Tick the acknowledgement above to enable the start button.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export default CodingContestInstructions;
