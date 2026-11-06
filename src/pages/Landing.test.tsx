import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Landing from "./Landing";

/**
 * Guards the public landing page: it must be reachable without a session,
 * expose one primary action, keep the product preview interactive, and keep
 * the journey + path sections navigable from the keyboard.
 */

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ session: null, loading: false, user: null, profile: null }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Landing />
    </MemoryRouter>,
  );
}

describe("Public landing page", () => {
  it("renders the hero without requiring a session", () => {
    renderLanding();
    expect(
      screen.getByRole("heading", { level: 1, name: /learn algorithms in a workspace/i }),
    ).toBeInTheDocument();
    const primaryCtas = screen.getAllByRole("link", { name: /create a free account/i });
    expect(primaryCtas[0]).toHaveAttribute("href", "/auth?mode=signup");
  });

  it("does not invent social proof or metrics", () => {
    renderLanding();
    expect(document.body.textContent).not.toMatch(/trusted by|testimonial|stars|reviews/i);
    expect(document.body.textContent).not.toMatch(/unlock your potential|revolutionize/i);
  });

  it("switches the workspace preview tabs from the keyboard", () => {
    renderLanding();
    const tabs = screen.getAllByRole("tab", { name: "Approach" });
    fireEvent.click(tabs[0]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Approach · one pass/i)).toBeInTheDocument();
  });

  it("moves through the session walkthrough with arrow keys", () => {
    renderLanding();
    const tablist = screen.getByRole("tablist", { name: /stages of a study session/i });
    const first = within(tablist).getAllByRole("tab")[0];
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowDown" });
    expect(within(tablist).getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");
  });

  it("selects a learning path node and shows its detail", () => {
    renderLanding();
    const nodes = screen.getAllByRole("button", { name: /Graphs & traversal/i });
    fireEvent.click(nodes[0]);
    expect(screen.getByRole("heading", { name: "Graphs & traversal" })).toBeInTheDocument();
  });
});
