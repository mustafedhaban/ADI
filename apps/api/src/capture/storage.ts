import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AssetKind } from "./types.js";

/* ---------------------------------------------------------------------------
   Asset storage.

   Files live on disk under a deterministic, shardable path so a reference's
   assets can always be located from its id alone, and so no directory ends up
   with tens of thousands of entries:

     data/assets/<shard>/<referenceId>/v<version>/<kind>.<ext>

   `shard` is the first two characters of the reference id (uuid), giving 256
   buckets. Storing locally means assets survive browser cache clearing and are
   reusable by later AI features; nothing is ever hotlinked.
--------------------------------------------------------------------------- */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../../");

const DEFAULT_ASSETS_ROOT = path.join(repoRoot, "data", "assets");

/**
 * Resolved per call rather than frozen at import so ADI_ASSETS_ROOT can be set
 * by an entry point (or a test) after this module has already been loaded.
 */
export function assetsRoot(): string {
  return process.env.ADI_ASSETS_ROOT ?? DEFAULT_ASSETS_ROOT;
}

/** Public URL prefix the API serves assets under. */
export const ASSETS_URL_PREFIX = "/assets";

export function shardFor(referenceId: string): string {
  const clean = referenceId.replace(/[^a-zA-Z0-9-]/g, "");
  return (clean.slice(0, 2) || "00").toLowerCase();
}

/** Path relative to the assets root — this is what goes in the database. */
export function relativeAssetPath(
  referenceId: string,
  version: number,
  kind: AssetKind,
  ext: string,
): string {
  return path.posix.join(
    shardFor(referenceId),
    referenceId,
    `v${version}`,
    `${kind}.${ext}`,
  );
}

export function absoluteAssetPath(relativePath: string): string {
  const resolved = path.resolve(assetsRoot(), relativePath);
  // Defensive: never allow a crafted id to escape the assets root.
  if (!resolved.startsWith(path.resolve(assetsRoot()))) {
    throw new Error("Refusing to write outside the assets root");
  }
  return resolved;
}

export function assetUrl(relativePath: string): string {
  return `${ASSETS_URL_PREFIX}/${relativePath}`;
}

export function checksum(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export interface StoredFile {
  path: string;
  fileSize: number;
  checksum: string;
}

export function writeAsset(
  referenceId: string,
  version: number,
  kind: AssetKind,
  ext: string,
  buffer: Buffer,
): StoredFile {
  const rel = relativeAssetPath(referenceId, version, kind, ext);
  const abs = absoluteAssetPath(rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, buffer);
  return { path: rel, fileSize: buffer.byteLength, checksum: checksum(buffer) };
}

export function assetExists(relativePath: string): boolean {
  try {
    return fs.statSync(absoluteAssetPath(relativePath)).isFile();
  } catch {
    return false;
  }
}

/** Remove one captured version. Used when a recapture is rolled back. */
export function removeVersion(referenceId: string, version: number): void {
  const dir = absoluteAssetPath(
    path.posix.join(shardFor(referenceId), referenceId, `v${version}`),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

export function removeReferenceAssets(referenceId: string): void {
  const dir = absoluteAssetPath(
    path.posix.join(shardFor(referenceId), referenceId),
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Total bytes stored under the assets root. */
export function storageSize(): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  function walk(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) {
        files += 1;
        try {
          bytes += fs.statSync(full).size;
        } catch {
          /* raced with a delete — ignore */
        }
      }
    }
  }
  walk(assetsRoot());
  return { files, bytes };
}
