import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
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
}

/**
 * Floating mobile dock. Scope is deliberately limited to the app shell; the
 * parent hides it on immersive editor/exam routes and when Guru is open.
 */
export function MobileNav({ onMore, moreActive }: MobileNavProps) {
  const { pathname } = useLocation();

  return (
    <motion.nav
      aria-label="Primary mobile navigation"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="mobile-dock nav-glass pointer-events-auto fixed inset-x-3 z-40 mx-auto flex max-w-md items-stretch gap-0.5 rounded-2xl p-1.5 lg:hidden"
    >
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10.5px] font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
              active
                ? "text-slate-900 dark:text-slate-50 [&_svg]:text-blue-600 dark:[&_svg]:text-blue-400"
                : "text-slate-600 dark:text-slate-400 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
            )}
          >
            {active && (
              <motion.span
                layoutId="mobile-nav-pill"
                className="absolute inset-0 rounded-xl border border-blue-500/20 bg-blue-500/10"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <NavIcon icon={item.icon} className="relative" />
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onMore}
        aria-label="Open more navigation"
        className={cn(
          "relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10.5px] font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
          moreActive
            ? "text-slate-900 dark:text-slate-50 [&_svg]:text-blue-600 dark:[&_svg]:text-blue-400"
            : "text-slate-600 dark:text-slate-400 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
        )}
      >
        {moreActive && (
          <motion.span
            layoutId="mobile-nav-pill"
            className="absolute inset-0 rounded-xl border border-blue-500/20 bg-blue-500/10"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          />
        )}
        <NavIcon icon={Menu} className="relative" />
        <span className="relative">More</span>
      </button>
    </motion.nav>
  );
}
