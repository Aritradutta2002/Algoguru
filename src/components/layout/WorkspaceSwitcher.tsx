"use client";
import { Button } from "@/components/ui/button";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { SurfaceLockup } from "@/components/brand/SurfaceLockup";
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
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("personal");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("algoguru_active_workspace");
      if (saved) setActiveWorkspaceId(saved);
    } catch {
      // storage unavailable
    }
  }, []);

  const activeWorkspace =
    WORKSPACES.find((w) => w.id === activeWorkspaceId) || WORKSPACES[0];
  const ActiveIcon = WORKSPACE_ICONS[activeWorkspace.type];

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    try {
      localStorage.setItem("algoguru_active_workspace", id);
    } catch {
      // storage unavailable
    }
  };

  return (
    <div className={cn("flex items-center gap-1.5 sm:gap-2 shrink-0", className)}>
      {/* Brand Lockup: Algo Guru */}
      <Link
        href="/"
        aria-label="AlgoGuru Home"
        className="group inline-flex h-9 items-center gap-2 rounded-lg px-1.5 text-foreground transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-void select-none"
      >
        <SurfaceLockup />
      </Link>

      {/* Crisp Diagonal Slash Divider */}
      {!compact && (
        <svg
          aria-hidden="true"
          viewBox="0 0 12 20"
          className="h-4 w-3 shrink-0 text-muted-foreground/35 select-none"
          fill="none"
        >
          <path
            d="M9 2L3 18"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Workspace Switcher Chip */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="bare"
            size="bare"
            type="button"
            data-workspace-switcher="true"
            aria-label={`Current workspace: AlgoGuru ${activeWorkspace.name}. Click to switch workspace`}
            className={cn(
              "group inline-flex h-8 items-center gap-1.5 rounded-lg border border-transparent px-2 text-[13px] font-medium text-muted-foreground [&_svg]:text-muted-foreground",
              "transition-colors duration-150 ease-out",
              "hover:border-obsidian-border hover:bg-foreground/[0.04] hover:text-foreground hover:[&_svg]:text-foreground",
              "data-[state=open]:border-obsidian-border data-[state=open]:bg-foreground/[0.05] data-[state=open]:text-foreground data-[state=open]:[&_svg]:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
              "touch-manipulation select-none",
            )}
          >
            <NavIcon icon={ActiveIcon} size={16} className="opacity-75 group-hover:opacity-100" />
            {!compact && (
              <>
                <span className="truncate max-w-[96px] leading-none text-foreground/90">
                  {activeWorkspace.name}
                </span>
                <span className="hidden lg:inline-flex items-center rounded border border-obsidian-border bg-foreground/[0.03] px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-muted-foreground">
                  {activeWorkspace.badge}
                </span>
              </>
            )}
            <NavIcon
              icon={ChevronDown}
              chip
              className="transition-transform duration-150 group-data-[state=open]:rotate-180"
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-72 rounded-xl border border-obsidian-border bg-obsidian-elevated/95 p-1.5 shadow-overlay backdrop-blur-xl"
        >
          <div className="flex items-center justify-between px-2.5 py-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Workspaces
            </p>
            <span className="text-[11px] text-muted-foreground/75">
              {activeWorkspace.role}
            </span>
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
                      ? "bg-foreground/[0.06] text-foreground [&_svg]:text-foreground"
                      : "text-muted-foreground [&_svg]:text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                        isSelected
                          ? "border-primary/35 bg-primary/10 text-primary"
                          : "border-obsidian-border bg-foreground/[0.03] text-muted-foreground",
                      )}
                    >
                      <NavIcon icon={ItemIcon} chip />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground truncate">
                          {workspace.name}
                        </span>
                        <span className="inline-flex items-center rounded border border-obsidian-border bg-foreground/[0.03] px-1.5 py-px font-mono text-[10px] font-medium leading-tight text-muted-foreground">
                          {workspace.badge}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {workspace.plan}
                      </span>
                    </div>
                  </div>

                  {isSelected && <NavIcon icon={Check} chip className="ml-2 text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator className="my-1.5 bg-obsidian-border" />

          <DropdownMenuItem
            onClick={() => undefined}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground [&_svg]:text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <NavIcon icon={Plus} chip />
            <span>Create new workspace</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => undefined}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground [&_svg]:text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <NavIcon icon={Settings} chip />
            <span>Workspace settings</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
