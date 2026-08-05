import { Link } from "react-router-dom";

/** Minimal chrome for concept review — not part of any concept's brand. */
export function ConceptBackLink({
  tone = "dark",
  to = "/concepts",
  label = "All concepts",
}: {
  tone?: "dark" | "light";
  to?: string;
  label?: string;
}) {
  return (
    <Link
      to={to}
      className={
        tone === "dark"
          ? "fixed bottom-4 left-4 z-[100] rounded-full border border-white/20 bg-black/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur hover:bg-black"
          : "fixed bottom-4 left-4 z-[100] rounded-full border border-black/15 bg-white/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-black backdrop-blur hover:bg-white"
      }
    >
      {label}
    </Link>
  );
}
