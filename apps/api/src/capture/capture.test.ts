import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import sharp from "sharp";
import * as schema from "../db/schema.js";
import { ReferenceRepository } from "../repositories/reference-repository.js";
import { AssetRepository } from "../repositories/asset-repository.js";
import { CaptureService } from "./service.js";
import { BatchCaptureProcessor } from "./batch.js";
import { UnavailableCaptureDriver } from "./driver.js";
import { heroCrop, optimize, thumbnail } from "./images.js";
import {
  assetUrl,
  checksum,
  relativeAssetPath,
  shardFor,
  storageSize,
  writeAsset,
} from "./storage.js";
import {
  CaptureUnavailableError,
  type CaptureDriver,
  type DriverResult,
} from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../drizzle");

/** Deterministic PNG stand-in for a real screenshot. */
async function fakeShot(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 30, g: 60, b: 45 },
    },
  })
    .png()
    .toBuffer();
}

class FakeDriver implements CaptureDriver {
  readonly name = "fake";
  available = true;
  failTimes = 0;
  calls = 0;

  async capture(url: string): Promise<DriverResult> {
    this.calls += 1;
    if (this.failTimes > 0) {
      this.failTimes -= 1;
      throw new Error("simulated capture failure");
    }
    return {
      finalUrl: url,
      shots: [
        {
          kind: "desktop",
          buffer: await fakeShot(1440, 900),
          viewportWidth: 1440,
          viewportHeight: 900,
          deviceScaleFactor: 2,
        },
        {
          kind: "mobile",
          buffer: await fakeShot(390, 844),
          viewportWidth: 390,
          viewportHeight: 844,
          deviceScaleFactor: 3,
        },
        {
          kind: "fullpage",
          buffer: await fakeShot(1440, 4000),
          viewportWidth: 1440,
          viewportHeight: 900,
          deviceScaleFactor: 2,
        },
      ],
    };
  }

  async dispose(): Promise<void> {}
}

describe("capture storage", () => {
  it("shards deterministically by reference id", () => {
    assert.equal(shardFor("feb92ac3-93fb-4"), "fe");
    assert.equal(shardFor("feb92ac3-93fb-4"), shardFor("feb92ac3-93fb-4"));
    assert.equal(shardFor(""), "00");
  });

  it("builds a deterministic, versioned path", () => {
    const p = relativeAssetPath("abc123", 2, "thumbnail", "webp");
    assert.equal(p, "ab/abc123/v2/thumbnail.webp");
    assert.equal(assetUrl(p), "/assets/ab/abc123/v2/thumbnail.webp");
  });

  it("checksums content, not identity", () => {
    const a = Buffer.from("same bytes");
    const b = Buffer.from("same bytes");
    const c = Buffer.from("other bytes");
    assert.equal(checksum(a), checksum(b));
    assert.notEqual(checksum(a), checksum(c));
    assert.equal(checksum(a).length, 64);
  });

  it("refuses to write outside the assets root", () => {
    assert.throws(
      () => writeAsset("../../etc", 1, "desktop", "webp", Buffer.from("x")),
      /outside the assets root/,
    );
  });

  it("reports storage size", () => {
    const size = storageSize();
    assert.equal(typeof size.files, "number");
    assert.equal(typeof size.bytes, "number");
  });
});

describe("image optimization", () => {
  it("converts to webp and downscales to the target width", async () => {
    const png = await fakeShot(2880, 1800);
    const out = await optimize(png, "desktop");
    assert.equal(out.format, "webp");
    assert.equal(out.width, 1440);
    assert.ok(out.buffer.byteLength < png.byteLength, "webp should be smaller");
  });

  it("never upscales a small source", async () => {
    const png = await fakeShot(320, 200);
    const out = await optimize(png, "desktop");
    assert.equal(out.width, 320);
  });

  it("crops hero to 16:9 from the top", async () => {
    const png = await fakeShot(1440, 4000);
    const out = await heroCrop(png);
    assert.equal(out.width, 1200);
    assert.equal(out.height, Math.round((1200 * 9) / 16));
  });

  it("crops thumbnail to 4:3", async () => {
    const png = await fakeShot(1440, 4000);
    const out = await thumbnail(png);
    assert.equal(out.width, 480);
    assert.equal(out.height, Math.round((480 * 3) / 4));
  });

  it("caps absurdly tall full-page shots", async () => {
    const png = await fakeShot(1200, 20000);
    const out = await optimize(png, "fullpage");
    assert.ok(out.height <= 12000, `height was ${out.height}`);
  });
});

