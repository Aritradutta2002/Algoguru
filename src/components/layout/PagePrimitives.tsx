/**
 * Shared page-level primitives.
 *
 * These encode the visual language used by the home page (`src/pages/Index.tsx`)
 * so every route in the app shares the same shell width, spacing scale,
 * surface treatment, typography rhythm and empty/loading/error states.
 *
 * Width, gutters and section rhythm come from the `ui-*` vocabulary in
 * `src/index.css`, which is driven by the shared tokens in the same file.
 * A page renders exactly one `PageShell`; headers and sections compose inside
 * it and never declare their own max-width, so widths cannot drift again.
 *
 * Visual only — no business logic lives here.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

/* ─── Design vocabulary types ────────────────────────────────────── */

/** Page shell width. `standard` is the default 1240px column. */
export type ShellWidth = "standard" | "wide" | "reading" | "reader" | "full";
/** Vertical rhythm inside a section. */
export type SectionSpacing = "default" | "compact" | "none";
/** Header emphasis. `display` is the landing-scale page title. */
export type PageHeaderVariant = "display" | "standard" | "compact" | "bare";
/** Card padding scale. */
export type SurfacePadding = "none" | "sm" | "md" | "lg";
/** Semantic status tones — meaning, not decoration. */
export type PillTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "inverse";

const SHELL_CLASS: Record<ShellWidth, string> = {
  standard: "ui-shell",
  wide: "ui-shell--wide",
  reading: "ui-shell--reading",
  reader: "ui-shell--reader",
  full: "ui-shell--full",
};

const SURFACE_PADDING_CLASS: Record<SurfacePadding, string | null> = {
  none: null,
  sm: "p-4",
  md: "p-5",
  lg: "p-6 md:p-8",
};

const PILL_TONE_CLASS: Record<PillTone, string> = {
  neutral: "ui-pill ui-pill--neutral",
  primary: "ui-pill ui-pill--primary",
  success: "ui-pill ui-pill--success",
  warning: "ui-pill ui-pill--warning",
  danger: "ui-pill ui-pill--danger",
  inverse: "ui-pill ui-pill--inverse",
};

/* ─── Page shell ──────────────────────────────────────────────────── */

export interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content column width. Defaults to `standard` (1240px). */
  width?: ShellWidth;
}

/**
 * The one page-level width container. Expects a `.ui-app-canvas` ancestor
 * (container context) so `cqi` gutters and `@container` rules resolve.
 */
export const PageShell = React.forwardRef<HTMLDivElement, PageShellProps>(
  ({ width = "standard", className, ...props }, ref) => (
    <div ref={ref} className={cn(SHELL_CLASS[width], className)} {...props} />
  ),
);
PageShell.displayName = "PageShell";

/**
 * @deprecated Use `PageShell`. Kept as a width-compatible alias for existing
 * call sites; it maps to the `standard` shell.
 */
export const PageContainer = React.forwardRef<HTMLDivElement, PageShellProps>(
  ({ width, className, ...props }, ref) => (
    <PageShell
      ref={ref}
      width={width ?? "standard"}
      className={className}
      {...props}
    />
  ),
);
PageContainer.displayName = "PageContainer";

/* ─── Page header ─────────────────────────────────────────────────── */

export interface PageHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /** Small uppercase label above the title. */
  eyebrow?: React.ReactNode;
  /** Monospace kicker with a leading rule (the landing section label). */
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional line kept under the lede (metadata counts, timings). */
  meta?: React.ReactNode;
  /** Right-aligned actions (buttons, filters). */
  actions?: React.ReactNode;
  /** Optional breadcrumb rendered above the eyebrow. */
  breadcrumb?: React.ReactNode;
  /** Removes the bottom divider — use when a toolbar follows immediately. */
  bare?: boolean;
  /** Legacy alias of `variant`: `compact` maps to the compact variant. */
  size?: "default" | "compact";
  /** Emphasis. Defaults to `standard`. */
  variant?: PageHeaderVariant;
}

/**
 * Page heading block. Renders **no** width wrapper — place it inside a
 * `PageShell` so the title, lede and first content block share one left edge.
 */
