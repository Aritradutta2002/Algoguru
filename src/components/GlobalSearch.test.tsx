import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { GlobalSearch } from "@/components/GlobalSearch";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_QUICK_ACCESS, SEARCH_TABS } from "@/lib/searchIndex";

const PLACEHOLDER = "Search anything on AlgoGuru...";

function Destination() {
  const location = useLocation();
  return <p>Now at {location.pathname}</p>;
}

function renderSearch() {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<GlobalSearch />} />
          <Route path="*" element={<Destination />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  );
}

/** Renders the palette with the trigger already clicked. */
const openPalette = async () => {
  fireEvent.click(screen.getByRole("button", { name: /search algoguru/i }));
  return screen.findByPlaceholderText(PLACEHOLDER);
};

const type = (input: HTMLElement, value: string) =>
  fireEvent.change(input, { target: { value } });

const optionLabels = () =>
  screen.queryAllByRole("option").map((node) => node.textContent ?? "");

describe("GlobalSearch", () => {
  it("opens from the trigger, focuses the input and renders every tab", async () => {
    renderSearch();
    const input = await openPalette();

    // cmdk never focuses its input on mount, so the palette would open
    // unfocused and swallow the first keystrokes without this.
    expect(input).toHaveFocus();
    SEARCH_TABS.forEach((tab) => {
      expect(screen.getByRole("button", { name: tab.label })).toBeInTheDocument();
    });
  });

  it("renders the brand mark with a URL-safe gradient reference", async () => {
    renderSearch();
    await openPalette();

    // Regression guard: React 18's useId() emits ":r0:", and `url(#:r0:)` is an
    // invalid paint reference that silently blanks the whole mark.
    const paints = Array.from(document.querySelectorAll("svg [fill]")).filter((node) =>
      (node.getAttribute("fill") ?? "").startsWith("url("),
    );
    expect(paints.length).toBeGreaterThan(0);
    paints.forEach((node) => {
      const value = node.getAttribute("fill") ?? "";
      expect(value).toMatch(/^url\(#[A-Za-z0-9_-]+\)$/);
      const id = value.slice(5, -1);
      expect(document.getElementById(id)).not.toBeNull();
    });
  });

  it("toggles with Ctrl+K, closes on Escape and on backdrop click", async () => {
    renderSearch();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = await screen.findByPlaceholderText(PLACEHOLDER);
    expect(input).toHaveFocus();

    fireEvent.click(input);
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByPlaceholderText(PLACEHOLDER)).not.toBeInTheDocument();

    await openPalette();
    fireEvent.click(document.querySelector(".fixed.inset-0.z-\\[9999\\]") as Element);
    expect(screen.queryByPlaceholderText(PLACEHOLDER)).not.toBeInTheDocument();
  });

  it("holds the empty state and quick access chips until two characters are typed", async () => {
    renderSearch();
    const input = await openPalette();

    expect(screen.getByText(/type at least 2 characters/i)).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(DEFAULT_QUICK_ACCESS.length);

    type(input, "a");
    expect(screen.getByText(/type at least 2 characters/i)).toBeInTheDocument();

    type(input, "two sum");
    expect(screen.queryByText(/type at least 2 characters/i)).not.toBeInTheDocument();
    expect(optionLabels().join(" | ")).toMatch(/two sum/i);
  });

  it("groups results under category headings", async () => {
    renderSearch();
    const input = await openPalette();
    type(input, "two sum");

    const headings = screen
      .getAllByText(/^(Topics|Problems & Algorithms|Interview Questions|Roadmaps|My Notes|Templates & Snippets|Pages & Tools)$/)
      .map((node) => node.textContent);
    expect(headings.length).toBeGreaterThan(0);
  });

  it("narrows results to the selected tab", async () => {
    renderSearch();
    const input = await openPalette();
    type(input, "java roadmap");

    const before = optionLabels();
    expect(before.length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Roadmaps" }));

    const after = optionLabels();
    expect(after.length).toBeGreaterThan(0);
    expect(after.length).toBeLessThan(before.length);
    after.forEach((label) => expect(label).toMatch(/roadmap/i));
  });

  it("navigates and resets when a quick access chip is picked", async () => {
    renderSearch();
    await openPalette();

    fireEvent.click(screen.getAllByRole("option")[0]);
    expect(await screen.findByText(`Now at ${DEFAULT_QUICK_ACCESS[0].path}`)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(PLACEHOLDER)).not.toBeInTheDocument();
  });

  it("navigates to the exact route of a selected result", async () => {
    renderSearch();
    const input = await openPalette();
    type(input, "playground");

    fireEvent.click(screen.getByRole("button", { name: "Tools" }));
    const results = screen.getAllByRole("option");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].textContent).toContain("Playground");

    fireEvent.click(results[0]);
    expect(await screen.findByText("Now at /playground")).toBeInTheDocument();
  });

  it("explains an empty result set", async () => {
    renderSearch();
    const input = await openPalette();
    type(input, "zzzqqqxyz");

    expect(screen.getByText(/no results for/i)).toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  // This theme sets --accent to a saturated amber brand colour, so any
  // selection state painted with `bg-accent` renders as a glaring yellow slab
  // that swallows the title, subtitle and badge.
  it("never paints the selected row with the amber accent token", async () => {
    renderSearch();
    const input = await openPalette();
    type(input, "two sum");

    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);

    options.forEach((option) => {
      const className = option.getAttribute("class") ?? "";
      const selectionColors = className.match(/data-\[selected[^\s]*\]:bg-[^\s]+/g) ?? [];
      selectionColors.forEach((utility) => expect(utility).not.toContain("accent"));
      expect(className).not.toMatch(/data-\[selected[^\s]*\]:bg-accent/);
    });
  });
});