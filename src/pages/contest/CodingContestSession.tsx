import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
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
import { Button } from "@/components/ui/button";
import { AlgoGuruLogo } from "@/components/AlgoGuruLogo";
import { Loader2, AlertTriangle, Maximize, Minimize2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBeforeUnloadWarning } from "@/hooks/useBeforeUnloadWarning";
import { useContestTimer } from "@/hooks/useContestTimer";
import { useExamIntegrity } from "@/hooks/useExamIntegrity";
import { useFullscreenExam } from "@/hooks/useFullscreenExam";
import { resolveContestSessionService } from "@/lib/contest/contestServices";
import { configuredSessionMode } from "@/lib/contest/sessionService";
import { useCodeExecutionService } from "@/lib/contest/codeExecution";
import { recordLocalProblemResult } from "@/lib/contest/devLocalContestSessionService";
import { MAX_EXAM_WARNINGS } from "@/lib/examConstants";
import type {
  CodingFinalizationReason,
  CodingSession,
  CodingSessionBundle,
  PublicCodingProblem,
} from "@/lib/contest/types";
import type { ExecutionResult } from "@/lib/contest/executionService";
import { CodingContestHeader } from "@/components/contest/coding/CodingContestHeader";
import { ContestClock } from "@/components/contest/coding/ContestClock";
import {
  CodingEditorFooter,
  type CodingViewMode,
} from "@/components/contest/coding/CodingEditorFooter";
import {
  CodingEditorPanel,
  type EditorTabDescriptor,
} from "@/components/contest/coding/CodingEditorPanel";
import { CodingExecutionPanel } from "@/components/contest/coding/CodingExecutionPanel";
import { CodingIntegrityLock } from "@/components/contest/coding/CodingIntegrityLock";
import { CodingQuestionList } from "@/components/contest/coding/CodingQuestionList";
import { CodingQuestionMenu } from "@/components/contest/coding/CodingQuestionMenu";
import {
  CodingProblemPanel,
  type CodingSubmissionSummary,
} from "@/components/contest/coding/CodingProblemPanel";
import type { ProblemState } from "@/components/contest/coding/problemState";
import { formatJava } from "@/lib/contest/javaFormat";
import { cn } from "@/lib/utils";

/**
 * Active Java coding contest.
 *
 * Chrome-free by design, like the MCQ exam screen. The key behaviours this
 * component is responsible for:
 *   - the clock derives from the server's absolute `expiresAt`, never a counter;
 *   - nothing runs until fullscreen has actually been entered;
 *   - a focus violation locks editing but keeps the clock and the code;
 *   - finalization happens exactly once, and a failed finalize NEVER looks like
 *     a success.
 */

type SaveStatus = "Saved" | "Saving" | "Unsaved" | "Local draft";
const DRAFT_PREFIX = "algoguru:coding-contest:draft:";

/**
 * Splitter layouts are remembered per learner between visits. `autoSaveId`
 * hands the persistence to `react-resizable-panels`, which writes the layout to
 * localStorage and restores it on the next mount; the defaults below are only
 * used on a first visit.
 */
const SPLIT_LAYOUT_KEY = "algoguru:coding-contest:layout:split";
const CONSOLE_LAYOUT_KEY = "algoguru:coding-contest:layout:console";

/**
 * The divider between two panes is a real drag slider, not a hairline: a 10px
 * gutter of page colour — which is what makes the panes read as *separate*
 * rounded surfaces — with a hairline down its centre that grows into a
 * primary-coloured pill on hover, on drag and on keyboard focus. The
 * pseudo-element carries that affordance so the library's own wide, invisible
 * hit area (its `after:` layer) stays untouched.
 */
const SPLIT_HANDLE_CLASS =
  "!w-2.5 border-0 bg-transparent " +
  "[&>div]:hidden " +
  "before:pointer-events-none before:absolute before:left-1/2 before:top-1/2 before:h-10 before:w-px before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-surface-line before:transition-all " +
  "hover:before:w-1 hover:before:bg-primary " +
  "data-[resize-handle-state=drag]:before:w-1 data-[resize-handle-state=drag]:before:bg-primary " +
  "focus-visible:before:w-1 focus-visible:before:bg-primary";

/** The same affordance, rotated for the editor / console split. */
const CONSOLE_HANDLE_CLASS =
  "!h-1.5 border-0 bg-transparent " +
  "[&>div]:hidden " +
  "before:pointer-events-none before:absolute before:left-1/2 before:top-1/2 before:h-px before:w-10 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-surface-line before:transition-all " +
  "hover:before:h-1 hover:before:bg-primary " +
  "data-[resize-handle-state=drag]:before:h-1 data-[resize-handle-state=drag]:before:bg-primary " +
  "focus-visible:before:h-1 focus-visible:before:bg-primary";

