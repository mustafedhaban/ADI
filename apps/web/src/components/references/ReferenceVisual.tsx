import { useState } from "react";
import type { CaptureStatus, Reference } from "@/lib/api";
import { StyleTerm } from "@/components/references/StyleTerm";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Reference visual — v2.

   Precedence: captured thumbnail -> author-supplied `image` -> style specimen.

   The specimen is not a placeholder to be embarrassed about; it is the design
   direction's answer to a metadata-rich, image-poor archive (Google Fonts'
   model, where the content renders itself). It stays the fallback even now
   that captures exist, because a capture can legitimately fail.
--------------------------------------------------------------------------- */

const STATUS_LABEL: Record<CaptureStatus, string> = {
  pending: "Not captured",
  queued: "Queued",
  processing: "Capturing…",
  completed: "Captured",
  failed: "Capture failed",
};

export function CaptureBadge({
  status,
  className,
}: {
  status: CaptureStatus;
  className?: string;
}) {
  if (status === "completed") return null;
  return (
    <span
      className={cn(
        "meta inline-flex items-center gap-1.5",
        status === "failed" ? "text-destructive" : "text-signal",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block size-1.5 rounded-full",
          status === "failed" ? "bg-destructive" : "bg-signal",
          status === "processing" && "animate-pulse",
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ReferenceVisual({
  reference,
  aspect = "4/3",
  className,
}: {
  reference: Reference;
  aspect?: "4/3" | "16/9";
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const src = !broken ? (reference.thumbnailUrl ?? reference.image) : null;

  const box = cn(
    "relative overflow-hidden bg-surface-2",
    aspect === "4/3" ? "aspect-4/3" : "aspect-video",
    className,
  );

  if (src) {
    return (
      <div className={box}>
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          className="size-full object-cover object-top"
        />
      </div>
    );
  }

  // Specimen fallback — the reference's own visual character.
  const terms = reference.styles.slice(0, 3);
  return (
    <div className={cn(box, "flex items-center justify-center px-5 py-4")}>
      {terms.length ? (
        <p className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-center text-lg leading-snug text-ink-2">
          {terms.map((term, i) => (
            <span key={term} className="inline-flex items-baseline gap-3">
              {i > 0 && (
                <span aria-hidden className="text-rule-strong">
                  /
                </span>
              )}
              <StyleTerm term={term} />
            </span>
          ))}
        </p>
      ) : (
        <span className="meta">{reference.source}</span>
      )}
    </div>
  );
}
