/** Signature: Graphic Form — Future Studio */

export function StudioForm({
  variant = "hero",
}: {
  variant?: "hero" | "cta" | "footer";
}) {
  const cls =
    variant === "hero"
      ? "r2c-form r2c-form--hero"
      : variant === "cta"
        ? "r2c-form r2c-form--cta"
        : "r2c-form";

  return (
    <div className={cls} aria-hidden="true">
      <svg viewBox="0 0 200 200" role="presentation">
        <path
          className="r2c-form__a"
          d="M40 30 C110 10 170 40 175 95 C180 150 120 185 70 170 C25 155 10 90 40 30 Z"
        />
        <path
          className="r2c-form__b"
          d="M95 55 C140 50 165 85 155 120 C145 155 100 165 75 140 C50 115 55 70 95 55 Z"
        />
        <path
          className="r2c-form__c"
          d="M30 120 C70 95 130 100 160 140"
        />
      </svg>
    </div>
  );
}

export function StudioMark() {
  return (
    <span className="r2c-mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" role="presentation">
        <path
          fill="currentColor"
          opacity="0.85"
          d="M8 6 C22 2 34 10 35 20 C36 31 24 38 14 34 C5 30 2 16 8 6 Z"
        />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          d="M12 28 C20 22 28 24 32 30"
        />
      </svg>
    </span>
  );
}

export function StudioTransition({ label }: { label: string }) {
  return (
    <div className="r2c-transition" aria-hidden="true">
      <div className="r2c-transition__bar" />
      <div className="r2c-transition__label">
        <StudioMark />
        <span>{label}</span>
        <StudioMark />
      </div>
    </div>
  );
}
