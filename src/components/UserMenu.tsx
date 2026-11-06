import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const isDark = theme === "dark";

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => navigate("/auth")}
        className="touch-manipulation inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3.5 text-sm font-medium text-white shadow-2xs transition-colors duration-150 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        <span>Sign in</span>
      </button>
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
          <button
            type="button"
            aria-label="User account menu"
            className="group touch-manipulation inline-flex h-11 lg:h-9 items-center gap-1.5 rounded-lg px-1.5 text-slate-600 dark:text-slate-400 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 transition-colors duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:[&_svg]:text-slate-900 dark:hover:[&_svg]:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 select-none"
          >
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                style={{ aspectRatio: "1/1" }}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700">
                {initial}
              </div>
            )}
            <NavIcon
              icon={ChevronDown}
              chip
              className="transition-transform duration-150 group-data-[state=open]:rotate-180"
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 p-1.5 shadow-xl backdrop-blur-md"
        >
          <DropdownMenuLabel className="px-2.5 py-2 font-normal">
            <div className="flex flex-col gap-0.5">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {name}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-1 bg-slate-200 dark:bg-slate-800" />

          <div className="space-y-0.5">
            <DropdownMenuItem
              onClick={() => navigate("/profile")}
              className="touch-manipulation flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 dark:text-slate-200 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 focus:bg-slate-100 dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer transition-colors"
            >
              <NavIcon icon={User} chip />
              <span>Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigate("/profile")}
              className="touch-manipulation flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 dark:text-slate-200 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 focus:bg-slate-100 dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer transition-colors"
            >
              <NavIcon icon={Settings} chip />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigate("/notes")}
              className="touch-manipulation flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 dark:text-slate-200 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 focus:bg-slate-100 dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer transition-colors"
            >
              <NavIcon icon={FileText} chip />
              <span>My notes</span>
            </DropdownMenuItem>

            {onOpenLibrary && (
              <DropdownMenuItem
                onClick={onOpenLibrary}
                className="touch-manipulation flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 dark:text-slate-200 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 focus:bg-slate-100 dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer transition-colors"
              >
                <NavIcon icon={BookOpen} chip />
                <span>Learning library</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() => setShortcutsOpen(true)}
              className="touch-manipulation flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 dark:text-slate-200 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 focus:bg-slate-100 dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <NavIcon icon={Keyboard} chip />
                <span>Keyboard shortcuts</span>
              </span>
              <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400">
                ?
              </kbd>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={toggleTheme}
              className="touch-manipulation flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 dark:text-slate-200 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 focus:bg-slate-100 dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <NavIcon icon={isDark ? Sun : Moon} chip />
                <span>Theme</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isDark ? "Dark" : "Light"}
              </span>
            </DropdownMenuItem>

            {isAdmin && (
              <DropdownMenuItem
                onClick={() => navigate("/admin")}
                className="touch-manipulation flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 dark:text-slate-200 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 focus:bg-slate-100 dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer transition-colors"
              >
                <NavIcon icon={Shield} chip />
                <span>Admin dashboard</span>
              </DropdownMenuItem>
            )}
          </div>

          <DropdownMenuSeparator className="my-1 bg-slate-200 dark:bg-slate-800" />

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
        <DialogContent className="sm:max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Keyboard shortcuts
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Navigate AlgoGuru faster with keyboard commands.
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
            {KEYBOARD_SHORTCUTS.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2.5 text-sm text-slate-700 dark:text-slate-300"
              >
                <span>{item.label}</span>
                <span className="flex items-center gap-1">
                  {item.keys.map((key) => (
                    <kbd
                      key={key}
                      className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 font-mono text-xs font-medium text-slate-600 dark:text-slate-300"
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
