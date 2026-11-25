import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import {
  CONTEST_PATHS,
  CONTEST_ROUTES,
  CONTEST_STANDALONE_ROUTES,
  CONTEST_WORKSPACE_ROUTES,
  buildQuizRedirectHref,
} from "@/components/contest/ContestRoutes";
import { QuizLegacyRedirect } from "@/components/contest/QuizLegacyRedirect";
import QuizLegacyRedirectPage from "@/app/(standalone)/quiz/page";
import {
  NextRedirectError,
  mockRouter,
  redirectMock,
  resetNextNavigationMocks,
  setMockSearchParams,
} from "@/test/nextNavigationMock";

vi.mock("next/navigation", async () => {
  const mod = await import("@/test/nextNavigationMock");
  return mod.createNextNavigationMock();
});

beforeEach(() => {
  resetNextNavigationMocks();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Contest Next.js route manifest", () => {
  it("separates standalone exam routes from workspace shell routes", () => {
    expect(CONTEST_STANDALONE_ROUTES.map((route) => route.path)).toEqual([
      "/contest/quiz",
      "/contest/coding",
      "/contest/coding/session/[sessionId]",
      "/quiz",
    ]);
    expect(CONTEST_WORKSPACE_ROUTES.map((route) => route.path)).toEqual([
      "/contest",
      "/contest/coding/result/[sessionId]",
    ]);
    expect(CONTEST_ROUTES).toHaveLength(
      CONTEST_STANDALONE_ROUTES.length + CONTEST_WORKSPACE_ROUTES.length,
    );
  });

  it("maps every manifest entry to an App Router page file", () => {
    for (const route of CONTEST_ROUTES) {
      expect(route.appFile).toMatch(/^src\/app\/\((standalone|workspace)\)\/.+\/page\.tsx$/);
      if (route.chrome === "standalone") {
        expect(route.appFile).toContain("/(standalone)/");
      } else {
        expect(route.appFile).toContain("/(workspace)/");
      }
    }
  });

  it("builds parameterized coding session and result paths cleanly", () => {
    expect(CONTEST_PATHS.landing).toBe("/contest");
    expect(CONTEST_PATHS.quiz).toBe("/contest/quiz");
    expect(CONTEST_PATHS.codingInstructions).toBe("/contest/coding");
    expect(CONTEST_PATHS.codingSession("abc-123")).toBe(
      "/contest/coding/session/abc-123",
    );
    expect(CONTEST_PATHS.codingResult("abc-123")).toBe(
      "/contest/coding/result/abc-123",
    );
  });
});

describe("buildQuizRedirectHref (/quiz query-string forwarding contract)", () => {
  it("redirects bare /quiz to /contest/quiz without a trailing question mark", () => {
    expect(buildQuizRedirectHref()).toBe("/contest/quiz");
    expect(buildQuizRedirectHref("")).toBe("/contest/quiz");
    expect(buildQuizRedirectHref({})).toBe("/contest/quiz");
    expect(buildQuizRedirectHref(new URLSearchParams())).toBe("/contest/quiz");
  });

  it("preserves language and difficulty query params across strings, objects, and URLSearchParams", () => {
    expect(buildQuizRedirectHref("?language=java&difficulty=easy")).toBe(
      "/contest/quiz?language=java&difficulty=easy",
    );
    expect(
      buildQuizRedirectHref({ language: "java", difficulty: "easy" }),
    ).toBe("/contest/quiz?language=java&difficulty=easy");
    expect(
      buildQuizRedirectHref(new URLSearchParams("language=java&difficulty=easy")),
    ).toBe("/contest/quiz?language=java&difficulty=easy");
  });

  it("preserves arbitrary query params and multi-value arrays while dropping undefined keys", () => {
    expect(buildQuizRedirectHref({ minutes: "5" })).toBe(
      "/contest/quiz?minutes=5",
    );
    expect(
      buildQuizRedirectHref({
        language: "python",
        tag: ["arrays", "graphs"],
        empty: undefined,
      }),
    ).toBe("/contest/quiz?language=python&tag=arrays&tag=graphs");
  });
});

describe("QuizLegacyRedirect", () => {
  it("replaces /quiz with /contest/quiz when no query parameters exist", () => {
    setMockSearchParams("");
    render(<QuizLegacyRedirect />);
    expect(mockRouter.replace).toHaveBeenCalledWith("/contest/quiz");
  });

  it("forwards query parameters across the client redirect", () => {
    setMockSearchParams("language=java&difficulty=easy");
    render(<QuizLegacyRedirect />);
    expect(mockRouter.replace).toHaveBeenCalledWith(
      "/contest/quiz?language=java&difficulty=easy",
    );
  });

  it("preserves unrelated query parameters such as minutes=5", () => {
    setMockSearchParams("minutes=5");
    render(<QuizLegacyRedirect />);
    expect(mockRouter.replace).toHaveBeenCalledWith("/contest/quiz?minutes=5");
  });
});

describe("Server /quiz legacy redirect page", () => {
  it("redirects /quiz to /contest/quiz when searchParams is empty", async () => {
    await expect(
      QuizLegacyRedirectPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow(NextRedirectError);
    expect(redirectMock).toHaveBeenCalledWith("/contest/quiz");
  });

  it("forwards query parameters on server redirect", async () => {
    await expect(
      QuizLegacyRedirectPage({
        searchParams: Promise.resolve({
          language: "java",
          difficulty: "easy",
        }),
      }),
    ).rejects.toThrow(NextRedirectError);
    expect(redirectMock).toHaveBeenCalledWith(
      "/contest/quiz?language=java&difficulty=easy",
    );
  });

  it("forwards single and array params on server redirect", async () => {
    await expect(
      QuizLegacyRedirectPage({
        searchParams: Promise.resolve({ topic: ["arrays", "trees"] }),
      }),
    ).rejects.toThrow(NextRedirectError);
    expect(redirectMock).toHaveBeenCalledWith(
      "/contest/quiz?topic=arrays&topic=trees",
    );
  });
});
