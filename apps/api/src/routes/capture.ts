import fs from "node:fs";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import type { AssetRepository } from "../repositories/asset-repository.js";
import type { ReferenceRepository } from "../repositories/reference-repository.js";
import type { CaptureService } from "../capture/service.js";
import type { BatchCaptureProcessor } from "../capture/batch.js";
import {
  ASSETS_URL_PREFIX,
  assetsRoot,
  storageSize,
} from "../capture/storage.js";
import {
  ASSET_KINDS,
  CaptureUnavailableError,
  type AssetKind,
} from "../capture/types.js";

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".avif": "image/avif",
};

function parseIds(body: unknown): string[] {
  if (!body || typeof body !== "object") return [];
  const raw = (body as Record<string, unknown>).referenceIds;
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .filter((v): v is string => typeof v === "string" && Boolean(v.trim()))
        .map((v) => v.trim()),
    ),
  ];
}

export async function captureRoutes(
  app: FastifyInstance,
  deps: {
    service: CaptureService;
    batch: BatchCaptureProcessor;
    assets: AssetRepository;
    referencesRepo: ReferenceRepository;
  },
) {
  const { service, batch, assets, referencesRepo } = deps;

  /* --- static asset serving ------------------------------------------------
     Assets are stored locally and served from the API, never hotlinked.
     The path is resolved and confined to the assets root. */
  app.get(`${ASSETS_URL_PREFIX}/*`, async (request, reply) => {
    const rel = (request.params as { "*": string })["*"] ?? "";
    const resolved = path.resolve(assetsRoot(), rel);
    if (!resolved.startsWith(path.resolve(assetsRoot()))) {
      return reply.status(400).send({ error: "Invalid asset path" });
    }
    let stat: fs.Stats;
    try {
      stat = fs.statSync(resolved);
    } catch {
      return reply.status(404).send({ error: "Asset not found" });
    }
    if (!stat.isFile()) {
      return reply.status(404).send({ error: "Asset not found" });
    }
    return reply
      .type(MIME[path.extname(resolved).toLowerCase()] ?? "application/octet-stream")
      // Assets are immutable per version, so they can be cached hard.
      .header("Cache-Control", "public, max-age=31536000, immutable")
      .send(fs.createReadStream(resolved));
  });

  app.get("/api/capture/status", async () => ({
    ...service.getStatus(),
    running: batch.isRunning,
    currentRunId: batch.currentRunId,
    stats: assets.captureStats(),
    storage: storageSize(),
  }));

  app.get("/api/capture/stats", async () => {
    const stats = assets.captureStats();
    return { ...stats, storage: storageSize() };
  });

  /* --- single reference ---------------------------------------------------- */

  app.get("/api/references/:id/assets", async (request, reply) => {
    const { id } = request.params as { id: string };
    const reference = referencesRepo.findById(id);
    if (!reference) {
      return reply.status(404).send({ error: "Reference not found" });
    }
    const query = request.query as { all?: string; kind?: string };
    const all = query.all === "true";
    let items = all ? assets.listForReference(id) : assets.listCurrent(id);
    if (query.kind && ASSET_KINDS.includes(query.kind as AssetKind)) {
      items = items.filter((a) => a.kind === query.kind);
    }
    return {
      referenceId: id,
      captureStatus: reference.captureStatus,
      captureError: reference.captureError,
      capturedAt: reference.capturedAt,
      captureAttempts: reference.captureAttempts,
      items,
      total: items.length,
    };
  });

  /** Capture (or recapture with `force`) one reference. */
  app.post("/api/references/:id/capture", async (request, reply) => {
    const { id } = request.params as { id: string };
    const reference = referencesRepo.findById(id);
    if (!reference) {
      return reply.status(404).send({ error: "Reference not found" });
    }

    const body = (request.body ?? {}) as { force?: boolean };
    try {
      const outcome = await service.captureReference(id, {
        force: Boolean(body.force),
      });
      if (outcome.status === "failed") {
        return reply.status(502).send({
          ...outcome,
          error: outcome.error ?? "Capture failed",
        });
      }
      return outcome;
    } catch (err) {
      if (err instanceof CaptureUnavailableError) {
        return reply
          .status(503)
          .send({ error: err.message, code: err.code, ...service.getStatus() });
      }
      request.log.error(err);
      return reply.status(502).send({
        error: err instanceof Error ? err.message : "Capture failed",
      });
    }
  });

  /* --- batch --------------------------------------------------------------- */

  /**
   * Start a batch run. Returns immediately with the run id; poll
   * GET /api/capture/runs/:id for progress.
   */
  app.post("/api/capture/batch", async (request, reply) => {
    const body = (request.body ?? {}) as {
      force?: boolean;
      includeFailed?: boolean;
      limit?: number;
    };
    const referenceIds = parseIds(request.body);

    if (batch.isRunning) {
      return reply.status(409).send({
        error: "A capture run is already in progress",
        currentRunId: batch.currentRunId,
      });
    }
    if (!service.getStatus().available) {
      return reply
        .status(503)
        .send({ error: new CaptureUnavailableError().message });
    }

    // Fire and forget — progress lives in the capture_runs table.
    const promise = batch.run({
      referenceIds: referenceIds.length ? referenceIds : undefined,
      force: Boolean(body.force),
      includeFailed: body.includeFailed ?? true,
      limit: typeof body.limit === "number" ? body.limit : undefined,
    });
    promise.catch((err) => app.log.error(err));

    // Give the run a tick to register so the client gets a real id.
    await new Promise((r) => setTimeout(r, 60));

    return reply.status(202).send({
      accepted: true,
      runId: batch.currentRunId,
      queued: referenceIds.length || null,
    });
  });

  app.post("/api/capture/retry-failed", async (request, reply) => {
    if (batch.isRunning) {
      return reply.status(409).send({
        error: "A capture run is already in progress",
        currentRunId: batch.currentRunId,
      });
    }
    const promise = batch.retryFailed();
    promise.catch((err) => app.log.error(err));
    await new Promise((r) => setTimeout(r, 60));
    return reply.status(202).send({ accepted: true, runId: batch.currentRunId });
  });

  app.post("/api/capture/cancel", async () => {
    batch.cancel();
    return { cancelled: true, runId: batch.currentRunId };
  });

  app.get("/api/capture/runs", async () => {
    const items = assets.listRuns(20);
    return { items, total: items.length };
  });

  app.get("/api/capture/runs/:runId", async (request, reply) => {
    const { runId } = request.params as { runId: string };
    const run = assets.findRun(runId);
    if (!run) return reply.status(404).send({ error: "Capture run not found" });
    return run;
  });
}
