import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MobileNavigationMenu, PrimaryNavigation, isNavActive } from "./PrimaryNavigation";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Primary navigation", () => {
  it.each([
    ["/", "/", true],
    ["/practice", "/", false],
    ["/interview/java", "/interview", true],
    ["/interviews", "/interview", false],
  ])("matches %s against %s correctly", (pathname, path, active) => {
    expect(isNavActive(pathname, path)).toBe(active);
  });

  it("preserves six destinations and marks only the active parent", () => {
    render(
      <MemoryRouter>
        <PrimaryNavigation pathname="/interview/java" />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole("link")).toHaveLength(6);
    expect(screen.getByRole("link", { name: "Interview" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Roadmap" })).toHaveAttribute("href", "/roadmap");
  });

  it("hides contest live dot by default and shows it only when a contest is running", () => {
    const { rerender } = render(
      <MemoryRouter>
        <PrimaryNavigation pathname="/" contestLive={false} />
      </MemoryRouter>,
    );
    expect(screen.queryByLabelText("Contest live")).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <PrimaryNavigation pathname="/" contestLive={true} />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText("Contest live")).toBeInTheDocument();
  });

  it("opens 2-column mega menu after 200ms hover delay and closes on Escape", () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <PrimaryNavigation pathname="/" />
      </MemoryRouter>,
    );

    const practiceLink = screen.getByRole("link", { name: "Practice" });
    fireEvent.mouseEnter(practiceLink.parentElement!);

    expect(screen.queryByRole("region", { name: /practice quick links/i })).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByRole("region", { name: /practice quick links/i })).toBeInTheDocument();
    expect(screen.getByText("DSA Problem Sheets")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("region", { name: /practice quick links/i })).not.toBeInTheDocument();
  });

  function renderMenu(pathname = "/practice") {
    const onClose = vi.fn();
    const onOpenLibrary = vi.fn();
    render(
      <MemoryRouter>
        <button id="header-navigation-toggle">Menu</button>
        <MobileNavigationMenu pathname={pathname} onClose={onClose} onOpenLibrary={onOpenLibrary} />
      </MemoryRouter>,
    );
    return { onClose, onOpenLibrary };
  }

  it("focuses the active mobile link and restores trigger focus on Escape", () => {
    const { onClose } = renderMenu();
    expect(screen.getByRole("link", { name: "Practice" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Menu" })).toHaveFocus();
  });

  it("focuses the first destination when the route has no primary match", () => {
    renderMenu("/notes");
    expect(screen.getByRole("link", { name: "Home" })).toHaveFocus();
  });

  it("dismisses on outside interaction but not inside or on the menu trigger", () => {
    const { onClose } = renderMenu();
    fireEvent.pointerDown(screen.getByRole("navigation"));
    fireEvent.pointerDown(screen.getByRole("button", { name: "Menu" }));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on navigation and preserves library access", () => {
    const { onClose, onOpenLibrary } = renderMenu();
    fireEvent.click(screen.getByRole("link", { name: "Playground" }));
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: /browse learning library/i }));
    expect(onOpenLibrary).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("prioritizes daily driver engineering routes with high priority", () => {
    render(
      <MemoryRouter>
        <PrimaryNavigation pathname="/" />
      </MemoryRouter>,
    );
    const practiceLink = screen.getByRole("link", { name: "Practice" });
    const interviewLink = screen.getByRole("link", { name: "Interview" });
    const roadmapLink = screen.getByRole("link", { name: "Roadmap" });
    expect(practiceLink).toBeInTheDocument();
    expect(interviewLink).toBeInTheDocument();
    expect(roadmapLink).toBeInTheDocument();
  });

  it("triggers Guru AI when launched from mobile drawer", () => {
    const onClose = vi.fn();
    const onOpenLibrary = vi.fn();
    const onToggleGuru = vi.fn();

    render(
      <MemoryRouter>
        <button id="header-navigation-toggle">Menu</button>
        <MobileNavigationMenu
          pathname="/practice"
          onClose={onClose}
          onOpenLibrary={onOpenLibrary}
          onToggleGuru={onToggleGuru}
        />
      </MemoryRouter>,
    );

    const guruButton = screen.getByRole("button", { name: /guru ai coach/i });
    expect(guruButton).toBeInTheDocument();
    fireEvent.click(guruButton);

    expect(onToggleGuru).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("partitions links and renders 'More' dropdown when constrained", () => {
    render(
      <MemoryRouter>
        <PrimaryNavigation pathname="/" maxVisibleItems={4} />
      </MemoryRouter>,
    );

    // 4 visible links
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Practice" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Interview" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Roadmap" })).toBeInTheDocument();
    // Overflow items should not be direct links in the nav
    expect(screen.queryByRole("link", { name: "Playground" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Contest" })).not.toBeInTheDocument();

    // "More" button is present
    const moreButton = screen.getByRole("button", { name: /more navigation options/i });
    expect(moreButton).toBeInTheDocument();

    // Open dropdown via Radix pointer/keyboard interaction
    fireEvent.pointerDown(moreButton, { button: 0, ctrlKey: false });
    if (moreButton.getAttribute("aria-expanded") !== "true") {
      fireEvent.keyDown(moreButton, { key: "Enter" });
    }
    expect(screen.getByRole("menuitem", { name: /playground/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /contest/i })).toBeInTheDocument();
  });

  it("activates 'More' button when active route is an overflow destination", () => {
    render(
      <MemoryRouter>
        <PrimaryNavigation pathname="/contest" maxVisibleItems={4} />
      </MemoryRouter>,
    );

    const moreButton = screen.getByRole("button", { name: /more navigation options/i });
    expect(moreButton).toHaveClass("text-slate-900");
  });

  it("shows contest live dot on 'More' button when contest is live in overflow", () => {
    render(
      <MemoryRouter>
        <PrimaryNavigation pathname="/" contestLive={true} maxVisibleItems={4} />
      </MemoryRouter>,
    );

    const moreButton = screen.getByRole("button", { name: /more navigation options/i });
    expect(moreButton.querySelector('[aria-label="Contest live"]')).toBeInTheDocument();
  });
});
