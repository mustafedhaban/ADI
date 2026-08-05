import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import type { Reference } from "@/lib/api";
import { StyleTerm } from "@/components/references/StyleTerm";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Reference specimen — rebuilt from captured screenshots.

   The previous version put a beige "specimen plate" across 60% of every card.
   With 88% of the library sourced as "Other", that plate rendered the word
   OTHER on 91 of 104 cards: the empty box it claimed to replace.

   Google Fonts solves this properly — it has no thumbnails either, so each row
   renders THE THING ITSELF (the typeface setting a sentence) as the visual.
   ADI's equivalent: the reference's own design attributes are the specimen.
   The styles, set in their own character, ARE the image.

   Typewolf frames each entry in a white mat on a tinted ground; that is the
   surface treatment here.
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
      <div className="flex items-start justify-between gap-3">
        <MetaLine reference={reference} />
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
      </div>

      <h3 className="font-display text-[1.375rem] leading-[1.15]">
        {reference.title}
      </h3>

      {/* The specimen — the reference's own visual character, set large. */}
      <div className="border-y py-4">
        <StyleSpecimen reference={reference} />
      </div>

      {reference.whySaved && (
        <p className="line-clamp-3 text-sm leading-relaxed text-ink-2">
          {reference.whySaved}
        </p>
      )}

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
    "group flex flex-col gap-3 bg-card p-5 text-left transition-colors hover:bg-white";

  if (selectable) {
    return (
      <button
        type="button"
        onClick={() => onToggleSelect?.(reference.id)}
        aria-pressed={selected}
        className={cn(mat, selected && "ring-2 ring-primary")}
      >
        {content}
      </button>
    );
  }

  return (
    <Link to={`/references/${reference.id}`} className={mat}>
      {content}
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

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-baseline gap-x-3">
          <span className="font-display text-lg leading-tight">
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
    "flex w-full items-center gap-4 border-b px-4 py-4 text-left transition-colors last:border-0 hover:bg-card";

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
