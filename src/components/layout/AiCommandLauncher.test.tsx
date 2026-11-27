import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AiCommandLauncher } from "./AiCommandLauncher";
import { TooltipProvider } from "@/components/ui/tooltip";

describe("AiCommandLauncher", () => {
  it("renders closed state with Ask Guru label and status dot", () => {
    const onClick = vi.fn();
    render(
      <TooltipProvider>
        <AiCommandLauncher open={false} onClick={onClick} />
      </TooltipProvider>,
    );

    const button = screen.getByRole("button", { name: /open guru ai command center/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Ask Guru")).toBeInTheDocument();
    expect(screen.queryByText(/ready/i)).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders open state with aria-pressed true", () => {
    render(
      <TooltipProvider>
        <AiCommandLauncher open={true} onClick={() => undefined} />
      </TooltipProvider>,
    );

    const button = screen.getByRole("button", { name: /close guru ai command center/i });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("uses the Guru mascot instead of a generic sparkles glyph", () => {
    render(
      <TooltipProvider>
        <AiCommandLauncher open={false} onClick={() => undefined} />
      </TooltipProvider>,
    );

    const button = screen.getByRole("button", { name: /open guru ai command center/i });
    expect(button.querySelector(".lucide-sparkles")).toBeNull();
    expect(button.querySelector("svg[viewBox='0 0 64 64']")).not.toBeNull();
    expect(button).toHaveTextContent("Ask Guru");
  });

  it("renders embedded mode indicator when on problem solver page", () => {
    render(
      <TooltipProvider>
        <AiCommandLauncher embedded={true} />
      </TooltipProvider>,
    );

    expect(screen.getByText("Guru Active")).toBeInTheDocument();
  });
});
