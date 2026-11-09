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
    className={cn("mx-auto w-full max-w-7xl px-5 sm:px-6", className)}
    {...props}
  />
));
PageContainer.displayName = "PageContainer";

/* ─── Page header ─────────────────────────────────────────────────── */

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Small label above the title. */
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
        !bare && "border-b border-obsidian-border",
        className,
      )}
      {...props}
    >
      <PageContainer
        className={cn(
          "relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
          size === "compact" ? "py-8 md:py-10" : "py-10 md:py-14",
        )}
      >
        <div className="min-w-0 max-w-3xl">
          {breadcrumb && <div className="mb-4">{breadcrumb}</div>}
          {eyebrow && (
            <p className="lp-kicker mb-3">{eyebrow}</p>
          )}
          <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
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
        "mx-auto w-full max-w-7xl px-5 sm:px-6",
        divided && "border-t border-obsidian-border",
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
              <p className="mt-1.5 max-w-2xl text-[15px] leading-6 text-muted-foreground">
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
      "rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane text-foreground transition-colors",
      padded && "p-5",
      interactive && "hover:bg-obsidian-elevated",
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
  accent: _accent,
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-5",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        {icon && (
          <span className="text-muted-foreground/70" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 text-[1.75rem] font-semibold tracking-tight text-foreground tabular-nums">
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-obsidian-border bg-obsidian-elevated text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-[15px] font-semibold text-foreground">{title}</p>
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
        "inline-flex items-center gap-1 rounded-lg border border-obsidian-border bg-obsidian-elevated p-1",
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
                ? "bg-foreground/[0.08] text-foreground shadow-none"
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
        "sticky top-0 z-20 -mx-5 mb-6 border-b border-obsidian-border bg-obsidian-void/90 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6",
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
        ? "border-obsidian-border bg-foreground/[0.08] text-foreground"
        : "border-obsidian-border bg-obsidian-pane text-muted-foreground hover:bg-obsidian-elevated hover:text-foreground",
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
