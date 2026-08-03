import type { FastifyInstance } from "fastify";
import type { ReferenceRepository } from "../repositories/reference-repository.js";
import {
  importableRecords,
  validateImportPayload,
  type ValidatedImportRecord,
} from "../domain/validation.js";

interface ConfirmBody {
  records?: unknown[];
}

export async function importRoutes(
  app: FastifyInstance,
  repo: ReferenceRepository,
) {
  /** Preview / validate import JSON without writing. */
  app.post("/api/import/preview", async (request, reply) => {
    const result = validateImportPayload(
      request.body,
      repo.listAllUrls(),
    );

    if (!result.ok) {
      return reply.status(400).send({
        error: result.structureError,
        summary: result.summary,
        records: [],
      });
    }

    return {
      summary: result.summary,
      records: result.records.map(toPreviewRow),
      importableCount: importableRecords(result.records).length,
    };
  });

  /** Import valid (+ warning) records from a previously validated payload. */
  app.post("/api/import/confirm", async (request, reply) => {
    const result = validateImportPayload(
      request.body,
      repo.listAllUrls(),
    );

    if (!result.ok) {
      return reply.status(400).send({
        error: result.structureError,
        summary: result.summary,
      });
    }

    const toImport = importableRecords(result.records);
    const inputs = toImport.map((r) => r.data!);
    const imported = inputs.length ? repo.createMany(inputs) : [];

    return {
      imported: imported.length,
      skipped:
        result.summary.errors +
        result.summary.duplicates +
        (result.summary.total -
          result.summary.valid -
          result.summary.warnings -
          result.summary.errors -
          result.summary.duplicates),
      warnings: result.summary.warnings,
      duplicates: result.summary.duplicates,
      errors: result.summary.errors,
      items: imported,
      records: result.records.map(toPreviewRow),
    };
  });

  /** Convenience: accept raw array body wrapped if needed. */
  app.post("/api/import", async (request, reply) => {
    // Alias for confirm — full validate + import in one step
    const body = request.body as ConfirmBody & { references?: unknown[] };
    const payload =
      body && Array.isArray(body.references)
        ? body
        : { references: Array.isArray(body) ? body : body.records };

    const result = validateImportPayload(payload, repo.listAllUrls());

    if (!result.ok) {
      return reply.status(400).send({
        error: result.structureError,
        summary: result.summary,
      });
    }

    const toImport = importableRecords(result.records);
    const imported = toImport.length
      ? repo.createMany(toImport.map((r) => r.data!))
      : [];

    return reply.status(201).send({
      imported: imported.length,
      skipped: result.summary.errors + result.summary.duplicates,
      warnings: result.summary.warnings,
      duplicates: result.summary.duplicates,
      errors: result.summary.errors,
      items: imported,
      records: result.records.map(toPreviewRow),
    });
  });
}

function toPreviewRow(record: ValidatedImportRecord) {
  return {
    index: record.index,
    status: record.status,
    title: record.data?.title ?? null,
    source: record.data?.source ?? null,
    url: record.normalizedUrl ?? record.data?.url ?? null,
    type: record.data?.type ?? null,
    issues: record.issues,
  };
}
