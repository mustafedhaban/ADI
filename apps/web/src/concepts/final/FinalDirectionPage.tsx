import { Link } from "react-router-dom";
import { ConceptBackLink } from "../shared/ConceptBackLink";
import {
  BRAND,
  FINAL_FOOTER,
  PROVISIONAL,
} from "../shared/provisional";
import { ALOOL_PROVISIONAL, SELECTED_DIRECTION } from "../round2/tokens";
import {
  StudioForm,
  StudioMark,
  StudioTransition,
} from "../round2/components/StudioForm";
import { ProvisionalBadge } from "../round2/components/ProvisionalBadge";
import "../round2/round2.css";
import "../round2/identity.css";
import "./final.css";

/**
 * Selected final homepage direction: Future Studio × Graphic Form.
 * Homepage only — provisional content — not a full website build.
 */
export function FinalDirectionPage() {
  return (
    <div className="alool-concept r2c final">
      <ConceptBackLink tone="dark" to="/concepts/round-2" label="Round 2" />

      <div className="final-banner">
        <span className="final-banner__status">
          Selected · {SELECTED_DIRECTION.title} · {SELECTED_DIRECTION.signature}
        </span>
        <div className="final-banner__links">
          <Link to={SELECTED_DIRECTION.path}>Round 2 source</Link>
          <Link to="/concepts/round-2">All Round 2</Link>
          <Link to="/concepts">Round 1</Link>
        </div>
      </div>

      <header className="r2c__nav">
        <a className="r2c__brand" href="#top">
          <StudioMark /> {BRAND}
        </a>
        <nav className="r2c__links" aria-label="Primary">
          {["Work", "Studio", "Approach", "About", "Contact"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}>
              {item}
            </a>
          ))}
        </nav>
        <a className="r2c__nav-cta" href="#contact">
          Contact
        </a>
      </header>

      <section className="r2c__hero" id="top">
        <StudioForm variant="hero" />
        <p className="final-selected r2-anim">Final direction · Graphic Form</p>
        <h1 className="r2c__h1 r2-anim r2-anim-d1">
          Build what <em>matters</em> next.
        </h1>
        <div className="r2c__hero-foot">
          <p className="r2c__lede r2-anim r2-anim-d2">
            {/* Provisional — READY WITH ASSUMPTIONS */}
            {PROVISIONAL.tagline} Research before build. Human judgment throughout.
            A technology studio presence with creative ambition — not agency theatrics.
          </p>
          <div className="r2c__actions r2-anim r2-anim-d3">
            <a className="r2c__btn r2c__btn--primary" href="#contact">
              {PROVISIONAL.ctaPrimary}
            </a>
            <a className="r2c__btn r2c__btn--ghost" href="#work">
              View selected work
            </a>
          </div>
        </div>
        <p style={{ marginTop: "1.25rem" }}>
          <ProvisionalBadge />
        </p>
      </section>

      <StudioTransition label="Hero → Work" />

      <section className="r2c__section" id="work">
        <p className="r2c__eyebrow">Selected work</p>
        <h2 className="r2c__h2">Projects as presence.</h2>
        <p className="r2c__muted">
          Publishable engagements TBD. Placeholders only — no invented clients,
          metrics, or awards. The graphic form language carries through each tile.
        </p>
        <div className="r2c__projects">
          <article className="r2c__proj r2c__proj--tall">
            <code>{PROVISIONAL.workSlots[0].code}</code>
            <div>
              <h3>{PROVISIONAL.workSlots[0].title}</h3>
              <p>{PROVISIONAL.workSlots[0].meta}</p>
            </div>
          </article>
          <article className="r2c__proj r2c__proj--a">
            <code>{PROVISIONAL.workSlots[1].code}</code>
            <div>
              <h3>{PROVISIONAL.workSlots[1].title}</h3>
              <p>{PROVISIONAL.workSlots[1].meta}</p>
            </div>
          </article>
          <article className="r2c__proj r2c__proj--b">
            <code>{PROVISIONAL.workSlots[2].code}</code>
            <div>
              <h3>{PROVISIONAL.workSlots[2].title}</h3>
              <p>{PROVISIONAL.workSlots[2].meta}</p>
            </div>
          </article>
        </div>
      </section>

      <StudioTransition label="Work → Studio" />

      <section className="r2c__section r2c__section--light" id="studio">
        <p className="r2c__eyebrow">Studio</p>
        <h2 className="r2c__h2">Technology with creative ambition.</h2>
        <p className="r2c__muted">{PROVISIONAL.about}</p>
        <div className="r2c__split">
          <div>
            <p className="r2c__eyebrow">Solutions</p>
            <h3
              className="r2c__h2"
              style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
            >
              Capabilities, provisional.
            </h3>
            <p className="r2c__muted">{PROVISIONAL.solutionsIntro}</p>
            <StudioMark />
          </div>
          <div className="r2c__stack">
            {PROVISIONAL.solutionSlots.map((s) => (
              <article key={s.label} className="r2c__stack-item">
                <span>{s.label}</span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <StudioTransition label="Studio → Approach" />

      <section className="r2c__section" id="approach">
        <p className="r2c__eyebrow">Approach</p>
        <h2 className="r2c__h2">How Alool works.</h2>
        <p className="r2c__muted">{PROVISIONAL.support}</p>
        <div className="r2c__stack">
          {PROVISIONAL.process.map((p) => (
            <article key={p.step} className="r2c__stack-item">
              <span>{p.step}</span>
              <div>
                <strong>{p.title}</strong>
                <p>{p.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <StudioTransition label="Approach → About" />

      <section className="r2c__section r2c__section--light" id="about">
        <p className="r2c__eyebrow">About</p>
        <h2 className="r2c__h2">Alool Technologies</h2>
        <div className="final-about">
          <div>
            <p className="r2c__muted">{PROVISIONAL.about}</p>
            <p className="r2c__muted">
              Visual system: {ALOOL_PROVISIONAL.signatures["future-studio"]}. Brand
              assets, markets, and public claims remain subject to client confirmation.
            </p>
          </div>
          <aside className="final-about__panel">
            <StudioForm variant="footer" />
            <p className="final-selected">Signature Graphic Form</p>
            <p className="r2c__muted" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
              Organic form language across hero, work, light sections, CTA, and footer
              — the continuity that makes this direction identifiable.
            </p>
          </aside>
        </div>
      </section>

      <StudioTransition label="About → Contact" />

      <section className="r2c__section" id="contact">
        <div className="r2c__cta" style={{ position: "relative" }}>
          <StudioForm variant="cta" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p className="r2c__eyebrow">Contact</p>
            <h2 className="r2c__h2" style={{ marginBottom: "0.5rem" }}>
              Start the next chapter.
            </h2>
            <p className="r2c__muted" style={{ marginBottom: 0 }}>
              Contact channel provisional — confirm with client.
            </p>
          </div>
          <a
            className="r2c__btn r2c__btn--primary"
            href="mailto:hello@example.com"
            style={{ position: "relative", zIndex: 1 }}
          >
            {PROVISIONAL.ctaPrimary}
          </a>
        </div>
      </section>

      <footer className="r2c__footer">
        <StudioForm variant="footer" />
        <span style={{ position: "relative", zIndex: 1 }}>
          {BRAND} · {SELECTED_DIRECTION.signature}
        </span>
        <span style={{ position: "relative", zIndex: 1 }}>{FINAL_FOOTER}</span>
      </footer>
    </div>
  );
}
