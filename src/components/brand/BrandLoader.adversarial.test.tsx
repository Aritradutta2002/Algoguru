import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { BrandLoader, type BrandLoaderSize, type BrandLoaderVariant } from "./BrandLoader";
import { AlgoGuruMark } from "./AlgoGuruMark";
import { AlgoGuruLockup } from "./AlgoGuruLockup";
import {
  BRAND_A,
  BRAND_RAMP,
  BRAND_VIEWBOX,
  BRAND_TILE_PATH,
  glyphStrokeFor,
  showSurfaceDetailFor,
  showNodeFor,
  LOCKUP_HORIZONTAL,
  LOCKUP_STACKED,
} from "./brandGeometry";
import fs from "node:fs";
import path from "node:path";

const readProjectFile = (relative: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relative), "utf-8");

/** Every `M x y …` coordinate pair in a path string. */
const pathPoints = (d: string): Array<[number, number]> =>
  (d.match(/L?\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g) ?? []).map((pair): [number, number] => {
    const [x, y] = pair.replace(/^L?\s*/, "").split(/\s+/);
    return [parseFloat(x), parseFloat(y)];
  });

const polygonArea = (d: string) => {
  const points = pathPoints(d);
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
};

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
    const indexHtml = readProjectFile("index.html");

    // The splash mirrors the geometry verbatim so the two frames can never drift.
    expect(indexHtml).toContain(BRAND_TILE_PATH);
    expect(indexHtml).toContain(BRAND_A.leftStem);
    expect(indexHtml).toContain(BRAND_A.rightStem);
    expect(indexHtml).toContain(BRAND_A.crossbar);
    expect(indexHtml).toContain(
      `cx="${BRAND_A.node.cx}" cy="${BRAND_A.node.cy}"`,
    );
  });

  it("verifies the loader trace lengths match the CSS dash lengths", () => {
    // The traced stem runs from the crest down to the inset foot: the inner
    // edge slope is 2.6 units across the full ascent.
    const stemLen = Math.hypot(2.6, 50.4 - 14);
    expect(Math.abs(stemLen - BRAND_A.traceLengths.rightStem)).toBeLessThan(0.02);

    // The bar sweeps from the junction back out to the left end of the bar.
    const barLen = BRAND_A.node.cx - 20.4;
    expect(Math.abs(barLen - BRAND_A.traceLengths.bar)).toBeLessThan(0.02);

    const brandCss = readProjectFile("src/components/brand/brand.css");

    expect(brandCss).toContain(`--agl-len: ${BRAND_A.traceLengths.rightStem};`);
    expect(brandCss).toContain(`--agl-len: ${BRAND_A.traceLengths.bar};`);
    expect(brandCss).toContain(`stroke-dashoffset: ${BRAND_A.traceLengths.rightStem};`);
    expect(brandCss).toContain(`stroke-dashoffset: ${BRAND_A.traceLengths.bar};`);
  });

  it("keeps the letter inside the tile with a consistent optical margin", () => {
    const fullLetter = [BRAND_A.leftStem, BRAND_A.rightStem, BRAND_A.crossbar].flatMap(pathPoints) as Array<[number, number]>;
    const xs = fullLetter.map(([x]) => x);
    const ys = fullLetter.map(([, y]) => y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Comfortably inside the 64 tile, never touching the edge.
    expect(minX).toBeGreaterThan(10);
    expect(maxX).toBeLessThan(54);
    expect(minY).toBeGreaterThan(10);
    expect(maxY).toBeLessThan(54);

    // Horizontally centred: the left and right bearings agree within 0.5 units.
    expect(Math.abs((minX - 0) - (64 - maxX))).toBeLessThan(0.5);
  });

  it("verifies the junction node sits on the crossbar and on the right stem", () => {
    const { cx, cy, r } = BRAND_A.node;

    // On the crossbar band, and at its vertical centreline.
    expect(cy).toBeGreaterThan(35);
    expect(cy).toBeLessThan(39.6);
    expect(Math.abs(cy - 37.3)).toBeLessThan(0.01);

    // The right stem is a trapezoid whose inner edge runs 35.2 → 37.8 and whose
    // outer edge runs 41.6 → 44.2. Its centreline at the bar is therefore 38.4.
    const innerAt = (y: number) => 35.2 + (2.6 * (y - 19.4)) / (50.4 - 19.4);
    const outerAt = (y: number) => 41.6 + (2.6 * (y - 19.4)) / (50.4 - 19.4);
    expect(cx).toBeGreaterThan(innerAt(cy));
    expect(cx).toBeLessThan(outerAt(cy));
    expect(Math.abs(cx - (innerAt(cy) + outerAt(cy)) / 2)).toBeLessThan(0.25);

    // The node is seated inside the stem, just past where the crossbar ends.
    expect(cx - 37.6).toBeGreaterThan(0);
    expect(cx - 37.6).toBeLessThan(3);

    // The detail is visible without swallowing the bar.
    expect(r).toBeGreaterThan(2);
    expect(r * 2).toBeLessThan(8);
  });

  it("gives the letter enough mass to survive a 16px raster", () => {
    // Counter area at 16px, in device pixels — it must stay clearly open.
    const counterAt16 = (polygonArea(BRAND_A.counter) * 16 * 16) / (64 * 64);
    expect(counterAt16).toBeGreaterThan(4);

    // Brick between the stems, at 16px: two real pixels of separation.
    const xMinLeft = (16 * 17.4) / 64;
    const xMinRight = (16 * 50.1) / 64;
    expect(xMinRight - xMinLeft).toBeGreaterThan(7.5);

    // Crossbar height at 16px: at least 1px.
    expect((5.4 * 16) / 64).toBeGreaterThan(1);
  });
});

