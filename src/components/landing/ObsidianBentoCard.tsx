import type { HTMLAttributes } from "react";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { cn } from "@/lib/utils";

type ObsidianBentoTone = "violet" | "emerald" | "neutral";

interface ObsidianBentoCardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: ObsidianBentoTone;
  interactive?: boolean;
}

const TONE_GLOW: Record<ObsidianBentoTone, string> = {
  violet: "bg-obsidian-accent/[0.12]",
  emerald: "bg-obsidian-success/10",
  neutral: "bg-white/[0.05]",
};

export function ObsidianBentoCard({
  tone = "violet",
  interactive = true,
  className,
  children,
  ...props
}: ObsidianBentoCardProps) {
  return (
    <SpotlightCard
      interactive={interactive}
      data-tone={tone}
      className={cn(
        "group relative h-full overflow-hidden rounded-3xl border border-obsidian-border bg-obsidian-pane/90 shadow-specular",
        "transition-[border-color,box-shadow,transform] duration-300 ease-premium hover:border-obsidian-accent/30 hover:shadow-[0_24px_70px_-36px_rgba(0,0,0,0.9)]",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]"
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-100",
          TONE_GLOW[tone],
        )}
      />
      {children}
    </SpotlightCard>
  );
}
