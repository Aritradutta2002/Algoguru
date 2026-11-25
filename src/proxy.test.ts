import { NextRequest, NextResponse } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/dist/experimental/testing/server/middleware-testing-utils";
import type { CookieOptions } from "@supabase/ssr";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { config, proxy } from "@/proxy";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

type CookieAdapter = {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (cookiesToSet: CookieToSet[]) => void | Promise<void>;
};

const supabaseBoundary = vi.hoisted(() => ({
  env: {
    supabaseUrl: "https://example.supabase.co",
    supabasePublishableKey: "test-publishable-key",
  },
  user: null as { id: string } | null,
  cookiesToSet: [] as CookieToSet[],
}));

vi.mock("@/lib/env", () => ({
  publicEnv: supabaseBoundary.env,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(
    (_url: string, _key: string, { cookies }: { cookies: CookieAdapter }) => ({
      auth: {
        getUser: vi.fn(async () => {
          if (supabaseBoundary.cookiesToSet.length > 0) {
            await cookies.setAll(supabaseBoundary.cookiesToSet);
          }
          return {
            data: { user: supabaseBoundary.user },
            error: null,
          };
        }),
      },
    }),
  ),
}));

const ORIGIN = "https://algoguru.test";
const ServerHeaders = new NextRequest(ORIGIN).headers.constructor;

