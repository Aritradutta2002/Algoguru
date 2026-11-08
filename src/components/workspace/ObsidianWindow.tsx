import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Code2,
  FileText,
  FlaskConical,
  FolderTree,
  Maximize2,
  Minimize2,
  Minus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ObsidianDock, type ObsidianDockItem } from "./ObsidianDock";
import type {
  ObsidianDockId,
  ObsidianPaneId,
  ObsidianWindowState,
} from "./obsidianTypes";

const WINDOW_SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 28,
  mass: 0.9,
};

const DEFAULT_DOCK_ITEMS: ObsidianDockItem[] = [
  { id: "problem", label: "Problem", icon: FileText },
  { id: "solution", label: "Solution", icon: Code2 },
  { id: "tests", label: "Tests", icon: FlaskConical },
  { id: "vault", label: "Vault", icon: FolderTree },
];

interface ObsidianWindowProps {
  activePane: ObsidianPaneId;
  onPaneChange: (pane: ObsidianPaneId) => void;
  children: ReactNode;
  vault?: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  dockItems?: ObsidianDockItem[];
  initialState?: ObsidianWindowState;
  onStateChange?: (state: ObsidianWindowState) => void;
}

export function ObsidianWindow({
  activePane,
  onPaneChange,
  children,
  vault,
  title = "algoguru / workspace",
  subtitle = "Obsidian session",
  className,
  dockItems = DEFAULT_DOCK_ITEMS,
  initialState = "open",
  onStateChange,
}: ObsidianWindowProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const [windowState, setWindowState] = useState<ObsidianWindowState>(initialState);
  const [isMaximized, setIsMaximized] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(Boolean(vault));
  const dockRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousState = useRef(windowState);

  const updateWindowState = (next: ObsidianWindowState) => {
    setWindowState(next);
    onStateChange?.(next);
  };

  const focusDock = () => {
    requestAnimationFrame(() => {
      dockRef.current
        ?.querySelector<HTMLButtonElement>('[data-dock-item="problem"]')
        ?.focus();
    });
  };

  useEffect(() => {
    if (previousState.current === windowState) return;
    if (windowState === "open") {
      requestAnimationFrame(() => headingRef.current?.focus());
    } else {
      focusDock();
    }
    previousState.current = windowState;
  }, [windowState]);

  useEffect(() => {
    if (windowState !== "open") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (isMaximized) {
        setIsMaximized(false);
      } else {
        updateWindowState("minimized");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized, windowState]);

  const handleDockSelect = (id: ObsidianDockId) => {
    if (id === "vault") {
      setVaultOpen((open) => !open);
      if (windowState !== "open") updateWindowState("open");
      return;
    }

    if (windowState === "open" && activePane === id) {
      updateWindowState("minimized");
      return;
    }

    if (windowState !== "open") updateWindowState("open");
    onPaneChange(id);
  };

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {windowState === "open" && (
          <motion.div
            layout={!reduceMotion}
            role="region"
            aria-labelledby={titleId}
            data-window-state={windowState}
            initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 44, scale: 0.94 }
            }
            transition={WINDOW_SPRING}
            className={cn(
              "relative overflow-hidden rounded-[1.6rem] border border-obsidian-border bg-obsidian-pane text-foreground shadow-[0_36px_100px_-48px_rgba(0,0,0,0.95)] shadow-specular",
              isMaximized &&
                "fixed inset-3 z-40 max-h-[calc(100dvh-1.5rem)] overflow-y-auto sm:inset-6",
            )}
          >
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]" />

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-border bg-obsidian-elevated px-3 py-2.5 sm:px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-rose-400/80 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.22)]" />
                  <span className="h-2 w-2 rounded-full bg-amber-400/80 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.22)]" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.22)]" />
                </div>
                <div className="min-w-0">
                  <h3
                    id={titleId}
                    ref={headingRef}
                    tabIndex={-1}
                    className="truncate font-mono text-[11px] font-semibold tracking-tight text-foreground/90 focus:outline-none"
                  >
                    {title}
                  </h3>
                  <p className="truncate text-[9.5px] text-muted-foreground">{subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="hidden items-center gap-1.5 rounded-full border border-obsidian-success/25 bg-obsidian-success/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-obsidian-success sm:inline-flex">
                  <span className="h-1 w-1 rounded-full bg-obsidian-success" aria-hidden="true" />
                  Live
                </span>
                <button
                  type="button"
                  onClick={() => setIsMaximized((value) => !value)}
                  aria-label={isMaximized ? "Restore window size" : "Maximize window"}
                  aria-pressed={isMaximized}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-obsidian-accent/50"
                >
                  {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => updateWindowState("minimized")}
                  aria-label="Minimize window to dock"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-obsidian-accent/50"
                >
                  <Minus size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => updateWindowState("closed")}
                  aria-label="Close window"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-rose-500/15 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-obsidian-accent/50"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            <div
              className={cn(
                "grid min-h-0",
                vaultOpen && vault
                  ? "lg:grid-cols-[220px_minmax(0,1fr)]"
                  : "grid-cols-1",
              )}
            >
              {vaultOpen && vault && (
                <div className="max-h-56 overflow-hidden lg:max-h-none">{vault}</div>
              )}
              <div className="min-w-0">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={dockRef} className="mt-4 flex flex-col items-center gap-2">
        {windowState !== "open" && (
          <p
            role="status"
            aria-live="polite"
            className="text-[10.5px] font-medium text-muted-foreground"
          >
            {windowState === "minimized"
              ? "Workspace minimized to dock"
              : "Workspace closed — use the dock to restore"}
          </p>
        )}
        <ObsidianDock
          items={dockItems}
          activePane={activePane}
          windowState={windowState}
          vaultOpen={vaultOpen}
          onSelect={handleDockSelect}
        />
      </div>
    </div>
  );
}
