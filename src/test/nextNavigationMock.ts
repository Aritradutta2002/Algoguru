import * as React from "react";
import { vi } from "vitest";

export class NextRedirectError extends Error {
  readonly url: string;
  constructor(url: string) {
    super(`NEXT_REDIRECT:${url}`);
    this.name = "NextRedirectError";
    this.url = url;
  }
}

export class NextNotFoundError extends Error {
  constructor() {
    super("NEXT_NOT_FOUND");
    this.name = "NextNotFoundError";
  }
}

export interface MockRouter {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  back: ReturnType<typeof vi.fn>;
  forward: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
  prefetch: ReturnType<typeof vi.fn>;
}

export const mockRouter: MockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

let currentPathname = "/";
let currentSearchParams = new URLSearchParams();
let currentParams: Record<string, string | string[]> = {};

export function setMockPathname(pathname: string): void {
  currentPathname = pathname;
}

export function setMockSearchParams(
  init: string | Record<string, string> | URLSearchParams,
): void {
  currentSearchParams = new URLSearchParams(init);
}

export function setMockParams(
  params: Record<string, string | string[]>,
): void {
  currentParams = { ...params };
}

export function resetNextNavigationMocks(): void {
  currentPathname = "/";
  currentSearchParams = new URLSearchParams();
  currentParams = {};
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  mockRouter.back.mockReset();
  mockRouter.forward.mockReset();
  mockRouter.refresh.mockReset();
  mockRouter.prefetch.mockReset();
  redirectMock.mockClear();
  notFoundMock.mockClear();
}

export const useRouter = () => mockRouter;
export const usePathname = () => currentPathname;
export const useSearchParams = () => currentSearchParams;
export const useParams = <
  T extends Record<string, string | string[]> = Record<string, string | string[]>,
>(): T => currentParams as T;

export const redirectMock = vi.fn((url: string): never => {
  throw new NextRedirectError(url);
});

export const notFoundMock = vi.fn((): never => {
  throw new NextNotFoundError();
});

export function redirect(url: string): never {
  return redirectMock(url);
}

export function notFound(): never {
  return notFoundMock();
}

type HrefLike =
  | string
  | {
      pathname?: string | null;
      query?: Record<string, string | number | boolean | null | undefined>;
      hash?: string | null;
    };

function formatHref(href: HrefLike): string {
  if (typeof href === "string") return href;
  const pathname = href.pathname ?? "/";
  const params = new URLSearchParams();
  if (href.query) {
    for (const [key, value] of Object.entries(href.query)) {
      if (value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    }
  }
  const search = params.toString();
  const hash = href.hash ? (href.hash.startsWith("#") ? href.hash : `#${href.hash}`) : "";
  return `${pathname}${search ? `?${search}` : ""}${hash}`;
}

export interface MockNextLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: HrefLike;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean | null;
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
  locale?: string | false;
}

export const MockNextLink = React.forwardRef<HTMLAnchorElement, MockNextLinkProps>(
  function MockNextLink(
    {
      href,
      replace: _replace,
      scroll: _scroll,
      prefetch: _prefetch,
      shallow: _shallow,
      passHref: _passHref,
      legacyBehavior: _legacyBehavior,
      locale: _locale,
      children,
      ...rest
    },
    ref,
  ) {
    return React.createElement(
      "a",
      { ref, href: formatHref(href), ...rest },
      children,
    );
  },
);

export function createNextNavigationMock() {
  return {
    useRouter,
    usePathname,
    useSearchParams,
    useParams,
    redirect,
    notFound,
  };
}

export function createNextLinkMock() {
  return {
    __esModule: true,
    default: MockNextLink,
  };
}
