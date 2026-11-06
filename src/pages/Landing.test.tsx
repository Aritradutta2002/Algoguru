import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Landing from "./Landing";

/**
 * Guards the public landing page: reachable without a session, one clear
 * primary action, a keyboard-operable product demo, the full session story,
 * and no invented social proof.
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
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Read the idea.");
    expect(heading).toHaveTextContent("Keep the skill.");

    const primaryCtas = screen.getAllByRole("link", {
      name: /create your workspace/i,
    });
    expect(primaryCtas[0]).toHaveAttribute("href", "/auth?mode=signup");
  });

  it("does not invent social proof or metrics", () => {
    renderLanding();
    expect(document.body.textContent).not.toMatch(
      /trusted by|testimonial|stars|reviews/i,
    );
    expect(document.body.textContent).not.toMatch(
      /unlock your potential|revolutionize/i,
    );
  });

  it("switches the workspace preview tabs", () => {
    renderLanding();
    const tabs = screen.getAllByRole("tab", { name: "Approach" });
    fireEvent.click(tabs[0]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/one pass · hash map/i)).toBeInTheDocument();
  });

  it("tells the session story in four chapters", () => {
    renderLanding();
    const chapters = [
      /a page you revise/i,
      /the editor sits next to the statement/i,
      /complexity, written down/i,
      /progress that survives the week/i,
    ];
    chapters.forEach((chapter) => {
      expect(screen.getAllByText(chapter).length).toBeGreaterThan(0);
    });
  });

  it("selects a learning path node and shows its detail", () => {
    renderLanding();
    const nodes = screen.getAllByRole("button", {
      name: /Graphs & traversal/i,
    });
    fireEvent.click(nodes[0]);
    expect(
      screen.getByRole("heading", { name: "Graphs & traversal" }),
    ).toBeInTheDocument();
  });
});
