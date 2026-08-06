# AloolCMS — Evidence & Patterns (from ADI Observations)

**Collection:** AloolCMS Console Research (`36f743c3-ec00-4a24-b283-9fa62f0aad11`)  
**Coverage:** **24 / 24** references have structured observations  
**Pulled:** 2026-08-06 via `GET /api/collections/:id/observations`  
**Updated:** 2026-08-06 — observed remaining 9 from desktop/fullpage captures (Linear, Raycast, Pentagram, Superhuman, Notion, Brutalist Websites, Mobbin, Oliver Wyman, Sagmeister & Walsh).

## Method

Evidence → Observation → Knowledge.  
Only traits with `observed` provenance count as evidence. Marketing-site traits are listed but **flagged for translation** before use on a CMS admin.

## Collection composition (after prune)

Kept / added for console relevance:

- **Docs shells:** Vercel Docs, Cloudflare Docs, Shopify.dev, Stripe Docs, Tailwind Docs, Storybook Docs, Supabase Docs, Svelte Docs, Rust Book
- **Archives / indexes:** Pentagram, Sagmeister & Walsh, Brutalist Websites, Hugging Face Spaces
- **Instruments / products:** PlanetScale, Retool, Linear, Notion, Raycast, Superhuman, Datadog, Weights & Biases, GitLab, Mobbin, Oliver Wyman

Removed from earlier pass: Midjourney, Neon, Locomotive, R/GA, Cursor marketing, Vercel homepage, Grafana marketing, Fantasy — too marketing-hero / weak for admin translation.

## Top traits in this collection (observed)

| Count | Category | Trait | Admin translation |
|---|---|---|---|
| 14 | navigation | Top Horizontal Nav | Optional top utility bar; not necessarily primary IA |
| 13 | search | Header Search Field | Global find / command entry |
| 13 | theme | Light Theme | Default editorial stage |
| 11 | typography | Sans Body | UI body |
| 9 | typography | Display Scale Heading | Page titles only |
| 9 | density | Medium Density | Default catalogue density |
| 9 | conversion | Primary CTA Button | Translate → primary publish/new actions |
| 9 | conversion | Signup In Header | **Do not copy** — marketing only |
| 8 | search | Keyboard Shortcut Hint | ⌘K / shortcut model (ROADMAP v0.9.5) |
| 7 | interaction | Copy To Clipboard Button | Copy IDs, slugs, preview links |
| 7 | theme | Single Accent Colour | One accent family |

## Distinctive vs whole library (lift)

Traits this collection over-indexes on (useful signals):

| Lift | Trait | Why it matters for AloolCMS |
|---|---|---|
| ~4.8× | Mixed Serif And Sans | Matches existing Editorial Console seed; display serif + UI sans |
| ~5.3× | Code Panel Pairing | Composer ↔ preview pairing metaphor |
| ~4.0× | Tabbed Content | Site config / block inspector sections |
| ~4.1× | Copy To Clipboard | Operator affordances |
| high | Keyboard Shortcut Hint (library-wide strong) | Command palette readiness |

Library-wide traits also relevant (not collection-exclusive):

- **Left Sidebar** (12 refs library) — Cloudflare, Storybook, React Learn, etc.
- **Grouped Sidebar Sections** (8) — natural match for Site · Pages · Content · Library · System
- **Bordered Panels** (14) — list/form/editor chrome without heavy shadows
- **Rule Separated Sections** — PlanetScale teaching example; hairline structure
- **Dark Theme / Dark Shell Light Body** — dual-surface shells (ADI itself uses paper; AloolCMS already uses dark rail + paper stage)
- **Monospace Accent** — status, IDs, timestamps
- **Uppercase Eyebrow** — kickers already in AloolCMS Header

## Pattern synthesis (knowledge layer)

### P1 — Index / instrument, not moodboard
Pentagram, Hugging Face, Brutalist Websites, ADI’s own UI direction: metadata and type carry hierarchy. AloolCMS collections are tabular knowledge — same principle.

### P2 — Grouped left rail + searchable jump
Docs shells prove grouped sidebars scale; keyboard search compensates for long trees (Content has 15 peers today).

### P3 — Single accent, light stage, optional dark shell
Single accent colour is common and already seeded (coral). Dark shell + light body is a rare but exact match to current AloolCMS chrome (2 library examples: MDN, Twilio) — validate as intentional, not accidental.

### P4 — Medium density with bordered panels
Avoid both sparse luxury dashboards and cockpit overload. Bordered panels > soft card shadows (aligns with ADI “rules not shadows”).

### P5 — Composer as paired surface
Code-panel pairing / Retool prompt-over-output suggests: editor + live preview as one instrument, not a separate “theme site.”

### P6 — Power-user path without dark-only lock-in
Raycast / Superhuman / Linear teach calm precision and shortcuts; they must not force the whole product into marketing-dark gradients.

## Anti-patterns (from evidence + brief)

1. Announcement bars / signup-in-header as product chrome.
2. Full-bleed marketing heroes inside the admin.
3. Multi-colour taxonomy tags (ADI UI direction + collection: colour is structural).
4. Vanity metric dashboards (product ROADMAP + weak teaching value in refs).
5. Copying competitor CMS UIs (Sanity/Strapi/Payload) — category context only.

## Pass-2 signals (newly observed)

| Reference | Console-useful signal | Do not paste into admin |
|---|---|---|
| Linear (product mock) | Left Sidebar + Grouped Sidebar Sections + Bordered Panels + Medium Density | Signup In Header (marketing chrome) |
| Raycast / Mobbin | Minimal Chrome, Single Accent, keyboard-first *product* story | Low-density marketing hero as console shell |
| Pentagram / Oliver Wyman | **Mixed Serif And Sans**, Uppercase Eyebrow, type-led index, warm paper (Oliver Wyman) | Full-bleed portfolio photography as admin chrome |
| Sagmeister & Walsh / Brutalist | Minimal Chrome, Monochrome, framed stage / No Imagery | Pure archive emptiness for daily editing |
| Superhuman | — | Announcement Bar, Multi Colour Palette, Abstract Gradient, glass marketing |
| Notion | Light Theme + Single Accent + clear hierarchy | Signup In Header / Social Proof Logos as product chrome |

## Gaps

- No dedicated CMS-admin references in library (Retool is closest “builder” analogue).
- AI Research / Design DNA providers unavailable without API keys.

## Next evidence actions

1. Optionally run AI Research for “headless CMS admin / publisher console” once Tavily+OpenAI configured.
2. Generate Design DNA via `POST /api/projects/:id/design-dna` when provider available — until then use [04-design-dna-draft.md](./04-design-dna-draft.md).
3. Human review of finalists in `concepts/` → winner → implement in `~/Desktop/poc/aloolcms`.
