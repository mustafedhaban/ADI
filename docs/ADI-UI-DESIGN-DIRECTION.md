# ADI UI Design Direction

**Project:** ADI Platform UI Redesign (`53e27dd0-7625-4299-af1a-0c829b0303d3`)
**Research collection:** ADI UI Redesign Research (`fc96845d-1239-48e9-8d51-33e09670d2c6`) — 24 curated references
**Status:** v2 — rebuilt from **captured screenshots** of all 24 references

> **v1 was wrong and was replaced.** It was written from reference *metadata* and
> text fetches, without ever looking at the sites. That produced a "specimen
> plate" that rendered the word OTHER on 91 of 104 cards, a dashboard charting
> the two lowest-variance axes, and a colour/type system inherited wholesale
> from the pre-existing app. All 24 sites were then captured with a headless
> browser and reviewed. This document reflects what was actually seen.
> Screenshots: `/tmp/adi-refs/`.

---

## 0. The constraint that shapes everything

Before any aesthetic decision: **every reference in the ADI library has `image: null`.**

All 104 references were bulk-imported from JSON, which does not fetch preview images. This is not a temporary data gap to design around — it is the actual shape of the product's data today, and likely for a long while.

This single fact invalidates the most obvious design move. A visual-first, image-led card grid — the Pinterest/Mobbin/Savee model — would render as 104 empty grey boxes. The library's value does not currently live in imagery. It lives in **structured judgement**: `whySaved`, `whatToLearn`, and five taxonomy axes (industries, pageTypes, styles, patterns, tags).

So ADI is not an image board. **ADI is an index.** The design direction follows from that.

---

## 1. Design philosophy

### ADI is a research index, not a moodboard

The closest structural analogues in the reference set are not the SaaS marketing sites — they are the **archives and indexes**: Pentagram's work archive (discipline × sector filtering), Typewolf's site index (chronological entries, thumbnail + title + metadata), Hugging Face's model hub (sidebar facets, compressed metadata rows), It's Nice That's feed (section headers, featured vs. routine hierarchy).

These four independently converge on the same thing: **a taxonomy-driven index where the metadata *is* the content.**

### Three commitments

**1. Typography carries the weight that images cannot.**
Because there are no thumbnails, hierarchy must come from type scale, weight, and spacing. The evidence supports this directly — Hoefler&Co, Monocle, Typewolf and Future Fonts are all in the collection specifically for typographic authority, and all four use type as the primary structural device.

**2. Editorial voice over algorithmic ranking.**
It's Nice That "prioritises editorial curatorial voice over algorithmic ranking, with hand-selected highlights." ADI is a *curated* library — a human decided each reference was worth keeping and wrote down why. `whySaved` is the most valuable field in the schema and the current UI hides it entirely. It should be visible in the card.

**3. Calm density.**
Hugging Face compresses a lot into each row and stays scannable. Linear uses "generous spacing… layering and spatial separation rather than explicit divisions." ADI needs both: dense enough to survey 104 references, calm enough to read. Density is a *mode*, not a default.

### What ADI should feel like

> **A well-kept studio archive.** Considered, warm, quietly technical. Like a reference book someone actually uses — annotated, indexed, and slightly worn in — rather than a dashboard someone was assigned.

Not clinical. Not playful. Not a productivity tool pretending to be exciting.

---

## 2. Visual language

| Principle | Expression |
|---|---|
| **Paper, not canvas** | Warm off-white ground (`#f7f5f1`), not neutral grey. Retains ADI's existing equity and reads as archival rather than generic-SaaS. |
| **Ink, not black** | Warm near-black (`#1c1917`) at full strength; a warm grey ramp beneath it. |
| **Rules, not shadows** | Structure comes from hairline rules and spatial grouping. Shadows are reserved for genuinely floating surfaces (dialogs, popovers). Evidence: Linear's "minimal border usage… layering and spatial separation"; Brutalist Websites' `borders` tag. |
| **One accent** | Deep forest green (`#1f3a2e`). Used for primary action and active state only. Never decorative. |
| **Mono for machine facts** | Counts, sources, dates, IDs, taxonomy axis labels. Establishes the technical thread evidenced by Vercel, Cursor, Raycast and Hugging Face without adopting their dark-gradient aesthetic. |
| **No gradients, no glass** | Six references carry a `gradient` tag (Cursor, Framer, Raycast, Runway, Vercel, Stripe). This is a marketing-site device for selling a product, not for reading an archive. Deliberately declined — see Anti-patterns. |

