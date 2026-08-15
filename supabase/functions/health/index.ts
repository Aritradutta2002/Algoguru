// Health-check edge function for UptimeRobot monitoring.
//
// GET /functions/v1/health
//
// Verifies:
//   1. The edge function runtime is alive (implicit — if this runs, the app is up).
//   2. The Supabase PostgreSQL database is reachable (via health_ping() RPC).
//
// Returns:
//   200  { "status": "UP",   "database": "UP"   }   — everything healthy
//   503  { "status": "DOWN", "database": "DOWN" }   — database unreachable
//
// Security:
//   - verify_jwt = false (no authentication required)
//   - Never exposes credentials, connection strings, stack traces, or SQL errors
//
// Performance:
//   - health_ping() is an IMMUTABLE function returning SELECT 1
//   - 5-second timeout via AbortController prevents hanging

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const HEALTH_TIMEOUT_MS = 5_000;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    // Server misconfigured — return 503 without leaking details
    return new Response(
      JSON.stringify({ status: "DOWN", database: "DOWN" }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Abort if the database check takes too long
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    try {
      const { data, error } = await supabase.rpc("health_ping", {}, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (error || data !== 1) {
        // Database call failed — do not expose the error message
        return new Response(
          JSON.stringify({ status: "DOWN", database: "DOWN" }),
          {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({ status: "UP", database: "UP" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } catch (_rpcError) {
      clearTimeout(timeout);
      // Timeout or network failure — do not expose internal details
      return new Response(
        JSON.stringify({ status: "DOWN", database: "DOWN" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (_outerError) {
    // Client creation failed — do not expose internal details
    return new Response(
      JSON.stringify({ status: "DOWN", database: "DOWN" }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
