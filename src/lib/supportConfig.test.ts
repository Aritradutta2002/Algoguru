import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSupportConfig,
  resolveCryptoAddress,
  resolveExternalPaymentUrl,
  resolveUpiId,
} from "./supportConfig";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("supportConfig", () => {
  it("filters out template placeholder UPI IDs and accepts valid handles", () => {
    expect(resolveUpiId("")).toBe("");
    expect(resolveUpiId("your-upi@id")).toBe("");
    expect(resolveUpiId("yourname@bankhandle")).toBe("");
    expect(resolveUpiId("not-a-upi")).toBe("");
    expect(resolveUpiId("creator@okicici")).toBe("creator@okicici");
  });

  it("filters out placeholder, hash, and non-HTTP payment URLs", () => {
    expect(resolveExternalPaymentUrl("")).toBe("");
    expect(resolveExternalPaymentUrl("#")).toBe("");
    expect(resolveExternalPaymentUrl("https://paypal.me/YourName")).toBe("");
    expect(resolveExternalPaymentUrl("https://buymeacoffee.com/YourName")).toBe("");
    expect(resolveExternalPaymentUrl("https://rzp.io/l/your_payment_link")).toBe("");
    expect(resolveExternalPaymentUrl("javascript:alert(1)")).toBe("");
    expect(resolveExternalPaymentUrl("https://rzp.io/rzp/algoguru")).toBe(
      "https://rzp.io/rzp/algoguru",
    );
  });

  it("filters out placeholder crypto addresses", () => {
    expect(resolveCryptoAddress("")).toBe("");
    expect(resolveCryptoAddress("your-crypto-address")).toBe("");
    expect(resolveCryptoAddress("0x1234567890abcdef")).toBe("0x1234567890abcdef");
  });

  it("reads and filters values from NEXT_PUBLIC_* environment variables", () => {
    vi.stubEnv("NEXT_PUBLIC_UPI_ID", "creator@okicici");
    vi.stubEnv("NEXT_PUBLIC_RAZORPAY_URL", "https://rzp.io/rzp/algoguru");
    vi.stubEnv("NEXT_PUBLIC_PAYPAL_URL", "https://paypal.me/YourName");
    vi.stubEnv("NEXT_PUBLIC_BUYMEACOFFEE_URL", "https://buymeacoffee.com/YourName");
    vi.stubEnv("NEXT_PUBLIC_CRYPTO_ADDRESS", "");

    expect(getSupportConfig()).toEqual({
      upiId: "creator@okicici",
      razorpayUrl: "https://rzp.io/rzp/algoguru",
      paypalUrl: "",
      buyMeACoffeeUrl: "",
      cryptoAddress: "",
    });
  });
});
