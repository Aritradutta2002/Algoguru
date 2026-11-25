import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeRedirectPath } from "@/lib/authUrl";
import { publicEnv } from "@/lib/env";

/**
 * Exchanges a Supabase Auth PKCE `?code=...` for a session cookie and redirects
 * to the validated relative `next` (or `redirect`) path.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const safeNext = sanitizeRedirectPath(
    searchParams.get("next") ?? searchParams.get("redirect"),
  );

  if (code && publicEnv.supabaseUrl && publicEnv.supabasePublishableKey) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(safeNext, request.url));
      }
    } catch {
      // Fall through to auth error redirect below.
    }
  }

  return NextResponse.redirect(
    new URL("/auth?error=auth_callback_failed", request.url),
  );
}
