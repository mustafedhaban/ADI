# Structured Visual Observations

**Date:** 2026-08-05
**Goal:** turn captured screenshots into queryable design knowledge, so AI Research and Design DNA read structured facts instead of re-analysing pixels.

---

## 1. The data model

### 1.1 Why a controlled vocabulary

Free-form notes cannot be counted. "has a sidebar on the left", "left-hand nav" and "sidebar nav" are the same fact written three ways, and no query can group them. The feature therefore rests on a **closed vocabulary**, exactly like `taxonomy.ts`: an unknown trait is an error, not a new term.

`apps/api/src/domain/observations.ts` defines **12 categories / 118 traits**:

| Category | Traits | Examples |
|---|---|---|
| `navigation` | 18 | Left Sidebar, On This Page TOC, Filter Field In Navigation, Floating Nav Controls |
| `search` | 9 | Header Search Field, Keyboard Shortcut Hint, Faceted Filters, Scoped Search Selector |
| `layout` | 13 | Three Column, Plain Link Directory, Logo Tile Grid, Narrow Reading Measure |
| `typography` | 10 | Serif Body, Monospace Accent, Display Scale Heading, Mixed Serif And Sans |
| `content` | 11 | Numbered Steps, Code Panel Pairing, Callout Box, Version Notice |
| `interaction` | 10 | Copy To Clipboard Button, API Preference Toggle, Package Manager Switcher |
| `density` | 3 | Low / Medium / High Density |
| `ai` | 7 | Ask AI Button, Copy Prompt, Copy As Markdown, AI Prompt Quickstart |
| `conversion` | 11 | Primary CTA Button, Sponsor Grid, Advertising Slot, Donation Appeal, Contributor Wall |
| `accessibility` | 8 | Visible Focus Ring, Low Contrast Text, Consent Banner Present |
| `media` | 11 | Documentary Photography, 3D Render, Avatar Grid, Pixel Art, No Imagery |
| `theme` | 7 | Light Theme, Dark Shell Light Body, Monochrome Palette, Tinted Ground |

Every trait names something a person can point at in a screenshot and agree on. "Left Sidebar" qualifies. "Elegant" does not — aesthetic judgement belongs in `styles`, which already exists.

### 1.2 Provenance — the central guarantee

```
observed  — visible in a captured asset.        THE SOURCE OF TRUTH
inferred  — a conclusion drawn from facts.      Carries a confidence score.
authored  — written by a person.                Opinion, context, intent.
```

Two mechanisms keep these from blurring:

1. **Validation refuses a confidence score on an `observed` fact.** A fact is visible or it is not; scoring one would let inference be recorded as evidence. This is enforced in `validateObservation` and covered by a test.
2. **Every aggregate endpoint defaults to `provenance=observed`.** A library-wide pattern claim can never be an accumulation of guesses.

### 1.3 Table

`reference_observations` — migration `0007_observations.sql`, additive only.

| Column | Purpose |
|---|---|
| `reference_id` | FK → `references`, **cascade** delete |
| `category`, `trait` | the controlled vocabulary pair |
| `provenance` | observed / inferred / authored |
| `detail` | short qualifier — "12 logos", "sidebar top" |
| `confidence` | 0–100, inferred only |
| `evidence_asset_id` | FK → `reference_assets`, **set null** on delete |
| `evidence_note` | where in the asset |
| `recorded_by` | curator handle, or an agent name for future AI passes |

Two deliberate choices:

- **`evidence_asset_id` is SET NULL, not CASCADE.** A recapture replaces assets; losing the evidence pointer must not delete the observation it justified.
- **Unique index on `(reference_id, category, trait, provenance)`.** A reference can assert a trait once as fact and once as inference, but cannot inflate a library-wide count by repeating itself. Writes are upserts, so re-reviewing a reference updates rather than duplicates.

---

## 2. API changes