---

## 3. Colour direction

Colour is **structural, not expressive**. Five taxonomy axes × dozens of values means colour-coding categories would produce noise, not signal. Pentagram and Typewolf both run essentially monochrome and let type and position carry meaning. ADI does the same.

```
Paper   --paper       #f7f5f1   app ground
        --surface     #ffffff   cards, panels
        --surface-2   #f1ece3   inset / hover / code
Ink     --ink         #1c1917   primary text
        --ink-2       #57514a   secondary text  (~7.4:1 on paper)
        --ink-3       #6b6259   tertiary / meta (~5.1:1 on paper)
Rule    --rule        #e2dbcf   hairlines
        --rule-2      #cdc3b4   emphasised rules
Accent  --accent      #1f3a2e   primary action, active nav, links
        --accent-ink  #f7f5f1   text on accent
Signal  --signal      #7a5c25   AI / draft / in-progress states (ochre, AA on paper)
Alert   --alert       #9a2c1f   destructive only
```

**Rules of use**
- Accent green appears at most **twice** per screen region.
- Ochre `--signal` is reserved for AI-generated or unreviewed state (research candidates, Design DNA drafts). It means *"a machine made this, a human hasn't confirmed it."* Nothing else may use it.
- Taxonomy tags are ink-on-paper with a hairline. Never coloured by category.
- Destructive red only on genuinely destructive confirmation.

---

## 4. Typography

Three families, each with one job.

| Role | Family | Use |
|---|---|---|
| **Display** | Instrument Serif | Page titles, reference titles, section titles. The editorial voice. |
| **Text** | DM Sans | All UI, body, labels, buttons. |
| **Mono** | `ui-monospace, SFMono-Regular, Menlo` | Counts, sources, dates, axis labels, keyboard hints, URLs. System stack — no additional font loading. |

### Scale

```
display-xl   3.25rem / 1.05 / -0.02em   page title (Dashboard hero)
display-lg   2.25rem / 1.10 / -0.02em   page title
display-md   1.5rem  / 1.20 / -0.01em   section / card title
text-base    0.9375rem / 1.6            body
text-sm      0.875rem / 1.5             secondary
meta         0.6875rem / 1.4 / 0.08em   MONO, UPPERCASE — labels & axis names
```

### Rules
- **One display element per view region.** Serif is a punctuation mark, not a texture.
- Meta labels are always mono + uppercase + letterspaced. This is the single most repeated device in the system and it is what makes ADI legible without colour-coding.
- Body copy caps at `68ch`.
- Numerals in stat positions use `font-variant-numeric: tabular-nums`.

---

## 5. Layout

### Shell: persistent left rail

The current top navigation holds six items and already overflows horizontally on tablet. Every archive-scale reference in the collection uses persistent lateral navigation or expandable lateral facets (Hugging Face sidebar; Pentagram expandable discipline/sector menus).

```
┌──────────┬────────────────────────────────────────┐
│          │  page header (title + actions)         │
│  rail    ├────────────────────────────────────────┤
│  240px   │                                        │
│          │  content — max 1200px                  │
│  sticky  │                                        │
└──────────┴────────────────────────────────────────┘
```

- Rail collapses to a top bar under `lg`.
- Rail is grouped: **Browse** (Dashboard, Library, Collections) / **Work** (Projects) / **Add** (Quick Import, Add Reference, Bulk Import).
- Rail footer carries the live library count in mono — the archive tells you its size.

### Spacing

Base unit `4px`. Section rhythm `48px` desktop / `32px` mobile. Card padding `20px`. Grid gutter `16px`.

Linear's "substantial vertical gaps… each major feature area as a self-contained module" — sections are separated by space and a hairline, never by a box-within-a-box.

---

## 6. Navigation architecture

```
Dashboard        state of the archive + resume work
Library          all 104 references — the index
  └ Reference    single reference detail
Collections      curated sets
  └ Collection   set detail
Projects         client work
  └ Project      brief → research → collections → DNA → references
Add ▸            Quick Import URL / Add Reference / Bulk Import
```

**Principle:** Library is the noun. Collections are groupings of the noun. Projects consume collections. Nothing is nested deeper than two levels. Breadcrumbs are unnecessary at this depth; a single "back to X" affordance suffices.

