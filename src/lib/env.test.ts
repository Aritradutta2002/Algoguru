import { afterEach, describe, expect, it, vi } from "vitest";

import { publicEnv } from "@/lib/env";

const environmentCases = [
  {
    getter: "supabaseUrl",
    nextVariable: "NEXT_PUBLIC_SUPABASE_URL",
    legacyVariable: "VITE_SUPABASE_URL",
  },
  {
    getter: "supabasePublishableKey",
    nextVariable: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    legacyVariable: "VITE_SUPABASE_PUBLISHABLE_KEY",
  },
  {
    getter: "publicBaseUrl",
    nextVariable: "NEXT_PUBLIC_PUBLIC_BASE_URL",
    legacyVariable: "VITE_PUBLIC_BASE_URL",
  },
  {
    getter: "upiId",
    nextVariable: "NEXT_PUBLIC_UPI_ID",
    legacyVariable: "VITE_UPI_ID",
  },
  {
    getter: "razorpayUrl",
    nextVariable: "NEXT_PUBLIC_RAZORPAY_URL",
    legacyVariable: "VITE_RAZORPAY_URL",
  },
  {
    getter: "paypalUrl",
    nextVariable: "NEXT_PUBLIC_PAYPAL_URL",
    legacyVariable: "VITE_PAYPAL_URL",
  },
  {
    getter: "buyMeACoffeeUrl",
    nextVariable: "NEXT_PUBLIC_BUYMEACOFFEE_URL",
    legacyVariable: "VITE_BUYMEACOFFEE_URL",
  },
  {
    getter: "cryptoAddress",
    nextVariable: "NEXT_PUBLIC_CRYPTO_ADDRESS",
    legacyVariable: "VITE_CRYPTO_ADDRESS",
  },
  {
    getter: "contestSessionMode",
    nextVariable: "NEXT_PUBLIC_CONTEST_SESSION_MODE",
    legacyVariable: "VITE_CONTEST_SESSION_MODE",
  },
  {
    getter: "contestExecutionMode",
    nextVariable: "NEXT_PUBLIC_CONTEST_EXECUTION_MODE",
    legacyVariable: "VITE_CONTEST_EXECUTION_MODE",
  },
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("publicEnv", () => {
  it.each(environmentCases)(
    "uses $nextVariable for $getter when both values are present",
    ({ getter, nextVariable, legacyVariable }) => {
      vi.stubEnv(nextVariable, "next-value");
      vi.stubEnv(legacyVariable, "legacy-value");

      expect(publicEnv[getter]).toBe("next-value");
    },
  );

  it.each(environmentCases)(
    "ignores $legacyVariable for $getter and falls back to an empty string",
    ({ getter, nextVariable, legacyVariable }) => {
      vi.stubEnv(nextVariable, "");
      vi.stubEnv(legacyVariable, "legacy-value");

      expect(publicEnv[getter]).toBe("");
    },
  );
});
