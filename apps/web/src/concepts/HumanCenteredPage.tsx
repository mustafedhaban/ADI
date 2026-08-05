import { ConceptBackLink } from "./shared/ConceptBackLink";
import { BRAND, PROVISIONAL } from "./shared/provisional";
import "./concepts.css";

/** Concept 04 — Human-Centered Digital Transform */
export function HumanCenteredPage() {
  return (
    <div className="alool-concept c04">
      <ConceptBackLink tone="light" />
      <header className="c04__nav">
        <a className="c04__brand" href="#top">
          {BRAND}
        </a>
        <nav className="c04__links" aria-label="Primary">
          {PROVISIONAL.nav.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}>
              {item}
            </a>
          ))}
        </nav>
        <a className="c04__nav-cta" href="#contact">
          Talk with us
        </a>
      </header>

      <section className="c04__hero" id="top">
        <div>
          <p className="c04__kicker alool-anim">People · outcomes · clarity</p>
          <h1 className="c04__h1 alool-anim alool-anim-d1">
            Technology that helps organizations move with confidence.
          </h1>
          <p className="c04__lede alool-anim alool-anim-d2">
            {/* Provisional */}
            {PROVISIONAL.support}
          </p>
          <div className="c04__actions alool-anim alool-anim-d3">
            <a className="c04__btn c04__btn--primary" href="#contact">
              {PROVISIONAL.ctaPrimary}
            </a>
            <a className="c04__btn c04__btn--ghost" href="#impact">
              See how we work
            </a>
          </div>
        </div>
        <aside className="c04__portrait alool-anim alool-anim-d2" aria-hidden="true">
          <div className="c04__portrait-shape" />
          <div className="c04__portrait-caption">
            <strong>Human judgment, structured delivery</strong>
            <span>Abstract visual — no stock photography</span>
          </div>
        </aside>
      </section>

      <section className="c04__section c04__section--soft" id="impact">
        <h2 className="c04__h2">Problem → solution → impact</h2>
        <p className="c04__intro">
          Narrative frame for transformation storytelling. Specific client outcomes
          intentionally omitted until approved.
        </p>
        <div className="c04__psi">
          <article className="c04__psi-card">
            <em>Problem</em>
            <h3>Unclear digital direction</h3>
            <p>
              Organizations need coherent websites and systems without guessing at
              visual or technical decisions.
            </p>
          </article>
          <article className="c04__psi-card">
            <em>Solution</em>
            <h3>Research-led build</h3>
            <p>
              Align on direction first, then implement with AI-assisted craft and
              continuous human review.
            </p>
          </article>
          <article className="c04__psi-card">
            <em>Impact</em>
            <h3>Clarity you can ship</h3>
            <p>
              A public presence and delivery process that stays understandable to
              decision-makers. Impact metrics TBD with client.
            </p>
          </article>
        </div>
      </section>

      <section className="c04__section" id="solutions">
        <h2 className="c04__h2">What we help with</h2>
        <p className="c04__intro">{PROVISIONAL.solutionsIntro}</p>
        <div className="c04__services">
          {PROVISIONAL.solutionSlots.map((s) => (
            <article key={s.label} className="c04__service">
              <span>{s.label}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="c04__section" id="approach">
        <h2 className="c04__h2">How Alool works</h2>
        <p className="c04__intro">Accessible steps for non-technical stakeholders.</p>
        <div className="c04__steps">
          {PROVISIONAL.process.map((p) => (
            <article key={p.step} className="c04__step">
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>{p.step}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="c04__section" id="work">
        <h2 className="c04__h2">Selected work</h2>
        <p className="c04__intro">Placeholders only — publishable projects TBD.</p>
        <div className="c04__services">
          {PROVISIONAL.workSlots.map((w) => (
            <article key={w.code} className="c04__service">
              <span style={{ fontSize: "0.75rem" }}>{w.code}</span>
              <div>
                <h3>{w.title}</h3>
                <p>{w.meta}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="c04__section" id="about">
        <div className="c04__cta" id="contact">
          <div>
            <h2>Let’s talk about your next digital step.</h2>
            <p>{PROVISIONAL.about}</p>
          </div>
          <a className="c04__btn c04__btn--primary" href="mailto:hello@example.com">
            {PROVISIONAL.ctaPrimary}
          </a>
        </div>
      </section>

      <footer className="c04__footer">
        <span>{BRAND}</span>
        <span>{PROVISIONAL.footerNote}</span>
      </footer>
    </div>
  );
}
