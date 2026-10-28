import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AiCommandLauncher } from "./AiCommandLauncher";
import { TooltipProvider } from "@/components/ui/tooltip";

describe("AiCommandLauncher", () => {
  it("renders closed state with Guru AI label and shortcut badge", () => {
    const onClick = vi.fn();
    render(
      <TooltipProvider>
        <AiCommandLauncher open={false} onClick={onClick} />
      </TooltipProvider>
    );

    const button = screen.getByRole("button", { name: /open guru ai command center/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Guru AI")).toBeInTheDocument();
    expect(screen.getByText("⌘J")).toBeInTheDocument();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders open state with aria-pressed true", () => {
    render(
      <TooltipProvider>
        <AiCommandLauncher open={true} onClick={() => undefined} />
      </TooltipProvider>
    );

    const button = screen.getByRole("button", { name: /close guru ai command center/i });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("renders embedded mode indicator when on problem solver page", () => {
    render(
      <TooltipProvider>
        <AiCommandLauncher embedded={true} />
      </TooltipProvider>
    );

    expect(screen.getByText("Guru Active")).toBeInTheDocument();
  });
});
