import { ConceptBackLink } from "../shared/ConceptBackLink";
import { BRAND, PROVISIONAL, ROUND2_FOOTER } from "../shared/provisional";
import { ALOOL_PROVISIONAL } from "./tokens";
import {
  StudioForm,
  StudioMark,
  StudioTransition,
} from "./components/StudioForm";
import { ProvisionalBadge } from "./components/ProvisionalBadge";
import "./round2.css";
import "./identity.css";

/** Round 2 · Future Studio — personalized with Signature Graphic Form */
export function FutureStudioPage() {
  return (
    <div className="alool-concept r2c">
      <ConceptBackLink tone="dark" to="/concepts/round-2" label="Round 2" />

      <header className="r2c__nav">
        <a className="r2c__brand" href="#top">
          <StudioMark /> {BRAND}
        </a>
        <nav className="r2c__links" aria-label="Primary">
          {["Work", "Studio", "Method", "Contact"].map((item) => (
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
        <p className="r2c__eyebrow r2-anim">
          {ALOOL_PROVISIONAL.signatures["future-studio"]} · provisional
        </p>
        <h1 className="r2c__h1 r2-anim r2-anim-d1">
          Build what <em>matters</em> next.
        </h1>
        <div className="r2c__hero-foot">
          <p className="r2c__lede r2-anim r2-anim-d2">
            {/* Provisional — no AI hype language */}
            A next-generation technology studio direction: bold statement, immersive
            project rhythm, and a signature graphic form that carries across the
            page — without agency clichés.
          </p>
          <div className="r2c__actions r2-anim r2-anim-d3">
            <a className="r2c__btn r2c__btn--primary" href="#contact">
              {PROVISIONAL.ctaPrimary}
            </a>
            <a className="r2c__btn r2c__btn--ghost" href="#work">
              Enter the work
            </a>
          </div>
        </div>
        <p style={{ marginTop: "1.25rem" }}>
          <ProvisionalBadge />
        </p>
      </section>

      <StudioTransition label="Statement → Work" />

      <section className="r2c__section" id="work">
        <p className="r2c__eyebrow">Selected work</p>
        <h2 className="r2c__h2">Projects as presence.</h2>
        <p className="r2c__muted">
          Immersive presentation with placeholder engagements — no invented clients
          or results. Hover reveals the graphic form language.
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
            <h3 className="r2c__h2" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>
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

      <StudioTransition label="Studio → Method" />

      <section className="r2c__section" id="method">
        <p className="r2c__eyebrow">Method</p>
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
        <div className="r2c__cta" id="contact" style={{ position: "relative" }}>
          <StudioForm variant="cta" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p className="r2c__eyebrow">Contact</p>
            <h2 className="r2c__h2" style={{ marginBottom: 0 }}>
              Start the next chapter.
            </h2>
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
          {BRAND} · {ALOOL_PROVISIONAL.signatures["future-studio"]}
        </span>
        <span style={{ position: "relative", zIndex: 1 }}>{ROUND2_FOOTER}</span>
      </footer>
    </div>
  );
}
