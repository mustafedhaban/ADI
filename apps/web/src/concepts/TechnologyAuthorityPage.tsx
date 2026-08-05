import { ConceptBackLink } from "./shared/ConceptBackLink";
import { BRAND, PROVISIONAL } from "./shared/provisional";
import "./concepts.css";

/** Concept 01 — Technology Authority */
export function TechnologyAuthorityPage() {
  return (
    <div className="alool-concept c01">
      <ConceptBackLink tone="dark" />
      <header className="c01__nav">
        <a className="c01__brand" href="#top">
          {BRAND}
        </a>
        <nav className="c01__links" aria-label="Primary">
          {PROVISIONAL.nav.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}>
              {item}
            </a>
          ))}
        </nav>
        <a className="c01__nav-cta" href="#contact">
          Contact
        </a>
      </header>

      <section className="c01__hero" id="top">
        <div>
          <p className="c01__kicker alool-anim">Technology partner</p>
          <h1 className="c01__h1 alool-anim alool-anim-d1">
            Precision systems for ambitious organizations.
          </h1>
          <p className="c01__lede alool-anim alool-anim-d2">
            {/* Provisional — READY WITH ASSUMPTIONS */}
            {PROVISIONAL.support}
          </p>
          <div className="c01__actions alool-anim alool-anim-d3">
            <a className="c01__btn c01__btn--primary" href="#contact">
              {PROVISIONAL.ctaPrimary}
            </a>
            <a className="c01__btn c01__btn--ghost" href="#approach">
              {PROVISIONAL.ctaSecondary}
            </a>
          </div>
        </div>
        <aside className="c01__hero-panel alool-anim alool-anim-d2" aria-label="Capability index">
          <div className="c01__panel-row">
            <span>FOCUS</span>
            <span>Digital systems &amp; delivery</span>
          </div>
          <div className="c01__panel-row">
            <span>METHOD</span>
            <span>Research → direction → build</span>
          </div>
          <div className="c01__panel-row">
            <span>STANDARD</span>
            <span>Human review at every step</span>
          </div>
          <div className="c01__panel-row">
            <span>NOTE</span>
            <span>{PROVISIONAL.trustNote}</span>
          </div>
        </aside>
      </section>

      <section className="c01__section" id="solutions">
        <div className="c01__section-head">
          <h2 className="c01__section-title">Solutions</h2>
          <p className="c01__section-note">{PROVISIONAL.solutionsIntro}</p>
        </div>
        <div className="c01__grid-3">
          {PROVISIONAL.solutionSlots.map((s) => (
            <article key={s.label} className="c01__card">
              <div className="c01__card-label">{s.label}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="c01__section" id="approach">
        <div className="c01__section-head">
          <h2 className="c01__section-title">How Alool works</h2>
          <p className="c01__section-note">Structured delivery without decorative noise.</p>
        </div>
        <div className="c01__process">
          {PROVISIONAL.process.map((p) => (
            <article key={p.step} className="c01__process-item">
              <div className="c01__mono" style={{ color: "var(--accent)", fontSize: "0.72rem" }}>
                {p.step}
              </div>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="c01__section" id="work">
        <div className="c01__section-head">
          <h2 className="c01__section-title">Selected work</h2>
          <p className="c01__section-note">Placeholders only — no invented case results.</p>
        </div>
        <div className="c01__work">
          {PROVISIONAL.workSlots.map((w) => (
            <a key={w.code} className="c01__work-row" href="#contact">
              <span className="c01__mono" style={{ color: "var(--muted)", fontSize: "0.72rem" }}>
                {w.code}
              </span>
              <strong>{w.title}</strong>
              <span className="c01__mono" style={{ color: "var(--muted)", fontSize: "0.68rem" }}>
                {w.meta}
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="c01__section" id="about">
        <div className="c01__cta-band">
          <div>
            <h2 className="c01__section-title">About Alool Technologies</h2>
            <p className="c01__lede" style={{ marginTop: "1rem" }}>
              {PROVISIONAL.about}
            </p>
          </div>
          <div id="contact">
            <a className="c01__btn c01__btn--primary" href="mailto:hello@example.com">
              {PROVISIONAL.ctaPrimary}
            </a>
            <p
              className="c01__mono"
              style={{ marginTop: "1rem", color: "var(--muted)", fontSize: "0.72rem" }}
            >
              Contact channel provisional — confirm with client.
            </p>
          </div>
        </div>
      </section>

      <footer className="c01__footer">
        <span>{BRAND}</span>
        <span>{PROVISIONAL.footerNote}</span>
      </footer>
    </div>
  );
}
