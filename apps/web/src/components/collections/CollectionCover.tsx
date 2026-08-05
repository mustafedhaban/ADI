import { StyleTerm } from "@/components/references/StyleTerm";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Collection cover — mixtape sleeve for a curated set.

   With images: mosaic. Without: the set's own style terms (Google Fonts
   principle — render the thing itself). Without styles: the collection name
   set large in the display face — a typographic sleeve, not an empty box.
--------------------------------------------------------------------------- */

export function CollectionCover({
  images,
  styles = [],
  label,
  className,
  size = "md",
}: {
  images: string[];
  /** Style terms drawn from the collection's references. */
  styles?: string[];
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pics = images.filter(Boolean).slice(0, 4);
  const aspect =
    size === "lg" ? "aspect-[16/9]" : size === "sm" ? "aspect-[16/11]" : "aspect-16/10";

  if (pics.length) {
    return (
      <div
        className={cn(
          "grid overflow-hidden bg-surface-2",
          aspect,
          pics.length === 1
            ? "grid-cols-1"
            : pics.length === 2
              ? "grid-cols-2"
              : "grid-cols-2 grid-rows-2",
          className,
        )}
      >
        {pics.map((src) => (
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ))}
      </div>
    );
  }

  const terms = styles.slice(0, size === "lg" ? 8 : 6);

  return (
    <div
      className={cn(
        "flex flex-col justify-end overflow-hidden bg-surface-2",
        aspect,
        size === "lg" ? "gap-2 px-6 py-5" : "gap-1 px-5 py-4",
        className,
      )}
    >
      {terms.length ? (
        <p
          className={cn(
            "flex flex-wrap items-baseline gap-x-3 gap-y-1 leading-snug text-ink-2",
            size === "lg" ? "text-2xl" : "text-lg",
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
        </p>
      ) : label ? (
        <p
          className={cn(
            "font-display leading-[1.05] text-balance text-foreground",
            size === "lg"
              ? "text-3xl md:text-4xl"
              : size === "sm"
                ? "text-xl"
                : "text-2xl",
          )}
        >
          {label}
        </p>
      ) : (
        <p className="meta">Empty set</p>
      )}
    </div>
  );
}
