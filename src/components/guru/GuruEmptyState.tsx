import { ArrowUpRight, Bug, Gauge, Lightbulb, Sparkles } from "lucide-react";
import { GuruAvatar } from "@/components/brand/GuruMark";
import { cn } from "@/lib/utils";

const ICONS = [Bug, Lightbulb, Gauge, Sparkles, ArrowUpRight];

interface GuruEmptyStateProps {
  debugMode: boolean;
  suggestions: string[];
  onPick: (prompt: string) => void;
  contextAttached: boolean;
}

export function GuruEmptyState({
  debugMode,
  suggestions,
  onPick,
  contextAttached,
}: GuruEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-5 px-1 py-6 text-center">
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-full bg-guru-accent/25 blur-2xl"
        />
        <GuruAvatar size={64} ring mood="idle" className="animate-fade-in" title={null} />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-[17px] font-semibold tracking-tight text-guru-text">
          {debugMode ? "Let's debug this together" : "What are we working on?"}
        </h3>
        <p className="mx-auto max-w-[30ch] text-[12.5px] leading-relaxed text-guru-muted">
          {debugMode
            ? "Guru coaches you toward the fix — hints first, full solution when you ask for it."
            : "Algorithms, complexity, Java, SQL or interview prep. Paste code and ask away."}
        </p>
      </div>

      {debugMode && contextAttached && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-guru-success/25 bg-guru-success/[0.08] px-2.5 py-1 text-[11px] font-medium text-guru-success">
          <span className="h-1.5 w-1.5 rounded-full bg-guru-success" />
          Problem, code and last run attached
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-1.5">
        {suggestions.slice(0, 4).map((suggestion, index) => {
          const Icon = ICONS[index % ICONS.length];
          return (
            <button
              key={suggestion}
              type="button"
              onClick={() => onPick(suggestion)}
              className={cn(
                "group flex items-center gap-2.5 rounded-xl border border-guru-line/70 bg-guru-surface/40 px-3 py-2.5 text-left",
                "transition-[background-color,border-color,transform] duration-150",
                "hover:-translate-y-px hover:border-guru-accent/35 hover:bg-guru-surface",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guru-accent/60",
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-guru-accent/10 text-guru-accent">
                <Icon size={13} />
              </span>
              <span className="min-w-0 flex-1 text-[12.5px] font-medium leading-snug text-guru-text/90">
                {suggestion}
              </span>
              <ArrowUpRight
                size={13}
                className="shrink-0 text-guru-muted/50 transition-colors group-hover:text-guru-accent"
              />
            </button>
          );
        })}
      </div>

      <p className="text-[10.5px] leading-relaxed text-guru-muted/60">
        Guru can make mistakes — verify important code.
      </p>
    </div>
  );
}
