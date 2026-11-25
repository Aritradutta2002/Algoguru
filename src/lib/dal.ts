import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type VerifiedSession =
  | { isAuth: true; user: User }
  | { isAuth: false; user: null };

export interface CurrentUserWithRole {
  user: User;
  profile: ProfileRow | null;
  roles: AppRole[];
}

/**
 * Verifies the active Supabase user via `supabase.auth.getUser()` (never
 * trusting unverified `getSession()` cookies on the server). Deduplicated per
 * request with React `cache()`.
 */
export const verifySession = cache(async (): Promise<VerifiedSession> => {
  if (!publicEnv.supabaseUrl || !publicEnv.supabasePublishableKey) {
    return { isAuth: false, user: null };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { isAuth: false, user: null };
    }

    return { isAuth: true, user };
  } catch {
    return { isAuth: false, user: null };
  }
});

/**
 * Loads the authenticated user along with their `profiles` row and `user_roles`.
 * Returns `null` when unauthenticated.
 */
export const getCurrentUserWithRole = cache(
  async (): Promise<CurrentUserWithRole | null> => {
    const session = await verifySession();
    if (!session.isAuth) return null;

    const supabase = await createServerSupabaseClient();
    const [{ data: profile }, { data: roleRows }] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id),
    ]);

    return {
      user: session.user,
      profile: profile ?? null,
      roles: (roleRows ?? []).map((row) => row.role),
    };
  },
);

/**
 * Checks whether the current authenticated user holds the specified role.
 */
export async function verifyUserRole(role: AppRole): Promise<boolean> {
  const current = await getCurrentUserWithRole();
  return Boolean(current && current.roles.includes(role));
}
