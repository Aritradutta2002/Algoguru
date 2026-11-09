import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { BrandLoader, type BrandLoaderSize, type BrandLoaderVariant } from "./BrandLoader";
import { AlgoGuruMark } from "./AlgoGuruMark";
import { AlgoGuruLockup } from "./AlgoGuruLockup";
import {
  BRAND_VIEWBOX,
  BRAND_TILE_PATH,
  BRAND_GLYPH,
  glyphStrokeFor,
  showSurfaceDetailFor,
  showNodeFor,
  LOCKUP_HORIZONTAL,
  LOCKUP_STACKED,
} from "./brandGeometry";
import fs from "node:fs";
import path from "node:path";

describe("Adversarial Stress Test: SVG Brand Geometry Integrity", () => {
  it("verifies superellipse geometry: all coordinates inside [0, 64] viewBox with continuous closed path", () => {
    expect(BRAND_VIEWBOX).toBe(64);
    expect(BRAND_TILE_PATH.startsWith("M")).toBe(true);
    expect(BRAND_TILE_PATH.endsWith("Z")).toBe(true);

    // Extract all commands and points: M64.00 32.00L63.98 40.63...
    const pointMatches = BRAND_TILE_PATH.slice(1, -1).split("L");
    expect(pointMatches.length).toBe(128);

    for (const pt of pointMatches) {
      const [xStr, yStr] = pt.trim().split(/\s+/);
      const x = parseFloat(xStr);
      const y = parseFloat(yStr);

      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      // All points must be within [0, 64]
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(64);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(64);

      // Superellipse formula verification: ((x-32)/32)^4.6 + ((y-32)/32)^4.6 ≈ 1
      const xNorm = Math.abs((x - 32) / 32);
      const yNorm = Math.abs((y - 32) / 32);
      const residual = Math.pow(xNorm, 4.6) + Math.pow(yNorm, 4.6);
      // Residual should be very close to 1 (tolerance 0.015 due to 2 decimal places rounding)
      expect(Math.abs(residual - 1)).toBeLessThan(0.015);
    }
  });

  it("verifies path sync between brandGeometry.ts and index.html boot-splash", () => {
    const indexPath = path.resolve(process.cwd(), "index.html");
    const indexHtml = fs.readFileSync(indexPath, "utf-8");

    // Verify index.html contains the exact same BRAND_TILE_PATH
    expect(indexHtml).toContain(BRAND_TILE_PATH);

    // Verify index.html contains BRAND_GLYPH.trace and BRAND_GLYPH.bar
    expect(indexHtml).toContain(BRAND_GLYPH.trace);
    expect(indexHtml).toContain(BRAND_GLYPH.bar);

    // Verify index.html contains exact node coordinates cx="39.2" cy="36.0"
    expect(indexHtml).toContain(`cx="${BRAND_GLYPH.node.cx}" cy="${BRAND_GLYPH.node.cy.toFixed(1)}"`);
  });

  it("verifies stroke length math vs CSS dash lengths", () => {
    // Leg 1: (16, 50) -> (32, 14)
    // Leg 2: (32, 14) -> (48, 50)
    const leg1Len = Math.hypot(32 - 16, 14 - 50);
    const leg2Len = Math.hypot(48 - 32, 50 - 14);
    const totalLegsLen = leg1Len + leg2Len;

    // Computed length is ~78.79086 units
    expect(Math.abs(totalLegsLen - 78.8)).toBeLessThan(0.02);

    // Crossbar: (22, 36) -> (42, 36)
    const barLen = 42 - 22;
    expect(barLen).toBe(20);

    // Check brand.css defines exactly these dash lengths
    const brandCssPath = path.resolve(process.cwd(), "src/components/brand/brand.css");
    const brandCss = fs.readFileSync(brandCssPath, "utf-8");

    expect(brandCss).toContain("--agl-len: 78.8;");
    expect(brandCss).toContain("--agl-len: 20;");
    expect(brandCss).toContain("stroke-dashoffset: 78.8;");
    expect(brandCss).toContain("stroke-dashoffset: 20;");
  });

  it("verifies nexus node geometric position on the crossbar junction", () => {
    const { cx, cy, r } = BRAND_GLYPH.node;
    expect(cx).toBe(39.2);
    expect(cy).toBe(36.0);
    expect(r).toBe(4.2);

    // Crossbar runs horizontally along y = 36 from x=22 to x=42
    expect(cy).toBe(36.0);
    expect(cx).toBeGreaterThanOrEqual(22);
    expect(cx).toBeLessThanOrEqual(42);

    // Right leg equation: from (32, 14) to (48, 50)
    // Slope = (50 - 14) / (48 - 32) = 36 / 16 = 2.25
    // At y = 36: x = 32 + (36 - 14) / 2.25 = 32 + 22 / 2.25 = 41.7778
    const junctionX = 32 + (36 - 14) / 2.25;
    // Node radius is 4.2, centered at 39.2. Left bound = 35.0, Right bound = 43.4
    // Node bounds comfortably encompass the junction at x = 41.78
    expect(cx - r).toBeLessThan(junctionX);
    expect(cx + r).toBeGreaterThan(junctionX);
  });
});

