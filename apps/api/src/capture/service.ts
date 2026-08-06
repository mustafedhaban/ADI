import { heroCrop, optimize, thumbnail } from "./images.js";
import { removeVersion, writeAsset } from "./storage.js";
import {
  CaptureFailedError,
  CaptureUnavailableError,
  type AssetKind,
  type AssetRecord,
  type CaptureDriver,
  type CaptureOutcome,
  type RawShot,
} from "./types.js";
import type { AssetRepository } from "../repositories/asset-repository.js";
import type { ReferenceRepository } from "../repositories/reference-repository.js";
import { assertSafeFetchUrl } from "../domain/url-safety.js";
import { normalizeUrl } from "../domain/validation.js";

/* ---------------------------------------------------------------------------
   Capture service.

   Owns the whole pipeline for one reference:

     validate URL -> drive browser -> derive -> optimize -> store -> persist

   Retries with backoff, and rolls back on failure so a half-written version is
   never left behind. The UI never touches the driver; it calls this.
--------------------------------------------------------------------------- */

export interface CaptureServiceOptions {
  maxAttempts?: number;
  timeoutMs?: number;
}

export class CaptureService {
  constructor(
    private readonly driver: CaptureDriver,
    private readonly assets: AssetRepository,
    private readonly referencesRepo: ReferenceRepository,
    private readonly options: CaptureServiceOptions = {},
  ) {}

  getStatus() {
    return { driver: this.driver.name, available: this.driver.available };
  }

  /**
   * Capture one reference. `force` recaptures even when already completed;
   * without it, an already-captured reference is skipped.
   */
  async captureReference(
    referenceId: string,
    opts: { force?: boolean } = {},
  ): Promise<CaptureOutcome> {
    const reference = this.referencesRepo.findById(referenceId);
    if (!reference) {
      throw new CaptureFailedError(`Reference ${referenceId} not found`);
    }

    const existing = this.assets.listCurrent(referenceId);
    if (!opts.force && existing.length) {
      return {
        referenceId,
        status: "completed",
        assets: existing,
        error: null,
        version: existing[0]!.version,
      };
    }

    if (!this.driver.available) {
      this.assets.setStatus(referenceId, "failed", {
        error: "Capture driver unavailable",
      });
      throw new CaptureUnavailableError();
    }

    const normalized = normalizeUrl(reference.url);
    if (!normalized) {
      const error = "Reference URL is not a valid http(s) URL";
      this.assets.setStatus(referenceId, "failed", { error });
      return { referenceId, status: "failed", assets: [], error, version: 0 };
    }

    try {
      // Same SSRF guard the URL-resolve path uses.
      await assertSafeFetchUrl(normalized);
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unsafe URL";
      this.assets.setStatus(referenceId, "failed", { error });
      return { referenceId, status: "failed", assets: [], error, version: 0 };
    }

    this.assets.setStatus(referenceId, "processing", {
      incrementAttempts: true,
    });

    const version = this.assets.nextVersion(referenceId);
    const maxAttempts = this.options.maxAttempts ?? 2;
    let lastError = "Capture failed";

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const result = await this.driver.capture(normalized, {
          timeoutMs: this.options.timeoutMs,
        });
        const stored = await this.persist(referenceId, version, result.shots);
        this.assets.setStatus(referenceId, "completed", { error: null });
        return {
          referenceId,
          status: "completed",
          assets: stored,
          error: null,
          version,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        // Roll back partial writes before retrying so versions stay coherent.
        this.assets.deleteVersion(referenceId, version);
        removeVersion(referenceId, version);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 800 * attempt));
        }
      }
    }

    this.assets.setStatus(referenceId, "failed", { error: lastError });
    return {
      referenceId,
      status: "failed",
      assets: [],
      error: lastError,
      version: 0,
    };
  }

  /** Derive, optimize, store and record every asset for one capture. */
  private async persist(
    referenceId: string,
    version: number,
    shots: RawShot[],
  ): Promise<AssetRecord[]> {
    const records: AssetRecord[] = [];
    const desktopShot = shots.find((s) => s.kind === "desktop");

    const write = async (
      kind: AssetKind,
      buffer: Buffer,
      source?: RawShot,
    ) => {
      const processed =
        kind === "hero"
          ? await heroCrop(buffer)
          : kind === "thumbnail"
            ? await thumbnail(buffer)
            : await optimize(buffer, kind);

      const stored = writeAsset(
        referenceId,
        version,
        kind,
        processed.format,
        processed.buffer,
      );

      records.push(
        this.assets.create({
          referenceId,
          kind,
          path: stored.path,
          format: processed.format,
          width: processed.width,
          height: processed.height,
          fileSize: stored.fileSize,
          checksum: stored.checksum,
          viewportWidth: source?.viewportWidth ?? null,
          viewportHeight: source?.viewportHeight ?? null,
          deviceScaleFactor: source?.deviceScaleFactor ?? null,
          version,
        }),
      );
    };

    for (const shot of shots) {
      await write(shot.kind, shot.buffer, shot);
    }

    // Derivatives come from the desktop shot, which is the identity view.
    if (desktopShot) {
      await write("hero", desktopShot.buffer, desktopShot);
      await write("thumbnail", desktopShot.buffer, desktopShot);
    }

    return records;
  }

  async dispose(): Promise<void> {
    await this.driver.dispose();
  }
}
