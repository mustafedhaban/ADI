import { Link } from "react-router-dom";
import { ROUND2_CONCEPTS } from "../shared/provisional";
import { ALOOL_PROVISIONAL, SELECTED_DIRECTION } from "./tokens";
import "./round2.css";
import "./identity.css";
import "../final/final.css";

/** Round 2 explorer — Future Studio marked as selected. */
export function Round2IndexPage() {
  return (
    <div className="r2-index">
      <div className="r2-index__inner">
        <p className="r2-index__eyebrow">Round 2 · Selection locked</p>
        <h1 className="r2-index__title">Three refined directions</h1>
        <p className="r2-index__lede">
          Review complete. Future Studio × Graphic Form is the selected final
          direction for the Alool Technologies website homepage.
        </p>

        <div className="r2-index__selected">
          <strong>
            Selected: {SELECTED_DIRECTION.title} · {SELECTED_DIRECTION.signature}
          </strong>
          <p>
            Parents: {SELECTED_DIRECTION.parents}. Round 1 and Round 2 concepts
            remain available for comparison.
          </p>
          <Link to={SELECTED_DIRECTION.finalPath}>Open final homepage →</Link>
        </div>

        <div className="r2-index__identity">
          <strong>Provisional Alool system.</strong> Shared tokens interpreted per
          concept. Not an official brand. Signatures: Signal Rail · Modular Grid ·
          Graphic Form.
        </div>

        <ul className="r2-index__list">
          {ROUND2_CONCEPTS.map((c) => {
            const chosen = c.id === SELECTED_DIRECTION.id;
            return (
              <li
                key={c.id}
                className={`r2-index__item${chosen ? " r2-index__item--chosen" : ""}`}
              >
                <Link to={c.path}>
                  <span className="r2-index__num">{c.number}</span>
                  <span className="r2-index__name">
                    {c.title}
                    {chosen ? <span className="r2-index__badge">Selected</span> : null}
                  </span>
                  <span className="r2-index__go">Open →</span>
                  <span className="r2-index__blurb">{c.blurb}</span>
                  <span className="r2-index__meta">
                    {c.parents} · Signature:{" "}
                    {
                      ALOOL_PROVISIONAL.signatures[
                        c.id as keyof typeof ALOOL_PROVISIONAL.signatures
                      ]
                    }
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="r2-index__links">
          <Link to={SELECTED_DIRECTION.finalPath}>Final homepage →</Link>
          <Link to="/concepts">← Round 1 explorer</Link>
          <Link to="/concepts/ai-first">Parent · AI-First</Link>
          <Link to="/concepts/creative-technology">Parent · Creative Technology</Link>
        </div>
      </div>
    </div>
  );
}
