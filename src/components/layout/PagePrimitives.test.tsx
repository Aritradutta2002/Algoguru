import { useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SegmentedControl } from "./PagePrimitives";

type Filter = "all" | "active" | "completed";

const options: Array<{ value: Filter; label: ReactNode; icon: ReactNode }> = [
  { value: "all", label: "All", icon: <span aria-hidden="true" data-testid="icon-all">A</span> },
  { value: "active", label: "Active", icon: <span aria-hidden="true" data-testid="icon-active">B</span> },
  { value: "completed", label: "Completed", icon: <span aria-hidden="true" data-testid="icon-completed">C</span> },
];

function ControlledSegmentedControl({
  onChange,
  size = "default",
  fullWidth = false,
}: {
  onChange: (value: Filter) => void;
  size?: "sm" | "default";
  fullWidth?: boolean;
}) {
  const [value, setValue] = useState<Filter>("all");

  return (
    <SegmentedControl
      value={value}
      onChange={(next) => {
        onChange(next);
        setValue(next);
      }}
      options={options}
      size={size}
      fullWidth={fullWidth}
      className="custom-segments"
    />
  );
}

function selectTab(tab: HTMLElement) {
  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
  fireEvent.click(tab, { button: 0, ctrlKey: false });
}

describe("SegmentedControl", () => {
  it("keeps tab semantics without controls pointing at nonexistent panels", () => {
    render(<ControlledSegmentedControl onChange={vi.fn()} />);

    const list = screen.getByRole("tablist");
    const tabs = within(list).getAllByRole("tab");

    expect(tabs).toHaveLength(options.length);
    for (const tab of tabs) {
      expect(tab).not.toHaveAttribute("aria-controls");
    }
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
  });

  it("preserves the generic controlled value and onChange API", () => {
    const onChange = vi.fn();
    render(<ControlledSegmentedControl onChange={onChange} />);

    selectTab(screen.getByRole("tab", { name: "Active" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("active");
    expect(screen.getByRole("tab", { name: "Active" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("emits once across a microtask and still allows a later selection", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SegmentedControl value="all" onChange={onChange} options={options} />,
    );

    const active = screen.getByRole("tab", { name: "Active" });
    fireEvent.mouseDown(active, { button: 0, ctrlKey: false });
    await Promise.resolve();
    // A browser click focuses its target; jsdom does not synthesize that default action.
    fireEvent.focus(active);
    fireEvent.click(active, { button: 0, ctrlKey: false });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("active");

    rerender(
      <SegmentedControl value="active" onChange={onChange} options={options} />,
    );
    selectTab(screen.getByRole("tab", { name: "Completed" }));

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith("completed");
  });

  it("preserves icons, active appearance, size, and full-width styling", () => {
    render(<ControlledSegmentedControl onChange={vi.fn()} size="sm" fullWidth />);

    const list = screen.getByRole("tablist");
    const all = screen.getByRole("tab", { name: "All" });
    const active = screen.getByRole("tab", { name: "Active" });

    expect(list).toHaveClass("w-full", "custom-segments");
    expect(all).toHaveClass("h-7", "px-2.5", "text-xs", "flex-1");
    expect(active).toHaveClass("h-7", "px-2.5", "text-xs", "flex-1");
    expect(all).toHaveClass("bg-foreground/[0.08]", "text-foreground", "shadow-none");
    expect(active).toHaveClass("text-muted-foreground", "hover:text-foreground");
    expect(within(all).getByTestId("icon-all")).toBeInTheDocument();
    expect(within(active).getByTestId("icon-active")).toBeInTheDocument();
  });

  it("uses a roving tab order after the selected segment receives focus", () => {
    render(<ControlledSegmentedControl onChange={vi.fn()} />);
    fireEvent.focus(screen.getByRole("tab", { name: "All" }));

    expect(screen.getByRole("tab", { name: "All" }).tabIndex).toBe(0);
    expect(screen.getByRole("tab", { name: "Active" }).tabIndex).toBe(-1);
    expect(screen.getByRole("tab", { name: "Completed" }).tabIndex).toBe(-1);
  });

  it("activates and focuses segments with arrows, Home, and End", async () => {
    const onChange = vi.fn();
    render(<ControlledSegmentedControl onChange={onChange} />);

    const all = screen.getByRole("tab", { name: "All" });
    const active = screen.getByRole("tab", { name: "Active" });
    const completed = screen.getByRole("tab", { name: "Completed" });

    fireEvent.keyDown(all, { key: "ArrowRight" });
    await waitFor(() => expect(active).toHaveFocus());
    expect(active).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(active, { key: "End" });
    await waitFor(() => expect(completed).toHaveFocus());
    expect(completed).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(completed, { key: "ArrowRight" });
    await waitFor(() => expect(all).toHaveFocus());
    expect(all).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(all, { key: "ArrowLeft" });
    await waitFor(() => expect(completed).toHaveFocus());
    expect(completed).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(completed, { key: "Home" });
    await waitFor(() => expect(all).toHaveFocus());
    expect(all).toHaveAttribute("aria-selected", "true");
    expect(onChange.mock.calls.map(([value]) => value)).toEqual([
      "active",
      "completed",
      "all",
      "completed",
      "all",
    ]);
  });
});
