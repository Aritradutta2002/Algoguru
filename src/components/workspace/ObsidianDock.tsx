import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ObsidianDockId,
  ObsidianPaneId,
  ObsidianWindowState,
} from "./obsidianTypes";

export interface ObsidianDockItem {
  id: ObsidianDockId;
  label: string;
  icon: LucideIcon;
}

interface ObsidianDockProps {
  items: ObsidianDockItem[];
  activePane: ObsidianPaneId;
  windowState: ObsidianWindowState;
  vaultOpen?: boolean;
  onSelect: (id: ObsidianDockId) => void;
  className?: string;
}

export function ObsidianDock({
  items,
  activePane,
  windowState,
  vaultOpen = true,
  onSelect,
  className,
}: ObsidianDockProps) {
  return (
    <motion.div
      layout
      role="toolbar"
      aria-label="Obsidian workspace dock"
      className={cn(
        "relative flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-obsidian-border bg-obsidian-elevated/85 p-1.5 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl",
        "shadow-specular",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]"
      />
      {items.map(({ id, label, icon: Icon }) => {
        const isActive = id !== "vault" && windowState === "open" && activePane === id;
        const isVault = id === "vault";

        return (
          <motion.button
            key={id}
            type="button"
            data-dock-item={id}
            aria-label={`${label}${windowState === "open" ? "" : " — restore workspace"}`}
            aria-pressed={isVault ? vaultOpen : isActive}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(id)}
            className={cn(
              "group relative inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-[11.5px] font-semibold transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-obsidian-accent/50",
              isActive
                ? "border-obsidian-accent/35 bg-obsidian-accent/15 text-obsidian-accent"
                : "border-transparent text-muted-foreground hover:border-white/[0.08] hover:bg-white/[0.06] hover:text-foreground",
            )}
          >
            <Icon size={15} aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute inset-x-3 bottom-1 h-px rounded-full bg-obsidian-accent/70"
              />
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
