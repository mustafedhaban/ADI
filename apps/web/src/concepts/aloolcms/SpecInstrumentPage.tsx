import { useState } from "react";
import { ALOOLCMS_DIRECTIONS, type AloolcmsScreen } from "./directions";
import { PrototypeChrome } from "./PrototypeChrome";
import "./aloolcms.css";
import "./spec.css";

const dir = ALOOLCMS_DIRECTIONS[1]!;

export function SpecInstrumentPage() {
  const [screen, setScreen] = useState<AloolcmsScreen>("desk");

  return (
    <div className="spec">
      <PrototypeChrome direction={dir} screen={screen} onScreen={setScreen} />
      <div className="spec__shell">
        <aside className="spec__rail" aria-label="Icon rail">
          {["IN", "PG", "CT", "MD", "SY"].map((g, i) => (
            <button key={g} type="button" className={i === 0 ? "on" : undefined} aria-label={g}>{g}</button>
          ))}
        </aside>
        <div className="spec__main">
          <div className="spec__cmd" role="search">
            <span>⌘K</span>
            <input readOnly value="Jump to page, conflict, collection…" />
          </div>
          {screen === "desk" && (
            <div className="spec__cols">
              <section>
                <h2>Signals</h2>
                <div className="spec__sig"><i /><div><strong>Home unpublished</strong><em>MOD · 2m</em></div></div>
                <div className="spec__sig"><i className="warn" /><div><strong>Broken programme ref</strong><em>ERR · block 3</em></div></div>
                <div className="spec__sig"><i /><div><strong>3 submissions</strong><em>INBOX</em></div></div>
              </section>
              <section>
                <h2>Active surface</h2>
                <div className="spec__panel">
                  <header><b>ENG-page</b><span>modified</span></header>
                  <p>Home · Hero headline changed since publish. Diff available.</p>
                  <div className="spec__meter" /><div className="spec__meter short" />
                </div>
              </section>
              <section>
                <h2>Inspector</h2>
                <dl>
                  <div><dt>Status</dt><dd>modified</dd></div>
                  <div><dt>Path</dt><dd>/</dd></div>
                  <div><dt>Blocks</dt><dd>4</dd></div>
                  <div><dt>Latency</dt><dd>42ms</dd></div>
                </dl>
              </section>
            </div>
          )}
          {screen === "catalogue" && (
            <div className="spec__table-wrap">
              <h1>Collections · programmes</h1>
              <table>
                <thead><tr><th>id</th><th>title</th><th>pub</th><th>ord</th></tr></thead>
                <tbody>
                  <tr><td>08</td><td>Field clinics</td><td>1</td><td>1</td></tr>
                  <tr><td>12</td><td>Water access</td><td>1</td><td>2</td></tr>
                  <tr className="dim"><td>19</td><td>Teacher training</td><td>0</td><td>3</td></tr>
                </tbody>
              </table>
            </div>
          )}
          {screen === "composer" && (
            <div className="spec__cols composer">
              <section>
                <h2>Blocks</h2>
                <div className="spec__block on">01 Hero</div>
                <div className="spec__block">02 ProgrammeGrid</div>
                <div className="spec__block">03 CTA</div>
              </section>
              <section>
                <h2>Content</h2>
                <label>headline<input defaultValue="Build sites without touching code." /></label>
                <label>deck<textarea defaultValue="Editors compose. Developers register sections." rows={3} /></label>
              </section>
              <section>
                <h2>Preview JSON</h2>
                <pre>{`{\n  "type": "Hero",\n  "headline": "Build sites…"\n}`}</pre>
              </section>
            </div>
          )}
          {screen === "empty" && (
            <div className="spec__empty">
              <h1>No signals</h1>
              <p>Open ⌘K to jump to a page or collection. Quiet is healthy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
