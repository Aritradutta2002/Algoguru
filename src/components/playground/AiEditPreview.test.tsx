import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AiEditPreview } from "./AiEditPreview";

vi.mock("next/dynamic", () => ({
  default: () => function MockDiffEditor() {
    return <textarea aria-label="Embedded diff editor" readOnly />;
  },
}));

function renderPreview() {
  const onAccept = vi.fn();
  const onReject = vi.fn();
  render(
    <AiEditPreview
      original="const answer = 1;"
      modified="const answer = 2;"
      language="typescript"
      theme="dark"
      onAccept={onAccept}
      onReject={onReject}
    />,
  );
  return { onAccept, onReject };
}

describe("AiEditPreview", () => {
  it("exposes a named nonmodal region instead of a dialog", () => {
    renderPreview();

    const preview = screen.getByRole("region", { name: "Proposed GuruBot edit" });
    expect(preview).not.toHaveAttribute("aria-modal");
    expect(
      screen.queryByRole("dialog", { name: "Proposed GuruBot edit" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the review editor and actions embedded in the preview", () => {
    const { onAccept, onReject } = renderPreview();
    const preview = screen.getByRole("region", { name: "Proposed GuruBot edit" });

    expect(within(preview).getByLabelText("Embedded diff editor")).toBeInTheDocument();
    fireEvent.click(within(preview).getByRole("button", { name: "Reject" }));
    fireEvent.click(within(preview).getByRole("button", { name: "Accept" }));
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
