import { publicEnv } from "@/lib/env";

/**
 * Resolves the dynamic redirect URL for authentication (OAuth sign-in, email signup, password reset).
 * 
 * - When running on localhost / 127.0.0.1 (on ANY port: 3000, 8080, 8081, etc.):
 *   Always stays on the current localhost origin and port so that local development
 *   runs 100% locally and never redirects to production.
 * 
 * - When deployed in production or preview environments:
 *   Uses the current window location origin (or an explicitly defined production NEXT_PUBLIC_PUBLIC_BASE_URL).
 */
export function getAuthRedirectUrl(path: string = "/"): string {
  const cleanPath = !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined" && window.location) {
    const { origin, hostname } = window.location;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

    if (isLocalhost) {
      // Dynamic local origin - retains whatever port (3000, 8080, 8081, etc.) is currently active
      return `${origin}${cleanPath}`;
    }

    // Production / preview deployment
    const configuredBase = publicEnv.publicBaseUrl;
    if (configuredBase && !configuredBase.includes("localhost") && !configuredBase.includes("127.0.0.1")) {
      const baseWithoutSlash = configuredBase.replace(/\/+$/, "");
      return `${baseWithoutSlash}${cleanPath}`;
    }

    return `${origin}${cleanPath}`;
  }

  // Non-browser / SSR / build fallback
  const envUrl = publicEnv.publicBaseUrl || "https://algoguru.online";
  const baseWithoutSlash = envUrl.replace(/\/+$/, "");
  return `${baseWithoutSlash}${cleanPath}`;
}

/**
 * Validates that a post-auth redirect target is a safe relative path within
 * this origin (starts with `/`, never `//`, and contains no backslashes or
 * ASCII control characters).
 */
export function sanitizeRedirectPath(
  raw: string | null | undefined,
  fallback: string = "/",
): string {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  const hasControlChar = Array.from(trimmed).some((ch) => {
    const code = ch.charCodeAt(0);
    return code < 32 || code === 127;
  });
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    hasControlChar
  ) {
    return fallback;
  }
  return trimmed;
}
