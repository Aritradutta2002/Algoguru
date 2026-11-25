import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sanitizeRedirectPath } from "@/lib/authUrl";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/integrations/supabase/types";
import { isPublicRoute } from "@/lib/publicRoutes";

function withCopiedCookies(
  source: NextResponse,
  target: NextResponse,
): NextResponse {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  return target;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/java-roadmap" || pathname === "/java-roadmap/") {
    return NextResponse.redirect(new URL("/roadmap/java", request.url), 307);
  }

  const supabaseUrl = publicEnv.supabaseUrl;
  const supabaseKey = publicEnv.supabasePublishableKey;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  const isAuthPage = pathname === "/auth" || pathname === "/auth/";

  if (user && isAuthPage) {
    const sanitizedTargetPath = sanitizeRedirectPath(
      request.nextUrl.searchParams.get("redirect"),
    );
    const targetPath =
      sanitizedTargetPath === "/auth" || sanitizedTargetPath === "/auth/"
        ? "/"
        : sanitizedTargetPath;
    const redirectUrl = new URL(targetPath, request.url);
    return withCopiedCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
  }

  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.search = "";
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return withCopiedCookies(supabaseResponse, NextResponse.redirect(loginUrl));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static(?:/|$)|_next/image(?:/|$)|_next/hmr(?:/|$)|brand(?:/|$)|(?:favicon\\.ico|favicon\\.svg|favicon-16x16\\.png|favicon-32x32\\.png|apple-touch-icon\\.png|icon-192\\.png|icon-512\\.png|icon-maskable-512\\.png|mask-icon\\.svg|og-image\\.png|placeholder\\.svg|site\\.webmanifest|robots\\.txt)/?$).*)",
  ],
};