---

## 7. Components

### 7.1 The specimen IS the content (solves the no-image problem)

**Evidence: Google Fonts.** It has no thumbnails either. Every row renders *the typeface itself* setting a sentence at ~40px, bleeding off the right edge. The content is the visual. You never fake an image — you render the thing's own attributes.

ADI's equivalent: a reference's **style terms, set large in their own character**, are the specimen. `Experimental / Dark / FUTURISTIC / CINEMATIC` — italic, bold, letterspaced mono, wide caps respectively — is a picture of that reference.

**Rejected (v1):** a tinted plate showing the source wordmark. Measured against real data it rendered `OTHER` on 91 of 104 cards (88%) and consumed 60% of every card. It was the empty box it claimed to replace.

### 7.1b Self-demonstrating taxonomy

**Evidence: Google Fonts' "Feeling" filter** — each pill is set in the style it names ("Fancy" in a script, "Vintage" in a vintage face, "Sophisticated" in a Didone). The filter demonstrates itself.

ADI applies this to all 25 style terms via `.sty-*` classes, using only the two families already loaded plus system mono — zero extra font requests. A design library that renders "Brutalist" in the same neutral UI font as "Elegant" is wasting its own claim.

### 7.2 Reference card (grid mode)

```
┌─────────────────────────────┐
│  specimen plate / image     │  4:3
├─────────────────────────────┤
│  WEBSITE · AWWWARDS         │  meta, mono
│  Pentagram — Design Studio  │  display-md, serif
│  Archive                    │
│  "Essential for deep        │  whySaved, 2 lines, italic
│   portfolio architecture."  │
│  Minimal  Editorial  +2     │  taxonomy tags
└─────────────────────────────┘
```

`whySaved` is promoted into the card. It is the curator's voice and the reason the reference exists.

### 7.3 Reference row (index mode)

A compact table-like row: title, source, type, styles, patterns, updated. Hugging Face's compression model — abbreviated, scannable, ~40px tall. This is how you survey 104 items.

**Grid ⇄ Index is a persistent user toggle.** Grid to browse, Index to survey.

### 7.4 Taxonomy tag

Small, mono, hairline-bordered, **clickable — applies the filter**. Pentagram does exactly this: "associated discipline and sector tags as clickable filters." Currently ADI's badges are inert. Making them active turns every card into a navigation surface.

### 7.5 Other primitives

- **Stat** — mono tabular numeral + meta label. No icon-in-a-box.
- **Section** — meta eyebrow + display title + optional action, separated by rule.
- **Empty state** — one line of what's missing, one action. Never an illustration.
- **Facet group** — collapsible, count-annotated, in the Library rail.

---

## 8. Library UX

The Library is the product. It gets the most attention.

**Primary control — the filter sentence.** *Evidence: Pentagram*, whose archive filter is a readable sentence with inline dropdowns: "We design [Signage & Environmental Graphics ▾] for [Civic & Public ▾]". ADI's reads **"Show [any style ▾] references using [any pattern ▾] for [any industry ▾]"**, set in the display face, with style options rendered in their own character. Five axes over 104 references is exactly where a checkbox wall stops being legible.

**Secondary control — facet pills.** *Evidence: Hugging Face*, whose filters are wrapped pill buttons with a `+44` overflow, not stacked checkbox lists. ADI shows 10 per axis with `+N` expansion.

**Layout:** sticky facet rail (248px, left) + results (right). Filters are *always visible*, never behind a "Filters (3)" button.

**Search:** single input, debounced, top of results. Typewolf's "hybrid discovery model combining search convenience with structured browsing" — both paths always available.

**Result bar:** `24 of 104 references` — filtered *and* total, per Google Fonts' "1,942 of 1,942 families". Active facets as removable chips (style chips in their own character), view toggle, select-mode toggle.

**Facets:** Type, Source, Industries, Page types, Styles, Patterns, Tags — collapsible groups, matching the API's existing filter contract exactly.

**Selection:** select mode → sticky action bar → add to collection. Preserved from current behaviour.

---

## 9. Collections UX

A collection is a **curated set with an argument** — it should feel like a mixtape sleeve, not a folder.

- Cover: 2×2 specimen mosaic from member references (existing `CollectionCover`, restyled).
- Detail header: display title, description as editorial standfirst, mono meta line (`24 references · used in 1 project`).
- Linked projects shown as chips — the collection knows what it serves.
- Same grid/index toggle as Library.

