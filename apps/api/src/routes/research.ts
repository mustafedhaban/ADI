import type { FastifyInstance } from "fastify";
import {
  patternSet,
  styleSet,
} from "../domain/taxonomy.js";
import {
  CANDIDATE_STATUSES,
  filterTaxonomyValues,
  validateResearchRequest,
  type CandidateStatus,
} from "../domain/research.js";
import { resolveUrlPreview } from "../domain/resolve-url.js";
import { normalizeUrl } from "../domain/validation.js";
import { UrlSafetyError } from "../domain/url-safety.js";
import type { ProjectRepository } from "../repositories/project-repository.js";
import type { ReferenceRepository } from "../repositories/reference-repository.js";
import type { CollectionRepository } from "../repositories/collection-repository.js";
import type { ResearchRepository } from "../repositories/research-repository.js";
import type { ResearchAgent } from "../research/agent.js";
import { SearchProviderUnavailableError } from "../research/types.js";

function parseIds(body: unknown, field: string): string[] {
  if (!body || typeof body !== "object") return [];
  const record = body as Record<string, unknown>;
  if (Array.isArray(record[field])) {
    return [
      ...new Set(
        (record[field] as unknown[])
          .filter((v): v is string => typeof v === "string" && Boolean(v.trim()))
          .map((v) => v.trim()),
      ),
    ];
  }
  return [];
}

