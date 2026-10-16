/**
 * Shared page-level primitives.
 *
 * These encode the visual language used by the home page (`src/pages/Index.tsx`)
 * so every route in the app shares the same spacing scale, surface treatment,
 * typography rhythm and empty-state pattern.
 *
 * Visual only — no business logic lives here.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Copy, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ─── Page container ──────────────────────────────────────────────── */

export const PageContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mx-auto w-full max-w-7xl px-5 md:px-10 lg:px-16", className)}
    {...props}
  />
));
PageContainer.displayName = "PageContainer";

/* ─── Page header ─────────────────────────────────────────────────── */

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Small uppercase label above the title. */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned actions (buttons, filters). */
  actions?: React.ReactNode;
  /** Optional breadcrumb rendered above the eyebrow. */
  breadcrumb?: React.ReactNode;
  /** Removes the bottom divider — use when a toolbar follows immediately. */
  bare?: boolean;
  size?: "default" | "compact";
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumb,
  bare = false,
  size = "default",
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative bg-background/50",
        !bare && "border-b border-border",
        className,
      )}
      {...props}
    >
      <PageContainer
        className={cn(
          "relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
          size === "compact" ? "py-5 md:py-6" : "py-7 md:py-9",
        )}
      >
        <div className="min-w-0 max-w-3xl">
          {breadcrumb && <div className="mb-3">{breadcrumb}</div>}
          {eyebrow && (
            <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
        )}
      </PageContainer>
    </div>
  );
}

/* ─── Section ─────────────────────────────────────────────────────── */

interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  divided?: boolean;
}

export function Section({
  title,
  description,
  actions,
  divided = false,
  className,
  children,
  ...props
}: SectionProps) {
  const hasHeading = title || description || actions;
  return (
    <section
      className={cn(
        "mx-auto w-full max-w-7xl px-5 md:px-10 lg:px-16",
        divided && "border-t border-border/60",
        className,
      )}
      {...props}
    >
      {hasHeading && (
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            {title && (
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground md:text-2xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/* ─── Surface (card) ──────────────────────────────────────────────── */

export const Surface = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    interactive?: boolean;
    padded?: boolean;
  }
>(({ className, interactive = false, padded = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-border bg-card text-card-foreground shadow-card",
      padded && "p-5",
      interactive &&
        "transition-colors hover:border-primary/35 hover:shadow-accent",
      className,
    )}
    {...props}
  />
));
Surface.displayName = "Surface";

/* ─── Stat card ───────────────────────────────────────────────────── */

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-card",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon && (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
            style={{
              background: accent ? `${accent}14` : "hsl(var(--primary) / 0.1)",
              borderColor: accent ? `${accent}2E` : "hsl(var(--primary) / 0.2)",
              color: accent || "hsl(var(--primary))",
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-foreground">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────── */

interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

/* ─── Segmented control (tabs / filters) ──────────────────────────── */

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: React.ReactNode; icon?: React.ReactNode }>;
  className?: string;
  size?: "sm" | "default";
  fullWidth?: boolean;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "default",
  fullWidth = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-border bg-muted p-1",
        fullWidth && "w-full",
        className,
      )}
      role="tablist"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
              fullWidth && "flex-1",
              active
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Toolbar (sticky filter / search bar) ────────────────────────── */

export const Toolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sticky?: boolean }
>(({ className, sticky = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
      sticky &&
        "sticky top-0 z-20 -mx-5 mb-6 border-b border-border bg-background/90 px-5 py-3 backdrop-blur md:-mx-10 md:px-10 lg:-mx-16 lg:px-16",
      className,
    )}
    {...props}
  />
));
Toolbar.displayName = "Toolbar";

/* ─── Pill (filters / metadata chips) ─────────────────────────────── */

export const Pill = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }
>(({ className, active = false, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
      active
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
      className,
    )}
    {...props}
  />
));
Pill.displayName = "Pill";

/* ─── Field shell (consistent form labels + errors) ───────────────── */

interface FieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/* ─── Stat tile (Part 4.11) ───────────────────────────────────────── */

export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: {
    positive?: boolean;
    text: string;
  };
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  trend,
  className,
  ...props
}: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/80 shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      {(hint || trend) && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          {trend && (
            <span
              className={cn(
                "font-medium",
                trend.positive ? "text-emerald-500" : "text-rose-500",
              )}
            >
              {trend.text}
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </div>
  );
}

/* ─── Difficulty badge (Part 4.1) ─────────────────────────────────── */

export type DifficultyLevel = "easy" | "medium" | "hard" | "Easy" | "Medium" | "Hard";

export function DifficultyBadge({
  level,
  showDot = true,
  className,
}: {
  level: DifficultyLevel | string;
  showDot?: boolean;
  className?: string;
}) {
  const norm = (level || "").toLowerCase();
  const isEasy = norm === "easy";
  const isHard = norm === "hard";
  const isMed = !isEasy && !isHard;

  const dotColor = isEasy
    ? "bg-emerald-500"
    : isMed
      ? "bg-amber-500"
      : "bg-rose-500";

  const textColor = isEasy
    ? "text-emerald-600 dark:text-emerald-400"
    : isMed
      ? "text-amber-600 dark:text-amber-400"
      : "text-rose-600 dark:text-rose-400";

  const bgColor = isEasy
    ? "bg-emerald-500/10 border-emerald-500/20"
    : isMed
      ? "bg-amber-500/10 border-amber-500/20"
      : "bg-rose-500/10 border-rose-500/20";

  const label = isEasy ? "Easy" : isMed ? "Medium" : "Hard";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums",
        textColor,
        bgColor,
        className,
      )}
    >
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor)} />}
      <span>{label}</span>
    </span>
  );
}

/* ─── Status dot ─────────────────────────────────────────────────── */

export function StatusDot({
  status,
  label,
  className,
}: {
  status: "success" | "warning" | "danger" | "neutral" | "info";
  label?: string;
  className?: string;
}) {
  const colorMap = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    neutral: "bg-muted-foreground",
    info: "bg-sky-500",
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className={cn("h-2 w-2 rounded-full shrink-0", colorMap[status])} />
      {label && <span>{label}</span>}
    </span>
  );
}

/* ─── Kbd (keyboard shortcut) ────────────────────────────────────── */

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded border border-border bg-muted/60 font-mono text-[11px] font-medium text-muted-foreground shadow-xs select-none",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

/* ─── Copy button ────────────────────────────────────────────────── */

export function CopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        copied && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
        className,
      )}
      aria-label={copied ? "Copied" : label}
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

/* ─── Prose wrapper ──────────────────────────────────────────────── */

export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-zinc dark:prose-invert max-w-[68ch] leading-relaxed text-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ─── Error state ────────────────────────────────────────────────── */

export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading this content.",
  onRetry,
  action,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onRetry?: () => void;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <AlertTriangle size={20} />
      </div>
      <h3 className="mt-3 text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
      {(onRetry || action) && (
        <div className="mt-4 flex items-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Retry
            </button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

/* ─── Confirm dialog ─────────────────────────────────────────────── */

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
