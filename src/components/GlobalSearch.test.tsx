import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_QUICK_ACCESS, SEARCH_TABS } from "@/lib/searchIndex";
import { mockRouter, resetNextNavigationMocks } from "@/test/nextNavigationMock";

vi.mock("next/navigation", async () => {
  const { createNextNavigationMock } = await import("@/test/nextNavigationMock");
  return createNextNavigationMock();
});

const PLACEHOLDER = "Search anything on AlgoGuru...";

afterEach(() => {
  resetNextNavigationMocks();
});

function renderSearch() {
  return render(
    <TooltipProvider>
      <GlobalSearch />
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
  it("opens an accessible dialog from the trigger, focuses the input and renders every tab", async () => {
    renderSearch();
    const input = await openPalette();
    const dialog = screen.getByRole("dialog", { name: "Search AlgoGuru" });
    const title = within(dialog).getByRole("heading", {
      name: "Search AlgoGuru",
      level: 2,
    });
    const description = within(dialog).getByText(
      "Search topics, problems, and notes across AlgoGuru.",
    );

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(title.id).not.toBe("");
    expect(dialog).toHaveAttribute("aria-labelledby", title.id);
    expect(description.id).not.toBe("");
    expect(dialog).toHaveAttribute("aria-describedby", description.id);

    // cmdk never focuses its input on mount, so the palette would open
    // unfocused and swallow the first keystrokes without this.
    expect(input).toHaveFocus();
    expect(screen.getByRole("combobox", { name: "Search AlgoGuru" })).toBe(input);
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

  it("toggles with Ctrl/Cmd+K and closes on Escape", async () => {
    renderSearch();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = await screen.findByPlaceholderText(PLACEHOLDER);
    expect(input).toHaveFocus();

    fireEvent.click(input);
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(PLACEHOLDER)).not.toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(await screen.findByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "k", metaKey: true });
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(PLACEHOLDER)).not.toBeInTheDocument();
    });
  });

  it("dismisses on the Radix overlay pointerdown and click sequence", async () => {
    renderSearch();
    await openPalette();
    const dialog = screen.getByRole("dialog", { name: "Search AlgoGuru" });
    const overlay = dialog.previousElementSibling;

    expect(overlay).toBeInTheDocument();
    fireEvent.pointerDown(overlay as Element, { button: 0, ctrlKey: false });
    fireEvent.click(overlay as Element, { button: 0, ctrlKey: false });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Search AlgoGuru" })).not.toBeInTheDocument();
    });
  });

  it("returns focus to the trigger after dismissal", async () => {
    renderSearch();
    const trigger = screen.getByRole("button", { name: /search algoguru/i });
    act(() => trigger.focus());
    fireEvent.click(trigger);
    const input = await screen.findByPlaceholderText(PLACEHOLDER);
    expect(input).toHaveFocus();

    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(PLACEHOLDER)).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it("reports Radix dismissal through onOpenChange when controlled without a trigger", async () => {
    const onOpenChange = vi.fn();
    render(
      <TooltipProvider>
        <GlobalSearch open onOpenChange={onOpenChange} showTrigger={false} />
      </TooltipProvider>,
    );
    const dialog = await screen.findByRole("dialog", { name: "Search AlgoGuru" });
    const overlay = dialog.previousElementSibling;

    expect(screen.queryByRole("button", { name: /search algoguru/i })).not.toBeInTheDocument();
    expect(overlay).toBeInTheDocument();
    fireEvent.pointerDown(overlay as Element, { button: 0, ctrlKey: false });
    fireEvent.click(overlay as Element, { button: 0, ctrlKey: false });

    expect(onOpenChange).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(dialog).toBeInTheDocument();
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
    expect(screen.queryByText(/no results for/i)).not.toBeInTheDocument();
  });

  it("groups results under category headings", async () => {
    renderSearch();
    const input = await openPalette();
    type(input, "two sum");

    const headings = Array.from(
      screen.getByRole("listbox").querySelectorAll("[cmdk-group-heading]"),
    );
    expect(headings.length).toBeGreaterThan(0);
    headings.forEach((heading) => {
      expect(heading.textContent).toMatch(
        /^(Topics|Problems & Algorithms|Interview Questions|Roadmaps|My Notes|Templates & Snippets|Pages & Tools)$/,
      );
    });
  });

  it("narrows results to the selected tab", async () => {
    renderSearch();
    const input = await openPalette();
    type(input, "java roadmap");

    const before = optionLabels();
    expect(before.length).toBeGreaterThan(0);

    const roadmapsTab = screen.getByRole("button", { name: "Roadmaps" });
    const topicsTab = screen.getByRole("button", { name: "Topics" });
    fireEvent.click(roadmapsTab);

    expect(roadmapsTab).toHaveAttribute("aria-pressed", "true");
    expect(topicsTab).toHaveAttribute("aria-pressed", "false");
    const after = optionLabels();
    expect(after.length).toBeGreaterThan(0);
    expect(after.length).toBeLessThan(before.length);
    after.forEach((label) => expect(label).toMatch(/roadmap/i));
  });

  it("navigates and resets when a quick access chip is picked", async () => {
    renderSearch();
    await openPalette();

    fireEvent.click(screen.getAllByRole("option")[0]);
    expect(mockRouter.push).toHaveBeenCalledWith(DEFAULT_QUICK_ACCESS[0].path);
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
    expect(mockRouter.push).toHaveBeenCalledWith("/playground");
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

  it("reopens from the trigger after dismissal with the Close search button", async () => {
    renderSearch();
    const trigger = screen.getByRole("button", { name: /search algoguru/i });

    fireEvent.click(trigger);
    expect(await screen.findByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close search" }));
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(PLACEHOLDER)).not.toBeInTheDocument();
    });

    fireEvent.click(trigger);
    expect(await screen.findByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();
  });

  it("preserves custom icon sizes inside shared buttons", async () => {
    renderSearch();
    const triggerIcon = screen
      .getByRole("button", { name: /search algoguru/i })
      .querySelector("svg");
    expect(triggerIcon).toHaveAttribute("width", "20");
    expect(triggerIcon).toHaveClass("!size-[20px]");

    const input = await openPalette();
    type(input, "binary search");

    const clearIcon = screen
      .getByRole("button", { name: /clear query/i })
      .querySelector("svg");
    expect(clearIcon).toHaveAttribute("width", "12");
    expect(clearIcon).toHaveClass("!size-[12px]");

    const closeIcon = screen
      .getByRole("button", { name: "Close search" })
      .querySelector("svg");
    expect(closeIcon).toHaveAttribute("width", "15");
    expect(closeIcon).toHaveClass("!size-[15px]");
  });

  it("clears the search query when the clear button is clicked", async () => {
    renderSearch();
    const input = await openPalette();
    type(input, "binary search");

    expect(screen.getByRole("button", { name: /clear query/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /clear query/i }));

    expect((input as HTMLInputElement).value).toBe("");
    expect(screen.getByText(/type at least 2 characters/i)).toBeInTheDocument();
  });
});