import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { CoggleRootNode } from "./CoggleRootNode";
import type { CoggleNodeData } from "@/types/roadmapGraph";

vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  return {
    ...actual,
    Handle: ({ id }: { id: string }) => <span data-testid={`handle-${id}`} />,
  };
});

function renderRoot(overrides: Partial<CoggleNodeData> = {}, selected = false) {
  const data: CoggleNodeData = {
    id: "root",
    title: "Accessible DSA",
    description: "A focused learning path.",
    resources: 4,
    category: "All",
    prerequisites: [],
    recommendedOrder: 0,
    side: "right",
    tier: 0,
    isRoot: true,
    branchColor: "#A855F7",
    pillWidth: 400,
    totalTopics: 4,
    completedTopics: 1,
    matchedSearch: true,
    statusHidden: false,
    onSelect: vi.fn(),
    ...overrides,
  };

  const props = { data, selected } as ComponentProps<typeof CoggleRootNode>;
  return {
    ...render(<CoggleRootNode {...props} />),
    data,
  };
}

describe("CoggleRootNode accessibility", () => {
  it("uses a native shared Button for selection and native keyboard activation", () => {
    const { data } = renderRoot();
    const root = screen.getByRole("button", { name: "Accessible DSA Root Hub — 25% completed" });

    // Native BUTTON supplies Enter/Space activation; jsdom does not synthesize
    // the browser's keyboard-generated click in fireEvent.
    expect(root.tagName).toBe("BUTTON");
    expect(root).toHaveAttribute("type", "button");
    expect(root.tabIndex).toBe(0);
    expect(root).toHaveClass("touch-manipulation", "ring-offset-background");

    fireEvent.click(root);

    expect(data.onSelect).toHaveBeenCalledTimes(1);
    expect(data.onSelect).toHaveBeenCalledWith("root");
  });

  it("preserves the root layout, selected styling, and four structural handles", () => {
    const { container } = renderRoot({ pillWidth: 480 }, true);
    const root = screen.getByRole("button", { name: "Accessible DSA Root Hub — 25% completed" });

    expect(root).toHaveClass(
      "min-h-[124px]",
      "flex-col",
      "items-center",
      "justify-center",
      "rounded-xl",
      "px-7",
      "py-4",
    );
    expect(root).toHaveStyle({
      width: "480px",
      background: "var(--coggle-root, #f4f6f2)",
      color: "#101828",
    });
    expect(root.style.boxShadow).toContain("0 0 0 4px #f4f6f2");
    expect(within(root).getByRole("heading", { name: "Accessible DSA" })).toBeInTheDocument();
    expect(within(root).getByText("4 topics · 25% done")).toBeInTheDocument();

    const handles = container.querySelectorAll('[data-testid^="handle-root-"]');
    expect(handles).toHaveLength(4);
    expect(Array.from(handles, (handle) => handle.getAttribute("data-testid"))).toEqual([
      "handle-root-left",
      "handle-root-right",
      "handle-root-top",
      "handle-root-bottom",
    ]);
  });
});
