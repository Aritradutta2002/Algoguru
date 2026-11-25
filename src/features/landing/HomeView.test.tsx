import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HomeSidebarContext } from "@/contexts/HomeSidebarContext";
import { mockRouter, resetNextNavigationMocks } from "@/test/nextNavigationMock";
import { HomeView } from "./HomeView";

const motionPreference = vi.hoisted(() => ({ reduced: true }));

vi.mock("next/navigation", async () => {
  const { createNextNavigationMock } = await import("@/test/nextNavigationMock");
  return createNextNavigationMock();
});

vi.mock("next/link", async () => {
  const { createNextLinkMock } = await import("@/test/nextNavigationMock");
  return createNextLinkMock();
});

vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useReducedMotion: () => motionPreference.reduced,
}));

vi.mock("@/components/roadmap/RoadmapFullscreenOverlay", () => ({
  RoadmapFullscreenOverlay: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Learning roadmap">
      <button onClick={onClose}>Close roadmap</button>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  resetNextNavigationMocks();
  motionPreference.reduced = true;
});

function renderHome(toggleHomeSidebar = vi.fn()) {
  return render(
    <HomeSidebarContext.Provider value={{ homeSidebarOpen: false, toggleHomeSidebar }}>
      <HomeView />
    </HomeSidebarContext.Provider>,
  );
}

describe("Home landing page", () => {
  it("renders a visible reduced-motion hero and clearly labels the sample workspace", () => {
    renderHome();
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Prepare for coding interviews with a plan.");
    expect(heading.parentElement).not.toHaveStyle({ opacity: "0" });
    expect(screen.getByText("Workspace preview")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /explore learning paths/i })).toHaveClass("landing-primary");
    expect(screen.getByLabelText("Example Java solution for Two Sum")).toHaveAttribute("tabindex", "0");
  });

  it.each([
    ["Explore learning paths", "modules"],
    ["Start learning free", "modules"],
    ["Or take a 10-question quiz", "quiz"],
  ])("scrolls %s to its existing section", (name, id) => {
    const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
    renderHome();
    fireEvent.click(screen.getByRole("button", { name }));
    expect(scroll).toHaveBeenCalledWith({ behavior: "smooth" });
    expect(scroll.mock.instances[0]).toBe(document.getElementById(id));
  });

  it("uses instant section scrolling when the browser requests reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /explore learning paths/i }));
    expect(scroll).toHaveBeenCalledWith({ behavior: "auto" });
  });

  it("preserves playground navigation", () => {
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /open playground/i }));
    expect(mockRouter.push).toHaveBeenCalledWith("/playground");
  });

  it("preserves all six learning routes and DSA navigation", () => {
    renderHome();
    const modules = document.getElementById("modules")!;
    expect(Array.from(modules.querySelectorAll("a")).map((link) => link.getAttribute("href"))).toEqual([
      "/java-advanced",
      "/practice",
      "/arrays",
      "/interview/java/system-design",
      "/interview",
      "/problem-solver",
    ]);
    expect(screen.getByRole("link", { name: /DSA Sheets/ })).toHaveAttribute("href", "/practice");
  });

  it("opens and closes the lazy-loaded roadmap", async () => {
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /browse full roadmap/i }));
    expect(await screen.findByRole("dialog", { name: "Learning roadmap" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close roadmap" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("preserves the library panel toggle", () => {
    const toggle = vi.fn();
    renderHome(toggle);
    fireEvent.click(screen.getByRole("button", { name: /open library panel/i }));
    expect(toggle).toHaveBeenCalledOnce();
  });

  it("shows the finished hero session immediately for reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    renderHome();
    expect(screen.getByText("All tests passed")).toBeInTheDocument();
    expect(screen.getByText("12 / 12")).toBeInTheDocument();
    expect(screen.getByText("500+")).toBeInTheDocument();
    expect(document.querySelector(".hero-goal-fill")).toBeInTheDocument();
  });

  it("runs the hero session once and keeps a single settled result row", () => {
    motionPreference.reduced = false;
    vi.useFakeTimers();
    renderHome();

    expect(screen.queryByText("All tests passed")).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1200));
    expect(screen.getByText("Running 12 tests…")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(500));
    expect(screen.getAllByText("All tests passed")).toHaveLength(1);

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getAllByText("All tests passed")).toHaveLength(1);
  });

  it("switches the workspace demo with clicks and with arrow keys", async () => {
    renderHome();
    const problemTab = screen.getByRole("tab", { name: "Problem" });
    const testsTab = screen.getByRole("tab", { name: "Tests" });

    expect(problemTab).toHaveAttribute("aria-selected", "true");

    fireEvent.mouseDown(testsTab, { button: 0, ctrlKey: false });
    fireEvent.click(testsTab, { button: 0, ctrlKey: false });
    expect(testsTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Test suite")).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "demo-panel-tests");

    fireEvent.focus(testsTab);
    fireEvent.keyDown(testsTab, {
      key: "ArrowRight",
    });
    // Radix roving focus moves focus on the next tick, so wait for activation.
    await waitFor(() => {
      expect(problemTab).toHaveAttribute("aria-selected", "true");
    });
    expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "demo-panel-problem");
  });

  it("labels the annotated demo solution distinctly from the hero sample", () => {
    renderHome();
    const solutionTab = screen.getByRole("tab", { name: "Solution" });
    fireEvent.mouseDown(solutionTab, { button: 0, ctrlKey: false });
    fireEvent.click(solutionTab, { button: 0, ctrlKey: false });

    expect(
      screen.getByLabelText("Annotated Java solution for Valid Parentheses"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Example Java solution for Two Sum"),
    ).toHaveAttribute("tabindex", "0");
  });

  it("toggles between Solution.java and Notes.md inside the hero workspace preview", () => {
    renderHome();
    expect(screen.getByLabelText("Example Java solution for Two Sum")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Notes.md" }));
    expect(screen.getByText("Complement HashMap")).toBeInTheDocument();
    expect(screen.queryByLabelText("Example Java solution for Two Sum")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Solution.java" }));
    expect(screen.getByLabelText("Example Java solution for Two Sum")).toBeInTheDocument();
  });

  it("renders the capability strip, platform bento routes, and auth sync links", () => {
    renderHome();

    expect(screen.getByRole("region", { name: "Platform capabilities" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /built like an engineering workstation/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open problem solver/i })).toHaveAttribute("href", "/problem-solver");
    expect(screen.getByRole("link", { name: /open contest hub/i })).toHaveAttribute("href", "/contest");
    expect(screen.getByRole("link", { name: /launch playground/i })).toHaveAttribute("href", "/playground");
    expect(screen.getByRole("link", { name: /open study notes/i })).toHaveAttribute("href", "/notes");
    expect(screen.getByRole("link", { name: /explore interactive roadmap/i })).toHaveAttribute("href", "/roadmap");
    expect(screen.getByRole("link", { name: /sign in to sync progress/i })).toHaveAttribute("href", "/auth");
    expect(screen.getByRole("link", { name: /already have an account\? sign in/i })).toHaveAttribute("href", "/auth");
  });
});