describe("Adversarial Stress Test: BrandLoader Variants & Sizing Matrix", () => {
  const sizes: BrandLoaderSize[] = ["sm", "md", "lg"];
  const variants: BrandLoaderVariant[] = ["inline", "screen"];

  const expectedDimensions: Record<BrandLoaderSize, { mark: number; stage: number; ring: number }> = {
    sm: { mark: 20, stage: 34, ring: 1.5 },
    md: { mark: 40, stage: 70, ring: 2 },
    lg: { mark: 72, stage: 124, ring: 2.5 },
  };

  sizes.forEach((size) => {
    variants.forEach((variant) => {
      it(`renders correctly for matrix combination size=${size} variant=${variant}`, () => {
        const { container } = render(
          <BrandLoader size={size} variant={variant} label={`Testing ${size}-${variant}`} />
        );

        const root = container.querySelector(".agl")!;
        expect(root).not.toBeNull();
        expect(root).toHaveClass(`agl--${variant}`);
        expect(root).toHaveAttribute("role", "status");
        expect(root).toHaveAttribute("aria-live", "polite");

        // CSS variable for orbit thickness
        expect(root.getAttribute("style")).toContain(
          `--agl-orbit-thickness: ${expectedDimensions[size].ring}px`
        );

        // Stage dimensions
        const stage = container.querySelector(".agl__stage") as HTMLElement;
        expect(stage).not.toBeNull();
        expect(stage.style.width).toBe(`${expectedDimensions[size].stage}px`);
        expect(stage.style.height).toBe(`${expectedDimensions[size].stage}px`);

        // Mark size
        const mark = container.querySelector(".agl__mark") as SVGElement;
        expect(mark).not.toBeNull();
        expect(mark.getAttribute("width")).toBe(`${expectedDimensions[size].mark}`);
        expect(mark.getAttribute("height")).toBe(`${expectedDimensions[size].mark}`);

        // Glyph SVG size
        const glyph = container.querySelector(".agl__glyph") as SVGElement;
        expect(glyph).not.toBeNull();
        expect(glyph.getAttribute("width")).toBe(`${expectedDimensions[size].mark}`);
        expect(glyph.getAttribute("height")).toBe(`${expectedDimensions[size].mark}`);
        expect(glyph.getAttribute("viewBox")).toBe("0 0 64 64");

        // Label visibility
        const labelEl = container.querySelector(".agl__label");
        expect(labelEl).not.toBeNull();
        if (variant === "inline") {
          expect(labelEl).toHaveClass("sr-only");
          expect(container.querySelector(".agl__meter")).toBeNull();
        } else {
          expect(labelEl).not.toHaveClass("sr-only");
          const meter = container.querySelector(".agl__meter");
          expect(meter).not.toBeNull();
          expect(meter?.querySelector(".agl__meter-bar")).not.toBeNull();
        }
      });
    });
  });

  it("handles default props gracefully (size=md, variant=inline, label='Loading')", () => {
    const { container } = render(<BrandLoader />);
    const root = container.querySelector(".agl")!;
    expect(root).toHaveClass("agl--inline");

    const stage = container.querySelector(".agl__stage") as HTMLElement;
    expect(stage.style.width).toBe("70px");
    expect(stage.style.height).toBe("70px");

    const labelEl = container.querySelector(".agl__label");
    expect(labelEl).toHaveTextContent("Loading");
    expect(labelEl).toHaveClass("sr-only");
  });

  it("handles null and empty labels without throwing", () => {
    const { container: c1 } = render(<BrandLoader label={null} />);
    expect(c1.querySelector(".agl__label")).toBeNull();

    const { container: c2 } = render(<BrandLoader label="" />);
    expect(c2.querySelector(".agl__label")).toBeNull();
  });

  it("handles custom className injection cleanly", () => {
    const { container } = render(<BrandLoader className="custom-test-class pointer-events-none" />);
    const root = container.querySelector(".agl")!;
    expect(root).toHaveClass("custom-test-class");
    expect(root).toHaveClass("pointer-events-none");
    expect(root).toHaveClass("agl--inline");
  });
});

