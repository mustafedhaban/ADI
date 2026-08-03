import { Link } from "react-router-dom";
import { Check, ExternalLink, ImageOff } from "lucide-react";
import type { Reference } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ReferenceCard({
  reference,
  selectable = false,
  selected = false,
  onToggleSelect,
}: {
  reference: Reference;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const content = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {reference.image ? (
          <img
            src={reference.image}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="size-8 opacity-50" />
            <span className="text-xs uppercase tracking-wide">No preview</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="secondary">{reference.type}</Badge>
        </div>
        {selectable && (
          <div
            className={cn(
              "absolute right-3 top-3 flex size-7 items-center justify-center rounded-full border bg-card/95",
              selected && "border-primary bg-primary text-primary-foreground",
            )}
          >
            {selected ? <Check className="size-4" /> : null}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">
            {reference.title}
          </h3>
          {!selectable && (
            <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{reference.source}</p>
        <div className="mt-auto flex flex-wrap gap-1.5">
          {reference.styles.slice(0, 3).map((style) => (
            <Badge key={style} variant="outline">
              {style}
            </Badge>
          ))}
          {reference.styles.length > 3 && (
            <Badge variant="outline">+{reference.styles.length - 3}</Badge>
          )}
        </div>
      </div>
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        onClick={() => onToggleSelect?.(reference.id)}
        className={cn(
          "group flex flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
          selected && "ring-2 ring-primary",
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={`/references/${reference.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {content}
    </Link>
  );
}
