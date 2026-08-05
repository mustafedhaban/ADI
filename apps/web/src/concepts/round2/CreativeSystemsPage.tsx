import { ConceptBackLink } from "../shared/ConceptBackLink";
import { BRAND, PROVISIONAL, ROUND2_FOOTER } from "../shared/provisional";
import { ALOOL_PROVISIONAL } from "./tokens";
import {
  ModularMark,
  SystemNodes,
  SystemsTransition,
} from "./components/ModularSystem";
import { ProvisionalBadge } from "./components/ProvisionalBadge";
import "./round2.css";
import "./identity.css";

/** Round 2 · Creative Systems — personalized with Modular Grid identity */
export function CreativeSystemsPage() {
  return (
    <div className="alool-concept r2b">
      <ConceptBackLink tone="dark" to="/concepts/round-2" label="Round 2" />

      <header className="r2b__nav">
        <a className="r2b__brand" href="#top">
          <ModularMark /> {BRAND}
        </a>
        <nav className="r2b__links" aria-label="Primary">
          {["System", "Modules", "Method", "Work", "Contact"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}>
              {item}
            </a>
          ))}
        </nav>
        <span className="r2b__chip">
          <ModularMark /> {ALOOL_PROVISIONAL.signatures["creative-systems"]}
        </span>
      </header>

      <section className="r2b__hero" id="top">
        <div className="r2b__hero-main r2-anim">
          <div>
            <p className="r2b__kicker">Modular technology language</p>
            <h1 className="r2b__h1">
              Design the <span>system</span>. Then ship the product.
            </h1>
          </div>
          <div>
            <p className="r2b__muted" style={{ marginBottom: "0.5rem" }}>
              {/* Provisional */}
              Technical typography meets intentional modules — every cell carries
              meaning. A technology company that thinks like a designer.
            </p>
            <div className="r2b__hero-actions">
              <a className="r2b__btn r2b__btn--primary" href="#contact">
                {PROVISIONAL.ctaPrimary}
              </a>
              <a className="r2b__btn r2b__btn--ghost" href="#modules">
                Inspect modules
              </a>
            </div>
            <p style={{ marginTop: "1rem" }}>
              <ProvisionalBadge />
            </p>
          </div>
        </div>
        <div className="r2b__bento r2-anim r2-anim-d1" id="system" aria-label="System cells">
          <article className="r2b__cell r2b__cell--wide">
            <code>unit / assemble</code>
            <div>
              <strong>Modules with purpose</strong>
              <p>Cells describe relationships — not empty bento decoration.</p>
            </div>
          </article>
          <article className="r2b__cell">
            <code>axis / type</code>
            <div>
              <strong>Technical type</strong>
              <p>Hierarchy first.</p>
            </div>
          </article>
          <article className="r2b__cell">
            <code>axis / link</code>
            <div>
              <strong>Connected nodes</strong>
              <p>Hover reveals structure.</p>
            </div>
          </article>
          <article className="r2b__cell r2b__cell--wide">
            <code>note</code>
            <div>
              <strong>Provisional</strong>
              <p>{PROVISIONAL.trustNote}</p>
            </div>
          </article>
        </div>
      </section>

      <SystemsTransition label="Hero → Architecture" />

      <section className="r2b__section" id="modules">
        <h2 className="r2b__section-title">Capability modules</h2>
        <p className="r2b__muted">{PROVISIONAL.solutionsIntro}</p>
        <SystemNodes
          nodes={[
            { code: "N01", label: "Research" },
            { code: "N02", label: "Direction" },
            { code: "N03", label: "Build" },
            { code: "N04", label: "Refine" },
          ]}
        />
        <div className="r2b__grid" style={{ marginTop: "1.25rem" }}>
          {PROVISIONAL.solutionSlots.map((s, i) => (
            <article
              key={s.label}
              className={`r2b__card ${i === 0 ? "r2b__card--8" : "r2b__card--4"}`}
            >
              <code>{s.label}</code>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
          <article className="r2b__card r2b__card--6">
            <code>support</code>
            <h3>Research-led delivery</h3>
            <p>{PROVISIONAL.support}</p>
          </article>
          <article className="r2b__card r2b__card--6">
            <code>about</code>
            <h3>Company frame</h3>
            <p>{PROVISIONAL.about}</p>
          </article>
        </div>
      </section>

      <SystemsTransition label="Modules → Method" />

      <section className="r2b__section" id="method">
        <h2 className="r2b__section-title">Method as interface</h2>
        <p className="r2b__muted">
          Data-inspired layout without inventing metrics — process as a readable system.
        </p>
        <div className="r2b__flow">
          {PROVISIONAL.process.map((p) => (
            <article key={p.step} className="r2b__flow-item">
              <span>{p.step}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <SystemsTransition label="Method → Work" />

      <section className="r2b__section" id="work">
        <h2 className="r2b__section-title">Selected work</h2>
        <p className="r2b__muted">Placeholders — no invented outcomes.</p>
        <div className="r2b__grid">
          {PROVISIONAL.workSlots.map((w) => (
            <article key={w.code} className="r2b__card r2b__card--4">
              <code>{w.code}</code>
              <h3>{w.title}</h3>
              <p>{w.meta}</p>
            </article>
          ))}
        </div>
      </section>

      <SystemsTransition label="Work → Contact" />

      <section className="r2b__section" id="contact">
        <div className="r2b__cta">
          <div>
            <h2 className="r2b__section-title" style={{ marginBottom: "0.4rem" }}>
              Assemble the brief.
            </h2>
            <p className="r2b__muted" style={{ margin: 0 }}>
              Contact channel provisional — confirm with client.
            </p>
          </div>
          <a className="r2b__btn r2b__btn--primary" href="mailto:hello@example.com">
            {PROVISIONAL.ctaPrimary}
          </a>
        </div>
      </section>

      <footer className="r2b__footer">
        <span>
          {BRAND} · {ALOOL_PROVISIONAL.signatures["creative-systems"]}
        </span>
        <span>{ROUND2_FOOTER}</span>
      </footer>
    </div>
  );
}
