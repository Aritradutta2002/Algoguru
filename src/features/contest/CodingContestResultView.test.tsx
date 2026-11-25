import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CodingContestResultView } from "@/features/contest/CodingContestResultView";
import { CODING_FINALIZATION_LABELS } from "@/lib/contest/types";
import {
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

const START = new Date("2026-09-30T12:00:00Z").getTime();

vi.mock("@/lib/contest/contestServices", async () => {
  const { PUBLIC_JAVA_PROBLEMS } = await import(
    "@/lib/codingContest/javaProblemBank"
  );
  const problems = PUBLIC_JAVA_PROBLEMS.filter((p) => p.isPublished).slice(0, 2);
  const state = { status: "finalized", reason: "expired", withResults: true };

  return {
    resolveContestSessionService: () => ({
      createSession: async () => {
        throw new Error("unused");
      },
      getSession: async () => {
        throw new Error("unused");
      },
      saveDraft: async () => {},
      recordWarning: async () => {
        throw new Error("unused");
      },
      finalize: async () => {
        throw new Error("unused");
      },
      getResult: async () => {
        const finalized = state.status === "finalized";
        return {
          authoritative: true,
          problems,
          results: state.withResults
            ? [
                {
                  problemId: problems[0].id,
                  title: problems[0].title,
                  difficulty: problems[0].difficulty,
                  submitted: true,
                  solved: true,
                  passed: 4,
                  total: 4,
                  submittedCode: "class Solution { /* submitted java */ }",
                },
                {
                  problemId: problems[1].id,
                  title: problems[1].title,
                  difficulty: problems[1].difficulty,
                  submitted: false,
                  solved: false,
                  passed: 0,
                  total: 5,
                  submittedCode: null,
                },
              ]
            : [],
          session: {
            id: "session-1",
            userId: "user-1",
            language: "java",
            problemIds: problems.map((p) => p.id),
            startedAt: START,
            expiresAt: START + 30 * 60_000,
            durationSeconds: 1800,
            status: state.status,
            warningCount: 1,
            submittedAt: finalized ? START + 9 * 60_000 : null,
            finalizationReason: finalized ? state.reason : null,
            totalScore: finalized ? 1 : null,
            problemsSolved: finalized ? 1 : null,
            testsPassed: finalized ? 4 : null,
            testsTotal: finalized ? 9 : null,
            createdAt: START,
          },
        };
      },
    }),
    __setResultState: (next: Partial<typeof state>) => Object.assign(state, next),
  };
});

async function setResultState(next: Record<string, unknown>) {
  const module = (await import("@/lib/contest/contestServices")) as unknown as {
    __setResultState: (next: Record<string, unknown>) => void;
  };
  module.__setResultState(next);
}

function renderResult() {
  setMockParams({ sessionId: "session-1" });
  return render(<CodingContestResultView />);
}

beforeEach(async () => {
  resetNextNavigationMocks();
  await setResultState({ status: "finalized", reason: "expired", withResults: true });
});

afterEach(cleanup);

describe("CodingContestResultView", () => {
  it("reports the score, solved count, tests and time used", async () => {
    renderResult();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Contest complete" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("4 / 9")).toBeInTheDocument();
    expect(screen.getByText("09:00")).toBeInTheDocument();
  });

  it("explains why the contest ended in words, not only a status token", async () => {
    renderResult();
    await screen.findByRole("heading", { level: 1, name: "Contest complete" });
    expect(
      screen.getAllByText(CODING_FINALIZATION_LABELS.expired).length,
    ).toBeGreaterThan(0);
  });

  it("lists a per-problem result for every assigned problem", async () => {
    renderResult();
    await screen.findByRole("heading", { level: 1, name: "Contest complete" });
    expect(screen.getByText("Solved")).toBeInTheDocument();
    expect(screen.getByText("Not submitted")).toBeInTheDocument();
    expect(screen.getByText("4 of 4 tests passed")).toBeInTheDocument();
    expect(screen.getByText("0 of 5 tests passed")).toBeInTheDocument();
  });

  it("offers the submitted Java code when policy permits", async () => {
    renderResult();
    await screen.findByRole("heading", { level: 1, name: "Contest complete" });
    expect(
      screen.getByText("View submitted Java code"),
    ).toBeInTheDocument();
  });

  it("never exposes hidden test data or reference solutions", async () => {
    const { container } = renderResult();
    await screen.findByRole("heading", { level: 1, name: "Contest complete" });
    const html = container.innerHTML;
    expect(html).not.toContain("hiddenTestCases");
    expect(html).not.toContain("referenceSolution");
    expect(html).not.toContain("expectedOutput");
    expect(html).not.toContain("hidden-1");
  });

  it("shows a processing state instead of scores while evaluation runs", async () => {
    await setResultState({ status: "processing" });
    renderResult();
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Evaluating your submission",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/still being evaluated/i)).toBeInTheDocument();
    expect(screen.queryByText("1 / 2")).not.toBeInTheDocument();
  });

  it("offers a return to contest action", async () => {
    renderResult();
    await screen.findByRole("heading", { level: 1, name: "Contest complete" });
    const links = screen.getAllByRole("link", { name: /Return to Contest/i });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).toHaveAttribute("href", "/contest");
  });

  it("allows another contest only once this one is finalized", async () => {
    renderResult();
    await screen.findByRole("heading", { level: 1, name: "Contest complete" });
    expect(
      screen.getByRole("link", { name: /Start another contest/i }),
    ).toHaveAttribute("href", "/contest/coding");

    cleanup();
    await setResultState({ status: "processing" });
    renderResult();
    await screen.findByRole("heading", {
      level: 1,
      name: "Evaluating your submission",
    });
    expect(
      screen.queryByRole("link", { name: /Start another contest/i }),
    ).not.toBeInTheDocument();
  });
});
