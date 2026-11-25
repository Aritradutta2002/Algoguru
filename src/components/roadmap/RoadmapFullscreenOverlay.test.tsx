import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RoadmapFullscreenOverlay } from "./RoadmapFullscreenOverlay";

vi.mock("next/navigation", async () => {
  const { createNextNavigationMock } = await import("@/test/nextNavigationMock");
  return createNextNavigationMock();
});

// Use React's lazy boundary so the real dynamically imported engine mounts under Vitest.
vi.mock("next/dynamic", async () => {
  const React = await import("react");
  const { TooltipProvider } = await import("@/components/ui/tooltip");
  return {
    default: (loader: () => Promise<React.ComponentType<any>>) => {
      const LazyEngine = React.lazy(async () => ({
        default: await loader(),
      }));
      return (props: any) => (
        <TooltipProvider>
          <React.Suspense fallback={null}>
            <LazyEngine {...props} />
          </React.Suspense>
        </TooltipProvider>
      );
    },
  };
});

// Keep the real engine, header, and detail panel; replace only React Flow's canvas.
vi.mock("@xyflow/react", () => {
  const reactFlow = {
    fitView: vi.fn(),
    setCenter: vi.fn(),
    setViewport: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    getZoom: () => 1,
    getNode: () => null,
  };

  return {
    ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useReactFlow: () => reactFlow,
    ReactFlow: ({
      nodes,
    }: {
      nodes: Array<{
        id: string;
        data: { title: string; onSelect?: (id: string) => void };
      }>;
    }) => (
      <div aria-label="Roadmap graph">
        {nodes.map((node) => (
          <button
            key={node.id}
            type="button"
            tabIndex={-1}
            onClick={() => node.data.onSelect?.(node.id)}
          >
            {node.data.title}
          </button>
        ))}
      </div>
    ),
    Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Background: () => null,
    BackgroundVariant: { Dots: "dots" },
    Handle: () => null,
    BaseEdge: () => null,
    Position: { Left: "left", Right: "right", Top: "top", Bottom: "bottom" },
  };
});

vi.mock("@/data/roadmapDataIndex", () => {
  const makeRoadmap = (id: "dsa" | "java" | "system-design", title: string) => ({
    id,
    title,
    subtitle: "A focused test roadmap",
    accent: "#A855F7",
    categories: [{ label: "Basics", color: "#A855F7" }],
    nodes: [
      {
        id: "loops",
        type: "roadmap",
        position: { x: 0, y: 0 },
        data: {
          id: "loops",
          title: "Loops",
          description: "Repeat work with control flow.",
          resources: 3,
          category: "Basics",
          prerequisites: [],
          recommendedOrder: 1,
        },
      },
    ],
    edges: [],
  });

  return {
    ROADMAP_DATA: {
      dsa: makeRoadmap("dsa", "Data Structures and Algorithms"),
      java: makeRoadmap("java", "Core & Advanced Java"),
      "system-design": makeRoadmap("system-design", "System Design"),
    },
  };
});

function ControlledOverlay() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open studio
      </button>
      <RoadmapFullscreenOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function openStudio() {
  const opener = screen.getByRole("button", { name: "Open studio" });
  opener.focus();
  fireEvent.click(opener);
  return opener;
}

function pressEscape(target: Element | Window = document.activeElement ?? window) {
  const event = new KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
  fireEvent(target, event);
  return event;
}

describe("RoadmapFullscreenOverlay roadmap switching", () => {
  it("keeps the real header mounted so Arrow, Home, and End focus survives roadmap changes", async () => {
    render(<RoadmapFullscreenOverlay open onClose={vi.fn()} />);

    // The engine is loaded through React.lazy; allow for cold module evaluation
    // when the full suite runs many workers in parallel.
    const dsa = await screen.findByRole("tab", { name: "DSA" }, { timeout: 5000 });
    const header = screen.getByRole("banner");
    fireEvent.focus(dsa);

    fireEvent.keyDown(dsa, { key: "ArrowRight" });
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Core & Advanced Java" })).toHaveFocus(),
    );
    expect(screen.getByRole("tab", { name: "Core & Advanced Java" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("banner")).toBe(header);

    fireEvent.keyDown(screen.getByRole("tab", { name: "Core & Advanced Java" }), {
      key: "End",
    });
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "System Design" })).toHaveFocus(),
    );
    expect(screen.getByRole("tab", { name: "System Design" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("banner")).toBe(header);

    fireEvent.keyDown(screen.getByRole("tab", { name: "System Design" }), {
      key: "Home",
    });
    await waitFor(() => expect(screen.getByRole("tab", { name: "DSA" })).toHaveFocus());
    expect(screen.getByRole("tab", { name: "DSA" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("banner")).toBe(header);
  });
});

describe("RoadmapFullscreenOverlay Escape ordering", () => {
  it("closes only the detail panel on first Escape and the studio on the next Escape", async () => {
    render(<ControlledOverlay />);
    openStudio();
    const studio = await screen.findByRole("dialog", { name: "Roadmaps Studio" });
    fireEvent.click(await screen.findByRole("button", { name: "Loops" }));
    const detail = await screen.findByRole("dialog", { name: "Loops" });

    const firstEvent = pressEscape(detail);

    expect(firstEvent.defaultPrevented).toBe(true);
    expect(screen.queryByRole("dialog", { name: "Loops" })).not.toBeInTheDocument();
    expect(studio).toBeInTheDocument();

    const secondEvent = pressEscape();

    expect(secondEvent.defaultPrevented).toBe(true);
    await waitFor(() => expect(studio).not.toBeInTheDocument());
  });

  it("blurs and clears focused search without closing the studio", async () => {
    render(<ControlledOverlay />);
    openStudio();
    const studio = await screen.findByRole("dialog", { name: "Roadmaps Studio" });
    const search = await screen.findByPlaceholderText(/Search topics/);
    fireEvent.change(search, { target: { value: "loops" } });
    search.focus();

    const event = pressEscape(search);

    expect(event.defaultPrevented).toBe(true);
    expect(search).toHaveValue("");
    expect(search).not.toHaveFocus();
    expect(studio).toBeInTheDocument();
  });
});

describe("RoadmapFullscreenOverlay modal focus", () => {
  it("moves initial focus inside and hides outside content while open", async () => {
    render(<ControlledOverlay />);
    const opener = openStudio();
    const studio = await screen.findByRole("dialog", { name: "Roadmaps Studio" });

    await waitFor(() => expect(studio.contains(document.activeElement)).toBe(true));
    expect(opener.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("restores focus to the connected opener after closing", async () => {
    render(<ControlledOverlay />);
    const opener = openStudio();
    const studio = await screen.findByRole("dialog", { name: "Roadmaps Studio" });
    screen.getByRole("button", { name: "Back to home" }).focus();

    pressEscape();

    await waitFor(() => expect(studio).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
    expect(opener.closest('[aria-hidden="true"]')).toBeNull();
  });

  it("contains Tab and Shift+Tab at the modal boundaries", async () => {
    render(<ControlledOverlay />);
    openStudio();
    await screen.findByRole("dialog", { name: "Roadmaps Studio" });
    const first = screen.getByRole("button", { name: "Back to home" });
    const last = screen.getByRole("button", { name: "Completed" });
    first.focus();

    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();

    fireEvent.keyDown(last, { key: "Tab" });
    expect(first).toHaveFocus();
  });
});
