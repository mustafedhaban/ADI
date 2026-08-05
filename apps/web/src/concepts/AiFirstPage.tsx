import { ConceptBackLink } from "./shared/ConceptBackLink";
import { BRAND, PROVISIONAL } from "./shared/provisional";
import "./concepts.css";

/** Concept 03 — AI-First Future Technology (no neon clichés) */
export function AiFirstPage() {
  return (
    <div className="alool-concept c03">
      <ConceptBackLink tone="light" />
      <div className="c03__shell">
        <div className="c03__mesh" aria-hidden="true" />
        <header className="c03__nav">
          <a className="c03__brand" href="#top">
            {BRAND}
          </a>
          <nav className="c03__nav-links" aria-label="Primary">
            {["Systems", "Method", "Work", "Contact"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}>
                {item}
              </a>
            ))}
          </nav>
          <span className="c03__chip">Round 1 · Provisional</span>
        </header>

        <section className="c03__hero" id="top">
          <div>
            <div className="c03__signal alool-anim">
              <i /> Intelligence with judgment
            </div>
            <h1 className="c03__h1 alool-anim alool-anim-d1">
              Build with <span>signal</span>, not noise.
            </h1>
            <p className="c03__lede alool-anim alool-anim-d2">
              {/* Provisional — do not claim unconfirmed AI product capabilities */}
              Forward-looking technology storytelling for Alool Technologies: research
              systems, human approval, and precise digital delivery — without generic
              startup theatrics.
            </p>
            <div className="c03__actions alool-anim alool-anim-d3">
              <a className="c03__btn c03__btn--primary" href="#contact">
                {PROVISIONAL.ctaPrimary}
              </a>
              <a className="c03__btn c03__btn--ghost" href="#method">
                {PROVISIONAL.ctaSecondary}
              </a>
            </div>
          </div>
          <aside className="c03__orbit alool-anim alool-anim-d2" aria-label="System sketch">
            <div className="c03__orbit-inner">
              <div className="c03__orbit-row">
                <span>Ingest research context</span>
                <code>layer/01</code>
              </div>
              <div className="c03__orbit-row">
                <span>Analyze &amp; propose direction</span>
                <code>layer/02</code>
              </div>
              <div className="c03__orbit-row">
                <span>Human approve</span>
                <code>layer/03</code>
              </div>
              <div className="c03__orbit-row">
                <span>Implement with review loops</span>
                <code>layer/04</code>
              </div>
            </div>
          </aside>
        </section>

        <section className="c03__section" id="systems">
          <div className="c03__panel">
            <h2 className="c03__section-title">Technology capabilities</h2>
            <p className="c03__muted">{PROVISIONAL.solutionsIntro}</p>
            <div className="c03__caps">
              {PROVISIONAL.solutionSlots.map((s) => (
                <article key={s.label} className="c03__cap">
                  <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.68rem", color: "var(--accent)" }}>
                    {s.label}
                  </code>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="c03__section" id="method">
          <h2 className="c03__section-title">How Alool works</h2>
          <p className="c03__muted">
            Documented workflow themes only — not a claim of specific AI products.
          </p>
          <div className="c03__flow">
            {PROVISIONAL.process.map((p) => (
              <article key={p.step} className="c03__flow-item">
                <span>{p.step}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="c03__section" id="work">
          <div className="c03__panel">
            <h2 className="c03__section-title">Selected work</h2>
            <p className="c03__muted">Placeholders — no invented outcomes.</p>
            <div className="c03__caps">
              {PROVISIONAL.workSlots.map((w) => (
                <article key={w.code} className="c03__cap">
                  <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.68rem", color: "var(--muted)" }}>
                    {w.code}
                  </code>
                  <h3>{w.title}</h3>
                  <p>{w.meta}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="c03__section" id="contact">
          <div className="c03__panel c03__cta">
            <div>
              <h2 className="c03__section-title" style={{ marginBottom: "0.5rem" }}>
                Ready when the brief is clear.
              </h2>
              <p className="c03__muted" style={{ margin: 0 }}>
                {PROVISIONAL.about}
              </p>
            </div>
            <a className="c03__btn c03__btn--primary" href="mailto:hello@example.com">
              {PROVISIONAL.ctaPrimary}
            </a>
          </div>
        </section>

        <footer className="c03__footer">
          <span>{BRAND}</span>
          <span>{PROVISIONAL.footerNote}</span>
        </footer>
      </div>
    </div>
  );
}
