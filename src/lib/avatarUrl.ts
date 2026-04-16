import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves an avatar path (stored in profiles.avatar_url) to a signed URL.
 * Returns null if the path is empty or signing fails.
 */
export async function getAvatarUrl(avatarPath: string | null): Promise<string | null> {
  if (!avatarPath) return null;

  // If it's already a full URL (legacy), return as-is
  if (avatarPath.startsWith("http")) return avatarPath;

  const { data } = await supabase.storage
    .from("avatars")
    .createSignedUrl(avatarPath, 3600);

  return data?.signedUrl || null;
}
