/** Signature: Modular Grid System — Creative Systems */

export function ModularMark({ className = "" }: { className?: string }) {
  return (
    <span className={`r2b-mark ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

export function ModularUnit({
  size = 2,
  fill = false,
}: {
  size?: number;
  fill?: boolean;
}) {
  return (
    <span
      className={`r2b-unit${fill ? " r2b-unit--fill" : ""}`}
      style={{ ["--size" as string]: size }}
      aria-hidden="true"
    />
  );
}

export function SystemNodes({
  nodes,
}: {
  nodes: { code: string; label: string }[];
}) {
  return (
    <div className="r2b-nodes" aria-label="System diagram">
      <svg className="r2b-nodes__svg" viewBox="0 0 100 40" preserveAspectRatio="none">
        <path d="M8 20 H92" />
        <path d="M28 8 V32" />
        <path d="M52 8 V32" />
        <path d="M76 8 V32" />
      </svg>
      {nodes.map((n) => (
        <article key={n.code} className="r2b-node">
          <code>{n.code}</code>
          <strong>{n.label}</strong>
        </article>
      ))}
    </div>
  );
}

export function SystemsTransition({ label }: { label: string }) {
  return (
    <div className="r2b-transition" aria-hidden="true">
      <div className="r2b-transition__units">
        <ModularUnit size={1} fill />
        <ModularUnit size={1} />
        <ModularUnit size={1} />
        <ModularUnit size={2} />
      </div>
      <span className="r2b-transition__label">{label}</span>
      <ModularMark />
    </div>
  );
}
