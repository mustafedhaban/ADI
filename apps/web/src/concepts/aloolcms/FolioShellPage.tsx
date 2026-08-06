import { useEffect, useState } from "react";
import { ALOOLCMS_DIRECTIONS, type AloolcmsScreen } from "./directions";
import { PrototypeChrome } from "./PrototypeChrome";
import "./aloolcms.css";
import "./folio.css";

const dir = ALOOLCMS_DIRECTIONS[0]!;

const CONTENT_TYPES = [
  { id: "programmes", label: "Programmes", count: 8 },
  { id: "posts", label: "Posts", count: 24 },
  { id: "projects", label: "Projects", count: 12 },
  { id: "team", label: "Team", count: 9 },
  { id: "partners", label: "Partners", count: 6 },
  { id: "resources", label: "Resources", count: 11 },
] as const;

const PROGRAMME_ROWS = [
  { title: "Field clinics", slug: "field-clinics", status: "LIVE", order: "01", touched: "14:02" },
  { title: "Water access", slug: "water", status: "LIVE", order: "02", touched: "YDAY" },
  { title: "Teacher training", slug: "teachers", status: "DRAFT", order: "03", touched: "MON" },
  { title: "Emergency response", slug: "emergency", status: "MOD", order: "04", touched: "08:41" },
] as const;

const MODULES = [
  { id: "hero", label: "Hero", kind: "section" },
  { id: "grid", label: "Programme grid", kind: "collectionRef" },
  { id: "cta", label: "CTA", kind: "section" },
  { id: "rich", label: "Rich text", kind: "section" },
  { id: "stats", label: "Stat strip", kind: "section" },
] as const;

const JUMP_ITEMS = [
  { label: "Home", meta: "page · modified", screen: "composer" as AloolcmsScreen },
  { label: "Programmes", meta: "collection", screen: "catalogue" as AloolcmsScreen },
  { label: "Desk", meta: "work queue", screen: "desk" as AloolcmsScreen },
  { label: "Teacher training", meta: "programme · draft", screen: "catalogue" as AloolcmsScreen },
  { label: "New page from template", meta: "create", screen: "empty" as AloolcmsScreen },
] as const;

