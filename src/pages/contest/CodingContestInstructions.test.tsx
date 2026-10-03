import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import CodingContestInstructions from "@/pages/contest/CodingContestInstructions";

const createSession = vi.fn();
const getSession = vi.fn();
const saveDraft = vi.fn();
const recordWarning = vi.fn();
const finalize = vi.fn();
const getResult = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

// Deterministic 3-problem assignment, and a localStorage-backed session so the
// happy path runs without a deployed backend.
vi.mock("@/lib/contest/contestServices", async () => {
  const { createDevLocalContestSessionService } = await import(
    "@/lib/contest/devLocalContestSessionService"
  );
  const { ContestServiceError } = await import("@/lib/contest/sessionService");
  return {
    resolveContestSessionService: (mode: string, userId: string) => {
      const local = createDevLocalContestSessionService({
        userId,
        random: () => 0.9,
      });
      if (mode === "local") return local;
      // Stand-in for the real edge function, which is not deployed in CI.
      return {
        ...local,
        getSession: async () => {
          throw new ContestServiceError("unavailable", "Function not found.");
        },
        createSession: async () => {
          throw new ContestServiceError("unavailable", "Function not found.");
        },
      };
    },
  };
});

const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="pathname">{location.pathname}</div>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/contest/coding"]} future={ROUTER_FUTURE}>
      <LocationProbe />
      <Routes>
        <Route
          path="/contest/coding"
          element={<CodingContestInstructions />}
        />
        <Route
          path="/contest/coding/session/:sessionId"
          element={<div>workspace</div>}
        />
        <Route path="/contest" element={<div>landing</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const ACK_LABEL = "I have read and understood the contest rules";

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("CodingContestInstructions", () => {
  it("lists the rules a learner must read before starting", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "Java Coding Contest" }),
    ).toBeInTheDocument();
    for (const rule of [
      "Java only",
      "30 minutes time limit",
      "Visible samples and hidden tests",
      "Automatic submission at zero",
      "Code is saved per problem",
      "Fullscreen is required",
      "Focus and tab-switch policy",
      "Compilation and execution limits",
      "Scoring",
      "Final submission is final",
    ]) {
      expect(screen.getByText(rule)).toBeInTheDocument();
    }
  });

  it("disables Start Contest until the rules are acknowledged", () => {
    renderPage();
    const start = screen.getByRole("button", { name: /Start Contest/i });
    expect(start).toBeDisabled();
    expect(
      screen.getByText(/Tick the acknowledgement above/i),
    ).toBeInTheDocument();
  });

  it("enables Start Contest once the acknowledgement is ticked", () => {
    renderPage();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: /Start Contest/i })).toBeEnabled();
  });

  it("does not create a session before the final confirmation", () => {
    renderPage();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Start Contest/i }));
    // The confirmation dialog is now open, but nothing has been created yet.
    expect(
      screen.getByRole("alertdialog", {
        name: /Start the Java coding contest\?/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This cannot be undone once started/i),
    ).toBeInTheDocument();
  });

  it("creates the session only after the confirmation is accepted", async () => {
    const ACTIVE_POINTER = "algoguru:coding-contest:active-session";
    renderPage();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Start Contest/i }));

    // Dialog open, nothing persisted yet.
    expect(window.localStorage.getItem(ACTIVE_POINTER)).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /Confirm and start/i }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("pathname")).toHaveTextContent(
        "/contest/coding/session/",
      ),
    );

    // A real session now exists, with a 30-minute absolute deadline.
    const sessionId = window.localStorage.getItem(ACTIVE_POINTER);
    expect(sessionId).toBeTruthy();
    const row = JSON.parse(
      window.localStorage.getItem(
        `algoguru:coding-contest:session:${sessionId}`,
      ) as string,
    );
    expect(row.session.expiresAt - row.session.startedAt).toBe(30 * 60 * 1000);
    expect(row.session.problemIds.length).toBeGreaterThanOrEqual(2);
    expect(row.session.problemIds.length).toBeLessThanOrEqual(3);
  });

  it("does not create a session when the confirmation is dismissed", () => {
    renderPage();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Start Contest/i }));
    fireEvent.click(screen.getByRole("button", { name: /Not yet/i }));
    expect(
      screen.queryByRole("alertdialog", {
        name: /Start the Java coding contest\?/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start Contest/i })).toBeEnabled();
  });

  it("states the fullscreen requirement and that the timer does not pause", () => {
    renderPage();
    expect(
      screen.getByText(/The timer does not pause/i),
    ).toBeInTheDocument();
  });

  it("offers a way back to the contest landing", () => {
    renderPage();
    const back = screen.getByRole("link", { name: /Return to Contest/i });
    expect(back).toHaveAttribute("href", "/contest");
  });

  it("never dead-ends when the session backend is unreachable", async () => {
    renderPage();
    // The probe finds no backend and says so without blocking the exam.
    await waitFor(() =>
      expect(screen.getByText(/not authoritative/i)).toBeInTheDocument(),
    );
    // Crucially: the start flow is still usable.
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: /Start Contest/i })).toBeEnabled();
  });

  it("still creates a real session and navigates when the backend is down", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/not authoritative/i)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Start Contest/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Confirm and start/i }));

    await waitFor(() =>
      expect(screen.getByTestId("pathname")).toHaveTextContent(
        "/contest/coding/session/",
      ),
    );
    expect(window.localStorage.getItem("algoguru:coding-contest:active-session"))
      .toBeTruthy();
  });

  it("states plainly that the session is not authoritative", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/not authoritative/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Hidden tests do not run, so no score from this session counts/i),
    ).toBeInTheDocument();
  });

  it("offers a backend retry so the exam upgrades once deployed", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/not authoritative/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: /Retry backend/i }),
    ).toBeInTheDocument();
  });

  it("no longer shows the dead-end error", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/not authoritative/i)).toBeInTheDocument(),
    );
    expect(
      screen.queryByText(/backend is not reachable, so a session cannot be created/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Continue in local practice mode/i }),
    ).not.toBeInTheDocument();
  });
});