---

## 10. Projects UX

A project is a **narrative with stages**, not a settings page. The existing Project Detail is a long undifferentiated scroll of nine sections.

Restructure into a **stage rail**:

```
Overview → Research Brief → Research → Collections → Design DNA → References
```

Each stage is a section with a mono eyebrow, a completion cue, and its own actions. The rail is sticky and scroll-spies. This makes the pipeline legible — which is exactly what the product is *for*.

Design DNA and Research sections carry the ochre `--signal` treatment when content is AI-generated and unreviewed.

---

## 11. Research & Design DNA UX

Both are **machine-proposed, human-approved**. The UI must say so.

- AI-generated content sits on `--surface-2` with an ochre left rule and a mono `AI DRAFT` label.
- Once a human accepts/publishes, the ochre resolves to ink. Status is visible without reading text.
- Evidence links (`View Evidence`) are always adjacent to the claim they support — never in a separate tab. Traceability is the feature.
- Provider-unavailable states are stated plainly in mono, not hidden.

---

## 12. Interaction patterns

| Pattern | Rule |
|---|---|
| Hover | Rule darkens, background shifts to `--surface-2`. No lift, no scale. |
| Focus | 2px accent ring, `outline-offset: 2px`. Never removed. |
| Active nav | Accent left-rule + ink text. Not a filled pill. |
| Transitions | `120ms ease-out` on colour/border only. Never on layout. |
| Loading | Text (`Loading library…`) in mono. No skeleton shimmer. |
| Destructive | Always a dialog naming the consequence. |

Six references carry `scroll animation`. Declined for application UI — scroll choreography sells a marketing page; it obstructs a research tool used daily.

---

## 13. Responsive behaviour

| Breakpoint | Behaviour |
|---|---|
| `< 640` | Single column. Rail → top bar. Filters in a sheet. Index mode drops to title + source. |
| `640–1024` | 2-column grid. Rail → top bar. |
| `1024–1280` | Rail visible. 2-column grid. Library filter rail collapses to a sheet. |
| `> 1280` | Full: nav rail + filter rail + 3-column grid. |

Content max-width `1200px`. Tables and tag rows scroll inside their own container — the page body never scrolls horizontally.

---

## 14. Accessibility principles

