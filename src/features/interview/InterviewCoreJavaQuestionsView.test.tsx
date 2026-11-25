import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  mockRouter,
  resetNextNavigationMocks,
  setMockParams,
  setMockPathname,
  setMockSearchParams,
} from "@/test/nextNavigationMock";
import { TooltipProvider } from "@/components/ui/tooltip";
import InterviewCoreJavaQuestionsView from "./InterviewCoreJavaQuestionsView";

vi.mock("next/link", async () => {
  const { createNextLinkMock } = await import("@/test/nextNavigationMock");
  return createNextLinkMock();
});

vi.mock("next/navigation", async () => {
  const { createNextNavigationMock } = await import("@/test/nextNavigationMock");
  return createNextNavigationMock();
});

vi.mock("@/lib/coreJavaQuestionIndex", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/coreJavaQuestionIndex")>();
  const entries = actual
    .getAllCoreJavaQuestions()
    .filter(
      (entry) =>
        entry.topic.id === "java-platform" ||
        entry.topic.id === "wrapper-classes",
    );

  return { ...actual, getAllCoreJavaQuestions: () => entries };
});

const userState = vi.hoisted(() => ({
  doneMap: {} as Record<string, boolean>,
  notesMap: {} as Record<string, string>,
  upsertingId: null,
  toggleDone: vi.fn(),
  saveNote: vi.fn().mockResolvedValue(true),
  deleteNote: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock("@/hooks/useCoreJavaUserState", () => ({
  useCoreJavaUserState: () => userState,
}));

vi.mock("@/hooks/useCoreJavaBookmarks", () => ({
  useCoreJavaBookmarks: () => ({
    isBookmarked: () => false,
    toggleBookmark: vi.fn(),
    bookmarkedIds: [],
  }),
}));

vi.mock("@/components/ui/sidebar", () => ({
  useSidebar: () => ({
    setOpen: vi.fn(),
    toggleSidebar: vi.fn(),
  }),
}));

vi.mock("@/components/interview/CoreJavaActions", () => ({
  CoreJavaBookmarkButton: () => (
    <button type="button" aria-label="Bookmark question">
      Bookmark
    </button>
  ),
}));

vi.mock("@/components/interview/CoreJavaQuestionAnswer", () => ({
  CoreJavaQuestionAnswer: () => <div>Answer content</div>,
}));

vi.mock("@/components/interview/CoreJavaVisualizationBlock", () => ({
  CoreJavaVisualizationBlock: () => null,
  hasCoreJavaVisualization: () => false,
}));

vi.mock("@/components/CodeBlock", () => ({
  CodeBlock: () => <pre>Code example</pre>,
}));

vi.mock("./exportNotesPdf", () => ({
  exportNotesPdf: vi.fn(),
}));

function renderView(search = "") {
  setMockPathname("/interview/java/core-java-qa");
  setMockParams({ language: "java" });
  setMockSearchParams(search);

  return render(
    <TooltipProvider>
      <InterviewCoreJavaQuestionsView language="java" />
    </TooltipProvider>,
  );
}

function openTopics() {
  const opener = screen.getByRole("button", { name: "Open Topics" });
  fireEvent.click(opener);

  return { opener, dialog: screen.getByRole("dialog") };
}

let desktopViewport = false;

beforeEach(() => {
  desktopViewport = false;
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    get matches() {
      return query === "(min-width: 1024px)" && desktopViewport;
    },
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  resetNextNavigationMocks();
  userState.doneMap = {};
  userState.notesMap = {};
  vi.stubGlobal("scrollTo", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("InterviewCoreJavaQuestionsView mobile topics Sheet", () => {
  it("exposes accessible modal semantics with only the custom close control", () => {
    renderView();
    const opener = screen.getByRole("button", { name: "Open Topics" });
    expect(opener).toHaveClass("lg:hidden");
    expect(opener).toHaveAttribute("aria-haspopup", "dialog");
    expect(opener).toHaveAttribute("aria-expanded", "false");
    expect(opener).toHaveAttribute("aria-controls", "core-java-topics-sheet");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const { dialog } = openTopics();

    expect(opener).toHaveAttribute("aria-expanded", "true");
    expect(dialog).toHaveAttribute("id", "core-java-topics-sheet");
    expect(dialog).toHaveAccessibleName("Knowledge Areas");
    expect(dialog).toHaveAccessibleDescription(
      "Browse Core Java interview topics and track your progress.",
    );
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(opener.closest('[aria-hidden="true"]')).toBeInTheDocument();

    for (const attribute of ["aria-labelledby", "aria-describedby"]) {
      const referencedIds = dialog.getAttribute(attribute)?.split(/\s+/) ?? [];
      expect(referencedIds.length).toBeGreaterThan(0);
      for (const id of referencedIds) {
        expect(document.getElementById(id)).toBeInTheDocument();
      }
    }

    expect(
      screen.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getAllByRole("button", { name: "Close sidebar" }),
    ).toHaveLength(1);
  });

  it("keeps the mobile left Sheet below notes and above its backdrop with independent scrolling", () => {
    renderView();
    const { dialog } = openTopics();
    const viewport = dialog.querySelector("[data-radix-scroll-area-viewport]");

    expect(dialog).toHaveClass(
      "left-0",
      "z-[40]",
      "lg:hidden",
      "flex",
      "h-full",
      "flex-col",
      "overflow-hidden",
      "p-0",
    );
    expect(dialog.previousElementSibling).toHaveClass("z-[40]", "lg:hidden");
    expect(viewport?.parentElement).toHaveClass("min-h-0", "flex-1");
  });

  it("moves focus into the Sheet and returns it to the opener after custom close", async () => {
    renderView();
    const opener = screen.getByRole("button", { name: "Open Topics" });
    expect(opener).not.toHaveFocus();

    const { dialog } = openTopics();
    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });

    fireEvent.click(within(dialog).getByRole("button", { name: "Close sidebar" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
      expect(opener).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("dismisses on Escape and restores focus to the mobile opener", async () => {
    renderView();
    const { opener } = openTopics();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    });
  });

  it("dismisses from a backdrop pointer press and restores focus", async () => {
    renderView();
    const { opener, dialog } = openTopics();
    const backdrop = dialog.previousElementSibling;
    expect(backdrop).toBeInTheDocument();

    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });
    fireEvent.pointerDown(backdrop as Element, { button: 0, ctrlKey: false });
    fireEvent.click(backdrop as Element, { button: 0, ctrlKey: false });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    });
  });

  it("locks background scrolling only while the Sheet is open", async () => {
    renderView();
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
    const { opener, dialog } = openTopics();

    await waitFor(() => {
      expect(document.body).toHaveAttribute("data-scroll-locked");
      expect(getComputedStyle(document.body).overflow).toBe("hidden");
    });
    expect(fireEvent.wheel(document.body, { deltaY: 80, cancelable: true })).toBe(
      false,
    );

    fireEvent.click(within(dialog).getByRole("button", { name: "Close sidebar" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.body).not.toHaveAttribute("data-scroll-locked");
      expect(getComputedStyle(document.body).overflow).not.toBe("hidden");
      expect(opener).toHaveFocus();
    });
    expect(fireEvent.wheel(document.body, { deltaY: 80, cancelable: true })).toBe(
      true,
    );
  });

  it("closes topics and releases modal side effects at the desktop breakpoint", async () => {
    renderView();
    const backgroundControl = screen.getByRole("button", { name: "Go back" });
    const { opener, dialog } = openTopics();

    await waitFor(() => {
      expect(document.body).toHaveAttribute("data-scroll-locked");
      expect(document.body).toHaveStyle({ pointerEvents: "none" });
      expect(opener.closest('[aria-hidden="true"]')).toBeInTheDocument();
    });

    desktopViewport = true;
    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
      expect(document.body).not.toHaveAttribute("data-scroll-locked");
      expect(document.body).not.toHaveStyle({ pointerEvents: "none" });
      expect(opener.closest('[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    backgroundControl.focus();
    expect(backgroundControl).toHaveFocus();
  });

  it("renders the URL-selected topic and per-topic progress in the mobile Sheet", () => {
    userState.doneMap = { q001: true };
    renderView("topic=wrapper-classes");

    expect(
      screen.getByRole("heading", { name: "Wrapper Classes" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Java Platform" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Overall progress" }),
    ).toHaveAttribute("aria-valuenow", "7");

    const { dialog } = openTopics();
    const drawer = within(dialog);
    expect(
      drawer.getByRole("button", { name: /Wrapper Classes/ }),
    ).toHaveAttribute("aria-pressed", "true");

    const javaPlatform = drawer.getByRole("button", { name: /Java Platform/ });
    expect(javaPlatform).toHaveTextContent("1/6");
    expect(javaPlatform.querySelector(".cjq-side-progress-fill")).toHaveStyle({
      width: "17%",
    });
  });

  it("selects a topic, updates its query, closes the Sheet, and restores focus", async () => {
    renderView();
    const { opener, dialog } = openTopics();

    fireEvent.click(
      within(dialog).getByRole("button", { name: /Java Platform/ }),
    );

    expect(mockRouter.replace).toHaveBeenCalledWith(
      "/interview/java/core-java-qa?topic=java-platform",
      { scroll: false },
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    });
    expect(
      screen.getByRole("heading", { name: "Java Platform" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Wrapper Classes" }),
    ).not.toBeInTheDocument();

    const reopened = openTopics();
    expect(
      within(reopened.dialog).getByRole("button", { name: /Java Platform/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("closes only the topmost topics Sheet when notes are already open", async () => {
    renderView();
    const notesOpener = screen.getByRole("button", { name: "Notes" });
    const { dialog: topicsDialog } = openTopics();
    fireEvent.click(notesOpener);
    expect(screen.getByRole("dialog", { name: "My Notes" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "My Notes" }),
      ).not.toBeInTheDocument();
    });
    expect(topicsDialog).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Knowledge Areas" }),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes only notes when the notes Sheet is opened above topics", async () => {
    renderView();
    const topicsOpener = screen.getByRole("button", { name: "Open Topics" });
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const notesDialog = screen.getByRole("dialog", { name: "My Notes" });

    fireEvent.click(topicsOpener);
    const topicsDialog = screen
      .getAllByRole("dialog", { hidden: true })
      .find((dialog) => dialog !== notesDialog);
    expect(topicsDialog).toBeDefined();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(topicsDialog).not.toBeInTheDocument();
    });
    expect(notesDialog).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "My Notes" })).toBeInTheDocument();
  });

  it("keeps notes pointer-eligible when opened above topics", async () => {
    renderView();
    const notesOpener = screen.getByRole("button", { name: "Notes" });
    const { dialog: topicsDialog } = openTopics();
    fireEvent.click(notesOpener);
    const notesDialog = screen.getByRole("dialog", { name: "My Notes" });

    const notesOverlay = notesDialog.previousElementSibling;
    const topicsOverlay = topicsDialog.previousElementSibling;
    expect(notesDialog).toHaveClass("z-50");
    expect(notesOverlay).toHaveClass("z-50");
    expect(topicsDialog).toHaveClass("z-[40]");
    expect(topicsOverlay).toHaveClass("z-[40]");
    expect(document.body).toHaveStyle({ pointerEvents: "none" });
    expect(topicsDialog).toHaveStyle({ pointerEvents: "none" });
    expect(notesDialog).toHaveStyle({ pointerEvents: "auto" });

    const notesClose = within(notesDialog).getByRole("button", {
      name: "Close notes panel",
    });
    fireEvent.pointerDown(notesClose, { button: 0, ctrlKey: false });
    fireEvent.click(notesClose, { button: 0, ctrlKey: false });

    await waitFor(() => {
      expect(notesDialog).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("dialog", { name: "Knowledge Areas" }),
    ).toBeInTheDocument();
  });
});
