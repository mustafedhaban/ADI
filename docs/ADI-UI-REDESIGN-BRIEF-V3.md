# ADI Platform UI Redesign — Research Brief (v3)

**Project ID:** `53e27dd0-7625-4299-af1a-0c829b0303d3`  
**Collection:** ADI UI Redesign Research (`fc96845d-1239-48e9-8d51-33e09670d2c6`) — 30 references  
**Status:** Active · HTML exploration phase  
**Supersedes:** Prior brief + `ADI-UI-DESIGN-DIRECTION.md` warm-archive lock-in for this exploration

---

## Why v3 exists

The previous brief and design-direction doc converged on:

> warm paper · Instrument Serif · forest green · “studio archive”

That system is **shipping today** and is explicitly **out of scope as the target aesthetic**.  
v3 keeps the useful product constraint from v2 (**image:null → ADI is an index**), but opens strategic visual directions that **kill** the warm editorial lock-in.

---

## Product constraint (still true)

Every library reference currently has `image: null`.  
ADI cannot behave like Pinterest / Mobbin / Savee.  
**Typography + taxonomy + whySaved are the content.**

---

## Research lenses (from ADI collection)

| Lens | Collection anchors | What we learn |
|---|---|---|
| Metadata index | Pentagram, Typewolf, Hugging Face, Google Fonts | Rows/cards driven by metadata, not thumbnails |
| Editorial judgment | It's Nice That, Monocle, Hoefler&Co, The Verge, Future Fonts | whySaved as first-class voice |
| Dark technical product | Linear, Cursor, Raycast, Vercel, Superhuman, Framer | Calm density, mono facts, premium dark |
| Institutional clarity | Anthropic, Notion, Thoughtworks, IBM | Trust without warm archive nostalgia |
| Hard-edge experiment | Brutalist Websites | Contrast, borders, anti-decoration |
| Creative tool energy | Fantasy, Locomotive, Immaculate, Webflow | Studio craft without becoming a moodboard |

---

## Kill list (current ADI)

- Cream / tinted paper ground  
- Warm brown ink ramp as brand identity  
- Instrument Serif as display lock  
- Deep forest green as sole brand accent  
- Soft “mat on tint” card language as default  
- Feeling like a reference *book* rather than a research *instrument*

---

## Preserve (IA + features)

Left rail groups:

- **Browse:** Dashboard, Library, Collections  
- **Work:** Projects  
- **Add:** Quick Import, Add Reference, Bulk Import  

Also preserve: search/filter affordances, reference judgment fields, Collections/Projects mental model.

---

## Ten strategic directions (research-backed)

| # | Direction | Primary ADI anchors | Strategic bet |
|---|---|---|---|
| 01 | Obsidian Archive | Cursor, Raycast, Linear, Vercel | Dark vault; mono metadata |
| 02 | Precision Instrument | Anthropic, Notion, Thoughtworks, IBM | Cool Swiss/steel; clinical clarity |
| 03 | Gallery Index | Pentagram, Hoefler&Co, Immaculate | High-contrast sparse gallery |
| 04 | Signal Desk | Hugging Face, Superhuman, Linear | Dense ops scanning; amber signals |
| 05 | Soft Laboratory | Anthropic, Google Fonts, Notion | Cool mint/slate scientific calm |
| 06 | Brutal Spec | Brutalist Websites, Typewolf | Raw industrial; hard edges |
| 07 | Chromatic Facet | It's Nice That, The Verge, Future Fonts | Structured facet color (not rainbow noise) |
| 08 | Modular Blueprint | Framer, Webflow, Vercel | Drafting-board technical grid |
| 09 | Quiet Product | Notion, Pitch, Anthropic | Crisp modern product UI |
| 10 | Kinetic Studio | Fantasy, Locomotive, Framer, Runway* | Expressive studio tool (*avoid neon futurism) |

\*Runway is in-collection for energy only — do not adopt Futuristic neon.

---

## Deliverables (this phase)

1. Updated ADI project research brief (in-app) — done  
2. Collection refreshed to 30 refs — done  
3. HTML + Tailwind full-app shells for all 10 directions — regenerating from this brief  
4. React implementation — **in progress (Obsidian Archive)**

---

## Out of scope now

- AI Research / Tavily / OpenAI  
- Design DNA generation  
- Backend / schema changes  
- ~~Replacing production ADI UI in the React app~~ (now in progress)


---

## Shortlist (selected)

Human selection after reviewing the 10 HTML directions:

1. **01 Obsidian Archive** — dark technical vault (Cursor / Raycast / Linear / Vercel)
2. **05 Soft Laboratory** — cool institutional calm (Anthropic / Google Fonts / Notion)
3. **07 Chromatic Facet** — structured taxonomy color (It's Nice That / The Verge / Future Fonts)

**Winner:** **01 Obsidian Archive** — implementing in the React app.

Runners-up retained for comparison only: Soft Laboratory, Chromatic Facet.


---

## Obsidian Archive implementation (React)

Applied in `apps/web`:

- Dark vault tokens + IBM Plex Sans/Mono
- App rail, Library index (stats + right facets), denser cards with mint spine
- Compact filter sentence, full-width facet buttons
- Dashboard / Capture headers aligned to vault scale
- Dark toaster + dialog overlay
