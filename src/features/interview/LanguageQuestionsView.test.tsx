import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  mockRouter,
  resetNextNavigationMocks,
  setMockParams,
  setMockPathname,
  setMockSearchParams,
} from "@/test/nextNavigationMock";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { InterviewTopic } from "@/data/coreJavaInterviewData";
import {
  LanguageQuestionsView,
  type LanguageQuestionEntry,
  type LanguageQuestionsConfig,
} from "./LanguageQuestionsView";

const mocks = vi.hoisted(() => ({
  setSidebarOpen: vi.fn(),
  toggleSidebar: vi.fn(),
  toast: vi.fn(),
}));

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

vi.mock("@/components/ui/sidebar", () => ({
  useSidebar: () => ({
    setOpen: mocks.setSidebarOpen,
    toggleSidebar: mocks.toggleSidebar,
  }),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

interface LanguageFixture {
  language: string;
  defaultLanguageSlug: "cpp" | "python";
  languageLabel: string;
  codeLanguage: string;
  description: string;
  topics: InterviewTopic[];
}

const cppFixture: LanguageFixture = {
  language: "cpp",
  defaultLanguageSlug: "cpp",
  languageLabel: "C++",
  codeLanguage: "cpp",
  description: "Browse C++ interview topics and questions.",
  topics: [
    {
      id: "cpp-fundamentals",
      title: "C++ Fundamentals",
      icon: "C++",
      questions: [
        {
          id: "cpp-references",
          question: "What is a C++ reference?",
          answer: "A reference is an alias for another object.",
          explanation: "References share the lifetime of the referenced object.",
        },
      ],
    },
    {
      id: "cpp-memory",
      title: "C++ Memory",
      icon: "RAM",
      questions: [
        {
          id: "cpp-move",
          question: "How does move semantics work?",
          answer: "Move semantics transfer resources from a source object.",
          explanation: "Moves avoid unnecessary copies of owning resources.",
        },
      ],
    },
  ],
};

const pythonFixture: LanguageFixture = {
  language: "python",
  defaultLanguageSlug: "python",
  languageLabel: "Python",
  codeLanguage: "python",
  description: "Browse Python interview topics and questions.",
  topics: [
    {
      id: "python-fundamentals",
      title: "Python Fundamentals",
      icon: "Py",
      questions: [
        {
          id: "python-lists",
          question: "What is a Python list?",
          answer: "A list is an ordered mutable sequence.",
          explanation: "Lists preserve insertion order.",
        },
      ],
    },
    {
      id: "python-iterators",
      title: "Python Iterators",
      icon: "Iter",
      questions: [
        {
          id: "python-generators",
          question: "How do Python generators work?",
          answer: "Generators produce values lazily with yield.",
          explanation: "Generators retain their state between iterations.",
        },
      ],
    },
  ],
};

const languageFixtures = [cppFixture, pythonFixture];

function renderQuestions(fixture: LanguageFixture) {
  const pathname = `/interview/${fixture.language}/language-questions`;
  const allQuestions: LanguageQuestionEntry[] = fixture.topics.flatMap((topic) =>
    topic.questions.map((question, index) => ({
      question,
      topic,
      index,
      slug: question.id,
      meta: { difficulty: index === 0 ? ("easy" as const) : ("medium" as const) },
    })),
  );
  const config: LanguageQuestionsConfig = {
    ...fixture,
    pageTitle: `${fixture.languageLabel} Interview Questions | AlgoGuru`,
    pdfTitle: `${fixture.languageLabel} Interview Notes`,
    pdfFilename: `${fixture.languageLabel}-Notes.pdf`,
    topics: fixture.topics,
    allQuestions,
    doneMap: {},
    notesMap: {},
    upsertingId: null,
    toggleDone: vi.fn(),
    saveNote: vi.fn().mockResolvedValue(true),
    deleteNote: vi.fn().mockResolvedValue(true),
    isBookmarked: () => false,
    toggleBookmark: vi.fn(),
    bookmarkedIds: [],
    getDetailPath: (question) => `${pathname}/${question.id}`,
  };

  setMockPathname(pathname);
  setMockParams({ language: fixture.language });

  return render(
    <TooltipProvider>
      <LanguageQuestionsView {...config} />
    </TooltipProvider>,
  );
}

function openTopics() {
  const opener = screen.getByRole("button", { name: "Open Topics" });
  opener.focus();
  fireEvent.click(opener);
  return { opener, dialog: screen.getByRole("dialog", { name: "Topics" }) };
}

let desktopViewport = false;

beforeEach(() => {
  desktopViewport = false;
  resetNextNavigationMocks();
  mocks.setSidebarOpen.mockClear();
  mocks.toggleSidebar.mockClear();
  mocks.toast.mockClear();
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
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  document.body.removeAttribute("data-scroll-locked");
  vi.restoreAllMocks();
});

describe("LanguageQuestionsView topics sheet", () => {
  it.each(languageFixtures)(
    "$languageLabel: exposes named and described modal semantics with language-specific topics",
    (fixture) => {
      renderQuestions(fixture);
      const { opener, dialog } = openTopics();

      expect(dialog).toHaveAccessibleName("Topics");
      expect(dialog).toHaveAccessibleDescription(fixture.description);
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(within(dialog).getByRole("heading", { name: "Topics" })).toBeInTheDocument();
      expect(opener).toHaveAttribute("aria-expanded", "true");
      expect(opener).toHaveAttribute("aria-controls", dialog.id);
      expect(opener.closest('[aria-hidden="true"]')).toBeInTheDocument();
      expect(
        within(dialog).getByRole("button", {
          name: (accessibleName) => accessibleName.includes(fixture.topics[0].title),
        }),
      ).toBeInTheDocument();

      for (const attribute of ["aria-labelledby", "aria-describedby"]) {
        const referencedIds = dialog.getAttribute(attribute)?.split(/\s+/) ?? [];
        expect(referencedIds.length).toBeGreaterThan(0);
        for (const id of referencedIds) {
          expect(document.getElementById(id)).toBeInTheDocument();
        }
      }
    },
  );

  it("keeps the topic opener mobile-only and the existing topics aside desktop-only", () => {
    renderQuestions(cppFixture);

    expect(screen.getByRole("button", { name: "Open Topics" })).toHaveClass("lg:hidden");
    expect(screen.getByRole("complementary")).toHaveClass("hidden", "lg:block");
  });

  it("moves focus into the sheet and returns it to the opener after the custom close", async () => {
    renderQuestions(cppFixture);
    const opener = screen.getByRole("button", { name: "Open Topics" });
    const previousFocus = screen.getByRole("button", { name: "Go back" });
    previousFocus.focus();
    fireEvent.click(opener);

    const dialog = screen.getByRole("dialog", { name: "Topics" });
    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });
    expect(within(dialog).queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    const closeButton = within(dialog).getByRole("button", { name: "Close sidebar" });
    expect(within(dialog).getAllByRole("button", { name: "Close sidebar" })).toHaveLength(1);

    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Topics" })).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
      expect(previousFocus).not.toHaveFocus();
    });
  });

  it("dismisses on Escape and restores focus to the opener", async () => {
    renderQuestions(cppFixture);
    const { opener, dialog } = openTopics();
    within(dialog).getByRole("button", { name: "Close sidebar" }).focus();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Topics" })).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    });
  });

  it("dismisses on a backdrop pointer interaction and restores focus", async () => {
    renderQuestions(cppFixture);
    const { opener, dialog } = openTopics();
    const overlay = dialog.previousElementSibling;
    if (!overlay) throw new Error("Missing topics sheet overlay");

    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });
    fireEvent.pointerDown(overlay, { button: 0, ctrlKey: false });
    fireEvent.click(overlay, { button: 0, ctrlKey: false });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Topics" })).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    });
  });

  it("locks background scrolling while open and releases it after dismissal", async () => {
    renderQuestions(cppFixture);
    const { dialog } = openTopics();

    await waitFor(() => {
      expect(document.body).toHaveAttribute("data-scroll-locked", "1");
      expect(window.getComputedStyle(document.body).overflow).toBe("hidden");
    });

    fireEvent.click(within(dialog).getByRole("button", { name: "Close sidebar" }));

    await waitFor(() => {
      expect(document.body).not.toHaveAttribute("data-scroll-locked");
      expect(window.getComputedStyle(document.body).overflow).not.toBe("hidden");
    });
  });

  it("closes topics and releases modal side effects at the desktop breakpoint", async () => {
    renderQuestions(cppFixture);
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
      expect(opener).toHaveAttribute("aria-expanded", "false");
      expect(document.body).not.toHaveAttribute("data-scroll-locked");
      expect(document.body).not.toHaveStyle({ pointerEvents: "none" });
      expect(opener.closest('[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    opener.focus();
    expect(opener).toHaveFocus();
  });

  it("keeps the left sheet chrome fixed above an independently scrolling topic list", () => {
    renderQuestions(cppFixture);
    const { dialog } = openTopics();
    const viewport = dialog.querySelector("[data-radix-scroll-area-viewport]");

    expect(dialog).toHaveClass(
      "fixed",
      "left-0",
      "z-[40]",
      "flex",
      "h-full",
      "flex-col",
      "overflow-hidden",
      "p-0",
      "lg:hidden",
    );
    expect(dialog.previousElementSibling).toHaveClass("z-[40]", "lg:hidden");
    expect(dialog.firstElementChild).toHaveClass("shrink-0");
    expect(viewport?.parentElement).toHaveClass("min-h-0", "flex-1");
  });

  it.each(languageFixtures)(
    "$languageLabel: selects a topic, preserves other URL filters, and closes with focus restored",
    async (fixture) => {
      setMockSearchParams({ filter: "easy", source: "topics" });
      renderQuestions(fixture);
      const { opener, dialog } = openTopics();
      const selectedTopic = fixture.topics[0];
      const otherTopic = fixture.topics[1];
      within(dialog).getByRole("button", { name: "Close sidebar" }).focus();

      fireEvent.click(
        within(dialog).getByRole("button", {
          name: (accessibleName) => accessibleName.includes(selectedTopic.title),
        }),
      );

      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/interview/${fixture.language}/language-questions?filter=easy&source=topics&topic=${selectedTopic.id}`,
        { scroll: false },
      );
      await waitFor(() => {
        expect(screen.queryByRole("dialog", { name: "Topics" })).not.toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: selectedTopic.questions[0].question }),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole("heading", { name: otherTopic.questions[0].question }),
        ).not.toBeInTheDocument();
        expect(opener).toHaveFocus();
      });
    },
  );

  it("clears only the topic URL parameter when All Topics is selected", async () => {
    setMockSearchParams({ topic: cppFixture.topics[0].id, source: "topics" });
    renderQuestions(cppFixture);
    const { opener, dialog } = openTopics();
    within(dialog).getByRole("button", { name: "Close sidebar" }).focus();

    fireEvent.click(within(dialog).getByRole("button", { name: "All Topics" }));

    expect(mockRouter.replace).toHaveBeenCalledWith(
      "/interview/cpp/language-questions?source=topics",
      { scroll: false },
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Topics" })).not.toBeInTheDocument();
      for (const topic of cppFixture.topics) {
        expect(
          screen.getByRole("heading", { name: topic.questions[0].question }),
        ).toBeInTheDocument();
      }
      expect(opener).toHaveFocus();
    });
  });

  it("closes only the nested notes sheet on Escape before dismissing topics", async () => {
    renderQuestions(cppFixture);
    const notesTrigger = screen.getByRole("button", { name: "Notes" });
    const { opener } = openTopics();

    fireEvent.click(notesTrigger);
    const notesDialog = screen.getByRole("dialog", { name: "My Notes" });
    expect(notesDialog).toHaveClass("z-50");

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "My Notes" })).not.toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Topics" })).toBeInTheDocument();
      expect(document.body).toHaveAttribute("data-scroll-locked", "1");
    });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Topics" })).not.toBeInTheDocument();
      expect(document.body).not.toHaveAttribute("data-scroll-locked");
      expect(opener).toHaveFocus();
    });
  });
});
