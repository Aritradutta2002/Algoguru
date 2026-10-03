import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import {
  contestAppRoutes,
  contestStandaloneRoutes,
} from "@/components/contest/ContestRoutes";
import {
  installExamBrowserEnv,
  restoreExamBrowserEnv,
} from "@/test/examEnv";

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

const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

/**
 * Rendered as a SIBLING of `<Routes>`, not as a catch-all inside it. A catch-all
 * would be shadowed by the real `/contest/quiz` route, which is exactly the
 * route the legacy redirect targets.
 */
function LocationProbe() {
  const location = useLocation();
  return (
    <div>
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="search">{location.search}</span>
    </div>
  );
}

function renderAt(path: string, routes: React.ReactElement[]) {
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE}>
      <LocationProbe />
      <Routes>{routes}</Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  installExamBrowserEnv();
});

afterEach(() => {
  cleanup();
  restoreExamBrowserEnv();
  vi.restoreAllMocks();
});

describe("Contest route table", () => {
  it("redirects /quiz to /contest/quiz", () => {
    renderAt("/quiz", contestStandaloneRoutes());
    expect(screen.getByTestId("pathname")).toHaveTextContent("/contest/quiz");
    // And the MCQ flow is what actually rendered at the destination.
    expect(
      screen.getByRole("heading", { name: "Build your challenge" }),
    ).toBeInTheDocument();
  });

  it("keeps the query string across the /quiz redirect", () => {
    renderAt("/quiz?language=java&difficulty=easy", contestStandaloneRoutes());
    // A bare <Navigate to="/contest/quiz"> would have dropped this.
    expect(screen.getByTestId("pathname")).toHaveTextContent("/contest/quiz");
    expect(screen.getByTestId("search")).toHaveTextContent(
      "?language=java&difficulty=easy",
    );
  });

  it("preserves an unrelated query parameter on the legacy route", () => {
    renderAt("/quiz?minutes=5", contestStandaloneRoutes());
    expect(screen.getByTestId("search")).toHaveTextContent("?minutes=5");
  });

  it("renders the existing MCQ flow at /contest/quiz", () => {
    renderAt("/contest/quiz?language=java&difficulty=easy", contestStandaloneRoutes());
    // The MCQ setup page's own heading — proves the existing component is what
    // now answers at the new path.
    expect(
      screen.getByRole("heading", { name: "Build your challenge" }),
    ).toBeInTheDocument();
  });

  it("preselects the MCQ language and difficulty from the redirected query", () => {
    // The regression that a lost query string would cause: java/easy arriving
    // as the "mixed" defaults instead.
    renderAt("/quiz?language=java&difficulty=easy", contestStandaloneRoutes());
    const language = screen.getByLabelText("Language") as HTMLSelectElement;
    const difficulty = screen.getByLabelText("Difficulty") as HTMLSelectElement;
    expect(language.value).toBe("java");
    expect(difficulty.value).toBe("easy");
  });

  it("does not let the legacy redirect hijack /contest/quiz", () => {
    renderAt("/contest/quiz", contestStandaloneRoutes());
    expect(screen.getByTestId("pathname")).toHaveTextContent("/contest/quiz");
    expect(
      screen.getByRole("heading", { name: "Build your challenge" }),
    ).toBeInTheDocument();
  });

  it("matches the coding session param route", () => {
    renderAt("/contest/coding/session/abc-123", contestStandaloneRoutes());
    expect(screen.getByTestId("pathname")).toHaveTextContent(
      "/contest/coding/session/abc-123",
    );
    // The session page's own loader proves this param route matched rather than
    // falling through.
    expect(screen.getByRole("status")).toHaveTextContent("Loading your contest");
  });

  it("renders the landing page at /contest in the app route group", () => {
    renderAt("/contest", contestAppRoutes());
    expect(
      screen.getByRole("heading", { level: 1, name: "Contest" }),
    ).toBeInTheDocument();
  });

  it("renders the instructions page at /contest/coding without the app shell", () => {
    renderAt("/contest/coding", contestStandaloneRoutes());
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Java Coding Contest",
      }),
    ).toBeInTheDocument();
    // Chrome-free: the page owns its full-height background rather than
    // inheriting the AppLayout shell.
    expect(document.querySelector(".min-h-screen")).toBeTruthy();
  });

  it("keeps the contest landing page in the app shell", () => {
    renderAt("/contest", contestAppRoutes());
    expect(
      screen.getByRole("heading", { level: 1, name: "Contest" }),
    ).toBeInTheDocument();
  });

  it("does not route /contest/coding into a topic page", () => {
    render(
      <MemoryRouter initialEntries={["/contest/coding"]} future={ROUTER_FUTURE}>
        <LocationProbe />
        <Routes>
          {contestStandaloneRoutes()}
          <Route path="/:topicId" element={<div>topic page</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByText("topic page")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Java Coding Contest",
      }),
    ).toBeInTheDocument();
  });

  it("matches the result param route", () => {
    renderAt("/contest/coding/result/abc-123", contestAppRoutes());
    expect(screen.getByTestId("pathname")).toHaveTextContent(
      "/contest/coding/result/abc-123",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading your result");
  });

  it("does not route /contest into a topic page", () => {
    render(
      <MemoryRouter initialEntries={["/contest"]} future={ROUTER_FUTURE}>
        <LocationProbe />
        <Routes>
          {contestAppRoutes()}
          <Route path="/:topicId" element={<div>topic page</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByText("topic page")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Contest" }),
    ).toBeInTheDocument();
  });
});