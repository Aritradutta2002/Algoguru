import { publicEnv } from "@/lib/env";

const PLACEHOLDER_UPI_PATTERN = /^(?:your-upi@id|yourname@bankhandle)$/i;
const PLACEHOLDER_URL_PATTERN = /(?:yourname|your_payment_link|example\.com)/i;
const PLACEHOLDER_CRYPTO_PATTERN = /your[-_ ]?(?:crypto|address)/i;

export interface SupportConfig {
  upiId: string;
  buyMeACoffeeUrl: string;
  razorpayUrl: string;
  paypalUrl: string;
  cryptoAddress: string;
}

/**
 * Returns a configured UPI handle, or an empty string if unset or a template placeholder.
 */
export function resolveUpiId(raw: string = publicEnv.upiId): string {
  const trimmed = raw.trim();
  if (!trimmed || PLACEHOLDER_UPI_PATTERN.test(trimmed)) return "";
  return /^[^@\s]+@[^@\s]+$/.test(trimmed) ? trimmed : "";
}

/**
 * Returns a configured HTTP(S) payment URL, or an empty string if unset, `#`,
 * invalid, or a template placeholder.
 */
export function resolveExternalPaymentUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "#" || PLACEHOLDER_URL_PATTERN.test(trimmed)) {
    return "";
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return "";
    }
    return trimmed;
  } catch {
    return "";
  }
}

/**
 * Returns a configured cryptocurrency address, or an empty string if unset or a placeholder.
 */
export function resolveCryptoAddress(raw: string = publicEnv.cryptoAddress): string {
  const trimmed = raw.trim();
  if (!trimmed || PLACEHOLDER_CRYPTO_PATTERN.test(trimmed)) return "";
  return trimmed;
}

/**
 * Resolves all support payment channels from public environment variables,
 * omitting unconfigured or placeholder entries.
 */
export function getSupportConfig(): SupportConfig {
  return {
    upiId: resolveUpiId(publicEnv.upiId),
    buyMeACoffeeUrl: resolveExternalPaymentUrl(publicEnv.buyMeACoffeeUrl),
    razorpayUrl: resolveExternalPaymentUrl(publicEnv.razorpayUrl),
    paypalUrl: resolveExternalPaymentUrl(publicEnv.paypalUrl),
    cryptoAddress: resolveCryptoAddress(publicEnv.cryptoAddress),
  };
}
