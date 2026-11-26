"use client";
import { Button } from "@/components/ui/button";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { BriefcaseBusiness, Code2, House, Menu, SquareTerminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavIcon } from "./NavIcon";

const ITEMS = [
  { label: "Home", path: "/", icon: House },
  { label: "Practice", path: "/practice", icon: Code2 },
  { label: "Code", path: "/playground", icon: SquareTerminal },
  { label: "Interview", path: "/interview", icon: BriefcaseBusiness },
] as const;

const isActive = (pathname: string, path: string) =>
  path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

interface MobileNavProps {
  onMore: () => void;
  /** Routes outside the four primary destinations light up the More item. */
  moreActive: boolean;
  /** Whether the mobile navigation drawer is currently open. */
  moreOpen?: boolean;
}

/**
 * Floating mobile dock. Scope is deliberately limited to the app shell; the
 * parent hides it on immersive editor/exam routes and when Guru is open.
 */
export function MobileNav({ onMore, moreActive, moreOpen = false }: MobileNavProps) {
  const pathname = usePathname() ?? "/";
  const reduceMotion = useReducedMotion();

  return (
    <motion.nav
      aria-label="Primary mobile navigation"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 16 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="ag-theme ag-mobile-dock mobile-dock pointer-events-auto fixed inset-x-3 z-40 mx-auto flex max-w-md items-stretch gap-0.5 rounded-2xl border p-1.5 lg:hidden"
    >
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.path);
        return (
          <Link
            key={item.path}
            href={item.path}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative touch-manipulation flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10.5px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 select-none",
              active
                ? "text-foreground [&_svg]:text-foreground"
                : "text-muted-foreground [&_svg]:text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={reduceMotion ? undefined : "mobile-nav-pill"}
                className="absolute inset-0 rounded-xl border border-obsidian-border bg-foreground/[0.07] shadow-[inset_0_1px_0_hsl(var(--obsidian-specular))]"
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
              >
                <span className="absolute inset-x-5 top-0 h-[2px] rounded-b-full bg-primary" />
              </motion.span>
            )}
            <NavIcon icon={item.icon} className="relative" />
            <span className="relative leading-none">{item.label}</span>
          </Link>
        );
      })}

      <Button
        variant="bare"
        size="bare"
        type="button"
        onClick={onMore}
        aria-label="Open more navigation"
        aria-expanded={moreOpen}
        aria-controls={moreOpen ? "header-navigation-menu" : undefined}
        className={cn(
          "relative touch-manipulation flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10.5px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 select-none",
          moreActive || moreOpen
            ? "text-foreground [&_svg]:text-foreground"
            : "text-muted-foreground [&_svg]:text-muted-foreground hover:text-foreground",
        )}
      >
        {(moreActive || moreOpen) && (
          <motion.span
            layoutId={reduceMotion ? undefined : "mobile-nav-pill"}
            className="absolute inset-0 rounded-xl border border-obsidian-border bg-foreground/[0.07] shadow-[inset_0_1px_0_hsl(var(--obsidian-specular))]"
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
          >
            <span className="absolute inset-x-5 top-0 h-[2px] rounded-b-full bg-primary" />
          </motion.span>
        )}
        <NavIcon icon={Menu} className="relative" />
        <span className="relative leading-none">More</span>
      </Button>
    </motion.nav>
  );
}