beforeAll(() => {
  // NextRequest uses Node's Headers, while the shared test setup provides jsdom's.
  vi.stubGlobal("Headers", ServerHeaders);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

function expectPassThrough(response: NextResponse) {
  expect(response).toBeInstanceOf(NextResponse);
  expect(response.status).toBe(200);
  expect(response.headers.get("location")).toBeNull();
  expect(response.headers.get("x-middleware-next")).toBe("1");
}

beforeEach(() => {
  supabaseBoundary.user = null;
  supabaseBoundary.cookiesToSet = [];
  supabaseBoundary.env.supabaseUrl = "https://example.supabase.co";
  supabaseBoundary.env.supabasePublishableKey = "test-publishable-key";
});

const REFRESHED_COOKIES: CookieToSet[] = [
  {
    name: "sb-test-auth-token.0",
    value: "refreshed-access-token",
    options: {
      path: "/",
      maxAge: 3600,
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    },
  },
  {
    name: "sb-test-auth-token.1",
    value: "",
    options: {
      path: "/",
      maxAge: 0,
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    },
  },
];

function expectRefreshedCookies(response: NextResponse) {
  const setCookieHeaders = response.headers.getSetCookie();

  expect(setCookieHeaders).toHaveLength(2);
  expect(setCookieHeaders[0]).toContain(
    "sb-test-auth-token.0=refreshed-access-token",
  );
  expect(setCookieHeaders[0]).toContain("Max-Age=3600");
  expect(setCookieHeaders[1]).toContain("sb-test-auth-token.1=");
  expect(setCookieHeaders[1]).toContain("Max-Age=0");
  for (const header of setCookieHeaders) {
    expect(header).toContain("Path=/");
    expect(header).toContain("Secure");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=lax");
  }
}

describe("proxy matcher boundaries", () => {
  it.each([
    "/_next/static/chunks/app.js",
    "/_next/image",
    "/_next/image?url=%2Fbrand%2Falgoguru-mark.svg&w=64&q=75",
    "/_next/hmr",
    "/favicon.ico",
    "/favicon.ico/",
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
    "/site.webmanifest/",
    "/robots.txt",
    "/robots.txt/",
    "/brand/",
    "/brand/algoguru-mark.svg",
    "/brand/guru-ai.png",
  ])("skips proxy for public asset %s", (path) => {
    expect(
      unstable_doesMiddlewareMatch({ config, url: `${ORIGIN}${path}` }),
    ).toBe(false);
  });

  it.each([
    "/_next-private",
    "/_next-private/",
    "/_next/static-private/chunk.js",
    "/_next/image-private",
    "/favicon-dashboard",
    "/favicon-dashboard.png",
    "/favicon-dashboard.ico",
    "/favicon.ico.backup",
    "/favicon.svg/private",
    "/icon-dashboard",
    "/icon-dashboard.png",
    "/icon-192.png.backup",
    "/brand-private/logo.svg",
    "/profile/private.svg",
    "/auth",
    "/support/",
    "/java-roadmap/advanced",
  ])("runs proxy for public route or private lookalike %s", (path) => {
    expect(
      unstable_doesMiddlewareMatch({ config, url: `${ORIGIN}${path}` }),
    ).toBe(true);
  });
});

describe("proxy public routes", () => {
  it.each([
    "/",
    "/buy-me-a-coffee",
    "/buy-me-a-coffee/",
    "/support",
    "/support/",
  ])("allows anonymous access to %s", async (path) => {
    const response = await proxy(new NextRequest(`${ORIGIN}${path}`));

    expectPassThrough(response);
  });

  it.each([
    "/auth",
    "/auth/",
    "/auth/callback",
    "/auth/callback/",
    "/auth/reset",
    "/reset-password",
    "/reset-password/",
    "/reset-password/update",
    "/java-roadmap/advanced",
  ])("preserves anonymous access to %s", async (path) => {
    const response = await proxy(
      new NextRequest(`${ORIGIN}${path}?redirect=%2Fprofile`),
    );

    expectPassThrough(response);
  });

  it.each([
    "/_next/static/chunks/app.js",
    "/_next/image?url=%2Fbrand%2Falgoguru-mark.svg&w=64&q=75",
    "/favicon.ico",
    "/favicon.svg",
    "/brand/logo.svg",
    "/site.webmanifest",
    "/robots.txt",
  ])("allows anonymous access to asset route %s", async (path) => {
    const response = await proxy(new NextRequest(`${ORIGIN}${path}`));

    expectPassThrough(response);
  });

  it("does not make an unknown route public", async () => {
    const response = await proxy(
      new NextRequest(`${ORIGIN}/not-a-public-route`),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/auth?redirect=%2Fnot-a-public-route`,
    );
  });
});

describe("proxy protected routes", () => {
  it.each([
    ["/profile?tab=activity", "%2Fprofile%3Ftab%3Dactivity"],
    ["/notes?folder=java", "%2Fnotes%3Ffolder%3Djava"],
    ["/admin?view=users", "%2Fadmin%3Fview%3Dusers"],
    ["/practice?topic=arrays", "%2Fpractice%3Ftopic%3Darrays"],
    ["/playground?language=java", "%2Fplayground%3Flanguage%3Djava"],
    [
      "/problem-solver?problem=two-sum",
      "%2Fproblem-solver%3Fproblem%3Dtwo-sum",
    ],
    ["/contest?tab=live", "%2Fcontest%3Ftab%3Dlive"],
    ["/interview?language=python", "%2Finterview%3Flanguage%3Dpython"],
    [
      "/buy-me-a-coffee/unknown",
      "%2Fbuy-me-a-coffee%2Funknown",
    ],
    ["/support/unknown", "%2Fsupport%2Funknown"],
    ["/authish", "%2Fauthish"],
    ["/reset-password-extra", "%2Freset-password-extra"],
    ["/_next-private", "%2F_next-private"],
    ["/_next-private/", "%2F_next-private%2F"],
    [
      "/_next/static-private/chunk.js",
      "%2F_next%2Fstatic-private%2Fchunk.js",
    ],
    ["/favicon-dashboard", "%2Ffavicon-dashboard"],
    ["/favicon-dashboard.png", "%2Ffavicon-dashboard.png"],
    ["/icon-dashboard.png", "%2Ficon-dashboard.png"],
    ["/brand-private/logo.svg", "%2Fbrand-private%2Flogo.svg"],
  ])("redirects anonymous access to %s with its return path", async (path, redirect) => {
    const response = await proxy(new NextRequest(`${ORIGIN}${path}`));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/auth?redirect=${redirect}`,
    );
  });
});

describe("proxy legacy roadmap redirect", () => {
  it.each(["/java-roadmap", "/java-roadmap/"])(
    "redirects %s to the migrated roadmap",
    async (path) => {
      const response = await proxy(new NextRequest(`${ORIGIN}${path}`));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        `${ORIGIN}/roadmap/java`,
      );
    },
  );
});

describe("proxy authenticated auth-page redirects", () => {
  beforeEach(() => {
    supabaseBoundary.user = { id: "test-user" };
  });

  it.each(["/auth", "/auth/"])(
    "redirects a logged-in user from %s to the safe target",
    async (path) => {
      const response = await proxy(
        new NextRequest(
          `${ORIGIN}${path}?redirect=%2Fpractice%3Ftopic%3Darrays`,
        ),
      );

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        `${ORIGIN}/practice?topic=arrays`,
      );
    },
  );

  it.each([
    { entry: "/auth", target: "%2Fauth" },
    { entry: "/auth", target: "%2Fauth%2F" },
    { entry: "/auth/", target: "%2Fauth" },
    { entry: "/auth/", target: "%2Fauth%2F" },
    { entry: "/auth", target: "%20%2Fauth%20" },
  ])(
    "falls back to / for auth entry $entry with sanitized target $target",
    async ({ entry, target }) => {
      const response = await proxy(
        new NextRequest(`${ORIGIN}${entry}?redirect=${target}`),
      );

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(`${ORIGIN}/`);
    },
  );

  it.each([
    "https%3A%2F%2Fevil.example%2Fphish",
    "%2F%2Fevil.example%2Fphish",
    "%2Fprofile%5Cevil",
  ])("sanitizes an unsafe auth redirect target %s", async (redirect) => {
    const response = await proxy(
      new NextRequest(`${ORIGIN}/auth?redirect=${redirect}`),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/`);
  });
});

describe("proxy refreshed-cookie propagation", () => {
  beforeEach(() => {
    supabaseBoundary.cookiesToSet = REFRESHED_COOKIES;
  });

  it("preserves Supabase Set-Cookie headers on authenticated auth redirects", async () => {
    supabaseBoundary.user = { id: "test-user" };

    const response = await proxy(
      new NextRequest(`${ORIGIN}/auth?redirect=%2Fprofile`),
    );

    expect(response.headers.get("location")).toBe(`${ORIGIN}/profile`);
    expectRefreshedCookies(response);
  });

  it("preserves Supabase Set-Cookie headers on anonymous private redirects", async () => {
    const response = await proxy(
      new NextRequest(`${ORIGIN}/profile?tab=activity`),
    );

    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/auth?redirect=%2Fprofile%3Ftab%3Dactivity`,
    );
    expectRefreshedCookies(response);
  });
});

describe("proxy without Supabase configuration", () => {
  it.each([
    {
      supabaseUrl: "",
      supabasePublishableKey: "test-publishable-key",
    },
    {
      supabaseUrl: "https://example.supabase.co",
      supabasePublishableKey: "",
    },
    {
      supabaseUrl: "",
      supabasePublishableKey: "",
    },
  ])("passes protected requests through when configuration is incomplete", async (env) => {
    supabaseBoundary.env.supabaseUrl = env.supabaseUrl;
    supabaseBoundary.env.supabasePublishableKey =
      env.supabasePublishableKey;

    const response = await proxy(
      new NextRequest(`${ORIGIN}/profile?tab=activity`),
    );

    expectPassThrough(response);
  });
});
