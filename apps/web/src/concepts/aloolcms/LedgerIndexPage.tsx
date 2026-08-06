import { useState } from "react";
import { ALOOLCMS_DIRECTIONS, type AloolcmsScreen } from "./directions";
import { PrototypeChrome } from "./PrototypeChrome";
import "./aloolcms.css";
import "./ledger.css";

const dir = ALOOLCMS_DIRECTIONS[3]!;

export function LedgerIndexPage() {
  const [screen, setScreen] = useState<AloolcmsScreen>("desk");

  return (
    <div className="ledger">
      <PrototypeChrome direction={dir} screen={screen} onScreen={setScreen} />
      <header className="ledger__mast">
        <div>
          <div className="ledger__badge">Official console</div>
          <div className="ledger__word">AloolCMS</div>
        </div>
        <nav aria-label="Primary">
          <button type="button" className={screen === "desk" ? "on" : undefined} onClick={() => setScreen("desk")}>Index</button>
          <button type="button" className={screen === "catalogue" ? "on" : undefined} onClick={() => setScreen("catalogue")}>Register</button>
          <button type="button" className={screen === "composer" ? "on" : undefined} onClick={() => setScreen("composer")}>Pages</button>
          <button type="button" className={screen === "empty" ? "on" : undefined} onClick={() => setScreen("empty")}>Media</button>
        </nav>
      </header>

      {screen === "desk" && (
        <main className="ledger__main">
          <h1>Publication index</h1>
          <div className="ledger__tiles">
            <article><em>01</em><h2>Pages</h2><p>12 records · 2 modified</p></article>
            <article><em>02</em><h2>Programmes</h2><p>8 records · 1 draft</p></article>
            <article><em>03</em><h2>Submissions</h2><p>3 unread</p></article>
          </div>
        </main>
      )}

      {screen === "catalogue" && (
        <main className="ledger__main">
          <h1>Content register · Programmes</h1>
          <table className="ledger__table">
            <thead><tr><th>No.</th><th>Title</th><th>Slug</th><th>Stamp</th></tr></thead>
            <tbody>
              <tr><td>01</td><td>Field clinics</td><td>field-clinics</td><td><span className="stamp live">Published</span></td></tr>
              <tr><td>02</td><td>Water access</td><td>water</td><td><span className="stamp live">Published</span></td></tr>
              <tr><td>03</td><td>Teacher training</td><td>teachers</td><td><span className="stamp draft">Draft</span></td></tr>
            </tbody>
          </table>
        </main>
      )}

      {screen === "composer" && (
        <main className="ledger__main">
          <div className="ledger__record-head">
            <h1>Record · Home</h1>
            <span className="stamp mod">Modified</span>
          </div>
          <div className="ledger__record">
            <section>
              <h3>01 · Hero</h3>
              <p>Build sites without touching code.</p>
            </section>
            <section>
              <h3>02 · Programme grid</h3>
              <p>Featured · limit 3</p>
            </section>
          </div>
        </main>
      )}

      {screen === "empty" && (
        <main className="ledger__main ledger__empty">
          <h1>No records in this register</h1>
          <p>Begin a programme entry. Status stamps appear after first save.</p>
          <button type="button">Start record</button>
        </main>
      )}
    </div>
  );
}
