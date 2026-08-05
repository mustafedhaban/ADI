import type { FastifyInstance } from "fastify";
import {
  DESIGN_DNA_SECTIONS,
  mergeDesignDnaStructure,
  validateDesignDnaEdit,
} from "../domain/design-dna.js";
import type { DesignDnaRepository } from "../repositories/design-dna-repository.js";
import type { ProjectRepository } from "../repositories/project-repository.js";
import {
  DesignDnaNoReferencesError,
  DesignDnaProviderUnavailableError,
  DesignDnaSynthesisError,
} from "../design-dna/types.js";
import {
  ProjectNotFoundError,
  type DesignDnaService,
} from "../design-dna/service.js";

export async function designDnaRoutes(
  app: FastifyInstance,
  deps: {
    service: DesignDnaService;
    dnaRepo: DesignDnaRepository;
    projectRepo: ProjectRepository;
  },
) {
  const { service, dnaRepo, projectRepo } = deps;

  app.get("/api/design-dna/providers", async () => service.getProviderStatus());

  /** Section metadata so the UI can render/order sections without duplicating it. */
  app.get("/api/design-dna/sections", async () => ({
    items: DESIGN_DNA_SECTIONS.map((section) => ({
      key: section.key,
      label: section.label,
      fields: section.fields ? [...section.fields] : null,
    })),
  }));

  app.post("/api/projects/:id/design-dna", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const created = await service.generate(id);
      return reply.status(201).send(created);
    } catch (err) {
      if (err instanceof ProjectNotFoundError) {
        return reply.status(404).send({ error: err.message, code: err.code });
      }
      if (err instanceof DesignDnaNoReferencesError) {
        return reply.status(409).send({ error: err.message, code: err.code });
      }
      if (err instanceof DesignDnaProviderUnavailableError) {
        return reply.status(503).send({
          error: err.message,
          code: err.code,
          providers: service.getProviderStatus(),
        });
      }
      if (err instanceof DesignDnaSynthesisError) {
        // Nothing was written — any existing DNA version is untouched.
        return reply.status(502).send({
          error: err.message,
          code: err.code,
          issues: err.issues,
        });
      }
      request.log.error(err);
      return reply.status(500).send({
        error: err instanceof Error ? err.message : "Design DNA generation failed",
      });
    }
  });

  app.get("/api/projects/:id/design-dna", async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = projectRepo.findById(id);
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }

    return {
      current: dnaRepo.findCurrentForProject(id),
      versions: dnaRepo.listForProject(id),
      referenceCount: project.references.length,
      providers: service.getProviderStatus(),
    };
  });

  app.get("/api/projects/:id/design-dna/versions", async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = projectRepo.findById(id);
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }
    const items = dnaRepo.listForProject(id);
    return { items, total: items.length };
  });

  app.get("/api/design-dna/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const detail = dnaRepo.findById(id);
    if (!detail) {
      return reply.status(404).send({ error: "Design DNA version not found" });
    }
    return detail;
  });

  app.patch("/api/design-dna/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = dnaRepo.findById(id);
    if (!existing) {
      return reply.status(404).send({ error: "Design DNA version not found" });
    }

    const { data, issues } = validateDesignDnaEdit(request.body);
    if (!data) {
      return reply.status(400).send({ error: "Validation failed", issues });
    }

    const merged = mergeDesignDnaStructure(
      existing.structure,
      data.structure ?? {},
    );
    return dnaRepo.updateStructure(id, merged, data.touchedSections);
  });

  app.post("/api/design-dna/:id/publish", async (request, reply) => {
    const { id } = request.params as { id: string };
    const published = dnaRepo.publish(id);
    if (!published) {
      return reply.status(404).send({ error: "Design DNA version not found" });
    }
    return published;
  });

  app.post("/api/design-dna/:id/unpublish", async (request, reply) => {
    const { id } = request.params as { id: string };
    const updated = dnaRepo.unpublish(id);
    if (!updated) {
      return reply.status(404).send({ error: "Design DNA version not found" });
    }
    return updated;
  });
}
