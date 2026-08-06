# Phase 3 — Milestone 1 Report: Complete Batch 1

**Date:** 2026-08-05
**Status:** Complete and verified

---

## Objective

Bring the 32 uncurated Batch 1 references to the same quality level as the 18 already curated: verify screenshots, verify taxonomy, correct metadata, rewrite `whySaved` and `whatToLearn`, record structured observations, verify AI affordances and capture completeness — using only observable facts.

## Architecture

No new architecture. Reused existing pillars exactly as they stand:

- **Capture pipeline** — read-only. Every claim derives from the stored `desktop.webp` under `data/assets/`.
- **Taxonomy** — validated against the existing closed vocabulary; no new terms needed.
- **Observations** (`domain/observations.ts`, migration 0007) — all facts written as `provenance: "observed"` with `evidenceAssetId` pointing at the exact capture and `recordedBy: "batch-1-curation"`.
- **References API** — metadata via the existing `PUT /api/references/:id`.

## Files changed

| File | Change |
|---|---|
| Database only | 32 references updated; 536 observations inserted |
| `docs/PHASE-3-MILESTONE-1-REPORT.md` | this report |

No source files were modified. Milestone 1 is a data milestone.

Working files (scratchpad, not committed): `m1_group1–4.json` hold the per-reference evidence records; `apply_m1.py` is the idempotent applier.

## Database impact

| | Before | After |
|---|---|---|
| References with observations | 18 | **50** |
| Total observations | 308 | **844** |
| Batch 1 curated | 18 / 50 | **50 / 50** |

Additive only. No reference, asset, collection, project or Design DNA row was deleted. Observations upsert on `(reference, category, trait, provenance)`, so re-running is safe.

## API impact

None. No endpoint added, removed or changed shape.

## UI impact

None directly, but all four existing observation surfaces now carry ~2.7× the data: the reference panel, `/patterns` recurrence, `/patterns` compare, and the collection summary.

## Performance impact

Negligible. 844 rows across three indexes. `traitCounts` and `cooccurrence` are single grouped SQL statements; the co-occurrence self-join is bounded by `HAVING count >= 3` and `LIMIT`.

## Tests

```
npm test        134/134 pass, 0 fail
typecheck       clean
build           clean (api + web)
```

No regressions.

---

## What the evidence corrected

Metadata written at import time was wrong at a high rate — consistent with the 83% correction rate found in the documentation segment. Notable corrections:

| Reference | Import claim | What the capture shows |
|---|---|---|
| **Midjourney** | "dense image-first gallery, masonry" | An ASCII/text-character field forming the wordmark; an About page in monospace. No gallery. |
| **Grafana** | "dark, high-density dashboard visuals" | A **light** pastel-gradient marketing page. No dashboards. |
| **Suno** | "browsable feed of community tracks" | A single prompt bar on a grainy gradient. No feed. |
| **Luma AI** | "full-bleed generated video, cinematic" | Pure black, text-only hero. No video. |
| **LangChain** | "visualises chains and agent graphs" | A Benjamin Franklin engraving where the kite is a rocket. |
| **Together AI** | "benchmarks and a model catalogue" | An annotated 3D render. Neither present. |
| **PlanetScale** | "benchmark-driven claims" | Monospace prose and a logo grid. No benchmarks, no display hero. |
| **W&B** | "built from live dashboards and charts" | A serif headline with a handwritten yellow correction. No charts. |
| **JetBrains** | "product family colour systems" | One blue radial gradient and an agent-picker dropdown. |
| **Postman / Docker / Retool** | "marketplace / mascot / builder canvas" | Agent-oriented heroes in all three. |

## Cross-cutting findings

**1. Agent-directed interfaces are now a distinct pattern.** 26 observations across 7 `ai` traits, and the specific instances matter more than the count:

- **Netlify** publishes `fetch https://netlify.ai` as a CTA — a URL for coding agents to consume.
- **Pinecone** tabs its install snippet by AI tool: `{Cursor} {Copilot} {Codex} {Gemini} {CLI} {MCP}`.
- **Docker** shows an agent session (`$ sbx run codex`) as its hero artefact.
- **Retool** offers "Build via MCP" as a first-class entry point.
- **JetBrains** argues for agent neutrality by showing a dropdown naming three competing agents.

**2. Prompt-as-homepage.** OpenAI, Perplexity, Suno, Luma and Retool all replace the hero with an input. Five of 32.

**3. Serif and monospace are re-entering developer marketing.** Railway (serif display), W&B (serif headline), PlanetScale (monospace throughout), Warp, LlamaIndex, Together AI, Neon (monospace chrome).

## Capture completeness

| Issue | References |
|---|---|
| Consent modal or banner in capture | Pinecone, Mistral, Postman, Netlify |
| Search overlay open | GitLab |
| Header skeleton loaders visible | Railway |
| Missing `mobile` asset | Stripe Docs, Tailwind Docs, Netlify |
| Missing `fullpage` asset | GitHub, Render |

All were recorded honestly rather than described around — the GitLab overlay in particular documents a real suggestion-chip UI, and the four consent banners are recorded as `accessibility: Consent Banner Present`.

## Known limitations

1. **`dismissOverlays` does not catch four consent patterns** (Pinecone, Mistral, Postman, Netlify). The capture pipeline is out of scope for this phase per the brief, so this is recorded, not fixed.
2. **The vocabulary lacks a "Monospace Body" trait.** PlanetScale sets its entire page in monospace; the closest available term is `Monospace Accent`, which understates it.
3. **Observations cover 50 of 153 references (33%).** The 103 pre-Batch-1 references are captured but unobserved.
4. **Mobile and fullpage assets were not reviewed** — curation used the desktop capture only.

## Future opportunities

- Extend the vocabulary with `Monospace Body` and an `agent-directed` grouping under `ai`.
- Observe the 103 older references to lift coverage from 33% to 100%.
- Review mobile captures to populate a responsive-behaviour axis.
