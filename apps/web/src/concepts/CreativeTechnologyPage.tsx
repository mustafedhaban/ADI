import { ConceptBackLink } from "./shared/ConceptBackLink";
import { BRAND, PROVISIONAL } from "./shared/provisional";
import "./concepts.css";

/** Concept 02 — Premium Creative Technology Studio */
export function CreativeTechnologyPage() {
  return (
    <div className="alool-concept c02">
      <ConceptBackLink tone="dark" />
      <header className="c02__nav">
        <a className="c02__brand" href="#top">
          {BRAND}
        </a>
        <nav className="c02__nav-links" aria-label="Primary">
          {["Work", "Approach", "Studio", "Contact"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}>
              {item}
            </a>
          ))}
        </nav>
      </header>

      <section className="c02__hero" id="top">
        <h1 className="c02__hero-mark alool-anim">
          Digital <em>craft</em> for complex briefs.
        </h1>
        <div className="c02__hero-rail">
          <p className="c02__hero-copy alool-anim alool-anim-d1">
            {/* Provisional */}
            {PROVISIONAL.tagline} Editorial storytelling, typography-led composition, and
            immersive project presentation — without sacrificing clarity.
          </p>
          <div className="c02__hero-cta alool-anim alool-anim-d2">
            <a className="c02__pill c02__pill--fill" href="#contact">
              {PROVISIONAL.ctaPrimary}
            </a>
            <a className="c02__pill" href="#work">
              View selected work
            </a>
          </div>
        </div>
      </section>

      <div className="c02__marquee" aria-hidden="true">
        <span>Research before build</span>
        <span>·</span>
        <span>Human curation</span>
        <span>·</span>
        <span>Institutional knowledge</span>
        <span>·</span>
        <span>Typography as structure</span>
        <span>·</span>
        <span>Research before build</span>
        <span>·</span>
        <span>Human curation</span>
      </div>

      <section className="c02__section" id="work">
        <p className="c02__eyebrow">Selected work</p>
        <h2 className="c02__h2">Projects as chapters.</h2>
        <p className="c02__body">
          Case tiles are placeholders. No invented clients, results, or awards.
        </p>
        <div className="c02__projects">
          {PROVISIONAL.workSlots.map((w, i) => (
            <article
              key={w.code}
              className={`c02__proj ${i === 0 ? "c02__proj--a" : i === 1 ? "c02__proj--b" : "c02__proj--c"}`}
            >
              <code>{w.code}</code>
              <div>
                <h3>{w.title}</h3>
                <p className="c02__body" style={{ fontSize: "0.95rem", marginTop: "0.4rem" }}>
                  {w.meta}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="c02__section" id="approach">
        <div className="c02__split">
          <div>
            <p className="c02__eyebrow">Approach</p>
            <h2 className="c02__h2">Direction first. Decoration later.</h2>
            <p className="c02__body">{PROVISIONAL.about}</p>
          </div>
          <div className="c02__stack" id="studio">
            {PROVISIONAL.process.map((p) => (
              <article key={p.step} className="c02__stack-item">
                <span style={{ color: "var(--warm)", fontFamily: "Syne, sans-serif" }}>
                  {p.step}
                </span>
                <div>
                  <strong>{p.title}</strong>
                  <p>{p.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="c02__section" id="contact">
        <p className="c02__eyebrow">Solutions</p>
        <h2 className="c02__h2">Capabilities, provisionally framed.</h2>
        <p className="c02__body" style={{ marginBottom: "1.5rem" }}>
          {PROVISIONAL.solutionsIntro}
        </p>
        <div className="c02__stack">
          {PROVISIONAL.solutionSlots.map((s) => (
            <article key={s.label} className="c02__stack-item">
              <span style={{ color: "var(--accent)", fontFamily: "Syne, sans-serif" }}>
                {s.label}
              </span>
              <div>
                <strong>{s.title}</strong>
                <p>{s.body}</p>
              </div>
            </article>
          ))}
        </div>
        <div style={{ marginTop: "2.5rem" }}>
          <a className="c02__pill c02__pill--fill" href="mailto:hello@example.com">
            {PROVISIONAL.ctaPrimary}
          </a>
        </div>
      </section>

      <footer className="c02__footer">
        <span>{BRAND}</span>
        <span>{PROVISIONAL.footerNote}</span>
      </footer>
    </div>
  );
}
