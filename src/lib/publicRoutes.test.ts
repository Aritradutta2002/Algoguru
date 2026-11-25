import { describe, expect, it } from "vitest";
import { isPublicRoute } from "./publicRoutes";

describe("isPublicRoute", () => {
  it.each([
    "/buy-me-a-coffee/",
    "/auth/reset/",
    "/reset-password/update/",
    "/java-roadmap/advanced/",
    "/_next/static/chunks/app.js",
    "/_next/image",
    "/_next/image/",
    "/_next/hmr",
    "/favicon.ico/",
    "/favicon.svg",
    "/favicon-32x32.png",
    "/brand",
    "/brand/logo.svg/",
    "/apple-touch-icon.png",
    "/icon-192.png",
    "/icon-maskable-512.png",
    "/mask-icon.svg",
    "/og-image.png",
    "/placeholder.svg",
    "/site.webmanifest/",
    "/robots.txt",
  ])("allows public route or asset %s", (pathname) => {
    expect(isPublicRoute(pathname)).toBe(true);
  });

  it.each([
    "/_next-private",
    "/_next-private/",
    "/_next/static-private/chunk.js",
    "/_next/image-private",
    "/favicon-dashboard",
    "/favicon-dashboard/",
    "/favicon-dashboard.ico",
    "/favicon-dashboard.png",
    "/favicon.ico.backup",
    "/favicon.svg/private",
    "/icon-dashboard",
    "/icon-dashboard.png",
    "/brand-private/logo.svg",
    "/branding",
    "/site.webmanifest/private",
    "/robots.txt/private",
    "/authish",
    "/support-private",
  ])("does not exempt private lookalike %s", (pathname) => {
    expect(isPublicRoute(pathname)).toBe(false);
  });
});
