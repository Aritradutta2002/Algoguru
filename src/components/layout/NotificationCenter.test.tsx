import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationCenter } from "./NotificationCenter";
import { TooltipProvider } from "@/components/ui/tooltip";

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

describe("NotificationCenter", () => {
  it("renders bell trigger with initial unread count", () => {
    render(
      <TooltipProvider>
        <NotificationCenter />
      </TooltipProvider>
    );

    const trigger = screen.getByRole("button", { name: /notifications \(2 unread\)/i });
    expect(trigger).toBeInTheDocument();
  });

  it("opens menu displaying notifications and allows marking all as read", () => {
    render(
      <TooltipProvider>
        <NotificationCenter />
      </TooltipProvider>
    );

    const trigger = screen.getByRole("button", { name: /notifications/i });
    openDropdown(trigger);

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Guru AI Coach")).toBeInTheDocument();
    expect(screen.getByText("New System Design Track")).toBeInTheDocument();

    const markAllBtn = screen.getByRole("button", { name: /mark all read/i });
    fireEvent.click(markAllBtn);

    // Unread count badge should disappear from header
    expect(screen.queryByText("2 new")).not.toBeInTheDocument();
  });

  it("filters unread notifications accurately", () => {
    render(
      <TooltipProvider>
        <NotificationCenter />
      </TooltipProvider>
    );

    const trigger = screen.getByRole("button", { name: /notifications/i });
    openDropdown(trigger);

    const unreadTab = screen.getByRole("button", { name: /unread \(2\)/i });
    fireEvent.click(unreadTab);

    expect(screen.getByText("Guru AI Coach")).toBeInTheDocument();
    expect(screen.getByText("New System Design Track")).toBeInTheDocument();
    // Read item should not be in unread list
    expect(screen.queryByText("Weekly Engineering Contest")).not.toBeInTheDocument();
  });

  it("marks individual notification as read when clicked", () => {
    render(
      <TooltipProvider>
        <NotificationCenter />
      </TooltipProvider>
    );

    const trigger = screen.getByRole("button", { name: /notifications/i });
    openDropdown(trigger);

    const aiNotif = screen.getByText("Guru AI Coach");
    fireEvent.click(aiNotif);

    // Unread badge in header should now show "1 new"
    expect(screen.getByText("1 new")).toBeInTheDocument();
    // Trigger button aria-label should also update to 1 unread
    expect(trigger).toHaveAttribute("aria-label", "Notifications (1 unread)");
    expect(screen.getByRole("button", { name: /notifications \(1 unread\)/i, hidden: true })).toBeInTheDocument();
  });

  it("switches filter tabs between All and Unread and displays empty state when all read", () => {
    render(
      <TooltipProvider>
        <NotificationCenter />
      </TooltipProvider>
    );

    const trigger = screen.getByRole("button", { name: /notifications/i });
    openDropdown(trigger);

    // Mark all as read
    const markAllBtn = screen.getByRole("button", { name: /mark all read/i });
    fireEvent.click(markAllBtn);

    // Switch to Unread filter
    const unreadTab = screen.getByRole("button", { name: /unread \(0\)/i });
    fireEvent.click(unreadTab);

    // Empty state should appear
    expect(screen.getByText("All caught up! No unread notifications.")).toBeInTheDocument();

    // Switch back to All filter
    const allTab = screen.getByRole("button", { name: /^all$/i });
    fireEvent.click(allTab);

    // All items should be back in view
    expect(screen.getByText("Guru AI Coach")).toBeInTheDocument();
    expect(screen.getByText("Weekly Engineering Contest")).toBeInTheDocument();
  });

  it("closes notification dropdown on Escape key", () => {
    render(
      <TooltipProvider>
        <NotificationCenter />
      </TooltipProvider>
    );

    const trigger = screen.getByRole("button", { name: /notifications/i });
    openDropdown(trigger);

    expect(screen.getByText("Notifications")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });
});

