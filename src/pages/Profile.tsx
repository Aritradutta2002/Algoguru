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
    <div className="flex-1 min-h-screen bg-background text-foreground selection:bg-primary selection:text-black animate-in fade-in duration-700">
      
      {/* Header Section */}
      <section className="px-6 md:px-10 lg:px-16 py-16 md:py-20 max-w-7xl mx-auto relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-[10px] font-bold uppercase tracking-widest mb-6">
            <Camera size={12} className="text-primary" />
            <span className="text-muted-foreground">Personalize your experience</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">
            Profile <span className="text-primary">Settings</span>
          </h1>
          
          <p className="text-base md:text-lg font-medium text-muted-foreground max-w-2xl leading-relaxed mx-auto md:mx-0">
            Manage your account details, upload a custom avatar, and update your display name across the platform.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-6 md:px-12 lg:px-20 pb-24 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 items-start">
          
          {/* Avatar Card */}
          <div className="group relative bg-card border rounded-[32px] p-10 text-center overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5">
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] bg-primary/10 opacity-50 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="relative w-32 h-32 rounded-[40px] object-cover border-2 border-border shadow-xl transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="relative w-32 h-32 rounded-[40px] flex items-center justify-center text-4xl font-black border-2 border-primary/20 bg-primary/10 text-primary shadow-xl"
                  >
                    {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center border-4 border-card shadow-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Camera size={20} />
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
              
              <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-1">Your Avatar</h3>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Click the camera to upload (Max 2MB)
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-card border rounded-[32px] p-8 md:p-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                  Email Address
                </label>
                <div className="px-5 py-4 rounded-[20px] bg-muted/30 border border-border/50 text-sm font-bold text-muted-foreground/80 cursor-not-allowed">
                  {user?.email}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                  Display Name
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-5 py-4 rounded-[20px] bg-muted/20 border border-border/50 text-sm font-bold text-foreground outline-none transition-all focus:border-primary/50 focus:bg-muted/30 focus:ring-4 focus:ring-primary/5 placeholder:text-muted-foreground/30"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border/30">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-3 w-full md:w-auto px-8 py-4 rounded-[20px] text-sm font-black uppercase tracking-widest bg-primary text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/10 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
