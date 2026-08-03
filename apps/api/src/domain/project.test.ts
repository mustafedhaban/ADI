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
import { CollectionRepository } from "../repositories/collection-repository.js";
import { ProjectRepository } from "../repositories/project-repository.js";
import { ReferenceRepository } from "../repositories/reference-repository.js";
import {
  parseCollectionIds,
  validateProjectInput,
} from "./project.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../drizzle");

describe("project domain validation", () => {
  it("requires a non-empty name", () => {
    const { data, issues } = validateProjectInput({ name: "  " });
    assert.equal(data, null);
    assert.ok(issues.some((i) => i.field === "name"));
  });

  it("accepts a valid project", () => {
    const { data, issues } = validateProjectInput({
      name: "CAYO Website",
      clientName: "CAYO",
      industry: "NGO",
      projectType: "Website",
    });
    assert.equal(issues.length, 0);
    assert.equal(data?.name, "CAYO Website");
    assert.equal(data?.industry, "NGO");
  });

  it("rejects unknown industry and projectType", () => {
    const { data, issues } = validateProjectInput({
      name: "Test",
      industry: "NotARealIndustry",
      projectType: "Spaceship",
    });
    assert.equal(data, null);
    assert.ok(issues.some((i) => i.field === "industry"));
    assert.ok(issues.some((i) => i.field === "projectType"));
  });

  it("parses collection ids and dedupes", () => {
    assert.deepEqual(
      parseCollectionIds({ collectionId: "a" }).collectionIds,
      ["a"],
    );
    assert.deepEqual(
      parseCollectionIds({ collectionIds: ["a", "b", "a"] }).collectionIds,
      ["a", "b"],
    );
  });

  it("accepts a full research brief with taxonomy values", () => {
    const { data, issues } = validateProjectInput({
      name: "Brief Project",
      audience: "Donors and partners",
      audienceNeeds: "Trust and clarity",
      businessGoals: "Increase donations",
      projectGoals: "Modern nonprofit site",
      desiredStyles: ["Clean", "Editorial"],
      avoidStyles: ["Brutalist"],
      keyMessages: "Impact first",
      contentTypes: ["Photography", "Case Studies"],
      requiredFeatures: ["Donation form", "Impact stories"],
      preferredSources: ["Awwwards", "Behance"],
      referenceKeywords: ["nonprofit", "warm"],
      competitors: ["charity: water"],
      competitorNotes: "Strong storytelling",
      constraints: "Accessible, mobile-first",
    });
    assert.equal(issues.length, 0);
    assert.equal(data?.audienceNeeds, "Trust and clarity");
    assert.deepEqual(data?.desiredStyles, ["Clean", "Editorial"]);
    assert.deepEqual(data?.preferredSources, ["Awwwards", "Behance"]);
  });

  it("allows empty optional research brief fields", () => {
    const { data, issues } = validateProjectInput(
      {
        desiredStyles: [],
        avoidStyles: [],
        contentTypes: [],
        requiredFeatures: [],
        preferredSources: [],
        referenceKeywords: [],
        competitors: [],
        audienceNeeds: null,
        businessGoals: "",
        constraints: "   ",
      },
      { partial: true },
    );
    assert.equal(issues.length, 0);
    assert.deepEqual(data?.desiredStyles, []);
    assert.equal(data?.audienceNeeds, null);
    assert.equal(data?.businessGoals, null);
    assert.equal(data?.constraints, null);
  });

  it("rejects invalid style taxonomy values", () => {
    const { data, issues } = validateProjectInput(
      { desiredStyles: ["NotAStyle"] },
      { partial: true },
    );
    assert.equal(data, null);
    assert.ok(issues.some((i) => i.field === "desiredStyles"));
  });

  it("rejects invalid source taxonomy values", () => {
    const { data, issues } = validateProjectInput(
      { preferredSources: ["FakeSource"] },
      { partial: true },
    );
    assert.equal(data, null);
    assert.ok(issues.some((i) => i.field === "preferredSources"));
  });

  it("rejects non-array multi-value fields", () => {
    const { data, issues } = validateProjectInput(
      { requiredFeatures: "Donation form" },
      { partial: true },
    );
    assert.equal(data, null);
    assert.ok(issues.some((i) => i.field === "requiredFeatures"));
  });
});

