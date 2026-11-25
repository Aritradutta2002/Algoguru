/**
 * Public client-safe environment configuration.
 *
 * Next.js only inlines static `process.env.NEXT_PUBLIC_*` property accesses in
 * client bundles, so every variable is read explicitly rather than dynamically.
 */
export const publicEnv = {
  get supabaseUrl(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  },
  get supabasePublishableKey(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  },
  get publicBaseUrl(): string {
    return process.env.NEXT_PUBLIC_PUBLIC_BASE_URL || "";
  },
  get upiId(): string {
    return process.env.NEXT_PUBLIC_UPI_ID || "";
  },
  get razorpayUrl(): string {
    return process.env.NEXT_PUBLIC_RAZORPAY_URL || "";
  },
  get paypalUrl(): string {
    return process.env.NEXT_PUBLIC_PAYPAL_URL || "";
  },
  get buyMeACoffeeUrl(): string {
    return process.env.NEXT_PUBLIC_BUYMEACOFFEE_URL || "";
  },
  get cryptoAddress(): string {
    return process.env.NEXT_PUBLIC_CRYPTO_ADDRESS || "";
  },
  get contestSessionMode(): string {
    return process.env.NEXT_PUBLIC_CONTEST_SESSION_MODE || "";
  },
  get contestExecutionMode(): string {
    return process.env.NEXT_PUBLIC_CONTEST_EXECUTION_MODE || "";
  },
};

export const isDev = process.env.NODE_ENV !== "production";
