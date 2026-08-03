import type { FastifyInstance } from "fastify";
import type { ReferenceRepository } from "../repositories/reference-repository.js";

export async function dashboardRoutes(
  app: FastifyInstance,
  repo: ReferenceRepository,
) {
  app.get("/api/dashboard", async () => {
    return repo.dashboardStats();
  });
}
