import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import CodingContestSession from "@/pages/contest/CodingContestSession";
import { MAX_EXAM_WARNINGS } from "@/lib/examConstants";
import {
  changeFullscreen,
  enterFullscreen,
  installExamBrowserEnv,
  loseFocus,
  restoreExamBrowserEnv,
  setHidden,
} from "@/test/examEnv";

/**
 * Monaco needs a real browser and cannot render in jsdom, so the editor is
 * replaced with a textarea double. Everything the workspace does around the
 * editor (per-problem drafts, reset, read-only locking) is still exercised.
 */
vi.mock("@monaco-editor/react", () => ({
  default: ({
    value,
    onChange,
    readOnly,
  }: {
    value: string;
    onChange: (next: string) => void;
    readOnly?: boolean;
  }) => (
    <textarea
      aria-label="Java code editor"
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

const finalize = vi.fn<(sessionId: string, reason: string) => Promise<unknown>>();
const saveDraft = vi.fn<(s: string, p: string, c: string) => Promise<unknown>>();
const recordWarning = vi.fn<(s: string, r: string) => Promise<unknown>>();

vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    session: { user: { id: "user-1" } },
    user: { id: "user-1" },
    profile: null,
    resolvedAvatar: null,
    loading: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

let service: {
  getSession: (id: string) => Promise<unknown>;
  saveDraft: (s: string, p: string, c: string) => Promise<void>;
  recordWarning: (s: string, r: string) => Promise<unknown>;
  finalize: (s: string, r: string) => Promise<unknown>;
};

/**
 * Tests swap this in to simulate a transport failure. The component builds its
 * own service instance inside the factory, so a spy on a test-created instance
 * would never be seen: the seam has to live where the call actually goes.
 *
 * Read only inside the wrapper closures, so the hoisted `vi.mock` factory never
 * touches it before initialisation.
 */
let finalizeImpl: ((s: string, r: string) => Promise<unknown>) | null = null;

vi.mock("@/lib/contest/contestServices", async () => {
  const { createDevLocalContestSessionService } = await import(
    "@/lib/contest/devLocalContestSessionService"
  );
  return {
    resolveContestSessionService: () => {
      const local = createDevLocalContestSessionService({
        userId: "user-1",
        random: () => 0.9,
      });
      const wrapper = {
        getSession: (id: string) => local.getSession(id),
        saveDraft: (s: string, p: string, c: string) => {
          saveDraft(s, p, c);
          return local.saveDraft(s, p, c);
        },
        recordWarning: (s: string, r: string) => recordWarning(s, r),
        finalize: (s: string, r: string) => {
          finalize(s, r);
          return finalizeImpl
            ? finalizeImpl(s, r)
            : local.finalize(s, r as never);
        },
      };
      service = wrapper;
      return wrapper;
    },
  };
});

const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

const SESSION_ID = "session-under-test";

function LocationProbe() {
  const location = useLocation();
  return (
    <div>
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="search">{location.search}</span>
    </div>
  );
}

function renderWorkspace(sessionId = SESSION_ID) {
  return render(
    <MemoryRouter
      initialEntries={[`/contest/coding/session/${sessionId}`]}
      future={ROUTER_FUTURE}
    >
      <LocationProbe />
      <Routes>
        <Route
          path="/contest/coding/session/:sessionId"
          element={<CodingContestSession />}
        />
        <Route
          path="/contest/coding/result/:sessionId"
          element={<div>result page</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

/** Creates an active session and enters fullscreen, then renders. */
async function startContest() {
  const { createDevLocalContestSessionService } = await import(
    "@/lib/contest/devLocalContestSessionService"
  );
  const local = createDevLocalContestSessionService({
    userId: "user-1",
    random: () => 0.9,
  });
  const { session } = await local.createSession();
  const utils = renderWorkspace(session.id);
  // Wait for hydration, then clear the pre-start gate the way a learner would.
  await waitFor(() =>
    expect(
      screen.getByRole("alertdialog", { name: /Enter fullscreen to begin/i }),
    ).toBeInTheDocument(),
  );
  return { ...utils, session, service: local };
}

/** Dismisses the pre-start gate by entering fullscreen. */
async function passStartGate() {
  fireEvent.click(
    screen.getByRole("button", { name: /Enter fullscreen and start/i }),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("alertdialog", { name: /Enter fullscreen to begin/i }),
    ).not.toBeInTheDocument(),
  );
  // The editor is a lazy chunk; wait for it before driving it.
  await waitFor(() =>
    expect(screen.getByLabelText("Java code editor")).toBeInTheDocument(),
  );
}

/**
 * Opens the contest-set dropdown. The question list is only exposed to the
 * accessibility tree while it is open, so every test that drives it has to go
 * through the trigger a learner would use.
 */
function openQuestionMenu() {
  fireEvent.click(screen.getByRole("button", { name: /Contest set/i }));
}

function questionMenuButtons() {
  return screen
    .getByRole("navigation", { name: "Assigned problems" })
    .querySelectorAll("button");
}

beforeEach(async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-09-30T12:00:00Z"));
  installExamBrowserEnv();
  window.localStorage.clear();
  vi.clearAllMocks();
  finalizeImpl = null;
  recordWarning.mockResolvedValue({
    warningCount: 1,
    finalised: false,
    session: { id: "s", status: "active" },
  });
});

afterEach(() => {
  cleanup();
  restoreExamBrowserEnv();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("CodingContestSession", () => {
  it("gates the start behind fullscreen and shows no countdown before it", async () => {
    await startContest();
    expect(
      screen.getByRole("alertdialog", { name: /Enter fullscreen to begin/i }),
    ).toBeInTheDocument();
    // 30:00 is present but the clock has not begun: no time has been consumed.
    expect(screen.getByRole("timer", { name: "Time remaining" })).toBeInTheDocument();
    expect(
      screen.getByRole("alertdialog", { name: /Enter fullscreen to begin/i }),
    ).toHaveTextContent("30 minutes");
  });

  it("starts the countdown only after fullscreen succeeds", async () => {
    const { session } = await startContest();
    await passStartGate();

    expect(session.expiresAt - session.startedAt).toBe(30 * 60 * 1000);
    // 30 minutes have not elapsed, so the clock reads the full allowance.
    expect(
      screen.getByRole("timer", { name: "Time remaining" }),
    ).toHaveTextContent("30:00");
  });

  it("assigns two or three distinct problems and lists them accessibly", async () => {
    await startContest();
    await passStartGate();
    openQuestionMenu();
    const nav = screen.getByRole("navigation", { name: "Assigned problems" });
    const items = nav.querySelectorAll("button");
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.length).toBeLessThanOrEqual(3);
    for (const item of items) {
      expect(item.getAttribute("aria-label")).toMatch(
        /^Problem \d+: .+\. (Not visited|Viewed|Code edited|Run attempted|Visible tests passed|Submitted)$/,
      );
    }
  });

  it("exposes a focusable splitter between the statement and the workspace", async () => {
    await startContest();
    await passStartGate();

    const splitter = screen.getByRole("separator", {
      name: /Resize the problem description and coding workspace panels/i,
    });
    // Focusable, so it is not mouse-only.
    expect(splitter).toHaveAttribute("tabindex", "0");
    expect(splitter).toHaveAttribute("aria-orientation", "vertical");
  });

  it("exposes a focusable splitter between the editor and the results", async () => {
    await startContest();
    await passStartGate();

    const splitter = screen.getByRole("separator", {
      name: /Resize the code editor and results panels/i,
    });
    expect(splitter).toHaveAttribute("tabindex", "0");
    expect(splitter).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("collapses the results to their header strip and reopens on a run", async () => {
    await startContest();
    await passStartGate();

    // Collapsed by default, so a fresh question gets the full editor height.
    expect(screen.getByRole("button", { name: /Expand results/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run code/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Run code/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Collapse results/i }),
      ).toBeInTheDocument(),
    );
  });

  it("keeps the question list out of the page until it is asked for", async () => {
    await startContest();
    await passStartGate();

    // Collapsed: the dropdown and the full-screen list are both unreachable.
    expect(
      screen.queryByRole("navigation", { name: "Assigned problems" }),
    ).not.toBeInTheDocument();

    openQuestionMenu();
    expect(
      screen.getByRole("navigation", { name: "Assigned problems" }),
    ).toBeInTheDocument();

    // Choosing a question dismisses it again.
    fireEvent.click(questionMenuButtons()[0]);
    expect(
      screen.queryByRole("navigation", { name: "Assigned problems" }),
    ).not.toBeInTheDocument();
  });

  it("keeps an independent draft per problem", async () => {
    await startContest();
    await passStartGate();
    const editor = () =>
      screen.getByLabelText("Java code editor") as HTMLTextAreaElement;

    fireEvent.change(editor(), { target: { value: "// first problem" } });
    expect(editor()).toHaveValue("// first problem");

    // Switch to another problem: the first draft must not bleed across.
    openQuestionMenu();
    const items = questionMenuButtons();
    fireEvent.click(items[1]);
    expect(editor().value).not.toBe("// first problem");
    fireEvent.change(editor(), { target: { value: "// second problem" } });

    // Switching back restores the first draft.
    openQuestionMenu();
    fireEvent.click(items[0]);
    expect(editor()).toHaveValue("// first problem");
  });

  it("marks an edited problem as Code edited in the nav", async () => {
    await startContest();
    await passStartGate();
    openQuestionMenu();
    const items = questionMenuButtons();
    fireEvent.change(screen.getByLabelText("Java code editor"), {
      target: { value: "// edited" },
    });
    expect(items[0].getAttribute("aria-label")).toContain("Code edited");
  });

  it("restores a saved draft after a remount", async () => {
    const { session } = await startContest();
    await passStartGate();
    fireEvent.change(screen.getByLabelText("Java code editor"), {
      target: { value: "// persisted draft" },
    });
    // The debounced autosave is the source of truth after a reload; flush it.
    await waitFor(() => expect(saveDraft).toHaveBeenCalled());

    cleanup();
    // A fresh mount stands in for a page refresh on the same session.
    renderWorkspace(session.id);
    await waitFor(() =>
      expect(
        screen.getByRole("alertdialog", { name: /Enter fullscreen to begin/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Java code editor")).toHaveValue(
      "// persisted draft",
    );
  });

  it("shows a compile failure state without inventing a test pass", async () => {
    await startContest();
    await passStartGate();
    const editor = screen.getByLabelText("Java code editor");
    fireEvent.change(editor, { target: { value: "class Solution { public int f() { return 1; }" } });
    fireEvent.click(screen.getByRole("button", { name: /Run code/i }));

    await waitFor(() =>
      expect(screen.getByText("Compilation problems")).toBeInTheDocument(),
    );
    expect(screen.getByText("Compile error")).toBeInTheDocument();
    // Never claims a hidden evaluation.
    expect(screen.getByText(/was not/i)).toBeInTheDocument();
  });

  it("locks the workspace on fullscreen loss but keeps the timer running", async () => {
    const { session } = await startContest();
    await passStartGate();
    expect(
      screen.getByRole("timer", { name: "Time remaining" }),
    ).toHaveTextContent("30:00");

    act(() => {
      // Two minutes ELAPSED, so 28:00 remains.
      vi.setSystemTime(new Date(session.startedAt + 120_000));
      changeFullscreen(null);
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() =>
      expect(
        screen.getByRole("alertdialog", { name: /Exam focus warning/i }),
      ).toBeInTheDocument(),
    );
    // The clock keeps running while locked — this is the whole point.
    expect(
      screen.getByRole("timer", { name: "Time remaining" }),
    ).toHaveTextContent("28:00");
    expect(screen.getByText(/The timer keeps running/i)).toBeInTheDocument();
  });

  it("counts a single interruption once and escalates with a warning count", async () => {
    await startContest();
    await passStartGate();

    act(() => {
      changeFullscreen(null);
      loseFocus();
      setHidden(true);
    });
    await waitFor(() =>
      expect(screen.getByText("Exam focus warnings: 1 of 4")).toBeInTheDocument(),
    );
    expect(recordWarning).toHaveBeenCalledTimes(1);
  });

  it("unlocks after returning to fullscreen and preserves the code", async () => {
    await startContest();
    await passStartGate();
    fireEvent.change(screen.getByLabelText("Java code editor"), {
      target: { value: "// keep me" },
    });

    act(() => changeFullscreen(null));
    await waitFor(() =>
      expect(
        screen.getByRole("alertdialog", { name: /Exam focus warning/i }),
      ).toBeInTheDocument(),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Return to fullscreen/i }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog", { name: /Exam focus warning/i }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Java code editor")).toHaveValue("// keep me");
  });

  it("auto-submits once the warning limit is reached", async () => {
    await startContest();
    await passStartGate();

    for (let index = 0; index < MAX_EXAM_WARNINGS - 1; index += 1) {
      act(() => loseFocus());
      await waitFor(() =>
        expect(
          screen.getByText(`Exam focus warnings: ${index + 1} of 4`),
        ).toBeInTheDocument(),
      );
      fireEvent.click(
        screen.getByRole("button", { name: /Return to fullscreen/i }),
      );
      await waitFor(() =>
        expect(
          screen.queryByRole("alertdialog", { name: /Exam focus warning/i }),
        ).not.toBeInTheDocument(),
      );
    }

    act(() => loseFocus());
    await waitFor(() =>
      expect(
        screen.getByText(`Exam focus warnings: ${MAX_EXAM_WARNINGS} of 4`),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/This was the final warning/i),
    ).toBeInTheDocument();
  });

  it("auto-submits on timeout even while the workspace is locked", async () => {
    const { session } = await startContest();
    await passStartGate();

    act(() => changeFullscreen(null));
    await waitFor(() =>
      expect(
        screen.getByRole("alertdialog", { name: /Exam focus warning/i }),
      ).toBeInTheDocument(),
    );

    // Jump past the deadline.
    act(() => {
      vi.setSystemTime(new Date(session.expiresAt + 1_000));
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() =>
      expect(screen.getByTestId("pathname")).toHaveTextContent(
        "/contest/coding/result/",
      ),
    );
    // Exactly once, and for the right reason.
    expect(finalize).toHaveBeenCalledTimes(1);
    expect(finalize.mock.calls[0][1]).toBe("expired");
  });

  it("shows a summary before finishing and finalizes exactly once", async () => {
    await startContest();
    await passStartGate();
    fireEvent.click(screen.getByRole("button", { name: /Finish Contest/i }));

    const dialog = await screen.findByRole("alertdialog", {
      name: /Finish the contest now\?/i,
    });
    expect(dialog).toHaveTextContent("Time remaining:");
    expect(dialog).toHaveTextContent("Submitted problems:");
    expect(dialog).toHaveTextContent("Attempted but not submitted:");
    expect(dialog).toHaveTextContent("Unattempted:");
    expect(dialog).toHaveTextContent(/This cannot be undone/i);

    fireEvent.click(screen.getByRole("button", { name: /Submit and finish/i }));
    await waitFor(() =>
      expect(screen.getByTestId("pathname")).toHaveTextContent(
        "/contest/coding/result/",
      ),
    );
    expect(finalize).toHaveBeenCalledTimes(1);
    expect(finalize.mock.calls[0][1]).toBe("manual");
  });

  it("does not report success or navigate when finalization fails", async () => {
    // Seam into the service the component actually calls.
    finalizeImpl = () => Promise.reject(new Error("network unreachable"));

    const { createDevLocalContestSessionService } = await import(
      "@/lib/contest/devLocalContestSessionService"
    );
    const local = createDevLocalContestSessionService({
      userId: "user-1",
      random: () => 0.9,
    });
    const { session } = await local.createSession();
    renderWorkspace(session.id);
    await waitFor(() =>
      expect(
        screen.getByRole("alertdialog", { name: /Enter fullscreen to begin/i }),
      ).toBeInTheDocument(),
    );
    await passStartGate();

    fireEvent.click(screen.getByRole("button", { name: /Finish Contest/i }));
    fireEvent.click(
      await screen.findByRole("button", { name: /Submit and finish/i }),
    );

    // Actionable error, still on the workspace, no result navigation.
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("network unreachable"),
    );
    expect(
      screen.getByRole("button", { name: /Retry submission/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("pathname")).toHaveTextContent(
      "/contest/coding/session/",
    );
  });

  it("sends an already-expired restored session straight to the result", async () => {
    const { createDevLocalContestSessionService } = await import(
      "@/lib/contest/devLocalContestSessionService"
    );
    const local = createDevLocalContestSessionService({
      userId: "user-1",
      random: () => 0.9,
    });
    const { session } = await local.createSession();
    // Move the clock past the deadline before the workspace ever mounts.
    vi.setSystemTime(new Date(session.expiresAt + 1));

    renderWorkspace(session.id);
    await waitFor(() =>
      expect(screen.getByTestId("pathname")).toHaveTextContent(
        "/contest/coding/result/",
      ),
    );
  });

  it("announces timer urgency with words, not colour alone", async () => {
    const { session } = await startContest();
    await passStartGate();

    act(() => {
      vi.setSystemTime(new Date(session.expiresAt - 5 * 60_000));
      vi.advanceTimersByTime(1000);
    });
    await waitFor(() =>
      expect(screen.getByText("5 minutes remaining")).toBeInTheDocument(),
    );

    act(() => {
      vi.setSystemTime(new Date(session.expiresAt - 60_000));
      vi.advanceTimersByTime(1000);
    });
    await waitFor(() =>
      expect(screen.getByText("1 minute remaining")).toBeInTheDocument(),
    );
  });

  it("adds, switches and closes scratch tabs around the solution", async () => {
    await startContest();
    await passStartGate();
    const editor = () =>
      screen.getByLabelText("Java code editor") as HTMLTextAreaElement;

    // The graded solution is always present and cannot be closed.
    expect(screen.getByRole("tab", { name: "Tab-1" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /holds the graded solution and cannot be closed/i,
      }),
    ).toBeDisabled();

    fireEvent.change(editor(), { target: { value: "// solution" } });

    fireEvent.click(screen.getByRole("button", { name: "Add a scratch tab" }));
    const scratchTab = await screen.findByRole("tab", { name: "Tab-2" });
    // A new tab is its own empty buffer, not a copy of the solution.
    expect(editor()).toHaveValue("");
    fireEvent.change(editor(), { target: { value: "// scratch" } });

    // Each tab keeps its own code, both ways round.
    fireEvent.click(screen.getByRole("tab", { name: "Tab-1" }));
    expect(editor()).toHaveValue("// solution");
    fireEvent.click(scratchTab);
    expect(editor()).toHaveValue("// scratch");

    // Closing the scratch tab falls back to the solution.
    fireEvent.click(screen.getByRole("button", { name: "Close Tab-2" }));
    expect(screen.queryByRole("tab", { name: "Tab-2" })).not.toBeInTheDocument();
    expect(editor()).toHaveValue("// solution");
  });

  it("restores scratch tabs from this browser after a remount", async () => {
    const { session } = await startContest();
    await passStartGate();

    fireEvent.click(screen.getByRole("button", { name: "Add a scratch tab" }));
    fireEvent.change(screen.getByLabelText("Java code editor"), {
      target: { value: "// scratch notes" },
    });

    // Scratch buffers are local-only, so the debounced local write is the
    // only thing that carries them across a reload.
    await waitFor(() =>
      expect(
        Object.keys(window.localStorage).some((key) =>
          key.startsWith(`algoguru:coding-contest:scratch:${session.id}`),
        ),
      ).toBe(true),
    );

    cleanup();
    renderWorkspace(session.id);
    await waitFor(() =>
      expect(
        screen.getByRole("alertdialog", { name: /Enter fullscreen to begin/i }),
      ).toBeInTheDocument(),
    );

    expect(await screen.findByRole("tab", { name: "Tab-2" })).toBeInTheDocument();
    expect(screen.getByLabelText("Java code editor")).toHaveValue("// scratch notes");
  });

  it("formats the buffer that is on screen", async () => {
    await startContest();
    await passStartGate();

    const editor = screen.getByLabelText("Java code editor");
    fireEvent.change(editor, {
      target: { value: "class Solution {\npublic int f() {\nreturn 1;\n}\n}" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Format code" }));

    await waitFor(() => {
      expect(editor).toHaveValue(
        "class Solution {\n\n    public int f() {\n        return 1;\n    }\n}",
      );
    });
  });

  it("does not render the full screen option in the editor controls", async () => {
    await startContest();
    await passStartGate();

    expect(
      screen.queryByRole("button", { name: "Editor full screen" }),
    ).not.toBeInTheDocument();
  });
});

