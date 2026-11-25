import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GlobalSearch, type GlobalSearchProps } from "@/components/GlobalSearch";
import { GlobalSearchLauncher } from "./GlobalSearchLauncher";
import { TooltipProvider } from "@/components/ui/tooltip";
import { resetNextNavigationMocks } from "@/test/nextNavigationMock";

vi.mock("next/navigation", async () => {
  const { createNextNavigationMock } = await import("@/test/nextNavigationMock");
  return createNextNavigationMock();
});

vi.mock("next/dynamic", async () => {
  const React = await import("react");

  return {
    default: () => function DelayedGlobalSearch(props: GlobalSearchProps) {
      const [ready, setReady] = React.useState(false);

      React.useEffect(() => {
        const timer = window.setTimeout(() => setReady(true), 50);
        return () => window.clearTimeout(timer);
      }, []);

      return ready ? <GlobalSearch {...props} /> : null;
    },
  };
});

const PLACEHOLDER = "Search anything on AlgoGuru...";

afterEach(() => {
  resetNextNavigationMocks();
  vi.restoreAllMocks();
});

describe("GlobalSearchLauncher", () => {
  it("restores focus to the external launcher trigger after Escape dismissal", async () => {
    render(
      <TooltipProvider>
        <GlobalSearchLauncher />
      </TooltipProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Search AlgoGuru" });

    // The launcher can mount asynchronously after a pointer click. Focus must
    // return to the launcher even when it was never the captured active element.
    expect(trigger).not.toHaveFocus();
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    fireEvent.click(trigger, { button: 0, ctrlKey: false });
    expect(trigger).not.toHaveFocus();
    const input = await screen.findByPlaceholderText(PLACEHOLDER);
    expect(input).toHaveFocus();

    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(PLACEHOLDER)).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it("toggles with Ctrl/Cmd+K after mount without installing a second window shortcut handler", async () => {
    const addEventListener = vi.spyOn(window, "addEventListener");
    const removeEventListener = vi.spyOn(window, "removeEventListener");

    render(
      <TooltipProvider>
        <GlobalSearchLauncher />
      </TooltipProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Search AlgoGuru" });

    fireEvent.click(trigger);
    const input = await screen.findByPlaceholderText(PLACEHOLDER);

    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(PLACEHOLDER)).not.toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(await screen.findByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "k", metaKey: true });
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(PLACEHOLDER)).not.toBeInTheDocument();
    });

    const activeKeydownListeners = new Set(
      addEventListener.mock.calls
        .filter(([type]) => type === "keydown")
        .map(([, listener]) => listener),
    );
    removeEventListener.mock.calls
      .filter(([type]) => type === "keydown")
      .forEach(([, listener]) => activeKeydownListeners.delete(listener));

    expect(activeKeydownListeners.size).toBe(1);
  });

  it("keeps the launcher search icon at 18px with an explicit sizing override", () => {
    render(
      <TooltipProvider>
        <GlobalSearchLauncher />
      </TooltipProvider>,
    );

    const icon = screen
      .getByRole("button", { name: "Search AlgoGuru" })
      .querySelector("svg");
    expect(icon).toHaveAttribute("width", "18");
    expect(icon).toHaveClass("!size-[18px]");
  });
});
