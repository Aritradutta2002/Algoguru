import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandLoader } from "./BrandLoader";

describe("BrandLoader", () => {
  it("announces progress politely with a visible label on screen variant", () => {
    render(<BrandLoader variant="screen" label="Loading your workspace" />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-busy", "true");
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

  it("renders the traced letter, the solid fill and the junction spark", () => {
    const { container } = render(<BrandLoader />);

    // The story runs once: two traced strokes, one solid letter that wipes in,
    // one ignition bloom and one spark. No orbiting rings.
    expect(container.querySelectorAll(".agl__draw")).toHaveLength(2);
    expect(container.querySelector(".agl__draw--stem")).not.toBeNull();
    expect(container.querySelector(".agl__draw--bar")).not.toBeNull();
    expect(container.querySelectorAll(".agl__fill")).toHaveLength(1);
    expect(container.querySelector(".agl__spark")).not.toBeNull();
    expect(container.querySelector(".agl__burst")).not.toBeNull();
    expect(container.querySelector(".agl__sweep")).not.toBeNull();
    expect(container.querySelector(".agl__ring--outer")).toBeNull();
    expect(container.querySelector(".agl__ring--inner")).toBeNull();
    expect(container.querySelector(".agl__ping")).toBeNull();
  });

  it("runs the meter as an indeterminate shimmer when progress is unknown", () => {
    const { container } = render(<BrandLoader variant="screen" label="Fetching" />);

    const meter = container.querySelector(".agl__meter")!;
    expect(meter).not.toBeNull();
    expect(meter).not.toHaveClass("agl__meter--determinate");
    expect(meter.querySelector(".agl__meter-bar")).not.toBeNull();
  });

  it("renders a determinate meter clamped to 0–100 when progress is supplied", () => {
    const { container, rerender } = render(
      <BrandLoader variant="screen" label="Uploading" progress={42} />,
    );

    const meter = container.querySelector(".agl__meter")!;
    expect(meter).toHaveClass("agl__meter--determinate");
    expect((container.querySelector(".agl__meter-bar") as HTMLElement).style.width).toBe("42%");

    rerender(<BrandLoader variant="screen" label="Uploading" progress={400} />);
    expect((container.querySelector(".agl__meter-bar") as HTMLElement).style.width).toBe("100%");

    rerender(<BrandLoader variant="screen" label="Uploading" progress={Number.NaN} />);
    expect(container.querySelector(".agl__meter")).not.toHaveClass("agl__meter--determinate");
  });

  it("never renders the meter in the inline variant", () => {
    const { container } = render(<BrandLoader progress={50} />);
    expect(container.querySelector(".agl__meter")).toBeNull();
  });
});
