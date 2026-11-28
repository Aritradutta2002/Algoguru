"use client";
import { Button } from "@/components/ui/button";

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
    <div className="guru-welcome mx-auto flex w-full max-w-[560px] flex-col gap-5 py-4">
      <div className="guru-welcome-hero relative isolate overflow-hidden rounded-3xl border border-guru-line px-5 pb-5 pt-4">
        <span aria-hidden="true" className="guru-empty-stage absolute right-0 top-0 -z-10 h-32 w-40" />
        <GuruAvatar size={76} mood="happy" title={null} />
        <h3 className="mt-3 max-w-[18ch] font-display text-[clamp(1.45rem,6cqi,2.15rem)] font-semibold leading-[1.08] tracking-tight text-guru-text">
          {debugMode ? "Let's debug this together" : "What are we working on?"}
        </h3>
        <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-guru-muted">
          {debugMode
            ? "Guru coaches you toward the fix — hints first, full solution when you ask for it."
            : "Bring a question, paste some code, or pick a starting point below."}
        </p>
      </div>

      {debugMode && contextAttached && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-guru-success/25 bg-guru-success/[0.08] px-2.5 py-1 text-[11px] font-medium text-guru-success">
          <span className="h-1.5 w-1.5 rounded-full bg-guru-success" />
          Problem, code and last run attached
        </div>
      )}

      <div className="w-full space-y-2 text-left">
        <p className="px-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-guru-muted">
          Try asking
        </p>
        <div className="guru-prompts grid w-full gap-2">
          {suggestions.slice(0, 4).map((suggestion, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <Button variant="bare" size="bare"
                key={suggestion}
                type="button"
                onClick={() => onPick(suggestion)}
                className={cn(
                  "group flex min-h-[52px] whitespace-normal items-center gap-2.5 rounded-xl border border-guru-line/80 bg-guru-surface/60 px-3 py-2.5 text-left",
                  "transition-[background-color,border-color,transform,box-shadow] duration-150",
                  "hover:-translate-y-px hover:border-guru-accent/35 hover:bg-guru-surface hover:shadow-[0_4px_14px_-10px_hsl(var(--guru-accent)/0.6)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guru-accent/60",
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-guru-accent/10 text-guru-accent transition-colors group-hover:bg-guru-accent/15">
                  <Icon size={14} />
                </span>
                <span className="min-w-0 flex-1 text-[12.5px] font-medium leading-snug text-guru-text/90">
                  {suggestion}
                </span>
                <ArrowUpRight
                  size={13}
                  className="shrink-0 text-guru-muted/50 transition-colors group-hover:text-guru-accent"
                />
              </Button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-guru-muted">
        Guru can make mistakes — verify important code.
      </p>
    </div>
  );
}
