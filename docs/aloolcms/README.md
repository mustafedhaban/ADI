# AloolCMS — ADI Design Workflow

**ADI project:** [AloolCMS Design System](http://127.0.0.1:5173/projects/5e3d5cb0-130d-498e-a7a6-f2ff4d31eb4e) (`5e3d5cb0-130d-498e-a7a6-f2ff4d31eb4e`)  
**Research collection:** [AloolCMS Console Research](http://127.0.0.1:5173/collections/36f743c3-ec00-4a24-b283-9fa62f0aad11) (`36f743c3-ec00-4a24-b283-9fa62f0aad11`)  
**Live prototypes (new):** [http://127.0.0.1:5173/concepts/aloolcms](http://127.0.0.1:5173/concepts/aloolcms)
**Target codebase:** `~/Desktop/poc/aloolcms`  
**Date:** 2026-08-06

ADI owns research → patterns → direction → Design DNA → exploration. AloolCMS is the implementation target.

| Doc | Purpose |
|---|---|
| [01-understanding.md](./01-understanding.md) | Confirmed / assumed / unknown about the product |
| [02-evidence-patterns.md](./02-evidence-patterns.md) | Observation-backed patterns from the ADI collection |
| [03-design-direction.md](./03-design-direction.md) | Design strategy for the console |
| [04-design-dna-draft.md](./04-design-dna-draft.md) | Manual Design DNA draft (AI provider unavailable) |
| [05-directions.md](./05-directions.md) | Five exploration directions |
| [06-evaluation.md](./06-evaluation.md) | Compare + recommend two finalists |
| [concepts/](./concepts/) | Legacy single-screen HTML shells (superseded by live explorer) |

## Live explorer (source of truth for review)

Multi-screen React prototypes in ADI web — **Desk · Catalogue · Composer · Empty** per direction:

| Direction | URL |
|---|---|
| Index | `/concepts/aloolcms` |
| D1 Folio Shell | `/concepts/aloolcms/folio` |
| D2 Spec Instrument | `/concepts/aloolcms/spec` |
| D3 Compose Pair | `/concepts/aloolcms/compose` |
| D4 Ledger Index | `/concepts/aloolcms/ledger` |
| D5 Facet Desk | `/concepts/aloolcms/facet` |

Code: `apps/web/src/concepts/aloolcms/`

## Status

- [x] ADI project + research brief
- [x] Curated collection (24 refs; docs/archives/tools bias)
- [x] Observation synthesis (**24/24 observed**)
- [x] Design direction (evidence-linked)
- [x] Design DNA **draft** (manual — OpenAI unavailable)
- [x] Five directions + evaluation docs
- [x] **Multi-screen live prototypes** in ADI (`/concepts/aloolcms`)
- [x] **Round 2 Folio Shell** (D1 + D3 compose pair + D5 facets + ⌘K)
- [ ] AI Design DNA generation (blocked: no `OPENAI_API_KEY`)
- [x] Advancing finalist selected: **D1 Folio Shell**
- [ ] Port Folio into `~/Desktop/poc/aloolcms` admin

## Supersedes

- Freestanding drafts under `aloolcms/docs/design/` (outside ADI, not evidence-backed).
- Thin HTML shells in `docs/aloolcms/concepts/*.html` — kept for archive; review the live explorer instead.
