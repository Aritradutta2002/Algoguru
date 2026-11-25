import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RoadmapDetailPanel } from "./RoadmapDetailPanel";
import { registerEscapeKeyHandler } from "@/lib/escapeKeyStack";
import type { NodeStatus, Roadmap, RoadmapNodeData } from "@/types/roadmapGraph";

const prerequisite: RoadmapNodeData = {
  id: "variables",
  title: "Variables",
  description: "Learn how values are stored.",
  resources: 1,
  category: "Basics",
  prerequisites: [],
  recommendedOrder: 1,
};

const node: RoadmapNodeData = {
  id: "loops",
  title: "Loops",
  description: "Repeat work with control flow.",
  resources: 3,
  category: "Basics",
  prerequisites: [prerequisite.id],
  recommendedOrder: 2,
};

const roadmap: Roadmap = {
  id: "dsa",
  title: "Data Structures and Algorithms",
  subtitle: "Learn the foundations",
  accent: "#A855F7",
  categories: [{ label: "Basics", color: "#A855F7" }],
  nodes: [prerequisite, node].map((data) => ({
    id: data.id,
    type: "roadmap" as const,
    position: { x: 0, y: 0 },
    data,
  })),
  edges: [],
};

const statusOptions = [
  { status: "not-started", label: "Not started" },
  { status: "in-progress", label: "In progress" },
  { status: "completed", label: "Completed" },
] as const satisfies ReadonlyArray<{ status: NodeStatus; label: string }>;

const escapeCleanups: Array<() => void> = [];

afterEach(() => {
  escapeCleanups.splice(0).forEach((cleanup) => cleanup());
});

function renderPanel(
  status: NodeStatus = "not-started",
  currentNode: RoadmapNodeData | null = node,
) {
  const onClose = vi.fn();
  const onSelectPrereq = vi.fn();
  const onSetStatus = vi.fn();
  const view = render(
    <RoadmapDetailPanel
      roadmap={roadmap}
      node={currentNode}
      status={status}
      onClose={onClose}
      onSelectPrereq={onSelectPrereq}
      onSetStatus={onSetStatus}
    />,
  );
  return { ...view, onClose, onSelectPrereq, onSetStatus };
}

describe("RoadmapDetailPanel controls", () => {
  it("uses the shared Button while preserving its name, styling, and selection behavior", () => {
    const onSelectPrereq = vi.fn();
    const onClose = vi.fn();
    const onSetStatus = vi.fn();

    render(
      <RoadmapDetailPanel
        roadmap={roadmap}
        node={node}
        status="not-started"
        onClose={onClose}
        onSelectPrereq={onSelectPrereq}
        onSetStatus={onSetStatus}
      />,
    );

    const prerequisiteButton = screen.getByRole("button", { name: /Variables/ });

    expect(prerequisiteButton).toHaveClass(
      "touch-manipulation",
      "ring-offset-background",
      "w-full",
      "text-left",
      "text-xs",
      "[&_svg]:size-3",
    );
    expect(prerequisiteButton).toHaveAccessibleName("Variables jump");

    fireEvent.click(prerequisiteButton);

    expect(onSelectPrereq).toHaveBeenCalledTimes(1);
    expect(onSelectPrereq).toHaveBeenCalledWith("variables");
    expect(onClose).not.toHaveBeenCalled();
    expect(onSetStatus).not.toHaveBeenCalled();
  });

  it("closes from its shared Button and Escape while preserving the compact close icon", () => {
    const { onClose, onSetStatus } = renderPanel("completed");
    const closeButton = screen.getByRole("button", { name: "Close detail panel" });

    expect(closeButton).toHaveClass(
      "touch-manipulation",
      "ring-offset-background",
      "[&_svg]:size-[15px]",
    );

    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onSetStatus).not.toHaveBeenCalled();
  });

  it("reports each status action through onSetStatus", () => {
    const { onSetStatus } = renderPanel();

    for (const { status, label } of statusOptions) {
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(onSetStatus).toHaveBeenLastCalledWith(status);
    }

    expect(onSetStatus).toHaveBeenCalledTimes(3);
  });

  it("exposes only the current status as pressed and keeps compact status icons", () => {
    const { onClose, onSelectPrereq, onSetStatus, rerender } = renderPanel();

    for (const selectedStatus of statusOptions) {
      rerender(
        <RoadmapDetailPanel
          roadmap={roadmap}
          node={node}
          status={selectedStatus.status}
          onClose={onClose}
          onSelectPrereq={onSelectPrereq}
          onSetStatus={onSetStatus}
        />,
      );

      for (const option of statusOptions) {
        const statusButton = screen.getByRole("button", { name: option.label });
        expect(statusButton).toHaveAttribute(
          "aria-pressed",
          String(selectedStatus.status === option.status),
        );
        expect(statusButton).toHaveClass("[&_svg]:size-3");
      }
    }
  });
});

describe("RoadmapDetailPanel Escape stack", () => {
  it("consumes Escape without invoking lower layers", () => {
    const { onClose } = renderPanel();
    const lowerLayer = vi.fn(() => false);
    escapeCleanups.push(registerEscapeKeyHandler(lowerLayer));
    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });

    window.dispatchEvent(event);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(lowerLayer).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it("leaves Escape for lower layers when no node is open", () => {
    const onClose = vi.fn();
    render(
      <RoadmapDetailPanel
        roadmap={roadmap}
        node={null}
        status="not-started"
        onClose={onClose}
        onSelectPrereq={vi.fn()}
        onSetStatus={vi.fn()}
      />,
    );
    const lowerLayer = vi.fn(() => false);
    escapeCleanups.push(registerEscapeKeyHandler(lowerLayer));
    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });

    window.dispatchEvent(event);

    expect(onClose).not.toHaveBeenCalled();
    expect(lowerLayer).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(false);
  });
});
