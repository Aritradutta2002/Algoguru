import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("ENV check:", { hasUrl: !!supabaseUrl, hasKey: !!serviceRoleKey });

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller identity
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    if (action === "list_users") {
      const { data, error } = await adminClient.auth.admin.listUsers({
        page: params.page || 1,
        perPage: params.perPage || 50,
      });
      if (error) throw error;

      const userIds = data.users.map((u: any) => u.id);
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const { data: roles } = await adminClient
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const enriched = data.users.map((u: any) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        banned_until: u.banned_until || null,
        profile: profiles?.find((p: any) => p.user_id === u.id) || null,
        roles: roles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) || [],
      }));

      return new Response(JSON.stringify({ users: enriched, total: data.users.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "ban_user") {
      if (!params.userId) throw new Error("userId required");
      if (params.userId === caller.id) throw new Error("Cannot ban yourself");
      const banDuration = params.permanent ? "876000h" : "8760h"; // permanent = 100 years, else 1 year
      const { error } = await adminClient.auth.admin.updateUserById(params.userId, {
        ban_duration: banDuration,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "unban_user") {
      if (!params.userId) throw new Error("userId required");
      const { error } = await adminClient.auth.admin.updateUserById(params.userId, {
        ban_duration: "none",
      });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_user") {
      if (!params.userId) throw new Error("userId required");
      if (params.userId === caller.id) throw new Error("Cannot delete yourself");
      const { error } = await adminClient.auth.admin.deleteUser(params.userId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set_role") {
      if (!params.userId || !params.role) throw new Error("userId and role required");
      if (params.userId === caller.id) throw new Error("Cannot change own role");

      if (params.role === "none") {
        await adminClient.from("user_roles").delete().eq("user_id", params.userId);
      } else {
        await adminClient.from("user_roles").upsert(
          { user_id: params.userId, role: params.role },
          { onConflict: "user_id,role" }
        );
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "stats") {
      const { data: allUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      const totalUsers = allUsers?.users?.length || 0;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentSignups = allUsers?.users?.filter(
        (u: any) => new Date(u.created_at) > weekAgo
      ).length || 0;

      const recentLogins = allUsers?.users?.filter(
        (u: any) => u.last_sign_in_at && new Date(u.last_sign_in_at) > weekAgo
      ).length || 0;

      return new Response(JSON.stringify({ totalUsers, recentSignups, recentLogins }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Admin API error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
