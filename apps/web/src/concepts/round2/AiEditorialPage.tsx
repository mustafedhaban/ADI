import { ConceptBackLink } from "../shared/ConceptBackLink";
import { BRAND, PROVISIONAL, ROUND2_FOOTER } from "../shared/provisional";
import { ALOOL_PROVISIONAL } from "./tokens";
import {
  EditorialMarker,
  EditorialRule,
  EditorialTransition,
  SignalRail,
  TechnicalAnnotation,
} from "./components/SignalRail";
import { ProvisionalBadge } from "./components/ProvisionalBadge";
import "./round2.css";
import "./identity.css";

/** Round 2 · AI Editorial — personalized with Signal Rail identity */
export function AiEditorialPage() {
  return (
    <div className="alool-concept r2a r2a__surface">
      <div className="r2a__page-grid" aria-hidden="true" />
      <ConceptBackLink tone="light" to="/concepts/round-2" label="Round 2" />

      <header className="r2a__nav">
        <a className="r2a__brand" href="#top">
          {BRAND}
        </a>
        <nav className="r2a__links" aria-label="Primary">
          {["Essay", "Systems", "Method", "Work", "Contact"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}>
              {item}
            </a>
          ))}
        </nav>
        <a className="r2a__nav-cta" href="#contact">
          Contact
        </a>
      </header>

      <section className="r2a__hero" id="top">
        <div>
          <EditorialMarker num="00" label="Signal / Open" />
          <p className="r2a__kicker r2-anim">
            Technology · Culture · Judgment ·{" "}
            <TechnicalAnnotation>
              {ALOOL_PROVISIONAL.signatures["ai-editorial"]}
            </TechnicalAnnotation>
          </p>
          <h1 className="r2a__h1 r2-anim r2-anim-d1">
            Intelligence with <em>editorial</em> gravity.
          </h1>
          <p className="r2a__lede r2-anim r2-anim-d2">
            {/* Provisional — READY WITH ASSUMPTIONS */}
            A serious technology company presented with the calm authority of a
            world-class publication: research before build, human approval, and
            systems you can actually read.
          </p>
          <div className="r2a__actions r2-anim r2-anim-d3">
            <a className="r2a__btn r2a__btn--primary" href="#contact">
              {PROVISIONAL.ctaPrimary}
            </a>
            <a className="r2a__btn r2a__btn--ghost" href="#essay">
              {PROVISIONAL.ctaSecondary}
            </a>
          </div>
          <p style={{ marginTop: "1.25rem" }}>
            <ProvisionalBadge />
          </p>
        </div>
        <SignalRail
          items={[
            { idx: "01", label: "Stance", value: "Precise · cultured" },
            { idx: "02", label: "Method", value: "Research → direction" },
            { idx: "03", label: "Standard", value: "Human review" },
            {
              idx: "04",
              label: "Note",
              value: (
                <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.9rem", fontWeight: 500 }}>
                  {PROVISIONAL.trustNote}
                </span>
              ),
            },
          ]}
        />
      </section>

      <EditorialTransition from="Open" to="Essay" />

      <section className="r2a__section" id="essay">
        <div className="r2a__section-head">
          <div>
            <EditorialMarker num="01" label="Essay" />
            <EditorialRule />
            <h2 className="r2a__h2">Technology storytelling without hype.</h2>
          </div>
          <p className="r2a__note">
            Large-scale type and premium whitespace — business proposition stays
            visible.
          </p>
        </div>
        <div className="r2a__essay">
          <p className="r2a__essay-lead">{PROVISIONAL.tagline}</p>
          <div className="r2a__essay-body">
            <p>{PROVISIONAL.support}</p>
            <p>{PROVISIONAL.about}</p>
            <TechnicalAnnotation>Indexed narrative · provisional copy</TechnicalAnnotation>
          </div>
        </div>
      </section>

      <EditorialTransition from="Essay" to="Systems" />

      <section className="r2a__section" id="systems">
        <div className="r2a__section-head">
          <div>
            <EditorialMarker num="02" label="Systems" />
            <EditorialRule />
            <h2 className="r2a__h2">Structured capabilities.</h2>
          </div>
          <p className="r2a__note">{PROVISIONAL.solutionsIntro}</p>
        </div>
        <div className="r2a__modules">
          {PROVISIONAL.solutionSlots.map((s) => (
            <article key={s.label} className="r2a__mod">
              <code>{s.label}</code>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <EditorialTransition from="Systems" to="Method" />

      <section className="r2a__section" id="method">
        <div className="r2a__section-head">
          <div>
            <EditorialMarker num="03" label="Method" />
            <EditorialRule />
            <h2 className="r2a__h2">How Alool works.</h2>
          </div>
          <p className="r2a__note">Intelligent systems · restrained motion · clear steps.</p>
        </div>
        <div className="r2a__process">
          {PROVISIONAL.process.map((p) => (
            <article key={p.step} className="r2a__step">
              <span>{p.step}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
        <div style={{ marginTop: "2rem" }}>
          <SignalRail
            items={PROVISIONAL.process.map((p) => ({
              idx: p.step,
              label: "Stage",
              value: p.title,
            }))}
          />
        </div>
      </section>

      <EditorialTransition from="Method" to="Work" />

      <section className="r2a__section" id="work">
        <div className="r2a__section-head">
          <div>
            <EditorialMarker num="04" label="Work" />
            <EditorialRule />
            <h2 className="r2a__h2">Index, not spectacle.</h2>
          </div>
          <p className="r2a__note">Placeholders only — no invented case results.</p>
        </div>
        <div className="r2a__work">
          {PROVISIONAL.workSlots.map((w) => (
            <a key={w.code} className="r2a__work-row" href="#contact">
              <code>{w.code}</code>
              <strong>{w.title}</strong>
              <em>{w.meta}</em>
            </a>
          ))}
        </div>
      </section>

      <EditorialTransition from="Work" to="Contact" />

      <section className="r2a__section" id="contact">
        <div className="r2a__cta">
          <div>
            <EditorialMarker num="05" label="Contact" />
            <EditorialRule />
            <h2 className="r2a__h2">Begin with a clear brief.</h2>
            <p className="r2a__note" style={{ marginTop: "1rem", justifySelf: "start" }}>
              Contact channel provisional — confirm with client.
            </p>
          </div>
          <a className="r2a__btn r2a__btn--primary" href="mailto:hello@example.com">
            {PROVISIONAL.ctaPrimary}
          </a>
        </div>
      </section>

      <footer className="r2a__footer">
        <span>
          {BRAND} · {ALOOL_PROVISIONAL.signatures["ai-editorial"]}
        </span>
        <span>{ROUND2_FOOTER}</span>
      </footer>
    </div>
  );
}
