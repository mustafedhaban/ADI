import { desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "../db/index.js";
import { researchCandidates, researchRuns } from "../db/schema.js";
import type {
  CandidateStatus,
  ResearchLimit,
  ResearchRunStatus,
  ResearchSourceOption,
} from "../domain/research.js";
import type { CandidateAnalysis } from "./types.js";

function parseJsonArray(raw: string | null | undefined): string[] {
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

function serializeArray(values: string[] | undefined): string {
  return JSON.stringify(values ?? []);
}

export interface ResearchCandidateRecord {
  id: string;
  researchId: string;
  title: string;
  url: string;
  source: string;
  description: string | null;
  image: string | null;
  relevanceScore: number | null;
  relevanceReason: string | null;
  matchedCriteria: string[];
  suggestedStyles: string[];
  suggestedPatterns: string[];
  suggestedTags: string[];
  status: CandidateStatus;
  referenceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchRunRecord {
  id: string;
  projectId: string;
  focus: string | null;
  status: ResearchRunStatus;
  sources: ResearchSourceOption[];
  resultLimit: number;
  query: string | null;
  message: string | null;
  createdAt: string;
  completedAt: string | null;
  candidateCount: number;
}

export interface ResearchRunDetail extends ResearchRunRecord {
  candidates: ResearchCandidateRecord[];
}

export interface CreateCandidateInput {
  title: string;
  url: string;
  source: string;
  description: string | null;
  image: string | null;
  analysis: CandidateAnalysis;
}

export class ResearchRepository {
  constructor(private readonly db: Db) {}

  createRun(input: {
    projectId: string;
    focus: string | null;
    sources: ResearchSourceOption[];
    limit: ResearchLimit;
  }): ResearchRunRecord {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db
      .insert(researchRuns)
      .values({
        id,
        projectId: input.projectId,
        focus: input.focus,
        status: "pending",
        sources: serializeArray(input.sources),
        resultLimit: input.limit,
        query: null,
        message: null,
        createdAt: now,
        completedAt: null,
      })
      .run();
    return this.findRunById(id)!;
  }

  markRunning(id: string, query: string) {
    this.db
      .update(researchRuns)
      .set({ status: "running", query })
      .where(eq(researchRuns.id, id))
      .run();
  }

  markCompleted(id: string, message: string | null = null) {
    this.db
      .update(researchRuns)
      .set({
        status: "completed",
        message,
        completedAt: new Date().toISOString(),
      })
      .where(eq(researchRuns.id, id))
      .run();
  }

  markFailed(id: string, message: string) {
    this.db
      .update(researchRuns)
      .set({
        status: "failed",
        message,
        completedAt: new Date().toISOString(),
      })
      .where(eq(researchRuns.id, id))
      .run();
  }

  addCandidates(researchId: string, items: CreateCandidateInput[]): ResearchCandidateRecord[] {
    const now = new Date().toISOString();
    const created: ResearchCandidateRecord[] = [];

    for (const item of items) {
      const existing = this.db
        .select()
        .from(researchCandidates)
        .where(eq(researchCandidates.researchId, researchId))
        .all()
        .find((row) => row.url === item.url);
      if (existing) continue;

      const id = randomUUID();
      this.db
        .insert(researchCandidates)
        .values({
          id,
          researchId,
          title: item.title,
          url: item.url,
          source: item.source,
          description: item.description,
          image: item.image,
          relevanceScore: item.analysis.relevanceScore,
          relevanceReason: item.analysis.relevanceReason,
          matchedCriteria: serializeArray(item.analysis.matchedCriteria),
          suggestedStyles: serializeArray(item.analysis.suggestedStyles),
          suggestedPatterns: serializeArray(item.analysis.suggestedPatterns),
          suggestedTags: serializeArray(item.analysis.suggestedTags),
          status: "candidate",
          referenceId: null,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      created.push(this.findCandidateById(id)!);
    }

    return created;
  }

  listForProject(projectId: string): ResearchRunRecord[] {
    const rows = this.db
      .select()
      .from(researchRuns)
      .where(eq(researchRuns.projectId, projectId))
      .orderBy(desc(researchRuns.createdAt))
      .all();
    return rows.map((row) => this.toRun(row));
  }

  findRunById(id: string): ResearchRunRecord | null {
    const row = this.db
      .select()
      .from(researchRuns)
      .where(eq(researchRuns.id, id))
      .get();
    return row ? this.toRun(row) : null;
  }

  findRunDetail(id: string): ResearchRunDetail | null {
    const run = this.findRunById(id);
    if (!run) return null;
    const candidates = this.db
      .select()
      .from(researchCandidates)
      .where(eq(researchCandidates.researchId, id))
      .orderBy(desc(researchCandidates.relevanceScore))
      .all()
      .map((row) => this.toCandidate(row));
    return { ...run, candidates, candidateCount: candidates.length };
  }

  findCandidateById(id: string): ResearchCandidateRecord | null {
    const row = this.db
      .select()
      .from(researchCandidates)
      .where(eq(researchCandidates.id, id))
      .get();
    return row ? this.toCandidate(row) : null;
  }

  listCandidatesByIds(
    researchId: string,
    ids: string[],
  ): ResearchCandidateRecord[] {
    if (!ids.length) return [];
    return this.db
      .select()
      .from(researchCandidates)
      .where(inArray(researchCandidates.id, ids))
      .all()
      .filter((row) => row.researchId === researchId)
      .map((row) => this.toCandidate(row));
  }

  setCandidateStatus(
    id: string,
    status: CandidateStatus,
  ): ResearchCandidateRecord | null {
    const existing = this.findCandidateById(id);
    if (!existing) return null;
    this.db
      .update(researchCandidates)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(researchCandidates.id, id))
      .run();
    return this.findCandidateById(id);
  }

  linkReference(
    candidateId: string,
    referenceId: string,
  ): ResearchCandidateRecord | null {
    this.db
      .update(researchCandidates)
      .set({
        status: "accepted",
        referenceId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(researchCandidates.id, candidateId))
      .run();
    return this.findCandidateById(candidateId);
  }

  private toRun(row: typeof researchRuns.$inferSelect): ResearchRunRecord {
    const candidates = this.db
      .select()
      .from(researchCandidates)
      .where(eq(researchCandidates.researchId, row.id))
      .all();
    return {
      id: row.id,
      projectId: row.projectId,
      focus: row.focus,
      status: row.status as ResearchRunStatus,
      sources: parseJsonArray(row.sources) as ResearchSourceOption[],
      resultLimit: row.resultLimit,
      query: row.query,
      message: row.message,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
      candidateCount: candidates.length,
    };
  }

  private toCandidate(
    row: typeof researchCandidates.$inferSelect,
  ): ResearchCandidateRecord {
    return {
      id: row.id,
      researchId: row.researchId,
      title: row.title,
      url: row.url,
      source: row.source,
      description: row.description,
      image: row.image,
      relevanceScore: row.relevanceScore,
      relevanceReason: row.relevanceReason,
      matchedCriteria: parseJsonArray(row.matchedCriteria),
      suggestedStyles: parseJsonArray(row.suggestedStyles),
      suggestedPatterns: parseJsonArray(row.suggestedPatterns),
      suggestedTags: parseJsonArray(row.suggestedTags),
      status: row.status as CandidateStatus,
      referenceId: row.referenceId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
