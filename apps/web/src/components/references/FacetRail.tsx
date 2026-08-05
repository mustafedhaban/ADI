import { useState } from "react";
import type { ReferenceFilters, Taxonomy } from "@/lib/api";
import { Meta } from "@/components/common/Primitives";
import { StyleTerm } from "@/components/references/StyleTerm";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Facet pills — evidence: Hugging Face.

   Its model filters are wrapped PILL BUTTONS with a "+44" overflow, not
   stacked checkbox lists. Far denser and far more scannable. The previous
   ADI rail used seven collapsible checkbox groups, which needed roughly four
   screens of scrolling to see the vocabulary.

   Style pills are set in the character they name (Google Fonts' "Feeling").
--------------------------------------------------------------------------- */

type ArrayAxis = "industries" | "pageTypes" | "styles" | "patterns" | "tags";

const INITIAL_VISIBLE = 10;

function PillGroup({
  label,
  options,
  values,
  onToggle,
  demonstrate = false,
}: {
  label: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
  demonstrate?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? options : options.slice(0, INITIAL_VISIBLE);
  const hidden = options.length - visible.length;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">{label}</legend>
      <Meta>
        {label}
        {values.length > 0 && (
          <span className="ml-1.5 text-primary">{values.length}</span>
        )}
      </Meta>
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
                "border px-2 py-1 text-[0.8125rem] leading-tight transition-colors",
                on
                  ? "border-primary bg-primary text-primary-foreground"
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
            className="border border-dashed border-rule-strong px-2 py-1 font-mono text-[0.75rem] text-muted-foreground transition-colors hover:text-foreground"
          >
            +{hidden}
          </button>
        )}
        {expanded && options.length > INITIAL_VISIBLE && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="px-2 py-1 font-mono text-[0.75rem] text-muted-foreground transition-colors hover:text-foreground"
          >
            less
          </button>
        )}
      </div>
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
    <div className="flex flex-col gap-6">
      <PillGroup
        label="Styles"
        options={taxonomy.styles}
        values={filters.styles ?? []}
        onToggle={(v) => toggleArray("styles", v)}
        demonstrate
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