describe("capture service + batch", () => {
  let dbPath = "";
  let assetsRoot = "";
  let sqlite: Database.Database;
  let referencesRepo: ReferenceRepository;
  let assets: AssetRepository;
  let driver: FakeDriver;
  let service: CaptureService;
  let batch: BatchCaptureProcessor;
  let refId = "";

  before(() => {
    assetsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "adi-assets-"));
    process.env.ADI_ASSETS_ROOT = assetsRoot;
    dbPath = path.join(os.tmpdir(), `adi-capture-${Date.now()}.db`);
    sqlite = new Database(dbPath);
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder });

    referencesRepo = new ReferenceRepository(db);
    assets = new AssetRepository(db);
    driver = new FakeDriver();
    service = new CaptureService(driver, assets, referencesRepo, {
      maxAttempts: 2,
    });
    batch = new BatchCaptureProcessor(service, assets);
  });

  beforeEach(() => {
    driver.failTimes = 0;
    driver.calls = 0;
  });

  after(() => {
    sqlite.close();
    fs.rmSync(dbPath, { force: true });
    fs.rmSync(`${dbPath}-wal`, { force: true });
    fs.rmSync(`${dbPath}-shm`, { force: true });
    fs.rmSync(assetsRoot, { recursive: true, force: true });
    delete process.env.ADI_ASSETS_ROOT;
  });

  it("starts every reference as pending", () => {
    const created = referencesRepo.create({
      title: "Capture Target",
      source: "Other",
      url: "https://example.com/capture-target",
      type: "website",
      industries: [],
      pageTypes: [],
      styles: [],
      patterns: [],
      tags: [],
    });
    refId = created.id;
    assert.equal(created.captureStatus, "pending");
    assert.equal(created.thumbnailUrl, null);
  });

  it("captures a reference and derives all five asset kinds", async () => {
    const outcome = await service.captureReference(refId);
    assert.equal(outcome.status, "completed");
    assert.equal(outcome.version, 1);

    const kinds = outcome.assets.map((a) => a.kind).sort();
    assert.deepEqual(kinds, [
      "desktop",
      "fullpage",
      "hero",
      "mobile",
      "thumbnail",
    ]);

    for (const asset of outcome.assets) {
      assert.equal(asset.format, "webp");
      assert.ok(asset.fileSize > 0);
      assert.equal(asset.checksum.length, 64);
      assert.ok(asset.width > 0 && asset.height > 0);
      assert.ok(
        fs.existsSync(path.join(assetsRoot, asset.path)),
        `${asset.path} should exist on disk`,
      );
    }
  });

  it("records viewport metadata for viewport-derived assets", async () => {
    const desktop = assets.findCurrentByKind(refId, "desktop");
    assert.equal(desktop?.viewportWidth, 1440);
    assert.equal(desktop?.viewportHeight, 900);
    assert.equal(desktop?.deviceScaleFactor, 2);

    const mobile = assets.findCurrentByKind(refId, "mobile");
    assert.equal(mobile?.viewportWidth, 390);
    assert.equal(mobile?.deviceScaleFactor, 3);
  });

  it("marks the reference completed and exposes a thumbnail url", () => {
    const record = referencesRepo.findById(refId)!;
    assert.equal(record.captureStatus, "completed");
    assert.ok(record.capturedAt);
    assert.match(record.thumbnailUrl ?? "", /^\/assets\/.+thumbnail\.webp$/);
  });

  it("skips an already-captured reference unless forced", async () => {
    driver.calls = 0;
    const skipped = await service.captureReference(refId);
    assert.equal(skipped.status, "completed");
    assert.equal(driver.calls, 0, "driver should not be invoked");
  });

  it("recapture creates a new version and preserves the old one", async () => {
    const before = assets.listForReference(refId).length;
    const outcome = await service.captureReference(refId, { force: true });
    assert.equal(outcome.version, 2);

    const all = assets.listForReference(refId);
    assert.ok(all.length > before, "history must be preserved");
    assert.ok(all.some((a) => a.version === 1), "v1 must still exist");

    const current = assets.listCurrent(refId);
    assert.ok(current.every((a) => a.version === 2));
  });

  it("retries a transient failure and succeeds", async () => {
    const target = referencesRepo.create({
      title: "Flaky",
      source: "Other",
      url: "https://example.com/flaky",
      type: "website",
      industries: [],
      pageTypes: [],
      styles: [],
      patterns: [],
      tags: [],
    });
    driver.failTimes = 1;
    const outcome = await service.captureReference(target.id);
    assert.equal(outcome.status, "completed");
    assert.equal(driver.calls, 2, "should have retried once");
  });

  it("rolls back and records the reason when every attempt fails", async () => {
    const target = referencesRepo.create({
      title: "Broken",
      source: "Other",
      url: "https://example.com/broken",
      type: "website",
      industries: [],
      pageTypes: [],
      styles: [],
      patterns: [],
      tags: [],
    });
    driver.failTimes = 99;
    const outcome = await service.captureReference(target.id);
    assert.equal(outcome.status, "failed");
    assert.match(outcome.error ?? "", /simulated capture failure/);

    const record = referencesRepo.findById(target.id)!;
    assert.equal(record.captureStatus, "failed");
    assert.match(record.captureError ?? "", /simulated/);
    assert.equal(
      assets.listCurrent(target.id).length,
      0,
      "no partial assets may remain",
    );
    driver.failTimes = 0;
  });

  it("rejects an unsafe URL without invoking the driver", async () => {
    const target = referencesRepo.create({
      title: "SSRF",
      source: "Other",
      url: "http://127.0.0.1/admin",
      type: "website",
      industries: [],
      pageTypes: [],
      styles: [],
      patterns: [],
      tags: [],
    });
    driver.calls = 0;
    const outcome = await service.captureReference(target.id);
    assert.equal(outcome.status, "failed");
    assert.equal(driver.calls, 0);
  });

  it("reports a clear error when no driver is available", async () => {
    const unavailable = new CaptureService(
      new UnavailableCaptureDriver(),
      assets,
      referencesRepo,
    );
    const target = referencesRepo.create({
      title: "No driver",
      source: "Other",
      url: "https://example.com/no-driver",
      type: "website",
      industries: [],
      pageTypes: [],
      styles: [],
      patterns: [],
      tags: [],
    });
    await assert.rejects(
      () => unavailable.captureReference(target.id),
      (err: unknown) => err instanceof CaptureUnavailableError,
    );
  });

  it("batch captures everything outstanding and reports progress", async () => {
    driver.failTimes = 0;
    const run = await batch.run({ includeFailed: true });
    assert.equal(run.status, "completed");
    assert.equal(run.total, run.completed + run.failed + run.skipped);
    assert.ok(run.completed >= 1);
    assert.ok(run.startedAt && run.finishedAt);
  });

  it("batch skips already-captured references on a second pass", async () => {
    const second = await batch.run({ includeFailed: false });
    assert.equal(second.completed, 0, "nothing new should be captured");
  });

  it("refuses concurrent runs", async () => {
    const first = batch.run({ includeFailed: true });
    await assert.rejects(() => batch.run({}), /already in progress/);
    await first;
  });

  it("reconciles runs interrupted by a restart", () => {
    const orphan = assets.createRun(10);
    assets.updateRun(orphan.id, { status: "running" });
    const reconciled = batch.reconcileInterruptedRuns();
    assert.ok(reconciled >= 1);
    assert.equal(assets.findRun(orphan.id)?.status, "failed");
    assert.match(assets.findRun(orphan.id)?.message ?? "", /Interrupted/);
  });

  it("aggregates capture statistics", () => {
    const stats = assets.captureStats();
    assert.ok(stats.totalReferences >= 5);
    assert.ok(stats.referencesWithAssets >= 1);
    assert.ok(stats.assetCount >= 5);
    assert.ok(stats.assetBytes > 0);
  });

  it("deleting a reference cascades its assets", () => {
    const target = referencesRepo.create({
      title: "Doomed",
      source: "Other",
      url: "https://example.com/doomed",
      type: "website",
      industries: [],
      pageTypes: [],
      styles: [],
      patterns: [],
      tags: [],
    });
    assets.create({
      referenceId: target.id,
      kind: "desktop",
      path: "xx/doomed/v1/desktop.webp",
      format: "webp",
      width: 10,
      height: 10,
      fileSize: 100,
      checksum: "a".repeat(64),
      version: 1,
    });
    assert.equal(assets.listForReference(target.id).length, 1);
    referencesRepo.delete(target.id);
    assert.equal(assets.listForReference(target.id).length, 0);
  });
});
