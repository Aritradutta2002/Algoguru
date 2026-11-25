import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "./radio-group";

function ControlledRadioGroup({ onValueChange }: { onValueChange: (value: string) => void }) {
  const [value, setValue] = useState("standard");

  return (
    <RadioGroup
      aria-label="Delivery speed"
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        onValueChange(nextValue);
      }}
    >
      <div>
        <RadioGroupItem id="standard" value="standard" />
        <Label htmlFor="standard">Standard</Label>
      </div>
      <div>
        <RadioGroupItem id="express" value="express" />
        <Label htmlFor="express">Express</Label>
      </div>
    </RadioGroup>
  );
}

describe("RadioGroup", () => {
  it("renders accessible radio roles and labels", () => {
    render(
      <RadioGroup aria-label="Delivery speed">
        <div>
          <RadioGroupItem id="standard" value="standard" />
          <Label htmlFor="standard">Standard</Label>
        </div>
        <div>
          <RadioGroupItem id="express" value="express" />
          <Label htmlFor="express">Express</Label>
        </div>
      </RadioGroup>,
    );

    expect(screen.getByRole("radiogroup", { name: "Delivery speed" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByRole("radio", { name: "Standard" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Express" })).toBeInTheDocument();
  });

  it("supports controlled value and onValueChange selection", () => {
    const onValueChange = vi.fn();
    render(<ControlledRadioGroup onValueChange={onValueChange} />);

    const standard = screen.getByRole("radio", { name: "Standard" });
    const express = screen.getByRole("radio", { name: "Express" });

    expect(standard).toBeChecked();
    expect(express).not.toBeChecked();

    fireEvent.click(express);

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("express");
    expect(standard).not.toBeChecked();
    expect(express).toBeChecked();
  });

  it("prevents disabled items from changing the selection", () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup aria-label="Delivery speed" defaultValue="standard" onValueChange={onValueChange}>
        <RadioGroupItem aria-label="Standard" value="standard" />
        <RadioGroupItem aria-label="Express" value="express" disabled />
      </RadioGroup>,
    );

    const standard = screen.getByRole("radio", { name: "Standard" });
    const express = screen.getByRole("radio", { name: "Express" });

    expect(express).toBeDisabled();
    fireEvent.click(express);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(standard).toBeChecked();
    expect(express).not.toBeChecked();
  });

  it("forwards the Radix name attribute to native form controls", () => {
    render(
      <form aria-label="Delivery preferences">
        <RadioGroup name="delivery-speed" defaultValue="standard">
          <RadioGroupItem aria-label="Standard" value="standard" />
          <RadioGroupItem aria-label="Express" value="express" />
        </RadioGroup>
      </form>,
    );

    const form = screen.getByRole<HTMLFormElement>("form", { name: "Delivery preferences" });
    expect(new FormData(form).get("delivery-speed")).toBe("standard");

    fireEvent.click(screen.getByRole("radio", { name: "Express" }));

    expect(new FormData(form).get("delivery-speed")).toBe("express");
  });
});
