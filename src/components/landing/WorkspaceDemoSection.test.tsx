import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { WorkspaceDemoSection } from "./WorkspaceDemoSection";

let prefersReducedMotion = false;
const reducedMotionListeners = new Set<() => void>();
const reducedMotionQuery = {
  get matches() {
    return prefersReducedMotion;
  },
  media: "(prefers-reduced-motion)",
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: (_type: string, listener: () => void) => {
    reducedMotionListeners.add(listener);
  },
  removeEventListener: (_type: string, listener: () => void) => {
    reducedMotionListeners.delete(listener);
  },
  dispatchEvent: vi.fn(() => false),
} as unknown as MediaQueryList;

function setReducedMotion(reduced: boolean) {
  prefersReducedMotion = reduced;
  for (const listener of reducedMotionListeners) listener();
}

function selectTab(tab: HTMLElement) {
  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
  fireEvent.click(tab, { button: 0, ctrlKey: false });
}

describe("WorkspaceDemoSection tabs", () => {
  beforeEach(() => {
    setReducedMotion(true);
    vi.spyOn(window, "matchMedia").mockReturnValue(reducedMotionQuery);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps explicit tab and panel IDs with a roving tab order after focus", () => {
    render(<WorkspaceDemoSection />);
    fireEvent.focus(screen.getByRole("tab", { name: "Problem" }));

    const list = screen.getByRole("tablist", { name: "Workspace demo views" });
    const tabs = within(list).getAllByRole("tab");
    const problem = screen.getByRole("tab", { name: "Problem" });
    const solution = screen.getByRole("tab", { name: "Solution" });
    const tests = screen.getByRole("tab", { name: "Tests" });
    const panel = screen.getByRole("tabpanel");

    expect(tabs.map((tab) => tab.textContent)).toEqual(["Problem", "Solution", "Tests"]);
    expect(problem).toHaveAttribute("id", "demo-tab-problem");
    expect(problem).toHaveAttribute("aria-controls", "demo-panel-problem");
    expect(solution).toHaveAttribute("id", "demo-tab-solution");
    expect(solution).toHaveAttribute("aria-controls", "demo-panel-solution");
    expect(tests).toHaveAttribute("id", "demo-tab-tests");
    expect(tests).toHaveAttribute("aria-controls", "demo-panel-tests");
    expect(problem.tabIndex).toBe(0);
    expect(solution.tabIndex).toBe(-1);
    expect(tests.tabIndex).toBe(-1);
    expect(panel).toHaveAttribute("id", "demo-panel-problem");
    expect(panel).toHaveAttribute("aria-labelledby", "demo-tab-problem");
    expect(panel).toHaveTextContent("Valid Parentheses");
    expect(problem).toHaveClass("lp-tab");
  });

  it("keeps tab icons at their authored 14px size", () => {
    render(<WorkspaceDemoSection />);

    const problem = screen.getByRole("tab", { name: "Problem" });
    const icon = problem.querySelector("svg");
    expect(icon).toHaveAttribute("width", "14");
    expect(icon).toHaveAttribute("height", "14");
    expect(problem).not.toHaveClass("[&_svg]:size-4");
  });

  it("selects each view and keeps its panel relationship and content", async () => {
    render(<WorkspaceDemoSection />);

    selectTab(screen.getByRole("tab", { name: "Solution" }));
    const solutionPanel = await screen.findByRole("tabpanel", { name: "Solution" });
    expect(screen.getByRole("tab", { name: "Solution" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(solutionPanel).toHaveAttribute("id", "demo-panel-solution");
    expect(solutionPanel).toHaveAttribute("aria-labelledby", "demo-tab-solution");
    expect(solutionPanel).toHaveTextContent("Solution.java");

    selectTab(screen.getByRole("tab", { name: "Tests" }));
    const testsPanel = await screen.findByRole("tabpanel", { name: "Tests" });
    expect(screen.getByRole("tab", { name: "Tests" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(testsPanel).toHaveAttribute("id", "demo-panel-tests");
    expect(testsPanel).toHaveAttribute("aria-labelledby", "demo-tab-tests");
    expect(testsPanel).toHaveTextContent("All 8 tests completed.");
  });

  it("preserves arrow wrapping and Home/End keyboard navigation", async () => {
    render(<WorkspaceDemoSection />);

    const problem = screen.getByRole("tab", { name: "Problem" });
    const solution = screen.getByRole("tab", { name: "Solution" });
    const tests = screen.getByRole("tab", { name: "Tests" });

    fireEvent.keyDown(problem, { key: "ArrowRight" });
    await waitFor(() => expect(solution).toHaveFocus());
    expect(solution).toHaveAttribute("aria-selected", "true");
    await screen.findByRole("tabpanel", { name: "Solution" });

    fireEvent.keyDown(solution, { key: "End" });
    await waitFor(() => expect(tests).toHaveFocus());
    expect(tests).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tests, { key: "ArrowRight" });
    await waitFor(() => expect(problem).toHaveFocus());
    expect(problem).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(problem, { key: "ArrowLeft" });
    await waitFor(() => expect(tests).toHaveFocus());
    expect(tests).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tests, { key: "Home" });
    await waitFor(() => expect(problem).toHaveFocus());
    expect(problem).toHaveAttribute("aria-selected", "true");
    await screen.findByRole("tabpanel", { name: "Problem" });
  });

  it("shows a partially visible outgoing pane before the incoming pane enters", async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    render(<WorkspaceDemoSection />);

    const problemPanel = screen.getByRole("tabpanel", { name: "Problem" });
    selectTab(screen.getByRole("tab", { name: "Solution" }));

    expect(problemPanel).toBeInTheDocument();
    expect(screen.queryByRole("tabpanel", { name: "Solution" })).not.toBeInTheDocument();

    // Start the animation frame, then sample halfway through its 200ms exit.
    await act(async () => {
      vi.advanceTimersByTime(16);
    });
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    const opacity = Number.parseFloat(problemPanel.style.opacity);

    expect(problemPanel).toBeInTheDocument();
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
    expect(screen.queryByRole("tabpanel", { name: "Solution" })).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole("tabpanel", { name: "Problem" })).not.toBeInTheDocument();
    expect(screen.getByRole("tabpanel", { name: "Solution" })).toHaveAttribute(
      "id",
      "demo-panel-solution",
    );
  });

  it("syncs left-column workflow steps with the active demo panel and preserves solver link", async () => {
    render(<WorkspaceDemoSection />);

    const testsStep = screen.getByRole("button", { name: /03\s*Tests/i });
    fireEvent.click(testsStep);

    expect(testsStep).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("tab", { name: "Tests" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByRole("tabpanel", { name: "Tests" })).toHaveTextContent("Test suite");
    expect(screen.getByRole("link", { name: /try in solver/i })).toHaveAttribute(
      "href",
      "/problem-solver",
    );
  });
});