export function PageHeader({
  eyebrow,
  kicker,
  title,
  description,
  meta,
  actions,
  breadcrumb,
  bare = false,
  size = "default",
  variant,
  className,
  ...props
}: PageHeaderProps) {
  const resolved: PageHeaderVariant =
    variant ?? (size === "compact" ? "compact" : "standard");
  const isDisplay = resolved === "display";
  const isBare = resolved === "bare" || bare;
  const isCompact = resolved === "compact";

  return (
    <header
      className={cn(
        "ui-page-header",
        `ui-page-header--${resolved}`,
        !isBare && "ui-page-header--divided",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "ui-page-header__inner",
          actions && "ui-page-header__inner--split",
        )}
      >
        <div className="ui-page-header__lead">
          {breadcrumb && (
            <div className="ui-page-header__breadcrumb">{breadcrumb}</div>
          )}
          {kicker && !eyebrow && <p className="ui-kicker">{kicker}</p>}
          {eyebrow && (
            <span className="ui-chip ui-chip--primary ui-page-header__eyebrow">
              {eyebrow}
            </span>
          )}
          <h1 className={isDisplay ? "ui-display" : "ui-h2"} data-page-title="">
            {title}
          </h1>
          {description && (
            <p className="ui-lede ui-page-header__lede">{description}</p>
          )}
          {meta && <div className="ui-page-header__meta">{meta}</div>}
        </div>
        {actions && <div className="ui-page-header__actions">{actions}</div>}
      </div>
      {isCompact && (
        <span className="ui-rule ui-page-header__rule" aria-hidden="true" />
      )}
    </header>
  );
}

/* ─── Section heading ─────────────────────────────────────────────── */

export interface SectionHeadingProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Heading level — defaults to `h2`. */
  as?: "h2" | "h3" | "h4";
}

/** The landing section-head grid: title left, lede right once there is room. */
export function SectionHeading({
  kicker,
  title,
  description,
  actions,
  as: Tag = "h2",
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div className={cn("ui-section-head", className)} {...props}>
      <div className="ui-section-head__lead">
        {kicker && <p className="ui-kicker">{kicker}</p>}
        <Tag className={Tag === "h2" ? "ui-h2" : "ui-h3"}>{title}</Tag>
      </div>
      {(description || actions) && (
        <div className="ui-section-head__aside">
          {description && <p className="ui-lede">{description}</p>}
          {actions && <div className="ui-section-head__actions">{actions}</div>}
        </div>
      )}
    </div>
  );
}

/* ─── Section ─────────────────────────────────────────────────────── */

export interface SectionProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "title"
> {
  kicker?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Legacy alias of `band`. Draws a rule above the section. */
  divided?: boolean;
  /** Draws a 1px top band separator. */
  band?: boolean;
  spacing?: SectionSpacing;
  /** Heading level for the section title — defaults to `h2`. */
  headingAs?: "h2" | "h3" | "h4";
}

/**
 * A page band. Renders **no** width wrapper — place it inside a `PageShell`
 * so bands run edge-to-edge within the shell column like `.lp-band`.
 */
export function Section({
  kicker,
  title,
  description,
  actions,
  divided = false,
  band,
  spacing = "default",
  headingAs,
  className,
  children,
  ...props
}: SectionProps) {
  const hasHeading = Boolean(kicker || title || description || actions);
  return (
    <section
      className={cn(
        "ui-section",
        spacing === "compact" && "ui-section--compact",
        spacing === "none" && "ui-section--flush",
        (divided || band) && "ui-band",
        className,
      )}
      {...props}
    >
      {hasHeading && (
        <SectionHeading
          kicker={kicker}
          title={title ?? null}
          description={description}
          actions={actions}
          as={headingAs}
          className="ui-section__head"
        />
      )}
      {children}
    </section>
  );
}

/* ─── Page state (loading / error / empty) ────────────────────────── */

export type PageStateKind = "loading" | "error" | "empty";

export interface PageStateProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  kind: PageStateKind;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  /** Loading skeleton row count. */
  rows?: number;
}

const PAGE_STATE_DEFAULT_TITLE: Record<PageStateKind, string> = {
  loading: "Loading…",
  error: "Something went wrong",
  empty: "Nothing here yet",
};

/** One implementation of the loading / error / empty trio for every route. */
export function PageState({
  kind,
  title,
  description,
  icon,
  action,
  rows = 3,
  className,
  ...props
}: PageStateProps) {
  const isLoading = kind === "loading";
  return (
    <div
      className={cn("ui-page-state", `ui-page-state--${kind}`, className)}
      role={kind === "error" ? "alert" : undefined}
      aria-busy={isLoading || undefined}
      aria-live={kind === "error" ? "assertive" : "polite"}
      {...props}
    >
      {isLoading ? (
        <div className="ui-page-state__skeleton" aria-hidden="true">
          {Array.from({ length: rows }, (_, index) => (
            <span key={index} className="ui-page-state__line" />
          ))}
          <span className="sr-only">
            {title ?? PAGE_STATE_DEFAULT_TITLE.loading}
          </span>
        </div>
      ) : (
        <>
          {icon && <div className="ui-page-state__icon">{icon}</div>}
          <p className="ui-page-state__title">
            {title ?? PAGE_STATE_DEFAULT_TITLE[kind]}
          </p>
          {description && <p className="ui-page-state__desc">{description}</p>}
          {action && <div className="ui-page-state__action">{action}</div>}
        </>
      )}
    </div>
  );
}

