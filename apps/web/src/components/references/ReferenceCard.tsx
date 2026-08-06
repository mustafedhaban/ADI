import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import type { Reference } from "@/lib/api";
import { StyleTerm } from "@/components/references/StyleTerm";
import {
  CaptureBadge,
  ReferenceVisual,
} from "@/components/references/ReferenceVisual";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Reference index card — Obsidian Archive.
   Dense metadata row with mint signal spine; whySaved stays visible.
--------------------------------------------------------------------------- */

export type ReferenceCardProps = {
  reference: Reference;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onFilterBy?: (
    axis: "styles" | "patterns" | "type" | "source",
    value: string,
  ) => void;
};

/** The specimen: style terms set large in their own character. */
function StyleSpecimen({
  reference,
  size = "lg",
}: {
  reference: Reference;
  size?: "lg" | "sm";
}) {
  const terms = reference.styles.slice(0, size === "lg" ? 4 : 3);
  if (!terms.length) {
    return (
      <span className="meta text-muted-foreground">unclassified</span>
    );
  }
  return (
    <span
      className={cn(
        "flex flex-wrap items-baseline gap-x-3 gap-y-1 leading-tight text-foreground",
        size === "lg" ? "text-2xl" : "text-base",
      )}
    >
      {terms.map((term, i) => (
        <span key={term} className="inline-flex items-baseline gap-3">
          {i > 0 && (
            <span aria-hidden className="text-rule-strong">
              /
            </span>
          )}
          <StyleTerm term={term} />
        </span>
      ))}
      {reference.styles.length > terms.length && (
        <span className="font-mono text-xs text-muted-foreground">
          +{reference.styles.length - terms.length}
        </span>
      )}
    </span>
  );
}

/** Dot-separated machine facts — Hugging Face's row metadata model. */
function MetaLine({
  reference,
  full = false,
}: {
  reference: Reference;
  full?: boolean;
}) {
  const parts = full
    ? [
        reference.type,
        reference.source,
        `${reference.patterns.length}p`,
        `${reference.whatToLearn.length}L`,
      ]
    : [reference.type, reference.source];
  return <span className="meta block truncate">{parts.join(" · ")}</span>;
}

export function ReferenceCard({
  reference,
  selectable = false,
  selected = false,
  onToggleSelect,
  onFilterBy,
}: ReferenceCardProps) {
  const content = (
    <>
      {(reference.thumbnailUrl || reference.image) ? (
        <ReferenceVisual reference={reference} className="mb-0 w-auto" aspect="16/9" />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        {selectable ? (
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center border",
              selected && "border-primary bg-primary text-primary-foreground",
            )}
          >
            {selected ? <Check className="size-3" /> : null}
          </span>
        ) : (
          <span className="meta">REF</span>
        )}
        {reference.whySaved ? (
          <span className="meta text-primary">whySaved</span>
        ) : null}
      </div>

      <h3 className="font-display text-base leading-tight tracking-tight md:text-lg">
        {reference.title}
      </h3>

      <MetaLine reference={reference} />

      {reference.whySaved && (
        <p className="line-clamp-3 text-sm leading-relaxed text-ink-2">
          {reference.whySaved}
        </p>
      )}

      <div className="border-y border-border/80 py-3">
        <StyleSpecimen reference={reference} size="sm" />
      </div>

      {reference.whatToLearn.length > 0 && (
        <ul className="mt-auto flex flex-col gap-1 pt-1">
          {reference.whatToLearn.slice(0, 3).map((item) => (
            <li
              key={item}
              className="flex gap-2 font-mono text-[0.6875rem] leading-snug text-muted-foreground"
            >
              <span aria-hidden className="text-rule-strong">
                —
              </span>
              <span className="truncate">{item}</span>
            </li>
          ))}
        </ul>
      )}

      <CaptureBadge status={reference.captureStatus} />

      {reference.patterns.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {reference.patterns.slice(0, 3).map((pattern) => (
            <button
              key={pattern}
              type="button"
              onClick={
                onFilterBy
                  ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onFilterBy("patterns", pattern);
                    }
                  : undefined
              }
              className="border border-border px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider text-ink-2 transition-colors hover:border-rule-strong hover:bg-surface-2"
            >
              {pattern}
            </button>
          ))}
        </div>
      )}
    </>
  );

  const mat =
    "group grid grid-cols-[4px_1fr] overflow-hidden rounded-md border border-border bg-card text-left transition-colors hover:border-rule-strong";

  const body = (
    <>
      <div aria-hidden className="bg-primary" />
      <div className="flex flex-col gap-3 p-4 md:p-5">{content}</div>
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        onClick={() => onToggleSelect?.(reference.id)}
        aria-pressed={selected}
        className={cn(mat, selected && "ring-2 ring-primary")}
      >
        {body}
      </button>
    );
  }

  return (
    <Link to={`/references/${reference.id}`} className={mat}>
      {body}
    </Link>
  );
}

/**
 * Index row — Google Fonts' listing model: hairline-separated rows where the
 * specimen itself is the dominant element, no thumbnail column.
 */
export function ReferenceRow({
  reference,
  selectable = false,
  selected = false,
  onToggleSelect,
}: ReferenceCardProps) {
  const inner = (
    <>
      {selectable && (
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center border",
            selected && "border-primary bg-primary text-primary-foreground",
          )}
        >
          {selected ? <Check className="size-3" /> : null}
        </span>
      )}

      <ReferenceVisual
        reference={reference}
        className="hidden size-12 shrink-0 sm:block"
      />

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-baseline gap-x-3">
          <span className="font-display text-base leading-tight tracking-tight">
            {reference.title}
          </span>
          <MetaLine reference={reference} full />
        </span>
        {reference.whySaved && (
          <span className="truncate text-sm text-ink-2">
            {reference.whySaved}
          </span>
        )}
      </span>

      <span className="hidden shrink-0 lg:block lg:w-[42%]">
        <StyleSpecimen reference={reference} size="sm" />
      </span>
    </>
  );

  const shell =
    "flex w-full items-center gap-4 border-b border-border px-4 py-4 text-left transition-colors last:border-0 hover:bg-surface-2";

  if (selectable) {
    return (
      <button
        type="button"
        onClick={() => onToggleSelect?.(reference.id)}
        aria-pressed={selected}
        className={cn(shell, selected && "bg-card")}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link to={`/references/${reference.id}`} className={shell}>
      {inner}
    </Link>
  );
}

export { StyleSpecimen };
