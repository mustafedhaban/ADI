import { Link } from "react-router-dom";
import type { CollectionSummary } from "@/lib/api";
import { CollectionCover } from "@/components/collections/CollectionCover";
import { formatShortDate, Meta } from "@/components/common/Primitives";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/* ---------------------------------------------------------------------------
   Collection card — curated set as mixtape sleeve, not folder tile.
--------------------------------------------------------------------------- */

export function CollectionCard({
  collection,
  styles,
  footer,
  className,
}: {
  collection: CollectionSummary;
  /** Optional style terms when the caller has reference data. */
  styles?: string[];
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden border bg-card transition-colors hover:border-rule-strong",
        className,
      )}
    >
      <Link to={`/collections/${collection.id}`} className="block">
        <CollectionCover
          images={collection.coverImages}
          styles={styles}
          label={collection.name}
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 border-t p-4">
        <Meta className="tabular">
          {collection.referenceCount} reference
          {collection.referenceCount === 1 ? "" : "s"}
        </Meta>
        <Link
          to={`/collections/${collection.id}`}
          className="font-display text-xl leading-tight text-balance transition-colors hover:text-primary"
        >
          {collection.name}
        </Link>
        {collection.description && (
          <p className="line-clamp-2 text-pretty text-sm text-ink-2">
            {collection.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <Meta>Updated {formatShortDate(collection.updatedAt)}</Meta>
          {footer}
        </div>
      </div>
    </article>
  );
}
