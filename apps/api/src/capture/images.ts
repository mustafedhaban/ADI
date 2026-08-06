import sharp, { type Sharp } from "sharp";
import type { AssetKind } from "./types.js";

/* ---------------------------------------------------------------------------
   Image processing.

   Everything is normalised to WebP: it is universally supported by current
   browsers, roughly 25-35% smaller than equivalent-quality JPEG, and keeps one
   decode path in the web app. Raw PNG screenshots are never stored — a 1440x900
   @2x PNG is ~3MB, the WebP derivative is typically under 200KB.
--------------------------------------------------------------------------- */

export const OUTPUT_FORMAT = "webp" as const;

/** Longest-edge caps per asset kind. Full page is capped by height. */
export const TARGET_SIZES: Record<AssetKind, { width: number; maxHeight?: number }> = {
  desktop: { width: 1440 },
  mobile: { width: 780 },
  fullpage: { width: 1200, maxHeight: 12000 },
  hero: { width: 1200 },
  thumbnail: { width: 480 },
};

const QUALITY: Record<AssetKind, number> = {
  desktop: 82,
  mobile: 82,
  fullpage: 74,
  hero: 82,
  thumbnail: 70,
};

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

async function finalise(
  pipeline: Sharp,
  kind: AssetKind,
): Promise<ProcessedImage> {
  const buffer = await pipeline
    .webp({ quality: QUALITY[kind], effort: 4 })
    .toBuffer();
  const meta = await sharp(buffer).metadata();
  return {
    buffer,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    format: OUTPUT_FORMAT,
  };
}

/** Resize to the kind's target width, never upscaling. */
export async function optimize(
  input: Buffer,
  kind: AssetKind,
): Promise<ProcessedImage> {
  const target = TARGET_SIZES[kind];
  let pipeline = sharp(input, { limitInputPixels: 400_000_000 }).rotate();

  const meta = await sharp(input).metadata();
  const sourceWidth = meta.width ?? target.width;

  if (sourceWidth > target.width) {
    pipeline = pipeline.resize({ width: target.width, withoutEnlargement: true });
  }

  if (target.maxHeight) {
    const scaled = Math.round(
      (meta.height ?? 0) * Math.min(1, target.width / sourceWidth),
    );
    if (scaled > target.maxHeight) {
      // Very tall pages: keep the top, which is the designed part.
      pipeline = pipeline.extract({
        left: 0,
        top: 0,
        width: Math.min(target.width, sourceWidth),
        height: Math.min(
          target.maxHeight,
          meta.height ?? target.maxHeight,
        ),
      });
    }
  }

  return finalise(pipeline, kind);
}

/**
 * Hero crop — the top band of the desktop viewport at 16:9.
 * This is the part of a page that carries its visual identity, and it is what
 * the library grid shows when it wants one representative image.
 */
export async function heroCrop(desktopShot: Buffer): Promise<ProcessedImage> {
  const meta = await sharp(desktopShot).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) {
    return optimize(desktopShot, "hero");
  }

  const cropHeight = Math.min(height, Math.round((width * 9) / 16));
  const pipeline = sharp(desktopShot)
    .extract({ left: 0, top: 0, width, height: cropHeight })
    .resize({ width: TARGET_SIZES.hero.width, withoutEnlargement: true });

  return finalise(pipeline, "hero");
}

/** Thumbnail — 4:3 from the top of the desktop shot, for dense grids. */
export async function thumbnail(desktopShot: Buffer): Promise<ProcessedImage> {
  const meta = await sharp(desktopShot).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) {
    return optimize(desktopShot, "thumbnail");
  }

  const cropHeight = Math.min(height, Math.round((width * 3) / 4));
  const pipeline = sharp(desktopShot)
    .extract({ left: 0, top: 0, width, height: cropHeight })
    .resize({ width: TARGET_SIZES.thumbnail.width, withoutEnlargement: true });

  return finalise(pipeline, "thumbnail");
}