/* ─── Surface (card) ──────────────────────────────────────────────── */

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  /** Legacy boolean: `false` means no padding. Prefer `padding`. */
  padded?: boolean;
  padding?: SurfacePadding;
  /** Inverted panel — at most one per page, for the strongest CTA. */
  inverse?: boolean;
  /** Semantics for the surface element (e.g. `div` when it takes a role). */
  as?: "div" | "section" | "article" | "aside";
}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  (
    {
      className,
      interactive = false,
      padded = true,
      padding,
      inverse = false,
      as: Tag = "div",
      ...props
    },
    ref,
  ) => {
    const resolvedPadding: SurfacePadding = padding ?? (padded ? "md" : "none");
    return (
      <Tag
        ref={ref}
        className={cn(
          inverse ? "ui-surface ui-surface--inverse" : "ui-surface",
          SURFACE_PADDING_CLASS[resolvedPadding],
          interactive && !inverse && "ui-surface--interactive",
          className,
        )}
        {...props}
      />
    );
  },
);
Surface.displayName = "Surface";

/* ─── Meter (thin progress rule) ──────────────────────────────────── */

export interface MeterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Completion percentage, clamped to 0–100. */
  value: number;
  /** `primary` for progress toward a goal; `neutral` for plain quantities. */
  tone?: "neutral" | "primary";
  label?: string;
}

/** One progress rule for headers, cards and toolbars. */
export function Meter({
  value,
  tone = "primary",
  label,
  className,
  ...props
}: MeterProps) {
  const pct = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div
      className={cn("ui-meter", `ui-meter--${tone}`, className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
      {...props}
    >
      <span className="ui-meter__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ─── Stat card ───────────────────────────────────────────────────── */

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  /** Legacy per-card accent; now rendered as a neutral token surface. */
  accent?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
  ...props
}: StatCardProps) {
  return (
    <div className={cn("ui-stat", className)} {...props}>
      <div className="ui-stat__head">
        <span className="ui-meta ui-stat__label">{label}</span>
        {icon && <span className="ui-stat__icon">{icon}</span>}
      </div>
      <div className="ui-stat__value">{value}</div>
      {hint && <div className="ui-stat__hint">{hint}</div>}
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────── */

export interface EmptyStateProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  icon?: React.ReactNode;
  /** Larger illustration slot rendered above the icon. */
  illustration?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Additional secondary action(s). */
  secondaryAction?: React.ReactNode;
  /** Tighter padding for empty states nested inside a card. */
  compact?: boolean;
}

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  secondaryAction,
  compact,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn("ui-empty", compact && "ui-empty--compact", className)}
      {...props}
    >
      {illustration && (
        <div className="ui-empty__illustration">{illustration}</div>
      )}
      {icon && <div className="ui-empty__icon">{icon}</div>}
      <div className="ui-empty__copy">
        <p className="ui-empty__title">{title}</p>
        {description && <p className="ui-empty__desc">{description}</p>}
      </div>
      {(action || secondaryAction) && (
        <div className="ui-empty__actions">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

/* ─── Segmented control (tabs / filters) ──────────────────────────── */

export interface SegmentedControlProps<T extends string> {
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
        "ui-segmented",
        fullWidth && "ui-segmented--full",
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
              "ui-segmented__item",
              size === "sm" && "ui-segmented__item--sm",
              fullWidth && "ui-segmented__item--fill",
              active && "is-active",
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

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  sticky?: boolean;
}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ className, sticky = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("ui-toolbar", sticky && "ui-toolbar--sticky", className)}
      {...props}
    />
  ),
);
Toolbar.displayName = "Toolbar";

/* ─── Pill (status / metadata) and Chip (filters) ────────────────── */

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  /** Force the chip look for metadata that is not a status. */
  variant?: "chip" | "pill";
  mono?: boolean;
}

/** Non-interactive status or metadata token. */
export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  (
    { className, tone = "neutral", variant = "pill", mono = false, ...props },
    ref,
  ) => (
    <span
      ref={ref}
      className={cn(
        variant === "chip"
          ? PILL_TONE_CLASS[tone].replace("ui-pill", "ui-chip")
          : PILL_TONE_CLASS[tone],
        mono && "ui-pill--mono",
        className,
      )}
      {...props}
    />
  ),
);
Pill.displayName = "Pill";

/* ─── Field shell (consistent form labels + errors) ───────────────── */

export interface FieldProps {
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
    <div className={cn("ui-field", className)}>
      <label htmlFor={htmlFor} className="ui-field__label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="ui-field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="ui-field__hint">{hint}</p>
      ) : null}
    </div>
  );
}
