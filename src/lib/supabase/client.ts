import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/integrations/supabase/types";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-publishable-key";

/**
 * Creates a cookie-backed Supabase browser client for Client Components.
 * Falls back to safe placeholders when env vars are missing during static
 * prerender or tests so importing modules never throws at import time.
 */
export function createClient() {
  const supabaseUrl = publicEnv.supabaseUrl || PLACEHOLDER_URL;
  const supabaseKey = publicEnv.supabasePublishableKey || PLACEHOLDER_KEY;

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
