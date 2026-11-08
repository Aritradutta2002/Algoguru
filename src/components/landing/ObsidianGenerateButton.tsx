import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { cn } from "@/lib/utils";

interface ObsidianGenerateButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

/**
 * Local equivalent of the Vengeance generate-button.
 *
 * The registry version tracks focus in React state and hardcodes its label.
 * This version keeps the specular glow and sparkle motion while preserving the
 * existing button contract and the zero-state pointer behavior of MagneticButton.
 */
export function ObsidianGenerateButton({
  className,
  children,
  ...props
}: ObsidianGenerateButtonProps) {
  return (
    <MagneticButton
      className={cn(
        "landing-primary obsidian-generate-button button-shine group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-xl px-6 py-4 text-[15px] font-bold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-obsidian-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-void active:translate-y-0 active:scale-[0.99]",
        className,
      )}
      {...props}
    >
      <Sparkles
        size={16}
        className="obsidian-generate-spark relative z-10 shrink-0"
        aria-hidden="true"
      />
      <span className="relative z-10">{children}</span>
    </MagneticButton>
  );
}
