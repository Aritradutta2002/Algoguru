import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    session: null,
    user: null,
    profile: null,
    resolvedAvatar: null,
    loading: false,
    signOut: async () => {},
    refreshProfile: async () => {},
  }),
}));

import Index from "./Index";

function LocationProbe() {
  const loc = useLocation();
  return <span data-testid="test-location">{loc.pathname}</span>;
}

const renderLanding = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <LocationProbe />
      <Index />
    </MemoryRouter>,
  );

beforeAll(() => {
  // jsdom lacks IntersectionObserver (used by framer-motion's useInView).
  if (!("IntersectionObserver" in window)) {
    class MockIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  }
  // jsdom lacks Element.scrollIntoView (used by the hero CTA).
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn() as unknown as typeof Element.prototype.scrollIntoView;
  }
});

describe("Landing page (Index)", () => {
  it("renders the hero heading and primary CTAs", () => {
    renderLanding();
    expect(
      screen.getByRole("heading", { name: /become the engineer teams/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /explore learning paths/i }),
    ).toBeInTheDocument();
    // Hero "Open playground" is the first of several playground links on the page.
    const playgroundCtas = screen.getAllByRole("button", { name: /open playground/i });
    expect(playgroundCtas.length).toBeGreaterThanOrEqual(1);
    expect(playgroundCtas[0]).toBeInTheDocument();
  });

  it("renders all six learning-path modules", () => {
    renderLanding();
    const modules = screen.getByRole("region", { name: /choose where to focus next/i });
    for (const name of [
      "Roadmaps",
      "DSA Sheets",
      "Data Structures",
      "System Design",
      "Interview",
      "Daily Challenge",
    ]) {
      expect(
        within(modules).getByRole("button", { name: new RegExp(`^${name} —`, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("navigates to /playground from the hero secondary CTA", () => {
    renderLanding();
    const playgroundCtas = screen.getAllByRole("button", { name: /open playground/i });
    fireEvent.click(playgroundCtas[0]);
    expect(screen.getByTestId("test-location")).toHaveTextContent("/playground");
  });

  it("navigates to /practice when the DSA Sheets card is clicked", () => {
    renderLanding();
    fireEvent.click(screen.getByRole("button", { name: /dsa sheets/i }));
    expect(screen.getByTestId("test-location")).toHaveTextContent("/practice");
  });

  it("activates module cards via keyboard", () => {
    renderLanding();
    const card = screen.getByRole("button", { name: /daily challenge/i });
    card.focus();
    fireEvent.keyDown(card, { key: "Enter" });
    expect(screen.getByTestId("test-location")).toHaveTextContent("/problem-solver");
  });

  it("toggles FAQ answers open and closed", () => {
    renderLanding();
    const firstQuestion = screen.getByRole("button", { name: /is algoguru free to use\?/i });
    expect(firstQuestion).toHaveAttribute("aria-expanded", "true");

    const secondQuestion = screen.getByRole("button", { name: /where do i start\?/i });
    fireEvent.click(secondQuestion);
    expect(secondQuestion).toHaveAttribute("aria-expanded", "true");
    expect(firstQuestion).toHaveAttribute("aria-expanded", "false");
  });
});
