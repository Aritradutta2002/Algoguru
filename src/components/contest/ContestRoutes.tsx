/**
 * Route manifest and URL helpers for the Contest & Quiz subsystem.
 *
 * Kept framework-light and isomorphic so both Next.js Server Components (e.g.
 * `/quiz` server redirect) and Client Components (`QuizLegacyRedirect`, tests)
 * can share the exact routing contract without importing a client router or
 * pulling page chunks into tests.
 */

export type ContestRouteChrome = "standalone" | "workspace";

export interface ContestRouteEntry {
  id: string;
  path: string;
  chrome: ContestRouteChrome;
  appFile: string;
  description: string;
  legacyRedirectTo?: string;
}

export const CONTEST_PATHS = {
  landing: "/contest",
  quiz: "/contest/quiz",
  quizLegacy: "/quiz",
  codingInstructions: "/contest/coding",
  codingSession: (sessionId: string) =>
    `/contest/coding/session/${encodeURIComponent(sessionId)}`,
  codingResult: (sessionId: string) =>
    `/contest/coding/result/${encodeURIComponent(sessionId)}`,
} as const;

/**
 * Chrome-free routes: the exam screens, the instructions run-up, and the
 * legacy `/quiz` redirect. Served under `src/app/(standalone)/`.
 */
export const CONTEST_STANDALONE_ROUTES: readonly ContestRouteEntry[] = [
  {
    id: "contest-quiz",
    path: "/contest/quiz",
    chrome: "standalone",
    appFile: "src/app/(standalone)/contest/quiz/page.tsx",
    description: "Fullscreen MCQ Quiz setup, live exam, and results review",
  },
  {
    id: "contest-coding-instructions",
    path: "/contest/coding",
    chrome: "standalone",
    appFile: "src/app/(standalone)/contest/coding/page.tsx",
    description: "Java coding contest rules, backend probe, and start gate",
  },
  {
    id: "contest-coding-session",
    path: "/contest/coding/session/[sessionId]",
    chrome: "standalone",
    appFile: "src/app/(standalone)/contest/coding/session/[sessionId]/page.tsx",
    description: "Active fullscreen Java coding contest workspace",
  },
  {
    id: "quiz-legacy",
    path: "/quiz",
    chrome: "standalone",
    appFile: "src/app/(standalone)/quiz/page.tsx",
    description: "Legacy MCQ route redirecting with query string preserved",
    legacyRedirectTo: "/contest/quiz",
  },
] as const;

/**
 * Routes hosted inside the Workspace shell (`src/app/(workspace)/`).
 */
export const CONTEST_WORKSPACE_ROUTES: readonly ContestRouteEntry[] = [
  {
    id: "contest-landing",
    path: "/contest",
    chrome: "workspace",
    appFile: "src/app/(workspace)/contest/page.tsx",
    description: "Contest landing surface presenting MCQ and Coding modes",
  },
  {
    id: "contest-coding-result",
    path: "/contest/coding/result/[sessionId]",
    chrome: "workspace",
    appFile: "src/app/(workspace)/contest/coding/result/[sessionId]/page.tsx",
    description: "Post-contest evaluation summary and per-problem results",
  },
] as const;

export const CONTEST_ROUTES: readonly ContestRouteEntry[] = [
  ...CONTEST_STANDALONE_ROUTES,
  ...CONTEST_WORKSPACE_ROUTES,
] as const;

export type QuizSearchParamsInput =
  | string
  | URLSearchParams
  | { toString(): string }
  | Record<string, string | string[] | undefined>
  | null
  | undefined;

/**
 * Build the destination `/contest/quiz` href from Next.js `searchParams` or a
 * `URLSearchParams`/query string, preserving all query parameters such as
 * `?language=java&difficulty=easy`.
 */
export function buildQuizRedirectHref(searchParams?: QuizSearchParamsInput): string {
  if (!searchParams) {
    return CONTEST_PATHS.quiz;
  }

  let qs = "";

  if (typeof searchParams === "string") {
    const trimmed = searchParams.startsWith("?")
      ? searchParams.slice(1)
      : searchParams;
    qs = new URLSearchParams(trimmed).toString();
  } else if (
    searchParams instanceof URLSearchParams ||
    typeof (searchParams as { getAll?: unknown }).getAll === "function"
  ) {
    qs = searchParams.toString();
  } else {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(
      searchParams as Record<string, string | string[] | undefined>,
    )) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== undefined) params.append(key, item);
        }
      } else {
        params.append(key, value);
      }
    }
    qs = params.toString();
  }

  return qs ? `${CONTEST_PATHS.quiz}?${qs}` : CONTEST_PATHS.quiz;
}
