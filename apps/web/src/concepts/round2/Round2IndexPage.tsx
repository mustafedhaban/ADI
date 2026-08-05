import { Link } from "react-router-dom";
import { ROUND2_CONCEPTS } from "../shared/provisional";
import { ALOOL_PROVISIONAL } from "./tokens";
import "./round2.css";
import "./identity.css";

/** Round 2 explorer — includes Round 3 identity notes. */
export function Round2IndexPage() {
  return (
    <div className="r2-index">
      <div className="r2-index__inner">
        <p className="r2-index__eyebrow">Round 2 · Visual identity pass</p>
        <h1 className="r2-index__title">Three refined directions</h1>
        <p className="r2-index__lede">
          Each concept now carries a distinctive visual system — signature motif,
          graphic language, and motion — so they remain recognizable without reading
          the title.
        </p>
        <div className="r2-index__identity">
          <strong>Provisional Alool system.</strong> Shared tokens (primary, accent,
          paper, motion) interpreted differently per concept. Not an official brand.
          Signatures: Signal Rail · Modular Grid · Graphic Form.
        </div>
        <p className="r2-index__parents">
          Parents · AI-First × Premium Creative · {ALOOL_PROVISIONAL.note}
        </p>
        <ul className="r2-index__list">
          {ROUND2_CONCEPTS.map((c) => (
            <li key={c.id} className="r2-index__item">
              <Link to={c.path}>
                <span className="r2-index__num">{c.number}</span>
                <span className="r2-index__name">{c.title}</span>
                <span className="r2-index__go">Open →</span>
                <span className="r2-index__blurb">{c.blurb}</span>
                <span className="r2-index__meta">
                  {c.parents} · Signature:{" "}
                  {ALOOL_PROVISIONAL.signatures[
                    c.id as keyof typeof ALOOL_PROVISIONAL.signatures
                  ]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="r2-index__links">
          <Link to="/concepts">← Round 1 explorer</Link>
          <Link to="/concepts/ai-first">Parent · AI-First</Link>
          <Link to="/concepts/creative-technology">Parent · Creative Technology</Link>
        </div>
      </div>
    </div>
  );
}
