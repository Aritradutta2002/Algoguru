import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getAvatarUrl } from "@/lib/avatarUrl";
import { toast } from "@/hooks/use-toast";
import { Camera, Save, Loader2 } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(async ({ data }) => {
        if (data) {
          setDisplayName(data.display_name || "");
          const url = await getAvatarUrl(data.avatar_url);
          setAvatarUrl(url);
        }
        setLoading(false);
      });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB allowed", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: signedData } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 3600);

    const newUrl = signedData?.signedUrl || null;

    await supabase
      .from("profiles")
      .update({ avatar_url: path })
      .eq("user_id", user.id);

    setAvatarUrl(newUrl);
    setUploading(false);
    toast({ title: "Avatar updated!" });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved!" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={24} style={{ color: "hsl(var(--muted-foreground))" }} />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-8" style={{ color: "hsl(var(--foreground))" }}>
        Profile Settings
      </h1>

      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="relative group">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover"
              style={{ border: "3px solid hsl(var(--border))" }}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: "hsl(var(--primary)/0.15)", color: "hsl(var(--primary))", border: "3px solid hsl(var(--border))" }}
            >
              {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "hsl(var(--background)/0.7)" }}
          >
            {uploading ? (
              <Loader2 className="animate-spin" size={20} style={{ color: "hsl(var(--foreground))" }} />
            ) : (
              <Camera size={20} style={{ color: "hsl(var(--foreground))" }} />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          Click to upload avatar (max 2MB)
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            Email
          </label>
          <div
            className="px-3 py-2.5 rounded-xl text-sm"
            style={{ background: "hsl(var(--muted)/0.5)", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}
          >
            {user?.email}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            Display Name
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
            }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{
            background: "var(--gradient-primary, hsl(var(--primary)))",
            color: "hsl(var(--primary-foreground))",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