export function FolioShellPage() {
  const [screen, setScreen] = useState<AloolcmsScreen>("desk");
  const [facet, setFacet] = useState<string>("programmes");
  const [activeBlock, setActiveBlock] = useState("hero");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openScreen = (next: AloolcmsScreen) => {
    setScreen(next);
    setCmdOpen(false);
    setCmdQuery("");
  };

  const filteredJump = JUMP_ITEMS.filter((item) => {
    if (!cmdQuery.trim()) return true;
    const q = cmdQuery.toLowerCase();
    return item.label.toLowerCase().includes(q) || item.meta.toLowerCase().includes(q);
  });

  const activeFacet =
    CONTENT_TYPES.find((t) => t.id === facet) ?? CONTENT_TYPES[0]!;

  return (
    <div className="folio">
      <PrototypeChrome direction={dir} screen={screen} onScreen={setScreen} />
      <div className="folio__shell">
        <aside className="folio__rail" aria-label="Primary">
          <div className="folio__brand">
            Alool<span>·</span>cms
            <small>Folio · Round 2</small>
          </div>
          <button
            type="button"
            className="folio__jump"
            onClick={() => setCmdOpen(true)}
          >
            <span>Jump to…</span>
            <kbd>⌘K</kbd>
          </button>
          <nav>
            <a
              className={screen === "desk" ? "on" : undefined}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setScreen("desk");
              }}
            >
              Desk
            </a>
            <div className="folio__g">
              <label>Site</label>
              <a href="#">Config</a>
              <a href="#">Navigation</a>
              <a href="#">Domains</a>
            </div>
            <div className="folio__g">
              <label>Pages</label>
              <a
                className={screen === "composer" ? "on" : undefined}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setScreen("composer");
                }}
              >
                All pages
              </a>
              <a
                className={screen === "empty" ? "on" : undefined}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setScreen("empty");
                }}
              >
                Templates
              </a>
            </div>
            <div className="folio__g">
              <label>Content</label>
              {CONTENT_TYPES.slice(0, 4).map((t) => (
                <a
                  key={t.id}
                  className={
                    screen === "catalogue" && facet === t.id ? "on" : undefined
                  }
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setFacet(t.id);
                    setScreen("catalogue");
                  }}
                >
                  {t.label}
                  <em>{t.count}</em>
                </a>
              ))}
              <a href="#">More…</a>
            </div>
            <div className="folio__g">
              <label>Library</label>
              <a href="#">Media</a>
              <a href="#">Sections</a>
            </div>
            <div className="folio__g">
              <label>System</label>
              <a href="#">Members</a>
              <a href="#">Audit</a>
            </div>
          </nav>
          <div className="folio__site">
            <span className="folio__k">Active site</span>
            <strong>Africa Global · Staging</strong>
          </div>
        </aside>

        <div className="folio__stage">
          {screen === "desk" && (
            <>
              <header className="folio__head folio__enter">
                <div>
                  <div className="folio__k">Today’s desk · Africa Global</div>
                  <h1>What needs an editor</h1>
                </div>
                <div className="folio__actions">
                  <button
                    type="button"
                    className="folio__cmd"
                    onClick={() => setCmdOpen(true)}
                  >
                    ⌘K Jump…
                  </button>
                  <button
                    type="button"
                    className="folio__btn"
                    onClick={() => setScreen("empty")}
                  >
                    New page
                  </button>
                </div>
              </header>
              <div className="folio__board folio__enter folio__enter--2">
                <section>
                  <div className="folio__sec-h">
                    <h2>Waiting on you</h2>
                    <span>4 items</span>
                  </div>
                  <button
                    type="button"
                    className="folio__row folio__row--action"
                    onClick={() => setScreen("composer")}
                  >
                    <span>
                      <strong>Home</strong>
                      <small>Unpublished edits · hero + programme grid</small>
                    </span>
                    <b>MODIFIED</b>
                  </button>
                  <button type="button" className="folio__row folio__row--action">
                    <span>
                      <strong>Programmes index</strong>
                      <small>Draft never published</small>
                    </span>
                    <b>DRAFT</b>
                  </button>
                  <button type="button" className="folio__row folio__row--action">
                    <span>
                      <strong>About</strong>
                      <small>Missing OG image</small>
                    </span>
                    <b>SEO</b>
                  </button>
                  <button type="button" className="folio__row folio__row--action">
                    <span>
                      <strong>Contact inbox</strong>
                      <small>3 new submissions</small>
                    </span>
                    <b>INBOX</b>
                  </button>
                </section>
                <section>
                  <div className="folio__sec-h">
                    <h2>Recently touched</h2>
                    <span>this week</span>
                  </div>
                  <div className="folio__row">
                    <span>Field clinic programme</span>
                    <b>14:02</b>
                  </div>
                  <div className="folio__row">
                    <span>Partner — Red Crescent</span>
                    <b>YDAY</b>
                  </div>
                  <div className="folio__row">
                    <span>Hero · Home</span>
                    <b>MON</b>
                  </div>
                  <div className="folio__row">
                    <span>Nav · primary</span>
                    <b>SUN</b>
                  </div>
                </section>
              </div>
              <div className="folio__signal folio__enter folio__enter--3">
                <div>
                  <div className="folio__k">Publish integrity</div>
                  <p>1 broken collection ref · 0 conflicts</p>
                </div>
                <button
                  type="button"
                  className="folio__ghost"
                  onClick={() => setScreen("composer")}
                >
                  Inspect Home →
                </button>
              </div>
            </>
          )}

          {screen === "catalogue" && (
            <>
              <header className="folio__head folio__enter">
                <div>
                  <div className="folio__k">Content · typed collections</div>
                  <h1>{activeFacet.label}</h1>
                </div>
                <div className="folio__actions">
                  <button
                    type="button"
                    className="folio__cmd"
                    onClick={() => setCmdOpen(true)}
                  >
                    ⌘K
                  </button>
                  <button type="button" className="folio__btn">
                    New {activeFacet.label.slice(0, -1).toLowerCase()}
                  </button>
                </div>
              </header>
              <div className="folio__facets folio__enter folio__enter--2">
                {CONTENT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={facet === t.id ? "on" : undefined}
                    onClick={() => setFacet(t.id)}
                  >
                    {t.label}
                    <em>{t.count}</em>
                  </button>
                ))}
              </div>
              <div className="folio__filters folio__enter folio__enter--2">
                <button type="button" className="on">
                  All
                </button>
                <button type="button">Live</button>
                <button type="button">Draft</button>
                <button type="button">Modified</button>
                <span className="folio__filters-hint">status · order · slug</span>
              </div>
              <table className="folio__table folio__enter folio__enter--3">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th>Order</th>
                    <th>Touched</th>
                  </tr>
                </thead>
                <tbody>
                  {PROGRAMME_ROWS.map((row) => (
                    <tr key={row.slug}>
                      <td>{row.title}</td>
                      <td className="mono">{row.slug}</td>
                      <td>
                        <b data-st={row.status}>{row.status}</b>
                      </td>
                      <td className="mono">{row.order}</td>
                      <td className="mono mute">{row.touched}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {screen === "composer" && (
            <>
              <header className="folio__head folio__enter">
                <div>
                  <div className="folio__k">Pages · Home · paired preview</div>
                  <h1>Compose Home</h1>
                </div>
                <div className="folio__actions">
                  <span className="folio__tag">MODIFIED</span>
                  <button type="button" className="folio__ghost">
                    Preview
                  </button>
                  <button type="button" className="folio__btn">
                    Publish
                  </button>
                </div>
              </header>
              <div className="folio__compose folio__enter folio__enter--2">
                <aside className="folio__dock" aria-label="Modules">
                  <div className="folio__dock-h">Modules</div>
                  {MODULES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={activeBlock === m.id ? "on" : undefined}
                      onClick={() => setActiveBlock(m.id)}
                    >
                      <span>{m.label}</span>
                      <small>{m.kind}</small>
                    </button>
                  ))}
                  <p className="folio__dock-hint">
                    Drag onto canvas · registered by developers
                  </p>
                </aside>

                <div className="folio__canvas">
                  <button
                    type="button"
                    className={
                      activeBlock === "hero"
                        ? "folio__block on"
                        : "folio__block"
                    }
                    onClick={() => setActiveBlock("hero")}
                  >
                    <em>Hero</em>
                    <h3>Build sites without touching code.</h3>
                    <p>Editors compose. Developers register sections.</p>
                  </button>
                  <button
                    type="button"
                    className={
                      activeBlock === "grid"
                        ? "folio__block on"
                        : "folio__block"
                    }
                    onClick={() => setActiveBlock("grid")}
                  >
                    <em>Programme grid · collectionRef</em>
                    <h3>Featured · 3</h3>
                    <p>Resolved server-side — never copied into JSON.</p>
                  </button>
                  <button
                    type="button"
                    className={
                      activeBlock === "cta"
                        ? "folio__block on"
                        : "folio__block"
                    }
                    onClick={() => setActiveBlock("cta")}
                  >
                    <em>CTA</em>
                    <h3>Start a project</h3>
                    <p>One primary action. Client theme owns the rest.</p>
                  </button>
                </div>

                <div className="folio__pair-side">
                  <aside className="folio__inspector" aria-label="Inspector">
                    <div className="folio__dock-h">Inspector</div>
                    {activeBlock === "hero" && (
                      <>
                        <label className="folio__field">
                          <span>Headline</span>
                          <input defaultValue="Build sites without touching code." />
                        </label>
                        <label className="folio__field">
                          <span>Deck</span>
                          <textarea
                            rows={3}
                            defaultValue="Editors compose. Developers register sections."
                          />
                        </label>
                        <label className="folio__field">
                          <span>CTA label</span>
                          <input defaultValue="See programmes" />
                        </label>
                      </>
                    )}
                    {activeBlock === "grid" && (
                      <>
                        <label className="folio__field">
                          <span>Collection</span>
                          <input defaultValue="Programmes" />
                        </label>
                        <label className="folio__field">
                          <span>Mode</span>
                          <input defaultValue="featured · limit 3" />
                        </label>
                        <label className="folio__field">
                          <span>Sort</span>
                          <input defaultValue="manual order" />
                        </label>
                      </>
                    )}
                    {activeBlock === "cta" && (
                      <>
                        <label className="folio__field">
                          <span>Title</span>
                          <input defaultValue="Start a project" />
                        </label>
                        <label className="folio__field">
                          <span>Button</span>
                          <input defaultValue="Contact us" />
                        </label>
                      </>
                    )}
                    {!["hero", "grid", "cta"].includes(activeBlock) && (
                      <p className="folio__dock-hint">
                        Select a block on the canvas to edit fields.
                      </p>
                    )}
                  </aside>
                  <aside className="folio__preview" aria-label="Live preview">
                    <div className="folio__k">Preview · same Render</div>
                    <div className="folio__preview-card">
                      <h4>Build sites without touching code.</h4>
                      <p>Editors compose. Developers register sections.</p>
                      <div className="folio__preview-grid">
                        <span>Field clinics</span>
                        <span>Water access</span>
                        <span>Teacher training</span>
                      </div>
                      <div className="folio__preview-cta">Start a project</div>
                    </div>
                  </aside>
                </div>
              </div>
            </>
          )}

          {screen === "empty" && (
            <div className="folio__empty folio__enter">
              <div className="folio__k">Pages · templates</div>
              <h1>No pages yet</h1>
              <p>
                Start from a template with real starter copy — not a blank grid.
                Collections stay typed; sections stay registered.
              </p>
              <div className="folio__suggest">
                <button type="button" onClick={() => setScreen("composer")}>
                  Marketing landing
                </button>
                <button type="button" onClick={() => setScreen("composer")}>
                  Programme hub
                </button>
                <button type="button" onClick={() => setScreen("composer")}>
                  Blank page
                </button>
              </div>
              <button
                type="button"
                className="folio__btn"
                onClick={() => setScreen("composer")}
              >
                New from template
              </button>
            </div>
          )}
        </div>
      </div>

      {cmdOpen && (
        <div
          className="folio__cmd-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Jump"
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="folio__cmd-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="folio__cmd-input">
              <kbd>⌘K</kbd>
              <input
                autoFocus
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder="Jump to page, collection, action…"
              />
            </div>
            <ul className="folio__cmd-list">
              {filteredJump.map((item) => (
                <li key={item.label}>
                  <button type="button" onClick={() => openScreen(item.screen)}>
                    <span>{item.label}</span>
                    <em>{item.meta}</em>
                  </button>
                </li>
              ))}
              {!filteredJump.length && (
                <li className="folio__cmd-empty">No matches — try a facet or slug</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
