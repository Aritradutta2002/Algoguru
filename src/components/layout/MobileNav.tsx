import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Code2, GraduationCap, Home, Menu, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Home", path: "/", icon: Home },
  { label: "Practice", path: "/practice", icon: Target },
  { label: "Code", path: "/playground", icon: Code2 },
  { label: "Interview", path: "/interview", icon: GraduationCap },
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
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10.5px] font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="mobile-nav-pill"
                className="absolute inset-0 rounded-xl border border-primary/20 bg-primary/10"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon
              size={19}
              strokeWidth={active ? 2.2 : 1.9}
              className="relative"
              aria-hidden="true"
            />
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onMore}
        aria-label="Open more navigation"
        className={cn(
          "relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10.5px] font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          moreActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {moreActive && (
          <motion.span
            layoutId="mobile-nav-pill"
            className="absolute inset-0 rounded-xl border border-primary/20 bg-primary/10"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          />
        )}
        <Menu size={19} strokeWidth={moreActive ? 2.2 : 1.9} className="relative" aria-hidden="true" />
        <span className="relative">More</span>
      </button>
    </motion.nav>
  );
}
