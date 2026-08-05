import { ALOOL_PROVISIONAL } from "../tokens";

/** Marks provisional identity — not official brand. */
export function ProvisionalBadge({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span
      className="alool-provisional-mark"
      style={{ color: tone === "dark" ? "inherit" : undefined }}
      title={ALOOL_PROVISIONAL.note}
    >
      Provisional system
    </span>
  );
}
