import { useState, type ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RoadmapHeader } from "./RoadmapHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { mockRouter, resetNextNavigationMocks } from "@/test/nextNavigationMock";
import type { RoadmapId } from "@/data/roadmaps";
import type { CompletionStats, Roadmap } from "@/types/roadmapGraph";

vi.mock("next/navigation", async () => {
  const { createNextNavigationMock } = await import("@/test/nextNavigationMock");
  return createNextNavigationMock();
});

const roadmap: Roadmap = {
  id: "dsa",
  title: "Data Structures and Algorithms",
  subtitle: "Learn the core patterns",
  accent: "#4f46e5",
  categories: [],
  nodes: [],
  edges: [],
};

const stats: CompletionStats = {
  completed: 3,
  inProgress: 1,
  total: 10,
  percent: 30,
};

function ControlledRoadmapHeader({
  onSelectRoadmap,
}: {
  onSelectRoadmap: (id: RoadmapId) => void;
}) {
  const [activeId, setActiveId] = useState<RoadmapId>("dsa");

  return (
    <RoadmapHeader
      roadmap={roadmap}
      stats={stats}
      activeId={activeId}
      onSelectRoadmap={(id) => {
        onSelectRoadmap(id);
        setActiveId(id);
      }}
    />
  );
}

type StatusFilter = "all" | "in-progress" | "completed" | "not-started";

function ControlledSearchAndFilterHeader({
  onSearchChange,
  onStatusFilterChange,
}: {
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: StatusFilter) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("arrays");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  return (
    <RoadmapHeader
      roadmap={roadmap}
      stats={stats}
      activeId="dsa"
      searchQuery={searchQuery}
      onSearchChange={(query) => {
        onSearchChange(query);
        setSearchQuery(query);
      }}
      statusFilter={statusFilter}
      onStatusFilterChange={(status) => {
        onStatusFilterChange(status);
        setStatusFilter(status);
      }}
    />
  );
}

function renderHeader(props: Partial<ComponentProps<typeof RoadmapHeader>> = {}) {
  return render(
    <TooltipProvider>
      <RoadmapHeader roadmap={roadmap} stats={stats} activeId="dsa" {...props} />
    </TooltipProvider>,
  );
}

function selectTab(tab: HTMLElement) {
  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
  fireEvent.click(tab, { button: 0, ctrlKey: false });
}

