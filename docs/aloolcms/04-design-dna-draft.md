# AloolCMS — Design DNA Draft (Manual)

**Status:** `draft` — human-authored from ADI observations  
**Not written via:** `POST /api/projects/:id/design-dna` (provider `unavailable`)  
**When keys land:** regenerate via API and replace this file; keep evidence citations.

**Project:** `5e3d5cb0-130d-498e-a7a6-f2ff4d31eb4e`  
**Evidence base:** collection `36f743c3…` · **24/24 observed**

---

## visualLanguage

- **overallStyle:** Editorial-instrument; calm technical; archive-index
- **visualCharacteristics:** Hairline rules; bordered panels; dark-shell optional; paper stage; sparse imagery inside admin
- **designPrinciples:** Hierarchy via type; one accent; density as a mode; translate marketing patterns before use

*Evidence:* Medium Density (9), Light Theme (13), Single Accent (7), Bordered Panels / Rule Separated (library), Mixed Serif And Sans (lift ~4.8×)

## colorDirection

- **paletteCharacteristics:** Warm or cool paper + near-black ink; single accent family
- **dominantApproach:** Structural colour (not categorical rainbow tags)
- **contrast:** High for body; meta at AA greys
- **usagePatterns:** Accent for active nav, focus, primary publish; semantic red/amber separate from brand

*Evidence:* Single Accent Colour; Light Theme majority; Dark Theme / Dark Shell Light Body as shell options. Existing seed coral `#FF5E3A` is equity, not locked by DNA.

## typography

- **typographyStyles:** Sans UI body; serif or display for titles; mono for machine facts
- **hierarchyPatterns:** Uppercase eyebrow → display title → body; one display element per region
- **scaleCharacteristics:** Display-scale headings reserved for page titles / empty states
- **fontCharacteristics:** Mixed serif+sans is distinctive in this set; monospace accent for status/IDs

*Evidence:* Sans Body (11), Display Scale Heading (9), Monospace Accent (library 17), Mixed Serif And Sans (3 in collection, high lift), Uppercase Eyebrow (library)

## layout

- **layoutPatterns:** App shell with grouped left sidebar; dual-pane composer; bordered content panels
- **gridPatterns:** Table-first catalogues; optional work-queue boards using rule meshes
- **spacingPatterns:** Medium density default; 4px baseline compatible with AloolCMS seed
- **compositionPatterns:** Paired editor/preview; avoid full-bleed heroes in admin

*Evidence:* Left Sidebar / Grouped Sidebar Sections (library); Code Panel Pairing distinctive; Full Bleed Hero present in marketing refs — **anti-pattern for admin**

## imagery

- **imageryStyles:** Prefer product UI / none inside console; no stock lifestyle
- **photographyCharacteristics:** N/A for admin core
- **illustrationCharacteristics:** Typographic empty states over mascots
- **imageTreatment:** Media library is the image surface; elsewhere restraint

*Evidence:* No Imagery / Product Screenshot traits; PlanetScale “monospace prose, logo grid only”

## components

- **navigationPatterns:** Grouped sidebar sections; optional top utility; sticky page header
- **heroPatterns:** None in admin — use desk/work queue instead
- **cardPatterns:** Bordered panels / rule grids; not soft elevated SaaS cards
- **ctaPatterns:** One primary filled action per view; secondary as text/ghost
- **footerPatterns:** Minimal shell footer or none
- **otherPatterns:** Search field + keyboard shortcut hint; copy-to-clipboard; theme toggle; tabbed inspectors

*Evidence:* Header Search (13), Keyboard Shortcut Hint (8), Copy To Clipboard (7), Theme Toggle (observed), Tabbed Content (distinctive)

## motionInteraction

- **animationPatterns:** Short opacity/transform only; no bounce
- **interactionPatterns:** Inline publish toggles; confirm destructive; command jump
- **transitionPatterns:** Panel swaps; list skeleton → content

*Evidence:* Product refs emphasize precision over cinema; AloolCMS BUILD_PLAN already specifies `cubic-bezier(0.2,0,0,1)`

## contentPresentation

- **storytellingPatterns:** Desk narrative (“what needs an editor”); not vanity metrics
- **contentHierarchy:** Kicker / title / actions / body
- **contentPatterns:** Tables with row rules; status stamps/tags in mono

## patterns

- **recurringPatterns:** Grouped rail; medium density; single accent; search+shortcut; bordered panels
- **strongPatterns:** Mixed serif/sans titles; paired composer/preview; dark shell + light body
- **emergingPatterns:** Suggestion chips in empty search (GitLab); filter-in-nav (Cloudflare) → Content catalogue filter

## antiPatterns

- **avoidPatterns:** Signup-in-header; announcement bars; full-bleed admin heroes; multi-accent rainbow; glassmorphism; purple AI gradients
- **overusedPatterns:** Three equal SaaS feature cards; generic dashboard stat tiles
- **conflictsWithBrief:** Pixel page-builders; client brand inside product core; copying Sanity/Strapi chrome wholesale

## keyInsights

1. The collection’s strongest *admin-translatable* signals are docs-shell IA (grouped sidebar, search, shortcuts), not marketing heroes.
2. Mixed serif/sans is a distinctive, evidence-backed way to keep Editorial Console equity without looking generic.
3. Paired surfaces (editor ↔ preview) have direct analogues in code-panel pairing and Retool’s builder framing.
4. Medium density + bordered panels beats both sparse luxury and ops cockpits for all-day editing.
5. AI Design DNA should be regenerated when credentials exist; this draft is a bridge, not a substitute for provider synthesis forever.

## Evidence limitations

- Observation coverage complete (24/24).
- No pure CMS-admin specimens in library; Retool is the closest builder analogue.
- This draft predated the live multi-screen explorer; regenerate via API when `OPENAI_API_KEY` is available.
