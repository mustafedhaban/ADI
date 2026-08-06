import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  api,
  type ObservationComparison,
  type ObservationPatterns,
  type Reference,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Empty,
  ErrorNote,
  Loading,
  Meta,
  Section,
} from "@/components/common/Primitives";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Library-wide pattern intelligence.

   Two views over the same data:

   Recurrence  — which interface traits repeat across the library, and how
                 often. This is the question "what is normal?", which is what
                 makes any individual reference legible as usual or unusual.

   Comparison  — up to eight references side by side, showing which traits they
                 share and which belong to exactly one of them.

   Everything here counts observed facts only.
--------------------------------------------------------------------------- */

function TraitBar({
  trait,
  count,
  share,
  onSelect,
}: {
  trait: string;
  count: number;
  share: number;
  onSelect: () => void;
}) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-4">
        <button
          onClick={onSelect}
          className="text-left text-sm hover:text-primary hover:underline"
        >
          {trait}
        </button>
        <Meta className="tabular shrink-0">
          {count} · {Math.round(share * 100)}%
        </Meta>
      </div>
      <div className="h-1 w-full bg-surface-2">
        <div
          className="h-1 bg-primary transition-[width] duration-500"
          style={{ width: `${Math.round(share * 100)}%` }}
        />
      </div>
    </li>
  );
}

