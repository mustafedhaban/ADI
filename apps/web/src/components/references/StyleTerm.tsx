import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Self-demonstrating taxonomy — evidence: Google Fonts.

   Its "Feeling" filter pills are each SET IN THE STYLE THEY NAME — "Fancy" in
   a script, "Vintage" in a vintage face, "Sophisticated" in a Didone. The
   filter demonstrates itself.

   ADI does the same for its 25 style terms. Because a design library's whole
   claim is that it understands visual character, a style term rendered in a
   neutral UI font is a wasted assertion.
--------------------------------------------------------------------------- */

/** `Modern African` -> `sty-modern-african`; `Human-centered` -> `sty-human-centered` */
function styleClass(term: string): string {
  return `sty sty-${term.toLowerCase().replace(/\s+/g, "-")}`;
}

export function StyleTerm({
  term,
  className,
}: {
  term: string;
  className?: string;
}) {
  return <span className={cn(styleClass(term), className)}>{term}</span>;
}
