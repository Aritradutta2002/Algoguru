import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

vi.mock("next/link", async () => {
  const { createNextLinkMock } = await import("@/test/nextNavigationMock");
  return createNextLinkMock();
});

/**
 * Radix DropdownMenuTrigger listens to pointerDown and keyDown (Enter, Space, ArrowDown).
 * In jsdom, fireEvent.click does not trigger Radix's internal pointerDown listener.
 * This helper dispatches pointerDown and falls back to keyDown (Enter / ArrowDown) to reliably
 * open the menu across all jsdom environments.
 */
function openDropdown(trigger: HTMLElement) {
  if (trigger.getAttribute("aria-expanded") === "true") {
    return;
  }
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  if (trigger.getAttribute("aria-expanded") !== "true") {
    fireEvent.keyDown(trigger, { key: "Enter" });
  }
  if (trigger.getAttribute("aria-expanded") !== "true") {
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
  }
}

describe("WorkspaceSwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders AlgoGuru mark and default Personal workspace", () => {
    render(<WorkspaceSwitcher />);

    expect(screen.getByRole("button", { name: /current workspace: algoguru personal/i })).toBeInTheDocument();
    expect(screen.getByText("Algo")).toBeInTheDocument();
    expect(screen.getByText("Guru")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it("opens dropdown menu with Personal, Team, and Enterprise workspaces", () => {
    render(<WorkspaceSwitcher />);

    const trigger = screen.getByRole("button", { name: /current workspace/i });
    openDropdown(trigger);

    expect(screen.getByText("Workspaces")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
    expect(screen.getByText("Create new workspace")).toBeInTheDocument();
  });

  it("switches workspace to Team when clicked and updates localStorage", () => {
    render(<WorkspaceSwitcher />);

    const trigger = screen.getByRole("button", { name: /current workspace/i });
    openDropdown(trigger);

    const teamOption = screen.getByText("Team");
    fireEvent.click(teamOption);

    expect(localStorage.getItem("algoguru_active_workspace")).toBe("team");
    expect(screen.getByRole("button", { name: /current workspace: algoguru team/i })).toBeInTheDocument();
  });

  it("switches workspace to Enterprise when clicked", () => {
    render(<WorkspaceSwitcher />);

    const trigger = screen.getByRole("button", { name: /current workspace/i });
    openDropdown(trigger);

    const enterpriseOption = screen.getByText("Enterprise");
    fireEvent.click(enterpriseOption);

    expect(localStorage.getItem("algoguru_active_workspace")).toBe("enterprise");
    expect(screen.getByRole("button", { name: /current workspace: algoguru enterprise/i })).toBeInTheDocument();
  });

  it("initializes active workspace from localStorage if present", () => {
    localStorage.setItem("algoguru_active_workspace", "team");

    render(<WorkspaceSwitcher />);

    expect(screen.getByRole("button", { name: /current workspace: algoguru team/i })).toBeInTheDocument();
  });

  it("renders compact mode without workspace subtext", () => {
    render(<WorkspaceSwitcher compact />);

    expect(screen.getByRole("button", { name: /current workspace: algoguru personal/i })).toBeInTheDocument();
    expect(screen.queryByText("Personal")).not.toBeInTheDocument();
  });

  it("closes dropdown menu on Escape key press", () => {
    render(<WorkspaceSwitcher />);

    const trigger = screen.getByRole("button", { name: /current workspace/i });
    openDropdown(trigger);
    expect(screen.getByText("Workspaces")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Workspaces")).not.toBeInTheDocument();
  });

  it("switches workspace using keyboard Enter on menu item", () => {
    render(<WorkspaceSwitcher />);

    const trigger = screen.getByRole("button", { name: /current workspace/i });
    openDropdown(trigger);

    const teamOption = screen.getByText("Team").closest("[role='menuitem']") || screen.getByText("Team");
    fireEvent.keyDown(teamOption, { key: "Enter" });

    expect(localStorage.getItem("algoguru_active_workspace")).toBe("team");
    expect(screen.getByRole("button", { name: /current workspace: algoguru team/i })).toBeInTheDocument();
  });

  it("displays workspace tier badges in both trigger and dropdown options", () => {
    render(<WorkspaceSwitcher />);

    expect(screen.getByText("Free")).toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: /current workspace/i });
    openDropdown(trigger);

    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("SSO")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });
});

