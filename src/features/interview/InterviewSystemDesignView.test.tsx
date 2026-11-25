import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  resetNextNavigationMocks,
  setMockParams,
  setMockPathname,
} from "@/test/nextNavigationMock";
import { TooltipProvider } from "@/components/ui/tooltip";
import InterviewSystemDesignView from "./InterviewSystemDesignView";

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

const sidebarMocks = vi.hoisted(() => ({
  setOpen: vi.fn(),
  toggleSidebar: vi.fn(),
}));

vi.mock("@/components/ui/sidebar", () => ({
  useSidebar: () => sidebarMocks,
}));

const scrollToMock = vi.fn();
let desktopViewport = false;

beforeAll(() => {
  vi.stubGlobal("scrollTo", scrollToMock);
});

beforeEach(() => {
  desktopViewport = false;
  localStorage.clear();
  scrollToMock.mockClear();
  sidebarMocks.setOpen.mockClear();
  sidebarMocks.toggleSidebar.mockClear();
  resetNextNavigationMocks();
  setMockPathname("/interview/java/system-design");
  setMockParams({ language: "java" });
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

function renderView() {
  return render(
    <TooltipProvider>
      <InterviewSystemDesignView language="java" />
    </TooltipProvider>,
  );
}

function openTopicDrawer() {
  const trigger = screen.getByRole("button", { name: "Open Topics" });
  fireEvent.click(trigger);
  const dialog = screen.queryByRole("dialog", { name: "Topics" });
  expect(dialog).toBeInTheDocument();
  return { trigger, dialog: dialog! };
}

describe("InterviewSystemDesignView mobile topic drawer", () => {
  it("renders an accessible mobile-only left Sheet with one custom close control", () => {
    renderView();
    const { trigger, dialog } = openTopicDrawer();

    expect(trigger).toHaveClass("lg:hidden");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger.closest('[aria-hidden="true"]')).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription(
      "Choose a topic to filter the system design questions.",
    );
    expect(dialog.parentElement).toBe(document.body);
    expect(dialog).toHaveClass("fixed", "left-0", "z-50", "lg:hidden");
    expect(dialog.previousElementSibling).toHaveClass(
      "fixed",
      "inset-0",
      "z-50",
      "lg:hidden",
    );

    for (const attribute of ["aria-labelledby", "aria-describedby"]) {
      const referencedIds = dialog.getAttribute(attribute)?.split(/\s+/) ?? [];
      expect(referencedIds.length).toBeGreaterThan(0);
      for (const id of referencedIds) {
        expect(document.getElementById(id)).toBeInTheDocument();
      }
    }

    expect(
      within(dialog).getByRole("heading", { name: "Topics", level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getAllByRole("button", { name: "Close topics drawer" }),
    ).toHaveLength(1);
  });

  it("moves focus into the drawer and returns it to Open Topics on close", async () => {
    renderView();
    const { trigger, dialog } = openTopicDrawer();
    const closeButton = within(dialog).getByRole("button", {
      name: "Close topics drawer",
    });

    await waitFor(() => expect(closeButton).toHaveFocus());
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Topics" }),
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("dismisses the topic drawer with Escape", async () => {
    renderView();
    openTopicDrawer();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Topics" }),
      ).not.toBeInTheDocument();
    });
  });

  it("dismisses the topic drawer when its backdrop is pressed", async () => {
    renderView();
    const { dialog } = openTopicDrawer();
    const backdrop = dialog.previousElementSibling as HTMLElement;

    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });
    fireEvent.pointerDown(backdrop, { button: 0, ctrlKey: false });
    fireEvent.click(backdrop, { button: 0, ctrlKey: false });

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Topics" }),
      ).not.toBeInTheDocument();
    });
  });

  it("locks background scrolling until the drawer closes", async () => {
    renderView();
    const { dialog } = openTopicDrawer();

    await waitFor(() => {
      expect(document.body).toHaveAttribute("data-scroll-locked", "1");
      expect(window.getComputedStyle(document.body).overflow).toBe("hidden");
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close topics drawer" }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Topics" }),
      ).not.toBeInTheDocument();
      expect(document.body).not.toHaveAttribute("data-scroll-locked");
      expect(window.getComputedStyle(document.body).overflow).not.toBe("hidden");
    });
  });

  it("closes topics and releases modal side effects at the desktop breakpoint", async () => {
    renderView();
    const { trigger, dialog } = openTopicDrawer();

    await waitFor(() => {
      expect(document.body).toHaveAttribute("data-scroll-locked");
      expect(document.body).toHaveStyle({ pointerEvents: "none" });
      expect(trigger.closest('[aria-hidden="true"]')).toBeInTheDocument();
    });

    desktopViewport = true;
    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(document.body).not.toHaveAttribute("data-scroll-locked");
      expect(document.body).not.toHaveStyle({ pointerEvents: "none" });
      expect(trigger.closest('[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    trigger.focus();
    expect(trigger).toHaveFocus();
  });

  it("keeps the topic list in an independently scrolling flex region", () => {
    renderView();
    const { dialog } = openTopicDrawer();
    const viewport = dialog.querySelector(
      '[data-radix-scroll-area-viewport]',
    );

    expect(dialog).toHaveClass("flex", "h-full", "flex-col", "overflow-hidden");
    expect(viewport).not.toBeNull();
    expect(viewport?.parentElement).toHaveClass("min-h-0", "flex-1");
  });

  it("selects a topic, closes the drawer, and preserves its diagram content", async () => {
    renderView();
    const { dialog } = openTopicDrawer();

    fireEvent.click(
      within(dialog).getByRole("button", { name: /Databases & Storage/ }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Topics" }),
      ).not.toBeInTheDocument();
    });
    expect(document.getElementById("topic-databases")).toBeInTheDocument();
    expect(document.getElementById("topic-scalability")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Visual" })[0]);

    expect(
      screen.getByRole("heading", { name: "SQL vs NoSQL Comparison" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Structured tables, fixed schema")).toBeInTheDocument();
  });

  it("closes only the nested notes Sheet when Escape is pressed", async () => {
    renderView();
    const topicTrigger = screen.getByRole("button", { name: "Open Topics" });
    const notesTrigger = screen.getByRole("button", { name: "Notes" });

    fireEvent.click(topicTrigger);
    const topicHeading = screen
      .getAllByRole("heading", { name: "Topics", level: 2 })
      .at(-1)!;
    fireEvent.click(notesTrigger);
    expect(screen.getByRole("dialog", { name: "My Notes" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "My Notes" }),
      ).not.toBeInTheDocument();
    });
    expect(topicHeading).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Topics" })).toBeInTheDocument();
  });

  it("keeps underlying notes open when topics opened after notes handles Escape", async () => {
    renderView();
    const topicTrigger = screen.getByRole("button", { name: "Open Topics" });
    const notesTrigger = screen.getByRole("button", { name: "Notes" });

    fireEvent.click(notesTrigger);
    const notesDialog = screen.getByRole("dialog", { name: "My Notes" });
    fireEvent.click(topicTrigger);
    const topicsDialog = screen
      .getAllByRole("dialog", { hidden: true })
      .find((dialog) => dialog !== notesDialog);
    if (!topicsDialog) throw new Error("Missing topics drawer");

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(topicsDialog).not.toBeInTheDocument();
    });
    expect(notesDialog).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "My Notes" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(notesDialog).not.toBeInTheDocument();
    });
  });
});
