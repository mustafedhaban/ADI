import type { ReactNode } from "react";

/** Signature: Signal Rail — AI Editorial */
export function SignalRail({
  items,
}: {
  items: { idx: string; label: string; value: ReactNode }[];
}) {
  return (
    <aside className="r2a-signal" aria-label="Signal rail">
      {items.map((item) => (
        <div key={item.idx} className="r2a-signal__item">
          <span className="r2a-signal__idx">{item.idx}</span>
          <div>
            <span className="r2a-signal__label">{item.label}</span>
            <div className="r2a-signal__value">{item.value}</div>
          </div>
        </div>
      ))}
    </aside>
  );
}

export function EditorialMarker({
  num,
  label,
}: {
  num: string;
  label: string;
}) {
  return (
    <div className="r2a-marker">
      <span className="r2a-marker__num">{num}</span>
      <span className="r2a-marker__label">{label}</span>
    </div>
  );
}

export function EditorialRule() {
  return <div className="r2a__rule" aria-hidden="true" />;
}

export function EditorialTransition({ from, to }: { from: string; to: string }) {
  return (
    <div className="r2a-transition" aria-hidden="true">
      <span>{from}</span>
      <div className="r2a-transition__line" />
      <span>{to}</span>
    </div>
  );
}

export function TechnicalAnnotation({ children }: { children: ReactNode }) {
  return <span className="r2a__annot">{children}</span>;
}
