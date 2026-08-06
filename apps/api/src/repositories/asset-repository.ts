import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "../db/index.js";
import { captureRuns, referenceAssets, references } from "../db/schema.js";
import { assetUrl } from "../capture/storage.js";
import type {
  AssetKind,
  AssetRecord,
  CaptureStatus,
  RunStatus,
} from "../capture/types.js";

export interface CreateAssetInput {
  referenceId: string;
  kind: AssetKind;
  path: string;
  format: string;
  width: number;
  height: number;
  fileSize: number;
  checksum: string;
  viewportWidth?: number | null;
  viewportHeight?: number | null;
  deviceScaleFactor?: number | null;
  version: number;
}

export interface CaptureRunRecord {
  id: string;
  status: RunStatus;
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  message: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

function toAsset(row: typeof referenceAssets.$inferSelect): AssetRecord {
  return {
    id: row.id,
    referenceId: row.referenceId,
    kind: row.kind as AssetKind,
    path: row.path,
    url: assetUrl(row.path),
    format: row.format,
    width: row.width,
    height: row.height,
    fileSize: row.fileSize,
    checksum: row.checksum,
    viewportWidth: row.viewportWidth,
    viewportHeight: row.viewportHeight,
    deviceScaleFactor: row.deviceScaleFactor,
    version: row.version,
    capturedAt: row.capturedAt,
    createdAt: row.createdAt,
  };
}

export class AssetRepository {
  constructor(private readonly db: Db) {}

  /** Next version number for a reference — recaptures never overwrite history. */
  nextVersion(referenceId: string): number {
    const row = this.db
      .select({ v: sql<number>`coalesce(max(${referenceAssets.version}), 0)` })
      .from(referenceAssets)
      .where(eq(referenceAssets.referenceId, referenceId))
      .get();
    return Number(row?.v ?? 0) + 1;
  }

  create(input: CreateAssetInput): AssetRecord {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db
      .insert(referenceAssets)
      .values({
        id,
        referenceId: input.referenceId,
        kind: input.kind,
        path: input.path,
        format: input.format,
        width: input.width,
        height: input.height,
        fileSize: input.fileSize,
        checksum: input.checksum,
        viewportWidth: input.viewportWidth ?? null,
        viewportHeight: input.viewportHeight ?? null,
        deviceScaleFactor: input.deviceScaleFactor ?? null,
        version: input.version,
        capturedAt: now,
        createdAt: now,
      })
      .run();
    return this.findById(id)!;
  }

  findById(id: string): AssetRecord | null {
    const row = this.db
      .select()
      .from(referenceAssets)
      .where(eq(referenceAssets.id, id))
      .get();
    return row ? toAsset(row) : null;
  }

  /** All assets for a reference, newest version first. */
  listForReference(referenceId: string): AssetRecord[] {
    return this.db
      .select()
      .from(referenceAssets)
      .where(eq(referenceAssets.referenceId, referenceId))
      .orderBy(desc(referenceAssets.version))
      .all()
      .map(toAsset);
  }

  /** Only the assets belonging to the newest captured version. */
  listCurrent(referenceId: string): AssetRecord[] {
    const all = this.listForReference(referenceId);
    if (!all.length) return [];
    const latest = Math.max(...all.map((a) => a.version));
    return all.filter((a) => a.version === latest);
  }

  findCurrentByKind(referenceId: string, kind: AssetKind): AssetRecord | null {
    return this.listCurrent(referenceId).find((a) => a.kind === kind) ?? null;
  }

  /** Thumbnails for many references in one query — used by the library grid. */
  thumbnailMap(kind: AssetKind = "thumbnail"): Map<string, AssetRecord> {
    const rows = this.db
      .select()
      .from(referenceAssets)
      .where(eq(referenceAssets.kind, kind))
      .orderBy(desc(referenceAssets.version))
      .all();
    const map = new Map<string, AssetRecord>();
    for (const row of rows) {
      // rows are version-desc, so the first per reference is current
      if (!map.has(row.referenceId)) map.set(row.referenceId, toAsset(row));
    }
    return map;
  }