function ComparePanel({ references }: { references: Reference[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<ObservationComparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? references.filter((r) => r.title.toLowerCase().includes(q))
      : references;
    return pool.slice(0, 40);
  }, [references, query]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 8
          ? prev
          : [...prev, id],
    );
    setResult(null);
  }

  async function run() {
    setBusy(true);
    try {
      setResult(await api.compareObservations(selected));
    } catch {
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  const titleOf = (id: string) =>
    result?.references.find((r) => r.id === id)?.title ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter references…"
          className="w-full max-w-md border bg-card px-3 py-2 text-sm outline-none focus:border-rule-strong"
        />
        <div className="flex flex-wrap gap-2">
          {candidates.map((r) => (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              className={cn(
                "border px-2.5 py-1 text-xs transition-colors",
                selected.includes(r.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-rule-strong",
              )}
            >
              {r.title.length > 38 ? `${r.title.slice(0, 38)}…` : r.title}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Button disabled={selected.length < 2 || busy} onClick={() => void run()}>
            {busy ? "Comparing…" : `Compare ${selected.length || ""}`}
          </Button>
          <Meta>Select 2–8 references</Meta>
        </div>
      </div>

      {result && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-x-6">
            <Meta className="tabular">{result.totalTraits} traits total</Meta>
            <Meta className="tabular text-primary">
              {result.sharedCount} shared by all
            </Meta>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left font-normal">
                    <Meta>Trait</Meta>
                  </th>
                  {result.references.map((r) => (
                    <th key={r.id} className="px-2 py-2 text-left font-normal">
                      <Meta className="block max-w-[10rem] truncate" title={r.title}>
                        {r.title}
                      </Meta>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr
                    key={`${row.category}-${row.trait}`}
                    className={cn(
                      "border-b last:border-0",
                      row.shared && "bg-surface-2",
                    )}
                  >
                    <td className="py-2 pr-4">
                      <span className="text-sm">{row.trait}</span>{" "}
                      <Meta className="ml-1">{row.label}</Meta>
                      {row.unique && (
                        <Meta className="ml-2 text-signal">only here</Meta>
                      )}
                    </td>
                    {result.references.map((r) => (
                      <td key={r.id} className="px-2 py-2">
                        {row.presentIn.includes(r.id) ? (
                          <span
                            className="text-primary"
                            title={`${row.trait} — ${titleOf(r.id)}`}
                          >
                            ●
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">·</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function PatternsPage() {
  const [data, setData] = useState<ObservationPatterns | null>(null);
  const [references, setReferences] = useState<Reference[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"recurrence" | "compare">("recurrence");
  const [drill, setDrill] = useState<{
    trait: string;
    items: { id: string; title: string }[];
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, refs] = await Promise.all([
        api.getObservationPatterns(),
        api.listReferences(),
      ]);
      setData(p);
      setReferences(refs.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openTrait(category: string, trait: string) {
    const res = await api.getReferencesWithTrait(category, trait);
    setDrill({ trait, items: res.items });
  }

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!data) return <Loading>Loading pattern intelligence…</Loading>;

  const { coverage } = data;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 border-b pb-8">
        <div className="flex flex-col gap-2">
          <Meta className="text-primary">Intelligence</Meta>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">
            Interface Patterns
          </h1>
          <p className="max-w-2xl text-sm text-ink-2">
            Recurring traits observed across captured references. Every count
            below rests on a fact read from a stored screenshot — inferred
            conclusions are excluded so a pattern can never be an accumulation
            of guesses.
          </p>
        </div>

        <dl className="flex flex-wrap gap-x-12 gap-y-5">
          {[
            { label: "Observations", value: coverage.totalObservations },
            { label: "References covered", value: coverage.referencesWithObservations },
            { label: "Distinct traits", value: data.traits.length },
          ].map((s) => (
            <div key={s.label}>
              <dd className="tabular font-display text-[2rem] leading-none">
                {s.value}
              </dd>
              <dt className="mt-1.5">
                <Meta>{s.label}</Meta>
              </dt>
            </div>
          ))}
        </dl>

        <div className="flex gap-1">
          {(["recurrence", "compare"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "border px-3 py-1.5 text-xs uppercase tracking-wider transition-colors",
                tab === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-rule-strong",
              )}
            >
              {t === "recurrence" ? "Recurrence" : "Compare"}
            </button>
          ))}
        </div>
      </header>

      {tab === "compare" ? (
        <Section
          eyebrow="Side by side"
          title="Compare references"
          description="Shared rows are shaded; traits carried by exactly one reference are marked."
        >
          <ComparePanel references={references} />
        </Section>
      ) : (
        <>
          {coverage.totalObservations === 0 ? (
            <Empty>
              No observations recorded yet. Record them on a reference to build
              library-wide pattern intelligence.
            </Empty>
          ) : (
            <>
              <Section
                eyebrow="By category"
                title="What repeats"
                description="Share is measured against the whole library, so a low percentage on a large library is still a real pattern."
              >
                <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
                  {data.byCategory.map((group) => (
                    <div key={group.category} className="flex flex-col gap-3">
                      <Meta className="text-primary">{group.label}</Meta>
                      <ul className="flex flex-col gap-3">
                        {group.traits.slice(0, 8).map((t) => (
                          <TraitBar
                            key={t.trait}
                            trait={t.trait}
                            count={t.count}
                            share={t.share}
                            onSelect={() => void openTrait(t.category, t.trait)}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Section>

              {data.cooccurrence.length > 0 && (
                <Section
                  eyebrow="Co-occurrence"
                  title="Traits that travel together"
                  description="Pairs appearing on the same reference. These are the combinations that constitute a house style."
                >
                  <ul className="grid gap-x-10 gap-y-2 md:grid-cols-2">
                    {data.cooccurrence.slice(0, 20).map((c) => (
                      <li
                        key={`${c.trait}-${c.otherTrait}`}
                        className="flex items-baseline justify-between gap-4 border-b py-2"
                      >
                        <span className="text-sm">
                          {c.trait}{" "}
                          <span className="text-muted-foreground">+</span>{" "}
                          {c.otherTrait}
                        </span>
                        <Meta className="tabular shrink-0">{c.count}</Meta>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )}
        </>
      )}

      {drill && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setDrill(null)}
        >
          <div
            className="max-h-[70vh] w-full max-w-lg overflow-y-auto bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h3 className="font-display text-xl">{drill.trait}</h3>
              <Meta className="tabular">{drill.items.length} references</Meta>
            </div>
            <ul className="flex flex-col">
              {drill.items.map((i) => (
                <li key={i.id} className="border-b py-2 last:border-0">
                  <Link
                    to={`/references/${i.id}`}
                    className="text-sm hover:text-primary hover:underline"
                  >
                    {i.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
