import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandLoader } from "./BrandLoader";

describe("BrandLoader", () => {
  it("announces progress politely with a visible label on screen variant", () => {
    render(<BrandLoader variant="screen" label="Loading your workspace" />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Loading your workspace")).not.toHaveClass("sr-only");
  });

  it("keeps the label screen-reader only when inline", () => {
    render(<BrandLoader label="Saving" />);

    expect(screen.getByText("Saving")).toHaveClass("sr-only");
  });

  it("can omit the label entirely", () => {
    const { container } = render(<BrandLoader label={null} />);

    expect(container.querySelector(".agl__label")).toBeNull();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders the orbits, the self-drawing letter and the node spark", () => {
    const { container } = render(<BrandLoader />);

    expect(container.querySelector(".agl__ring--outer")).not.toBeNull();
    expect(container.querySelector(".agl__ring--inner")).not.toBeNull();
    expect(container.querySelector(".agl__ping")).not.toBeNull();
    expect(container.querySelectorAll(".agl__draw")).toHaveLength(2);
    expect(container.querySelector(".agl__spark")).not.toBeNull();
    expect(container.querySelector(".agl__burst")).not.toBeNull();
  });
});
