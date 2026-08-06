import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   ADI shared primitives — Obsidian Archive shell language.
--------------------------------------------------------------------------- */

/**
 * Mono / uppercase / letterspaced label. The system's core legibility device.
 * Forwards span props so callers can attach aria-live, ids, etc.
 */
export function Meta({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span className={cn("meta", className)} {...props}>
      {children}
    </span>
  );
}

/**
 * Page header: meta eyebrow + display title + optional lede and actions,
 * closed by a hairline. Used at the top of every page for a shared rhythm.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  back,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
}) {
  return (
    <header className="flex flex-col gap-5 border-b pb-6">
      {back && (
        <Link
          to={back.to}
          className="meta inline-flex w-fit items-center gap-1.5 transition-colors hover:text-foreground"
        >
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {eyebrow && <Meta className="text-primary">{eyebrow}</Meta>}
          <h1 className="font-display text-[2rem] leading-[1.1] tracking-tight text-balance md:text-[2.5rem]">
            {title}
          </h1>
          {lede && (
            <p className="prose-measure text-pretty text-sm text-ink-2">{lede}</p>
          )}
        </div>
        {actions && (
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

/** Section: meta eyebrow + display title + optional action. Space, not boxes. */
export function Section({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  id,
}: {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("flex scroll-mt-8 flex-col gap-5", className)}>
      {(title || eyebrow || action) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            {eyebrow && <Meta>{eyebrow}</Meta>}
            {title && (
              <h2 className="font-display text-2xl leading-tight text-balance">
                {title}
              </h2>
            )}
            {description && (
              <p className="prose-measure text-pretty text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Stat: tabular numeral over a mono label. No icon-in-a-rounded-square. */
export function Stat({
  label,
  value,
  hint,
  to,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  to?: string;
}) {
  const body = (
    <>
      <div className="tabular font-display text-[2rem] leading-none">
        {value}
      </div>
      <Meta className="mt-2 block">{label}</Meta>
      {hint && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </>
  );

  const base =
    "block border border-border bg-card p-3 md:p-4 transition-colors";

  if (to) {
    return (
      <Link to={to} className={cn(base, "hover:border-primary")}>
        {body}
      </Link>
    );
  }
  return <div className={base}>{body}</div>;
}

/** Compact metric for denser surfaces — numeral + mono label inline. */
export function Metric({
  value,
  label,
}: {
  value: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="tabular font-mono text-sm">{value}</span>
      <Meta>{label}</Meta>
    </div>
  );
}

/** Typewolf-style LABEL — value meta row. */
export function MetaRow({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Meta>{label}</Meta>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

/**
 * Taxonomy tag. Clickable ones apply a filter — the pattern Pentagram uses on
 * its archive cards. Inert ones are plain markers.
 */
export function Tag({
  children,
  onClick,
  active,
  title,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
  className?: string;
}) {
  const base = cn(
    "inline-flex min-h-[24px] items-center rounded-sm border px-2 py-0.5",
    "font-mono text-[0.6875rem] leading-none tracking-wide",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-transparent text-ink-2",
    className,
  );

  if (!onClick) {
    return (
      <span className={base} title={title}>
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(base, "transition-colors hover:border-rule-strong hover:bg-surface-2")}
    >
      {children}
    </button>
  );
}

/** Status marker — colour never sole carrier (§14). */
export function StatusMark({
  tone = "ink",
  children,
}: {
  tone?: "ink" | "signal" | "accent" | "muted";
  children: ReactNode;
}) {
  const dot =
    tone === "signal"
      ? "bg-signal"
      : tone === "accent"
        ? "bg-primary"
        : tone === "muted"
          ? "bg-rule-strong"
          : "bg-foreground";

  const text =
    tone === "signal"
      ? "text-signal"
      : tone === "muted"
        ? "text-muted-foreground"
        : "text-foreground";

  return (
    <span className={cn("meta inline-flex items-center gap-1.5", text)}>
      <span aria-hidden className={cn("inline-block size-1.5 rounded-full", dot)} />
      {children}
    </span>
  );
}

/** Empty state: one sentence, one action. Never an illustration. */
export function Empty({
  eyebrow,
  children,
  action,
}: {
  eyebrow?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 border border-dashed px-6 py-10">
      {eyebrow && <Meta>{eyebrow}</Meta>}
      <p className="prose-measure text-pretty text-sm text-ink-2">{children}</p>
      {action}
    </div>
  );
}

/**
 * Machine-generated content marker. Ochre rule + mono label.
 * Always paired with the text label — colour is never the sole signal (§14).
 */
export function AiMark({ children = "AI draft" }: { children?: ReactNode }) {
  return (
    <span className="meta inline-flex items-center gap-1.5 text-signal">
      <span aria-hidden className="inline-block size-1.5 rounded-full bg-signal" />
      {children}
    </span>
  );
}

/**
 * Surface for machine-proposed content — ochre left rule on surface-2.
 * Resolves to ink once a human has accepted/published.
 */
export function AiSurface({
  children,
  className,
  reviewed = false,
}: {
  children: ReactNode;
  className?: string;
  reviewed?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-l-2 bg-surface-2 px-4 py-3",
        reviewed ? "border-border" : "border-signal",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Loading line — text, not shimmer. */
export function Loading({ children }: { children: ReactNode }) {
  return <p className="meta py-8">{children}</p>;
}

/** Inline error surface. */
export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-2 border-destructive bg-surface-2 px-4 py-3 text-sm text-destructive">
      {children}
    </div>
  );
}

/**
 * Page-level action cluster: one primary row + secondary text tools.
 * Keeps dense headers usable at 390px without removing functionality.
 */
export function HeaderActions({
  primary,
  secondary,
}: {
  primary?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-2.5 sm:items-end">
      {primary && (
        <div className="flex flex-wrap items-center gap-2">{primary}</div>
      )}
      {secondary && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {secondary}
        </div>
      )}
    </div>
  );
}

/** Text-style secondary action for HeaderActions. */
export function HeaderTool({
  children,
  onClick,
  tone = "default",
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "meta transition-colors disabled:opacity-50",
        tone === "danger"
          ? "text-muted-foreground hover:text-destructive"
          : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Grid ⇄ Index view toggle — shared by Library and Collection Detail. */
export function ViewToggle({
  value,
  onChange,
}: {
  value: "grid" | "index";
  onChange: (next: "grid" | "index") => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-sm border p-0.5">
      {(
        [
          { mode: "grid" as const, icon: LayoutGrid, label: "Grid view" },
          { mode: "index" as const, icon: List, label: "Index view" },
        ]
      ).map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-pressed={value === mode}
          aria-label={label}
          className={cn(
            "rounded-sm p-1.5 transition-colors",
            value === mode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

export function formatShortDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

export function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}