- Body/meta text meets **WCAG AA**. The lightest text token `--ink-3` (#6b6259) on paper (#f7f5f1) is ~5.1:1; `--ink-2` (#57514a) is ~7.4:1. An earlier draft used #857d73, which measured ~3.5:1 and failed — it was darkened before implementation.
- `--signal` ochre is *never* the sole carrier of meaning — always paired with a text label.
- All interactive elements reachable by keyboard; visible focus ring everywhere.
- Filter groups are real `<fieldset>`/`<legend>`; the result count is an `aria-live` region.
- Icons that carry meaning have accessible names; decorative icons are `aria-hidden`.
- Specimen plates are `aria-hidden` — the title beside them already names the reference.
- Target size ≥ 32px for tags, ≥ 40px for buttons.

---

## 15. Anti-patterns — explicitly rejected

| Rejected | Why |
|---|---|
| **Image-first Pinterest grid** | No reference has an image. Would render 104 empty boxes. |
| **Dark gradient "AI product" skin** | Cursor/Runway/Vercel/Raycast use it to *sell*. ADI is used for hours in daylight. Adopting it would be copying an aesthetic without its purpose. |
| **Generic SaaS dashboard** | Four stat tiles with icons in rounded squares says nothing about a design archive. The dashboard should show the *shape of the collection*, not its row counts. |
| **Colour-coded taxonomy** | Five axes, dozens of values. Colour-coding produces confetti. Type and position carry it. |
| **Filters hidden behind a button** | Filtering is the primary interaction of an index. Persistent facets. |
| **Illustrated empty states** | Sentimental in a professional research tool. One sentence, one action. |
| **Card hover lift + scale** | Currently `hover:-translate-y-0.5`. Motion for its own sake; jitters in a dense grid. |
| **Scroll-linked animation** | Marketing device. Obstructs daily use. |
| **Copying Linear/Notion/Mobbin wholesale** | Their surfaces solve their problems. ADI's problem — a metadata-rich, image-poor curated archive — is not theirs. |

---

## 16. Reference influence map

Which of the 24 shaped which decision, and how.

Rebuilt from screenshots. Every row below was verified by looking at the site.

| Decision | Primary evidence | What was actually seen |
|---|---|---|
| **Content renders itself; no fake plate** | **Google Fonts** | No thumbnails anywhere — each row sets the typeface itself at ~40px, bleeding off the right edge |
| **Self-demonstrating style terms** | **Google Fonts** | "Feeling" pills each set in the style they name |
| **Filter as a sentence** | **Pentagram** | "We design [Signage & Environmental Graphics ▾] for [Civic & Public ▾]" |
| **Facet pills with +N overflow** | **Hugging Face** | Wrapped icon pills across Tasks/Libraries/Apps, `+44` overflow, range slider for numerics |
| **`X of Y` result count** | **Google Fonts** | "1,942 of 1,942 families" |
| **Mono as the interface voice** | **Future Fonts** | Every nav item and control set in monospace |
| **Tinted ground, content floats on it** | **Typewolf**, Future Fonts, Brutalist, Hoefler | All four use tinted/dark grounds — not white cards on off-white |
| **White mat framing** | **Typewolf** | Entries are images inset in a white mat with generous padding |
| **`LABEL — value` meta lines** | **Typewolf** | "FONTS — Grenette, Styrene" |
| **Edge-to-edge bands, hairline gutters** | **Hoefler&Co** | Full-bleed specimen panels with zero gutters, each its own colour field |
| **Masthead as structural anchor** | **Monocle** | Enormous centred high-contrast Didone, not a heading |
| **Compact feed strip with relative ages** | **It's Nice That** | "The Nice Feed · Refreshed 7h ago", 3 items, "3d" ages, "Explore All →" |
| **Em-dash rules, extreme sparseness** | **Brutalist Websites** | All-mono, flat grey, `—` as divider, 3-column, huge whitespace |
| **Style × pattern co-occurrence** | *none — ADI-specific* | No reference site does this; it is the one thing ADI's data supports that theirs does not |

### Superseded v1 map (metadata-only, kept for honesty)

| Decision | Primary evidence | Supporting |
|---|---|---|
| Index-over-moodboard model | **Pentagram** (discipline × sector archive), **Typewolf** (site index) | Brutalist Websites, It's Nice That |
| Persistent facet rail | **Hugging Face** (sidebar filter panel, verified) | Pentagram (expandable filter menus) |
| Clickable taxonomy tags on cards | **Pentagram** ("tags as clickable filters", verified) | Typewolf |
| Compressed index rows | **Hugging Face** (abbreviated metadata, verified) | Mobbin (screen density) |
| `whySaved` promoted to card | **It's Nice That** (editorial voice over algorithm, verified) | TED (curated discovery) |
| Grid ⇄ Index dual mode | **Mobbin**, **Hugging Face** | Google Fonts (specimen browse) |
| Specimen plate for missing images | **Hoefler&Co**, **Future Fonts** (type specimens) | Google Fonts |
| Serif display + mono meta | **Monocle**, **Typewolf**, **Hoefler&Co** | The Verge |
| Restraint, rules over shadows | **Linear** (verified: minimal borders, spatial separation) | Anthropic, Superhuman |
| Mono technical thread | **Vercel**, **Cursor**, **Raycast** | Hugging Face |
| Ochre = machine-generated | **Anthropic** (restrained AI tone, no hype) | Runway, Cursor |
| Project stage rail | **Notion** (use-case segmentation), **Pitch** | Figma (role-based paths) |
| Teaching a new model plainly | **Arc Browser**, **Descript** | Framer |
| Density without noise | **The Verge**, **It's Nice That** | Konga-style catalogues |
| Warm paper ground | *ADI's existing identity* — deliberately retained | Monocle, Future Fonts |

**Explicitly not copied:** Linear's dark chrome, Notion's illustration system, Mobbin's image grid, Vercel/Runway's gradients, Figma's colour system, Raycast's dark premium skin. Their *structural* lessons are used; their surfaces are not.

---

## 17. Success criteria

1. A researcher can survey all 104 references and locate a specific one in under 15 seconds.
2. Filtering never requires opening a panel.
3. `whySaved` is visible without opening a reference.
4. No screen looks like a generic SaaS admin template.
5. The absence of images reads as a deliberate typographic choice, not a bug.
6. AI-generated content is distinguishable from human-curated content at a glance.
