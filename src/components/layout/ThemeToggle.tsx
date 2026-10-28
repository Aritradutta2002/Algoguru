import { Sun, Moon } from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useSettings();
  const isDark = theme === "dark";

  return (
    <AppTooltip content={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={cn(
          "group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          "border border-border/60 bg-muted/30 text-muted-foreground",
          "transition-all duration-200 ease-out",
          "hover:border-border hover:bg-muted/70 hover:text-foreground",
          "active:scale-95 touch-manipulation outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1",
          className
        )}
      >
        {isDark ? (
          <Sun
            size={17}
            className="text-amber-400 transition-transform duration-300 group-hover:rotate-45"
          />
        ) : (
          <Moon
            size={17}
            className="text-slate-600 transition-transform duration-300 group-hover:-rotate-12 dark:text-slate-300"
          />
        )}
      </button>
    </AppTooltip>
  );
}
