import { and, desc, eq, ne, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "../db/index.js";
import { designDna, designDnaEvidence } from "../db/schema.js";
import {
  emptyDesignDnaStructure,
  normalizeDesignDnaStructure,
  sectionEntries,
  type DesignDnaEvidenceEntry,
  type DesignDnaSectionKey,
  type DesignDnaStatus,
  type DesignDnaStructure,
} from "../domain/design-dna.js";
import type { ReferenceRecord } from "../domain/validation.js";
import { ReferenceRepository } from "./reference-repository.js";

function parseJsonStringArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function parseStructure(raw: string): DesignDnaStructure {
  try {
    return normalizeDesignDnaStructure(JSON.parse(raw)).data;
  } catch {
    return emptyDesignDnaStructure();
  }
}

export interface DesignDnaSummary {
  id: string;
  projectId: string;
  version: number;
  status: DesignDnaStatus;
  referenceCount: number;
  sourceCollectionIds: string[];
  evidenceCount: number;
  generatedAt: string;
  updatedAt: string;
}

/** One insight and the references that support it. */
export interface DesignDnaEvidenceGroup {
  section: DesignDnaSectionKey;
  insight: string;
  references: ReferenceRecord[];
}

export interface DesignDnaDetail extends DesignDnaSummary {
  structure: DesignDnaStructure;
  evidence: DesignDnaEvidenceGroup[];
}

export interface CreateDesignDnaInput {
  projectId: string;
  structure: DesignDnaStructure;
  evidence: DesignDnaEvidenceEntry[];
  referenceCount: number;
  sourceCollectionIds: string[];
}

export class DesignDnaRepository {
  private readonly references: ReferenceRepository;

  constructor(private readonly db: Db) {
    this.references = new ReferenceRepository(db);
  }

  /** Next version number for a project — versions are never reused. */
  nextVersion(projectId: string): number {
    const row = this.db
      .select({ max: sql<number | null>`max(${designDna.version})` })
      .from(designDna)
      .where(eq(designDna.projectId, projectId))
      .get();
    return Number(row?.max ?? 0) + 1;
  }

  /**
   * Create a new draft version. Existing versions are never modified, so a
   * published version stays published until the user explicitly promotes
   * another one.
   */
  create(input: CreateDesignDnaInput): DesignDnaDetail {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .insert(designDna)
      .values({
        id,
        projectId: input.projectId,
        version: this.nextVersion(input.projectId),
        status: "draft",
        content: JSON.stringify(input.structure),
        referenceCount: input.referenceCount,
        sourceCollectionIds: JSON.stringify(input.sourceCollectionIds),
        generatedAt: now,
        updatedAt: now,
      })
      .run();

    this.replaceEvidence(id, input.evidence);
    return this.findById(id)!;
  }

  listForProject(projectId: string): DesignDnaSummary[] {
    return this.db
      .select()
      .from(designDna)
      .where(eq(designDna.projectId, projectId))
      .orderBy(desc(designDna.version))
      .all()
      .map((row) => this.toSummary(row));
  }

  /** Published version when one exists, otherwise the newest version. */
  findCurrentForProject(projectId: string): DesignDnaDetail | null {
    const published = this.db
      .select()
      .from(designDna)
      .where(
        and(
          eq(designDna.projectId, projectId),
          eq(designDna.status, "published"),
        ),
      )
      .orderBy(desc(designDna.version))
      .get();
    if (published) return this.findById(published.id);

    const latest = this.db
      .select()
      .from(designDna)
      .where(eq(designDna.projectId, projectId))
      .orderBy(desc(designDna.version))
      .get();
    return latest ? this.findById(latest.id) : null;
  }

  findById(id: string): DesignDnaDetail | null {
    const row = this.db
      .select()
      .from(designDna)
      .where(eq(designDna.id, id))
      .get();
    if (!row) return null;

    return {
      ...this.toSummary(row),
      structure: parseStructure(row.content),
      evidence: this.loadEvidence(id),
    };
  }

  /** Apply a manual edit to the stored structure. */
  updateStructure(
    id: string,
    structure: DesignDnaStructure,
    touchedSections: DesignDnaSectionKey[] = [],
  ): DesignDnaDetail | null {
    const existing = this.db
      .select()
      .from(designDna)
      .where(eq(designDna.id, id))
      .get();
    if (!existing) return null;

    this.db
      .update(designDna)
      .set({
        content: JSON.stringify(structure),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(designDna.id, id))
      .run();

    // Evidence is keyed by insight text, so drop rows whose insight no longer
    // exists in an edited section rather than leaving dangling traceability.
    for (const section of touchedSections) {
      this.pruneEvidenceSection(id, section, sectionEntries(structure, section));
    }

    return this.findById(id);
  }

  /**
   * Publish a version and demote any other published version of the same
   * project back to draft, keeping the "one published version" invariant.
   */
  publish(id: string): DesignDnaDetail | null {
    const existing = this.db
      .select()
      .from(designDna)
      .where(eq(designDna.id, id))
      .get();
    if (!existing) return null;

    const now = new Date().toISOString();

    this.db
      .update(designDna)
      .set({ status: "draft", updatedAt: now })
      .where(
        and(
          eq(designDna.projectId, existing.projectId),
          eq(designDna.status, "published"),
          ne(designDna.id, id),
        ),
      )
      .run();

    this.db
      .update(designDna)
      .set({ status: "published", updatedAt: now })
      .where(eq(designDna.id, id))
      .run();

    return this.findById(id);
  }

  unpublish(id: string): DesignDnaDetail | null {
    const existing = this.db
      .select()
      .from(designDna)
      .where(eq(designDna.id, id))
      .get();
    if (!existing) return null;

    this.db
      .update(designDna)
      .set({ status: "draft", updatedAt: new Date().toISOString() })
      .where(eq(designDna.id, id))
      .run();

    return this.findById(id);
  }

  private replaceEvidence(dnaId: string, entries: DesignDnaEvidenceEntry[]) {
    this.db
      .delete(designDnaEvidence)
      .where(eq(designDnaEvidence.dnaId, dnaId))
      .run();

    const now = new Date().toISOString();
    for (const entry of entries) {
      for (const referenceId of entry.referenceIds) {
        this.db
          .insert(designDnaEvidence)
          .values({
            id: randomUUID(),
            dnaId,
            referenceId,
            section: entry.section,
            insight: entry.insight,
            createdAt: now,
          })
          .onConflictDoNothing()
          .run();
      }
    }
  }

  private pruneEvidenceSection(
    dnaId: string,
    section: DesignDnaSectionKey,
    remainingInsights: string[],
  ) {
    const kept = new Set(remainingInsights);
    const rows = this.db
      .select()
      .from(designDnaEvidence)
      .where(
        and(
          eq(designDnaEvidence.dnaId, dnaId),
          eq(designDnaEvidence.section, section),
        ),
      )
      .all();

    for (const row of rows) {
      if (kept.has(row.insight)) continue;
      this.db
        .delete(designDnaEvidence)
        .where(eq(designDnaEvidence.id, row.id))
        .run();
    }
  }

  private loadEvidence(dnaId: string): DesignDnaEvidenceGroup[] {
    const rows = this.db
      .select()
      .from(designDnaEvidence)
      .where(eq(designDnaEvidence.dnaId, dnaId))
      .all();

    const groups = new Map<string, DesignDnaEvidenceGroup>();
    const referenceCache = new Map<string, ReferenceRecord | null>();

    for (const row of rows) {
      const key = `${row.section}::${row.insight}`;
      let group = groups.get(key);
      if (!group) {
        group = {
          section: row.section as DesignDnaSectionKey,
          insight: row.insight,
          references: [],
        };
        groups.set(key, group);
      }

      if (!referenceCache.has(row.referenceId)) {
        referenceCache.set(
          row.referenceId,
          this.references.findById(row.referenceId),
        );
      }
      const reference = referenceCache.get(row.referenceId);
      if (reference) group.references.push(reference);
    }

    return [...groups.values()].filter((group) => group.references.length > 0);
  }

  private countEvidence(dnaId: string): number {
    return Number(
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(designDnaEvidence)
        .where(eq(designDnaEvidence.dnaId, dnaId))
        .get()?.count ?? 0,
    );
  }

  private toSummary(row: typeof designDna.$inferSelect): DesignDnaSummary {
    return {
      id: row.id,
      projectId: row.projectId,
      version: row.version,
      status: row.status as DesignDnaStatus,
      referenceCount: row.referenceCount,
      sourceCollectionIds: parseJsonStringArray(row.sourceCollectionIds),
      evidenceCount: this.countEvidence(row.id),
      generatedAt: row.generatedAt,
      updatedAt: row.updatedAt,
    };
  }
}
