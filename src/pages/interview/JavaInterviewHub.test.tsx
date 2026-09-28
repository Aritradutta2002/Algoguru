import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { coreJavaInterviewTopics } from "@/data/coreJavaInterviewData";
import { getAllCoreJavaQuestions } from "@/lib/coreJavaQuestionIndex";
import { PRACTICE_PROBLEM_COUNT } from "@/data/backendInterview/practiceProblems";
import JavaInterviewHub from "./JavaInterviewHub";

/* ──────────────────────────────────────────────────────────────
   Environment shims — jsdom ships neither IntersectionObserver
   (used by the section nav) nor scrollIntoView.
   ────────────────────────────────────────────────────────────── */

beforeAll(() => {
  class IO {
    constructor(private cb: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.cb(
        [{ isIntersecting: true, target, boundingClientRect: { top: 0 } } as unknown as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      );
    }
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

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

/* ──────────────────────────────────────────────────────────────
   Progress is mocked at the boundary (Supabase-backed); the
   practice-lab counters run against real localStorage.
   ────────────────────────────────────────────────────────────── */

const toggleDone = vi.fn();
let doneMap: Record<string, boolean> = {};
let updatedAtMap: Record<string, string> = {};
let loading = false;

vi.mock("@/hooks/useCoreJavaUserState", () => ({
  useCoreJavaUserState: () => ({
    doneMap,
    updatedAtMap,
    loading,
    toggleDone,
    notesMap: {},
    readingSectionMap: {},
    upsertingId: null,
    saveNote: vi.fn(),
    deleteNote: vi.fn(),
    saveReadingSection: vi.fn(),
    isUpserting: () => false,
  }),
}));

const allQuestionIds = coreJavaInterviewTopics.flatMap((topic) =>
  topic.questions.map((question) => question.id)
);
const TOTAL_QUESTIONS = getAllCoreJavaQuestions().length;

function renderHub() {
  return render(
    <MemoryRouter
      initialEntries={["/interview/java"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <JavaInterviewHub />
    </MemoryRouter>
  );
}

beforeEach(() => {
  doneMap = {};
  updatedAtMap = {};
  loading = false;
  toggleDone.mockClear();
  localStorage.clear();
});

describe("JavaInterviewHub structure", () => {
  it("renders a quiet breadcrumb, exactly one h1 and the aligned document title", () => {
    renderHub();

    const breadcrumb = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(
      within(breadcrumb).getByRole("link", { name: "Interview Prep" })
    ).toHaveAttribute("href", "/interview");
    expect(
      within(breadcrumb).getByRole("link", { name: "Java" })
    ).toHaveAttribute("href", "/interview/java");
    expect(within(breadcrumb).getByText("Backend")).toHaveAttribute("aria-current", "page");

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Java Backend Interview Preparation"
    );
    expect(document.title).toBe("Java Backend Interview Preparation | AlgoGuru");
  });

  it("renders local section navigation with real anchors and one current state", () => {
    renderHub();

    const nav = screen.getByRole("navigation", { name: /page sections/i });
    const expected: Array<[string, string]> = [
      ["Overview", "#overview"],
      ["Topics", "#topics"],
      ["Practice", "#practice"],
      ["Study plan", "#plan"],
    ];
    for (const [label, href] of expected) {
      expect(within(nav).getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
    const current = within(nav)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "location");
    expect(current).toHaveLength(1);
  });

  it("keeps every section anchor targeted by the navigation", () => {
    renderHub();
    for (const id of ["overview", "topics", "practice", "plan"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });

  it("renders a two-column desktop overview with the preparation progress panel", () => {
    renderHub();

    const panel = screen.getByRole("complementary", { name: /preparation progress/i });
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByText(/preparation progress/i)).toBeInTheDocument();
    expect(within(panel).getByText("Complete")).toBeInTheDocument();

    const header = screen.getByRole("banner");
    const primary = within(header).getByRole("link", { name: /start java platform/i });
    expect(primary.className).toContain("cjh-btn-primary");
    const secondary = within(header).getByRole("link", { name: /browse all topics/i });
    expect(secondary.className).toContain("cjh-btn-secondary");
  });
});

describe("JavaInterviewHub states", () => {
  it("shows the new-user state: start the first curriculum topic", () => {
    renderHub();

    const ctas = screen.getAllByRole("link", { name: /start java platform/i });
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) {
      expect(cta.getAttribute("href")).toMatch(/^\/interview\/java\/core-java-qa\//);
    }
    expect(screen.getByRole("link", { name: /browse all topics/i })).toHaveAttribute("href", "#topics");

    expect(screen.getByText("Overall complete").parentElement).toHaveTextContent("0%");
    expect(screen.getByText("Questions studied").parentElement).toHaveTextContent(`0 of ${TOTAL_QUESTIONS}`);
    expect(screen.getByText("Recommended starting topic")).toBeInTheDocument();
    expect(screen.getByText(/in the curriculum order, with/i)).toBeInTheDocument();
  });

  it("continues the most recently touched topic for a returning learner", () => {
    const strings = coreJavaInterviewTopics[2];
    doneMap = { [strings.questions[0].id]: true };
    updatedAtMap = { [strings.questions[0].id]: "2026-01-01T00:00:00.000Z" };
    renderHub();

    const ctas = screen.getAllByRole("link", { name: /continue strings/i });
    expect(ctas.length).toBeGreaterThan(0);
    expect(screen.getByText("Current topic")).toBeInTheDocument();
    const card = document.querySelector(".cjh-continue") as HTMLElement;
    expect(card).toHaveTextContent(`1 of ${strings.questions.length} questions studied`);
    expect(card).toHaveTextContent(`${strings.questions.length - 1} questions left in this topic`);
    expect(screen.getByText("Questions studied").parentElement).toHaveTextContent(`1 of ${TOTAL_QUESTIONS}`);
  });

  it("acknowledges a finished curriculum and points at practice", () => {
    doneMap = Object.fromEntries(allQuestionIds.map((id) => [id, true]));
    renderHub();

    const ctas = screen.getAllByRole("link", { name: /solve the next problem/i });
    expect(ctas.length).toBeGreaterThan(0);
    expect(screen.getByText("Every question has been studied")).toBeInTheDocument();
    expect(screen.getByText("Overall complete").parentElement).toHaveTextContent("100%");
    expect(screen.getByText("Topics complete").parentElement).toHaveTextContent("15 of 15");
  });

  it("never flashes false zero progress while progress is loading", () => {
    loading = true;
    renderHub();

    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(screen.queryByText(`0 of ${TOTAL_QUESTIONS}`)).not.toBeInTheDocument();
    expect(screen.getByText("Loading your study progress…")).toBeInTheDocument();
    expect(within(screen.getByRole("banner")).getAllByRole("link", { name: /open question bank/i })).toHaveLength(1);
  });
});

describe("JavaInterviewHub curriculum", () => {
  it("renders all 15 topics in curriculum order with real counts and actions", () => {
    doneMap = Object.fromEntries(coreJavaInterviewTopics[1].questions.map((question) => [question.id, true]));
    renderHub();

    const rows = Array.from(document.querySelectorAll(".cjh-topic-row"));
    expect(rows).toHaveLength(coreJavaInterviewTopics.length);

    rows.forEach((row, index) => {
      const stat = coreJavaInterviewTopics[index];
      expect(row.textContent).toContain(String(index + 1).padStart(2, "0"));
      expect(row.textContent).toContain(stat.title);
    });

    expect(screen.getByRole("link", { name: /open topic: java platform/i })).toHaveAttribute(
      "href",
      "/interview/java/core-java-qa?topic=java-platform"
    );
    expect(screen.getByRole("link", { name: /review: wrapper classes/i })).toHaveAttribute(
      "href",
      "/interview/java/core-java-qa?topic=wrapper-classes"
    );
  });

  it("keeps secondary difficulty data in a native disclosure", () => {
    renderHub();
    const details = document.querySelectorAll(".cjh-topic-details");
    expect(details).toHaveLength(coreJavaInterviewTopics.length);
    expect(details[0].querySelector("summary")).toHaveTextContent("Question mix");
  });

  it("renders the six most-asked questions with deep links", () => {
    renderHub();
    const hotList = document.querySelector(".cjh-hotlist") as HTMLElement;
    const links = within(hotList).getAllByRole("link");
    expect(links).toHaveLength(6);
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^\/interview\/java\/core-java-qa\//);
    }
  });

  it("filters the curriculum list by search query and restores on clear", () => {
    renderHub();

    const searchInput = screen.getByRole("searchbox", { name: /search topics/i });
    expect(searchInput).toBeInTheDocument();

    // Search for "collections"
    fireEvent.change(searchInput, { target: { value: "collections" } });
    const filteredRows = Array.from(document.querySelectorAll(".cjh-topic-row"));
    expect(filteredRows.length).toBeGreaterThan(0);
    expect(filteredRows.length).toBeLessThan(coreJavaInterviewTopics.length);
    filteredRows.forEach((row) => {
      expect(row.textContent?.toLowerCase()).toContain("collection");
    });

    // Clear search via clear button
    fireEvent.click(screen.getByRole("button", { name: /clear topic search/i }));
    expect(document.querySelectorAll(".cjh-topic-row")).toHaveLength(coreJavaInterviewTopics.length);

    // Search with no matches
    fireEvent.change(searchInput, { target: { value: "xyznotfoundtopic" } });
    expect(document.querySelectorAll(".cjh-topic-row")).toHaveLength(0);
    expect(screen.getByText(/no topics match “xyznotfoundtopic”/i)).toBeInTheDocument();

    // Show all button restores all topics
    fireEvent.click(screen.getByRole("button", { name: /show all topics/i }));
    expect(document.querySelectorAll(".cjh-topic-row")).toHaveLength(coreJavaInterviewTopics.length);
  });
});

describe("JavaInterviewHub resources, plan and footer", () => {
  it("lists every practice and resource destination with its real route", () => {
    renderHub();
    const expected: Array<[string, string]> = [
      ["Open question bank", "/interview/java/core-java-qa"],
      ["Open Spring Boot questions", "/interview/java/spring-boot/questions"],
      ["Solve the next problem", "/interview/java/spring-boot/practice"],
      ["Browse annotation reference", "/interview/java/spring-boot/annotations"],
      ["Review must-know questions", "/interview/java/core-java-qa?filter=most-asked"],
      ["Open data structures", "/interview/java/data-structure"],
      ["Open system design", "/interview/java/system-design"],
      ["Open SQL questions", "/interview/java/sql-structure"],
    ];
    const resources = document.querySelector(".cjh-resources") as HTMLElement;
    expect(within(resources).getAllByRole("listitem")).toHaveLength(8);
    for (const [label, href] of expected) {
      expect(within(resources).getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("shows real practice progress in the resource row", () => {
    localStorage.setItem("algoguru:backend-interview:practice-solved", JSON.stringify(["lab-1"]));
    renderHub();
    expect(screen.getByText(`1 of ${PRACTICE_PROBLEM_COUNT} solved`)).toBeInTheDocument();
  });

  it("renders the four-week plan as a keyboard-operable accordion", () => {
    doneMap = { [coreJavaInterviewTopics[0].questions[0].id]: true };
    updatedAtMap = { [coreJavaInterviewTopics[0].questions[0].id]: "2026-01-01T00:00:00.000Z" };
    renderHub();

    const toggles = Array.from(document.querySelectorAll<HTMLButtonElement>(".cjh-plan-toggle"));
    expect(toggles).toHaveLength(4);
    toggles.forEach((toggle) => {
      expect(toggle.getAttribute("aria-controls")).toBeTruthy();
      expect(document.getElementById(toggle.getAttribute("aria-controls") as string)).not.toBeNull();
    });

    const openToggle = toggles.find((toggle) => toggle.getAttribute("aria-expanded") === "true");
    expect(openToggle).toBe(toggles[0]);

    const panel = document.getElementById(toggles[2].getAttribute("aria-controls") as string) as HTMLElement;
    expect(within(panel).getAllByRole("link").length).toBeGreaterThan(0);

    fireEvent.click(toggles[2]);
    expect(toggles[2]).toHaveAttribute("aria-expanded", "true");
    expect(toggles[0]).toHaveAttribute("aria-expanded", "false");
  });

  it("marks finished weeks as complete without a current week", () => {
    doneMap = Object.fromEntries(allQuestionIds.map((id) => [id, true]));
    renderHub();
    expect(screen.getAllByText("Complete").length).toBeGreaterThanOrEqual(4);
    expect(screen.queryByText("Current week")).not.toBeInTheDocument();
  });

  it("keeps the footer minimal and the track links crawlable", () => {
    renderHub();
    const footer = screen.getByRole("contentinfo");
    for (const label of [
      "Core Java Q&A",
      "Spring Boot & Backend",
      "Data Structures",
      "System Design",
      "SQL Questions",
    ]) {
      expect(within(footer).getByRole("link", { name: label })).toHaveAttribute("href", expect.stringContaining("/interview/java"));
    }
  });
});

describe("JavaInterviewHub reset progress", () => {
  it("hides the reset action when there is nothing to reset", () => {
    renderHub();
    expect(screen.queryByRole("button", { name: /reset progress/i })).not.toBeInTheDocument();
  });

  it("requires an explicit confirmation and a safe cancel before deleting marks", () => {
    const [first] = allQuestionIds;
    doneMap = { [first]: true };
    renderHub();

    fireEvent.click(screen.getByRole("button", { name: /reset progress/i }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText(/cannot be undone/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/completion marks on 1 studied core java questions/i)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /cancel/i }));
    expect(toggleDone).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /reset progress/i }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: /^reset progress$/i }));
    expect(toggleDone).toHaveBeenCalledWith(first);
  });
});

/* ──────────────────────────────────────────────────────────────
   Stylesheet contract — hand-written CSS drifts silently, so these
   guards cover what the type checker cannot see.
   ────────────────────────────────────────────────────────────── */

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(full, acc);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) acc.push(full);
  }
  return acc;
}

describe("cjh-* stylesheet contract", () => {
  const srcDir = resolve(process.cwd(), "src");
  const css = readFileSync(resolve(srcDir, "styles/core-java-interview.css"), "utf8");
  const source = collectSourceFiles(srcDir)
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  const used = new Set([...source.matchAll(/\bcjh-[a-z0-9-]+/g)].map((match) => match[0]));
  const defined = new Set([...css.matchAll(/\.(cjh-[a-z0-9-]+)/g)].map((match) => match[1]));

  it("retires the duplicate jvh-* stylesheet entirely", () => {
    expect(existsSync(resolve(srcDir, "styles/java-interview-hub.css"))).toBe(false);
    expect(/\bjvh-[a-z0-9-]+/.test(source)).toBe(false);
  });

  it("defines every cjh-* class the app uses", () => {
    expect([...used].filter((token) => !defined.has(token))).toEqual([]);
  });

  it("keeps no confirmed-unused cjh-* selector", () => {
    expect([...defined].filter((token) => !used.has(token))).toEqual([]);
  });
});
