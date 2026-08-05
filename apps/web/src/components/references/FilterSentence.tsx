import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ReferenceFilters, Taxonomy } from "@/lib/api";
import { StyleTerm } from "@/components/references/StyleTerm";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Filter sentence — evidence: Pentagram.

   Pentagram's archive filter is a readable sentence with inline dropdowns:
   "We design [Signage & Environmental Graphics ▾] for [Civic & Public ▾]".
   It turns a two-axis taxonomy into something you read rather than operate.

   ADI has five axes over 104 references, which is exactly where a wall of
   checkboxes stops being legible. This is the primary control; the pill
   facets below it are the secondary, exhaustive path.
--------------------------------------------------------------------------- */

function Slot({
  value,
  placeholder,
  options,
  onSelect,
  demonstrate = false,
}: {
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
  /** Render options in the character they name (styles only). */
  demonstrate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const label = value || placeholder;

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "inline-flex items-baseline gap-1.5 border-b-2 pb-0.5 transition-colors",
          value
            ? "border-primary text-foreground"
            : "border-rule-strong text-muted-foreground hover:border-foreground hover:text-foreground",
        )}
      >
        {demonstrate && value ? (
          <StyleTerm term={value} />
        ) : (
          <span>{label}</span>
        )}
        <ChevronDown aria-hidden className="size-3.5 shrink-0 self-center" />
      </button>

      {open && (
        <span className="thin-scroll absolute left-0 top-[calc(100%+6px)] z-40 block max-h-72 w-60 overflow-y-auto border bg-popover py-1 shadow-lg">
          {value && (
            <button
              type="button"
              onClick={() => {
                onSelect("");
                setOpen(false);
              }}
              className="meta block w-full px-3 py-1.5 text-left hover:bg-surface-2"
            >
              Any
            </button>
          )}
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onSelect(option);
                setOpen(false);
              }}
              className={cn(
                "block w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-surface-2",
                option === value && "bg-surface-2 font-medium",
              )}
            >
              {demonstrate ? <StyleTerm term={option} /> : option}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

export function FilterSentence({
  taxonomy,
  filters,
  onChange,
}: {
  taxonomy: Taxonomy | null;
  filters: ReferenceFilters;
  onChange: (next: ReferenceFilters) => void;
}) {
  if (!taxonomy) return null;

  /** The sentence drives the first value of each multi-value axis. */
  function setFirst(axis: "styles" | "patterns" | "industries", value: string) {
    const rest = (filters[axis] ?? []).slice(1);
    onChange({ ...filters, [axis]: value ? [value, ...rest] : rest });
  }

  return (
    <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-3 font-display text-2xl leading-relaxed md:text-[1.75rem]">
      <span className="text-ink-2">Show</span>
      <Slot
        value={filters.styles?.[0] ?? ""}
        placeholder="any style"
        options={taxonomy.styles}
        onSelect={(v) => setFirst("styles", v)}
        demonstrate
      />
      <span className="text-ink-2">references using</span>
      <Slot
        value={filters.patterns?.[0] ?? ""}
        placeholder="any pattern"
        options={taxonomy.patterns}
        onSelect={(v) => setFirst("patterns", v)}
      />
      <span className="text-ink-2">for</span>
      <Slot
        value={filters.industries?.[0] ?? ""}
        placeholder="any industry"
        options={taxonomy.industries}
        onSelect={(v) => setFirst("industries", v)}
      />
    </p>
  );
}
