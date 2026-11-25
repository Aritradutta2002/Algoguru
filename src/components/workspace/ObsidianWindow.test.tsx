import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ObsidianVaultTree } from "./ObsidianVaultTree";
import { ObsidianWindow } from "./ObsidianWindow";

function renderWindow(
  onPaneChange = vi.fn(),
  children: React.ReactNode = <div>Workspace content</div>,
) {
  render(
    <ObsidianWindow
      activePane="problem"
      onPaneChange={onPaneChange}
      vault={
        <ObsidianVaultTree
          activePane="problem"
          onSelectPane={onPaneChange}
        />
      }
    >
      {children}
    </ObsidianWindow>,
  );
  return onPaneChange;
}

function NestedDialog() {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger>Open nested dialog</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay />
        <DialogPrimitive.Content aria-label="Nested dialog">
          <DialogPrimitive.Title>Nested dialog</DialogPrimitive.Title>
          <DialogPrimitive.Description>
            A child layer that consumes Escape.
          </DialogPrimitive.Description>
          <button type="button" onClick={() => setOpen(false)}>
            Close nested dialog
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("ObsidianWindow", () => {
  it("minimizes to the dock and restores from a pane item", async () => {
    const onPaneChange = renderWindow();

    fireEvent.click(screen.getByRole("button", { name: "Minimize window to dock" }));
    expect(await screen.findByText("Workspace minimized to dock")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /solution/i }));
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "algoguru / workspace" })).toBeInTheDocument(),
    );
    expect(onPaneChange).toHaveBeenCalledWith("solution");
  });

  it("closes and restores the window from the dock", async () => {
    renderWindow();

    fireEvent.click(screen.getByRole("button", { name: "Close window" }));
    expect(
      await screen.findByText("Workspace closed — use the dock to restore"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /problem/i }));
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "algoguru / workspace" })).toBeInTheDocument(),
    );
  });

  it("restores focus to the default dock item after the window exit completes", async () => {
    render(
      <ObsidianWindow
        activePane="problem"
        onPaneChange={vi.fn()}
        initialState="minimized"
      >
        <div>Workspace content</div>
      </ObsidianWindow>,
    );
    const dockItem = screen.getByRole("button", { name: /^problem/i });
    const solution = screen.getByRole("button", { name: /solution/i });
    solution.focus();
    fireEvent.click(solution);
    await screen.findByRole("region", { name: "algoguru / workspace" });

    fireEvent.click(screen.getByRole("button", { name: "Minimize window to dock" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "algoguru / workspace" }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(dockItem).toHaveFocus());
  });

  it.each([
    {
      action: "Minimize window to dock",
      status: "Workspace minimized to dock",
    },
    {
      action: "Close window",
      status: "Workspace closed — use the dock to restore",
    },
  ])(
    "cleans up maximized effects and reopens as a region after $action",
    async ({ action, status }) => {
      document.body.style.overflow = "scroll";
      render(
        <>
          <button type="button">Outside control</button>
          <ObsidianWindow activePane="problem" onPaneChange={vi.fn()}>
            <div>Workspace content</div>
          </ObsidianWindow>
        </>,
      );
      const outside = screen.getByRole("button", { name: "Outside control" });
      const windowName = "algoguru / workspace";

      fireEvent.click(screen.getByRole("button", { name: "Maximize window" }));
      expect(outside).toHaveAttribute("aria-hidden", "true");
      expect(document.body.style.overflow).toBe("hidden");

      fireEvent.click(screen.getByRole("button", { name: action }));
      expect(await screen.findByText(status)).toBeInTheDocument();
      await waitFor(() =>
        expect(
          screen.queryByRole("dialog", { name: windowName }),
        ).not.toBeInTheDocument(),
      );
      expect(outside).not.toHaveAttribute("aria-hidden");
      expect(document.body.style.overflow).toBe("scroll");

      fireEvent.click(screen.getByRole("button", { name: /^problem/i }));
      const region = await screen.findByRole("region", { name: windowName });
      expect(region).not.toHaveAttribute("aria-modal");
      expect(
        screen.queryByRole("dialog", { name: windowName }),
      ).not.toBeInTheDocument();
      expect(outside).not.toHaveAttribute("aria-hidden");
      expect(document.body.style.overflow).toBe("scroll");
    },
  );

  it("minimizes when the active pane is selected again", async () => {
    renderWindow();

    fireEvent.click(screen.getByRole("button", { name: /^problem/i }));
    expect(await screen.findByText("Workspace minimized to dock")).toBeInTheDocument();
  });

  it("toggles the vault tree from the dock", () => {
    renderWindow();

    expect(screen.getByLabelText("Vault file tree")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /vault/i }));
    expect(screen.queryByLabelText("Vault file tree")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /vault/i }));
    expect(screen.getByLabelText("Vault file tree")).toBeInTheDocument();
  });

  it("keeps the embedded window a named nonmodal region", () => {
    renderWindow();

    const region = screen.getByRole("region", { name: "algoguru / workspace" });
    expect(region).not.toHaveAttribute("aria-modal");
    expect(
      screen.queryByRole("dialog", { name: "algoguru / workspace" }),
    ).not.toBeInTheDocument();
  });

  it("exposes the maximized window as a named modal dialog", () => {
    renderWindow();

    fireEvent.click(screen.getByRole("button", { name: "Maximize window" }));

    const dialog = screen.getByRole("dialog", { name: "algoguru / workspace" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("data-window-state", "open");
    expect(
      screen.queryByRole("region", { name: "algoguru / workspace" }),
    ).not.toBeInTheDocument();
  });

  it("contains and loops focus while maximized, then restores the toggle control", async () => {
    render(
      <>
        <button type="button">Outside control</button>
        <ObsidianWindow activePane="problem" onPaneChange={vi.fn()}>
          <button type="button">Workspace action</button>
        </ObsidianWindow>
      </>,
    );
    const outside = screen.getByRole("button", { name: "Outside control" });
    const maximize = screen.getByRole("button", { name: "Maximize window" });
    maximize.focus();
    fireEvent.click(maximize);

    const dialog = screen.getByRole("dialog", { name: "algoguru / workspace" });
    const restore = within(dialog).getByRole("button", { name: "Restore window size" });
    const action = within(dialog).getByRole("button", { name: "Workspace action" });

    outside.focus();
    await waitFor(() =>
      expect(dialog).toContainElement(document.activeElement as HTMLElement),
    );

    action.focus();
    fireEvent.keyDown(action, { key: "Tab" });
    expect(restore).toHaveFocus();

    fireEvent.keyDown(restore, { key: "Tab", shiftKey: true });
    expect(action).toHaveFocus();

    fireEvent.click(restore);
    await waitFor(() => expect(maximize).toHaveFocus());
  });

  it("hides outside content while maximized and restores it afterward", () => {
    render(
      <>
        <button type="button">Outside control</button>
        <ObsidianWindow activePane="problem" onPaneChange={vi.fn()}>
          <div>Workspace content</div>
        </ObsidianWindow>
      </>,
    );
    const outside = screen.getByRole("button", { name: "Outside control" });

    fireEvent.click(screen.getByRole("button", { name: "Maximize window" }));
    expect(outside).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(screen.getByRole("button", { name: "Restore window size" }));
    expect(outside).not.toHaveAttribute("aria-hidden");
  });

  it("locks background scroll while maximized and cleans up on restore and unmount", () => {
    document.body.style.overflow = "scroll";
    const { unmount } = render(
      <ObsidianWindow activePane="problem" onPaneChange={vi.fn()}>
        <div>Workspace content</div>
      </ObsidianWindow>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Maximize window" }));
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Restore window size" }));
    expect(document.body.style.overflow).toBe("scroll");

    fireEvent.click(screen.getByRole("button", { name: "Maximize window" }));
    unmount();
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("restores then minimizes on Escape from the workspace surface", async () => {
    renderWindow();

    fireEvent.click(screen.getByRole("button", { name: "Maximize window" }));
    fireEvent.keyDown(
      screen.getByRole("dialog", { name: "algoguru / workspace" }),
      { key: "Escape" },
    );
    expect(screen.getByRole("button", { name: "Maximize window" })).toBeInTheDocument();

    fireEvent.keyDown(
      screen.getByRole("region", { name: "algoguru / workspace" }),
      { key: "Escape" },
    );
    expect(await screen.findByText("Workspace minimized to dock")).toBeInTheDocument();
  });

  it("ignores Escape outside the workspace surface", () => {
    render(
      <>
        <button type="button">Outside control</button>
        <ObsidianWindow activePane="problem" onPaneChange={vi.fn()}>
          <div>Workspace content</div>
        </ObsidianWindow>
      </>,
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "Outside control" }), {
      key: "Escape",
    });

    expect(
      screen.getByRole("region", { name: "algoguru / workspace" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Workspace minimized to dock")).not.toBeInTheDocument();
  });

  it("lets a nested dialog consume Escape without changing the workspace", async () => {
    renderWindow(vi.fn(), <NestedDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Maximize window" }));
    fireEvent.click(screen.getByRole("button", { name: "Open nested dialog" }));
    const nested = screen.getByRole("dialog", { name: "Nested dialog" });

    fireEvent.keyDown(nested, { key: "Escape" });

    await waitFor(() => expect(nested).not.toBeInTheDocument());
    expect(
      screen.getByRole("button", { name: "Restore window size" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Workspace minimized to dock")).not.toBeInTheDocument();
  });
});
