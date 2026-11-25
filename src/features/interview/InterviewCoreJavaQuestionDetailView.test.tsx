import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  mockRouter,
  resetNextNavigationMocks,
  setMockParams,
  setMockPathname,
} from "@/test/nextNavigationMock";
import InterviewCoreJavaQuestionDetailView from "./InterviewCoreJavaQuestionDetailView";

vi.mock("next/link", async () => {
  const { createNextLinkMock } = await import("@/test/nextNavigationMock");
  return createNextLinkMock();
});

vi.mock("next/navigation", async () => {
  const { createNextNavigationMock } = await import("@/test/nextNavigationMock");
  return createNextNavigationMock();
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock("@/hooks/useCoreJavaBookmarks", () => ({
  useCoreJavaBookmarks: () => ({
    isBookmarked: () => false,
    toggleBookmark: vi.fn(),
  }),
}));

vi.mock("@/hooks/useCoreJavaUserState", () => ({
  useCoreJavaUserState: () => ({
    doneMap: {},
    toggleDone: vi.fn(),
    isUpserting: () => false,
  }),
}));

vi.mock("@/components/interview/CoreJavaActions", () => ({
  CoreJavaBookmarkButton: () => <button type="button">Bookmark</button>,
  CoreJavaCopyTextButton: () => <button type="button">Copy answer</button>,
  CoreJavaLearnedButton: () => <button type="button">Mark as learned</button>,
  CoreJavaShareButton: () => <button type="button">Share question</button>,
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

function renderDetail() {
  setMockPathname("/interview/java/core-java-qa/why-is-java-so-popular");
  setMockParams({
    language: "java",
    questionSlug: "why-is-java-so-popular",
  });

  return render(
    <InterviewCoreJavaQuestionDetailView
      language="java"
      questionSlug="why-is-java-so-popular"
    />,
  );
}

function openDrawer(name: "Browse all questions" | "Browse all topics" = "Browse all questions") {
  const opener = screen.getByRole("button", { name });
  fireEvent.click(opener);

  return { opener, dialog: screen.getByRole("dialog") };
}

let isDesktopViewport = false;

beforeEach(() => {
  isDesktopViewport = false;
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: query === "(min-width: 1024px)" && isDesktopViewport,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  resetNextNavigationMocks();
  vi.stubGlobal("scrollTo", vi.fn());
  renderDetail();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("InterviewCoreJavaQuestionDetailView question drawer", () => {
  it("names and describes the modal while hiding background content from assistive technology", () => {
    const { opener, dialog } = openDrawer();

    expect(dialog).toHaveAccessibleName("All questions");
    expect(dialog).toHaveAccessibleDescription(
      "Browse Core Java interview topics and questions.",
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
  });

  it("wires both responsive openers to one stable dialog and reflects its state", async () => {
    const mobileOpener = screen.getByRole("button", { name: "Browse all questions" });
    const desktopOpener = screen.getByRole("button", { name: "Browse all topics" });
    const dialogId = mobileOpener.getAttribute("aria-controls") ?? "";

    expect(dialogId).not.toBe("");
    expect(desktopOpener).toHaveAttribute("aria-controls", dialogId);
    for (const opener of [mobileOpener, desktopOpener]) {
      expect(opener).toHaveAttribute("aria-haspopup", "dialog");
      expect(opener).toHaveAttribute("aria-expanded", "false");
    }
    expect(document.getElementById(dialogId)).not.toBeInTheDocument();

    fireEvent.click(mobileOpener);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("id", dialogId);
    for (const opener of [mobileOpener, desktopOpener]) {
      expect(opener).toHaveAttribute("aria-expanded", "true");
    }

    fireEvent.click(screen.getByRole("button", { name: "Close questions drawer" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    for (const opener of [mobileOpener, desktopOpener]) {
      expect(opener).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("moves focus inside the drawer when it opens", async () => {
    const { dialog } = openDrawer();

    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });
  });

  it("restores focus to an opener clicked without browser pointer focus", async () => {
    const opener = screen.getByRole("button", { name: "Browse all questions" });
    expect(opener).not.toHaveFocus();

    fireEvent.click(opener);
    const dialog = screen.getByRole("dialog");
    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });

    fireEvent.click(screen.getByRole("button", { name: "Close questions drawer" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    });
  });

  it("dismisses on Escape and restores focus to the mobile opener", async () => {
    const { opener } = openDrawer();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    });
  });

  it("dismisses from the backdrop", async () => {
    const { dialog } = openDrawer();
    const overlay = dialog.previousElementSibling as Element;

    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });
    fireEvent.pointerDown(overlay, { button: 0, ctrlKey: false });
    fireEvent.click(overlay, { button: 0, ctrlKey: false });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("uses the custom close control and restores focus", async () => {
    const { opener } = openDrawer();

    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close questions drawer" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("keeps the reader chrome fixed above a min-h-0 flex-1 scroll area", () => {
    const { dialog } = openDrawer();
    const viewport = dialog.querySelector("[data-radix-scroll-area-viewport]");

    expect(dialog).toHaveClass(
      "cjq-reader",
      "z-[80]",
      "left-0",
      "flex",
      "flex-col",
      "h-full",
      "overflow-hidden",
      "p-0",
    );
    expect(dialog.previousElementSibling).toHaveClass("z-[80]");
    expect(viewport?.parentElement).toHaveClass("min-h-0", "flex-1");
  });

  it("preserves current-question styling in the drawer", () => {
    const { dialog } = openDrawer();
    const drawer = within(dialog);
    const currentQuestion = drawer.getByRole("button", {
      name: /Why is Java so popular\?/,
    });
    const nextQuestion = drawer.getByRole("button", {
      name: /What is platform independence\?/,
    });

    expect(currentQuestion).toHaveAttribute("aria-current", "true");
    expect(currentQuestion).toHaveClass("cjq-index-link--active");
    expect(nextQuestion).not.toHaveAttribute("aria-current");
  });

  it("restores opener focus before navigating to a drawer question exactly once", async () => {
    const { opener, dialog } = openDrawer();
    let focusAtNavigation: Element | null = null;
    mockRouter.push.mockImplementation(() => {
      focusAtNavigation = document.activeElement;
    });

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: /What is platform independence\?/,
      }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
      expect(focusAtNavigation).toBe(opener);
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
    });
    expect(mockRouter.push).toHaveBeenCalledWith(
      "/interview/java/core-java-qa/what-is-platform-independence",
    );
  });

  it("restores opener focus before navigating to the question list exactly once", async () => {
    const { opener, dialog } = openDrawer();
    let focusAtNavigation: Element | null = null;
    mockRouter.push.mockImplementation(() => {
      focusAtNavigation = document.activeElement;
      return new Promise<void>(() => {});
    });

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "← Back to the question list",
      }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
      expect(focusAtNavigation).toBe(opener);
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
    });
    expect(mockRouter.push).toHaveBeenCalledWith("/interview/java/core-java-qa");
  });

  it("navigates directly from the desktop index without opening the Sheet", () => {
    const nextQuestion = screen.getByRole("button", {
      name: /What is platform independence\?/,
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(nextQuestion);

    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith(
      "/interview/java/core-java-qa/what-is-platform-independence",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("restores focus to the desktop opener rather than the mobile trigger", async () => {
    isDesktopViewport = true;
    const { opener } = openDrawer("Browse all topics");

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
      expect(
        screen.getByRole("button", { name: "Browse all questions" }),
      ).not.toHaveFocus();
    });
  });

  it("restores focus to the opener visible after crossing the lg breakpoint", async () => {
    const mobileOpener = screen.getByRole("button", { name: "Browse all questions" });
    const desktopOpener = screen.getByRole("button", { name: "Browse all topics" });
    fireEvent.click(mobileOpener);
    const dialog = screen.getByRole("dialog");

    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });
    isDesktopViewport = true;
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(desktopOpener).toHaveFocus();
      expect(mobileOpener).not.toHaveFocus();
    });
  });

  it("focuses the question title instead of the hidden alternate opener when the visible opener is disconnected", async () => {
    isDesktopViewport = true;
    const alternateOpener = screen.getByRole("button", { name: "Browse all questions" });
    const questionTitle = screen.getByRole("heading", {
      name: "Why is Java so popular?",
      level: 1,
    });
    const { opener } = openDrawer("Browse all topics");
    opener.remove();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(questionTitle).toHaveFocus();
      expect(alternateOpener).not.toHaveFocus();
    });
    expect(questionTitle).toHaveAttribute("tabindex", "-1");
  });
});
