import type { FastifyInstance } from "fastify";
import type { TaxonomyRepository } from "../repositories/reference-repository.js";

export async function taxonomyRoutes(
  app: FastifyInstance,
  repo: TaxonomyRepository,
) {
  app.get("/api/taxonomy", async () => {
    return repo.getAll();
  });
}
