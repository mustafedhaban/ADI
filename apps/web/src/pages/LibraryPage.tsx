import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FolderPlus, Search, X } from "lucide-react";
import {
  api,
  type Reference,
  type ReferenceFilters,
  type Taxonomy,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Empty, ErrorNote, Meta, ViewToggle } from "@/components/common/Primitives";
import {
  ReferenceCard,
  ReferenceRow,
} from "@/components/references/ReferenceCard";
import { FacetRail } from "@/components/references/FacetRail";
import { FilterSentence } from "@/components/references/FilterSentence";
import { StyleTerm } from "@/components/references/StyleTerm";
import { AddToCollectionDialog } from "@/components/collections/AddToCollectionDialog";

const emptyFilters: ReferenceFilters = {
  q: "",
  type: "",
  source: "",
  industries: [],
  pageTypes: [],
  styles: [],
  patterns: [],
  tags: [],
};

type ViewMode = "grid" | "index";
const VIEW_KEY = "adi.library.view";

function filtersFromParams(params: URLSearchParams): ReferenceFilters {
  const list = (key: string) =>
    (params.get(key) ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

  return {
    q: params.get("q") ?? "",
    type: params.get("type") ?? "",
    source: params.get("source") ?? "",
    industries: list("industries"),
    pageTypes: list("pageTypes"),
    styles: list("styles"),
    patterns: list("patterns"),
    tags: list("tags"),
  };
}

function ActiveChips({
  filters,
  onChange,
}: {
  filters: ReferenceFilters;
  onChange: (next: ReferenceFilters) => void;
}) {
  const chips: Array<{ key: string; node: React.ReactNode; clear: () => void }> =
    [];

  if (filters.type) {
    chips.push({
      key: `type-${filters.type}`,
      node: <span>{filters.type}</span>,
      clear: () => onChange({ ...filters, type: "" }),
    });
  }
  if (filters.source) {
    chips.push({
      key: `source-${filters.source}`,
      node: <span>{filters.source}</span>,
      clear: () => onChange({ ...filters, source: "" }),
    });
  }

  (["styles", "patterns", "industries", "pageTypes", "tags"] as const).forEach(
    (axis) => {
      (filters[axis] ?? []).forEach((value) => {
        chips.push({
          key: `${axis}-${value}`,
          node:
            axis === "styles" ? <StyleTerm term={value} /> : <span>{value}</span>,
          clear: () =>
            onChange({
              ...filters,
              [axis]: (filters[axis] ?? []).filter((v) => v !== value),
            }),
        });
      });
    },
  );

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.clear}
          className="inline-flex items-center gap-1.5 border border-rule-strong bg-card px-2 py-1 text-[0.8125rem] text-ink-2 transition-colors hover:border-destructive hover:text-destructive"
        >
          {chip.node}
          <X aria-hidden className="size-3" />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
    </div>
  );
}

