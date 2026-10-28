import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { GuruCodeBlock } from "./GuruCodeBlock";

function ThemeSwitch() {
  const { theme, toggleTheme } = useSettings();
  return (
    <button type="button" onClick={toggleTheme}>
      Switch from {theme}
    </button>
  );
}

describe("GuruCodeBlock theme", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("cp-theme", "light");
    document.documentElement.classList.remove("light", "dark");
  });

  it("follows the application theme switch, including syntax colours", () => {
    const { container } = render(
      <SettingsProvider>
        <ThemeSwitch />
        <GuruCodeBlock code="const answer = 42;" language="js" />
      </SettingsProvider>,
    );

    const surface = container.querySelector<HTMLElement>("[data-theme]");
    expect(surface).toHaveAttribute("data-theme", "light");
    expect(document.documentElement).toHaveClass("light");
    expect(screen.getByText("answer")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Switch from light" }));

    expect(surface).toHaveAttribute("data-theme", "dark");
    expect(document.documentElement).toHaveClass("dark");
    fireEvent.click(screen.getByRole("button", { name: "Switch from dark" }));
    expect(surface).toHaveAttribute("data-theme", "light");
    expect(document.documentElement).toHaveClass("light");
  });
});
