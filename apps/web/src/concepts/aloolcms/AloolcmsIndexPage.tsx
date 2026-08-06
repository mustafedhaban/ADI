import { Link } from "react-router-dom";
import { ALOOLCMS_DIRECTIONS } from "./directions";
import "./aloolcms.css";

/** Live multi-screen explorer for AloolCMS console directions (ADI-owned). */
export function AloolcmsIndexPage() {
  return (
    <div className="acx">
      <div className="acx__inner">
        <p className="acx__eyebrow">ADI · AloolCMS Design System · Round 2</p>
        <h1 className="acx__title">Console directions</h1>
        <p className="acx__lede">
          Five Round 1 identities for the AloolCMS editorial console. D1 Folio Shell is
          the advancing finalist — deepened with D3 paired composer and D5 content
          facets. Each prototype still has Desk, Catalogue, Composer, Empty.
          Evaluation only — not production UI.
        </p>
        <p className="acx__meta">
          Project target: <code>~/Desktop/poc/aloolcms</code> · Evidence: collection{" "}
          <code>36f743c3…</code>
        </p>
        <ul className="acx__list">
          {ALOOLCMS_DIRECTIONS.map((d) => (
            <li key={d.id} className="acx__item">
              <Link to={d.path}>
                <span className="acx__num">{d.number}</span>
                <span className="acx__name">{d.title}</span>
                <span className="acx__go">Open →</span>
                <span className="acx__blurb">{d.blurb}</span>
                <span className="acx__row">
                  <em>{d.navModel}</em>
                  <em>{d.story}</em>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="acx__links">
          <Link to="/projects/5e3d5cb0-130d-498e-a7a6-f2ff4d31eb4e">← ADI project</Link>
          <Link to="/collections/36f743c3-ec00-4a24-b283-9fa62f0aad11">Research collection</Link>
        </div>
      </div>
    </div>
  );
}
