# AloolCMS — Design Understanding (ADI Phase)

**Project ID:** `5e3d5cb0-130d-498e-a7a6-f2ff4d31eb4e`  
**Source of product facts:** `~/Desktop/poc/aloolcms` (README, STATE, ROADMAP, BUILD_PLAN)  
**Source of design evidence:** ADI collection `36f743c3-ec00-4a24-b283-9fa62f0aad11`

## Objective

Understand the product before proposing identity. Separate facts from guesses.

## Confirmed facts

1. AloolCMS is a monorepo headless CMS: Hono + SQLite API, React admin, multi-template public web.
2. Product thesis: agency installs once; developer ships themes; editor builds the site in console.
3. Hybrid model: **collections stay typed; layout becomes blocks** (`collectionRef`).
4. Admin aesthetic seed exists: “Editorial Console” — Instrument Serif, Geist, coral `#FF5E3A`, paper `#FBF9F5` (BUILD_PLAN §A.1).
5. Nav groups: Site · Pages · Content · Library · System.
6. Spec-driven forms via `@alool/core` FieldSpec; page composer + preview exist.
7. Track E (experience) vs Track S (systems); cursor currently on v0.8 Systems.
8. Auth is flat today; roles arrive later.
9. Not a pixel page-builder, not a plugin marketplace, not Postgres-required.

## Reasonable assumptions

1. Near-term daily user is a trusted agency editor/operator, not a self-serve SMB buyer.
2. Success = editorial confidence (preview fidelity, publish safety), not marketing conversion of the admin.
3. ADI research should bias toward **instrument / docs / archive** references when designing the console (marketing-site traits need translation).

## Unknown

1. Business model / pricing / competitive positioning beyond category names.
2. External Alool brand kit beyond in-repo tokens.
3. Real editor task research (frequency, pain quotes).
4. Whether Editorial Console should be evolved or replaced (decision after evaluation).

## Design opportunities

1. Work-queue dashboard instead of vanity counts (also named in AloolCMS ROADMAP).
2. IA for a long Content catalogue.
3. Page composer as hero surface.
4. Identity from system grammar (type, rules, states) — aligns with ADI archive philosophy.
5. Token discipline (CSS variables vs hardcoded hex / shadcn radius drift).

## UX / technical risks

- Applying marketing traits (announcement bars, signup CTAs, full-bleed heroes) to admin chrome.
- Dual admin/web font stacks without intentional relationship.
- Flat auth + open signup trust debt.
- Design DNA AI synthesis blocked without provider credentials.

## ADI artifacts

- Project brief stored on the ADI project record.
- Collection curated toward docs shells, archives, dense tools, calm product instruments.