describe("project repository", () => {
  let dbPath = "";
  let sqlite: Database.Database;
  let projects: ProjectRepository;
  let collections: CollectionRepository;
  let references: ReferenceRepository;
  let refA = "";
  let refB = "";
  let refC = "";
  let collectionOne = "";
  let collectionTwo = "";

  before(() => {
    dbPath = path.join(os.tmpdir(), `adi-projects-${Date.now()}.db`);
    sqlite = new Database(dbPath);
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder });
    projects = new ProjectRepository(db);
    collections = new CollectionRepository(db);
    references = new ReferenceRepository(db);

    refA = references.create({
      title: "Ref A",
      source: "Other",
      url: "https://example.com/proj-ref-a",
      type: "website",
      image: "https://example.com/a.jpg",
      industries: [],
      pageTypes: [],
      styles: [],
      patterns: [],
      tags: [],
      whatToLearn: [],
    }).id;

    refB = references.create({
      title: "Ref B",
      source: "Other",
      url: "https://example.com/proj-ref-b",
      type: "website",
      image: "https://example.com/b.jpg",
      industries: [],
      pageTypes: [],
      styles: [],
      patterns: [],
      tags: [],
      whatToLearn: [],
    }).id;

    refC = references.create({
      title: "Ref C",
      source: "Other",
      url: "https://example.com/proj-ref-c",
      type: "website",
      image: "https://example.com/c.jpg",
      industries: [],
      pageTypes: [],
      styles: [],
      patterns: [],
      tags: [],
      whatToLearn: [],
    }).id;

    collectionOne = collections.create({ name: "Hero Inspiration" }).id;
    collectionTwo = collections.create({ name: "Brand Direction" }).id;
    collections.addReferences(collectionOne, [refA, refB]);
    collections.addReferences(collectionTwo, [refB, refC]);
  });

  after(() => {
    sqlite.close();
    fs.rmSync(dbPath, { force: true });
    fs.rmSync(`${dbPath}-wal`, { force: true });
    fs.rmSync(`${dbPath}-shm`, { force: true });
  });

  it("creates a project", () => {
    const created = projects.create({
      name: "CAYO Website",
      clientName: "CAYO",
      industry: "NGO",
      projectType: "Website",
      designGoals: "Warm, trustworthy nonprofit site",
    });
    assert.equal(created.name, "CAYO Website");
    assert.equal(created.status, "active");
    assert.equal(created.collectionCount, 0);
    assert.equal(created.referenceCount, 0);
  });

  it("updates a project", () => {
    const created = projects.create({ name: "Update Me" });
    const updated = projects.update(created.id, {
      name: "Updated Project",
      audience: "Donors",
      location: "Somalia",
    });
    assert.equal(updated?.name, "Updated Project");
    assert.equal(updated?.audience, "Donors");
    assert.equal(updated?.location, "Somalia");
  });

  it("archives a project without deleting it", () => {
    const created = projects.create({ name: "Archive Me" });
    const archived = projects.update(created.id, { status: "archived" });
    assert.equal(archived?.status, "archived");
    assert.ok(projects.findById(created.id));
    const active = projects.list("active");
    assert.ok(!active.some((p) => p.id === created.id));
    const archivedList = projects.list("archived");
    assert.ok(archivedList.some((p) => p.id === created.id));
  });

  it("adds collections and prevents duplicates", () => {
    const project = projects.create({ name: "Dup Collection Test" });
    const first = projects.addCollections(project.id, [collectionOne]);
    assert.deepEqual(first.added, [collectionOne]);
    assert.equal(first.skippedDuplicates.length, 0);

    const second = projects.addCollections(project.id, [collectionOne]);
    assert.deepEqual(second.added, []);
    assert.deepEqual(second.skippedDuplicates, [collectionOne]);

    const detail = projects.findById(project.id)!;
    assert.equal(detail.collectionCount, 1);
  });

  it("removes a collection from a project", () => {
    const project = projects.create({ name: "Remove Collection" });
    projects.addCollections(project.id, [collectionOne, collectionTwo]);
    const removed = projects.removeCollection(project.id, collectionOne);
    assert.equal(removed, true);
    const detail = projects.findById(project.id)!;
    assert.equal(detail.collectionCount, 1);
    assert.equal(detail.collections[0]?.id, collectionTwo);
  });

  it("allows the same collection on multiple projects", () => {
    const one = projects.create({ name: "Project One" });
    const two = projects.create({ name: "Project Two" });
    projects.addCollections(one.id, [collectionOne]);
    projects.addCollections(two.id, [collectionOne]);

    const memberships = projects.listForCollection(collectionOne);
    assert.ok(memberships.some((p) => p.id === one.id));
    assert.ok(memberships.some((p) => p.id === two.id));
  });

  it("aggregates and deduplicates references across collections", () => {
    const project = projects.create({ name: "Aggregate Refs" });
    projects.addCollections(project.id, [collectionOne, collectionTwo]);
    const detail = projects.findById(project.id)!;
    assert.equal(detail.collectionCount, 2);
    assert.equal(detail.referenceCount, 3);
    const ids = detail.references.map((r) => r.id).sort();
    assert.deepEqual(ids, [refA, refB, refC].sort());
  });

  it("deletes a project while preserving collections and references", () => {
    const project = projects.create({ name: "Delete Me" });
    projects.addCollections(project.id, [collectionOne]);
    const deleted = projects.delete(project.id);
    assert.equal(deleted, true);
    assert.equal(projects.findById(project.id), null);
    assert.ok(collections.findById(collectionOne));
    assert.ok(references.findById(refA));
  });

  it("cleans project memberships when a collection is deleted", () => {
    const project = projects.create({ name: "Membership Cleanup" });
    const temp = collections.create({ name: "Temp Collection" });
    projects.addCollections(project.id, [temp.id]);
    collections.delete(temp.id);

    const detail = projects.findById(project.id)!;
    assert.equal(detail.collectionCount, 0);
    assert.deepEqual(projects.listForCollection(temp.id), []);
  });

  it("creates a project without a research brief (empty defaults)", () => {
    const created = projects.create({ name: "No Brief Yet" });
    assert.equal(created.audienceNeeds, null);
    assert.equal(created.businessGoals, null);
    assert.equal(created.projectGoals, null);
    assert.deepEqual(created.desiredStyles, []);
    assert.deepEqual(created.avoidStyles, []);
    assert.deepEqual(created.contentTypes, []);
    assert.deepEqual(created.requiredFeatures, []);
    assert.deepEqual(created.preferredSources, []);
    assert.deepEqual(created.referenceKeywords, []);
    assert.deepEqual(created.competitors, []);
    assert.equal(created.constraints, null);
  });

  it("saves, retrieves, and updates a research brief", () => {
    const created = projects.create({
      name: "Brief Save Test",
      audience: "Founders",
    });

    const saved = projects.update(created.id, {
      audience: "Nonprofit donors",
      audienceNeeds: "Clarity and trust",
      businessGoals: "Raise awareness",
      projectGoals: "Launch a warm website",
      desiredStyles: ["Clean", "Human-centered"],
      avoidStyles: ["Brutalist"],
      keyMessages: "Every gift matters",
      contentTypes: ["Photography", "Testimonials"],
      requiredFeatures: ["Donation CTA", "Impact map"],
      preferredSources: ["Awwwards"],
      referenceKeywords: ["nonprofit", "human"],
      competitors: ["charity: water", "Kiva"],
      competitorNotes: "Strong photo storytelling",
      constraints: "Must work on low bandwidth",
    });

    assert.ok(saved);
    assert.equal(saved.audience, "Nonprofit donors");
    assert.equal(saved.audienceNeeds, "Clarity and trust");
    assert.equal(saved.businessGoals, "Raise awareness");
    assert.equal(saved.projectGoals, "Launch a warm website");
    assert.deepEqual(saved.desiredStyles, ["Clean", "Human-centered"]);
    assert.deepEqual(saved.avoidStyles, ["Brutalist"]);
    assert.equal(saved.keyMessages, "Every gift matters");
    assert.deepEqual(saved.contentTypes, ["Photography", "Testimonials"]);
    assert.deepEqual(saved.requiredFeatures, ["Donation CTA", "Impact map"]);
    assert.deepEqual(saved.preferredSources, ["Awwwards"]);
    assert.deepEqual(saved.referenceKeywords, ["nonprofit", "human"]);
    assert.deepEqual(saved.competitors, ["charity: water", "Kiva"]);
    assert.equal(saved.competitorNotes, "Strong photo storytelling");
    assert.equal(saved.constraints, "Must work on low bandwidth");

    const retrieved = projects.findById(created.id)!;
    assert.deepEqual(retrieved.desiredStyles, ["Clean", "Human-centered"]);
    assert.equal(retrieved.projectGoals, "Launch a warm website");

    const updated = projects.update(created.id, {
      desiredStyles: ["Minimal", "Editorial"],
      avoidStyles: ["Experimental", "Playful"],
      projectGoals: "Position as premium NGO partner",
    });
    assert.deepEqual(updated?.desiredStyles, ["Minimal", "Editorial"]);
    assert.deepEqual(updated?.avoidStyles, ["Experimental", "Playful"]);
    assert.equal(updated?.projectGoals, "Position as premium NGO partner");
    // Unchanged brief fields persist
    assert.equal(updated?.audienceNeeds, "Clarity and trust");
    assert.deepEqual(updated?.preferredSources, ["Awwwards"]);
  });
});
