import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ObsidianVaultTree } from "./ObsidianVaultTree";
import { ObsidianWindow } from "./ObsidianWindow";

function renderWindow(onPaneChange = vi.fn()) {
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
      <div>Workspace content</div>
    </ObsidianWindow>,
  );
  return onPaneChange;
}

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

  it("supports Escape and maximize controls", async () => {
    renderWindow();

    const maximize = screen.getByRole("button", { name: "Maximize window" });
    fireEvent.click(maximize);
    expect(screen.getByRole("button", { name: "Restore window size" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Maximize window" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(await screen.findByText("Workspace minimized to dock")).toBeInTheDocument();
  });
});
