import { useEffect, useState } from "react";
import { api, type CollectionObservations } from "@/lib/api";
import { Empty, Meta, Section } from "@/components/common/Primitives";

/* ---------------------------------------------------------------------------
   Observation summary for a collection.

   Two questions, deliberately separated:

   "What do these references have in common?"  -> shared traits, by frequency.
   "What makes this set unusual?"              -> lift against the whole library.

   The second is the interesting one. A collection where every reference has a
   header search field tells you nothing — so does the rest of the library.
   A collection where half carry a sponsor grid is a finding.
--------------------------------------------------------------------------- */

function Bar({ share }: { share: number }) {
  return (
    <div className="h-1 w-full bg-surface-2">
      <div
        className="h-1 bg-primary"
        style={{ width: `${Math.round(share * 100)}%` }}
      />
    </div>
  );
}

export function CollectionObservationSummary({
  collectionId,
}: {
  collectionId: string;
}) {
  const [data, setData] = useState<CollectionObservations | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api
      .getCollectionObservations(collectionId)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData(null));
    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  if (!data) return null;

  if (data.observedReferenceCount === 0) {
    return (
      <Section eyebrow="Observations" title="Shared interface traits">
        <Empty>
          None of the {data.referenceCount} references in this collection have
          structured observations yet.
        </Empty>
      </Section>
    );
  }

  return (
    <Section
      eyebrow={`Observations · ${data.observedReferenceCount} of ${data.referenceCount} references`}
      title="Shared interface traits"
      description="Counted from observed facts only — inferred conclusions never contribute to a shared-trait claim."
    >
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Meta className="text-primary">Most common here</Meta>
          <ul className="flex flex-col gap-3">
            {data.topTraits.slice(0, 10).map((t) => (
              <li key={`${t.category}-${t.trait}`} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm">{t.trait}</span>
                  <Meta className="tabular shrink-0">
                    {t.count} of {data.referenceCount}
                  </Meta>
                </div>
                <Bar share={t.share} />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <Meta className="text-signal">Distinctive versus the library</Meta>
          {data.distinctive.length === 0 ? (
            <Empty>
              Nothing in this collection is meaningfully more common than in the
              library as a whole.
            </Empty>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.distinctive.map((t) => (
                <li
                  key={`${t.category}-${t.trait}`}
                  className="flex items-baseline justify-between gap-4 border-b pb-2 last:border-0"
                >
                  <span className="text-sm">{t.trait}</span>
                  <Meta className="tabular shrink-0">
                    {Math.round(t.share * 100)}% here ·{" "}
                    {Math.round(t.libraryShare * 100)}% library ·{" "}
                    <span className="text-signal">{t.lift.toFixed(1)}×</span>
                  </Meta>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Section>
  );
}
