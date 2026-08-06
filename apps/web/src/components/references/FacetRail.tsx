import { useState } from "react";
import type { ReferenceFilters, Taxonomy } from "@/lib/api";
import { Meta } from "@/components/common/Primitives";
import { StyleTerm } from "@/components/references/StyleTerm";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Facet rail — Obsidian Archive.
   Compact wrap pills inside a scroll-contained panel (not full-page height).
--------------------------------------------------------------------------- */

type ArrayAxis = "industries" | "pageTypes" | "styles" | "patterns" | "tags";

const INITIAL_VISIBLE = 8;

function PillGroup({
  label,
  options,
  values,
  onToggle,
  demonstrate = false,
  defaultOpen = false,
}: {
  label: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
  demonstrate?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || values.length > 0);
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? options : options.slice(0, INITIAL_VISIBLE);
  const hidden = options.length - visible.length;

  return (
    <fieldset className="flex flex-col gap-2 border-b border-border pb-4 last:border-0 last:pb-0">
      <legend className="sr-only">{label}</legend>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <Meta>
          {label}
          {values.length > 0 && (
            <span className="ml-1.5 text-primary">{values.length}</span>
          )}
        </Meta>
        <span className="font-mono text-[0.65rem] text-muted-foreground">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="flex flex-wrap gap-1.5">
          {visible.map((option) => {
            const on = values.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(option)}
                className={cn(
                  "border px-2 py-1 text-[0.75rem] leading-tight transition-colors",
                  on
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-card text-ink-2 hover:border-rule-strong hover:bg-surface-2",
                )}
              >
                {demonstrate ? <StyleTerm term={option} /> : option}
              </button>
            );
          })}
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="border border-dashed border-rule-strong px-2 py-1 font-mono text-[0.7rem] text-muted-foreground transition-colors hover:text-foreground"
            >
              +{hidden}
            </button>
          )}
          {expanded && options.length > INITIAL_VISIBLE && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="px-2 py-1 font-mono text-[0.7rem] text-muted-foreground transition-colors hover:text-foreground"
            >
              less
            </button>
          )}
        </div>
      )}
    </fieldset>
  );
}

export function FacetRail({
  taxonomy,
  filters,
  onChange,
}: {
  taxonomy: Taxonomy | null;
  filters: ReferenceFilters;
  onChange: (next: ReferenceFilters) => void;
}) {
  if (!taxonomy) return <Meta className="block py-4">Loading facets…</Meta>;

  function toggleArray(axis: ArrayAxis, value: string) {
    const current = filters[axis] ?? [];
    onChange({
      ...filters,
      [axis]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  }

  function toggleSingle(axis: "type" | "source", value: string) {
    onChange({ ...filters, [axis]: filters[axis] === value ? "" : value });
  }

  return (
    <div className="flex flex-col gap-4">
      <PillGroup
        label="Styles"
        options={taxonomy.styles}
        values={filters.styles ?? []}
        onToggle={(v) => toggleArray("styles", v)}
        demonstrate
        defaultOpen
      />
      <PillGroup
        label="Patterns"
        options={taxonomy.patterns}
        values={filters.patterns ?? []}
        onToggle={(v) => toggleArray("patterns", v)}
      />
      <PillGroup
        label="Industries"
        options={taxonomy.industries}
        values={filters.industries ?? []}
        onToggle={(v) => toggleArray("industries", v)}
      />
      <PillGroup
        label="Page types"
        options={taxonomy.pageTypes}
        values={filters.pageTypes ?? []}
        onToggle={(v) => toggleArray("pageTypes", v)}
      />
      <PillGroup
        label="Type"
        options={taxonomy.types}
        values={filters.type ? [filters.type] : []}
        onToggle={(v) => toggleSingle("type", v)}
      />
      <PillGroup
        label="Source"
        options={taxonomy.sources}
        values={filters.source ? [filters.source] : []}
        onToggle={(v) => toggleSingle("source", v)}
      />
      <PillGroup
        label="Tags"
        options={taxonomy.tags}
        values={filters.tags ?? []}
        onToggle={(v) => toggleArray("tags", v)}
      />
    </div>
  );
}
