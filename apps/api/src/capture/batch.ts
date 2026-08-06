import type { AssetRepository, CaptureRunRecord } from "../repositories/asset-repository.js";
import type { CaptureService } from "./service.js";

/* ---------------------------------------------------------------------------
   Batch capture.

   Runs in-process, one reference at a time (a headless Chromium per page is
   memory-hungry; concurrency here buys little and destabilises long runs).

   Progress is persisted to `capture_runs` after every item, so a run that is
   interrupted by a restart can be resumed: on boot, any run still marked
   `running` is reconciled, and re-running simply skips references that already
   have assets.
--------------------------------------------------------------------------- */

export interface BatchOptions {
  /** Explicit ids; when omitted, everything still needing capture is used. */
  referenceIds?: string[];
  /** Recapture even when assets already exist. */
  force?: boolean;
  /** Also retry references whose last attempt failed. */
  includeFailed?: boolean;
  limit?: number;
}

export class BatchCaptureProcessor {
  private activeRunId: string | null = null;
  private cancelled = false;

  constructor(
    private readonly service: CaptureService,
    private readonly assets: AssetRepository,
  ) {}

  get isRunning(): boolean {
    return this.activeRunId !== null;
  }

  get currentRunId(): string | null {
    return this.activeRunId;
  }

  /**
   * Mark runs orphaned by a restart as failed so the UI never shows a run that
   * cannot progress. Called once at boot.
   */
  reconcileInterruptedRuns(): number {
    const stale = this.assets.listInterruptedRuns();
    for (const run of stale) {
      this.assets.updateRun(run.id, {
        status: "failed",
        message: "Interrupted by a restart — resume by starting a new run.",
        finishedAt: new Date().toISOString(),
      });
    }
    return stale.length;
  }

  cancel(): void {
    this.cancelled = true;
  }

  /** Queue a run and process it. Resolves when the run finishes. */
  async run(options: BatchOptions = {}): Promise<CaptureRunRecord> {
    if (this.activeRunId) {
      throw Object.assign(new Error("A capture run is already in progress"), {
        statusCode: 409,
      });
    }

    const ids =
      options.referenceIds?.length
        ? options.referenceIds
        : this.assets.listNeedingCapture(
            options.limit ?? 500,
            options.includeFailed ?? true,
          );

    const run = this.assets.createRun(ids.length);
    this.activeRunId = run.id;
    this.cancelled = false;

    this.assets.updateRun(run.id, {
      status: "running",
      startedAt: new Date().toISOString(),
    });

    // Queue everything up front so the UI can show real state immediately.
    for (const id of ids) {
      if (!options.force) {
        const existing = this.assets.listCurrent(id);
        if (existing.length) continue;
      }
      this.assets.setStatus(id, "queued");
    }

    let completed = 0;
    let failed = 0;
    let skipped = 0;

    try {
      for (const id of ids) {
        if (this.cancelled) break;

        if (!options.force && this.assets.listCurrent(id).length) {
          skipped += 1;
          this.assets.updateRun(run.id, { completed, failed, skipped });
          continue;
        }

        try {
          const outcome = await this.service.captureReference(id, {
            force: options.force,
          });
          if (outcome.status === "completed") completed += 1;
          else failed += 1;
        } catch {
          failed += 1;
          this.assets.setStatus(id, "failed", {
            error: "Capture threw during batch run",
          });
        }

        this.assets.updateRun(run.id, { completed, failed, skipped });
      }

      this.assets.updateRun(run.id, {
        status: this.cancelled ? "cancelled" : "completed",
        completed,
        failed,
        skipped,
        finishedAt: new Date().toISOString(),
        message: this.cancelled
          ? "Cancelled by request"
          : `${completed} captured, ${failed} failed, ${skipped} skipped`,
      });
    } catch (err) {
      this.assets.updateRun(run.id, {
        status: "failed",
        completed,
        failed,
        skipped,
        finishedAt: new Date().toISOString(),
        message: err instanceof Error ? err.message : "Batch run failed",
      });
    } finally {
      this.activeRunId = null;
    }

    return this.assets.findRun(run.id)!;
  }

  /** Re-queue everything that previously failed. */
  async retryFailed(): Promise<CaptureRunRecord> {
    const ids = this.assets
      .listNeedingCapture(500, true)
      .filter((id) => !this.assets.listCurrent(id).length);
    return this.run({ referenceIds: ids, includeFailed: true });
  }
}
