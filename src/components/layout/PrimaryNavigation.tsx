import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Code2, GraduationCap, Home, Map, Target, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { label: "Home", path: "/", icon: Home },
  { label: "Practice", path: "/practice", icon: Target },
  { label: "Playground", path: "/playground", icon: Code2 },
  { label: "Interview", path: "/interview", icon: GraduationCap },
  { label: "Contest", path: "/contest", icon: Trophy },
  { label: "Roadmap", path: "/roadmap", icon: Map },
];

export const isNavActive = (pathname: string, path: string) =>
  path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");

export function PrimaryNavigation({ pathname }: { pathname: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <nav aria-label="Primary" className="header-primary-nav">
      {NAV_LINKS.map(({ label, path }) => {
        const active = isNavActive(pathname, path);
        return (
          <Link key={path} to={path} aria-current={active ? "page" : undefined} className="header-nav-link">
            {active && (
              <motion.span layoutId={reduceMotion ? undefined : "primary-nav-pill"} className="header-nav-indicator" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
            )}
            <span className="relative">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavigationMenu({ pathname, onClose, onOpenLibrary }: {
  pathname: string;
  onClose: () => void;
  onOpenLibrary: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const trigger = document.getElementById("header-navigation-toggle");
    (ref.current?.querySelector<HTMLAnchorElement>('[aria-current="page"]') ?? ref.current?.querySelector<HTMLAnchorElement>("a"))?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        trigger?.focus();
      }
    };
    const handlePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target) && !trigger?.contains(event.target)) onClose();
    };
    const header = ref.current?.closest("header");
    const observer = new ResizeObserver(() => {
      if (ref.current && getComputedStyle(ref.current).display === "none") onClose();
    });
    if (header) observer.observe(header);
    document.addEventListener("keydown", handleKey);
    document.addEventListener("pointerdown", handlePointer);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("pointerdown", handlePointer);
    };
  }, [onClose]);

  return (
    <motion.nav ref={ref} id="header-navigation-menu" aria-label="Mobile primary" initial={reduceMotion ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="header-menu-sheet">
      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your workspace</p>
        <span className="text-xs text-muted-foreground">Learn. Practice. Grow.</span>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        {NAV_LINKS.map(({ label, path, icon: Icon }) => {
          const active = isNavActive(pathname, path);
          return (
            <Link key={path} to={path} onClick={onClose} aria-current={active ? "page" : undefined} className={cn("header-mobile-link", active && "header-mobile-link-active")}>
              <Icon size={18} aria-hidden="true" />{label}
            </Link>
          );
        })}
        <button type="button" onClick={() => { onClose(); onOpenLibrary(); }} className="header-mobile-link col-span-2">
          <BookOpen size={18} aria-hidden="true" />Browse learning library
        </button>
      </div>
    </motion.nav>
  );
}
