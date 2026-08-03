import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckSquare, FolderPlus, Link2, Plus, Search, X } from "lucide-react";
import {
  api,
  type Reference,
  type ReferenceFilters,
  type Taxonomy,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReferenceCard } from "@/components/references/ReferenceCard";
import { MultiCheckGroup } from "@/components/references/MultiCheckGroup";
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

export function LibraryPage() {
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [items, setItems] = useState<Reference[]>([]);
  const [filters, setFilters] = useState<ReferenceFilters>(emptyFilters);
  const [draftQ, setDraftQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    api.getTaxonomy().then(setTaxonomy).catch(() => undefined);
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setFilters((prev) => ({ ...prev, q: draftQ }));
    }, 250);
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
    count += filters.industries?.length ?? 0;
    count += filters.pageTypes?.length ?? 0;
    count += filters.styles?.length ?? 0;
    count += filters.patterns?.length ?? 0;
    count += filters.tags?.length ?? 0;
    return count;
  }, [filters]);

  function clearFilters() {
    setDraftQ("");
    setFilters(emptyFilters);
  }

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected([]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight">
            Reference Library
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse by image, then refine with taxonomy filters.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={selectMode ? "default" : "outline"}
            onClick={() => {
              if (selectMode) exitSelectMode();
              else setSelectMode(true);
            }}
          >
            <CheckSquare /> {selectMode ? "Done" : "Select"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/references/quick-import">
              <Link2 /> Quick Import URL
            </Link>
          </Button>
          <Button asChild>
            <Link to="/references/new">
              <Plus /> Add Reference
            </Link>
          </Button>
        </div>
      </div>

      {selectMode && (
        <div className="sticky top-[72px] z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
          <p className="text-sm font-medium">
            {selected.length} selected
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelected(items.map((item) => item.id))}
            >
              Select all visible
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelected([])}
              disabled={!selected.length}
            >
              <X /> Clear
            </Button>
            <Button
              type="button"
              disabled={!selected.length}
              onClick={() => setPickerOpen(true)}
            >
              <FolderPlus /> Add to Collection
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border bg-card/70 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search title, description, URL, source…"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters((v) => !v)}
          >
            Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </Button>
          {(activeFilterCount > 0 || draftQ) && (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              <X /> Clear
            </Button>
          )}
        </div>

        {showFilters && taxonomy && (
          <div className="grid gap-4 border-t pt-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    type: value === "all" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {taxonomy.types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Source</Label>
              <Select
                value={filters.source || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    source: value === "all" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {taxonomy.sources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <MultiCheckGroup
              label="Industries"
              options={taxonomy.industries}
              values={filters.industries ?? []}
              onChange={(industries) =>
                setFilters((prev) => ({ ...prev, industries }))
              }
            />
            <MultiCheckGroup
              label="Page types"
              options={taxonomy.pageTypes}
              values={filters.pageTypes ?? []}
              onChange={(pageTypes) =>
                setFilters((prev) => ({ ...prev, pageTypes }))
              }
            />
            <MultiCheckGroup
              label="Styles"
              options={taxonomy.styles}
              values={filters.styles ?? []}
              onChange={(styles) => setFilters((prev) => ({ ...prev, styles }))}
            />
            <MultiCheckGroup
              label="Patterns"
              options={taxonomy.patterns}
              values={filters.patterns ?? []}
              onChange={(patterns) =>
                setFilters((prev) => ({ ...prev, patterns }))
              }
            />
            <MultiCheckGroup
              label="Tags"
              options={taxonomy.tags}
              values={filters.tags ?? []}
              onChange={(tags) => setFilters((prev) => ({ ...prev, tags }))}
              className="md:col-span-2"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {loading
            ? "Loading…"
            : `${items.length} reference${items.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-card p-4 text-destructive">
          {error}
        </div>
      )}

      {!loading && items.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          No references match these filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ref) => (
            <ReferenceCard
              key={ref.id}
              reference={ref}
              selectable={selectMode}
              selected={selected.includes(ref.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      <AddToCollectionDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        referenceIds={selected}
        onAdded={exitSelectMode}
      />
    </div>
  );
}
