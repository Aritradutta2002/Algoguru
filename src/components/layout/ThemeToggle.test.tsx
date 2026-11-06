import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { TooltipProvider } from "@/components/ui/tooltip";

describe("ThemeToggle", () => {
  it("renders theme toggle button and switches theme on click", () => {
    render(
      <TooltipProvider>
        <SettingsProvider>
          <ThemeToggle />
        </SettingsProvider>
      </TooltipProvider>
    );

    const button = screen.getByRole("button", { name: /switch to/i });
    expect(button).toBeInTheDocument();

    const initialAria = button.getAttribute("aria-label");
    fireEvent.click(button);
    const updatedAria = button.getAttribute("aria-label");

    expect(initialAria).not.toBe(updatedAria);
  });
});
