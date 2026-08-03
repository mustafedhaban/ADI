import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "../db/index.js";
import {
  collectionReferences,
  collections,
  references,
} from "../db/schema.js";
import type { CollectionInput, CollectionSummary } from "../domain/collection.js";
import type { ReferenceRecord } from "../domain/validation.js";
import { ReferenceRepository } from "./reference-repository.js";

export interface CollectionDetail extends CollectionSummary {
  references: ReferenceRecord[];
}

export class CollectionRepository {
  private readonly references: ReferenceRepository;

  constructor(private readonly db: Db) {
    this.references = new ReferenceRepository(db);
  }

  list(): CollectionSummary[] {
    const rows = this.db
      .select()
      .from(collections)
      .orderBy(desc(collections.updatedAt))
      .all();

    return rows.map((row) => this.toSummary(row));
  }

  findById(id: string): CollectionDetail | null {
    const row = this.db
      .select()
      .from(collections)
      .where(eq(collections.id, id))
      .get();
    if (!row) return null;

    const memberships = this.db
      .select()
      .from(collectionReferences)
      .where(eq(collectionReferences.collectionId, id))
      .orderBy(desc(collectionReferences.createdAt))
      .all();

    const refs = memberships
      .map((m) => this.references.findById(m.referenceId))
      .filter((r): r is ReferenceRecord => Boolean(r));

    const summary = this.toSummary(row, refs);
    return { ...summary, references: refs };
  }

  listForReference(referenceId: string): CollectionSummary[] {
    const memberships = this.db
      .select({ collectionId: collectionReferences.collectionId })
      .from(collectionReferences)
      .where(eq(collectionReferences.referenceId, referenceId))
      .all();

    if (!memberships.length) return [];

    const ids = memberships.map((m) => m.collectionId);
    const rows = this.db
      .select()
      .from(collections)
      .where(inArray(collections.id, ids))
      .orderBy(desc(collections.updatedAt))
      .all();

    return rows.map((row) => this.toSummary(row));
  }

  create(input: CollectionInput): CollectionDetail {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db
      .insert(collections)
      .values({
        id,
        name: input.name!.trim(),
        description: input.description ?? null,
        coverImage: input.coverImage ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    return this.findById(id)!;
  }

  update(id: string, input: CollectionInput): CollectionDetail | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    this.db
      .update(collections)
      .set({
        name: input.name !== undefined ? input.name.trim() : existing.name,
        description:
          input.description !== undefined
            ? input.description
            : existing.description,
        coverImage:
          input.coverImage !== undefined ? input.coverImage : existing.coverImage,
        updatedAt: now,
      })
      .where(eq(collections.id, id))
      .run();

    return this.findById(id);
  }

  delete(id: string): boolean {
    const existing = this.findById(id);
    if (!existing) return false;
    this.db
      .delete(collectionReferences)
      .where(eq(collectionReferences.collectionId, id))
      .run();
    this.db.delete(collections).where(eq(collections.id, id)).run();
    return true;
  }

  addReferences(
    collectionId: string,
    referenceIds: string[],
  ): {
    added: string[];
    skippedDuplicates: string[];
    missing: string[];
  } {
    const collection = this.findById(collectionId);
    if (!collection) {
      throw Object.assign(new Error("Collection not found"), { statusCode: 404 });
    }

    const added: string[] = [];
    const skippedDuplicates: string[] = [];
    const missing: string[] = [];
    const now = new Date().toISOString();

    for (const referenceId of referenceIds) {
      const ref = this.references.findById(referenceId);
      if (!ref) {
        missing.push(referenceId);
        continue;
      }

      const existing = this.db
        .select()
        .from(collectionReferences)
        .where(
          and(
            eq(collectionReferences.collectionId, collectionId),
            eq(collectionReferences.referenceId, referenceId),
          ),
        )
        .get();

      if (existing) {
        skippedDuplicates.push(referenceId);
        continue;
      }

      this.db
        .insert(collectionReferences)
        .values({
          collectionId,
          referenceId,
          createdAt: now,
        })
        .run();
      added.push(referenceId);
    }

    if (added.length) {
      this.touch(collectionId);
    }

    return { added, skippedDuplicates, missing };
  }

  removeReference(collectionId: string, referenceId: string): boolean {
    const existing = this.db
      .select()
      .from(collectionReferences)
      .where(
        and(
          eq(collectionReferences.collectionId, collectionId),
          eq(collectionReferences.referenceId, referenceId),
        ),
      )
      .get();
    if (!existing) return false;

    this.db
      .delete(collectionReferences)
      .where(
        and(
          eq(collectionReferences.collectionId, collectionId),
          eq(collectionReferences.referenceId, referenceId),
        ),
      )
      .run();
    this.touch(collectionId);
    return true;
  }

  private touch(collectionId: string) {
    this.db
      .update(collections)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(collections.id, collectionId))
      .run();
  }

  private toSummary(
    row: typeof collections.$inferSelect,
    refs?: ReferenceRecord[],
  ): CollectionSummary {
    const loadedRefs =
      refs ??
      this.db
        .select({
          image: references.image,
        })
        .from(collectionReferences)
        .innerJoin(
          references,
          eq(collectionReferences.referenceId, references.id),
        )
        .where(eq(collectionReferences.collectionId, row.id))
        .orderBy(desc(collectionReferences.createdAt))
        .all()
        .map((r) => ({ image: r.image }));

    const coverImages = loadedRefs
      .map((r) => ("image" in r ? r.image : null))
      .filter((img): img is string => Boolean(img))
      .slice(0, 4);

    const count =
      refs?.length ??
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(collectionReferences)
        .where(eq(collectionReferences.collectionId, row.id))
        .get()?.count ??
      0;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      coverImage: row.coverImage ?? coverImages[0] ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      referenceCount: Number(count),
      coverImages,
    };
  }
}
