import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Plus, Settings, User, Users, Building2, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";
import { cn } from "@/lib/utils";

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

  const IconComponent = WORKSPACE_ICONS[activeWorkspace.type];

  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-workspace-switcher="true"
            aria-label={`Current workspace: AlgoGuru ${activeWorkspace.name}. Click to switch workspace`}
            className={cn(
              "group relative flex items-center gap-2 rounded-xl px-2 py-1.5 text-left outline-none",
              "transition-all duration-200 ease-out",
              "hover:bg-muted/60 active:scale-[0.98]",
              "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1",
              "touch-manipulation select-none"
            )}
          >
            {/* Logo Mark */}
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm shadow-primary/20 transition-transform duration-200 group-hover:scale-105">
              <AlgoGuruMark size={28} className="rounded-lg shrink-0" />
            </div>

            {/* Brand + Workspace Lockup (AlgoGuru ▼) */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex flex-col">
                <span className="font-display text-[15px] font-bold tracking-tight text-foreground leading-tight flex items-center gap-1">
                  Algo<span className="text-primary">Guru</span>
                </span>
                {!compact && (
                  <span className="hidden sm:block text-[10.5px] font-medium text-muted-foreground/80 leading-tight truncate">
                    {activeWorkspace.name}
                  </span>
                )}
              </div>

              {/* Dropdown Chevron ▼ */}
              <ChevronDown
                size={14}
                aria-hidden="true"
                className="text-muted-foreground/70 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0 ml-0.5"
              />
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-72 rounded-2xl border border-border/80 bg-card/95 p-1.5 shadow-xl backdrop-blur-xl"
        >
          <div className="px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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
                    "flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-colors",
                    isSelected ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                        isSelected
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border/60 bg-muted/40 text-muted-foreground"
                      )}
                    >
                      <ItemIcon size={14} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-medium text-foreground truncate">
                        {workspace.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground/80 truncate">
                        {workspace.plan}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check size={14} className="text-primary shrink-0 ml-2" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator className="my-1.5 bg-border/60" />

          <DropdownMenuItem
            onClick={() => undefined}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <Plus size={14} />
            <span>Create new workspace</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => undefined}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <Settings size={14} />
            <span>Workspace settings</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
