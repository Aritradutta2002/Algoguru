import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SupportModal } from "./SupportModal";

afterEach(() => {
  vi.unstubAllEnvs();
});

function renderSupportModal() {
  const onClose = vi.fn();

  function Harness() {
    const [open, setOpen] = useState(false);

    return (
      <>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
          }}
        >
          Open support
        </button>
        {open && (
          <SupportModal
            onClose={() => {
              onClose();
              setOpen(false);
            }}
          />
        )}
      </>
    );
  }

  render(<Harness />);
  const trigger = screen.getByRole("button", { name: "Open support" });
  trigger.focus();
  fireEvent.click(trigger);

  return { onClose, trigger };
}

describe("SupportModal", () => {
  it("names the dialog and hides background content from assistive technology", () => {
    const { trigger } = renderSupportModal();

    expect(
      screen.getByRole("dialog", { name: "Support the build" }),
    ).toHaveAttribute("aria-modal", "true");
    expect(trigger.closest('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("dismisses on Escape and restores focus to the trigger", async () => {
    const { onClose, trigger } = renderSupportModal();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Support the build" }),
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it("keeps the custom close control without rendering a second Close button", () => {
    const { onClose } = renderSupportModal();

    expect(
      screen.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Close support dialog" }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("switches payment tabs and reveals the selected payment content", async () => {
    vi.stubEnv("NEXT_PUBLIC_UPI_ID", "creator@okicici");
    vi.stubEnv("NEXT_PUBLIC_RAZORPAY_URL", "https://rzp.io/rzp/algoguru");
    vi.stubEnv("NEXT_PUBLIC_PAYPAL_URL", "https://paypal.me/YourName");
    renderSupportModal();

    const upiTab = screen.getByRole("tab", { name: /UPI/ });
    const webTab = screen.getByRole("tab", { name: /Web/ });
    const upiPanel = screen.getByRole("tabpanel", { name: /UPI/ });
    expect(upiTab).toHaveAttribute("aria-selected", "true");
    expect(upiTab).toHaveAttribute("aria-controls", upiPanel.id);

    fireEvent.mouseDown(webTab, { button: 0 });

    expect(webTab).toHaveAttribute("aria-selected", "true");
    const webPanel = screen.getByRole("tabpanel", { name: /Web/ });
    expect(webTab).toHaveAttribute("aria-controls", webPanel.id);
    expect(upiPanel).not.toBeVisible();
    expect(await screen.findByText("International support")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Buy me a coffee/ }),
    ).toHaveAttribute("href", "/buy-me-a-coffee");
    expect(
      screen.getByRole("link", { name: /Razorpay checkout/ }),
    ).toHaveAttribute("href", "https://rzp.io/rzp/algoguru");
    expect(
      screen.queryByRole("link", { name: /PayPal global/ }),
    ).not.toBeInTheDocument();
  });

  it("hides placeholder UPI and dead # links when env vars are unset or placeholders", () => {
    vi.stubEnv("NEXT_PUBLIC_UPI_ID", "your-upi@id");
    vi.stubEnv("NEXT_PUBLIC_RAZORPAY_URL", "");
    vi.stubEnv("NEXT_PUBLIC_PAYPAL_URL", "");
    vi.stubEnv("NEXT_PUBLIC_BUYMEACOFFEE_URL", "https://buymeacoffee.com/YourName");
    renderSupportModal();

    expect(screen.queryByRole("tab", { name: /UPI/ })).not.toBeInTheDocument();
    expect(screen.queryByText("your-upi@id")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Razorpay checkout/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /PayPal global/ })).not.toBeInTheDocument();
    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("href", "#");
    }
  });
});
