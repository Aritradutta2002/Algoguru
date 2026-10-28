import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MobileNavigationMenu, PrimaryNavigation, isNavActive } from "./PrimaryNavigation";

afterEach(cleanup);

describe("Primary navigation", () => {
  it.each([
    ["/", "/", true], ["/practice", "/", false],
    ["/interview/java", "/interview", true], ["/interviews", "/interview", false],
  ])("matches %s against %s correctly", (pathname, path, active) => {
    expect(isNavActive(pathname, path)).toBe(active);
  });

  it("preserves six destinations and marks only the active parent", () => {
    render(<MemoryRouter><PrimaryNavigation pathname="/interview/java" /></MemoryRouter>);
    expect(screen.getAllByRole("link")).toHaveLength(6);
    expect(screen.getByRole("link", { name: "Interview" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Roadmap" })).toHaveAttribute("href", "/roadmap");
  });

  function renderMenu(pathname = "/practice") {
    const onClose = vi.fn();
    const onOpenLibrary = vi.fn();
    render(<MemoryRouter><button id="header-navigation-toggle">Menu</button><MobileNavigationMenu pathname={pathname} onClose={onClose} onOpenLibrary={onOpenLibrary} /></MemoryRouter>);
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
    render(<MemoryRouter><PrimaryNavigation pathname="/" /></MemoryRouter>);
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
      </MemoryRouter>
    );

    const guruButton = screen.getByRole("button", { name: /guru ai coach/i });
    expect(guruButton).toBeInTheDocument();
    fireEvent.click(guruButton);

    expect(onToggleGuru).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});