/** Rounded, self-contained surface for one pane of the workspace. */
const PANE_SHELL_CLASS =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-surface-panel";

/**
 * Collapsed console = just its header strip, **in pixels**.
 *
 * `react-resizable-panels` measures panels in percentages, so a bare
 * `collapsedSize={40}` would collapse the drawer to 40% of the column and leave
 * a dead band under the strip. The group is measured at runtime instead and the
 * equivalent percentage derived from it — see `consoleCollapsedPercent`.
 */
const CONSOLE_COLLAPSED_PX = 40;

const DRAFT_DEBOUNCE_MS = 800;

function draftKey(sessionId: string, problemId: string): string {
  return `${DRAFT_PREFIX}${sessionId}:${problemId}`;
}

function readLocalDraft(sessionId: string, problemId: string): string {
  try {
    return window.localStorage.getItem(draftKey(sessionId, problemId)) ?? "";
  } catch {
    return "";
  }
}

function writeLocalDraft(sessionId: string, problemId: string, code: string): void {
  try {
    window.localStorage.setItem(draftKey(sessionId, problemId), code);
  } catch {
    /* quota or private mode — the in-memory draft still survives navigation */
  }
}

/** Best available code for a problem: local recovery wins over server draft. */
function resolveDraft(
  bundle: CodingSessionBundle,
  problem: PublicCodingProblem,
): string {
  const recovered = readLocalDraft(bundle.session.id, problem.id);
  if (recovered) return recovered;
  return bundle.drafts[problem.id] ?? problem.starterCode;
}

/**
 * Extra editor buffers, one set per question.
 *
 * The first tab of a question is the solution that is graded and submitted: its
 * code travels through the normal draft pipeline (server autosave, local
 * recovery, reset to starter code). Everything after it is a *scratch* buffer —
 * notes, an alternative approach, a pasted snippet — which is deliberately
 * local-only and is never sent anywhere.
 */
interface ScratchTab {
  id: string;
  code: string;
}

interface ScratchState {
  tabs: ScratchTab[];
  activeId: string;
}

const SCRATCH_PREFIX = "algoguru:coding-contest:scratch:";
const SOLUTION_TAB_ID = "solution";
/** Enough room to experiment without letting the tab strip run away. */
const MAX_SCRATCH_TABS = 6;

function scratchKey(sessionId: string, problemId: string): string {
  return `${SCRATCH_PREFIX}${sessionId}:${problemId}`;
}

/** Never throws, never trusts stored JSON: a bad blob just means "no tabs". */
function readScratch(sessionId: string, problemId: string): ScratchState {
  const empty: ScratchState = { tabs: [], activeId: SOLUTION_TAB_ID };
  try {
    const raw = window.localStorage.getItem(scratchKey(sessionId, problemId));
    if (!raw) return empty;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return empty;
    const candidate = parsed as { tabs?: unknown; activeId?: unknown };
    if (!Array.isArray(candidate.tabs)) return empty;
    const tabs = candidate.tabs
      .filter(
        (tab): tab is ScratchTab =>
          !!tab &&
          typeof tab === "object" &&
          typeof (tab as ScratchTab).id === "string" &&
          typeof (tab as ScratchTab).code === "string",
      )
      .slice(0, MAX_SCRATCH_TABS);
    const activeId =
      typeof candidate.activeId === "string" &&
      (candidate.activeId === SOLUTION_TAB_ID ||
        tabs.some((tab) => tab.id === candidate.activeId))
        ? candidate.activeId
        : SOLUTION_TAB_ID;
    return { tabs, activeId };
  } catch {
    return empty;
  }
}

function writeScratch(
  sessionId: string,
  problemId: string,
  state: ScratchState,
): void {
  try {
    window.localStorage.setItem(
      scratchKey(sessionId, problemId),
      JSON.stringify(state),
    );
  } catch {
    /* quota or private mode — the in-memory tabs still survive navigation */
  }
}

