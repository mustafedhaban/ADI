import { Link } from "react-router-dom";
import {
  ALOOLCMS_SCREENS,
  type AloolcmsDirection,
  type AloolcmsScreen,
} from "./directions";

export function PrototypeChrome({
  direction,
  screen,
  onScreen,
}: {
  direction: AloolcmsDirection;
  screen: AloolcmsScreen;
  onScreen: (s: AloolcmsScreen) => void;
}) {
  return (
    <div className="acp-bar">
      <div className="acp-bar__nav">
        <Link to="/concepts/aloolcms">← Explorer</Link>
        <strong>
          {direction.number} · {direction.title}
        </strong>
      </div>
      <div className="acp-bar__tabs" role="tablist" aria-label="Prototype screens">
        {ALOOLCMS_SCREENS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-pressed={screen === s.id}
            onClick={() => onScreen(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="acp-evidence">
        Evidence: {direction.evidence.slice(0, 4).join(" · ")}. Do not paste:{" "}
        {direction.antiPaste.slice(0, 2).join(", ")}.
      </p>
    </div>
  );
}