describe("RoadmapHeader roadmap tabs", () => {
  beforeEach(() => {
    resetNextNavigationMocks();
  });

  it("keeps the exact labels, controlled selection, and active accent", () => {
    renderHeader();

    const list = screen.getByRole("tablist", { name: "Roadmap learning path tabs" });
    const tabs = within(list).getAllByRole("tab");
    const dsa = screen.getByRole("tab", { name: "DSA" });
    const java = screen.getByRole("tab", { name: "Core & Advanced Java" });

    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "DSA",
      "Core & Advanced Java",
      "System Design",
    ]);
    expect(dsa).toHaveAttribute("aria-selected", "true");
    expect(java).toHaveAttribute("aria-selected", "false");
    expect(dsa).toHaveClass("bg-card", "shadow-sm");
    expect(dsa).toHaveStyle({ color: roadmap.accent });
    expect(dsa.getAttribute("style")).toContain(roadmap.accent);
  });

  it("does not emit dangling aria-controls for route switcher tabs", () => {
    renderHeader();

    const tabs = within(
      screen.getByRole("tablist", { name: "Roadmap learning path tabs" }),
    ).getAllByRole("tab");

    for (const tab of tabs) {
      const controlledIds = tab.getAttribute("aria-controls")?.split(/\s+/).filter(Boolean) ?? [];
      for (const id of controlledIds) {
        expect(document.getElementById(id)).not.toBeNull();
      }
    }
  });

  it("uses the controlled selection callback for pointer selection", () => {
    const onSelectRoadmap = vi.fn();
    render(
      <TooltipProvider>
        <ControlledRoadmapHeader onSelectRoadmap={onSelectRoadmap} />
      </TooltipProvider>,
    );

    selectTab(screen.getByRole("tab", { name: "Core & Advanced Java" }));

    expect(onSelectRoadmap).toHaveBeenCalledTimes(1);
    expect(onSelectRoadmap).toHaveBeenCalledWith("java");
    expect(screen.getByRole("tab", { name: "Core & Advanced Java" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "DSA" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("falls back to the roadmap route when no selection callback is provided", () => {
    renderHeader();

    selectTab(screen.getByRole("tab", { name: "System Design" }));

    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith("/roadmap/system-design");
  });

  it("uses a roving tab order after the selected roadmap tab receives focus", () => {
    renderHeader();
    fireEvent.focus(screen.getByRole("tab", { name: "DSA" }));

    expect(screen.getByRole("tab", { name: "DSA" }).tabIndex).toBe(0);
    expect(screen.getByRole("tab", { name: "Core & Advanced Java" }).tabIndex).toBe(-1);
    expect(screen.getByRole("tab", { name: "System Design" }).tabIndex).toBe(-1);
  });

  it("activates and focuses roadmap tabs with arrows, Home, and End", async () => {
    const onSelectRoadmap = vi.fn();
    render(
      <TooltipProvider>
        <ControlledRoadmapHeader onSelectRoadmap={onSelectRoadmap} />
      </TooltipProvider>,
    );

    const dsa = screen.getByRole("tab", { name: "DSA" });
    const java = screen.getByRole("tab", { name: "Core & Advanced Java" });
    const systemDesign = screen.getByRole("tab", { name: "System Design" });

    fireEvent.keyDown(dsa, { key: "ArrowRight" });
    await waitFor(() => expect(java).toHaveFocus());
    expect(java).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(java, { key: "End" });
    await waitFor(() => expect(systemDesign).toHaveFocus());
    expect(systemDesign).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(systemDesign, { key: "ArrowRight" });
    await waitFor(() => expect(dsa).toHaveFocus());
    expect(dsa).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(dsa, { key: "ArrowLeft" });
    await waitFor(() => expect(systemDesign).toHaveFocus());
    expect(systemDesign).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(systemDesign, { key: "Home" });
    await waitFor(() => expect(dsa).toHaveFocus());
    expect(dsa).toHaveAttribute("aria-selected", "true");
    expect(onSelectRoadmap.mock.calls.map(([id]) => id)).toEqual([
      "java",
      "system-design",
      "dsa",
      "system-design",
      "dsa",
    ]);
  });
});

describe("RoadmapHeader shared controls", () => {
  beforeEach(() => {
    resetNextNavigationMocks();
  });

  it("keeps the back button gap and 13px icon sizing", () => {
    renderHeader();

    const back = screen.getByRole("button", { name: "Back to home" });
    expect(back).toHaveClass("gap-1.5", "[&_svg]:size-[13px]");
    expect(back.querySelector("svg")).toHaveAttribute("width", "13");
  });

  it("keeps toolbar icon sizes and removes input vertical padding", () => {
    renderHeader({
      onCenterRoot: vi.fn(),
      onExpandAll: vi.fn(),
      onCollapseAll: vi.fn(),
      onResetProgress: vi.fn(),
    });

    const toolbarIcons = [
      { name: "Center view on root topic", size: 14 },
      { name: "Expand all branches", size: 14 },
      { name: "Collapse all branches", size: 14 },
      { name: "Reset roadmap progress", size: 13 },
      { name: "Enter fullscreen", size: 13 },
    ];

    for (const { name, size } of toolbarIcons) {
      expect(screen.getByRole("button", { name })).toHaveClass(
        `[&_svg]:size-[${size}px]`,
      );
    }

    expect(screen.getByPlaceholderText(/Search topics/)).toHaveClass("py-0");
  });

  it("clears controlled search through a shared Button", () => {
    const onSearchChange = vi.fn();
    render(
      <TooltipProvider>
        <ControlledSearchAndFilterHeader
          onSearchChange={onSearchChange}
          onStatusFilterChange={vi.fn()}
        />
      </TooltipProvider>,
    );

    const input = screen.getByPlaceholderText(/Search topics/);
    const clear = screen.getByRole("button", { name: "Clear search" });
    expect(input).toHaveValue("arrays");
    expect(clear).toHaveClass("inline-flex", "gap-2");

    fireEvent.click(clear);

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith("");
    expect(input).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
    expect(screen.getByText("/")).toBeInTheDocument();
  });

  it("exposes and updates controlled filter state through shared Buttons", () => {
    const onStatusFilterChange = vi.fn();
    render(
      <TooltipProvider>
        <ControlledSearchAndFilterHeader
          onSearchChange={vi.fn()}
          onStatusFilterChange={onStatusFilterChange}
        />
      </TooltipProvider>,
    );

    const all = screen.getByRole("button", { name: "All" });
    const inProgress = screen.getByRole("button", { name: "In Progress" });
    const completed = screen.getByRole("button", { name: "Completed" });

    expect(all).toHaveClass("inline-flex", "gap-2");
    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(inProgress).toHaveAttribute("aria-pressed", "false");
    expect(completed).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(inProgress);
    expect(onStatusFilterChange).toHaveBeenLastCalledWith("in-progress");
    expect(inProgress).toHaveAttribute("aria-pressed", "true");
    expect(all).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(completed);
    expect(onStatusFilterChange).toHaveBeenLastCalledWith("completed");
    expect(completed).toHaveAttribute("aria-pressed", "true");
    expect(inProgress).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(all);
    expect(onStatusFilterChange).toHaveBeenLastCalledWith("all");
    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(onStatusFilterChange).toHaveBeenCalledTimes(3);
  });
});
