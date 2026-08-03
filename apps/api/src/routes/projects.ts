import type { FastifyInstance } from "fastify";
import type { ProjectRepository } from "../repositories/project-repository.js";
import {
  parseCollectionIds,
  validateProjectInput,
  type ProjectStatus,
} from "../domain/project.js";

export async function projectRoutes(
  app: FastifyInstance,
  repo: ProjectRepository,
) {
  app.get("/api/projects", async (request) => {
    const query = request.query as { status?: string };
    const status =
      query.status === "active" || query.status === "archived"
        ? (query.status as ProjectStatus)
        : undefined;
    const items = repo.list(status);
    return { items, total: items.length };
  });

  app.post("/api/projects", async (request, reply) => {
    const { data, issues } = validateProjectInput(request.body);
    if (!data?.name) {
      return reply.status(400).send({ error: "Validation failed", issues });
    }
    const created = repo.create(data);
    return reply.status(201).send(created);
  });

  app.get("/api/projects/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = repo.findById(id);
    if (!item) {
      return reply.status(404).send({ error: "Project not found" });
    }
    return item;
  });

  app.patch("/api/projects/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = repo.findById(id);
    if (!existing) {
      return reply.status(404).send({ error: "Project not found" });
    }

    const { data, issues } = validateProjectInput(request.body, {
      partial: true,
    });
    if (!data) {
      return reply.status(400).send({ error: "Validation failed", issues });
    }

    return repo.update(id, data);
  });

  app.delete("/api/projects/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = repo.delete(id);
    if (!deleted) {
      return reply.status(404).send({ error: "Project not found" });
    }
    return reply.status(204).send();
  });

  app.get("/api/projects/:id/collections", async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = repo.findById(id);
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }
    return { items: project.collections, total: project.collections.length };
  });

  app.post("/api/projects/:id/collections", async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = repo.findById(id);
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }

    const { collectionIds, issues } = parseCollectionIds(request.body);
    if (!collectionIds.length) {
      return reply.status(400).send({ error: "Validation failed", issues });
    }

    const result = repo.addCollections(id, collectionIds);
    if (result.missing.length && !result.added.length) {
      return reply.status(404).send({
        error: "One or more collections were not found",
        ...result,
      });
    }

    return {
      ...result,
      project: repo.findById(id),
    };
  });

  app.delete(
    "/api/projects/:id/collections/:collectionId",
    async (request, reply) => {
      const { id, collectionId } = request.params as {
        id: string;
        collectionId: string;
      };
      const project = repo.findById(id);
      if (!project) {
        return reply.status(404).send({ error: "Project not found" });
      }

      const removed = repo.removeCollection(id, collectionId);
      if (!removed) {
        return reply
          .status(404)
          .send({ error: "Collection is not linked to this project" });
      }

      return reply.status(204).send();
    },
  );

  app.get("/api/collections/:id/projects", async (request, reply) => {
    const { id } = request.params as { id: string };
    const items = repo.listForCollection(id);
    return { items, total: items.length };
  });
}
