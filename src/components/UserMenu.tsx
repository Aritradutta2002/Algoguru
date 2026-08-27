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

  if (!user) return null;

  const name = profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatar = resolvedAvatar;
  const initial = (name[0] || "U").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="touch-manipulation flex items-center gap-2 p-0.5 rounded-full transition-colors hover:bg-muted outline-none group"
        >
          {avatar ? (
            <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-border" style={{ aspectRatio: '1/1' }} referrerPolicy="no-referrer" loading="lazy" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border border-primary/20 bg-primary/10 text-primary">
              {initial}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-1.5 rounded-xl border border-border bg-card shadow-xl" sideOffset={8} collisionPadding={16}>
        <DropdownMenuLabel className="p-3 font-normal">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 bg-border" />
        <div className="space-y-0.5">
          <DropdownMenuItem onClick={() => navigate("/notes")} className="touch-manipulation flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer focus:bg-muted">
            <FileText size={15} className="text-muted-foreground" />
            <span className="text-sm text-foreground">My notes</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/profile")} className="touch-manipulation flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer focus:bg-muted">
            <Settings size={15} className="text-muted-foreground" />
            <span className="text-sm text-foreground">Profile settings</span>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => navigate("/admin")} className="touch-manipulation flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer focus:bg-muted">
              <Shield size={15} className="text-muted-foreground" />
              <span className="text-sm text-foreground">Admin dashboard</span>
            </DropdownMenuItem>
          )}
        </div>
        <DropdownMenuSeparator className="my-1 bg-border" />
        <DropdownMenuItem onClick={signOut} className="touch-manipulation flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer focus:bg-destructive/10">
          <LogOut size={15} className="text-muted-foreground" />
          <span className="text-sm text-destructive">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
