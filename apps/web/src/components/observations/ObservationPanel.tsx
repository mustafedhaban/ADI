import { useCallback, useEffect, useState } from "react";
import {
  api,
  type Observation,
  type Provenance,
  type ReferenceObservations,
} from "@/lib/api";
import { Empty, Meta, Loading } from "@/components/common/Primitives";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Observations on one reference.

   The whole point of this panel is that a reader can never mistake a fact for
   a conclusion. Provenance is carried by the mark to the left of each trait,
   not by a colour alone:

     |  observed  — solid rule, full-strength ink. Read off the capture.
     ┆  inferred  — dashed rule, muted ink, confidence shown. Reasoned.
     "  authored  — quote mark, italic. Somebody's words.

   Observed facts sort first because they are the source of truth.
--------------------------------------------------------------------------- */

const PROVENANCE_ORDER: Record<Provenance, number> = {
  observed: 0,
  inferred: 1,
  authored: 2,
};

const PROVENANCE_LABEL: Record<Provenance, string> = {
  observed: "Observed",
  inferred: "Inferred",
  authored: "Note",
};

function ObservationRow({ item }: { item: Observation }) {
  return (
    <li
      className={cn(
        "flex items-baseline gap-3 border-l-2 py-1.5 pl-3",
        item.provenance === "observed" && "border-l-primary",
        item.provenance === "inferred" &&
          "border-l-transparent [border-left-style:dashed] border-l-rule-strong",
        item.provenance === "authored" && "border-l-signal",
      )}
    >
      <span
        className={cn(
          "text-sm",
          item.provenance === "observed" && "text-foreground",
          item.provenance === "inferred" && "italic text-muted-foreground",
          item.provenance === "authored" && "italic text-ink-2",
        )}
      >
        {item.provenance === "authored" ? `“${item.trait}”` : item.trait}
        {item.detail && (
          <span className="text-muted-foreground"> · {item.detail}</span>
        )}
      </span>
      {item.provenance === "inferred" && item.confidence != null && (
        <Meta className="tabular shrink-0">{item.confidence}%</Meta>
      )}
    </li>
  );
}

export function ObservationPanel({ referenceId }: { referenceId: string }) {
  const [data, setData] = useState<ReferenceObservations | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setData(await api.getReferenceObservations(referenceId));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [referenceId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loading>Loading observations…</Loading>;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Meta>Structured observations</Meta>
          <h2 className="font-display text-2xl leading-tight">
            What this interface does
          </h2>
        </div>
        {data && data.total > 0 && (
          <div className="flex flex-wrap gap-x-5">
            <Meta className="tabular text-foreground">
              {data.counts.observed} observed
            </Meta>
            {data.counts.inferred > 0 && (
              <Meta className="tabular">{data.counts.inferred} inferred</Meta>
            )}
            {data.counts.authored > 0 && (
              <Meta className="tabular">{data.counts.authored} notes</Meta>
            )}
          </div>
        )}
      </div>

      {!data || data.total === 0 ? (
        <Empty>
          No observations recorded yet. Observations are read off this
          reference&rsquo;s captured screenshots and become queryable data —
          they are what lets ADI compare this interface with the rest of the
          library.
        </Empty>
      ) : (
        <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {data.byCategory.map((group) => (
            <div key={group.category} className="flex flex-col gap-2">
              <Meta className="text-primary">{group.label}</Meta>
              <ul className="flex flex-col">
                {[...group.items]
                  .sort(
                    (a, b) =>
                      PROVENANCE_ORDER[a.provenance] -
                        PROVENANCE_ORDER[b.provenance] ||
                      a.trait.localeCompare(b.trait),
                  )
                  .map((item) => (
                    <ObservationRow key={item.id} item={item} />
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {data && data.total > 0 && (
        <p className="border-t pt-4 text-xs text-muted-foreground">
          <span className="border-l-2 border-l-primary pl-2">
            {PROVENANCE_LABEL.observed}
          </span>{" "}
          facts are read directly from stored captures and are the source of
          truth. <span className="italic">Inferred</span> conclusions are
          reasoning over those facts and carry a confidence score.{" "}
          <span className="italic">Notes</span> are written by a person.
        </p>
      )}
    </section>
  );
}
