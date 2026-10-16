import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Home,
  BookOpen,
  Code2,
  Terminal,
  Trophy,
  Briefcase,
  Map,
  FileText,
  User,
  Settings,
  Shield,
  LogOut,
  PanelLeftClose,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AlgoGuruLogo } from "@/components/AlgoGuruLogo";
import { AppTooltip } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface AppSidebarProps {
  onCollapse: () => void;
}

interface NavItem {
  label: string;
  icon: typeof Home;
  path: string;
  exact?: boolean;
}

export function AppSidebar({ onCollapse }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, resolvedAvatar, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();

  const currentPath = location.pathname;

  const mainNav: NavItem[] = [
    { label: "Home", icon: Home, path: "/", exact: true },
    { label: "Learn", icon: BookOpen, path: "/learn" },
    { label: "Practice", icon: Code2, path: "/practice" },
    { label: "Playground", icon: Terminal, path: "/playground" },
    { label: "Contests", icon: Trophy, path: "/contest" },
    { label: "Interview Prep", icon: Briefcase, path: "/interview" },
    { label: "Roadmaps", icon: Map, path: "/roadmap" },
  ];

  const secondaryNav: NavItem[] = [
    { label: "Notes", icon: FileText, path: "/notes" },
  ];

  const bottomNav: NavItem[] = [
    { label: "Profile", icon: User, path: "/profile" },
    { label: "Settings", icon: Settings, path: "/settings" },
    ...(isAdmin ? [{ label: "Admin", icon: Shield, path: "/admin" }] : []),
  ];

  const isItemActive = (item: NavItem) => {
    if (item.exact) return currentPath === item.path;
    return currentPath === item.path || currentPath.startsWith(`${item.path}/`);
  };

  const name =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Engineer";
  const avatar = resolvedAvatar;
  const initial = (name[0] || "U").toUpperCase();

  return (
    <aside
      className="flex h-full w-full flex-col border-r border-border bg-card select-none"
      aria-label="Main navigation"
    >
      {/* ─── Header: Brand + Fold Button ──────────────────────── */}
      <div className="flex h-[52px] items-center justify-between px-3 border-b border-border shrink-0">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted outline-hidden"
          aria-label="AlgoGuru home"
        >
          <AlgoGuruLogo size={24} showText={true} />
        </Link>
        <AppTooltip content="Collapse sidebar (Alt+B)" side="right">
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <PanelLeftClose size={14} />
          </button>
        </AppTooltip>
      </div>

      {/* ─── Search Button Trigger (⌘K) ───────────────────────── */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            const trigger = document.querySelector<HTMLButtonElement>('[data-search-trigger="true"]');
            trigger?.click();
          }}
          className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-2">
            <Search size={13} className="text-muted-foreground/80" />
            <span>Search…</span>
          </span>
          <kbd className="inline-flex h-4 items-center rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ─── Navigation Scroll Area ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-4">
        {/* Main Workspace Navigation */}
        <div className="space-y-0.5">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-xs font-medium transition-colors text-left",
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1 bottom-1 w-[2.5px] rounded-r-sm bg-primary"
                  />
                )}
                <Icon size={16} className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-2 h-px bg-border/60" />

        {/* Secondary: Notes */}
        <div className="space-y-0.5">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-xs font-medium transition-colors text-left",
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1 bottom-1 w-[2.5px] rounded-r-sm bg-primary"
                  />
                )}
                <Icon size={16} className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-2 h-px bg-border/60" />

        {/* System: Profile, Settings, Admin */}
        <div className="space-y-0.5">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-xs font-medium transition-colors text-left",
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1 bottom-1 w-[2.5px] rounded-r-sm bg-primary"
                  />
                )}
                <Icon size={16} className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Footer: User Account & Sign Out ──────────────────── */}
      {user && (
        <div className="border-t border-border p-2 shrink-0">
          <div className="flex items-center justify-between gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted/50">
            <Link to="/profile" className="flex items-center gap-2.5 min-w-0 flex-1 outline-hidden">
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover border border-border shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </Link>
            <AppTooltip content="Sign out" side="top">
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
              >
                <LogOut size={14} />
              </button>
            </AppTooltip>
          </div>
        </div>
      )}
    </aside>
  );
}
