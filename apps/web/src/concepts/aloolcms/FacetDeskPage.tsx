import { useState } from "react";
import { ALOOLCMS_DIRECTIONS, type AloolcmsScreen } from "./directions";
import { PrototypeChrome } from "./PrototypeChrome";
import "./aloolcms.css";
import "./facet.css";

const dir = ALOOLCMS_DIRECTIONS[4]!;

const FACETS = [
  ["Programmes", "8"],
  ["Projects", "12"],
  ["Posts", "24"],
  ["Team", "9"],
  ["Partners", "6"],
  ["Resources", "11"],
] as const;

export function FacetDeskPage() {
  const [screen, setScreen] = useState<AloolcmsScreen>("catalogue");
  const [facet, setFacet] = useState("Programmes");

  return (
    <div className="facet">
      <PrototypeChrome direction={dir} screen={screen} onScreen={setScreen} />
      <div className="facet__shell">
        <aside className="facet__rail" aria-label="Facets">
          <div className="facet__brand">Alool · facet</div>
          <label className="facet__search">
            <span>⌘K</span>
            <input placeholder="Search collections…" readOnly />
          </label>
          <div className="facet__list">
            {FACETS.map(([name, count]) => (
              <button
                key={name}
                type="button"
                className={facet === name ? "on" : undefined}
                onClick={() => { setFacet(name); setScreen("catalogue"); }}
              >
                <span>{name}</span>
                <em>{count}</em>
              </button>
            ))}
          </div>
        </aside>
        <main className="facet__main">
          {screen === "desk" && (
            <>
              <h1>Continue</h1>
              <div className="facet__chips">
                <button type="button">modified:home</button>
                <button type="button">draft:programmes</button>
                <button type="button">inbox:3</button>
              </div>
              <div className="facet__suggest">
                <p>Suggestions</p>
                <button type="button" onClick={() => setScreen("composer")}>Open Home composer</button>
                <button type="button" onClick={() => setScreen("catalogue")}>Browse Programmes</button>
              </div>
            </>
          )}
          {screen === "catalogue" && (
            <>
              <header className="facet__head">
                <div>
                  <div className="facet__k">Collection</div>
                  <h1>{facet}</h1>
                </div>
                <button type="button" className="facet__btn">New</button>
              </header>
              <div className="facet__results">
                <article><strong>Field clinics</strong><span>live · order 1</span></article>
                <article><strong>Water access</strong><span>live · order 2</span></article>
                <article className="dim"><strong>Teacher training</strong><span>draft · order 3</span></article>
              </div>
            </>
          )}
          {screen === "composer" && (
            <>
              <header className="facet__head">
                <div>
                  <div className="facet__k">Page</div>
                  <h1>Home</h1>
                </div>
                <button type="button" className="facet__btn">Publish</button>
              </header>
              <div className="facet__compose">
                <div className="facet__block"><em>Hero</em>Build sites without touching code.</div>
                <div className="facet__block"><em>ProgrammeGrid</em>Featured · 3 from Programmes</div>
              </div>
            </>
          )}
          {screen === "empty" && (
            <div className="facet__empty">
              <h1>No matches</h1>
              <p>Try another facet, or:</p>
              <div className="facet__chips">
                <button type="button">status:draft</button>
                <button type="button">type:page</button>
                <button type="button">missing:og</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
