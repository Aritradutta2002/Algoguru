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
        "relative",
        !bare && "border-b border-border/60",
        className,
      )}
      {...props}
    >
      {/* Soft, restrained radial wash — matches the home page hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.10),transparent_35%),radial-gradient(circle_at_15%_40%,hsl(var(--accent)/0.06),transparent_30%)]"
      />
      <PageContainer
        className={cn(
          "relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
          size === "compact" ? "py-10 md:py-12" : "py-12 md:py-16 lg:py-20",
        )}
      >
        <div className="min-w-0 max-w-3xl">
          {breadcrumb && <div className="mb-5">{breadcrumb}</div>}
          {eyebrow && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
              {eyebrow}
            </div>
          )}
          <h1 className="text-3xl font-bold leading-[1.08] tracking-[-0.035em] text-foreground md:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
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
