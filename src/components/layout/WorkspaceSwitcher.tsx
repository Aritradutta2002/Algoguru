import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Check,
  ChevronDown,
  Plus,
  Settings,
  User,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";
import { cn } from "@/lib/utils";
import { NavIcon } from "./NavIcon";

export type WorkspaceType = "personal" | "team" | "enterprise";

export interface WorkspaceItem {
  id: string;
  name: string;
  type: WorkspaceType;
  badge: string;
  plan: string;
  role: string;
}

export const WORKSPACES: WorkspaceItem[] = [
  {
    id: "personal",
    name: "Personal",
    type: "personal",
    badge: "Free",
    plan: "Free Developer Plan",
    role: "Owner",
  },
  {
    id: "team",
    name: "Team",
    type: "team",
    badge: "Pro",
    plan: "Team Workspace • 12 seats",
    role: "Admin",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    type: "enterprise",
    badge: "SSO",
    plan: "Enterprise Workspace • Dedicated",
    role: "Member",
  },
];

const WORKSPACE_ICONS = {
  personal: User,
  team: Users,
  enterprise: Building2,
};

interface WorkspaceSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function WorkspaceSwitcher({ className, compact = false }: WorkspaceSwitcherProps) {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    try {
      return localStorage.getItem("algoguru_active_workspace") || "personal";
    } catch {
      return "personal";
    }
  });

  const activeWorkspace =
    WORKSPACES.find((w) => w.id === activeWorkspaceId) || WORKSPACES[0];

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    try {
      localStorage.setItem("algoguru_active_workspace", id);
    } catch {
      // storage unavailable
    }
  };

  return (
    <div className={cn("flex items-center gap-2 shrink-0", className)}>
      {/* Brand Lockup: Algo Guru */}
      <Link
        to="/"
        aria-label="AlgoGuru Home"
        className="group inline-flex h-9 items-center gap-2 rounded-lg px-1.5 text-slate-900 dark:text-slate-100 transition-colors duration-150 hover:text-slate-950 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 select-none"
      >
        <AlgoGuruMark size={24} title={null} className="rounded-md shrink-0" />
        <span className="font-display text-[15px] font-semibold tracking-tight leading-none flex items-center gap-1">
          <span>Algo</span>
          <span>Guru</span>
        </span>
      </Link>

      {/* Slash Divider */}
      {!compact && (
        <span
          aria-hidden="true"
          className="text-slate-300 dark:text-slate-700 text-sm font-normal select-none"
        >
          /
        </span>
      )}

      {/* Workspace Switcher Chip */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-workspace-switcher="true"
            aria-label={`Current workspace: AlgoGuru ${activeWorkspace.name}. Click to switch workspace`}
            className={cn(
              "group inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400",
              "transition-colors duration-150 ease-out",
              "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:[&_svg]:text-slate-900 dark:hover:[&_svg]:text-slate-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
              "touch-manipulation select-none",
            )}
          >
            {!compact && (
              <span className="truncate max-w-[96px] leading-none">
                {activeWorkspace.name}
              </span>
            )}
            <NavIcon
              icon={ChevronDown}
              chip
              className="transition-transform duration-150 group-data-[state=open]:rotate-180"
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 p-1.5 shadow-xl backdrop-blur-md"
        >
          <div className="px-2.5 py-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              Workspaces
            </p>
          </div>

          <div className="space-y-0.5">
            {WORKSPACES.map((workspace) => {
              const ItemIcon = WORKSPACE_ICONS[workspace.type];
              const isSelected = workspace.id === activeWorkspace.id;

              return (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleSelectWorkspace(workspace.id)}
                  onSelect={() => handleSelectWorkspace(workspace.id)}
                  className={cn(
                    "flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors",
                    isSelected
                      ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 [&_svg]:text-blue-600 dark:[&_svg]:text-blue-400"
                      : "text-slate-600 dark:text-slate-400 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-900/70 hover:text-slate-900 dark:hover:text-slate-100",
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                        isSelected
                          ? "border-blue-500/30 bg-blue-50/80 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400",
                      )}
                    >
                      <NavIcon icon={ItemIcon} chip />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {workspace.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {workspace.plan}
                      </span>
                    </div>
                  </div>

                  {isSelected && <NavIcon icon={Check} chip className="ml-2" />}
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator className="my-1.5 bg-slate-200 dark:bg-slate-800" />

          <DropdownMenuItem
            onClick={() => undefined}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-colors"
          >
            <NavIcon icon={Plus} chip />
            <span>Create new workspace</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => undefined}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-colors"
          >
            <NavIcon icon={Settings} chip />
            <span>Workspace settings</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
