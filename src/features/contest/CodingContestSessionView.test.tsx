import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { CodingContestSessionView } from "@/features/contest/CodingContestSessionView";
import { MAX_EXAM_WARNINGS } from "@/lib/examConstants";
import {
  changeFullscreen,
  installExamBrowserEnv,
  loseFocus,
  restoreExamBrowserEnv,
  setFullscreenSilently,
  setHidden,
} from "@/test/examEnv";
import {
  mockRouter,
  resetNextNavigationMocks,
  setMockParams,
} from "@/test/nextNavigationMock";

vi.mock("next/navigation", async () => {
  const mod = await import("@/test/nextNavigationMock");
  return mod.createNextNavigationMock();
});
vi.mock("next/link", async () => {
  const mod = await import("@/test/nextNavigationMock");
  return mod.createNextLinkMock();
});

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

const finalize =
  vi.fn<(sessionId: string, reason: string) => Promise<unknown>>();
const saveDraft =
  vi.fn<(s: string, p: string, c: string) => Promise<unknown>>();
const recordWarning = vi.fn<(s: string, r: string) => Promise<unknown>>();

vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useAuth: () => ({
    session: { user: { id: "user-1" } },
    user: { id: "user-1", email: "learner@example.com" },
    profile: null,
    resolvedAvatar: null,
    loading: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

let finalizeImpl: ((s: string, r: string) => Promise<unknown>) | null = null;

vi.mock("@/lib/contest/contestServices", async () => {
  const { createDevLocalContestSessionService } =
    await import("@/lib/contest/devLocalContestSessionService");
  return {
    resolveContestSessionService: () => {
      const local = createDevLocalContestSessionService({
        userId: "user-1",
        random: () => 0.9,
      });
      return {
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
    },
  };
});

const SESSION_ID = "session-under-test";

function renderWorkspace(sessionId = SESSION_ID) {
  setMockParams({ sessionId });
  return render(<CodingContestSessionView />);
}

async function startContest() {
  const { createDevLocalContestSessionService } =
    await import("@/lib/contest/devLocalContestSessionService");
  const local = createDevLocalContestSessionService({
    userId: "user-1",
    random: () => 0.9,
  });
  const { session } = await local.createSession();
  const utils = renderWorkspace(session.id);
  await waitFor(() =>
    expect(
      screen.getByRole("alertdialog", { name: /Enter fullscreen to begin/i }),
    ).toBeInTheDocument(),
  );
  return { ...utils, session, service: local };
}

async function passStartGate() {
  fireEvent.click(
    screen.getByRole("button", { name: /Enter fullscreen and start/i }),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("alertdialog", { name: /Enter fullscreen to begin/i }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Java code editor")).toBeInTheDocument(),
  );
}

function stubRunner(makeReply: () => Record<string, unknown>) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => makeReply(),
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock as unknown as ReturnType<typeof vi.fn>;
}

function caseLine(index: number, actual: string, captured = ""): string {
  const encode = (value: string) => {
    if (!value) return "-";
    let binary = "";
    for (const char of new TextEncoder().encode(value))
      binary += String.fromCharCode(char);
    return btoa(binary);
  };
  return `@@CASE ${index} OK ${encode(actual)} ${encode(captured)}`;
}

function contestSetTrigger() {
  return screen.getByRole("button", { name: /Contest set/i });
}

function openQuestionMenu() {
  const trigger = contestSetTrigger();
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  return trigger;
}

function questionMenuItems() {
  return screen
    .getAllByRole("menuitem")
    .filter((item) => item.getAttribute("aria-label")?.startsWith("Problem "));
}

beforeEach(async () => {
  resetNextNavigationMocks();
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
  vi.unstubAllGlobals();
});

describe("CodingContestSessionView", () => {
  it("gates the start behind fullscreen and shows no countdown before it", async () => {
    await startContest();
    expect(
      screen.getByRole("alertdialog", { name: /Enter fullscreen to begin/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("timer", { name: "Time remaining", hidden: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("alertdialog", { name: /Enter fullscreen to begin/i }),
    ).toHaveTextContent("30 minutes");
  });

  it("keeps the pre-start fullscreen gate focused and non-dismissible", async () => {
    await startContest();
    const action = screen.getByRole("button", {
      name: /Enter fullscreen and start/i,
    });
    const gate = screen.getByRole("alertdialog", {
      name: /Enter fullscreen to begin/i,
    });

    expect(action).toHaveFocus();
    expect(
      screen
        .getByRole("timer", { name: "Time remaining", hidden: true })
        .closest('[aria-hidden="true"]'),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.pointerDown(document.body);

    expect(gate).toBeInTheDocument();
    expect(action).toHaveFocus();
  });

  it("starts the countdown only after fullscreen succeeds", async () => {
    const { session } = await startContest();
    await passStartGate();

    expect(session.expiresAt - session.startedAt).toBe(30 * 60 * 1000);
    expect(
      screen.getByRole("timer", { name: "Time remaining" }),
    ).toHaveTextContent("30:00");
  });

  it("assigns two or three distinct problems as accessible menu items", async () => {
    await startContest();
    await passStartGate();
    openQuestionMenu();

    expect(screen.getByRole("menu")).toBeInTheDocument();
    const items = questionMenuItems();
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.length).toBeLessThanOrEqual(3);
    for (const item of items) {
      expect(item.getAttribute("aria-label")).toMatch(
        /^Problem [1-9]\d*: [^.]+\. (Not visited|Viewed|Code edited|Run attempted|Visible tests passed|Submitted)$/,
      );
    }
  });

  it("marks only the initial active problem as viewed", async () => {
    await startContest();
    await passStartGate();
    openQuestionMenu();

    const items = questionMenuItems();
    expect(items[0]).toHaveAccessibleName(/\. Viewed$/);
    for (const item of items.slice(1)) {
      expect(item).toHaveAccessibleName(/\. Not visited$/);
    }
  });

  it("opens from the keyboard, navigates, activates, and restores trigger focus", async () => {
    await startContest();
    await passStartGate();
    const trigger = contestSetTrigger();
    trigger.focus();

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const items = questionMenuItems();
    expect(items[0]).toHaveFocus();

    fireEvent.keyDown(items[0], { key: "ArrowDown" });
    await waitFor(() => expect(items[1]).toHaveFocus());

    fireEvent.keyDown(items[1], { key: "Enter" });
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveTextContent(`Contest set 2 / ${items.length}`);
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("dismisses with Escape and returns focus to the trigger", async () => {
    await startContest();
    await passStartGate();
    const trigger = contestSetTrigger();
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const item = questionMenuItems()[0];
    expect(item).toHaveFocus();

    fireEvent.keyDown(item, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("dismisses on an outside pointer press", async () => {
    await startContest();
    await passStartGate();
    openQuestionMenu();
    expect(screen.getByRole("menu")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(0));

    fireEvent.pointerDown(document.body, { button: 0, ctrlKey: false });
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
  });

  it("opens the full question list from the menu and focuses its active question", async () => {
    await startContest();
    await passStartGate();
    const trigger = openQuestionMenu();

    fireEvent.click(
      screen.getByRole("menuitem", { name: /View all questions/i }),
    );
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    const list = screen.getByRole("navigation", {
      name: "Contest question list",
    });
    const activeQuestion = within(list).getByRole("button", {
      name: /Resume question 1:/,
    });
    await waitFor(() => expect(activeQuestion).toHaveFocus());
    expect(trigger).not.toHaveFocus();
  });

  it("disables the question menu while the exam is locked", async () => {
    await startContest();
    await passStartGate();
    const trigger = contestSetTrigger();

    act(() => changeFullscreen(null));
    await screen.findByRole("alertdialog", { name: /Exam focus warning/i });

    expect(trigger).toBeDisabled();
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("exposes a focusable splitter between the statement and the workspace", async () => {
    await startContest();
    await passStartGate();

    const splitter = screen.getByRole("separator", {
      name: /Resize the problem description and coding workspace panels/i,
    });
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

    expect(
      screen.getByRole("button", { name: /Expand results/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Run code/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Run code/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Collapse results/i }),
      ).toBeInTheDocument(),
    );
  });

  it("keeps the question menu out of the page until it is asked for", async () => {
    await startContest();
    await passStartGate();

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    openQuestionMenu();
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.click(questionMenuItems()[0]);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps an independent draft per problem", async () => {
    await startContest();
    await passStartGate();
    const editor = () =>
      screen.getByLabelText("Java code editor") as HTMLTextAreaElement;

    fireEvent.change(editor(), { target: { value: "// first problem" } });
    expect(editor()).toHaveValue("// first problem");

    openQuestionMenu();
    fireEvent.click(questionMenuItems()[1]);
    expect(editor().value).not.toBe("// first problem");
    fireEvent.change(editor(), { target: { value: "// second problem" } });

    openQuestionMenu();
    fireEvent.click(questionMenuItems()[0]);
    expect(editor()).toHaveValue("// first problem");
  });

  it("marks an edited problem as Code edited in the question menu", async () => {
    await startContest();
    await passStartGate();
    openQuestionMenu();
    const items = questionMenuItems();
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
    await waitFor(() => expect(saveDraft).toHaveBeenCalled());

    cleanup();
    setFullscreenSilently(null);
    // A fresh mount stands in for a page refresh on the same session.
    renderWorkspace(session.id);
    await waitFor(() =>
      expect(
        screen.getByRole("alertdialog", { name: /Enter fullscreen to begin/i }),
      ).toBeInTheDocument(),
    );
    expect(await screen.findByLabelText("Java code editor")).toHaveValue(
      "// persisted draft",
    );
  });

  it("shows a compile failure state without inventing a test pass", async () => {
    stubRunner(() => ({
      status: "1",
      compiler_error:
        "prog.java:3: error: reached end of file while parsing\n1 error",
      compiler_message: "",
      program_output: "",
      program_error: "",
    }));
    await startContest();
    await passStartGate();
    const editor = screen.getByLabelText("Java code editor");
    fireEvent.change(editor, {
      target: { value: "class Solution { public int f() { return 1; }" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run code/i }));

    await waitFor(() =>
      expect(screen.getByText("Compilation problems")).toBeInTheDocument(),
    );
    expect(screen.getByText("Compile error")).toBeInTheDocument();
    expect(screen.queryByText("Accepted")).not.toBeInTheDocument();
    expect(screen.getByText(/no score is recorded/i)).toBeInTheDocument();
  });

  it("really runs the learner's code and reports the visible cases", async () => {
    const fetchMock = stubRunner(() => ({
      status: "0",
      compiler_error: "",
      compiler_message: "",
      program_output: [
        caseLine(0, "0 1"),
        caseLine(1, "1 2"),
        caseLine(2, "2 3"),
      ].join("\n"),
      program_error: "",
    }));
    await startContest();
    await passStartGate();
    fireEvent.change(screen.getByLabelText("Java code editor"), {
      target: {
        value:
          "class Solution { public int[] twoSum(int[] n, int t) { return new int[0]; } }",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run code/i }));

    await waitFor(() =>
      expect(screen.getByText("Accepted")).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(
      String((fetchMock.mock.calls[0][1] as RequestInit).body),
    ) as { code: string };
    expect(sent.code).toContain("return new int[0];");
    expect(screen.getByText(/3 of 3 visible tests passed/)).toBeInTheDocument();
    expect(screen.getByText(/no score is recorded/i)).toBeInTheDocument();
  });

  it("keeps a partially passing run as Run attempted", async () => {
    stubRunner(() => ({
      status: "0",
      compiler_error: "",
      compiler_message: "",
      program_output: caseLine(0, "0 1"),
      program_error: "",
    }));
    await startContest();
    await passStartGate();
    fireEvent.click(screen.getByRole("button", { name: /Run code/i }));

    await waitFor(() =>
      expect(screen.getByText(/1 of 3 visible tests passed/)).toBeInTheDocument(),
    );
    openQuestionMenu();
    expect(questionMenuItems()[0]).toHaveAccessibleName(/\. Run attempted$/);
    expect(questionMenuItems()[0]).not.toHaveAccessibleName(
      /\. Visible tests passed$/,
    );
  });

  it("offers a retry when the runner is unreachable", async () => {
    stubRunner(() => {
      throw new Error("network down");
    });
    await startContest();
    await passStartGate();
    fireEvent.click(screen.getByRole("button", { name: /Run code/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Execution unavailable/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
    expect(screen.queryByText("Accepted")).not.toBeInTheDocument();
    openQuestionMenu();
    expect(questionMenuItems()[0]).toHaveAccessibleName(/\. Run attempted$/);
  });

  it("locks the workspace on fullscreen loss but keeps the timer running", async () => {
    const { session } = await startContest();
    await passStartGate();
    expect(
      screen.getByRole("timer", { name: "Time remaining" }),
    ).toHaveTextContent("30:00");

    act(() => {
      vi.setSystemTime(new Date(session.startedAt + 120_000));
      changeFullscreen(null);
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() =>
      expect(
        screen.getByRole("alertdialog", { name: /Exam focus warning/i }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("timer", { name: "Time remaining", hidden: true }),
    ).toHaveTextContent("28:00");
    expect(screen.getByText(/The timer keeps running/i)).toBeInTheDocument();
  });

  it("keeps the integrity lock focused and non-dismissible", async () => {
    await startContest();
    await passStartGate();

    act(() => changeFullscreen(null));
    const lock = await screen.findByRole("alertdialog", {
      name: /Exam focus warning/i,
    });
    const action = screen.getByRole("button", {
      name: /Return to fullscreen/i,
    });

    expect(action).toHaveFocus();
    expect(
      screen
        .getByLabelText("Java code editor")
        .closest('[aria-hidden="true"]'),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.pointerDown(document.body);

    expect(lock).toBeInTheDocument();
    expect(action).toHaveFocus();
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
      expect(
        screen.getByText("Exam focus warnings: 1 of 4"),
      ).toBeInTheDocument(),
    );
    expect(recordWarning).toHaveBeenCalledTimes(1);
  });

  it("unlocks after returning to fullscreen and preserves the code", async () => {
    await startContest();
    await passStartGate();
    const editor = screen.getByLabelText("Java code editor");
    editor.focus();
    fireEvent.change(editor, {
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
    expect(editor).toHaveValue("// keep me");
    expect(editor).toHaveFocus();
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
    expect(screen.getByText(/This was the final warning/i)).toBeInTheDocument();
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

    act(() => {
      vi.setSystemTime(new Date(session.expiresAt + 1_000));
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith(
        `/contest/coding/result/${session.id}`,
      ),
    );
    expect(finalize).toHaveBeenCalledTimes(1);
    expect(finalize.mock.calls[0][1]).toBe("expired");
  });

  it("shows a summary before finishing and finalizes exactly once", async () => {
    const { session } = await startContest();
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
      expect(mockRouter.push).toHaveBeenCalledWith(
        `/contest/coding/result/${session.id}`,
      ),
    );
    expect(finalize).toHaveBeenCalledTimes(1);
    expect(finalize.mock.calls[0][1]).toBe("manual");
  });

  it("does not report success or navigate when finalization fails", async () => {
    finalizeImpl = () => Promise.reject(new Error("network unreachable"));

    const { createDevLocalContestSessionService } =
      await import("@/lib/contest/devLocalContestSessionService");
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

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "network unreachable",
      ),
    );
    expect(
      screen.getByRole("button", { name: /Retry submission/i }),
    ).toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("sends an already-expired restored session straight to the result", async () => {
    const { createDevLocalContestSessionService } =
      await import("@/lib/contest/devLocalContestSessionService");
    const local = createDevLocalContestSessionService({
      userId: "user-1",
      random: () => 0.9,
    });
    const { session } = await local.createSession();
    vi.setSystemTime(new Date(session.expiresAt + 1));

    renderWorkspace(session.id);
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/contest/coding/result/${session.id}`,
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

    expect(screen.getByRole("tab", { name: "Tab-1" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /holds the graded solution and cannot be closed/i,
      }),
    ).toBeDisabled();

    fireEvent.change(editor(), { target: { value: "// solution" } });

    fireEvent.click(screen.getByRole("button", { name: "Add a scratch tab" }));
    const scratchTab = await screen.findByRole("tab", { name: "Tab-2" });
    expect(editor()).toHaveValue("");
    fireEvent.change(editor(), { target: { value: "// scratch" } });

    fireEvent.click(screen.getByRole("tab", { name: "Tab-1" }));
    expect(editor()).toHaveValue("// solution");
    fireEvent.click(scratchTab);
    expect(editor()).toHaveValue("// scratch");

    fireEvent.click(screen.getByRole("button", { name: "Close Tab-2" }));
    expect(
      screen.queryByRole("tab", { name: "Tab-2" }),
    ).not.toBeInTheDocument();
    expect(editor()).toHaveValue("// solution");
  });

  it("restores scratch tabs from this browser after a remount", async () => {
    const { session } = await startContest();
    await passStartGate();

    fireEvent.click(screen.getByRole("button", { name: "Add a scratch tab" }));
    fireEvent.change(screen.getByLabelText("Java code editor"), {
      target: { value: "// scratch notes" },
    });

    await waitFor(() =>
      expect(
        Object.keys(window.localStorage).some((key) =>
          key.startsWith(`algoguru:coding-contest:scratch:${session.id}`),
        ),
      ).toBe(true),
    );

    cleanup();
    setFullscreenSilently(null);
    // A fresh mount stands in for a page refresh on the same session.
    renderWorkspace(session.id);
    await waitFor(() =>
      expect(
        screen.getByRole("alertdialog", { name: /Enter fullscreen to begin/i }),
      ).toBeInTheDocument(),
    );

    expect(
      await screen.findByRole("tab", { name: "Tab-2", hidden: true }),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText("Java code editor")).toHaveValue(
      "// scratch notes",
    );
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
  }, 20_000);

  it("does not render the full screen option in the editor controls", async () => {
    await startContest();
    await passStartGate();

    expect(
      screen.queryByRole("button", { name: "Editor full screen" }),
    ).not.toBeInTheDocument();
  });
});
