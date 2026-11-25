"use client";
import { Button } from "@/components/ui/button";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { hideOthers } from "aria-hidden";
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
  const surfaceRef = useRef<HTMLDivElement>(null);
  const maximizeButtonRef = useRef<HTMLButtonElement>(null);
  const isMaximizedRef = useRef(isMaximized);
  const wasMaximizedRef = useRef(false);
  const previousState = useRef(windowState);
  isMaximizedRef.current = isMaximized;

  const updateWindowState = (next: ObsidianWindowState) => {
    if (next !== "open") setIsMaximized(false);
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
    if (!isMaximized) return;
    const surface = surfaceRef.current;
    if (!surface) return;
    return hideOthers(surface);
  }, [isMaximized]);

  useEffect(() => {
    if (!isMaximized) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMaximized]);

  useEffect(() => {
    if (isMaximized) {
      headingRef.current?.focus();
      maximizeButtonRef.current?.focus();
    } else if (wasMaximizedRef.current) {
      maximizeButtonRef.current?.focus();
    }
    wasMaximizedRef.current = isMaximized;
  }, [isMaximized]);

  const handleMountAutoFocus = useCallback((event: Event) => {
    if (!isMaximizedRef.current) event.preventDefault();
  }, []);

  const handleUnmountAutoFocus = (event: Event) => {
    if (!dockRef.current) return;
    event.preventDefault();
    focusDock();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    event.stopPropagation();
    if (isMaximized) {
      setIsMaximized(false);
    } else {
      updateWindowState("minimized");
    }
  };

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
          <FocusScope
            asChild
            loop={isMaximized}
            trapped={isMaximized}
            onMountAutoFocus={handleMountAutoFocus}
            onUnmountAutoFocus={handleUnmountAutoFocus}
          >
            <motion.div
              ref={surfaceRef}
              layout={!reduceMotion}
              role={isMaximized ? "dialog" : "region"}
              aria-modal={isMaximized ? true : undefined}
              aria-labelledby={titleId}
              data-window-state={windowState}
              onKeyDown={handleKeyDown}
              initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 44, scale: 0.94 }
              }
              transition={WINDOW_SPRING}
              className={cn(
                "relative overflow-hidden rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane text-foreground",
                isMaximized &&
                  "fixed inset-3 z-40 max-h-[calc(100dvh-1.5rem)] overflow-y-auto sm:inset-6",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-border bg-obsidian-elevated px-3 py-2.5 sm:px-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="lp-dot" />
                    <span className="lp-dot" />
                    <span className="lp-dot" />
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
                  <span className="lp-chip lp-chip-success hidden sm:inline-flex">
                    <span className="h-1 w-1 rounded-full bg-current" aria-hidden="true" />
                    Live
                  </span>
                  <Button variant="bare" size="bare"
                    ref={maximizeButtonRef}
                    type="button"
                    onClick={() => setIsMaximized((value) => !value)}
                    aria-label={isMaximized ? "Restore window size" : "Maximize window"}
                    aria-pressed={isMaximized}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  </Button>
                  <Button variant="bare" size="bare"
                    type="button"
                    onClick={() => updateWindowState("minimized")}
                    aria-label="Minimize window to dock"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    <Minus size={13} />
                  </Button>
                  <Button variant="bare" size="bare"
                    type="button"
                    onClick={() => updateWindowState("closed")}
                    aria-label="Close window"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    <X size={13} />
                  </Button>
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
          </FocusScope>
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
