import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { fileURLToPath } from "node:url";
import * as schema from "../db/schema.js";
import {
  generateResearchQueries,
  validateResearchRequest,
} from "./research.js";
import { ProjectRepository } from "../repositories/project-repository.js";
import { ReferenceRepository } from "../repositories/reference-repository.js";
import { CollectionRepository } from "../repositories/collection-repository.js";
import { ResearchRepository } from "../repositories/research-repository.js";
import { ResearchAgent } from "../research/agent.js";
import {
  SearchProviderUnavailableError,
  type ResearchAIProvider,
  type SearchProvider,
  type SearchResult,
} from "../research/types.js";
import { UNAVAILABLE_REASON } from "../research/ai/openai.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../drizzle");

describe("research query generation", () => {
  it("builds queries from brief fields and focus", () => {
    const queries = generateResearchQueries({
      industry: "NGO",
      projectType: "Website",
      desiredStyles: ["Editorial", "Human-centered"],
      referenceKeywords: ["African", "storytelling"],
      focus: "premium nonprofit websites",
      sources: ["Web", "Awwwards"],
    });
    assert.ok(queries.length >= 1);
    assert.match(queries[0]!, /premium nonprofit websites/);
    assert.ok(queries.some((q) => q.includes("site:awwwards.com")));
  });

  it("includes competitors when present", () => {
    const queries = generateResearchQueries({
      industry: "NGO",
      competitors: ["Kiva"],
      sources: ["Web"],
    });
    assert.ok(queries.some((q) => q.includes("Kiva")));
  });
});

describe("research request validation", () => {
  it("requires projectId and accepts defaults", () => {
    const { data, issues } = validateResearchRequest({
      projectId: "abc",
    });
    assert.equal(issues.length, 0);
    assert.equal(data?.limit, 20);
    assert.deepEqual(data?.sources, ["Web"]);
  });

  it("rejects invalid limit and sources", () => {
    const badLimit = validateResearchRequest({
      projectId: "abc",
      limit: 15,
    });
    assert.equal(badLimit.data, null);
    const badSource = validateResearchRequest({
      projectId: "abc",
      sources: ["TikTok"],
    });
    assert.equal(badSource.data, null);
  });
});

class FakeSearchProvider implements SearchProvider {
  readonly name = "fake";
  available = true;
  results: SearchResult[] = [];

  async search(): Promise<SearchResult[]> {
    if (!this.available) {
      throw new SearchProviderUnavailableError("Search provider is not configured");
    }
    return this.results;
  }
}

class FakeAIProvider implements ResearchAIProvider {
  readonly name = "fake-ai";
  available = true;

  async analyzeCandidates(_context: unknown, candidates: Array<{ url: string }>) {
    if (!this.available) {
      return candidates.map(() => ({
        relevanceScore: null,
        relevanceReason: UNAVAILABLE_REASON,
        matchedCriteria: [],
        suggestedStyles: [],
        suggestedPatterns: [],
        suggestedTags: [],
      }));
    }
    return candidates.map(() => ({
      relevanceScore: 82,
      relevanceReason: "Matches editorial nonprofit storytelling",
      matchedCriteria: ["Editorial", "NGO"],
      suggestedStyles: ["Editorial", "Human-centered"],
      suggestedPatterns: ["Hero", "Testimonials"],
      suggestedTags: ["nonprofit", "storytelling"],
    }));
  }
}

