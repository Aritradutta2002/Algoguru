import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  mockRouter,
  resetNextNavigationMocks,
} from "@/test/nextNavigationMock";
import type { InterviewQuestion, InterviewTopic } from "@/data/coreJavaInterviewData";
import {
  LanguageQuestionDetailView,
  type LanguageDetailEntry,
  type LanguageQuestionDetailConfig,
} from "./LanguageQuestionDetailView";

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

vi.mock("@/components/interview/CppActions", () => ({
  CppBookmarkButton: () => <button type="button">Bookmark</button>,
  CppLearnedButton: () => <button type="button">Mark as learned</button>,
  CppShareButton: () => <button type="button">Share question</button>,
  CppCopyTextButton: () => <button type="button">Copy summary</button>,
}));

vi.mock("@/components/interview/CppQuestionAnswer", () => ({
  CppQuestionAnswer: () => <div>Answer content</div>,
}));

vi.mock("@/components/CodeBlock", () => ({
  CodeBlock: () => <pre>Code example</pre>,
}));

interface LanguageFixture {
  language: string;
  defaultLanguageSlug: "cpp" | "python";
  languageLabel: string;
  codeLanguage: string;
  listPath: string;
  description: string;
  question: InterviewQuestion;
  topic: InterviewTopic;
}

const cppFixture: LanguageFixture = {
  language: "cpp",
  defaultLanguageSlug: "cpp",
  languageLabel: "C++",
  codeLanguage: "cpp",
  listPath: "/interview/cpp/language-questions",
  description: "Browse C++ interview topics and questions.",
  question: {
    id: "raii",
    question: "What is RAII?",
    answer: "Resource acquisition is initialization.\n\nRAII ties resource lifetime to object lifetime.",
    code: "class Resource {};",
    codeLanguage: "cpp",
    explanation: "RAII makes resource ownership explicit.",
  },
  topic: {
    id: "cpp-fundamentals",
    title: "C++ Fundamentals",
    icon: "C++",
    questions: [],
  },
};

const pythonFixture: LanguageFixture = {
  language: "python",
  defaultLanguageSlug: "python",
  languageLabel: "Python",
  codeLanguage: "python",
  listPath: "/interview/python/language-questions",
  description: "Browse Python interview topics and questions.",
  question: {
    id: "python-lists",
    question: "What is a Python list?",
    answer: "A list is an ordered mutable sequence.\n\nLists can hold values of different types.",
    code: "values = [1, 2, 3]",
    codeLanguage: "python",
    explanation: "Lists preserve insertion order.",
  },
  topic: {
    id: "python-fundamentals",
    title: "Python Fundamentals",
    icon: "Py",
    questions: [],
  },
};

const languageFixtures = [cppFixture, pythonFixture];
let desktopViewport = false;

function setDesktopViewport(matches: boolean) {
  desktopViewport = matches;
}

function renderDetail(fixture: LanguageFixture = cppFixture) {
  const topic = { ...fixture.topic, questions: [fixture.question] };
  const entry: LanguageDetailEntry = {
    question: fixture.question,
    topic,
    index: 0,
    slug: fixture.question.id,
    meta: {},
  };
  const config: LanguageQuestionDetailConfig = {
    language: fixture.language,
    questionSlug: entry.slug,
    defaultLanguageSlug: fixture.defaultLanguageSlug,
    languageLabel: fixture.languageLabel,
    codeLanguage: fixture.codeLanguage,
    getEntryBySlug: (slug) => (slug === entry.slug ? entry : undefined),
    getEntryById: (id) => (id === entry.question.id ? entry : undefined),
    getAdjacent: () => ({}),
    getDetailPath: (question) => `${fixture.listPath}/${question.id}`,
    isBookmarked: () => false,
    toggleBookmark: vi.fn(),
    doneMap: {},
    toggleDone: vi.fn(),
    isUpserting: () => false,
    userStateLoading: false,
    readingSectionMap: {},
    saveReadingSection: vi.fn(),
  };

  return render(<LanguageQuestionDetailView {...config} />);
}

function getOpener(scope: "mobile" | "desktop") {
  const selector = scope === "mobile" ? ".cjd-sticky-bar" : ".cjd-sidebar";
  const container = document.querySelector<HTMLElement>(selector);
  if (!container) throw new Error(`Missing ${scope} opener container`);

  return within(container).getByRole("button", { name: "Browse all topics" });
}

function openTopics(scope: "mobile" | "desktop") {
  const opener = getOpener(scope);
  opener.focus();
  fireEvent.click(opener);
  return { opener, dialog: screen.getByRole("dialog", { name: "Topics" }) };
}

