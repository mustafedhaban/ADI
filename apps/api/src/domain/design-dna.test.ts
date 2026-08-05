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
  countPopulatedSections,
  emptyDesignDnaStructure,
  mergeDesignDnaStructure,
  normalizeDesignDnaEvidence,
  parseDesignDnaPayload,
  validateDesignDnaEdit,
  type DesignDnaStructure,
} from "./design-dna.js";
import { ProjectRepository } from "../repositories/project-repository.js";
import { ReferenceRepository } from "../repositories/reference-repository.js";
import { CollectionRepository } from "../repositories/collection-repository.js";
import { DesignDnaRepository } from "../repositories/design-dna-repository.js";
import { DesignDnaService, ProjectNotFoundError } from "../design-dna/service.js";
import {
  DesignDnaNoReferencesError,
  DesignDnaProviderUnavailableError,
  DesignDnaSynthesisError,
  type DesignDnaAIProvider,
  type DesignDnaBriefContext,
  type DesignDnaReferenceInput,
  type DesignDnaSynthesis,
} from "../design-dna/types.js";
import { OpenAIDesignDnaProvider } from "../design-dna/ai/openai.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../drizzle");

/** A well-formed AI payload used across generation tests. */
function validAiPayload(referenceIndexes: number[] = [0, 1]) {
  return {
    visualLanguage: {
      overallStyle: ["Editorial minimalism with warm human photography"],
      visualCharacteristics: ["Generous whitespace", "Large type blocks"],
      designPrinciples: ["Clarity before decoration"],
    },
    colorDirection: {
      paletteCharacteristics: ["Neutral base with a single warm accent"],
      dominantApproach: ["Light-dominant with dark editorial sections"],
      contrast: ["High text-to-background contrast"],
      usagePatterns: ["Accent reserved for calls to action"],
    },
    typography: {
      typographyStyles: ["Large editorial serif headlines"],
      hierarchyPatterns: ["Three-level hierarchy per section"],
      scaleCharacteristics: ["Wide jump between headline and body"],
      fontCharacteristics: ["Serif display paired with neutral sans body"],
    },
    layout: {
      layoutPatterns: ["Asymmetric editorial spreads"],
      gridPatterns: ["Twelve column with frequent offsets"],
      spacingPatterns: ["Generous vertical rhythm between sections"],
      compositionPatterns: ["Full-bleed imagery interrupting text columns"],
    },
    imagery: {
      imageryStyles: ["Documentary photography of people"],
      photographyCharacteristics: ["Natural light, candid framing"],
      illustrationCharacteristics: [],
      imageTreatment: ["Minimal treatment, no heavy filters"],
    },
    components: {
      navigationPatterns: ["Minimal top navigation with a single CTA"],
      heroPatterns: ["Text-first hero with supporting photograph"],
      cardPatterns: ["Borderless cards separated by whitespace"],
      ctaPatterns: ["Single dominant CTA per section"],
      footerPatterns: ["Large multi-column footer"],
      otherPatterns: [],
    },
    motionInteraction: {
      animationPatterns: ["Subtle scroll reveals"],
      interactionPatterns: ["Hover state changes on editorial links"],
      transitionPatterns: [],
    },
    contentPresentation: {
      storytellingPatterns: ["Narrative-led long form sections"],
      contentHierarchy: ["Story before proof before action"],
      contentPatterns: ["Statistics used as punctuation"],
    },
    patterns: {
      recurringPatterns: ["Hero", "Storytelling", "Statistics"],
      strongPatterns: ["Editorial hero"],
      emergingPatterns: ["Horizontal scroll galleries"],
    },
    antiPatterns: {
      avoidPatterns: ["Stock imagery without context"],
      overusedPatterns: ["Carousel heroes"],
      conflictsWithBrief: ["Brief asks for Playful but references skew Editorial"],
    },
    keyInsights: [
      "Large editorial typography is repeatedly paired with generous whitespace to create a premium and confident visual hierarchy.",
      "Documentary photography carries credibility across the set rather than illustration or abstract imagery.",
    ],
    evidence: [
      {
        section: "keyInsights",
        insight:
          "Large editorial typography is repeatedly paired with generous whitespace to create a premium and confident visual hierarchy.",
        referenceIndexes,
      },
      {
        section: "typography",
        insight: "Large editorial serif headlines",
        referenceIndexes: [0],
      },
    ],
  };
}

