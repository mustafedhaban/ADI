import Fastify from "fastify";
import cors from "@fastify/cors";
import { db } from "./db/index.js";
import {
  ReferenceRepository,
  TaxonomyRepository,
} from "./repositories/reference-repository.js";
import { CollectionRepository } from "./repositories/collection-repository.js";
import { ProjectRepository } from "./repositories/project-repository.js";
import { ResearchRepository } from "./repositories/research-repository.js";
import { DesignDnaRepository } from "./repositories/design-dna-repository.js";
import { ResearchAgent } from "./research/agent.js";
import { createSearchProvider } from "./research/search/tavily.js";
import { createAIProvider } from "./research/ai/openai.js";
import { DesignDnaService } from "./design-dna/service.js";
import { createDesignDnaProvider } from "./design-dna/ai/openai.js";
import { referenceRoutes } from "./routes/references.js";
import { taxonomyRoutes } from "./routes/taxonomy.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { importRoutes } from "./routes/import.js";
import { collectionRoutes } from "./routes/collections.js";
import { projectRoutes } from "./routes/projects.js";
import { researchRoutes } from "./routes/research.js";
import { designDnaRoutes } from "./routes/design-dna.js";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "127.0.0.1";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

const referenceRepo = new ReferenceRepository(db);
const taxonomyRepo = new TaxonomyRepository(db);
const collectionRepo = new CollectionRepository(db);
const projectRepo = new ProjectRepository(db);
const researchRepo = new ResearchRepository(db);
const designDnaRepo = new DesignDnaRepository(db);
const researchAgent = new ResearchAgent(
  researchRepo,
  referenceRepo,
  createSearchProvider(),
  createAIProvider(),
);
const designDnaService = new DesignDnaService(
  projectRepo,
  designDnaRepo,
  createDesignDnaProvider(),
);

await referenceRoutes(app, referenceRepo);
await taxonomyRoutes(app, taxonomyRepo);
await dashboardRoutes(app, referenceRepo);
await importRoutes(app, referenceRepo);
await collectionRoutes(app, collectionRepo);
await projectRoutes(app, projectRepo);
await researchRoutes(app, {
  agent: researchAgent,
  researchRepo,
  projectRepo,
  referenceRepo,
  collectionRepo,
});
await designDnaRoutes(app, {
  service: designDnaService,
  dnaRepo: designDnaRepo,
  projectRepo,
});

app.get("/api/health", async () => ({
  ok: true,
  research: researchAgent.getProviderStatus(),
  designDna: designDnaService.getProviderStatus(),
}));

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`ADI API listening on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
