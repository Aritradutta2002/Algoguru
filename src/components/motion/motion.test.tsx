import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { Reveal } from "./Reveal";
import { SpotlightCard, handleSpotlightMove } from "./Spotlight";
import { Magnetic } from "./Magnetic";
import { AnimatedNumber } from "./AnimatedNumber";
import { Typewriter } from "./Typewriter";
import { PageTransition } from "./PageTransition";
import { ScrollProgressBar } from "./ScrollProgressBar";

beforeAll(() => {
  // jsdom lacks IntersectionObserver (used by framer-motion's useInView) —
  // report everything as immediately intersecting.
  if (!("IntersectionObserver" in window)) {
    class MockIntersectionObserver {
      private cb: IntersectionObserverCallback;
      constructor(cb: IntersectionObserverCallback) {
        this.cb = cb;
      }
      observe(target: Element) {
        this.cb([{ isIntersecting: true, target } as IntersectionObserverEntry], this as never);
      }
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  }
});

describe("motion widgets", () => {
  it("Reveal renders its children", () => {
    render(<Reveal>reveal me</Reveal>);
    expect(screen.getByText("reveal me")).toBeInTheDocument();
  });

  it("SpotlightCard tracks the cursor via CSS vars without re-rendering", () => {
    const { container } = render(<SpotlightCard>glow</SpotlightCard>);
    const card = container.firstElementChild as HTMLElement;
    expect(card).toHaveClass("spotlight-card");
    fireEvent.mouseMove(card, { clientX: 120, clientY: 80 });
    expect(card.style.getPropertyValue("--spot-x")).toBe("120px");
    expect(card.style.getPropertyValue("--spot-y")).toBe("80px");
  });

  it("handleSpotlightMove works standalone on any .spotlight-card", () => {
    const el = document.createElement("article");
    el.className = "spotlight-card";
    document.body.appendChild(el);
    handleSpotlightMove({ currentTarget: el, clientX: 10, clientY: 20 } as never);
    expect(el.style.getPropertyValue("--spot-x")).toBe("10px");
    expect(el.style.getPropertyValue("--spot-y")).toBe("20px");
    el.remove();
  });

  it("Magnetic renders children and tolerates hover", () => {
    render(
      <Magnetic>
        <button type="button">pull me</button>
      </Magnetic>,
    );
    const btn = screen.getByRole("button", { name: "pull me" });
    fireEvent.mouseMove(btn, { clientX: 50, clientY: 50 });
    fireEvent.mouseLeave(btn);
    expect(btn).toBeInTheDocument();
  });

  it("AnimatedNumber counts up to its target", async () => {
    render(<AnimatedNumber to={42} suffix="+" duration={60} />);
    expect(screen.getByText("0+")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("42+")).toBeInTheDocument());
  });

  it("Typewriter shows the first word with a caret and exposes all words to AT", () => {
    render(<Typewriter words={["DSA patterns.", "Interviews."]} />);
    expect(screen.getByText("DSA patterns.", { selector: '[aria-hidden="true"]' })).toBeInTheDocument();
    expect(screen.getByText("DSA patterns. Interviews.")).toHaveClass("sr-only");
  });

  it("PageTransition renders children keyed by route", () => {
    const { rerender } = render(<PageTransition routeKey="/a">page a</PageTransition>);
    expect(screen.getByText("page a")).toBeInTheDocument();
    rerender(<PageTransition routeKey="/b">page b</PageTransition>);
    expect(screen.getByText("page b")).toBeInTheDocument();
  });

  it("ScrollProgressBar renders against a container ref", () => {
    function Harness() {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <div className="relative">
          <ScrollProgressBar containerRef={ref as never} />
          <div ref={ref} style={{ overflowY: "auto", height: 100 }}>
            <div style={{ height: 500 }}>tall content</div>
          </div>
        </div>
      );
    }
    const { container } = render(<Harness />);
    const bar = container.querySelector('[aria-hidden="true"].absolute');
    expect(bar).toBeInTheDocument();
  });
});
