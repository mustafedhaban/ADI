import type { FastifyInstance } from "fastify";
import type { CollectionRepository } from "../repositories/collection-repository.js";
import {
  parseReferenceIds,
  validateCollectionInput,
} from "../domain/collection.js";

export async function collectionRoutes(
  app: FastifyInstance,
  repo: CollectionRepository,
) {
  app.get("/api/collections", async () => {
    const items = repo.list();
    return { items, total: items.length };
  });

  app.post("/api/collections", async (request, reply) => {
    const { data, issues } = validateCollectionInput(request.body);
    if (!data?.name) {
      return reply.status(400).send({ error: "Validation failed", issues });
    }
    const created = repo.create(data);
    return reply.status(201).send(created);
  });

  app.get("/api/collections/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = repo.findById(id);
    if (!item) {
      return reply.status(404).send({ error: "Collection not found" });
    }
    return item;
  });

  app.patch("/api/collections/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = repo.findById(id);
    if (!existing) {
      return reply.status(404).send({ error: "Collection not found" });
    }

    const { data, issues } = validateCollectionInput(request.body, {
      partial: true,
    });
    if (!data) {
      return reply.status(400).send({ error: "Validation failed", issues });
    }

    const updated = repo.update(id, data);
    return updated;
  });

  app.delete("/api/collections/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = repo.delete(id);
    if (!deleted) {
      return reply.status(404).send({ error: "Collection not found" });
    }
    return reply.status(204).send();
  });

  app.post("/api/collections/:id/references", async (request, reply) => {
    const { id } = request.params as { id: string };
    const collection = repo.findById(id);
    if (!collection) {
      return reply.status(404).send({ error: "Collection not found" });
    }

    const { referenceIds, issues } = parseReferenceIds(request.body);
    if (!referenceIds.length) {
      return reply.status(400).send({ error: "Validation failed", issues });
    }

    const result = repo.addReferences(id, referenceIds);
    if (result.missing.length && !result.added.length) {
      return reply.status(404).send({
        error: "One or more references were not found",
        ...result,
      });
    }

    const updated = repo.findById(id);
    return {
      ...result,
      collection: updated,
    };
  });

  app.delete(
    "/api/collections/:id/references/:referenceId",
    async (request, reply) => {
      const { id, referenceId } = request.params as {
        id: string;
        referenceId: string;
      };
      const collection = repo.findById(id);
      if (!collection) {
        return reply.status(404).send({ error: "Collection not found" });
      }

      const removed = repo.removeReference(id, referenceId);
      if (!removed) {
        return reply
          .status(404)
          .send({ error: "Reference is not in this collection" });
      }

      return reply.status(204).send();
    },
  );

  app.get("/api/references/:id/collections", async (request, reply) => {
    const { id } = request.params as { id: string };
    // 404 if reference missing is handled by checking via collections for empty vs missing
    // Keep simple: return collections for id; empty array if none
    const items = repo.listForReference(id);
    return { items, total: items.length };
  });
}
