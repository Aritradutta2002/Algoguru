import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import JavaInterviewHub from "./JavaInterviewHub";

/* ──────────────────────────────────────────────────────────────
   Environment shims — jsdom ships no IntersectionObserver, and the
   page uses one for scroll reveals and the sticky section nav.
   ────────────────────────────────────────────────────────────── */

beforeAll(() => {
  class IO {
    constructor(private cb: IntersectionObserverCallback) {}
    observe(target: Element) {
      // Report everything as visible so reveal + active-section logic runs.
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
   Hook mocks — the real hooks hit Supabase. Mocking keeps this a
   pure render smoke test of the redesigned hub.
   ────────────────────────────────────────────────────────────── */

const toggleDone = vi.fn();
const toggleBookmark = vi.fn();

let doneMap: Record<string, boolean> = {};
let bookmarkedIds: string[] = [];

vi.mock("@/hooks/useCoreJavaUserState", () => ({
  useCoreJavaUserState: () => ({
    doneMap,
    notesMap: {},
    updatedAtMap: {},
    readingSectionMap: {},
    loading: false,
    upsertingId: null,
    toggleDone,
    saveNote: vi.fn(),
    deleteNote: vi.fn(),
    saveReadingSection: vi.fn(),
    isUpserting: () => false,
  }),
}));

vi.mock("@/hooks/useCoreJavaBookmarks", () => ({
  useCoreJavaBookmarks: () => ({
    bookmarkedIds,
    isBookmarked: (id: string) => bookmarkedIds.includes(id),
    toggleBookmark,
    loading: false,
    isToggling: false,
    count: bookmarkedIds.length,
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ session: null, user: null, loading: false }),
}));

function renderHub() {
  return render(
    <MemoryRouter initialEntries={["/interview/java"]}>
      <JavaInterviewHub />
    </MemoryRouter>
  );
}

beforeEach(() => {
  doneMap = {};
  bookmarkedIds = [];
  toggleDone.mockClear();
  toggleBookmark.mockClear();
});

describe("JavaInterviewHub (redesigned)", () => {
  it("renders the hero with headline, CTAs and live dataset counts", () => {
    renderHub();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Master Java/i);
    expect(screen.getByText(/Crack the interview/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start learning/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse all questions/i })).toHaveAttribute(
      "href",
      "/interview/java/core-java-qa"
    );
    // 225 questions / 15 topics straight from the data layer.
    expect(screen.getByText(/225 expert-curated questions/i)).toBeInTheDocument();
    expect(screen.getByText(/15 topics in order/i)).toBeInTheDocument();
    // appears in both the hero meta line and the revision banner
    expect(screen.getAllByText(/101 must-know questions/i).length).toBeGreaterThan(0);
  });

  it("renders every section anchor targeted by the sticky nav", () => {
    renderHub();
    for (const id of ["overview", "tracks", "roadmap", "hotlist", "revision"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
    const nav = screen.getByRole("navigation", { name: /page sections/i });
    expect(within(nav).getByRole("button", { name: /hot list/i })).toBeInTheDocument();
  });

  it("renders the five-cell stat strip and the four learning tracks", () => {
    renderHub();

    for (const label of ["Questions", "Topics", "Must-know", "Full read", "Quick revision"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    for (const [title, href] of [
      ["Core Java Q&A", "/interview/java/core-java-qa"],
      ["Data Structures", "/interview/java/data-structure"],
      ["System Design", "/interview/java/system-design"],
      ["SQL Questions", "/interview/java/sql-structure"],
    ]) {
      const link = screen.getByRole("heading", { level: 3, name: title }).closest("a");
      expect(link).toHaveAttribute("href", href);
    }
    expect(screen.getByText("225 questions")).toBeInTheDocument();
  });

  it("renders all 15 roadmap topics, each deep-linked by topic id", () => {
    renderHub();

    const topicLinks = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("href")?.startsWith("/interview/java/core-java-qa?topic="));
    // 15 topic cards + the 15-row desktop rail.
    expect(topicLinks).toHaveLength(30);

    const uniqueHrefs = new Set(topicLinks.map((el) => el.getAttribute("href")));
    expect(uniqueHrefs.size).toBe(15);
    for (const href of uniqueHrefs) {
      expect(href).toMatch(/\?topic=[a-z0-9-]+$/);
    }
    // Per-topic meta line is derived from the answer word counts at render time.
    expect(screen.getByText(/^Topic 01 · \d+ questions · ~\d+ min$/)).toBeInTheDocument();
  });

  it("renders the six most-asked questions, ordered by priority", () => {
    renderHub();

    const hotlist = document.getElementById("hotlist") as HTMLElement;
    const rows = within(hotlist).getAllByRole("link");
    // 6 result rows + the "view the full bank" link.
    expect(rows).toHaveLength(7);
    expect(within(hotlist).getByText("01")).toBeInTheDocument();
    expect(within(hotlist).getByText("06")).toBeInTheDocument();
    expect(within(hotlist).getAllByText("Must know").length).toBeGreaterThan(0);
  });

  it("renders the quick-revision banner with its deep link", () => {
    renderHub();
    expect(screen.getByRole("heading", { name: /interview tomorrow/i })).toBeInTheDocument();
    const links = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("href") === "/interview/java/core-java-qa?filter=most-asked");
    expect(links.length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /start quick revision/i })).toBeInTheDocument();
  });

  it("shows zero progress for a fresh user and the first very-high question as Next up", () => {
    renderHub();
    const dashboard = screen.getByLabelText(/your java interview progress/i);
    expect(dashboard).toHaveTextContent("0%");
    expect(dashboard).toHaveTextContent("0/225");
    expect(within(dashboard).getByText("Next up")).toBeInTheDocument();
    expect(within(dashboard).getByText("Completed").parentElement).toHaveTextContent("0");
  });

  it("reflects completed + bookmarked counts in the dashboard", () => {
    doneMap = { q001: true, q002: true };
    bookmarkedIds = ["q005"];
    renderHub();

    const dashboard = screen.getByLabelText(/your java interview progress/i);
    expect(within(dashboard).getByText("Completed").parentElement).toHaveTextContent("2");
    expect(within(dashboard).getByText("Remaining").parentElement).toHaveTextContent("223");
    expect(within(dashboard).getByText("Bookmarked").parentElement).toHaveTextContent("1");
    // 2/225 rounds to 1%.
    expect(dashboard).toHaveTextContent("1%");
    expect(dashboard).toHaveTextContent("2/225");
  });

  it("sets the page title", () => {
    renderHub();
    expect(document.title).toBe("Java Interview | AlgoGuru");
  });
});

/* ──────────────────────────────────────────────────────────────
   Stylesheet contract — the .jvh-* CSS is hand-written, so these
   guards catch drift the type checker cannot see.
   ────────────────────────────────────────────────────────────── */

describe("JavaInterviewHub stylesheet contract", () => {
  const css = readFileSync(resolve(process.cwd(), "src/styles/java-interview-hub.css"), "utf8");
  const tsx = readFileSync(resolve(process.cwd(), "src/pages/interview/JavaInterviewHub.tsx"), "utf8");

  it("defines every class the page uses and uses every class it defines", () => {
    // Strip custom-property literals ("--jvh-track") so they aren't read as classes.
    const classScanSource = tsx.replace(/"--jvh-[a-z0-9-]+"/g, "");
    const used = new Set([...classScanSource.matchAll(/\bjvh-[a-z0-9-]+/g)].map((m) => m[0]));
    const defined = new Set([...css.matchAll(/\.(jvh-[a-z0-9-]+)/g)].map((m) => m[1]));
    expect([...used].filter((c) => !defined.has(c))).toEqual([]); // no unstyled hooks
    expect([...defined].filter((c) => !used.has(c))).toEqual([]); // no dead CSS
  });

  it("only consumes custom properties the page actually provides", () => {
    const referenced = [...new Set([...css.matchAll(/var\((--jvh-[a-z0-9-]+)/g)].map((m) => m[1]))];
    const provided = new Set([...tsx.matchAll(/"(--jvh-[a-z0-9-]+)"/g)].map((m) => m[1]));
    expect(referenced.filter((v) => !provided.has(v))).toEqual([]);
  });

  it("gives each track card its own accent color for the hover treatment", () => {
    renderHub();
    const expected: Record<string, string> = {
      "/interview/java/core-java-qa": "hsl(var(--primary))",
      "/interview/java/data-structure": "hsl(var(--accent))",
      "/interview/java/system-design": "hsl(var(--info))",
      "/interview/java/sql-structure": "hsl(var(--success))",
    };
    for (const [href, color] of Object.entries(expected)) {
      const card = screen
        .getAllByRole("link")
        .find((el) => el.getAttribute("href") === href && el.className.includes("jvh-track-card"));
      expect(card, `track card ${href}`).toBeTruthy();
      expect(card!.getAttribute("style")).toContain(`--jvh-track: ${color}`);
    }
  });
});
