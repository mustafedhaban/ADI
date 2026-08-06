# Batch 1 — Post-Capture Curation Report

**Date:** 2026-08-05
**Scope:** the 50 references imported as Library Expansion batch 1
**Method:** every claim below was rewritten from the captured desktop screenshot. Nothing was carried over from the import metadata unless the capture confirmed it.

---

## 1. Status

| | Count |
|---|---|
| Batch 1 references imported | 50 |
| Captured at time of writing | 27 |
| **Fully curated against evidence** | **18** (the complete documentation segment) |
| Captured, review pending | 9 |
| Capture still in progress | 23 |

The documentation segment is finished end to end. The developer-tools and AI-product segments are still capturing; their curation is the next pass and is **not** claimed as complete here.

---

## 2. Headline finding: the import metadata was mostly wrong

Of the 18 documentation references, **15 required substantive correction** and only 3 survived intact.

| Verdict | Count | References |
|---|---|---|
| Confirmed by capture | 3 | Next.js Docs, Vue.js Guide, Rust Book |
| Corrected | 15 | all others |

This is an 83% correction rate on metadata I had written myself less than an hour earlier. It is the strongest possible argument for the capture-before-claim rule: **the screenshots are the source of truth, and unverified metadata is close to worthless.**

### Errors by type

| Error | Count | Examples |
|---|---|---|
| Light/dark inverted | 5 | Tailwind, Vercel, Next.js tagged `dark theme` — all three are light pages with dark code panels. Twilio tagged `Light` — it has a dark navy shell. Supabase tagged `Dark` — it is light. |
| Described a page I had not seen | 4 | **Stripe Docs** — I described the three-column article layout; the URL is a docs *hub* with plain link columns and a dotted gradient band. **MDN** — I described compatibility tables; the URL is the homepage. **Prisma** — I assumed a left sidebar; there is none. **Cloudflare** — I claimed product-card indexing; there are no cards. |
| Unsupported visual claims | 3 | "Illustration in technical writing" (React, Astro) — no illustration in either capture. "Editorial treatment" (Shopify.dev) — it is pastel and illustration-led, not editorial. |
| Wrong structure or type | 3 | Card grids claimed on Cloudflare and GitHub Docs — both use plain link directories. `serif typography` on Django — it is sans throughout. |

### What I missed entirely

Capture surfaced features no amount of reasoning would have produced:

- **Svelte** sets its body copy in a **serif** — the only developer documentation in the library that does.
- **Astro** uses a wall of ~40 contributor avatars as its hero image.
- **Vue** carries a 12-logo sponsor grid in the right rail, beside the table of contents.
- **Django** puts version and language switchers in floating pills pinned to the viewport corner.
- **Cloudflare** has a literal "Filter sidebar" input — filtering applied to navigation, not content.
- **Twilio** uses real documentary photography in a documentation hero.

---

## 3. Cross-cutting discoveries

These emerged only from looking at all 18 together, and are more valuable than any single reference.

### 3.1 LLM affordances are now standard in documentation — 9 of 18 (50%)

| Reference | Affordance |
|---|---|
| Stripe Docs | `Ask AI` button beside search |
| Vercel Docs | `Ask AI` in header |
| Prisma Docs | `Ask AI` + `Copy Markdown` + `Copy prompt` |
| Storybook Docs | `Copy markdown` + `Copy prompt` ("Ask your AI agent to set up Storybook for you") |
| Cloudflare Docs | `Copy prompt` showing four AI-tool icons |
| Supabase Docs | `AI Prompt` / `CLI` tabs — the prompt is a first-class quickstart |
| React Docs | `Copy page` |
| GitHub Docs | search field labelled "Search or ask Copilot" |
| Shopify.dev | `Ask assistant` with `/` shortcut |

Half the sample now treats a coding agent as a reader with equal standing to a person. This is a live pattern ADI's own documentation should adopt, and it did not exist in the library before this batch.

### 3.2 Funding is visible inside the reading layout — 3 of 18

- **MDN** — two advertising slots, one above the masthead and one full-width in the page body
- **Vue** — sponsor logo grid plus a dark ad card in the right rail
- **Django** — a donation appeal with a named donor in the documentation rail

Worth recording because ADI's references skew heavily commercial; these show how non-commercial and community projects fund the same surface.

### 3.3 Documentation is overwhelmingly light-themed

15 of 18 are light pages. Only MDN (dark hero) and Twilio (dark navy shell) invert it. Dark code panels on light ground is the dominant convention — the opposite of the assumption baked into my import metadata.

---

## 4. Taxonomy verification

The extended vocabulary is now populated by real references rather than existing only as constants:

| Term | References carrying it (library-wide) |
|---|---|
| `Developer Tools` (industry) | 41 |
| `Search` (pattern) | 25 |
| `Content Discovery` (pattern) | 20 |
| `Documentation` (page type) | 20 |
| `Filtering` (pattern) | 7 |
| `Marketplace` (page type) | 4 |
| `Dashboard` (pattern) | 4 |
| `Portfolio Grid` (pattern) | 3 |

Before this batch every one of these counts was zero — the terms existed only as constants. `Architecture` remains at zero and will be exercised by a later batch.

Every value validated against the strict taxonomy on import. One genuine error was caught by that strictness: I used `"Modern"` as a style on 17 records and it is not in the vocabulary. It was remapped to `Clean`/`Sophisticated` rather than widening the vocabulary to accommodate my mistake.

---

## 5. Weak references

**None of the 18 warrant removal.** All are live, visually distinct, and carry evidence unavailable elsewhere in the library. Specifically considered and kept:

- **Vercel Docs vs Next.js Docs** — same company, near-identical monochrome palette. Kept both: Next.js demonstrates the parallel-tree/version selector pattern, Vercel demonstrates display typography in docs. Different lessons.
- **Storybook Docs vs Storybook homepage** — distinct URLs, distinct page types; the docs page carries the AI affordances, the homepage does not.
- **MDN** — the capture is the homepage, not a reference page. Kept, with the description corrected to say so. Its advertising evidence is unique in the library.

---

## 6. Capture quality issues

| Issue | References |
|---|---|
| Missing `mobile` asset | Stripe Docs, Tailwind CSS Docs, Netlify |
| Missing `fullpage` asset | GitHub, Render |
| Cookie-consent bar present in capture | Shopify.dev |

The missing assets are non-fatal by design — the driver treats mobile and full-page shots as best-effort so a slow secondary shot never destroys a successful desktop capture. All five have a valid desktop image, which is what the curation pass depends on.

The Shopify.dev cookie bar means `dismissOverlays` did not match its consent button. That is a driver improvement worth making before the remaining batches, since a consent wall on a hero shot would be a genuine loss.

---

## 7. Recommendations

1. **Do not import batch 2 until the remaining 32 batch-1 references are curated.** The 83% correction rate means uncurated references actively mislead.
2. **Widen `dismissOverlays`** to catch the Shopify-style consent bar before the next capture run.
3. **Retry the five incomplete asset sets** once the main run finishes — they are cheap and the pipeline now handles the failure modes that caused them.
4. **Record the LLM-affordance pattern** as a first-class finding. It is the most actionable thing in this batch and it applies directly to ADI's own documentation.

---

*Every claim in this report is traceable to a stored screenshot under `data/assets/`. Where the capture did not show something, the claim was deleted rather than softened.*
