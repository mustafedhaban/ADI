import { useState } from "react";
import { ALOOLCMS_DIRECTIONS, type AloolcmsScreen } from "./directions";
import { PrototypeChrome } from "./PrototypeChrome";
import "./aloolcms.css";
import "./compose.css";

const dir = ALOOLCMS_DIRECTIONS[2]!;

export function ComposePairPage() {
  const [screen, setScreen] = useState<AloolcmsScreen>("composer");

  return (
    <div className="compose">
      <PrototypeChrome direction={dir} screen={screen} onScreen={setScreen} />
      <header className="compose__top">
        <div className="compose__brand">ALOOL<b />COMPOSE</div>
        <div>
          <button type="button" className={screen === "catalogue" ? "on" : undefined} onClick={() => setScreen("catalogue")}>Modules</button>
          <button type="button">Media</button>
          <button type="button" className="p">Publish</button>
        </div>
      </header>

      {screen === "desk" && (
        <div className="compose__desk">
          <h1>Open a page to compose</h1>
          <div className="compose__tiles">
            <button type="button" onClick={() => setScreen("composer")}><em>Page</em>Home</button>
            <button type="button" onClick={() => setScreen("composer")}><em>Page</em>About</button>
            <button type="button" onClick={() => setScreen("empty")}><em>New</em>From template</button>
          </div>
        </div>
      )}

      {(screen === "composer" || screen === "catalogue") && (
        <div className="compose__ws">
          <aside className="compose__box">
            <div className="compose__h">{screen === "catalogue" ? "Collections" : "Modules"}</div>
            {screen === "catalogue" ? (
              <>
                <div className="compose__mod">Programmes<small>collection</small></div>
                <div className="compose__mod">Posts<small>collection</small></div>
                <div className="compose__mod">Team<small>collection</small></div>
                <div className="compose__mod">Stats<small>collection</small></div>
              </>
            ) : (
              <>
                <div className="compose__mod">Hero<small>section</small></div>
                <div className="compose__mod">Programme grid<small>collectionRef</small></div>
                <div className="compose__mod">CTA<small>section</small></div>
                <div className="compose__mod">Rich text<small>section</small></div>
              </>
            )}
          </aside>
          <section className="compose__box">
            <div className="compose__bar"><h1>Home</h1><span>paired preview →</span></div>
            <div className="compose__blocks">
              <article><span>Hero</span><h3>Build sites without touching code.</h3><p>Editors compose. Developers register sections. Collections stay typed.</p></article>
              <article><span>Programme grid</span><h3>Featured · 3</h3><p>Resolved server-side — never copied into JSON.</p></article>
            </div>
          </section>
          <aside className="compose__box">
            <div className="compose__h">Inspector</div>
            <div className="compose__field"><label>Headline</label><input defaultValue="Build sites without touching code." /></div>
            <div className="compose__field"><label>Deck</label><textarea rows={3} defaultValue="Editors compose. Developers register sections." /></div>
            <div className="compose__field"><label>Mode</label><input defaultValue="featured · limit 3" /></div>
          </aside>
        </div>
      )}

      {screen === "empty" && (
        <div className="compose__empty">
          <div className="compose__grid-mark" />
          <h1>Drop a module</h1>
          <p>Canvas is empty. Add Hero, or start from Marketing landing.</p>
          <button type="button" className="p" onClick={() => setScreen("composer")}>Add Hero</button>
        </div>
      )}
    </div>
  );
}