export function CodingContestSession() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const mode = useMemo(() => configuredSessionMode(), []);
  const service = useMemo(
    () => resolveContestSessionService(mode, user?.id ?? "anonymous"),
    [mode, user?.id],
  );
  const execution = useCodeExecutionService();

  const [bundle, setBundle] = useState<CodingSessionBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [runAttempted, setRunAttempted] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("Saved");
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [returningFullscreen, setReturningFullscreen] = useState(false);
  const [finaliseError, setFinaliseError] = useState<string | null>(null);
  const [startGateOpen, setStartGateOpen] = useState(false);
  const [questionMenuOpen, setQuestionMenuOpen] = useState(false);
  const [questionListOpen, setQuestionListOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "editor" | "problem">("split");
  /** Results start collapsed to their header strip; a run opens them again. */
  const [consoleCollapsed, setConsoleCollapsed] = useState(true);
  /**
   * Editor full screen is a *layout* mode, never the browser Fullscreen API:
   * the exam's integrity rules own that API, and a learner pressing Escape out
   * of an element-fullscreen editor would be recorded as leaving the exam.
   */
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  /** Scratch buffers per question; the solution tab is implicit, not stored. */
  const [scratchTabs, setScratchTabs] = useState<Record<string, ScratchTab[]>>({});
  const [activeTabByProblem, setActiveTabByProblem] = useState<Record<string, string>>(
    {},
  );
  /** Last visible-test tally per question, so switching questions never loses it. */
  const [lastResults, setLastResults] = useState<
    Record<string, { passed: number; total: number }>
  >({});

  const fullscreen = useFullscreenExam();
  // The clock stays idle until fullscreen has genuinely been entered.
  const [clockStarted, setClockStarted] = useState(false);
  const inFlightRef = useRef(false);
  const finalisingRef = useRef(false);
  const finalisedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const menuAnchorRef = useRef<HTMLDivElement>(null);
  const consolePanelRef = useRef<ImperativePanelHandle>(null);
  const consoleGroupRef = useRef<HTMLDivElement>(null);
  /** Percentage of the editor column that equals the collapsed strip height. */
  const [consoleCollapsedPercent, setConsoleCollapsedPercent] = useState(6);

  // ── Session hydration ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!sessionId) {
      setLoadError("No contest session was specified.");
      return;
    }
    void (async () => {
      try {
        const loaded = await service.getSession(sessionId);
        if (cancelled) return;
        setBundle(loaded);
        const initial: Record<string, string> = {};
        const initialScratch: Record<string, ScratchTab[]> = {};
        const initialActiveTab: Record<string, string> = {};
        for (const problem of loaded.problems) {
          initial[problem.id] = resolveDraft(loaded, problem);
          // Scratch tabs are local-only, so they are recovered here rather than
          // from the session payload.
          const stored = readScratch(loaded.session.id, problem.id);
          if (stored.tabs.length) initialScratch[problem.id] = stored.tabs;
          initialActiveTab[problem.id] = stored.activeId;
        }
        setDrafts(initial);
        setScratchTabs(initialScratch);
        setActiveTabByProblem(initialActiveTab);
        setActiveId((current) => current || loaded.problems[0]?.id || "");
        setVisited(
          Object.fromEntries(loaded.problems.map((problem) => [problem.id, true])),
        );

        // A session restored after the deadline is already closed.
        if (loaded.session.status !== "active") {
          finalisedRef.current = true;
          navigate(`/contest/coding/result/${sessionId}`, { replace: true });
        } else {
          setStartGateOpen(true);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "This contest could not be loaded.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [service, sessionId, navigate]);

  const activeProblem = useMemo(
    () => bundle?.problems.find((problem) => problem.id === activeId) ?? null,
    [bundle, activeId],
  );

  // ── Editor tabs ──────────────────────────────────────────────────────
  // Tab 1 is the graded solution (backed by `drafts`); the rest are scratch
  // buffers held in this browser only.
  const problemScratchTabs = (activeProblem && scratchTabs[activeProblem.id]) || [];
  const activeTabId =
    (activeProblem && activeTabByProblem[activeProblem.id]) || SOLUTION_TAB_ID;
  const activeScratchTab =
    problemScratchTabs.find((tab) => tab.id === activeTabId) ?? null;
  const activeCode = activeScratchTab
    ? activeScratchTab.code
    : (activeProblem && drafts[activeProblem.id]) || "";
  const editorTabs: EditorTabDescriptor[] = [
    { id: SOLUTION_TAB_ID, label: "Tab-1", scratch: false },
    ...problemScratchTabs.map((tab, index) => ({
      id: tab.id,
      label: `Tab-${index + 2}`,
      scratch: true,
    })),
  ];

  const selectTab = useCallback(
    (tabId: string) => {
      if (!activeProblem) return;
      setActiveTabByProblem((current) => ({ ...current, [activeProblem.id]: tabId }));
    },
    [activeProblem],
  );

  const addScratchTab = useCallback(() => {
    if (!activeProblem) return;
    const id = `scratch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    setScratchTabs((current) => ({
      ...current,
      [activeProblem.id]: [...(current[activeProblem.id] ?? []), { id, code: "" }],
    }));
    setActiveTabByProblem((current) => ({ ...current, [activeProblem.id]: id }));
  }, [activeProblem]);

  const closeScratchTab = useCallback(
    (problemId: string, tabId: string) => {
      setScratchTabs((current) => ({
        ...current,
        [problemId]: (current[problemId] ?? []).filter((tab) => tab.id !== tabId),
      }));
      setActiveTabByProblem((current) =>
        current[problemId] === tabId
          ? { ...current, [problemId]: SOLUTION_TAB_ID }
          : current,
      );
    },
    [],
  );

  const finalizeContest = useCallback(
    async (reason: CodingFinalizationReason) => {
      if (finalisingRef.current || finalisedRef.current || !bundle) return;
      finalisingRef.current = true;
      try {
        // Capture the latest drafts first so a timeout does not lose work.
        // `allSettled`, not `all`: once the deadline has passed the backend
        // legitimately refuses new draft writes, and that must not block the
        // finalization that the timeout itself requires.
        await Promise.allSettled(
          bundle.problems.map((problem) =>
            service.saveDraft(
              bundle.session.id,
              problem.id,
              drafts[problem.id] ?? "",
            ),
          ),
        );
        await service.finalize(bundle.session.id, reason);
        finalisedRef.current = true;
        setFinishOpen(false);
        navigate(`/contest/coding/result/${bundle.session.id}`);
      } catch (error) {
        // A network failure must NOT look like a successful submission.
        finalisingRef.current = false;
        setFinishOpen(false);
        setFinaliseError(
          error instanceof Error
            ? error.message
            : "The contest could not be submitted because of a network problem.",
        );
      }
    },
    [bundle, drafts, navigate, service],
  );

  // ── Clock ────────────────────────────────────────────────────────────
  const handleExpire = useCallback(() => {
    if (finalisedRef.current) return;
    setFinaliseError(null);
    void finalizeContest("expired");
  }, [finalizeContest]);

  const timer = useContestTimer({
    expiresAt: clockStarted && bundle ? bundle.session.expiresAt : null,
    startedAt: clockStarted && bundle ? bundle.session.startedAt : null,
    onExpire: handleExpire,
  });

  // ── Integrity ────────────────────────────────────────────────────────
  const handleAutoSubmit = useCallback(() => {
    if (finalisedRef.current) return;
    void service
      .recordWarning(sessionId, "warning_limit")
      .then((ack) => {
        if (ack.finalised) {
          finalisedRef.current = true;
          navigate(`/contest/coding/result/${sessionId}`);
        }
      })
      .catch(() => {
        /* the deadline path remains as a safety net */
      });
  }, [navigate, service, sessionId]);

  const integrity = useExamIntegrity({
    active: clockStarted && !!bundle && !finalisedRef.current,
    maxWarnings: MAX_EXAM_WARNINGS,
    onAutoSubmit: handleAutoSubmit,
  });

  useBeforeUnloadWarning(!!bundle && !finalisedRef.current && !finishOpen);

  // Record every warning with the backend so the count cannot be reset by a
  // reload. The local hook state is the UI mirror of this.
  const lastRecordedWarning = useRef(0);
  useEffect(() => {
    if (!bundle || integrity.warningCount <= lastRecordedWarning.current) return;
    lastRecordedWarning.current = integrity.warningCount;
    void service
      .recordWarning(sessionId, integrity.warning ?? "focus violation")
      .then((ack) => {
        if (ack.finalised && !finalisedRef.current) {
          finalisedRef.current = true;
          navigate(`/contest/coding/result/${sessionId}`);
        }
      })
      .catch(() => {
        /* non-fatal: the server re-derives the count on the next read */
      });
  }, [bundle, integrity.warning, integrity.warningCount, navigate, service, sessionId]);

  // ── Drafts ───────────────────────────────────────────────────────────
  const persistDraft = useCallback(
    (problemId: string, code: string) => {
      if (!bundle) return;
      setSaveStatus("Saving");
      void service
        .saveDraft(bundle.session.id, problemId, code)
        .then(() => setSaveStatus("Saved"))
        .catch(() => setSaveStatus("Unsaved"));
    },
    [bundle, service],
  );

  const handleCodeChange = useCallback(
    (next: string) => {
      if (!activeProblem || integrity.locked) return;
      setTouched((current) => ({ ...current, [activeProblem.id]: true }));

      if (activeTabId !== SOLUTION_TAB_ID) {
        // Scratch buffers never reach the server — only the solution tab is
        // graded — so they are persisted locally by the effect below.
        setScratchTabs((current) => ({
          ...current,
          [activeProblem.id]: (current[activeProblem.id] ?? []).map((tab) =>
            tab.id === activeTabId ? { ...tab, code: next } : tab,
          ),
        }));
        return;
      }

      setDrafts((current) => ({ ...current, [activeProblem.id]: next }));
      writeLocalDraft(bundle!.session.id, activeProblem.id, next);

      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        persistDraft(activeProblem.id, next);
      }, DRAFT_DEBOUNCE_MS);
    },
    [activeProblem, activeTabId, bundle, integrity.locked, persistDraft],
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    },
    [],
  );

  // Scratch tabs are local-only, so nothing else would save them: write the
  // whole set (a few small buffers) once typing pauses.
  useEffect(() => {
    if (!bundle) return;
    const timer = window.setTimeout(() => {
      for (const problem of bundle.problems) {
        writeScratch(bundle.session.id, problem.id, {
          tabs: scratchTabs[problem.id] ?? [],
          activeId: activeTabByProblem[problem.id] ?? SOLUTION_TAB_ID,
        });
      }
    }, DRAFT_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [bundle, scratchTabs, activeTabByProblem]);

  /** Format the buffer that is on screen, through the normal edit path. */
  const formatActiveCode = useCallback(() => {
    if (!activeProblem || integrity.locked || finalisedRef.current) return;
    const formatted = formatJava(activeCode, { indentSize: 4 });
    if (formatted === activeCode) return;
    handleCodeChange(formatted);
  }, [activeCode, activeProblem, handleCodeChange, integrity.locked]);

  // ── Execution ────────────────────────────────────────────────────────
  const runOrSubmit = useCallback(
    async (action: "run" | "submit") => {
      if (!bundle || !activeProblem || inFlightRef.current) return;
      inFlightRef.current = true;
      setBusy(action);
      setResult(null);
      setRunAttempted((current) => ({ ...current, [activeProblem.id]: true }));
      // Output the learner asked for should never land in a hidden drawer.
      setConsoleCollapsed(false);
      try {
        const outcome =
          action === "run"
            ? await execution.service.run({
                sessionId: bundle.session.id,
                problemId: activeProblem.id,
                language: "java",
                code: activeCode,
                mode: "run",
              })
            : await execution.service.submit({
                sessionId: bundle.session.id,
                problemId: activeProblem.id,
                language: "java",
                code: activeCode,
                mode: "submit",
              });
        setResult(outcome);
        setLastResults((current) => ({
          ...current,
          [activeProblem.id]: { passed: outcome.passed, total: outcome.total },
        }));
        if (action === "submit") {
          setSubmitted((current) => ({ ...current, [activeProblem.id]: true }));
          if (!bundle.authoritative) {
            // Only the local development adapter keeps per-problem results;
            // the real backend scores on the server.
            recordLocalProblemResult(window.localStorage, bundle.session.id, {
              problemId: activeProblem.id,
              title: activeProblem.title,
              difficulty: activeProblem.difficulty,
              submitted: true,
              solved: false,
              passed: outcome.passed,
              total: outcome.total,
              submittedCode: activeCode,
            });
          }
        }
      } catch (error) {
        setResult({
          verdict: "unavailable",
          stdout: "",
          stderr:
            error instanceof Error
              ? error.message
              : "The execution service did not respond.",
          compileDiagnostics: [],
          runtimeMs: 0,
          memoryKb: 0,
          testOutcomes: [],
          passed: 0,
          total: 0,
          hiddenEvaluated: false,
          mode: "production",
        });
      } finally {
        inFlightRef.current = false;
        setBusy(null);
      }
    },
    [activeCode, activeProblem, bundle, execution.service],
  );

  // ── Start gate ───────────────────────────────────────────────────────
  const beginExam = useCallback(async () => {
    setReturningFullscreen(true);
    const ok = await fullscreen.enter();
    setReturningFullscreen(false);
    if (!ok) return;
    setStartGateOpen(false);
    // Only a successful fullscreen entry may start the clock.
    setClockStarted(true);
  }, [fullscreen]);

  useEffect(() => {
    if (!startGateOpen) return;
    if (fullscreen.isFullscreen) {
      setStartGateOpen(false);
      setClockStarted(true);
    }
  }, [fullscreen.isFullscreen, startGateOpen]);

  // ── Problem state chips ──────────────────────────────────────────────
  const stateFor = useCallback(
    (problem: PublicCodingProblem): ProblemState => {
      if (submitted[problem.id]) return "Submitted";
      if (runAttempted[problem.id] && (lastResults[problem.id]?.passed ?? 0) > 0) {
        return "Visible tests passed";
      }
      if (runAttempted[problem.id]) return "Run attempted";
      if (touched[problem.id]) return "Code edited";
      if (visited[problem.id]) return "Viewed";
      return "Not visited";
    },
    [lastResults, runAttempted, submitted, touched, visited],
  );

  const submittedCount = Object.values(submitted).filter(Boolean).length;

  const selectProblem = useCallback(
    (problemId: string) => {
      setActiveId(problemId);
      setVisited((current) => ({ ...current, [problemId]: true }));
      setResult(null);
    },
    [],
  );

  const resetActiveCode = useCallback(() => {
    if (!activeProblem) return;
    if (activeTabId !== SOLUTION_TAB_ID) {
      setScratchTabs((current) => ({
        ...current,
        [activeProblem.id]: (current[activeProblem.id] ?? []).map((tab) =>
          tab.id === activeTabId ? { ...tab, code: "" } : tab,
        ),
      }));
      return;
    }
    const starter = activeProblem.starterCode;
    setDrafts((current) => ({ ...current, [activeProblem.id]: starter }));
    setTouched((current) => ({ ...current, [activeProblem.id]: true }));
    writeLocalDraft(bundle!.session.id, activeProblem.id, starter);
    persistDraft(activeProblem.id, starter);
  }, [activeProblem, activeTabId, bundle, persistDraft]);

  /**
   * Picking a layout is also a way out of editor full screen: hiding the
   * problem statement behind an immersive editor and then asking for "problem
   * only" can only mean "show me the statement".
   *
   * Entering full screen closes the question list, which would otherwise keep
   * covering the editor it was opened over.
   */
  const toggleEditorFullscreen = useCallback(() => {
    setEditorFullscreen((current) => {
      if (!current) setQuestionListOpen(false);
      return !current;
    });
  }, []);

  const handleViewModeChange = useCallback(
    (mode: CodingViewMode) => {
      setViewMode(mode);
      setEditorFullscreen(false);
    },
    [],
  );

  // Escape leaves full screen. This is a layout mode, so it never touches the
  // browser's fullscreen state that the exam's integrity rules depend on.
  useEffect(() => {
    if (!editorFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditorFullscreen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editorFullscreen]);

  // The console drawer is a real resizable panel, so the chevron, the drag and
  // the keyboard all drive the same layout. This effect is the single place the
  // React state is mirrored onto the panel, so they cannot drift apart. Declared
  // above the early returns to keep the hook order stable across renders.
  //
  // `consoleCollapsedPercent` is a dependency because the collapsed height is
  // expressed in pixels: when the column is re-measured (window resize, zoom)
  // the panel has to be re-collapsed against the new percentage.
  useEffect(() => {
    const panel = consolePanelRef.current;
    if (!panel) return;
    if (consoleCollapsed) panel.collapse();
    else panel.expand();
  }, [consoleCollapsed, consoleCollapsedPercent]);

  // Convert the collapsed strip's pixel height into the percentage the panel
  // group actually speaks, and keep it current as the column is resized.
  useEffect(() => {
    const element = consoleGroupRef.current;
    if (!element) return;
    const measure = () => {
      const height = element.getBoundingClientRect().height;
      if (height <= 0) return;
      const percent = Math.min(50, Math.max(1, (CONSOLE_COLLAPSED_PX / height) * 100));
      setConsoleCollapsedPercent((current) =>
        Math.abs(current - percent) < 0.05 ? current : percent,
      );
    };

    // Measure once, then again after the next two paints: the first pass can
    // land mid-layout (lazy editor chunk, web-font swap), and the drawer must
    // end up a true 40px strip instead of a percentage of a half-built column.
    measure();
    let frame = requestAnimationFrame(() => {
      measure();
      frame = requestAnimationFrame(measure);
    });

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(element);
    }
    // Belt and braces: the observer is enough for a steady viewport, but a
    // window resize or a browser zoom also changes what 40px is worth.
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // The contest-set menu dismisses on an outside press, but not on its own
  // trigger — that press is the toggle.
  useEffect(() => {
    if (!questionMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && menuAnchorRef.current?.contains(target)) return;
      setQuestionMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [questionMenuOpen]);

  const activeIndex = bundle
    ? bundle.problems.findIndex((problem) => problem.id === activeId)
    : 0;

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle aria-hidden="true" className="h-8 w-8 text-destructive" />
        <h1 className="font-display text-xl font-semibold">Contest unavailable</h1>
        <p className="max-w-md text-sm text-muted-foreground">{loadError}</p>
        <Button onClick={() => navigate("/contest")}>Return to Contest</Button>
      </div>
    );
  }

  if (!bundle || !activeProblem) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-muted-foreground" />
        <p role="status" className="text-sm text-muted-foreground">
          Loading your contest…
        </p>
      </div>
    );
  }

  const locked = integrity.locked;
  const finalised = finalisedRef.current;
  const readonly = locked || finalised;

  const entries = bundle.problems.map((problem, index) => ({
    problem,
    index,
    state: stateFor(problem),
  }));

  const submissions: CodingSubmissionSummary[] = entries.map((entry) => ({
    problem: entry.problem,
    index: entry.index,
    state: entry.state,
    passed: lastResults[entry.problem.id]?.passed ?? 0,
    total: lastResults[entry.problem.id]?.total ?? 0,
  }));

  const problemPane = locked ? (
    <p className="px-6 py-6 text-sm text-muted-foreground">
      The problem statement is hidden while the exam is locked.
    </p>
  ) : (
    <CodingProblemPanel problem={activeProblem} submissions={submissions} />
  );

  const editorColumn = (
    <div className="flex h-full min-h-0 flex-col">
      {/* Measured wrapper: the collapsed console height is derived from it. */}
      <div ref={consoleGroupRef} className="relative min-h-0 flex-1">
        <ResizablePanelGroup
          direction="vertical"
          className="min-h-0"
          autoSaveId={CONSOLE_LAYOUT_KEY}
          keyboardResizeBy={5}
        >
          <ResizablePanel defaultSize={76} minSize={25} className="min-h-0">
            <div className={cn("h-full", locked && "pointer-events-none opacity-40")}>
              <CodingEditorPanel
                problem={activeProblem}
                value={activeCode}
                onChange={handleCodeChange}
                readOnly={readonly}
                diagnostics={result?.compileDiagnostics ?? []}
                onReset={resetActiveCode}
                onRun={() => void runOrSubmit("run")}
                onSubmit={() => void runOrSubmit("submit")}
                busy={busy !== null}
                busyMode={busy}
                actionsDisabled={readonly || execution.loading}
                localDraftsOnly={!bundle.authoritative}
                tabs={editorTabs}
                activeTabId={activeTabId}
                onSelectTab={selectTab}
                onAddTab={addScratchTab}
                onCloseTab={(tabId) => closeScratchTab(activeProblem.id, tabId)}
                canAddTab={problemScratchTabs.length < MAX_SCRATCH_TABS}
                canFormat={!readonly && activeCode.trim().length > 0}
                fullscreen={editorFullscreen}
                onToggleFullscreen={toggleEditorFullscreen}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle
            className={CONSOLE_HANDLE_CLASS}
            orientation="horizontal"
            aria-label="Resize the code editor and results panels"
          />

          <ResizablePanel
            ref={consolePanelRef}
            defaultSize={24}
            minSize={12}
            collapsible
            collapsedSize={consoleCollapsedPercent}
            onCollapse={() => setConsoleCollapsed(true)}
            onExpand={() => setConsoleCollapsed(false)}
            className="min-h-0"
          >
            <CodingExecutionPanel
              busy={busy !== null}
              mode={busy}
              result={result}
              supportsCustomInput={execution.service.supportsCustomInput}
              collapsed={consoleCollapsed}
              onCollapsedChange={setConsoleCollapsed}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <CodingEditorFooter
        saveStatus={bundle.authoritative ? saveStatus : "Local draft"}
        warningCount={integrity.warningCount}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />
    </div>
  );

  return (
    <div
      className={cn(
        "flex h-screen flex-col overflow-hidden bg-surface-page selection:bg-primary/20",
        editorFullscreen ? "gap-0 p-0" : "gap-[15px] p-[15px]",
      )}
    >
      {editorFullscreen ? (
        /*
         * Editor full screen keeps one slim chrome bar rather than floating
         * controls over the code: the exam clock and Finish must never be
         * hidden, and an overlay would sit on top of the editor's own tab bar.
         */
        <div className="flex h-[52px] shrink-0 items-center justify-between gap-3 bg-surface-chrome px-4">
          <span className="truncate text-xs font-medium text-muted-foreground">
            Question {activeIndex >= 0 ? activeIndex + 1 : 1} /{" "}
            {bundle.problems.length} · editor full screen
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <ContestClock remainingSeconds={timer.remainingSeconds} />
            {integrity.warningCount > 0 ? (
              <span
                title={`Focus warnings: ${integrity.warningCount} of ${MAX_EXAM_WARNINGS}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 text-xs font-medium text-destructive"
              >
                {integrity.warningCount}/{MAX_EXAM_WARNINGS}
              </span>
            ) : null}
            <Button
              type="button"
              size="sm"
              onClick={() => setFinishOpen(true)}
              aria-label="Finish Contest"
              className="h-9 rounded-lg px-4 text-sm font-semibold"
            >
              Finish
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditorFullscreen(false)}
              aria-label="Exit editor full screen"
              title="Exit editor full screen (Esc)"
              className="h-9 gap-1.5 rounded-lg border-surface-line bg-surface-panel px-4 text-sm font-medium"
            >
              <Minimize2 aria-hidden="true" className="h-4 w-4" />
              Exit full screen
            </Button>
          </div>
        </div>
      ) : (
        <CodingContestHeader
          remainingSeconds={timer.remainingSeconds}
          totalProblems={bundle.problems.length}
          warningCount={integrity.warningCount}
          localMode={!bundle.authoritative}
          onFinish={() => setFinishOpen(true)}
          onToggleList={() => setQuestionListOpen((prev) => !prev)}
          listOpen={questionListOpen}
          activeProblemIndex={activeIndex >= 0 ? activeIndex : 0}
          menuOpen={questionMenuOpen}
          onMenuToggle={() => setQuestionMenuOpen((prev) => !prev)}
          menuAnchorRef={menuAnchorRef}
          questionMenu={
            <CodingQuestionMenu
              entries={entries}
              activeId={activeId}
              onSelect={selectProblem}
              onOpenList={() => {
                setQuestionMenuOpen(false);
                setQuestionListOpen(true);
              }}
              disabled={readonly}
              isOpen={questionMenuOpen}
              onClose={() => setQuestionMenuOpen(false)}
            />
          }
        />
      )}

      {finaliseError ? (
        <div
          role="alert"
          className="flex shrink-0 flex-wrap items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm"
        >
          <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0 text-destructive" />
          <span className="flex-1">
            {finaliseError} Your answers are safe — try submitting again.
          </span>
          <Button size="sm" variant="outline" onClick={() => void finalizeContest("expired")}>
            Retry submission
          </Button>
        </div>
      ) : null}

      {/* Main Workspace: two rounded panes divided by a draggable slider. */}
      <main className="relative flex min-h-0 flex-1">
        {editorFullscreen ? (
          <div className={cn(PANE_SHELL_CLASS, "w-full rounded-none")}>{editorColumn}</div>
        ) : viewMode === "split" ? (
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-0 flex-1"
            autoSaveId={SPLIT_LAYOUT_KEY}
            keyboardResizeBy={5}
          >
            <ResizablePanel
              defaultSize={40}
              minSize={20}
              className="min-w-0 rounded-xl bg-surface-panel"
            >
              {problemPane}
            </ResizablePanel>
            <ResizableHandle
              className={SPLIT_HANDLE_CLASS}
              orientation="vertical"
              aria-label="Resize the problem description and coding workspace panels"
            />

            <ResizablePanel
              defaultSize={60}
              minSize={30}
              className="min-w-0 rounded-xl bg-surface-panel"
            >
              {editorColumn}
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : viewMode === "problem" ? (
          <div className={cn(PANE_SHELL_CLASS, "w-full")}>
            <div className="min-h-0 flex-1 overflow-y-auto">{problemPane}</div>
            <CodingEditorFooter
              saveStatus={bundle.authoritative ? saveStatus : "Local draft"}
              warningCount={integrity.warningCount}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
          </div>
        ) : (
          <div className={cn(PANE_SHELL_CLASS, "w-full")}>{editorColumn}</div>
        )}

        {/* Full-screen question list */}
        <CodingQuestionList
          entries={entries}
          activeId={activeId}
          onSelect={selectProblem}
          disabled={readonly}
          isOpen={questionListOpen}
          onClose={() => setQuestionListOpen(false)}
        />
      </main>

      {/* Finish confirmation */}
      <AlertDialog open={finishOpen} onOpenChange={setFinishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finish the contest now?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-left">
              <span className="block">
                Time remaining:{" "}
                <strong>{Math.floor(timer.remainingSeconds / 60)}m{" "}
                {timer.remainingSeconds % 60}s</strong>
              </span>
              <span className="block">
                Submitted problems: <strong>{submittedCount}</strong> of{" "}
                {bundle.problems.length}
              </span>
              <span className="block">
                Attempted but not submitted:{" "}
                <strong>
                  {bundle.problems.filter(
                    (problem) => touched[problem.id] && !submitted[problem.id],
                  ).length}
                </strong>
              </span>
              <span className="block">
                Unattempted:{" "}
                <strong>
                  {bundle.problems.filter((problem) => !touched[problem.id]).length}
                </strong>
              </span>
              {integrity.warningCount > 0 ? (
                <span className="block">
                  Focus warnings recorded:{" "}
                  <strong>
                    {integrity.warningCount} of {MAX_EXAM_WARNINGS}
                  </strong>
                </span>
              ) : null}
              <span className="block font-medium text-foreground">
                This cannot be undone. Any code you have not submitted will only
                count if the deadline submits it.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction onClick={() => void finalizeContest("manual")}>
              Submit and finish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pre-start gate: nothing runs until fullscreen succeeds. */}
      {startGateOpen ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="coding-start-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center shadow-xl">
            <AlgoGuruLogo size={120} showText={false} className="mx-auto text-foreground" />
            <h2
              id="coding-start-title"
              className="mt-4 font-display text-lg font-semibold tracking-tight"
            >
              Enter fullscreen to begin
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your 30 minutes start counting down only once the browser is in
              fullscreen. Leaving it later counts as a focus warning.
            </p>
            {fullscreen.message ? (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {fullscreen.message}
              </p>
            ) : null}
            <Button size="lg" className="mt-6 w-full" onClick={() => void beginExam()} disabled={returningFullscreen}>
              {returningFullscreen ? (
                <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Maximize aria-hidden="true" className="mr-2 h-4 w-4" />
              )}
              {returningFullscreen ? "Opening fullscreen…" : "Enter fullscreen and start"}
            </Button>
          </div>
        </div>
      ) : null}

      {integrity.warning ? (
        <CodingIntegrityLock
          reason={integrity.warning}
          warningCount={integrity.warningCount}
          returning={returningFullscreen}
          onReturnToFullscreen={async () => {
            setReturningFullscreen(true);
            const ok = await fullscreen.enter();
            setReturningFullscreen(false);
            if (ok) integrity.resume();
          }}
        />
      ) : null}
    </div>
  );
}

export default CodingContestSession;