beforeEach(() => {
  resetNextNavigationMocks();
  setDesktopViewport(false);
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query === "(min-width: 1024px)" && desktopViewport,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LanguageQuestionDetailView topics sheet", () => {
  it.each(languageFixtures)(
    "$languageLabel: names and describes a modal topics sheet",
    (fixture) => {
      setDesktopViewport(false);
      renderDetail(fixture);
      const { opener, dialog } = openTopics("mobile");

      expect(dialog).toHaveAccessibleName("Topics");
      expect(dialog).toHaveAccessibleDescription(fixture.description);
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(opener.closest('[aria-hidden="true"]')).toBeInTheDocument();

      for (const attribute of ["aria-labelledby", "aria-describedby"]) {
        const referencedIds = dialog.getAttribute(attribute)?.split(/\s+/) ?? [];
        expect(referencedIds.length).toBeGreaterThan(0);
        for (const id of referencedIds) {
          expect(document.getElementById(id)).toBeInTheDocument();
        }
      }
    },
  );

  it("provides a below-lg opener in the sticky header and preserves the desktop opener", () => {
    renderDetail();

    const mobileOpener = getOpener("mobile");
    const desktopOpener = getOpener("desktop");

    expect(mobileOpener).toHaveClass("lg:hidden");
    expect(mobileOpener.closest("header")).toHaveClass("sticky");
    expect(desktopOpener.closest("aside")).toHaveClass("hidden", "lg:block");
  });

  it("gives both openers stable dialog trigger semantics", async () => {
    renderDetail();
    const mobileOpener = getOpener("mobile");
    const desktopOpener = getOpener("desktop");

    for (const opener of [mobileOpener, desktopOpener]) {
      expect(opener).toHaveAttribute("aria-haspopup", "dialog");
      expect(opener).toHaveAttribute("aria-expanded", "false");
      expect(opener).toHaveAttribute("aria-controls");
    }

    const controlsId = mobileOpener.getAttribute("aria-controls");
    expect(controlsId).toBeTruthy();
    expect(desktopOpener).toHaveAttribute("aria-controls", controlsId);

    const { dialog } = openTopics("mobile");
    expect(dialog).toHaveAttribute("id", controlsId);
    expect(mobileOpener).toHaveAttribute("aria-controls", controlsId);
    expect(desktopOpener).toHaveAttribute("aria-controls", controlsId);
    expect(mobileOpener).toHaveAttribute("aria-expanded", "true");
    expect(desktopOpener).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close topics drawer" }),
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(mobileOpener).toHaveAttribute("aria-expanded", "false");
    expect(desktopOpener).toHaveAttribute("aria-expanded", "false");
    expect(mobileOpener).toHaveAttribute("aria-controls", controlsId);
    expect(desktopOpener).toHaveAttribute("aria-controls", controlsId);

    setDesktopViewport(true);
    const { dialog: reopenedDialog } = openTopics("desktop");
    expect(reopenedDialog).toHaveAttribute("id", controlsId);
    expect(mobileOpener).toHaveAttribute("aria-controls", controlsId);
    expect(desktopOpener).toHaveAttribute("aria-controls", controlsId);
  });

  it("moves focus into the mobile sheet and returns it after the custom close", async () => {
    setDesktopViewport(false);
    renderDetail();
    const { opener, dialog } = openTopics("mobile");

    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });
    expect(
      within(dialog).queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close topics drawer" }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
      expect(getOpener("desktop")).not.toHaveFocus();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  it("moves focus into the desktop-opened sheet and returns it after Escape", async () => {
    setDesktopViewport(true);
    renderDetail();
    const { opener, dialog } = openTopics("desktop");

    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
      expect(getOpener("mobile")).not.toHaveFocus();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  it.each(["mobile", "desktop"] as const)(
    "returns focus to the %s opener after a click that did not focus it",
    async (scope) => {
      setDesktopViewport(scope === "desktop");
      renderDetail();
      const unrelatedControl = screen.getByRole("link", { name: "Home" });
      unrelatedControl.focus();
      const opener = getOpener(scope);

      expect(unrelatedControl).toHaveFocus();
      expect(opener).not.toHaveFocus();
      fireEvent.click(opener);
      const dialog = screen.getByRole("dialog", { name: "Topics" });

      await waitFor(() => {
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
      });
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Close topics drawer" }),
      );

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(opener).toHaveFocus();
        expect(unrelatedControl).not.toHaveFocus();
      });
    },
  );

  it.each([
    {
      openedScope: "mobile",
      openedAtDesktop: false,
      visibleScope: "desktop",
      closedAtDesktop: true,
    },
    {
      openedScope: "desktop",
      openedAtDesktop: true,
      visibleScope: "mobile",
      closedAtDesktop: false,
    },
  ] as const)(
    "returns focus to the $visibleScope opener after crossing the lg breakpoint",
    async ({ openedScope, openedAtDesktop, visibleScope, closedAtDesktop }) => {
      setDesktopViewport(openedAtDesktop);
      renderDetail();
      const visibleOpener = getOpener(visibleScope);
      const { opener, dialog } = openTopics(openedScope);

      await waitFor(() => {
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
      });
      setDesktopViewport(closedAtDesktop);
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Close topics drawer" }),
      );

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(visibleOpener).toHaveFocus();
        expect(opener).not.toHaveFocus();
        expect(mockRouter.push).not.toHaveBeenCalled();
      });
    },
  );

  it("dismisses when the backdrop is clicked", async () => {
    setDesktopViewport(false);
    renderDetail();
    const { opener, dialog } = openTopics("mobile");
    const overlay = dialog.previousElementSibling;
    if (!overlay) throw new Error("Missing sheet overlay");

    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });
    fireEvent.pointerDown(overlay, { button: 0, ctrlKey: false });
    fireEvent.click(overlay, { button: 0, ctrlKey: false });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("keeps the chrome fixed above a min-h-0 flex-1 scroll area", () => {
    setDesktopViewport(false);
    renderDetail();
    const { dialog } = openTopics("mobile");
    const viewport = dialog.querySelector("[data-radix-scroll-area-viewport]");

    expect(dialog).toHaveClass(
      "fixed",
      "left-0",
      "z-[80]",
      "flex",
      "h-full",
      "flex-col",
      "overflow-hidden",
      "p-0",
    );
    expect(dialog.previousElementSibling).toHaveClass("z-[80]");
    expect(dialog.firstElementChild).toHaveClass("shrink-0");
    expect(viewport?.parentElement).toHaveClass("min-h-0", "flex-1");
  });

  it.each([
    {
      scope: "mobile",
      isDesktop: false,
      action: "all questions",
      buttonName: /All C\+\+ Questions/,
      destination: "/interview/cpp/language-questions",
    },
    {
      scope: "desktop",
      isDesktop: true,
      action: "all questions",
      buttonName: /All C\+\+ Questions/,
      destination: "/interview/cpp/language-questions",
    },
    {
      scope: "mobile",
      isDesktop: false,
      action: "the current topic",
      buttonName: /Fundamentals \(current\)/,
      destination:
        "/interview/cpp/language-questions?topic=cpp-fundamentals",
    },
    {
      scope: "desktop",
      isDesktop: true,
      action: "the current topic",
      buttonName: /Fundamentals \(current\)/,
      destination:
        "/interview/cpp/language-questions?topic=cpp-fundamentals",
    },
  ] as const)(
    "closes the sheet and restores $scope focus before navigating to $action",
    async ({ scope, isDesktop, buttonName, destination }) => {
      setDesktopViewport(isDesktop);
      renderDetail();
      const opener = getOpener(scope);
      const hiddenAlternateOpener = getOpener(
        scope === "mobile" ? "desktop" : "mobile",
      );
      const { dialog } = openTopics(scope);

      mockRouter.push.mockImplementationOnce(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(document.activeElement).toBe(opener);
        expect(opener.isConnected).toBe(true);
        expect(hiddenAlternateOpener).not.toHaveFocus();
      });

      fireEvent.click(within(dialog).getByRole("button", { name: buttonName }));

      expect(mockRouter.push).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(destination);
      });
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(opener).toHaveFocus();
      expect(hiddenAlternateOpener).not.toHaveFocus();
    },
  );

  it("falls back to the question heading when the visible opener disconnects before navigation", async () => {
    setDesktopViewport(true);
    renderDetail();
    const hiddenMobileOpener = getOpener("mobile");
    const questionHeading = screen.getByRole("heading", {
      level: 1,
      name: cppFixture.question.question,
    });
    const { opener, dialog } = openTopics("desktop");
    const openerPlaceholder = document.createElement("span");
    opener.replaceWith(openerPlaceholder);

    try {
      mockRouter.push.mockImplementationOnce(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(document.activeElement).toBe(questionHeading);
        expect(questionHeading).toHaveAttribute("tabindex", "-1");
        expect(hiddenMobileOpener).not.toHaveFocus();
      });

      fireEvent.click(
        within(dialog).getByRole("button", { name: /All C\+\+ Questions/ }),
      );

      expect(mockRouter.push).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          "/interview/cpp/language-questions",
        );
      });
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(questionHeading).toHaveFocus();
      expect(opener.isConnected).toBe(false);
      expect(hiddenMobileOpener).not.toHaveFocus();
    } finally {
      openerPlaceholder.replaceWith(opener);
    }
  });
});
