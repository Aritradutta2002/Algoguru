import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/integrations/supabase/types";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-publishable-key";

/**
 * Creates an async per-request Supabase client bound to Next.js `cookies()`.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const supabaseUrl = publicEnv.supabaseUrl || PLACEHOLDER_URL;
  const supabaseKey = publicEnv.supabasePublishableKey || PLACEHOLDER_KEY;

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where mutating cookies is a no-op;
          // `src/proxy.ts` handles refreshing session cookies on requests.
        }
      },
    },
  });
}
