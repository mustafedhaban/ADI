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
import { ReferenceRepository } from "../repositories/reference-repository.js";
import { validateCollectionInput, parseReferenceIds } from "./collection.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../drizzle");

describe("collection domain validation", () => {
  it("requires a non-empty name", () => {
    const { data, issues } = validateCollectionInput({ name: "  " });
    assert.equal(data, null);
    assert.ok(issues.some((i) => i.field === "name"));
  });

  it("accepts a valid collection", () => {
    const { data, issues } = validateCollectionInput({
      name: "CAYO Website Inspiration",
      description: "For the CAYO project",
    });
    assert.equal(issues.length, 0);
    assert.equal(data?.name, "CAYO Website Inspiration");
  });

  it("parses single and multiple reference ids", () => {
    assert.deepEqual(
      parseReferenceIds({ referenceId: "a" }).referenceIds,
      ["a"],
    );
    assert.deepEqual(
      parseReferenceIds({ referenceIds: ["a", "b", "a"] }).referenceIds,
      ["a", "b"],
    );
  });
});

describe("collection repository", () => {
  let dbPath = "";
  let sqlite: Database.Database;
  let collections: CollectionRepository;
  let references: ReferenceRepository;
  let refA = "";
  let refB = "";

  before(() => {
    dbPath = path.join(os.tmpdir(), `adi-collections-${Date.now()}.db`);
    sqlite = new Database(dbPath);
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder });
    collections = new CollectionRepository(db);
    references = new ReferenceRepository(db);

    refA = references.create({
      title: "Ref A",
      source: "Other",
      url: "https://example.com/ref-a",
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
      url: "https://example.com/ref-b",
      type: "website",
      image: "https://example.com/b.jpg",
      industries: [],
      pageTypes: [],
      styles: [],
      patterns: [],
      tags: [],
      whatToLearn: [],
    }).id;
  });

  after(() => {
    sqlite.close();
    fs.rmSync(dbPath, { force: true });
    fs.rmSync(`${dbPath}-wal`, { force: true });
    fs.rmSync(`${dbPath}-shm`, { force: true });
  });

  it("creates, updates, and lists collections", () => {
    const created = collections.create({
      name: "NGO Research",
      description: "Nonprofit inspiration",
    });
    assert.equal(created.name, "NGO Research");
    assert.equal(created.referenceCount, 0);

    const updated = collections.update(created.id, {
      name: "NGO Website Research",
    });
    assert.equal(updated?.name, "NGO Website Research");

    const listed = collections.list();
    assert.ok(listed.some((c) => c.id === created.id));
  });

  it("adds references and prevents duplicates", () => {
    const collection = collections.create({ name: "Premium SaaS" });
    const first = collections.addReferences(collection.id, [refA, refB]);
    assert.deepEqual(first.added.sort(), [refA, refB].sort());
    assert.equal(first.skippedDuplicates.length, 0);

    const second = collections.addReferences(collection.id, [refA]);
    assert.deepEqual(second.added, []);
    assert.deepEqual(second.skippedDuplicates, [refA]);

    const detail = collections.findById(collection.id)!;
    assert.equal(detail.referenceCount, 2);
    assert.equal(detail.coverImages.length, 2);
  });

  it("allows a reference in multiple collections", () => {
    const one = collections.create({ name: "Collection One" });
    const two = collections.create({ name: "Collection Two" });
    collections.addReferences(one.id, [refA]);
    collections.addReferences(two.id, [refA]);

    const memberships = collections.listForReference(refA);
    assert.ok(memberships.some((c) => c.id === one.id));
    assert.ok(memberships.some((c) => c.id === two.id));
  });

  it("removes a reference from a collection", () => {
    const collection = collections.create({ name: "Temp Remove" });
    collections.addReferences(collection.id, [refA, refB]);
    const removed = collections.removeReference(collection.id, refA);
    assert.equal(removed, true);
    const detail = collections.findById(collection.id)!;
    assert.equal(detail.referenceCount, 1);
    assert.equal(detail.references[0]?.id, refB);
  });

  it("deletes a collection without deleting references", () => {
    const collection = collections.create({ name: "Temp Delete" });
    collections.addReferences(collection.id, [refA]);
    const deleted = collections.delete(collection.id);
    assert.equal(deleted, true);
    assert.equal(collections.findById(collection.id), null);
    assert.ok(references.findById(refA));
  });

  it("cleans memberships when a reference is deleted", () => {
    const collection = collections.create({ name: "Membership Cleanup" });
    const temp = references.create({
      title: "Temp Ref",
      source: "Other",
      url: `https://example.com/temp-${Date.now()}`,
      type: "website",
      industries: [],
      pageTypes: [],
      styles: [],
      patterns: [],
      tags: [],
      whatToLearn: [],
    });
    collections.addReferences(collection.id, [temp.id]);
    references.delete(temp.id);

    const detail = collections.findById(collection.id)!;
    assert.equal(detail.referenceCount, 0);
    assert.deepEqual(collections.listForReference(temp.id), []);
  });
});
