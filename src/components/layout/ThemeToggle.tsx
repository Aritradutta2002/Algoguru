import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { NavIcon } from "./NavIcon";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useSettings();
  const reduceMotion = useReducedMotion();
  const isDark = theme === "dark";

  return (
    <AppTooltip content={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={cn(
          "group relative inline-flex h-11 w-11 lg:h-9 lg:w-9 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent",
          "text-slate-500 dark:text-slate-400 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400",
          "transition-colors duration-150 ease-out",
          "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:[&_svg]:text-slate-900 dark:hover:[&_svg]:text-slate-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
          "touch-manipulation select-none",
          className,
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "sun" : "moon"}
            initial={reduceMotion ? false : { rotate: -45, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { rotate: 45, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="inline-flex items-center justify-center"
          >
            <NavIcon icon={isDark ? Sun : Moon} />
          </motion.span>
        </AnimatePresence>
      </button>
    </AppTooltip>
  );
}
