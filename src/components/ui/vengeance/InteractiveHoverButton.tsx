import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InteractiveHoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export const InteractiveHoverButton = React.forwardRef<HTMLButtonElement, InteractiveHoverButtonProps>(
  ({ children, icon, className, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "group relative inline-flex min-h-[46px] items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-card/80 px-6 py-3.5 text-center font-display text-[15px] font-semibold text-foreground shadow-soft transition-all duration-300 ease-out",
          "hover:border-primary/50 hover:bg-card hover:shadow-card active:scale-[0.98] active:translate-y-0.5",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2.5 transition-transform duration-300 ease-out group-hover:translate-x-1">
          <span>{children}</span>
          {icon ?? (
            <ArrowRight
              size={16}
              className="text-primary transition-transform duration-300 ease-out group-hover:translate-x-1"
              aria-hidden="true"
            />
          )}
        </div>
      </button>
    );
  }
);

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export default InteractiveHoverButton;
