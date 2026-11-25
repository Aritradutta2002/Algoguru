const PUBLIC_EXACT_ROUTES = [
  "/",
  "/buy-me-a-coffee",
  "/support",
  "/_next/hmr",
  "/favicon.ico",
  "/favicon.svg",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/mask-icon.svg",
  "/og-image.png",
  "/placeholder.svg",
  "/site.webmanifest",
  "/robots.txt",
];

const PUBLIC_EXACT_OR_PREFIX_ROUTES = [
  "/auth",
  "/auth/callback",
  "/reset-password",
  "/java-roadmap",
  "/_next/static",
  "/_next/image",
  "/brand",
];

export function isPublicRoute(pathname: string): boolean {
  const normalizedPathname =
    pathname !== "/" && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  return (
    PUBLIC_EXACT_ROUTES.includes(normalizedPathname) ||
    PUBLIC_EXACT_OR_PREFIX_ROUTES.some(
      (route) =>
        normalizedPathname === route ||
        normalizedPathname.startsWith(`${route}/`),
    )
  );
}