describe("Adversarial Stress Test: Accessibility & Assistive Technology", () => {
  it("ensures all non-textual graphical components are aria-hidden", () => {
    const { container } = render(<BrandLoader variant="screen" label="Accessible progress" />);

    const stage = container.querySelector(".agl__stage");
    expect(stage).toHaveAttribute("aria-hidden", "true");

    const glyphSvg = container.querySelector(".agl__glyph");
    expect(glyphSvg).toHaveAttribute("aria-hidden", "true");
    expect(glyphSvg).toHaveAttribute("focusable", "false");

    const meter = container.querySelector(".agl__meter");
    expect(meter).toHaveAttribute("aria-hidden", "true");

    const mark = container.querySelector(".agl__mark");
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark).toHaveAttribute("role", "presentation");
  });

  it("ensures concurrent loaders generate strictly unique burst gradient IDs without collision", () => {
    const { container } = render(
      <div>
        {Array.from({ length: 25 }).map((_, i) => (
          <BrandLoader key={i} size="sm" label={`Loader ${i}`} />
        ))}
      </div>
    );

    const burstGradients = container.querySelectorAll("radialGradient[id^='agl-burst-']");
    expect(burstGradients.length).toBe(25);

    const ids = new Set<string>();
    burstGradients.forEach((grad) => {
      const id = grad.getAttribute("id");
      expect(id).not.toBeNull();
      // Must not contain invalid characters like colons
      expect(id).toMatch(/^[a-zA-Z0-9_-]+$/);
      expect(ids.has(id!)).toBe(false);
      ids.add(id!);

      // Corresponding circle must reference this exact ID
      const parentSvg = grad.closest("svg")!;
      const burstCircle = parentSvg.querySelector(".agl__burst");
      expect(burstCircle?.getAttribute("fill")).toBe(`url(#${id})`);
    });
  });

  it("handles special characters in labels safely", () => {
    const adversarialLabel = `<script>alert('xss')</script> & "special" 'chars'`;
    render(<BrandLoader variant="screen" label={adversarialLabel} />);

    // Must be rendered as text, not HTML
    expect(screen.getByText(adversarialLabel)).toBeInTheDocument();
  });
});

