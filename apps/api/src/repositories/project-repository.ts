import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "../db/index.js";
import {
  collectionReferences,
  projectCollections,
  projects,
} from "../db/schema.js";
import {
  emptyResearchBriefArrays,
  type ProjectInput,
  type ProjectStatus,
} from "../domain/project.js";
import type { CollectionSummary } from "../domain/collection.js";
import type { ReferenceRecord } from "../domain/validation.js";
import { CollectionRepository } from "./collection-repository.js";
import { ReferenceRepository } from "./reference-repository.js";

function parseJsonStringArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function serializeStringArray(values: string[] | undefined): string {
  return JSON.stringify(values ?? []);
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  clientName: string | null;
  industry: string | null;
  audience: string | null;
  location: string | null;
  projectType: string | null;
  designGoals: string | null;
  audienceNeeds: string | null;
  businessGoals: string | null;
  projectGoals: string | null;
  desiredStyles: string[];
  avoidStyles: string[];
  keyMessages: string | null;
  contentTypes: string[];
  requiredFeatures: string[];
  preferredSources: string[];
  referenceKeywords: string[];
  competitors: string[];
  competitorNotes: string | null;
  constraints: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  collectionCount: number;
  referenceCount: number;
}

export interface ProjectDetail extends ProjectSummary {
  collections: CollectionSummary[];
  references: ReferenceRecord[];
}

export class ProjectRepository {
  private readonly collections: CollectionRepository;
  private readonly references: ReferenceRepository;

  constructor(private readonly db: Db) {
    this.collections = new CollectionRepository(db);
    this.references = new ReferenceRepository(db);
  }

  list(status?: ProjectStatus): ProjectSummary[] {
    const rows = status
      ? this.db
          .select()
          .from(projects)
          .where(eq(projects.status, status))
          .orderBy(desc(projects.updatedAt))
          .all()
      : this.db
          .select()
          .from(projects)
          .orderBy(desc(projects.updatedAt))
          .all();

    return rows.map((row) => this.toSummary(row));
  }

