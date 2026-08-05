import { ConceptBackLink } from "./shared/ConceptBackLink";
import { BRAND, PROVISIONAL } from "./shared/provisional";
import "./concepts.css";

/** Concept 05 — African technology company with global ambition */
export function AfricaGlobalPage() {
  return (
    <div className="alool-concept c05">
      <ConceptBackLink tone="dark" />
      <header className="c05__nav">
        <a className="c05__brand" href="#top">
          {BRAND}
        </a>
        <nav className="c05__links" aria-label="Primary">
          {["Origin", "Solutions", "Work", "Contact"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}>
              {item}
            </a>
          ))}
        </nav>
        <a className="c05__nav-cta" href="#contact">
          Contact
        </a>
      </header>

      <section className="c05__hero" id="top">
        <div>
          <p className="c05__eyebrow alool-anim">Built here · Relevant everywhere</p>
          <h1 className="c05__h1 alool-anim alool-anim-d1">
            African technology. <em>Global</em> standard.
          </h1>
          <p className="c05__lede alool-anim alool-anim-d2">
            {/* Provisional — geography unconfirmed; exploration stance only */}
            A modern company website direction that treats origin as strength and
            ambition as default — without flags, stereotypes, or charity aesthetics.
          </p>
          <div className="c05__actions alool-anim alool-anim-d3">
            <a className="c05__btn c05__btn--primary" href="#contact">
              {PROVISIONAL.ctaPrimary}
            </a>
            <a className="c05__btn c05__btn--ghost" href="#origin">
              Read the origin frame
            </a>
          </div>
        </div>
        <aside className="c05__map alool-anim alool-anim-d2" aria-label="Ambition diagram">
          <div className="c05__map-grid" />
          <div className="c05__map-label">Ambition map · abstract</div>
          <div className="c05__map-points">
            <div>
              <span>Origin context</span>
              <span>Present</span>
            </div>
            <div>
              <span>Regional credibility</span>
              <span>Earned</span>
            </div>
            <div>
              <span>International relevance</span>
              <span>Target</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="c05__section" id="origin">
        <h2 className="c05__h2">Origin without cliché</h2>
        <p className="c05__muted">
          Geographic market is still UNKNOWN in intake. This concept explores how
          origin storytelling could feel confident and contemporary if confirmed.
        </p>
        <div className="c05__story">
          <article className="c05__story-card">
            <h3>Where we build from</h3>
            <p>
              Context and craft rooted in place — expressed through modern type,
              restraint, and clarity rather than decorative motifs.
            </p>
          </article>
          <article className="c05__story-card">
            <h3>Where we aim</h3>
            <p>
              Globally relevant digital products and systems for ambitious
              organizations. Specific markets TBD with the client.
            </p>
          </article>
        </div>
      </section>

      <section className="c05__section" id="solutions">
        <h2 className="c05__h2">Solutions</h2>
        <p className="c05__muted">{PROVISIONAL.solutionsIntro}</p>
        <div className="c05__solutions">
          {PROVISIONAL.solutionSlots.map((s) => (
            <article key={s.label} className="c05__sol">
              <span>{s.label}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="c05__section" id="approach">
        <h2 className="c05__h2">How Alool works</h2>
        <p className="c05__muted">{PROVISIONAL.about}</p>
        <div className="c05__story">
          {PROVISIONAL.process.slice(0, 2).map((p) => (
            <article key={p.step} className="c05__story-card">
              <h3>
                {p.step} · {p.title}
              </h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
        <div className="c05__story" style={{ marginTop: "1rem" }}>
          {PROVISIONAL.process.slice(2).map((p) => (
            <article key={p.step} className="c05__story-card">
              <h3>
                {p.step} · {p.title}
              </h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="c05__section" id="work">
        <h2 className="c05__h2">Selected work</h2>
        <p className="c05__muted">Placeholders — no invented portfolio claims.</p>
        <div className="c05__work">
          {PROVISIONAL.workSlots.map((w) => (
            <article key={w.code} className="c05__work-card">
              <code>{w.code}</code>
              <div>
                <h3>{w.title}</h3>
                <p className="c05__muted" style={{ marginTop: "0.35rem" }}>
                  {w.meta}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="c05__section" id="contact">
        <div className="c05__cta">
          <div>
            <h2 className="c05__h2">Build with global ambition.</h2>
            <p className="c05__muted" style={{ margin: 0 }}>
              Contact path provisional — confirm channels with the client.
            </p>
          </div>
          <a className="c05__btn c05__btn--primary" href="mailto:hello@example.com">
            {PROVISIONAL.ctaPrimary}
          </a>
        </div>
      </section>

      <footer className="c05__footer">
        <span>{BRAND}</span>
        <span>{PROVISIONAL.footerNote}</span>
      </footer>
    </div>
  );
}
