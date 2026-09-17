/**
 * Resolves the dynamic redirect URL for authentication (OAuth sign-in, email signup, password reset).
 * 
 * - When running on localhost / 127.0.0.1 (on ANY port: 8080, 8081, 3000, 5173, etc.):
 *   Always stays on the current localhost origin and port so that local development
 *   runs 100% locally and never redirects to production.
 * 
 * - When deployed in production or preview environments:
 *   Uses the current window location origin (or an explicitly defined production VITE_PUBLIC_BASE_URL).
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
      // Dynamic local origin - retains whatever port (8080, 8081, 3000, etc.) is currently active
      return `${origin}${cleanPath}`;
    }

    // Production / preview deployment
    const configuredBase = import.meta.env.VITE_PUBLIC_BASE_URL;
    if (configuredBase && !configuredBase.includes("localhost") && !configuredBase.includes("127.0.0.1")) {
      const baseWithoutSlash = configuredBase.replace(/\/+$/, "");
      return `${baseWithoutSlash}${cleanPath}`;
    }

    return `${origin}${cleanPath}`;
  }

  // Non-browser / SSR / build fallback
  const envUrl = import.meta.env.VITE_PUBLIC_BASE_URL || "https://algoguru.online";
  const baseWithoutSlash = envUrl.replace(/\/+$/, "");
  return `${baseWithoutSlash}${cleanPath}`;
}