  findById(id: string): ProjectDetail | null {
    const row = this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .get();
    if (!row) return null;

    const memberships = this.db
      .select()
      .from(projectCollections)
      .where(eq(projectCollections.projectId, id))
      .orderBy(desc(projectCollections.createdAt))
      .all();

    const collectionSummaries = memberships
      .map((m) => this.collections.findById(m.collectionId))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        coverImage: c.coverImage,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        referenceCount: c.referenceCount,
        coverImages: c.coverImages,
      }));

    const aggregated = this.aggregateReferences(
      memberships.map((m) => m.collectionId),
    );

    return {
      ...this.toSummary(row, collectionSummaries.length, aggregated.length),
      collections: collectionSummaries,
      references: aggregated,
    };
  }

  listForCollection(collectionId: string): ProjectSummary[] {
    const memberships = this.db
      .select({ projectId: projectCollections.projectId })
      .from(projectCollections)
      .where(eq(projectCollections.collectionId, collectionId))
      .all();
    if (!memberships.length) return [];

    const rows = this.db
      .select()
      .from(projects)
      .where(
        inArray(
          projects.id,
          memberships.map((m) => m.projectId),
        ),
      )
      .orderBy(desc(projects.updatedAt))
      .all();

    return rows.map((row) => this.toSummary(row));
  }

  create(input: ProjectInput): ProjectDetail {
    const id = randomUUID();
    const now = new Date().toISOString();
    const empty = emptyResearchBriefArrays();
    this.db
      .insert(projects)
      .values({
        id,
        name: input.name!.trim(),
        description: input.description ?? null,
        clientName: input.clientName ?? null,
        industry: input.industry ?? null,
        audience: input.audience ?? null,
        location: input.location ?? null,
        projectType: input.projectType ?? null,
        designGoals: input.designGoals ?? null,
        audienceNeeds: input.audienceNeeds ?? null,
        businessGoals: input.businessGoals ?? null,
        projectGoals: input.projectGoals ?? null,
        desiredStyles: serializeStringArray(
          input.desiredStyles ?? empty.desiredStyles,
        ),
        avoidStyles: serializeStringArray(
          input.avoidStyles ?? empty.avoidStyles,
        ),
        keyMessages: input.keyMessages ?? null,
        contentTypes: serializeStringArray(
          input.contentTypes ?? empty.contentTypes,
        ),
        requiredFeatures: serializeStringArray(
          input.requiredFeatures ?? empty.requiredFeatures,
        ),
        preferredSources: serializeStringArray(
          input.preferredSources ?? empty.preferredSources,
        ),
        referenceKeywords: serializeStringArray(
          input.referenceKeywords ?? empty.referenceKeywords,
        ),
        competitors: serializeStringArray(
          input.competitors ?? empty.competitors,
        ),
        competitorNotes: input.competitorNotes ?? null,
        constraints: input.constraints ?? null,
        status: input.status ?? "active",
        createdAt: now,
        updatedAt: now,
      })
      .run();
    return this.findById(id)!;
  }

  update(id: string, input: ProjectInput): ProjectDetail | null {
    const existing = this.findById(id);
    if (!existing) return null;

    this.db
      .update(projects)
      .set({
        name: input.name !== undefined ? input.name.trim() : existing.name,
        description:
          input.description !== undefined
            ? input.description
            : existing.description,
        clientName:
          input.clientName !== undefined ? input.clientName : existing.clientName,
        industry:
          input.industry !== undefined ? input.industry : existing.industry,
        audience:
          input.audience !== undefined ? input.audience : existing.audience,
        location:
          input.location !== undefined ? input.location : existing.location,
        projectType:
          input.projectType !== undefined
            ? input.projectType
            : existing.projectType,
        designGoals:
          input.designGoals !== undefined
            ? input.designGoals
            : existing.designGoals,
        audienceNeeds:
          input.audienceNeeds !== undefined
            ? input.audienceNeeds
            : existing.audienceNeeds,
        businessGoals:
          input.businessGoals !== undefined
            ? input.businessGoals
            : existing.businessGoals,
        projectGoals:
          input.projectGoals !== undefined
            ? input.projectGoals
            : existing.projectGoals,
        desiredStyles: serializeStringArray(
          input.desiredStyles !== undefined
            ? input.desiredStyles
            : existing.desiredStyles,
        ),
        avoidStyles: serializeStringArray(
          input.avoidStyles !== undefined
            ? input.avoidStyles
            : existing.avoidStyles,
        ),
        keyMessages:
          input.keyMessages !== undefined
            ? input.keyMessages
            : existing.keyMessages,
        contentTypes: serializeStringArray(
          input.contentTypes !== undefined
            ? input.contentTypes
            : existing.contentTypes,
        ),
        requiredFeatures: serializeStringArray(
          input.requiredFeatures !== undefined
            ? input.requiredFeatures
            : existing.requiredFeatures,
        ),
        preferredSources: serializeStringArray(
          input.preferredSources !== undefined
            ? input.preferredSources
            : existing.preferredSources,
        ),
        referenceKeywords: serializeStringArray(
          input.referenceKeywords !== undefined
            ? input.referenceKeywords
            : existing.referenceKeywords,
        ),
        competitors: serializeStringArray(
          input.competitors !== undefined
            ? input.competitors
            : existing.competitors,
        ),
        competitorNotes:
          input.competitorNotes !== undefined
            ? input.competitorNotes
            : existing.competitorNotes,
        constraints:
          input.constraints !== undefined
            ? input.constraints
            : existing.constraints,
        status: input.status !== undefined ? input.status : existing.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(projects.id, id))
      .run();

    return this.findById(id);
  }

  delete(id: string): boolean {
    const existing = this.findById(id);
    if (!existing) return false;
    this.db
      .delete(projectCollections)
      .where(eq(projectCollections.projectId, id))
      .run();
    this.db.delete(projects).where(eq(projects.id, id)).run();
    return true;
  }

  addCollections(
    projectId: string,
    collectionIds: string[],
  ): {
    added: string[];
    skippedDuplicates: string[];
    missing: string[];
  } {
    const project = this.findById(projectId);
    if (!project) {
      throw Object.assign(new Error("Project not found"), { statusCode: 404 });
    }

    const added: string[] = [];
    const skippedDuplicates: string[] = [];
    const missing: string[] = [];
    const now = new Date().toISOString();

    for (const collectionId of collectionIds) {
      const collection = this.collections.findById(collectionId);
      if (!collection) {
        missing.push(collectionId);
        continue;
      }

      const existing = this.db
        .select()
        .from(projectCollections)
        .where(
          and(
            eq(projectCollections.projectId, projectId),
            eq(projectCollections.collectionId, collectionId),
          ),
        )
        .get();

      if (existing) {
        skippedDuplicates.push(collectionId);
        continue;
      }

      this.db
        .insert(projectCollections)
        .values({ projectId, collectionId, createdAt: now })
        .run();
      added.push(collectionId);
    }

    if (added.length) this.touch(projectId);
    return { added, skippedDuplicates, missing };
  }

  removeCollection(projectId: string, collectionId: string): boolean {
    const existing = this.db
      .select()
      .from(projectCollections)
      .where(
        and(
          eq(projectCollections.projectId, projectId),
          eq(projectCollections.collectionId, collectionId),
        ),
      )
      .get();
    if (!existing) return false;

    this.db
      .delete(projectCollections)
      .where(
        and(
          eq(projectCollections.projectId, projectId),
          eq(projectCollections.collectionId, collectionId),
        ),
      )
      .run();
    this.touch(projectId);
    return true;
  }

  private aggregateReferences(collectionIds: string[]): ReferenceRecord[] {
    if (!collectionIds.length) return [];

    const rows = this.db
      .select({
        referenceId: collectionReferences.referenceId,
      })
      .from(collectionReferences)
      .where(inArray(collectionReferences.collectionId, collectionIds))
      .all();

    const uniqueIds = [...new Set(rows.map((r) => r.referenceId))];
    return uniqueIds
      .map((id) => this.references.findById(id))
      .filter((r): r is ReferenceRecord => Boolean(r));
  }

  private touch(projectId: string) {
    this.db
      .update(projects)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(projects.id, projectId))
      .run();
  }

  private toSummary(
    row: typeof projects.$inferSelect,
    collectionCount?: number,
    referenceCount?: number,
  ): ProjectSummary {
    const cCount =
      collectionCount ??
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(projectCollections)
        .where(eq(projectCollections.projectId, row.id))
        .get()?.count ??
      0;

    let rCount = referenceCount;
    if (rCount === undefined) {
      const memberships = this.db
        .select({ collectionId: projectCollections.collectionId })
        .from(projectCollections)
        .where(eq(projectCollections.projectId, row.id))
        .all();
      rCount = this.aggregateReferences(
        memberships.map((m) => m.collectionId),
      ).length;
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      clientName: row.clientName,
      industry: row.industry,
      audience: row.audience,
      location: row.location,
      projectType: row.projectType,
      designGoals: row.designGoals,
      audienceNeeds: row.audienceNeeds ?? null,
      businessGoals: row.businessGoals ?? null,
      projectGoals: row.projectGoals ?? null,
      desiredStyles: parseJsonStringArray(row.desiredStyles),
      avoidStyles: parseJsonStringArray(row.avoidStyles),
      keyMessages: row.keyMessages ?? null,
      contentTypes: parseJsonStringArray(row.contentTypes),
      requiredFeatures: parseJsonStringArray(row.requiredFeatures),
      preferredSources: parseJsonStringArray(row.preferredSources),
      referenceKeywords: parseJsonStringArray(row.referenceKeywords),
      competitors: parseJsonStringArray(row.competitors),
      competitorNotes: row.competitorNotes ?? null,
      constraints: row.constraints ?? null,
      status: row.status as ProjectStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      collectionCount: Number(cCount),
      referenceCount: Number(rCount),
    };
  }
}
