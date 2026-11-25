"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  FileText,
  Keyboard,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NavIcon } from "@/components/layout/NavIcon";

const KEYBOARD_SHORTCUTS = [
  { label: "Global search", keys: ["⌘", "K"] },
  { label: "Ask Guru AI", keys: ["⌘", "J"] },
  { label: "Toggle topic sidebar", keys: ["Alt", "B"] },
  { label: "Close active menu / modal", keys: ["Esc"] },
] as const;

export interface UserMenuProps {
  onOpenLibrary?: () => void;
}

export function UserMenu({ onOpenLibrary }: UserMenuProps = {}) {
  const { user, profile, resolvedAvatar, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { theme, toggleTheme } = useSettings();
  const router = useRouter();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const isDark = theme === "dark";

  if (!user) {
    return (
      <Button
        type="button"
        size="sm"
        onClick={() => router.push("/auth")}
        className="h-9 rounded-lg px-3.5 text-[13px] font-medium tracking-[-0.01em] shadow-none"
      >
        <span>Sign in</span>
      </Button>
    );
  }

  const name =
    profile?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "User";
  const avatar = resolvedAvatar;
  const initial = (name[0] || "U").toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="bare"
            size="bare"
            type="button"
            aria-label="User account menu"
            className="group touch-manipulation inline-flex h-10 lg:h-9 items-center gap-1.5 rounded-lg border border-transparent px-1.5 text-muted-foreground [&_svg]:text-muted-foreground transition-colors duration-150 hover:border-obsidian-border hover:bg-foreground/[0.04] hover:text-foreground hover:[&_svg]:text-foreground data-[state=open]:border-obsidian-border data-[state=open]:bg-foreground/[0.06] data-[state=open]:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 select-none"
          >
            <Avatar className="h-7 w-7 ring-1 ring-obsidian-border">
              <AvatarImage src={avatar ?? undefined} alt="" referrerPolicy="no-referrer" />
              <AvatarFallback className="bg-foreground/[0.04] text-[11px] font-semibold text-foreground/85">
                {initial}
              </AvatarFallback>
            </Avatar>
            <NavIcon
              icon={ChevronDown}
              chip
              className="transition-transform duration-150 group-data-[state=open]:rotate-180"
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="w-64 rounded-xl border border-obsidian-border bg-obsidian-elevated/95 p-1.5 shadow-overlay backdrop-blur-xl"
        >
          <DropdownMenuLabel className="px-2.5 py-2 font-normal">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 shrink-0 ring-1 ring-obsidian-border">
                <AvatarImage src={avatar ?? undefined} alt="" referrerPolicy="no-referrer" />
                <AvatarFallback className="bg-foreground/[0.04] text-xs font-semibold text-foreground/85">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="truncate text-sm font-semibold leading-tight text-foreground">
                  {name}
                </p>
                <p className="truncate text-xs leading-tight text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-1 bg-obsidian-border" />

          <div className="space-y-0.5">
            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="touch-manipulation flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground/85 [&_svg]:text-muted-foreground focus:bg-foreground/[0.05] focus:text-foreground cursor-pointer transition-colors"
            >
              <NavIcon icon={User} chip />
              <span>Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="touch-manipulation flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground/85 [&_svg]:text-muted-foreground focus:bg-foreground/[0.05] focus:text-foreground cursor-pointer transition-colors"
            >
              <NavIcon icon={Settings} chip />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/notes")}
              className="touch-manipulation flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground/85 [&_svg]:text-muted-foreground focus:bg-foreground/[0.05] focus:text-foreground cursor-pointer transition-colors"
            >
              <NavIcon icon={FileText} chip />
              <span>My notes</span>
            </DropdownMenuItem>

            {onOpenLibrary && (
              <DropdownMenuItem
                onClick={onOpenLibrary}
                className="touch-manipulation flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground/85 [&_svg]:text-muted-foreground focus:bg-foreground/[0.05] focus:text-foreground cursor-pointer transition-colors"
              >
                <NavIcon icon={BookOpen} chip />
                <span>Learning library</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() => setShortcutsOpen(true)}
              className="touch-manipulation flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground/85 [&_svg]:text-muted-foreground focus:bg-foreground/[0.05] focus:text-foreground cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <NavIcon icon={Keyboard} chip />
                <span>Keyboard shortcuts</span>
              </span>
              <kbd className="rounded border border-obsidian-border bg-foreground/[0.03] px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                ?
              </kbd>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={toggleTheme}
              className="touch-manipulation flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground/85 [&_svg]:text-muted-foreground focus:bg-foreground/[0.05] focus:text-foreground cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <NavIcon icon={isDark ? Sun : Moon} chip />
                <span>Theme</span>
              </span>
              <span className="rounded border border-obsidian-border bg-foreground/[0.03] px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {isDark ? "Dark" : "Light"}
              </span>
            </DropdownMenuItem>

            {isAdmin && (
              <DropdownMenuItem
                onClick={() => router.push("/admin")}
                className="touch-manipulation flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground/85 [&_svg]:text-muted-foreground focus:bg-foreground/[0.05] focus:text-foreground cursor-pointer transition-colors"
              >
                <NavIcon icon={Shield} chip />
                <span>Admin dashboard</span>
              </DropdownMenuItem>
            )}
          </div>

          <DropdownMenuSeparator className="my-1 bg-obsidian-border" />

          <DropdownMenuItem
            onClick={signOut}
            className="touch-manipulation flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 dark:text-red-400 [&_svg]:text-red-500 dark:[&_svg]:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/40 focus:text-red-700 dark:focus:text-red-300 cursor-pointer transition-colors"
          >
            <NavIcon icon={LogOut} chip />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="sm:max-w-md rounded-xl border border-obsidian-border bg-obsidian-elevated">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Keyboard shortcuts
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Navigate AlgoGuru faster with keyboard commands.
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-obsidian-border">
            {KEYBOARD_SHORTCUTS.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2.5 text-sm text-foreground/85"
              >
                <span>{item.label}</span>
                <span className="flex items-center gap-1">
                  {item.keys.map((key) => (
                    <kbd
                      key={key}
                      className="min-w-[22px] rounded border border-obsidian-border bg-foreground/[0.04] px-1.5 py-0.5 text-center font-mono text-xs font-medium text-foreground/80 shadow-[0_1px_0_hsl(var(--obsidian-border))]"
                    >
                      {key}
                    </kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
