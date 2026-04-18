import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getAvatarUrl } from "@/lib/avatarUrl";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { LogOut, Settings, Shield, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null }>({ display_name: null, avatar_url: null });
  const [resolvedAvatar, setResolvedAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(async ({ data }) => {
        if (data) {
          setProfile(data);
          const url = await getAvatarUrl(data.avatar_url);
          setResolvedAvatar(url);
        }
      });
  }, [user]);

  if (!user) return null;

  const name = profile.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatar = resolvedAvatar;
  const initial = (name[0] || "U").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 p-1 rounded-xl transition-all duration-300 hover:bg-muted outline-none group"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {avatar ? (
              <img src={avatar} alt="" className="relative w-8 h-8 rounded-xl object-cover border border-border/50 shadow-sm" referrerPolicy="no-referrer" />
            ) : (
              <div
                className="relative w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black border border-primary/20 bg-primary/10 text-primary shadow-sm"
              >
                {initial}
              </div>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2 rounded-[24px] border border-border/50 shadow-2xl bg-card animate-in fade-in zoom-in-95 duration-200">
        <DropdownMenuLabel className="p-4 font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-black uppercase tracking-tight text-foreground">{name}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{user.email?.split('@')[0]}</p>
          </div>
        </DropdownMenuLabel>
        <div className="px-2 pb-2 space-y-1">
          <DropdownMenuItem onClick={() => navigate("/notes")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all focus:bg-muted group">
            <div className="p-1.5 rounded-lg bg-muted/50 group-focus:bg-primary/10 transition-colors">
              <FileText size={14} className="text-muted-foreground group-focus:text-primary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wide text-foreground">My Notes</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/profile")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all focus:bg-muted group">
            <div className="p-1.5 rounded-lg bg-muted/50 group-focus:bg-primary/10 transition-colors">
              <Settings size={14} className="text-muted-foreground group-focus:text-primary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wide text-foreground">Profile Settings</span>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => navigate("/admin")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all focus:bg-muted group">
              <div className="p-1.5 rounded-lg bg-muted/50 group-focus:bg-primary/10 transition-colors">
                <Shield size={14} className="text-muted-foreground group-focus:text-primary" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-foreground">Admin Dashboard</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="mx-2 my-2 bg-border/30" />
          <DropdownMenuItem onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all focus:bg-destructive/10 group">
            <div className="p-1.5 rounded-lg bg-muted/50 group-focus:bg-destructive/10 transition-colors">
              <LogOut size={14} className="text-muted-foreground group-focus:text-destructive" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wide text-destructive">Sign Out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
