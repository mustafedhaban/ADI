import type { FastifyInstance } from "fastify";
import type { ReferenceRepository } from "../repositories/reference-repository.js";
import { validateReferenceInput, normalizeUrl } from "../domain/validation.js";
import { resolveUrlPreview } from "../domain/resolve-url.js";
import { UrlSafetyError } from "../domain/url-safety.js";

function parseListParam(value: unknown): string[] | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

export async function referenceRoutes(
  app: FastifyInstance,
  repo: ReferenceRepository,
) {
  app.get("/api/references", async (request) => {
    const query = request.query as Record<string, unknown>;
    const items = repo.list({
      q: typeof query.q === "string" ? query.q : undefined,
      type: typeof query.type === "string" ? query.type : undefined,
      source: typeof query.source === "string" ? query.source : undefined,
      industries: parseListParam(query.industries),
      pageTypes: parseListParam(query.pageTypes),
      styles: parseListParam(query.styles),
      patterns: parseListParam(query.patterns),
      tags: parseListParam(query.tags),
    });
    return { items, total: items.length };
  });

  /** Resolve public webpage metadata for Quick URL Import. */
  app.post("/api/references/resolve", async (request, reply) => {
    const body = request.body as { url?: unknown };
    const url = typeof body?.url === "string" ? body.url : "";

    try {
      const preview = await resolveUrlPreview(url, {
        findExistingId: (normalized) => {
          const existing = repo.findByUrl(normalized);
          return existing?.id ?? null;
        },
      });
      return preview;
    } catch (err) {
      if (err instanceof UrlSafetyError) {
        return reply.status(400).send({
          error: err.message,
          code: err.code,
        });
      }
      request.log.error(err);
      return reply.status(502).send({
        error: "Failed to resolve URL metadata",
      });
    }
  });

  app.get("/api/references/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = repo.findById(id);
    if (!item) {
      return reply.status(404).send({ error: "Reference not found" });
    }
    return item;
  });

  app.post("/api/references", async (request, reply) => {
    const { data, issues } = validateReferenceInput(request.body);
    if (!data) {
      return reply.status(400).send({ error: "Validation failed", issues });
    }

    const existing = repo.findByUrl(data.url);
    if (existing) {
      return reply.status(409).send({
        error: "A reference with this URL already exists",
        existingId: existing.id,
        issues: [
          {
            field: "url",
            message: "URL already exists in the library",
            severity: "error",
          },
        ],
      });
    }

    // Also check normalized variants if client sent an unnormalized form
    const normalized = normalizeUrl(data.url);
    if (normalized && normalized !== data.url) {
      const existingNormalized = repo.findByUrl(normalized);
      if (existingNormalized) {
        return reply.status(409).send({
          error: "A reference with this URL already exists",
          existingId: existingNormalized.id,
        });
      }
    }

    const created = repo.create(data);
    return reply.status(201).send(created);
  });

  app.put("/api/references/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = repo.findById(id);
    if (!existing) {
      return reply.status(404).send({ error: "Reference not found" });
    }

    const { data, issues } = validateReferenceInput(request.body);
    if (!data) {
      return reply.status(400).send({ error: "Validation failed", issues });
    }

    const urlOwner = repo.findByUrl(data.url);
    if (urlOwner && urlOwner.id !== id) {
      return reply.status(409).send({
        error: "A reference with this URL already exists",
        existingId: urlOwner.id,
      });
    }

    const updated = repo.update(id, data);
    return updated;
  });

  app.delete("/api/references/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = repo.delete(id);
    if (!deleted) {
      return reply.status(404).send({ error: "Reference not found" });
    }
    return reply.status(204).send();
  });
}