All additive. No existing endpoint changed shape.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/observations/vocabulary` | the closed vocabulary, for UI pickers and for agents writing observations |
| `GET` | `/api/references/:id/observations` | one reference, grouped by category, with per-provenance counts |
| `POST` | `/api/references/:id/observations` | record one or many; all-or-nothing on validation failure |
| `DELETE` | `/api/observations/:id` | remove one |
| `GET` | `/api/observations/compare?referenceIds=…` | 2–8 references as a trait matrix |
| `GET` | `/api/collections/:id/observations` | collection summary + distinctiveness |
| `GET` | `/api/observations/patterns` | library-wide recurrence + co-occurrence |
| `GET` | `/api/observations/trait?category=&trait=` | drill-down: which references carry a trait |

Aggregation is SQL, not in-process filtering — the library is heading for ~300 references with a dozen observations each.

`distinctiveTraits` computes **lift**: a trait's share inside a scope divided by its share library-wide. A collection where every reference has a header search field tells you nothing, because so does the rest of the library. A collection where half carry a sponsor grid is a finding.

---

## 3. UI changes

| Surface | Location | What it answers |
|---|---|---|
| Observation panel | reference detail, under the captured assets | "What does this interface actually do?" |
| Compare | `/patterns` → Compare tab | "How do these references differ?" |
| Collection summary | collection detail | "What do these have in common, and what makes them unusual?" |
| Recurrence + co-occurrence | `/patterns` → Recurrence tab | "What is normal across the library?" |

Provenance is carried by **the mark to the left of each trait, not by colour alone**:

```
│  observed   solid rule, full-strength ink
┆  inferred   dashed rule, muted, confidence shown
│  "authored" quote marks, italic
```

Observed facts sort first in every list.

The compare view shades rows shared by all selected references and marks traits carried by exactly one — so "what they agree on" and "what makes this one different" are both readable off a single table.

---

## 4. Migration impact

**None to existing data.** Migration 0007 only creates a table and three indexes. No `ALTER`, no `UPDATE`, no backfill.

Verified after migrating:

```
references: 153    assets: 687    captured: 142    failed: 2
tests: 134/134     typecheck: clean     build: clean
```

References, collections, projects, captures and Design DNA are untouched. The capture pipeline was not modified.

---

## 5. Seeded data

The 18 documentation references curated in the previous phase were seeded with **308 observed facts**, each pointing at the desktop capture it was read from. Nothing was invented: where a capture did not show something, no observation was written.

Immediate output from `/api/observations/patterns`:

| Count | Trait |
|---|---|
| 18 | Header Search Field |
| 16 | Light Theme · Sans Body · Top Horizontal Nav |
| 14 | Keyboard Shortcut Hint |
| 11 | Left Sidebar · Medium Density · Single Accent Colour |

Comparing Svelte, Next.js and Vue docs: **8 traits shared** (Three Column, Left Sidebar, On This Page TOC, High Density, …), with `Serif Body` correctly isolated as unique to Svelte. That is the kind of statement the library could not previously make at all.

---

## 6. How this improves AI Research and Design DNA

**Before:** every consumer had to re-derive meaning from screenshots. A Design DNA run over 24 references meant 24 vision passes, produced non-comparable prose, and could not be audited.

**After:**

1. **Vision work happens once.** A capture is analysed at curation time and the result persists. Design DNA reads `GET /api/references/:id/observations` — structured JSON, no image tokens.
2. **Evidence is separable from reasoning.** Design DNA can now cite: *"9 of 18 references carry an AI affordance"* is a countable fact with a drill-down, not a claim. Its own conclusions get written back as `provenance: inferred` with a confidence score, permanently distinguishable from the facts they rest on.
3. **Prompts get smaller and better.** Instead of "here are 24 screenshots", a research prompt becomes "these 24 references share Three Column, Left Sidebar and Copy Prompt; three are outliers on typography" — denser, cheaper, and deterministic.
4. **Recommendations become falsifiable.** "Use a filter rail" can be traced to the references that demonstrate it via `/api/observations/trait`.
5. **Agents can write observations.** `recordedBy` exists for exactly this: a future vision agent records `observed` facts under its own name, subject to the same closed vocabulary and the same refusal to attach confidence to a fact.

---

## 7. Known gaps

- **The collection summary endpoint has not been exercised with data.** It returns the correct empty shape, but neither existing collection contains an observed reference, so the non-empty path is unproven. Adding any of the 18 documentation references to a collection would close this.
- **Coverage is 18 of 153 references (12%).** The remaining batch-1 references are still capturing; the other 103 predate this phase.
- **No write UI yet.** Observations are recorded via the API. The panel reads and displays; it does not yet edit. A picker driven by `/api/observations/vocabulary` is the natural next step.

---

*The vocabulary is closed on purpose. If a needed trait is missing, add it to `TRAITS` with a test — do not loosen validation.*