export function LibraryPage() {
  const [searchParams] = useSearchParams();
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [items, setItems] = useState<Reference[]>([]);
  const [libraryTotal, setLibraryTotal] = useState<number | null>(null);
  const [filters, setFilters] = useState<ReferenceFilters>(() =>
    filtersFromParams(searchParams),
  );
  const [draftQ, setDraftQ] = useState(() => searchParams.get("q") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>(() =>
    typeof window !== "undefined" &&
    window.localStorage.getItem(VIEW_KEY) === "index"
      ? "index"
      : "grid",
  );
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [facetsOpen, setFacetsOpen] = useState(false);

  useEffect(() => {
    api.getTaxonomy().then(setTaxonomy).catch(() => undefined);
    api
      .getDashboard()
      .then((d) => setLibraryTotal(d.total))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  useEffect(() => {
    const handle = window.setTimeout(
      () => setFilters((prev) => ({ ...prev, q: draftQ })),
      250,
    );
    return () => window.clearTimeout(handle);
  }, [draftQ]);

  useEffect(() => {
    setLoading(true);
    api
      .listReferences(filters)
      .then((res) => {
        setItems(res.items);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type) count += 1;
    if (filters.source) count += 1;
    for (const axis of [
      "industries",
      "pageTypes",
      "styles",
      "patterns",
      "tags",
    ] as const) {
      count += filters[axis]?.length ?? 0;
    }
    return count;
  }, [filters]);

  function clearFilters() {
    setDraftQ("");
    setFilters(emptyFilters);
  }

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected([]);
  }

  function filterBy(
    axis: "styles" | "patterns" | "type" | "source",
    value: string,
  ) {
    setFilters((prev) => {
      if (axis === "type" || axis === "source") {
        return { ...prev, [axis]: prev[axis] === value ? "" : value };
      }
      const current = prev[axis] ?? [];
      return current.includes(value)
        ? prev
        : { ...prev, [axis]: [...current, value] };
    });
  }

  const cardProps = (ref: Reference) => ({
    reference: ref,
    selectable: selectMode,
    selected: selected.includes(ref.id),
    onToggleSelect: toggleSelect,
    onFilterBy: filterBy,
  });

  const filtered = activeFilterCount > 0 || Boolean(filters.q);

  return (
    <div className="flex min-w-0 flex-col gap-8 overflow-x-hidden">
      <header className="flex flex-col gap-5 border-b border-border pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <Meta className="text-primary">Library index</Meta>
            <h1 className="font-display text-3xl tracking-tight md:text-4xl">
              Library
            </h1>
            <p className="prose-measure text-sm text-ink-2">
              Metadata-first vault.{" "}
              <span className="font-mono text-primary">whySaved</span> stays
              visible — imagery is optional, judgment is not.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={selectMode ? "default" : "outline"}
              onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            >
              {selectMode ? "Done" : "Select"}
            </Button>
            <Button asChild variant="outline">
              <Link to="/references/quick-import">Quick Import</Link>
            </Button>
            <Button asChild>
              <Link to="/references/new">Add Reference</Link>
            </Button>
          </div>
        </div>

        <FilterSentence
          taxonomy={taxonomy}
          filters={filters}
          onChange={setFilters}
        />
      </header>

      <div className="flex min-w-0 flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "References", value: libraryTotal ?? "—" },
              { label: "Visible", value: loading ? "—" : items.length },
              { label: "Active filters", value: activeFilterCount },
              { label: "View", value: view },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-3 md:p-4">
                  <Meta>{s.label}</Meta>
                  <div className="tabular mt-1 font-display text-2xl leading-none capitalize">
                    {s.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="mono-ui h-11 border-rule-strong bg-card pl-9"
              placeholder="Search title, description, URL, source…"
              aria-label="Search references"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Google Fonts: "1,942 of 1,942 families" — filtered and total. */}
              <Meta className="tabular" aria-live="polite">
                {loading
                  ? "Loading…"
                  : `${items.length} of ${libraryTotal ?? items.length} references`}
              </Meta>
              <ActiveChips filters={filters} onChange={setFilters} />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFacetsOpen(true)}
              >
                Facets{activeFilterCount ? ` · ${activeFilterCount}` : ""}
              </Button>
              <ViewToggle value={view} onChange={setView} />
            </div>
          </div>

          {selectMode && (
            <div className="sticky top-4 z-30 flex flex-wrap items-center justify-between gap-3 border border-rule-strong bg-card px-4 py-3">
              <Meta className="tabular text-foreground">
                {selected.length} selected
              </Meta>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelected(items.map((i) => i.id))}
                >
                  Select all visible
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected([])}
                  disabled={!selected.length}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  disabled={!selected.length}
                  onClick={() => setPickerOpen(true)}
                >
                  <FolderPlus /> Add to Collection
                </Button>
              </div>
            </div>
          )}

          {error && <ErrorNote>{error}</ErrorNote>}

          {!loading && items.length === 0 ? (
            <Empty
              action={
                filtered ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Reset filters
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/references/new">Add the first reference</Link>
                  </Button>
                )
              }
            >
              No references match these filters.
            </Empty>
          ) : view === "grid" ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
              {items.map((ref) => (
                <ReferenceCard key={ref.id} {...cardProps(ref)} />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-border bg-card">
              {items.map((ref) => (
                <ReferenceRow key={ref.id} {...cardProps(ref)} />
              ))}
            </div>
          )}
        </div>

      <Sheet open={facetsOpen} onOpenChange={setFacetsOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
            <SheetTitle className="font-display text-xl">Facets</SheetTitle>
          </SheetHeader>
          <div className="thin-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-5">
            <FacetRail
              taxonomy={taxonomy}
              filters={filters}
              onChange={setFilters}
            />
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-3">
            {filtered && (
              <Button type="button" variant="outline" onClick={clearFilters}>
                Reset
              </Button>
            )}
            <Button type="button" onClick={() => setFacetsOpen(false)}>
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AddToCollectionDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        referenceIds={selected}
        onAdded={exitSelectMode}
      />
    </div>
  );
}
