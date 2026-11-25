import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  resetNextNavigationMocks,
  setMockParams,
  setMockPathname,
  setMockSearchParams,
} from "@/test/nextNavigationMock";
import BackendInterviewHubView from "./BackendInterviewHubView";
import BackendQuestionsView from "./BackendQuestionsView";
import BackendQuestionDetailView from "./BackendQuestionDetailView";
import BackendAnnotationsView from "./BackendAnnotationsView";
import BackendPracticeView from "./BackendPracticeView";
import BackendPracticeDetailView from "./BackendPracticeDetailView";
import {
  backendQuestionIndex,
  BACKEND_TOTAL_QUESTIONS,
} from "@/lib/backendQuestionIndex";
import { BACKEND_PRACTICE_PROBLEMS } from "@/data/backendInterview/practiceProblems";

vi.mock("next/link", async () => {
  const { createNextLinkMock } = await import("@/test/nextNavigationMock");
  return createNextLinkMock();
});

vi.mock("next/navigation", async () => {
  const { createNextNavigationMock } = await import("@/test/nextNavigationMock");
  return createNextNavigationMock();
});

/* jsdom ships no IntersectionObserver; the detail page uses one for its TOC. */
beforeAll(() => {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds: number[] = [];
  }
  vi.stubGlobal("IntersectionObserver", IO);
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
  if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => {};
  vi.stubGlobal("scrollTo", () => {});
});

beforeEach(() => {
  window.localStorage.clear();
  resetNextNavigationMocks();
});

function renderAt(path: string) {
  const url = new URL(path, "https://algoguru.test");
  setMockPathname(url.pathname);
  setMockSearchParams(url.searchParams);

  const hubMatch = url.pathname.match(/^\/interview\/([^/]+)\/spring-boot$/);
  if (hubMatch) {
    setMockParams({ language: hubMatch[1] });
    return render(<BackendInterviewHubView />);
  }

  const questionsMatch = url.pathname.match(
    /^\/interview\/([^/]+)\/spring-boot\/questions$/,
  );
  if (questionsMatch) {
    setMockParams({ language: questionsMatch[1] });
    return render(<BackendQuestionsView />);
  }

  const questionDetailMatch = url.pathname.match(
    /^\/interview\/([^/]+)\/spring-boot\/questions\/([^/]+)$/,
  );
  if (questionDetailMatch) {
    setMockParams({
      language: questionDetailMatch[1],
      questionSlug: questionDetailMatch[2],
    });
    return render(<BackendQuestionDetailView />);
  }

  const annotationsMatch = url.pathname.match(
    /^\/interview\/([^/]+)\/spring-boot\/annotations$/,
  );
  if (annotationsMatch) {
    setMockParams({ language: annotationsMatch[1] });
    return render(<BackendAnnotationsView />);
  }

  const practiceMatch = url.pathname.match(
    /^\/interview\/([^/]+)\/spring-boot\/practice$/,
  );
  if (practiceMatch) {
    setMockParams({ language: practiceMatch[1] });
    return render(<BackendPracticeView />);
  }

  const practiceDetailMatch = url.pathname.match(
    /^\/interview\/([^/]+)\/spring-boot\/practice\/([^/]+)$/,
  );
  if (practiceDetailMatch) {
    setMockParams({
      language: practiceDetailMatch[1],
      problemId: practiceDetailMatch[2],
    });
    return render(<BackendPracticeDetailView />);
  }

  throw new Error(`Unhandled test route: ${path}`);
}

describe("Backend interview hub", () => {
  it("renders the hero, live counts and all three entry points", () => {
    renderAt("/interview/java/spring-boot");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Spring Boot & Backend Engineering/i,
    );
    expect(screen.getByText(String(BACKEND_TOTAL_QUESTIONS))).toBeInTheDocument();

    for (const [name, href] of [
      ["Practice with problems", "/interview/java/spring-boot/practice"],
      ["Annotation reference", "/interview/java/spring-boot/annotations"],
    ] as const) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  }, 20_000);

  it("links every topic into the filtered question list", () => {
    renderAt("/interview/java/spring-boot");
    const topicLinks = screen
      .getAllByRole("link")
      .filter((el) =>
        el
          .getAttribute("href")
          ?.startsWith("/interview/java/spring-boot/questions?topic="),
      );
    // 8 topic cards plus the chips inside the four-week plan.
    expect(topicLinks.length).toBeGreaterThanOrEqual(8);
  }, 20_000);
});

