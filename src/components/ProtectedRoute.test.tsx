import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import {
  mockRouter,
  resetNextNavigationMocks,
  setMockPathname,
} from "@/test/nextNavigationMock";
import { ProtectedRoute } from "./ProtectedRoute";

const authBoundary = vi.hoisted(() => ({
  session: null as { user: { id: string } } | null,
  loading: false,
}));

vi.mock("next/navigation", async () => {
  const { createNextNavigationMock } = await import(
    "@/test/nextNavigationMock"
  );
  return createNextNavigationMock();
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authBoundary,
}));

vi.mock("@/components/layout/RouteFallback", () => ({
  AppLoadingScreen: ({ label }: { label: string }) => (
    <div role="status">{label}</div>
  ),
}));

beforeEach(() => {
  resetNextNavigationMocks();
  authBoundary.session = null;
  authBoundary.loading = false;
  window.history.replaceState({}, "", "/");
});

afterEach(cleanup);

function renderProtectedRoute() {
  return render(
    <ProtectedRoute>
      <div>Route content</div>
    </ProtectedRoute>,
  );
}

describe("ProtectedRoute public routes", () => {
  it.each([
    "/",
    "/buy-me-a-coffee",
    "/buy-me-a-coffee/",
    "/support",
    "/support/",
    "/auth",
    "/auth/",
    "/auth/callback",
    "/reset-password",
    "/java-roadmap",
    "/_next/static/chunks/app.js",
    "/favicon.ico",
    "/brand/logo.svg",
    "/site.webmanifest",
    "/robots.txt",
  ])("renders anonymous public route %s without redirecting", (pathname) => {
    setMockPathname(pathname);

    renderProtectedRoute();

    expect(screen.getByText("Route content")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it.each(["/", "/buy-me-a-coffee/", "/support"])(
    "renders public route %s without waiting for auth loading",
    (pathname) => {
      setMockPathname(pathname);
      authBoundary.loading = true;

      renderProtectedRoute();

      expect(screen.getByText("Route content")).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    },
  );
});

describe("ProtectedRoute private routes", () => {
  it.each([
    {
      pathname: "/buy-me-a-coffee/unknown",
      search: "?item=coffee",
      redirect: "%2Fbuy-me-a-coffee%2Funknown%3Fitem%3Dcoffee",
    },
    {
      pathname: "/support/unknown",
      search: "?topic=billing",
      redirect: "%2Fsupport%2Funknown%3Ftopic%3Dbilling",
    },
    {
      pathname: "/authish",
      search: "",
      redirect: "%2Fauthish",
    },
    {
      pathname: "/_next-private",
      search: "",
      redirect: "%2F_next-private",
    },
    {
      pathname: "/_next-private/",
      search: "",
      redirect: "%2F_next-private%2F",
    },
    {
      pathname: "/_next/static-private/chunk.js",
      search: "",
      redirect: "%2F_next%2Fstatic-private%2Fchunk.js",
    },
    {
      pathname: "/favicon-dashboard",
      search: "",
      redirect: "%2Ffavicon-dashboard",
    },
    {
      pathname: "/favicon-dashboard.png",
      search: "",
      redirect: "%2Ffavicon-dashboard.png",
    },
    {
      pathname: "/icon-dashboard.png",
      search: "",
      redirect: "%2Ficon-dashboard.png",
    },
    {
      pathname: "/brand-private/logo.svg",
      search: "",
      redirect: "%2Fbrand-private%2Flogo.svg",
    },
  ])(
    "redirects anonymous $pathname with its path and query",
    async ({ pathname, search, redirect }) => {
      setMockPathname(pathname);
      window.history.replaceState({}, "", `${pathname}${search}`);

      renderProtectedRoute();

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith(
          `/auth?redirect=${redirect}`,
        );
      });
      expect(screen.getByRole("status")).toHaveTextContent(
        "Restoring your session",
      );
    },
  );

  it("keeps the loading gate while a private session is restoring", () => {
    setMockPathname("/profile");
    authBoundary.loading = true;
    authBoundary.session = { user: { id: "test-user" } };

    renderProtectedRoute();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Restoring your session",
    );
    expect(screen.queryByText("Route content")).not.toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("renders a private route for an authenticated user", () => {
    setMockPathname("/profile");
    authBoundary.session = { user: { id: "test-user" } };

    renderProtectedRoute();

    expect(screen.getByText("Route content")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
