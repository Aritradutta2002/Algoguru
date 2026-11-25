import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { CoggleNode } from "./CoggleNode";
import { RoadmapEngine } from "./RoadmapEngine";
import { computeCoggleLayout } from "./coggleLayout";
import type { CoggleNodeData, Roadmap } from "@/types/roadmapGraph";

vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  return {
    ...actual,
    Handle: ({ id }: { id: string }) => <span data-testid={`handle-${id}`} />,
  };
});

vi.mock("./RoadmapHeader", () => ({
  RoadmapHeader: ({
    onStatusFilterChange,
  }: {
    onStatusFilterChange: (status: "completed") => void;
  }) => (
    <button type="button" onClick={() => onStatusFilterChange("completed")}>
      Show completed nodes
    </button>
  ),
}));
vi.mock("./RoadmapDetailPanel", () => ({ RoadmapDetailPanel: () => null }));
vi.mock("./RoadmapControls", () => ({ RoadmapControls: () => null }));
vi.mock("./RoadmapBackground", () => ({ RoadmapBackground: () => null }));

const progressMocks = vi.hoisted(() => ({
  setStatus: vi.fn(),
  clearAll: vi.fn(),
  resetPositions: vi.fn(),
}));
vi.mock("@/services/roadmapProgress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/roadmapProgress")>();
  return {
    ...actual,
    useRoadmapProgress: () => ({
      progress: {
        arrays: { status: "completed", updatedAt: 1 },
        "cat-Basics": { status: "completed", updatedAt: 1 },
      },
      positions: {},
      ...progressMocks,
    }),
  };
});

class DOMMatrixReadOnlyStub {
  readonly m22 = 1;

  constructor(_transform?: string) {}
}

class NodeResizeObserverStub {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(target: Element) {
    const isRoot = target.classList.contains("react-flow__node-coggleRoot");
    const width = isRoot ? 400 : 240;
    const height = isRoot ? 124 : 62;
    const rect = {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON: () => ({}),
    };
    Object.defineProperties(target, {
      offsetWidth: { configurable: true, value: width },
      offsetHeight: { configurable: true, value: height },
    });
    Object.defineProperty(target, "getBoundingClientRect", {
      configurable: true,
      value: () => rect,
    });
    this.callback(
      [{ target, contentRect: rect } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }

  unobserve() {}
  disconnect() {}
}

const accessibilityRoadmap: Roadmap = {
  id: "dsa",
  title: "Accessible DSA",
  subtitle: "A focused accessibility fixture",
  accent: "#A855F7",
  categories: [
    { label: "Basics", color: "#A855F7" },
    { label: "Trees", color: "#22C55E" },
  ],
  nodes: [
    {
      id: "arrays",
      type: "roadmap",
      position: { x: 0, y: 0 },
      data: {
        id: "arrays",
        title: "Arrays",
        description: "Learn array patterns.",
        resources: 4,
        category: "Basics",
        prerequisites: [],
        recommendedOrder: 1,
      },
    },
    {
      id: "trees",
      type: "roadmap",
      position: { x: 0, y: 0 },
      data: {
        id: "trees",
        title: "Trees",
        description: "Learn tree traversal.",
        resources: 3,
        category: "Trees",
        prerequisites: [],
        recommendedOrder: 1,
      },
    },
  ],
  edges: [],
};

function renderNode(overrides: Partial<CoggleNodeData> = {}) {
  const data: CoggleNodeData = {
    id: "arrays",
    title: "Arrays",
    description: "Learn array patterns.",
    resources: 4,
    category: "Basics",
    prerequisites: [],
    recommendedOrder: 1,
    side: "right",
    tier: 2,
    hasChildren: true,
    isCollapsed: true,
    childCount: 3,
    branchColor: "#A855F7",
    pillWidth: 240,
    onSelect: vi.fn(),
    onToggleCollapse: vi.fn(),
    ...overrides,
  };

  const props = { data, selected: false } as ComponentProps<typeof CoggleNode>;
  return {
    ...render(<CoggleNode {...props} />),
    data,
  };
}

describe("CoggleNode graph controls", () => {
  it("renders selection and collapse as sibling native buttons", () => {
    const { data, container } = renderNode();

    const graphNode = screen.getByRole("button", {
      name: "Arrays — not-started. Click for details.",
    });
    const collapseButton = screen.getByRole("button", { name: "Expand Arrays" });
    const card = container.querySelector<HTMLElement>(".coggle-topic-node");
    if (!card) throw new Error("Missing node card");

    expect(graphNode.tagName).toBe("BUTTON");
    expect(graphNode).toHaveAttribute("type", "button");
    expect(graphNode.tabIndex).toBe(0);
    expect(collapseButton.tabIndex).toBe(0);
    expect(graphNode.parentElement).toBe(card);
    expect(collapseButton.parentElement).toBe(card);
    expect(graphNode.contains(collapseButton)).toBe(false);
    expect(card).not.toHaveAttribute("role");
    expect(card).not.toHaveAttribute("tabindex");
    expect(collapseButton).toHaveClass(
      "touch-manipulation",
      "ring-offset-background",
      "h-7",
      "min-w-7",
      "rounded-full",
    );

    fireEvent.click(collapseButton);

    expect(data.onToggleCollapse).toHaveBeenCalledTimes(1);
    expect(data.onToggleCollapse).toHaveBeenCalledWith("arrays");
    expect(data.onSelect).not.toHaveBeenCalled();

    fireEvent.click(graphNode);

    expect(data.onSelect).toHaveBeenCalledTimes(1);
    expect(data.onSelect).toHaveBeenCalledWith("arrays");
  });

  it("keeps the expanded control name and icon size when using the shared Button", () => {
    const { data } = renderNode({ isCollapsed: false });

    const collapseButton = screen.getByRole("button", { name: "Collapse Arrays" });

    expect(collapseButton).toHaveClass(
      "touch-manipulation",
      "ring-offset-background",
      "opacity-0",
      "group-hover:opacity-100",
      "focus-visible:opacity-100",
      "[&_svg]:size-3.5",
    );

    fireEvent.click(collapseButton);

    expect(data.onToggleCollapse).toHaveBeenCalledWith("arrays");
    expect(data.onSelect).not.toHaveBeenCalled();
  });

  it("removes hidden nodes from interaction and the accessibility tree without changing layout", () => {
    const { data, container } = renderNode({ statusHidden: true });
    const card = container.querySelector<HTMLElement>(".coggle-topic-node");
    if (!card) throw new Error("Missing node card");

    expect(card).toHaveAttribute("aria-hidden", "true");
    expect(card).toHaveClass("h-[62px]", "pointer-events-none");
    expect(card).toHaveStyle({ width: "240px" });
    expect(card).not.toHaveAttribute("hidden");
    expect(within(card).getByTestId("handle-target-left")).toBeInTheDocument();
    expect(within(card).getByTestId("handle-source-right")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Arrays — not-started. Click for details." }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Expand Arrays" })).not.toBeInTheDocument();

    const controls = card.querySelectorAll("button");
    expect(controls).toHaveLength(2);
    controls.forEach((control) => {
      expect(control).toBeDisabled();
      expect(control).toHaveAttribute("tabindex", "-1");
      fireEvent.click(control);
    });

    expect(data.onSelect).not.toHaveBeenCalled();
    expect(data.onToggleCollapse).not.toHaveBeenCalled();
  });
});

