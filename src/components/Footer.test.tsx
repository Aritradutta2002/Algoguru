import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import { Footer } from "./Footer";

vi.mock("next/link", async () => {
  const { createNextLinkMock } = await import("@/test/nextNavigationMock");
  return createNextLinkMock();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("Footer", () => {
  it("renders semantic footer and navigation landmarks", () => {
    render(<Footer onSupportClick={vi.fn()} />);

    const footer = screen.getByRole("contentinfo", { name: "Site footer" });
    expect(footer).toBeInTheDocument();

    expect(
      within(footer).getByRole("navigation", { name: "Workspace" }),
    ).toBeInTheDocument();
    expect(
      within(footer).getByRole("navigation", { name: "Curriculum" }),
    ).toBeInTheDocument();
    expect(
      within(footer).getByRole("navigation", { name: "Paths and account" }),
    ).toBeInTheDocument();
    expect(
      within(footer).getByRole("navigation", { name: "Connect" }),
    ).toBeInTheDocument();
  });

  it("renders brand lockup, positioning statement, and command hint", () => {
    render(<Footer onSupportClick={vi.fn()} />);

    const homeLink = screen.getByRole("link", { name: "AlgoGuru home" });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(homeLink.querySelector("svg")).toBeInTheDocument();

    expect(
      screen.getByText(/structured engineering workspace/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /quick search/i }),
    ).toHaveTextContent("⌘K");
  });

  it("links only to verified internal routes and safe external social links", () => {
    render(<Footer onSupportClick={vi.fn()} />);

    const expectedInternalRoutes: Array<[string, string]> = [
      ["DSA Practice", "/practice"],
      ["Code Playground", "/playground"],
      ["Problem Solver", "/problem-solver"],
      ["Coding Contests", "/contest"],
      ["Notes", "/notes"],
      ["Arrays & Patterns", "/arrays"],
      ["Dynamic Programming", "/dp"],
      ["Advanced Java", "/java-advanced"],
      ["System Design", "/interview/java/system-design"],
      ["Interview Hub", "/interview"],
      ["Learning Roadmap", "/roadmap"],
      ["Java Roadmap", "/java-roadmap"],
      ["Sign in", "/auth"],
      ["Support", "/support"],
      ["Buy me a coffee", "/buy-me-a-coffee"],
    ];

    for (const [label, href] of expectedInternalRoutes) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href,
      );
    }

    const connectNav = screen.getByRole("navigation", { name: "Connect" });
    const socialLinks = within(connectNav).getAllByRole("link");
    expect(socialLinks).toHaveLength(4);
    for (const link of socialLinks) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("invokes onSupportClick and handles omitted onSupportClick gracefully", () => {
    const onSupportClick = vi.fn();
    const { rerender } = render(<Footer onSupportClick={onSupportClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Buy me a coffee" }));
    expect(onSupportClick).toHaveBeenCalledTimes(1);

    rerender(<Footer />);
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: "Buy me a coffee" })),
    ).not.toThrow();
  });

  it("dispatches Cmd/Ctrl+K keydown event from the quick search hint button", () => {
    const keydownSpy = vi.fn();
    window.addEventListener("keydown", keydownSpy);

    render(<Footer onSupportClick={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /quick search/i }));

    expect(keydownSpy).toHaveBeenCalledTimes(1);
    const event = keydownSpy.mock.calls[0][0] as KeyboardEvent;
    expect(event.key).toBe("k");
    expect(event.metaKey || event.ctrlKey).toBe(true);

    window.removeEventListener("keydown", keydownSpy);
  });

  it("scrolls #main-content to top when present and falls back to window.scrollTo", () => {
    const main = document.createElement("main");
    main.id = "main-content";
    main.scrollTo = vi.fn();
    document.body.appendChild(main);

    const windowScrollTo = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => {});

    render(<Footer onSupportClick={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Back to top" }));
    expect(main.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(windowScrollTo).not.toHaveBeenCalled();

    main.remove();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);

    fireEvent.click(screen.getByRole("button", { name: "Back to top" }));
    expect(windowScrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });

  it("renders dynamic copyright year and supported product track summary", () => {
    render(<Footer onSupportClick={vi.fn()} />);

    const year = new Date().getFullYear();
    expect(
      screen.getByText(`© ${year} AlgoGuru. All rights reserved.`),
    ).toBeInTheDocument();
    expect(screen.getByText("Built by Aritra")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Supported engineering tracks"),
    ).toHaveTextContent("DSA · Java · System Design · Contests");
  });
});
