import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { MobileNavigationMenu, PrimaryNavigation, isNavActive } from "./PrimaryNavigation";

vi.mock("next/link", async () => {
  const { createNextLinkMock } = await import("@/test/nextNavigationMock");
  return createNextLinkMock();
});

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
    render(<PrimaryNavigation pathname="/interview/java" />);
    expect(screen.getAllByRole("link")).toHaveLength(6);
    expect(screen.getByRole("link", { name: "Interview" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Roadmap" })).toHaveAttribute("href", "/roadmap");
  });

  it("hides contest live dot by default and shows it only when a contest is running", () => {
    const { rerender } = render(<PrimaryNavigation pathname="/" contestLive={false} />);
    expect(screen.queryByLabelText("Contest live")).not.toBeInTheDocument();

    rerender(<PrimaryNavigation pathname="/" contestLive={true} />);
    expect(screen.getByLabelText("Contest live")).toBeInTheDocument();
  });

  it("opens a canonical 2-column navigation dialog after exactly 200ms using Popper placement", async () => {
    vi.useFakeTimers();
    render(<PrimaryNavigation pathname="/" />);

    const practiceLink = screen.getByRole("link", { name: "Practice" });
    fireEvent.mouseEnter(practiceLink.parentElement!);

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(screen.queryByRole("dialog", { name: /practice quick links/i })).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    const dialog = screen.getByRole("dialog", { name: /practice quick links/i });
    const popperWrapper = dialog.parentElement;
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(practiceLink).toHaveAttribute("aria-haspopup", "dialog");
    expect(practiceLink).toHaveAttribute("aria-expanded", "true");
    expect(practiceLink).toHaveAttribute("aria-controls", dialog.id);
    expect(within(dialog).getByText("DSA Problem Sheets")).toBeInTheDocument();
    expect(dialog.querySelector(".grid")).toHaveClass("grid-cols-2");
    expect(dialog).toHaveClass("w-[480px]");
    expect(dialog).not.toHaveClass("absolute");
    expect(dialog).not.toHaveClass("left-0");
    expect(dialog).not.toHaveClass("top-[calc(100%-2px)]");
    expect(dialog.style.position).toBe("");
    expect(dialog.style.left).toBe("");
    expect(dialog.style.top).toBe("");
    expect(popperWrapper).toHaveAttribute("data-radix-popper-content-wrapper");
    expect(popperWrapper).toHaveStyle({ position: "fixed", minWidth: "max-content" });
    vi.useRealTimers();
    await waitFor(() =>
      expect(popperWrapper?.style.transform).not.toBe("translate(0, -200%)"),
    );
    expect(dialog).toHaveAttribute("data-side", "bottom");
    expect(dialog).toHaveAttribute("data-align", "start");
    // jsdom cannot prove pixel geometry; real-browser QA must verify anchoring and collision.
  });

  it("opens on keyboard focus and returns focus to the trigger on Escape without reopening", () => {
    vi.useFakeTimers();
    render(<PrimaryNavigation pathname="/" />);

    const practiceLink = screen.getByRole("link", { name: "Practice" });
    act(() => {
      practiceLink.focus();
      vi.advanceTimersByTime(200);
    });

    const menu = screen.getByLabelText(/practice quick links/i);
    const firstDestination = within(menu).getByRole("link", { name: /dsa problem sheets/i });
    act(() => {
      firstDestination.focus();
    });
    expect(firstDestination).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByLabelText(/practice quick links/i)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(practiceLink).toHaveFocus();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByLabelText(/practice quick links/i)).not.toBeInTheDocument();
  });

  it("dismisses on outside interaction but not inside or on the mega-menu trigger", () => {
    vi.useFakeTimers();
    render(<PrimaryNavigation pathname="/" />);

    const practiceLink = screen.getByRole("link", { name: "Practice" });
    fireEvent.mouseEnter(practiceLink.parentElement!);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const menu = screen.getByLabelText(/practice quick links/i);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    fireEvent.pointerDown(practiceLink);
    expect(screen.getByLabelText(/practice quick links/i)).toBeInTheDocument();

    fireEvent.pointerDown(menu);
    fireEvent.click(menu);
    expect(screen.getByLabelText(/practice quick links/i)).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.queryByLabelText(/practice quick links/i)).not.toBeInTheDocument();
  });

  it("keeps the portaled mega menu open during pointer transfer and applies the leave delay", () => {
    vi.useFakeTimers();
    render(<PrimaryNavigation pathname="/" />);

    const practiceLink = screen.getByRole("link", { name: "Practice" });
    const triggerContainer = practiceLink.parentElement!;
    fireEvent.mouseEnter(triggerContainer);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const menu = screen.getByLabelText(/practice quick links/i);

    fireEvent.mouseLeave(triggerContainer);
    act(() => {
      vi.advanceTimersByTime(149);
    });
    expect(screen.getByLabelText(/practice quick links/i)).toBeInTheDocument();

    fireEvent.mouseEnter(menu);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByLabelText(/practice quick links/i)).toBeInTheDocument();

    fireEvent.mouseLeave(menu);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.queryByLabelText(/practice quick links/i)).not.toBeInTheDocument();
  });

  it("closes the mega menu when the route changes", () => {
    vi.useFakeTimers();
    const { rerender } = render(<PrimaryNavigation pathname="/" />);

    const practiceLink = screen.getByRole("link", { name: "Practice" });
    fireEvent.mouseEnter(practiceLink.parentElement!);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByLabelText(/practice quick links/i)).toBeInTheDocument();

    rerender(<PrimaryNavigation pathname="/practice" />);
    expect(screen.queryByLabelText(/practice quick links/i)).not.toBeInTheDocument();
  });

  function renderMenu(pathname = "/practice") {
    const onClose = vi.fn();
    const onOpenLibrary = vi.fn();

    function MenuHarness() {
      const [open, setOpen] = useState(false);
      const closeMenu = () => {
        onClose();
        setOpen(false);
      };

      return (
        <>
          <button
            id="header-navigation-toggle"
            aria-expanded={open}
            aria-controls={open ? "header-navigation-menu" : undefined}
            onClick={() => setOpen((current) => !current)}
          >
            Menu
          </button>
          {open && (
            <MobileNavigationMenu
              pathname={pathname}
              onClose={closeMenu}
              onOpenLibrary={onOpenLibrary}
            />
          )}
          <a id="background-destination" href="#main-content">
            Background destination
          </a>
        </>
      );
    }

    render(<MenuHarness />);
    const trigger = screen.getByRole("button", { name: "Menu" });
    const destination = screen.getByRole("link", { name: "Background destination" });
    fireEvent.click(trigger);
    return { onClose, onOpenLibrary, trigger, destination };
  }

  it("renders mobile navigation as an accessible controlled Sheet", () => {
    const { trigger } = renderMenu();
    const dialog = screen.getByRole("dialog", { name: "Mobile primary" });

    expect(dialog).toHaveAttribute("id", "header-navigation-menu");
    expect(dialog).toHaveAccessibleDescription("Primary navigation links and actions.");
    expect(within(dialog).getByRole("navigation", { name: "Mobile primary" })).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", dialog.id);
    expect(dialog).toHaveClass("header-menu-sheet", "top-16", "h-[calc(100dvh-4rem)]", "sm:w-80");
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("focuses the active mobile link and restores trigger focus on Escape", async () => {
    const { onClose, trigger } = renderMenu();
    expect(screen.getByRole("link", { name: "Practice" })).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog", { name: "Mobile primary" })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveAttribute("aria-controls");
  });

  it("leaves focus on the background destination after keyboard Tab-out", async () => {
    const { onClose, trigger, destination } = renderMenu();
    const lastControl = screen.getByRole("button", {
      name: /browse learning library/i,
    });
    lastControl.focus();

    fireEvent.keyDown(lastControl, { key: "Tab" });
    act(() => destination.focus());

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog", { name: "Mobile primary" })).not.toBeInTheDocument();
    await waitFor(() => expect(destination).toHaveFocus());
    expect(trigger).not.toHaveFocus();
  });

  it("focuses the first destination when the route has no primary match", () => {
    renderMenu("/notes");
    expect(screen.getByRole("link", { name: "Home" })).toHaveFocus();
  });

  it("dismisses on outside interaction but not inside or on the menu trigger", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const onOpenLibrary = vi.fn();

    function OutsideMenuHarness() {
      const [open, setOpen] = useState(true);
      const closeMenu = () => {
        onClose();
        setOpen(false);
      };

      return (
        <>
          <button id="header-navigation-toggle" onClick={() => {}}>
            Menu
          </button>
          {open && (
            <MobileNavigationMenu
              pathname="/practice"
              onClose={closeMenu}
              onOpenLibrary={onOpenLibrary}
            />
          )}
        </>
      );
    }

    render(<OutsideMenuHarness />);
    const dialog = screen.getByRole("dialog", { name: "Mobile primary" });
    const trigger = screen.getByRole("button", { name: "Menu" });
    act(() => {
      vi.advanceTimersByTime(0);
    });

    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(dialog).toBeInTheDocument();

    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(dialog).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog", { name: "Mobile primary" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes the mobile Sheet on navigation", () => {
    const { onClose } = renderMenu();
    const playgroundLink = screen.getByRole("link", { name: "Playground" });
    playgroundLink.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(playgroundLink);
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog", { name: "Mobile primary" })).not.toBeInTheDocument();
  });

  it("preserves mobile learning library access", () => {
    const { onClose, onOpenLibrary } = renderMenu();
    fireEvent.click(screen.getByRole("button", { name: /browse learning library/i }));
    expect(onOpenLibrary).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("prioritizes daily driver engineering routes with high priority", () => {
    render(<PrimaryNavigation pathname="/" />);
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
      <>
        <button id="header-navigation-toggle">Menu</button>
        <MobileNavigationMenu
          pathname="/practice"
          onClose={onClose}
          onOpenLibrary={onOpenLibrary}
          onToggleGuru={onToggleGuru}
        />
      </>,
    );

    const guruButton = screen.getByRole("button", { name: /guru ai coach/i });
    expect(guruButton).toBeInTheDocument();
    fireEvent.click(guruButton);

    expect(onToggleGuru).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("partitions links and renders 'More' dropdown when constrained", () => {
    render(<PrimaryNavigation pathname="/" maxVisibleItems={4} />);

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
    render(<PrimaryNavigation pathname="/contest" maxVisibleItems={4} />);

    const moreButton = screen.getByRole("button", { name: /more navigation options/i });
    expect(moreButton).toHaveClass("text-foreground");
  });

  it("shows contest live dot on 'More' button when contest is live in overflow", () => {
    render(<PrimaryNavigation pathname="/" contestLive={true} maxVisibleItems={4} />);

    const moreButton = screen.getByRole("button", { name: /more navigation options/i });
    expect(moreButton.querySelector('[aria-label="Contest live"]')).toBeInTheDocument();
  });

  it("observes parent container width and keeps all six links visible on desktop widths", () => {
    const observedTargets: Element[] = [];
    let roCallback: ResizeObserverCallback | null = null;
    const OriginalRO = globalThis.ResizeObserver;

    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        roCallback = cb;
      }
      observe(target: Element) {
        observedTargets.push(target);
      }
      disconnect() {}
      unobserve() {}
    }

    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    try {
      render(
        <div data-testid="nav-slot" style={{ width: "620px" }}>
          <PrimaryNavigation pathname="/" />
        </div>,
      );

      const slot = screen.getByTestId("nav-slot");
      expect(observedTargets).toContain(slot);

      act(() => {
        roCallback?.(
          [{ contentRect: { width: 620 } } as ResizeObserverEntry],
          {} as ResizeObserver,
        );
      });

      expect(screen.getAllByRole("link")).toHaveLength(6);
      expect(screen.queryByRole("button", { name: /more navigation options/i })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");

      act(() => {
        roCallback?.(
          [{ contentRect: { width: 420 } } as ResizeObserverEntry],
          {} as ResizeObserver,
        );
      });

      expect(screen.getByRole("button", { name: /more navigation options/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Roadmap" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Contest" })).not.toBeInTheDocument();
    } finally {
      globalThis.ResizeObserver = OriginalRO;
    }
  });

  it("renders active route pill styling and optional theme toggle inside mobile drawer", () => {
    const onToggleTheme = vi.fn();
    render(
      <>
        <button id="header-navigation-toggle">Menu</button>
        <MobileNavigationMenu
          pathname="/practice"
          onClose={vi.fn()}
          onOpenLibrary={vi.fn()}
          onToggleTheme={onToggleTheme}
          isDark={true}
        />
      </>,
    );

    const activeLink = screen.getByRole("link", { name: "Practice" });
    expect(activeLink).toHaveAttribute("aria-current", "page");
    expect(activeLink).toHaveClass("bg-foreground/[0.06]", "text-foreground");

    const themeButton = screen.getByRole("button", { name: /switch to light mode/i });
    expect(themeButton).toBeInTheDocument();
    fireEvent.click(themeButton);
    expect(onToggleTheme).toHaveBeenCalledOnce();
  });
});