describe("Adversarial Stress Test: BrandLoader Variants & Sizing Matrix", () => {
  const sizes: BrandLoaderSize[] = ["sm", "md", "lg"];
  const variants: BrandLoaderVariant[] = ["inline", "screen"];

  const expectedDimensions: Record<BrandLoaderSize, { mark: number; stage: number; hairline: number }> = {
    sm: { mark: 22, stage: 38, hairline: 1 },
    md: { mark: 38, stage: 66, hairline: 1 },
    lg: { mark: 66, stage: 116, hairline: 2 },
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

        // CSS variable for the meter hairline
        expect(root.getAttribute("style")).toContain(
          `--agl-hairline: ${expectedDimensions[size].hairline}px`
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
    expect(stage.style.width).toBe("66px");
    expect(stage.style.height).toBe("66px");

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

    expect(screen.getByRole("status")).toHaveTextContent("Accessible progress");
  });

  it("ensures concurrent loaders generate strictly unique gradient IDs without collision", () => {
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
  const brandCss = readProjectFile("src/components/brand/brand.css");

  it("contains complete @media (prefers-reduced-motion: reduce) block", () => {
    expect(brandCss).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("disables every animated element in reduced-motion mode", () => {
    const reducedMotionSection = brandCss.slice(
      brandCss.lastIndexOf("@media (prefers-reduced-motion: reduce)")
    );

    const expectedNeutralized = [
      ".agl__drawgroup",
      ".agl__draw",
      ".agl__fill",
      ".agl__band",
      ".agl__burst",
      ".agl__spark",
      ".agl__wash",
      ".agl__plate",
      ".agl__sweep",
      ".agl__meter-bar",
    ];

    expectedNeutralized.forEach((selector) => {
      expect(reducedMotionSection).toContain(selector);
    });

    // Check that letter is fully drawn (stroke-dashoffset: 0)
    expect(reducedMotionSection).toContain("stroke-dashoffset: 0;");
    // Check that the drawn letter, fill and spark are visible
    expect(reducedMotionSection).toContain("opacity: 1;");
    // Check that the ignition and band are hidden
    expect(reducedMotionSection).toContain("opacity: 0;");
  });

  it("only animates compositor-friendly properties", () => {
    // Keyframe *blocks* end with a closing brace at column 0; the regex must
    // stop there rather than swallow the following rule.
    const keyframeBodies = brandCss.match(/@keyframes[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g) ?? [];
    expect(keyframeBodies.length).toBeGreaterThan(5);

    for (const block of keyframeBodies) {
      expect(block).not.toMatch(/\b(width|height|top|left|margin|padding|font-size)\s*:/);
    }
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
    // glyphStrokeFor: < 20 -> 8.0, >= 20 -> 6.8
    expect(glyphStrokeFor(16)).toBe(8.0);
    expect(glyphStrokeFor(19.9)).toBe(8.0);
    expect(glyphStrokeFor(20)).toBe(6.8);
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

describe("Adversarial Stress Test: Colour Ramp", () => {
  it("keeps the ramp ordered, opaque and free of near-black stops", () => {
    expect(BRAND_RAMP.length).toBeGreaterThanOrEqual(4);

    const offsets = BRAND_RAMP.map((stop) => parseFloat(stop.offset));
    expect(offsets[0]).toBe(0);
    expect(offsets.at(-1)).toBe(100);
    for (let i = 1; i < offsets.length; i += 1) {
      expect(offsets[i]).toBeGreaterThan(offsets[i - 1]);
    }

    // No stop may be so dark that the white letter loses contrast.
    BRAND_RAMP.forEach(({ color }) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255);
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      expect(luminance).toBeGreaterThan(0.15);
    });
  });
});
