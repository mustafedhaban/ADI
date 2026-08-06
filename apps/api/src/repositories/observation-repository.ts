import { and, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "../db/index.js";
import {
  collectionReferences,
  referenceObservations,
  references,
} from "../db/schema.js";
import type {
  ObservationCategory,
  ObservationInput,
  Provenance,
} from "../domain/observations.js";

/* ---------------------------------------------------------------------------
   Observation reads and aggregates.

   Everything here is SQL rather than in-process filtering: the point of the
   controlled vocabulary is that the database can group and count it, and the
   library is heading for ~300 references with a dozen observations each.
--------------------------------------------------------------------------- */

export interface ObservationRecord {
  id: string;
  referenceId: string;
  category: ObservationCategory;
  trait: string;
  provenance: Provenance;
  detail: string | null;
  confidence: number | null;
  evidenceAssetId: string | null;
  evidenceNote: string | null;
  recordedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TraitCount {
  category: ObservationCategory;
  trait: string;
  count: number;
  /** Share of the reference population that carries the trait, 0-1. */
  share: number;
}

export interface TraitCooccurrence {
  category: ObservationCategory;
  trait: string;
  otherCategory: ObservationCategory;
  otherTrait: string;
  count: number;
}

function toRecord(
  row: typeof referenceObservations.$inferSelect,
): ObservationRecord {
  return {
    id: row.id,
    referenceId: row.referenceId,
    category: row.category as ObservationCategory,
    trait: row.trait,
    provenance: row.provenance as Provenance,
    detail: row.detail,
    confidence: row.confidence,
    evidenceAssetId: row.evidenceAssetId,
    evidenceNote: row.evidenceNote,
    recordedBy: row.recordedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class ObservationRepository {
  constructor(private readonly db: Db) {}

  listForReference(referenceId: string): ObservationRecord[] {
    return this.db
      .select()
      .from(referenceObservations)
      .where(eq(referenceObservations.referenceId, referenceId))
      .all()
      .map(toRecord);
  }

  listForReferences(referenceIds: string[]): ObservationRecord[] {
    if (!referenceIds.length) return [];
    return this.db
      .select()
      .from(referenceObservations)
      .where(inArray(referenceObservations.referenceId, referenceIds))
      .all()
      .map(toRecord);
  }

  findById(id: string): ObservationRecord | null {
    const row = this.db
      .select()
      .from(referenceObservations)
      .where(eq(referenceObservations.id, id))
      .get();
    return row ? toRecord(row) : null;
  }

  /**
   * Upsert one observation. The unique index is (reference, category, trait,
   * provenance), so re-recording the same statement updates its detail and
   * evidence rather than creating a duplicate — which keeps recurrence counts
   * honest when a reference is re-reviewed.
   */
  upsert(referenceId: string, input: ObservationInput): ObservationRecord {
    const now = new Date().toISOString();
    const existing = this.db
      .select()
      .from(referenceObservations)
      .where(
        and(
          eq(referenceObservations.referenceId, referenceId),
          eq(referenceObservations.category, input.category),
          eq(referenceObservations.trait, input.trait),
          eq(referenceObservations.provenance, input.provenance),
        ),
      )
      .get();

    if (existing) {
      this.db
        .update(referenceObservations)
        .set({
          detail: input.detail ?? null,
          confidence: input.confidence ?? null,
          evidenceAssetId: input.evidenceAssetId ?? null,
          evidenceNote: input.evidenceNote ?? null,
          recordedBy: input.recordedBy ?? null,
          updatedAt: now,
        })
        .where(eq(referenceObservations.id, existing.id))
        .run();
      return this.findById(existing.id)!;
    }

    const id = randomUUID();
    this.db
      .insert(referenceObservations)
      .values({
        id,
        referenceId,
        category: input.category,
        trait: input.trait,
        provenance: input.provenance,
        detail: input.detail ?? null,
        confidence: input.confidence ?? null,
        evidenceAssetId: input.evidenceAssetId ?? null,
        evidenceNote: input.evidenceNote ?? null,
        recordedBy: input.recordedBy ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    return this.findById(id)!;
  }

  upsertMany(
    referenceId: string,
    inputs: ObservationInput[],
  ): ObservationRecord[] {
    return inputs.map((i) => this.upsert(referenceId, i));
  }

  remove(id: string): boolean {
    const existing = this.findById(id);
    if (!existing) return false;
    this.db
      .delete(referenceObservations)
      .where(eq(referenceObservations.id, id))
      .run();
    return true;
  }

  /** How many references carry at least one observation. */
  coverage(): { referencesWithObservations: number; totalObservations: number } {
    const row = this.db
      .select({
        refs: sql<number>`count(distinct ${referenceObservations.referenceId})`,
        total: sql<number>`count(*)`,
      })
      .from(referenceObservations)
      .get();
    return {
      referencesWithObservations: row?.refs ?? 0,
      totalObservations: row?.total ?? 0,
    };
  }

  /**
   * Library-wide trait recurrence.
   *
   * `provenance` defaults to `observed` on purpose: a pattern claim across the
   * library must rest on facts, never on accumulated inference.
   */
  traitCounts(options: {
    provenance?: Provenance;
    category?: ObservationCategory;
    minCount?: number;
    referenceIds?: string[];
  } = {}): TraitCount[] {
    const provenance = options.provenance ?? "observed";
    const conditions = [eq(referenceObservations.provenance, provenance)];
    if (options.category) {
      conditions.push(eq(referenceObservations.category, options.category));
    }
    if (options.referenceIds?.length) {
      conditions.push(
        inArray(referenceObservations.referenceId, options.referenceIds),
      );
    }

    const rows = this.db
      .select({
        category: referenceObservations.category,
        trait: referenceObservations.trait,
        count: sql<number>`count(distinct ${referenceObservations.referenceId})`,
      })
      .from(referenceObservations)
      .where(and(...conditions))
      .groupBy(referenceObservations.category, referenceObservations.trait)
      .all();

    // Denominator: the population the counts are drawn from, so `share` means
    // something. Scoped to the supplied ids when the caller narrowed the set.
    const denominator = options.referenceIds?.length
      ? options.referenceIds.length
      : (this.db
          .select({ n: sql<number>`count(*)` })
          .from(references)
          .get()?.n ?? 0);

    const min = options.minCount ?? 1;
    return rows
      .filter((r) => r.count >= min)
      .map((r) => ({
        category: r.category as ObservationCategory,
        trait: r.trait,
        count: r.count,
        share: denominator ? r.count / denominator : 0,
      }))
      .sort((a, b) => b.count - a.count || a.trait.localeCompare(b.trait));
  }

  /** Which references carry a given trait — the drill-down behind a count. */
  referencesWithTrait(
    category: ObservationCategory,
    trait: string,
    provenance: Provenance = "observed",
  ): { id: string; title: string; url: string }[] {
    return this.db
      .select({
        id: references.id,
        title: references.title,
        url: references.url,
      })
      .from(referenceObservations)
      .innerJoin(
        references,
        eq(references.id, referenceObservations.referenceId),
      )
      .where(
        and(
          eq(referenceObservations.category, category),
          eq(referenceObservations.trait, trait),
          eq(referenceObservations.provenance, provenance),
        ),
      )
      .orderBy(references.title)
      .all();
  }

  /**
   * Trait pairs that co-occur on the same reference.
   *
   * The self-join is ordered (`a.trait < b.trait`) so each unordered pair is
   * counted once rather than twice.
   */
  cooccurrence(options: { minCount?: number; limit?: number } = {}): TraitCooccurrence[] {
    const min = options.minCount ?? 3;
    const limit = options.limit ?? 40;
    const rows = this.db.all<{
      category: string;
      trait: string;
      other_category: string;
      other_trait: string;
      count: number;
    }>(sql`
      SELECT a.category      AS category,
             a.trait         AS trait,
             b.category      AS other_category,
             b.trait         AS other_trait,
             count(*)        AS count
      FROM reference_observations a
      JOIN reference_observations b
        ON a.reference_id = b.reference_id
       AND a.provenance = 'observed'
       AND b.provenance = 'observed'
       AND (a.category || '|' || a.trait) < (b.category || '|' || b.trait)
      GROUP BY a.category, a.trait, b.category, b.trait
      HAVING count(*) >= ${min}
      ORDER BY count DESC
      LIMIT ${limit}
    `);
    return rows.map((r) => ({
      category: r.category as ObservationCategory,
      trait: r.trait,
      otherCategory: r.other_category as ObservationCategory,
      otherTrait: r.other_trait,
      count: r.count,
    }));
  }

  /** Reference ids belonging to a collection — the scope for its summary. */
  referenceIdsInCollection(collectionId: string): string[] {
    return this.db
      .select({ id: collectionReferences.referenceId })
      .from(collectionReferences)
      .where(eq(collectionReferences.collectionId, collectionId))
      .all()
      .map((r) => r.id);
  }

  /**
   * Traits present in a scope but rare across the library — what makes this
   * collection distinctive rather than merely typical.
   */
  distinctiveTraits(referenceIds: string[], limit = 12): (TraitCount & {
    libraryShare: number;
    lift: number;
  })[] {
    if (!referenceIds.length) return [];
    const scoped = this.traitCounts({ referenceIds });
    const library = new Map(
      this.traitCounts().map((t) => [`${t.category}|${t.trait}`, t.share]),
    );
    return scoped
      .map((t) => {
        const libraryShare = library.get(`${t.category}|${t.trait}`) ?? 0;
        return {
          ...t,
          libraryShare,
          // How much more common here than library-wide. 1 = no different.
          lift: libraryShare > 0 ? t.share / libraryShare : 0,
        };
      })
      .filter((t) => t.count >= 2 && t.lift > 1.2)
      .sort((a, b) => b.lift - a.lift || b.count - a.count)
      .slice(0, limit);
  }
}
