import React from "react";
import { cn } from "@/lib/utils";

export interface CandyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: "primary" | "accent";
}

export const CandyButton = React.forwardRef<HTMLButtonElement, CandyButtonProps>(
  ({ className, children = "Get Started", type = "button", variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "candy-btn-highlight group relative inline-flex min-h-[46px] items-center justify-center gap-2.5 rounded-xl px-7 py-3.5",
          "font-display text-[15px] font-bold text-white tracking-[-0.01em]",
          "border border-[#54A1FD]/80 cursor-pointer select-none",
          "transition-all duration-200 ease-out",
          "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(37,99,235,0.45)]",
          "active:scale-[0.98] active:translate-y-0",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "after:pointer-events-none after:absolute after:top-[1px] after:right-[12%] after:w-[65%] after:h-[1px]",
          "after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "accent" && "bg-gradient-to-b from-indigo-500 to-indigo-700 border-indigo-400",
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2.5 font-bold">
          {children}
        </span>
      </button>
    );
  }
);

CandyButton.displayName = "CandyButton";

export default CandyButton;