describe("design dna structure validation", () => {
  it("normalizes a valid payload and resolves evidence indexes", () => {
    const { data, issues } = parseDesignDnaPayload(validAiPayload(), [
      "ref-a",
      "ref-b",
    ]);
    assert.equal(issues.length, 0);
    assert.ok(data);
    assert.equal(data.structure.keyInsights.length, 2);
    assert.equal(countPopulatedSections(data.structure), 11);
    assert.equal(data.evidence.length, 2);
    const headline = data.evidence.find((e) => e.section === "keyInsights")!;
    assert.deepEqual(headline.referenceIds, ["ref-a", "ref-b"]);
  });

  it("rejects a non-object payload", () => {
    const { data, issues } = parseDesignDnaPayload("not json at all", []);
    assert.equal(data, null);
    assert.ok(issues.some((i) => /must be an object/.test(i.message)));
  });

  it("rejects wrong field types", () => {
    const payload = validAiPayload();
    (payload as unknown as Record<string, unknown>).typography = "serif";
    const { data, issues } = parseDesignDnaPayload(payload, ["ref-a"]);
    assert.equal(data, null);
    assert.ok(issues.some((i) => i.field === "typography"));
  });

  it("rejects an empty DNA with no key insights", () => {
    const { data, issues } = parseDesignDnaPayload(
      { keyInsights: [], visualLanguage: { overallStyle: [] } },
      [],
    );
    assert.equal(data, null);
    assert.ok(issues.some((i) => i.field === "keyInsights"));
  });

  it("rejects DNA that populates fewer than two sections", () => {
    const { data, issues } = parseDesignDnaPayload(
      { keyInsights: ["Only an insight, nothing observed"] },
      [],
    );
    assert.equal(data, null);
    assert.ok(issues.some((i) => i.field === "structure"));
  });

  it("trims, dedupes and drops non-strings", () => {
    const { data } = parseDesignDnaPayload(
      {
        keyInsights: ["  Whitespace matters  ", "whitespace matters", 42, ""],
        visualLanguage: { overallStyle: ["Minimal"] },
      },
      [],
    );
    assert.deepEqual(data?.structure.keyInsights, ["Whitespace matters"]);
  });

  it("drops evidence pointing at out-of-range references", () => {
    const { data } = normalizeDesignDnaEvidence(
      [
        { section: "keyInsights", insight: "Valid", referenceIndexes: [0, 9] },
        { section: "keyInsights", insight: "Orphan", referenceIndexes: [7] },
        { section: "notASection", insight: "Bad", referenceIndexes: [0] },
      ],
      ["ref-a"],
    );
    assert.equal(data.length, 1);
    assert.deepEqual(data[0]?.referenceIds, ["ref-a"]);
  });
});

describe("design dna manual editing", () => {
  it("accepts a partial section update", () => {
    const { data, issues } = validateDesignDnaEdit({
      structure: { keyInsights: ["Edited insight"] },
    });
    assert.equal(issues.length, 0);
    assert.deepEqual(data?.touchedSections, ["keyInsights"]);
    assert.deepEqual(data?.structure?.keyInsights, ["Edited insight"]);
  });

  it("accepts sections at the body root", () => {
    const { data } = validateDesignDnaEdit({
      typography: { typographyStyles: ["Condensed sans headlines"] },
    });
    assert.deepEqual(data?.touchedSections, ["typography"]);
  });

  it("rejects a body with no known sections", () => {
    const { data, issues } = validateDesignDnaEdit({ nonsense: true });
    assert.equal(data, null);
    assert.ok(issues.length);
  });

  it("merges only the touched sections", () => {
    const base = parseDesignDnaPayload(validAiPayload(), ["ref-a"]).data!
      .structure;
    const merged = mergeDesignDnaStructure(base, {
      keyInsights: ["Replaced insight"],
    });
    assert.deepEqual(merged.keyInsights, ["Replaced insight"]);
    assert.deepEqual(
      merged.typography.typographyStyles,
      base.typography.typographyStyles,
    );
  });
});

class FakeDesignDnaProvider implements DesignDnaAIProvider {
  readonly name = "fake-design-dna";
  available = true;
  mode: "valid" | "invalid" = "valid";
  lastReferences: DesignDnaReferenceInput[] = [];
  lastContext: DesignDnaBriefContext | null = null;
  calls = 0;

  async synthesize(
    context: DesignDnaBriefContext,
    references: DesignDnaReferenceInput[],
    referenceIds: string[],
  ): Promise<DesignDnaSynthesis> {
    this.calls += 1;
    this.lastContext = context;
    this.lastReferences = references;

    if (!this.available) throw new DesignDnaProviderUnavailableError();

    const payload =
      this.mode === "valid"
        ? validAiPayload(references.map((r) => r.index).slice(0, 3))
        : { keyInsights: "not an array" };

    const { data, issues } = parseDesignDnaPayload(payload, referenceIds);
    if (!data) {
      throw new DesignDnaSynthesisError(
        "Design DNA response failed validation",
        issues,
      );
    }
    return data;
  }
}