export async function researchRoutes(
  app: FastifyInstance,
  deps: {
    agent: ResearchAgent;
    researchRepo: ResearchRepository;
    projectRepo: ProjectRepository;
    referenceRepo: ReferenceRepository;
    collectionRepo: CollectionRepository;
  },
) {
  const { agent, researchRepo, projectRepo, referenceRepo, collectionRepo } =
    deps;

  app.get("/api/research/providers", async () => agent.getProviderStatus());

  app.post("/api/research", async (request, reply) => {
    const { data, issues } = validateResearchRequest(request.body);
    if (!data) {
      return reply.status(400).send({ error: "Validation failed", issues });
    }

    const project = projectRepo.findById(data.projectId);
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }

    try {
      const result = await agent.run({
        project,
        focus: data.focus ?? null,
        limit: data.limit,
        sources: data.sources,
      });
      return {
        researchId: result.id,
        status: result.status,
        message: result.message,
        query: result.query,
        providers: agent.getProviderStatus(),
        candidates: result.candidates,
      };
    } catch (err) {
      if (err instanceof SearchProviderUnavailableError) {
        return reply.status(503).send({
          error: err.message,
          code: err.code,
          providers: agent.getProviderStatus(),
        });
      }
      request.log.error(err);
      return reply.status(502).send({
        error: err instanceof Error ? err.message : "Research failed",
        providers: agent.getProviderStatus(),
      });
    }
  });

  app.get("/api/research/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const detail = researchRepo.findRunDetail(id);
    if (!detail) {
      return reply.status(404).send({ error: "Research run not found" });
    }
    return detail;
  });

  app.get("/api/projects/:id/research", async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = projectRepo.findById(id);
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }
    const items = researchRepo.listForProject(id);
    return { items, total: items.length };
  });

  app.patch("/api/research/candidates/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { status?: unknown };
    if (
      typeof body?.status !== "string" ||
      !CANDIDATE_STATUSES.includes(body.status as CandidateStatus)
    ) {
      return reply.status(400).send({
        error: "Validation failed",
        issues: [
          {
            field: "status",
            message: 'status must be "candidate", "accepted", or "rejected"',
          },
        ],
      });
    }

    const updated = researchRepo.setCandidateStatus(
      id,
      body.status as CandidateStatus,
    );
    if (!updated) {
      return reply.status(404).send({ error: "Candidate not found" });
    }
    return updated;
  });

  app.post("/api/research/:id/library", async (request, reply) => {
    const { id } = request.params as { id: string };
    const run = researchRepo.findRunDetail(id);
    if (!run) {
      return reply.status(404).send({ error: "Research run not found" });
    }

    const project = projectRepo.findById(run.projectId);
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }

    let candidateIds = parseIds(request.body, "candidateIds");
    if (!candidateIds.length) {
      candidateIds = run.candidates
        .filter((c) => c.status === "accepted")
        .map((c) => c.id);
    }

    if (!candidateIds.length) {
      return reply.status(400).send({
        error: "Validation failed",
        issues: [
          {
            field: "candidateIds",
            message: "Provide candidateIds or accept candidates first",
          },
        ],
      });
    }

    const candidates = researchRepo.listCandidatesByIds(id, candidateIds);
    if (!candidates.length) {
      return reply.status(404).send({ error: "No matching candidates found" });
    }

    const created: unknown[] = [];
    const reused: unknown[] = [];
    const failed: Array<{ candidateId: string; error: string }> = [];

    for (const candidate of candidates) {
      try {
        const normalized = normalizeUrl(candidate.url);
        if (!normalized) {
          failed.push({
            candidateId: candidate.id,
            error: "Invalid candidate URL",
          });
          continue;
        }

        const existing = referenceRepo.findByUrl(normalized);
        if (existing) {
          researchRepo.linkReference(candidate.id, existing.id);
          reused.push(existing);
          continue;
        }

        let preview;
        try {
          preview = await resolveUrlPreview(normalized, {
            findExistingId: (url) => referenceRepo.findByUrl(url)?.id ?? null,
          });
        } catch (err) {
          if (err instanceof UrlSafetyError) {
            failed.push({ candidateId: candidate.id, error: err.message });
            continue;
          }
          preview = null;
        }

        if (preview?.existingId) {
          const existingByResolve = referenceRepo.findById(preview.existingId);
          if (existingByResolve) {
            researchRepo.linkReference(candidate.id, existingByResolve.id);
            reused.push(existingByResolve);
            continue;
          }
        }

        const styles = filterTaxonomyValues(
          [
            ...candidate.suggestedStyles,
            ...project.desiredStyles,
          ],
          styleSet,
        );
        const patterns = filterTaxonomyValues(
          candidate.suggestedPatterns,
          patternSet,
        );

        const reference = referenceRepo.create({
          title:
            preview?.title?.trim() ||
            candidate.title ||
            normalized,
          source: preview?.source || candidate.source || "Other",
          url: preview?.url || normalized,
          image: preview?.image || candidate.image || null,
          type: "website",
          description:
            preview?.description ||
            candidate.description ||
            null,
          whySaved:
            candidate.relevanceReason &&
            candidate.relevanceReason !== "AI analysis unavailable."
              ? candidate.relevanceReason
              : `Research for ${project.name}`,
          whatToLearn: candidate.matchedCriteria.length
            ? candidate.matchedCriteria
            : project.referenceKeywords.slice(0, 5),
          industries: project.industry ? [project.industry] : [],
          pageTypes: [],
          styles,
          patterns,
          tags: [
            ...new Set([
              ...candidate.suggestedTags,
              ...project.referenceKeywords.slice(0, 5),
              "research",
            ]),
          ].slice(0, 20),
        });

        researchRepo.linkReference(candidate.id, reference.id);
        created.push(reference);
      } catch (err) {
        failed.push({
          candidateId: candidate.id,
          error: err instanceof Error ? err.message : "Failed to add",
        });
      }
    }

    return {
      created: created.length,
      reused: reused.length,
      failed,
      items: [...created, ...reused],
      research: researchRepo.findRunDetail(id),
    };
  });

  app.post("/api/research/:id/collection", async (request, reply) => {
    const { id } = request.params as { id: string };
    const run = researchRepo.findRunDetail(id);
    if (!run) {
      return reply.status(404).send({ error: "Research run not found" });
    }

    const body = request.body as {
      collectionId?: unknown;
      candidateIds?: unknown;
    };

    if (typeof body.collectionId !== "string" || !body.collectionId.trim()) {
      return reply.status(400).send({
        error: "Validation failed",
        issues: [
          { field: "collectionId", message: "collectionId is required" },
        ],
      });
    }

    const collection = collectionRepo.findById(body.collectionId.trim());
    if (!collection) {
      return reply.status(404).send({ error: "Collection not found" });
    }

    const candidateIds = parseIds(request.body, "candidateIds");
    const candidates = candidateIds.length
      ? researchRepo.listCandidatesByIds(id, candidateIds)
      : run.candidates.filter((c) => c.status === "accepted");

    const referenceIds = [
      ...new Set(
        candidates
          .map((c) => c.referenceId)
          .filter((v): v is string => Boolean(v)),
      ),
    ];

    if (!referenceIds.length) {
      return reply.status(400).send({
        error:
          "No library references linked yet. Add candidates to the library first.",
      });
    }

    const result = collectionRepo.addReferences(collection.id, referenceIds);
    return {
      ...result,
      collection: collectionRepo.findById(collection.id),
    };
  });
}
