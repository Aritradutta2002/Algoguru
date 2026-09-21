import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, profile, resolvedAvatar, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  if (!user) {
    return (
      <button
        onClick={() => navigate("/auth")}
        className="touch-manipulation flex items-center gap-1.5 h-8.5 px-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 text-xs font-semibold text-foreground hover:text-primary transition-all duration-200 shadow-2xs active:scale-95"
      >
        <span>Sign in</span>
      </button>
    );
  }

  const name = profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatar = resolvedAvatar;
  const initial = (name[0] || "U").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="touch-manipulation flex items-center gap-2 p-0.5 rounded-full transition-all outline-none group hover:ring-2 hover:ring-primary/25 active:scale-95"
          aria-label="User account menu"
        >
          {avatar ? (
            <img
              src={avatar}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-border/80 shadow-2xs group-hover:border-primary/40 transition-colors"
              style={{ aspectRatio: '1/1' }}
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-primary/25 bg-primary/10 text-primary shadow-2xs group-hover:border-primary/50 transition-colors">
              {initial}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-1.5 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-xl" sideOffset={8} collisionPadding={16}>
        <DropdownMenuLabel className="p-3 font-normal">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 bg-border/60" />
        <div className="space-y-0.5">
          <DropdownMenuItem onClick={() => navigate("/notes")} className="touch-manipulation flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer focus:bg-muted text-foreground transition-colors">
            <FileText size={15} className="text-muted-foreground" />
            <span className="text-sm">My notes</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/profile")} className="touch-manipulation flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer focus:bg-muted text-foreground transition-colors">
            <Settings size={15} className="text-muted-foreground" />
            <span className="text-sm">Profile settings</span>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => navigate("/admin")} className="touch-manipulation flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer focus:bg-muted text-foreground transition-colors">
              <Shield size={15} className="text-muted-foreground" />
              <span className="text-sm">Admin dashboard</span>
            </DropdownMenuItem>
          )}
        </div>
        <DropdownMenuSeparator className="my-1 bg-border/60" />
        <DropdownMenuItem onClick={signOut} className="touch-manipulation flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer focus:bg-destructive/10 text-destructive transition-colors">
          <LogOut size={15} className="text-destructive/80" />
          <span className="text-sm font-medium">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