describe("Coggle filtered node layout", () => {
  it("makes status-filtered nodes non-selectable and hides only their wrapper from assistive technology", () => {
    const result = computeCoggleLayout({
      roadmap: accessibilityRoadmap,
      progress: {
        arrays: { status: "completed", updatedAt: 1 },
        "cat-Basics": { status: "completed", updatedAt: 1 },
      },
      collapsedNodeIds: new Set(),
      statusFilter: "completed",
      onToggleCollapse: vi.fn(),
      onSelectNode: vi.fn(),
    });

    const unfilteredResult = computeCoggleLayout({
      roadmap: accessibilityRoadmap,
      progress: {},
      collapsedNodeIds: new Set(),
      onToggleCollapse: vi.fn(),
      onSelectNode: vi.fn(),
    });
    const visible = result.nodes.find((node) => node.id === "arrays");
    const filtered = result.nodes.find((node) => node.id === "trees");
    const unfilteredTrees = unfilteredResult.nodes.find((node) => node.id === "trees");

    expect(visible?.selectable).toBe(true);
    expect(visible?.domAttributes?.["aria-hidden"]).toBeUndefined();
    expect(filtered?.selectable).toBe(false);
    expect(filtered?.domAttributes?.["aria-hidden"]).toBe(true);
    expect(filtered?.hidden).not.toBe(true);
    expect(filtered?.position).toEqual(unfilteredTrees?.position);
  });
});

describe("RoadmapEngine generated node wrappers", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", NodeResizeObserverStub);
    vi.stubGlobal("DOMMatrixReadOnly", DOMMatrixReadOnlyStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("leaves only the custom controls in the tab order and accessibility tree", async () => {
    render(<RoadmapEngine roadmap={accessibilityRoadmap} compact />);

    const arraysButton = await screen.findByRole("button", {
      name: "Arrays — completed. Click for details.",
    });
    const arraysWrapper = screen.getByTestId("rf__node-arrays");
    const rootWrapper = screen.getByTestId("rf__node-root");

    for (const wrapper of [arraysWrapper, rootWrapper]) {
      expect(wrapper).toHaveClass("react-flow__node");
      expect(wrapper).not.toHaveAttribute("tabindex");
      expect(wrapper).not.toHaveAttribute("role");
      expect(wrapper).not.toHaveAttribute("aria-hidden");
    }
    expect(arraysWrapper).toHaveClass("selectable");
    expect(arraysButton.tabIndex).toBe(0);
    expect(screen.getByRole("button", { name: "Accessible DSA Root Hub — 50% completed" }).tabIndex).toBe(0);
  });

  it("hides the actual filtered wrapper without removing its layout or handles", async () => {
    render(<RoadmapEngine roadmap={accessibilityRoadmap} compact />);
    await screen.findByRole("button", { name: "Arrays — completed. Click for details." });

    fireEvent.click(screen.getByRole("button", { name: "Show completed nodes" }));

    await waitFor(() => {
      expect(screen.getByTestId("rf__node-trees")).toHaveAttribute("aria-hidden", "true");
    });
    const filteredWrapper = screen.getByTestId("rf__node-trees");
    const visibleWrapper = screen.getByTestId("rf__node-arrays");

    expect(filteredWrapper).not.toHaveClass("selectable");
    expect(filteredWrapper).not.toHaveAttribute("hidden");
    expect(filteredWrapper).not.toHaveAttribute("tabindex");
    expect(filteredWrapper).not.toHaveAttribute("role");
    expect(visibleWrapper).toHaveClass("selectable");
    expect(visibleWrapper).not.toHaveAttribute("aria-hidden");
    expect(within(filteredWrapper).getByTestId("handle-target-right")).toBeInTheDocument();
    expect(within(filteredWrapper).getByTestId("handle-source-left")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Trees — not-started. Click for details." }),
    ).not.toBeInTheDocument();
  });
});