  deleteVersion(referenceId: string, version: number): number {
    const rows = this.db
      .select()
      .from(referenceAssets)
      .where(
        and(
          eq(referenceAssets.referenceId, referenceId),
          eq(referenceAssets.version, version),
        ),
      )
      .all();
    this.db
      .delete(referenceAssets)
      .where(
        and(
          eq(referenceAssets.referenceId, referenceId),
          eq(referenceAssets.version, version),
        ),
      )
      .run();
    return rows.length;
  }

  // --- capture state on the reference itself --------------------------------

  setStatus(
    referenceId: string,
    status: CaptureStatus,
    options: { error?: string | null; incrementAttempts?: boolean } = {},
  ): void {
    const current = this.db
      .select({ attempts: references.captureAttempts })
      .from(references)
      .where(eq(references.id, referenceId))
      .get();

    this.db
      .update(references)
      .set({
        captureStatus: status,
        captureError: options.error ?? null,
        capturedAt:
          status === "completed" ? new Date().toISOString() : undefined,
        captureAttempts: options.incrementAttempts
          ? Number(current?.attempts ?? 0) + 1
          : undefined,
      })
      .where(eq(references.id, referenceId))
      .run();
  }

  /** References that still need a capture, oldest first. */
  listNeedingCapture(limit = 500, includeFailed = true): string[] {
    const rows = this.db
      .select({ id: references.id, status: references.captureStatus })
      .from(references)
      .all();
    return rows
      .filter((r) =>
        includeFailed
          ? r.status !== "completed"
          : r.status === "pending" || r.status === "queued",
      )
      .map((r) => r.id)
      .slice(0, limit);
  }

  captureStats() {
    const rows = this.db
      .select({
        status: references.captureStatus,
        count: sql<number>`count(*)`,
      })
      .from(references)
      .groupBy(references.captureStatus)
      .all();

    const byStatus: Record<string, number> = {
      pending: 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };
    for (const row of rows) byStatus[row.status] = Number(row.count);

    const assetAgg = this.db
      .select({
        count: sql<number>`count(*)`,
        bytes: sql<number>`coalesce(sum(${referenceAssets.fileSize}), 0)`,
      })
      .from(referenceAssets)
      .get();

    const withAssets = this.db
      .select({
        count: sql<number>`count(distinct ${referenceAssets.referenceId})`,
      })
      .from(referenceAssets)
      .get();

    return {
      byStatus,
      totalReferences: Object.values(byStatus).reduce((a, b) => a + b, 0),
      referencesWithAssets: Number(withAssets?.count ?? 0),
      assetCount: Number(assetAgg?.count ?? 0),
      assetBytes: Number(assetAgg?.bytes ?? 0),
    };
  }

  // --- capture runs ---------------------------------------------------------

  createRun(total: number): CaptureRunRecord {
    const id = randomUUID();
    this.db
      .insert(captureRuns)
      .values({
        id,
        status: "pending",
        total,
        createdAt: new Date().toISOString(),
      })
      .run();
    return this.findRun(id)!;
  }

  findRun(id: string): CaptureRunRecord | null {
    const row = this.db
      .select()
      .from(captureRuns)
      .where(eq(captureRuns.id, id))
      .get();
    return row ? (row as CaptureRunRecord) : null;
  }

  listRuns(limit = 20): CaptureRunRecord[] {
    return this.db
      .select()
      .from(captureRuns)
      .orderBy(desc(captureRuns.createdAt))
      .limit(limit)
      .all() as CaptureRunRecord[];
  }

  updateRun(id: string, patch: Partial<CaptureRunRecord>): void {
    this.db.update(captureRuns).set(patch).where(eq(captureRuns.id, id)).run();
  }

  /** Runs left mid-flight by a restart — used to resume. */
  listInterruptedRuns(): CaptureRunRecord[] {
    return this.db
      .select()
      .from(captureRuns)
      .where(eq(captureRuns.status, "running"))
      .all() as CaptureRunRecord[];
  }
}
