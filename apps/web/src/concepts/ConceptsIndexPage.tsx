import { Link } from "react-router-dom";
import { CONCEPTS } from "./shared/provisional";
import "./concepts.css";

/** Concept Explorer — navigation only, not one of the five designs. */
export function ConceptsIndexPage() {
  return (
    <div className="cx-index">
      <div className="cx-index__inner">
        <p className="cx-index__eyebrow">Alool Technologies · Round 1</p>
        <h1 className="cx-index__title">Homepage concept explorer</h1>
        <p className="cx-index__lede">
          Five strategically different homepage directions. Round 2 advanced AI-First
          and Premium Creative Technology. Final selection: Future Studio × Graphic
          Form.
        </p>
        <p
          style={{
            margin: "0 0 1rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <Link
            to="/concepts/final"
            style={{
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#c8b59a",
              textDecoration: "none",
              borderBottom: "1px solid #2a2a2a",
              paddingBottom: "0.2rem",
            }}
          >
            Open final homepage →
          </Link>
          <Link
            to="/concepts/round-2"
            style={{
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#9a958a",
              textDecoration: "none",
              borderBottom: "1px solid #2a2a2a",
              paddingBottom: "0.2rem",
            }}
          >
            Round 2 explorer →
          </Link>
        </p>
        <ul className="cx-index__list">
          {CONCEPTS.map((c) => {
            const advanced =
              c.id === "ai-first" || c.id === "creative-technology";
            return (
              <li key={c.id} className="cx-index__item">
                <Link to={c.path}>
                  <span className="cx-index__num">{c.number}</span>
                  <span className="cx-index__name">
                    {c.title}
                    {advanced ? " · advanced" : ""}
                  </span>
                  <span className="cx-index__go">Open →</span>
                  <span className="cx-index__blurb">{c.blurb}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