describe("design dna service + repository", () => {
  let dbPath = "";
  let sqlite: Database.Database;
  let projects: ProjectRepository;
  let references: ReferenceRepository;
  let collections: CollectionRepository;
  let dnaRepo: DesignDnaRepository;
  let provider: FakeDesignDnaProvider;
  let service: DesignDnaService;
  let projectId = "";
  let emptyProjectId = "";
  let referenceIds: string[] = [];

  before(() => {
    dbPath = path.join(os.tmpdir(), `adi-design-dna-${Date.now()}.db`);
    sqlite = new Database(dbPath);
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder });

    projects = new ProjectRepository(db);
    references = new ReferenceRepository(db);
    collections = new CollectionRepository(db);
    dnaRepo = new DesignDnaRepository(db);
    provider = new FakeDesignDnaProvider();
    service = new DesignDnaService(projects, dnaRepo, provider);

    const project = projects.create({
      name: "CAYO Design DNA",
      industry: "NGO",
      projectType: "Website",
      audience: "Donors and partners",
      projectGoals: "Warm, credible storytelling site",
      desiredStyles: ["Editorial", "Human-centered"],
      avoidStyles: ["Brutalist"],
      referenceKeywords: ["nonprofit", "storytelling"],
    });
    projectId = project.id;

    emptyProjectId = projects.create({ name: "No References Project" }).id;

    referenceIds = [
      "charity-water",
      "kiva",
      "acumen",
      "oxfam",
      "unicef",
    ].map(
      (slug, index) =>
        references.create({
          title: `Reference ${index + 1}`,
          source: "Awwwards",
          url: `https://example.com/${slug}`,
          type: "website",
          description: "Nonprofit storytelling website",
          whySaved: "Editorial hierarchy with documentary photography",
          whatToLearn: ["Editorial hierarchy", "Photo treatment"],
          industries: ["NGO"],
          pageTypes: ["Homepage"],
          styles: ["Editorial", "Human-centered"],
          patterns: ["Hero", "Storytelling"],
          tags: ["whitespace", "large typography"],
        }).id,
    );

    // Two collections that share one reference — dedupe must collapse it.
    const collectionA = collections.create({ name: "DNA Set A" });
    const collectionB = collections.create({ name: "DNA Set B" });
    collections.addReferences(collectionA.id, referenceIds.slice(0, 4));
    collections.addReferences(collectionB.id, referenceIds.slice(3));
    projects.addCollections(projectId, [collectionA.id, collectionB.id]);

    // Not linked to the project — must never reach the AI.
    references.create({
      title: "Unrelated Global Reference",
      source: "Dribbble",
      url: "https://example.com/unrelated-global",
      type: "website",
      styles: ["Brutalist"],
      patterns: [],
      tags: [],
      industries: [],
      pageTypes: [],
      whatToLearn: [],
    });
  });

  after(() => {
    sqlite.close();
    fs.rmSync(dbPath, { force: true });
    fs.rmSync(`${dbPath}-wal`, { force: true });
    fs.rmSync(`${dbPath}-shm`, { force: true });
  });

  it("aggregates and deduplicates references from project collections only", () => {
    const project = projects.findById(projectId)!;
    const collected = service.collectProjectReferences(project);
    assert.equal(collected.length, 5);
    assert.equal(new Set(collected.map((r) => r.id)).size, 5);
    assert.ok(
      !collected.some((r) => r.title === "Unrelated Global Reference"),
      "global library references must not leak into the project set",
    );
  });

  it("refuses to generate for an unknown project", async () => {
    await assert.rejects(
      () => service.generate("missing-project"),
      (err: unknown) => err instanceof ProjectNotFoundError,
    );
  });

  it("does not call the AI when the project has no references", async () => {
    const before = provider.calls;
    await assert.rejects(
      () => service.generate(emptyProjectId),
      (err: unknown) =>
        err instanceof DesignDnaNoReferencesError &&
        /Add research references/.test(err.message),
    );
    assert.equal(provider.calls, before, "AI must not be called");
  });

  it("returns a configuration error when the AI provider is unavailable", async () => {
    provider.available = false;
    try {
      await assert.rejects(
        () => service.generate(projectId),
        (err: unknown) => err instanceof DesignDnaProviderUnavailableError,
      );
      assert.equal(dnaRepo.listForProject(projectId).length, 0);
    } finally {
      provider.available = true;
    }
  });

  it("generates version 1 as a draft from a valid AI response", async () => {
    const dna = await service.generate(projectId);
    assert.equal(dna.version, 1);
    assert.equal(dna.status, "draft");
    assert.equal(dna.referenceCount, 5);
    assert.equal(dna.sourceCollectionIds.length, 2);
    assert.equal(countPopulatedSections(dna.structure), 11);
    assert.ok(dna.structure.keyInsights.length >= 1);
  });

  it("sends only design signal fields to the AI provider", () => {
    const sent = provider.lastReferences[0]!;
    assert.equal(provider.lastReferences.length, 5);
    assert.deepEqual(Object.keys(sent).sort(), [
      "description",
      "index",
      "industries",
      "pageTypes",
      "patterns",
      "styles",
      "tags",
      "title",
      "whatToLearn",
      "whySaved",
    ]);
    assert.equal(provider.lastContext?.projectName, "CAYO Design DNA");
    assert.deepEqual(provider.lastContext?.desiredStyles, [
      "Editorial",
      "Human-centered",
    ]);
  });

  it("stores evidence relationships resolved to project references", () => {
    const dna = dnaRepo.findCurrentForProject(projectId)!;
    assert.ok(dna.evidence.length >= 1);
    const headline = dna.evidence.find((e) => e.section === "keyInsights")!;
    assert.ok(headline.references.length >= 2);
    for (const reference of headline.references) {
      assert.ok(
        referenceIds.includes(reference.id),
        "evidence must point at project references",
      );
    }
    // The same reference supports more than one insight.
    const perReference = new Map<string, number>();
    for (const group of dna.evidence) {
      for (const reference of group.references) {
        perReference.set(
          reference.id,
          (perReference.get(reference.id) ?? 0) + 1,
        );
      }
    }
    assert.ok([...perReference.values()].some((count) => count > 1));
  });

  it("does not save malformed DNA and leaves existing versions intact", async () => {
    provider.mode = "invalid";
    try {
      await assert.rejects(
        () => service.generate(projectId),
        (err: unknown) => err instanceof DesignDnaSynthesisError,
      );
    } finally {
      provider.mode = "valid";
    }
    const versions = dnaRepo.listForProject(projectId);
    assert.equal(versions.length, 1);
    assert.equal(versions[0]?.version, 1);
  });

  it("supports manual editing of a section", () => {
    const dna = dnaRepo.findCurrentForProject(projectId)!;
    const { data } = validateDesignDnaEdit({
      structure: {
        colorDirection: {
          paletteCharacteristics: ["Manually corrected palette note"],
          dominantApproach: [],
          contrast: [],
          usagePatterns: [],
        },
      },
    });
    const merged = mergeDesignDnaStructure(
      dna.structure,
      data!.structure as Partial<DesignDnaStructure>,
    );
    const updated = dnaRepo.updateStructure(
      dna.id,
      merged,
      data!.touchedSections,
    )!;
    assert.deepEqual(updated.structure.colorDirection.paletteCharacteristics, [
      "Manually corrected palette note",
    ]);
    assert.deepEqual(
      updated.structure.typography.typographyStyles,
      dna.structure.typography.typographyStyles,
      "untouched sections are preserved",
    );
  });

  it("prunes evidence whose insight was edited away", () => {
    const dna = dnaRepo.findCurrentForProject(projectId)!;
    const before = dna.evidence.filter((e) => e.section === "typography");
    assert.ok(before.length >= 1);

    const merged = mergeDesignDnaStructure(dna.structure, {
      typography: {
        typographyStyles: ["Completely rewritten typography note"],
        hierarchyPatterns: [],
        scaleCharacteristics: [],
        fontCharacteristics: [],
      },
    });
    const updated = dnaRepo.updateStructure(dna.id, merged, ["typography"])!;
    assert.equal(
      updated.evidence.filter((e) => e.section === "typography").length,
      0,
    );
    assert.ok(
      updated.evidence.some((e) => e.section === "keyInsights"),
      "evidence in untouched sections survives",
    );
  });

  it("creates a new version on regeneration and preserves history", async () => {
    const v1 = dnaRepo.findCurrentForProject(projectId)!;
    const v2 = await service.generate(projectId);

    assert.equal(v2.version, 2);
    assert.equal(v2.status, "draft");
    assert.notEqual(v2.id, v1.id);

    const versions = dnaRepo.listForProject(projectId);
    assert.deepEqual(
      versions.map((v) => v.version),
      [2, 1],
    );

    const preserved = dnaRepo.findById(v1.id)!;
    assert.deepEqual(preserved.structure.colorDirection.paletteCharacteristics, [
      "Manually corrected palette note",
    ]);
  });

  it("publishes a version and keeps only one published", async () => {
    const versions = dnaRepo.listForProject(projectId);
    const v1 = versions.find((v) => v.version === 1)!;
    const v2 = versions.find((v) => v.version === 2)!;

    assert.equal(dnaRepo.publish(v1.id)?.status, "published");
    assert.equal(
      dnaRepo.listForProject(projectId).filter((v) => v.status === "published")
        .length,
      1,
    );

    // Regenerating must not disturb the published version.
    const v3 = await service.generate(projectId);
    assert.equal(v3.status, "draft");
    assert.equal(dnaRepo.findById(v1.id)?.status, "published");

    assert.equal(dnaRepo.publish(v2.id)?.status, "published");
    const published = dnaRepo
      .listForProject(projectId)
      .filter((v) => v.status === "published");
    assert.equal(published.length, 1);
    assert.equal(published[0]?.version, 2);
    assert.equal(dnaRepo.findById(v1.id)?.status, "draft");
  });

  it("returns the published version as current, then the latest after unpublish", () => {
    const current = dnaRepo.findCurrentForProject(projectId)!;
    assert.equal(current.version, 2);

    dnaRepo.unpublish(current.id);
    assert.equal(dnaRepo.findCurrentForProject(projectId)?.version, 3);
    assert.equal(
      dnaRepo.listForProject(projectId).filter((v) => v.status === "published")
        .length,
      0,
    );
  });

  it("leaves project collections and references untouched", () => {
    const project = projects.findById(projectId)!;
    assert.equal(project.collections.length, 2);
    assert.equal(project.references.length, 5);
    assert.equal(dnaRepo.listForProject(projectId).length, 3);
  });
});