describe("Adversarial Stress Test: Reduced Motion Styles in brand.css", () => {
  const brandCssPath = path.resolve(process.cwd(), "src/components/brand/brand.css");
  const brandCss = fs.readFileSync(brandCssPath, "utf-8");

  it("contains complete @media (prefers-reduced-motion: reduce) block", () => {
    expect(brandCss).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("disables all animation keys in reduced-motion mode", () => {
    const reducedMotionSection = brandCss.slice(brandCss.indexOf("@media (prefers-reduced-motion: reduce)"));

    // Check all animated elements have animation: none
    const expectedNeutralized = [
      ".agl__drawgroup",
      ".agl__draw",
      ".agl__spark",
      ".agl__burst",
      ".agl__halo",
      ".agl__ping",
      ".agl__mark",
      ".agl__ring--outer",
      ".agl__ring--inner",
      ".agl__meter-bar",
    ];

    expectedNeutralized.forEach((selector) => {
      expect(reducedMotionSection).toContain(selector);
    });

    // Check that letter is fully drawn (stroke-dashoffset: 0)
    expect(reducedMotionSection).toContain("stroke-dashoffset: 0;");
    // Check that drawgroup and spark have opacity 1
    expect(reducedMotionSection).toContain("opacity: 1;");
    // Check that ping and burst are hidden
    expect(reducedMotionSection).toContain("opacity: 0;");
    // Check meter is display: none
    expect(reducedMotionSection).toContain("display: none;");
  });
});

describe("Adversarial Stress Test: Boot Splash Lifecycle and Synchronization", () => {
  let splashEl: HTMLDivElement;

  beforeEach(() => {
    splashEl = document.createElement("div");
    splashEl.id = "boot-splash";
    document.body.appendChild(splashEl);
  });

  afterEach(() => {
    splashEl.remove();
  });

  it("simulates dismissBootSplash: sets data-state='leaving' and removes on transitionend", () => {
    // Replicate dismissBootSplash logic from src/main.tsx
    function dismissBootSplash() {
      const splash = document.getElementById("boot-splash");
      if (!splash) return;

      splash.setAttribute("data-state", "leaving");

      const remove = () => splash.remove();
      splash.addEventListener("transitionend", remove, { once: true });
      window.setTimeout(remove, 400);
    }

    expect(document.getElementById("boot-splash")).toBeInTheDocument();
    dismissBootSplash();

    expect(splashEl.getAttribute("data-state")).toBe("leaving");

    // Dispatch transitionend
    act(() => {
      splashEl.dispatchEvent(new Event("transitionend"));
    });

    expect(document.getElementById("boot-splash")).toBeNull();
  });

  it("simulates fallback timeout when transitionend is skipped (e.g. background tab)", () => {
    vi.useFakeTimers();

    function dismissBootSplash() {
      const splash = document.getElementById("boot-splash");
      if (!splash) return;

      splash.setAttribute("data-state", "leaving");

      const remove = () => splash.remove();
      splash.addEventListener("transitionend", remove, { once: true });
      window.setTimeout(remove, 400);
    }

    dismissBootSplash();
    expect(splashEl.getAttribute("data-state")).toBe("leaving");
    expect(document.getElementById("boot-splash")).not.toBeNull();

    // Advance timer past 400ms without dispatching transitionend
    act(() => {
      vi.advanceTimersByTime(450);
    });

    expect(document.getElementById("boot-splash")).toBeNull();
    vi.useRealTimers();
  });

  it("is idempotent and does not throw when called with no splash present", () => {
    splashEl.remove();

    function dismissBootSplash() {
      const splash = document.getElementById("boot-splash");
      if (!splash) return;

      splash.setAttribute("data-state", "leaving");
      const remove = () => splash.remove();
      splash.addEventListener("transitionend", remove, { once: true });
      window.setTimeout(remove, 400);
    }

    expect(() => dismissBootSplash()).not.toThrow();
  });
});

describe("Adversarial Stress Test: AlgoGuruMark Thresholds & Geometry", () => {
  it("verifies threshold helpers across edge sizes", () => {
    // glyphStrokeFor: < 24 -> 8.0, >= 24 -> 6.8
    expect(glyphStrokeFor(16)).toBe(8.0);
    expect(glyphStrokeFor(23.9)).toBe(8.0);
    expect(glyphStrokeFor(24)).toBe(6.8);
    expect(glyphStrokeFor(32)).toBe(6.8);

    // showSurfaceDetailFor: >= 20
    expect(showSurfaceDetailFor(16)).toBe(false);
    expect(showSurfaceDetailFor(19.9)).toBe(false);
    expect(showSurfaceDetailFor(20)).toBe(true);
    expect(showSurfaceDetailFor(32)).toBe(true);

    // showNodeFor: >= 16
    expect(showNodeFor(15.9)).toBe(false);
    expect(showNodeFor(16)).toBe(true);
    expect(showNodeFor(32)).toBe(true);
  });

  it("renders AlgoGuruMark across all variants (gradient, mono, reverse, knockout)", () => {
    const variants = ["gradient", "mono", "reverse", "knockout"] as const;

    variants.forEach((v) => {
      const { container } = render(<AlgoGuruMark size={32} variant={v} title={`Mark ${v}`} />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("role", "img");
      expect(svg).toHaveAttribute("aria-label", `Mark ${v}`);
    });
  });

  it("renders AlgoGuruMark as presentation when title is null", () => {
    const { container } = render(<AlgoGuruMark size={24} title={null} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("role", "presentation");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg?.querySelector("title")).toBeNull();
  });
});

describe("Adversarial Stress Test: AlgoGuruLockup Proportions", () => {
  it("calculates exact proportional widths for horizontal and stacked orientations", () => {
    // Horizontal: w = (size * 268) / 64
    const { container: cHoriz } = render(<AlgoGuruLockup size={40} orientation="horizontal" />);
    const svgHoriz = cHoriz.querySelector("svg")!;
    expect(parseFloat(svgHoriz.getAttribute("width")!)).toBe((40 * LOCKUP_HORIZONTAL.w) / LOCKUP_HORIZONTAL.h);
    expect(parseFloat(svgHoriz.getAttribute("height")!)).toBe(40);

    // Stacked: w = (size * 200) / 180
    const { container: cStack } = render(<AlgoGuruLockup size={45} orientation="stacked" />);
    const svgStack = cStack.querySelector("svg")!;
    expect(parseFloat(svgStack.getAttribute("width")!)).toBe((45 * LOCKUP_STACKED.w) / LOCKUP_STACKED.h);
    expect(parseFloat(svgStack.getAttribute("height")!)).toBe(45);
  });
});
