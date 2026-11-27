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
    <div className="flex flex-col items-center gap-5 px-1 py-6 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span aria-hidden="true" className="guru-empty-stage absolute inset-0 rounded-full" />
        <span
          aria-hidden="true"
          className="absolute inset-3 -z-10 rounded-full bg-guru-accent/20 blur-2xl"
        />
        <GuruAvatar
          size={72}
          ring
          mood="idle"
          className="relative animate-fade-in"
          title={null}
        />
      </div>

      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-guru-line bg-guru-surface/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-guru-muted">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-guru-success" />
          AI study partner
        </span>
        <h3 className="font-display text-[19px] font-semibold tracking-tight text-guru-text">
          {debugMode ? "Let's debug this together" : "What are we working on?"}
        </h3>
        <p className="mx-auto max-w-[32ch] text-[12.5px] leading-relaxed text-guru-muted">
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

      <div className="w-full space-y-2 text-left">
        <p className="px-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-guru-muted/80">
          Try asking
        </p>
        <div className="grid w-full grid-cols-1 gap-1.5">
          {suggestions.slice(0, 4).map((suggestion, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <Button variant="bare" size="bare"
                key={suggestion}
                type="button"
                onClick={() => onPick(suggestion)}
                className={cn(
                  "group flex min-h-[48px] items-center gap-2.5 rounded-xl border border-guru-line/80 bg-guru-surface/60 px-3 py-2.5 text-left",
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

      <p className="text-[10.5px] leading-relaxed text-guru-muted/60">
        Guru can make mistakes — verify important code.
      </p>
    </div>
  );
}
