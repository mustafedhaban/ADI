# Alool Design Intelligence (ADI)

Local-first design research and inspiration library. v1 focuses on the Reference Library.

## Architecture

```
React (apps/web)  →  HTTP  →  Fastify (apps/api)  →  Drizzle  →  SQLite (data/adi.db)
```

Domain validation and taxonomy live in `apps/api/src/domain` and stay independent of the database driver so the data layer can later migrate to Frappe.

## Setup

```bash
npm install
npm run db:setup
```

## Run

```bash
# Terminal 1 — API (http://127.0.0.1:3001)
npm run dev:api

# Terminal 2 — Web (http://127.0.0.1:5173)
npm run dev:web
```

The Vite dev server proxies `/api` to the Fastify backend.

## Database

```bash
npm run db:generate   # generate migrations from schema (optional)
npm run db:migrate    # apply migrations to data/adi.db
npm run db:seed       # seed taxonomy from DESIGN-TAXONOMY.md
npm run db:setup      # migrate + seed
```

## Import

1. Place JSON files under `imports/references/` (see `docs/REFERENCE-IMPORT-SPEC.md`).
2. Open **Import** in the UI, upload the file, review the preview, then confirm.
3. Or POST to the API:

```bash
# Preview
curl -s http://127.0.0.1:3001/api/import/preview \
  -H 'Content-Type: application/json' \
  -d @imports/references/references-sample.json | jq

# Confirm import
curl -s http://127.0.0.1:3001/api/import/confirm \
  -H 'Content-Type: application/json' \
  -d @imports/references/references-sample.json | jq
```

## Docs

- `docs/PROJECT-CONTEXT.md`
- `docs/DESIGN-TAXONOMY.md`
- `docs/REFERENCE-IMPORT-SPEC.md`