describe("Backend question list", () => {
  it("lists questions and narrows them by search", () => {
    renderAt("/interview/java/spring-boot/questions");
    expect(
      screen.getByText(`${BACKEND_TOTAL_QUESTIONS} questions`),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Search questions/i), {
      target: { value: "hashmap" },
    });
    const summary = screen.getByText(/^\d+ questions?$/);
    const shown = Number(summary.textContent?.split(" ")[0]);
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(BACKEND_TOTAL_QUESTIONS);
  }, 20_000);

  it("filters to a single topic from the query string", () => {
    renderAt("/interview/java/spring-boot/questions?topic=jwt");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/JWT/i);
  }, 20_000);
});

describe("Backend question detail", () => {
  const entry = backendQuestionIndex.find((item) => Boolean(item.question.code))!;

  it("renders the answer, the code example and the takeaway", () => {
    renderAt(`/interview/java/spring-boot/questions/${entry.slug}`);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      entry.question.question,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: /Quick Answer/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Code Example/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /What They're Really Testing/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(entry.question.explanation)).toBeInTheDocument();
  });

  it("persists the studied flag to localStorage", () => {
    renderAt(`/interview/java/spring-boot/questions/${entry.slug}`);
    fireEvent.click(screen.getByRole("button", { name: /Mark as studied/i }));
    const stored = window.localStorage.getItem(
      "algoguru:backend-interview:studied",
    );
    expect(stored).toContain(entry.question.id);
  });

  it("uses responsive flex layout without cjd-grid so the article does not get squashed", () => {
    const { container } = renderAt(
      `/interview/java/spring-boot/questions/${entry.slug}`,
    );
    const article = container.querySelector("article");
    expect(article).not.toBeNull();
    const parent = article?.parentElement;
    expect(parent).not.toBeNull();
    expect(parent?.className).toContain("flex");
    expect(parent?.className).not.toContain("cjd-grid");
    expect(article?.className).toContain("flex-1");
  });

  it("renders questions from different topics cleanly without errors", () => {
    const sampleSlugs = [
      backendQuestionIndex[0]?.slug,
      backendQuestionIndex[15]?.slug,
      backendQuestionIndex[30]?.slug,
      backendQuestionIndex[50]?.slug,
    ].filter(Boolean);

    for (const slug of sampleSlugs) {
      const { unmount } = renderAt(`/interview/java/spring-boot/questions/${slug}`);
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /Quick Answer/ }),
      ).toBeInTheDocument();
      unmount();
    }
  }, 20_000);
});

describe("Annotation reference", () => {
  it("renders categories and expands an entry on click", () => {
    renderAt("/interview/java/spring-boot/annotations");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Annotation Reference/i,
    );

    const toggle = screen.getAllByRole("button", { expanded: false })[0];
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getAllByText(/How it works internally/i).length,
    ).toBeGreaterThan(0);
  });

  it("filters by search text", () => {
    renderAt("/interview/java/spring-boot/annotations");
    fireEvent.change(screen.getByPlaceholderText(/Search @Transactional/i), {
      target: { value: "@Transactional" },
    });
    expect(screen.getByText(/^\d+ annotations? shown$/)).toBeInTheDocument();
  });
});

describe("Practice lab", () => {
  it("lists every problem grouped by topic", () => {
    renderAt("/interview/java/spring-boot/practice");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Practice With Problems/i,
    );
    const links = screen
      .getAllByRole("link")
      .filter((el) =>
        /\/spring-boot\/practice\/p\d+$/.test(el.getAttribute("href") ?? ""),
      );
    expect(new Set(links.map((el) => el.getAttribute("href"))).size).toBe(
      BACKEND_PRACTICE_PROBLEMS.length,
    );
  });

  it("reveals hints one at a time and keeps the solution hidden until asked", () => {
    const problem = BACKEND_PRACTICE_PROBLEMS[0];
    renderAt(`/interview/java/spring-boot/practice/${problem.id}`);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      problem.title,
    );
    expect(screen.getByText(/0\/\d+ revealed/)).toBeInTheDocument();
    expect(
      screen.queryByText(`${problem.id} · solution`),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Reveal hint 1 of/i }));
    expect(screen.getByText(/1\/\d+ revealed/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Show solution/i }));
    expect(screen.getByText(`${problem.id} · solution`)).toBeInTheDocument();
  });

  it("ticks acceptance criteria independently", () => {
    const problem = BACKEND_PRACTICE_PROBLEMS[0];
    renderAt(`/interview/java/spring-boot/practice/${problem.id}`);

    const heading = screen.getByText(/Acceptance Criteria/i);
    expect(
      within(heading).getByText(`0/${problem.tasks.length}`),
    ).toBeInTheDocument();

    const list = heading.closest("section")!.querySelector("ul")!;
    fireEvent.click(within(list).getAllByRole("button")[0]);
    expect(
      within(heading).getByText(`1/${problem.tasks.length}`),
    ).toBeInTheDocument();
  });
});