describe("research agent + repository", () => {
  let dbPath = "";
  let sqlite: Database.Database;
  let projects: ProjectRepository;
  let references: ReferenceRepository;
  let collections: CollectionRepository;
  let research: ResearchRepository;
  let search: FakeSearchProvider;
  let ai: FakeAIProvider;
  let agent: ResearchAgent;
  let projectId = "";

  before(() => {
    dbPath = path.join(os.tmpdir(), `adi-research-${Date.now()}.db`);
    sqlite = new Database(dbPath);
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder });
    projects = new ProjectRepository(db);
    references = new ReferenceRepository(db);
    collections = new CollectionRepository(db);
    research = new ResearchRepository(db);
    search = new FakeSearchProvider();
    ai = new FakeAIProvider();
    agent = new ResearchAgent(research, references, search, ai);

    const project = projects.create({
      name: "CAYO Research",
      industry: "NGO",
      projectType: "Website",
      audience: "Donors",
      projectGoals: "Warm storytelling site",
      desiredStyles: ["Editorial"],
      referenceKeywords: ["nonprofit"],
    });
    projectId = project.id;
  });

  after(() => {
    sqlite.close();
    fs.rmSync(dbPath, { force: true });
    fs.rmSync(`${dbPath}-wal`, { force: true });
    fs.rmSync(`${dbPath}-shm`, { force: true });
  });

  it("fails gracefully when search provider is unavailable", async () => {
    search.available = false;
    await assert.rejects(
      () =>
        agent.run({
          project: projects.findById(projectId)!,
          focus: null,
          limit: 10,
          sources: ["Web"],
        }),
      (err: unknown) => err instanceof SearchProviderUnavailableError,
    );
    search.available = true;
  });

  it("creates research with candidates and AI analysis", async () => {
    search.results = [
      {
        title: "Charity Water",
        url: "https://example.com/charity-water-design",
        snippet: "Nonprofit storytelling site",
      },
      {
        title: "Kiva",
        url: "https://example.com/kiva-design",
        snippet: "Microfinance design",
      },
    ];

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error("network blocked in test");
    }) as typeof fetch;

    try {
      const result = await agent.run({
        project: projects.findById(projectId)!,
        focus: "editorial nonprofit websites",
        limit: 10,
        sources: ["Web"],
      });

      assert.equal(result.status, "completed");
      assert.ok(result.candidates.length >= 1);
      assert.equal(result.candidates[0]?.relevanceScore, 82);
      assert.match(result.candidates[0]?.relevanceReason ?? "", /storytelling/);
      assert.ok(result.candidates[0]?.suggestedStyles.includes("Editorial"));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("returns candidates without AI scores when AI unavailable", async () => {
    ai.available = false;
    search.results = [
      {
        title: "No AI",
        url: "https://example.com/no-ai-analysis",
        snippet: "test",
      },
    ];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error("network blocked");
    }) as typeof fetch;

    try {
      const result = await agent.run({
        project: projects.findById(projectId)!,
        focus: null,
        limit: 10,
        sources: ["Web"],
      });
      assert.equal(result.status, "completed");
      assert.equal(result.candidates[0]?.relevanceScore, null);
      assert.equal(result.candidates[0]?.relevanceReason, UNAVAILABLE_REASON);
      assert.match(result.message ?? "", /AI analysis unavailable/i);
    } finally {
      globalThis.fetch = originalFetch;
      ai.available = true;
    }
  });

  it("accepts and rejects candidates", () => {
    const runs = research.listForProject(projectId);
    assert.ok(runs.length);
    const detail = research.findRunDetail(runs[0]!.id)!;
    const candidate = detail.candidates[0]!;
    const accepted = research.setCandidateStatus(candidate.id, "accepted");
    assert.equal(accepted?.status, "accepted");
    const rejected = research.setCandidateStatus(candidate.id, "rejected");
    assert.equal(rejected?.status, "rejected");
  });

  it("adds accepted candidate to library and reuses duplicates", () => {
    const runs = research.listForProject(projectId);
    const detail = research.findRunDetail(runs[0]!.id)!;
    const candidate = detail.candidates[0]!;
    research.setCandidateStatus(candidate.id, "accepted");

    const created = references.create({
      title: candidate.title,
      source: "Other",
      url: candidate.url,
      type: "website",
      industries: ["NGO"],
      pageTypes: [],
      styles: candidate.suggestedStyles,
      patterns: candidate.suggestedPatterns,
      tags: candidate.suggestedTags,
      whatToLearn: candidate.matchedCriteria,
      whySaved: candidate.relevanceReason,
    });
    research.linkReference(candidate.id, created.id);

    const existing = references.findByUrl(candidate.url);
    assert.equal(existing?.id, created.id);

    // Second add should reuse
    const again = references.findByUrl(candidate.url);
    assert.equal(again?.id, created.id);
    assert.equal(research.findCandidateById(candidate.id)?.referenceId, created.id);
  });

  it("adds library references to a collection", () => {
    const runs = research.listForProject(projectId);
    const detail = research.findRunDetail(runs[0]!.id)!;
    const linked = detail.candidates.find((c) => c.referenceId);
    assert.ok(linked?.referenceId);

    const collection = collections.create({ name: "Research Import" });
    const result = collections.addReferences(collection.id, [linked!.referenceId!]);
    assert.deepEqual(result.added, [linked!.referenceId]);
    const refreshed = collections.findById(collection.id)!;
    assert.equal(refreshed.referenceCount, 1);
  });

  it("rejects SSRF targets during resolve path used by research", async () => {
    const { resolveUrlPreview } = await import("../domain/resolve-url.js");
    const { UrlSafetyError } = await import("../domain/url-safety.js");
    await assert.rejects(
      () => resolveUrlPreview("http://127.0.0.1/admin"),
      (err: unknown) => err instanceof UrlSafetyError,
    );
  });
});
