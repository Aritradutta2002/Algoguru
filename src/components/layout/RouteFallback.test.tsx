import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppLoadingScreen, PageSkeleton } from "./RouteFallback";
import Loading from "@/app/loading";

describe("AppLoadingScreen", () => {
  it("renders a full-viewport workspace loading screen with accessible status", () => {
    const { container } = render(<AppLoadingScreen />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading your workspace")).toBeInTheDocument();

    const shell = container.querySelector(".agl-screen");
    expect(shell).not.toBeNull();
    expect(shell).toHaveClass("min-h-[100dvh]");
    expect(container.querySelector(".agl-screen__grid")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".agl-screen__aurora")).toHaveAttribute("aria-hidden", "true");
  });

  it("supports custom label, sublabel, determinate progress, and className", () => {
    const { container } = render(
      <AppLoadingScreen
        label="Restoring your session"
        sublabel="Verifying workspace tokens"
        progress={75}
        className="custom-loading-screen"
      />,
    );

    expect(screen.getByText("Restoring your session")).toBeInTheDocument();
    expect(screen.getByText("Verifying workspace tokens")).toBeInTheDocument();
    expect(container.querySelector(".agl-screen")).toHaveClass("custom-loading-screen");
    expect(container.querySelector(".agl__meter")).toHaveClass("agl__meter--determinate");
    expect((container.querySelector(".agl__meter-bar") as HTMLElement).style.width).toBe("75%");
    expect(container.querySelector(".agl__telemetry")).toHaveTextContent("75%");
  });

  it("renders root app/loading.tsx cleanly", () => {
    render(<Loading />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading your workspace")).toBeInTheDocument();
    expect(
      screen.getByText("Preparing editor, tracks, and session state"),
    ).toBeInTheDocument();
  });
});

describe("PageSkeleton", () => {
  it("renders an accessible workspace skeleton matching PageHeader proportions", () => {
    const { container } = render(<PageSkeleton className="custom-skeleton" />);

    const region = screen.getByLabelText("Loading page");
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(region).toHaveClass("custom-skeleton");

    // Anchored inline BrandLoader + staggered enterprise skeleton blocks
    expect(container.querySelector(".agl--inline")).not.toBeNull();
    expect(container.querySelectorAll(".agl-skeleton").length).toBeGreaterThanOrEqual(20);
    expect(screen.getByText("Syncing view")).toBeInTheDocument();
  });
});
