import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { GuruComposer } from "./GuruComposer";

function Harness({
  onSend = vi.fn(),
  onStop = vi.fn(),
  busy = false,
  initial = "",
}: {
  onSend?: () => void;
  onStop?: () => void;
  busy?: boolean;
  initial?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <GuruComposer
      value={value}
      onChange={setValue}
      onSend={onSend}
      onStop={onStop}
      busy={busy}
      attachCode={false}
      onToggleAttachCode={() => {}}
      contextTokens={0}
      contextLabel="Editor context"
    />
  );
}

describe("GuruComposer", () => {
  it("sends on Enter", () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} initial="hello" />);

    fireEvent.keyDown(screen.getByLabelText("Message Guru"), { key: "Enter" });
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("inserts a newline on Shift+Enter", () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} initial="hello" />);

    fireEvent.keyDown(screen.getByLabelText("Message Guru"), {
      key: "Enter",
      shiftKey: true,
    });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not send while an IME composition is open", () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} initial="こんにちは" />);

    fireEvent.keyDown(screen.getByLabelText("Message Guru"), {
      key: "Enter",
      isComposing: true,
    });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("sends with the keyboard shortcut and labels the button accordingly", () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} initial="hello" />);

    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("swaps send for stop while streaming", () => {
    const onStop = vi.fn();
    render(<Harness busy initial="hello" onStop={onStop} />);

    const stop = screen.getByRole("button", { name: "Stop generating" });
    fireEvent.click(stop);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("disables send on an empty composer", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("offers slash commands and inserts the chosen one", () => {
    render(<Harness initial="/" />);

    const option = screen.getByRole("option", { name: /Hint only/ });
    fireEvent.click(option);

    expect(screen.getByLabelText("Message Guru")).toHaveValue("/hint ");
  });

  it("navigates the command list with the keyboard", () => {
    render(<Harness initial="/" />);
    const input = screen.getByLabelText("Message Guru");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(input).toHaveValue("/explain ");
  });

  it("reports the attach-context toggle as pressed", () => {
    render(<Harness />);
    expect(
      screen.getByRole("button", { name: /attach editor context/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});