describe("design dna openai provider", () => {
  const context = {
    projectName: "Test",
    industry: null,
    projectType: null,
    audience: null,
    audienceNeeds: null,
    businessGoals: null,
    projectGoals: null,
    designGoals: null,
    desiredStyles: [],
    avoidStyles: [],
    keyMessages: null,
    contentTypes: [],
    requiredFeatures: [],
    referenceKeywords: [],
    competitors: [],
    constraints: null,
  } satisfies DesignDnaBriefContext;

  const reference: DesignDnaReferenceInput = {
    index: 0,
    title: "Reference",
    description: null,
    whySaved: null,
    whatToLearn: [],
    styles: [],
    patterns: [],
    tags: [],
    industries: [],
    pageTypes: [],
  };

  it("reports unavailable without an API key", async () => {
    const unconfigured = new OpenAIDesignDnaProvider(undefined);
    assert.equal(unconfigured.available, false);
    await assert.rejects(
      () => unconfigured.synthesize(context, [reference], ["ref-a"]),
      (err: unknown) => err instanceof DesignDnaProviderUnavailableError,
    );
  });

  it("parses a valid completion response", async () => {
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: JSON.stringify(validAiPayload([0])) } },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as unknown as typeof fetch;

    const openai = new OpenAIDesignDnaProvider(
      "test-key",
      "https://api.example.com/v1",
      "test-model",
      fetchImpl,
    );
    const result = await openai.synthesize(context, [reference], ["ref-a"]);
    assert.ok(result.structure.keyInsights.length >= 1);
    assert.equal(result.evidence[0]?.referenceIds[0], "ref-a");
  });

  it("throws on an invalid completion response instead of fabricating DNA", async () => {
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "{ not json" } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as unknown as typeof fetch;

    const openai = new OpenAIDesignDnaProvider(
      "test-key",
      "https://api.example.com/v1",
      "test-model",
      fetchImpl,
    );
    await assert.rejects(
      () => openai.synthesize(context, [reference], ["ref-a"]),
      (err: unknown) => err instanceof DesignDnaSynthesisError,
    );
  });

  it("throws when the completion is structurally empty", async () => {
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: JSON.stringify(emptyDesignDnaStructure()) } },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as unknown as typeof fetch;

    const openai = new OpenAIDesignDnaProvider(
      "test-key",
      "https://api.example.com/v1",
      "test-model",
      fetchImpl,
    );
    await assert.rejects(
      () => openai.synthesize(context, [reference], ["ref-a"]),
      (err: unknown) =>
        err instanceof DesignDnaSynthesisError && err.issues.length > 0,
    );
  });
});
