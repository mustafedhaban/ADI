/* ---------------------------------------------------------------------------
   Visual capture pipeline — shared contracts.

   Mirrors the existing research provider abstraction: a narrow driver interface
   with a real implementation and an unavailable stub, selected at composition
   time. Nothing above this layer knows a browser exists.
--------------------------------------------------------------------------- */

export const ASSET_KINDS = [
  "desktop",
  "mobile",
  "fullpage",
  "hero",
  "thumbnail",
] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

export const CAPTURE_STATUSES = [
  "pending",
  "queued",
  "processing",
  "completed",
  "failed",
] as const;
export type CaptureStatus = (typeof CAPTURE_STATUSES)[number];

export const RUN_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

/** Viewport presets. Desktop matches the app's own max content width. */
export const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 2 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 3 },
} as const;

export interface RawShot {
  kind: AssetKind;
  buffer: Buffer;
  viewportWidth: number;
  viewportHeight: number;
  deviceScaleFactor: number;
}

export interface DriverResult {
  /** Final URL after redirects. */
  finalUrl: string;
  shots: RawShot[];
}

export interface CaptureDriverOptions {
  /** Total navigation budget in ms. */
  timeoutMs?: number;
  /** Extra settle time after load before shooting. */
  settleMs?: number;
}

export interface CaptureDriver {
  readonly name: string;
  readonly available: boolean;
  capture(url: string, options?: CaptureDriverOptions): Promise<DriverResult>;
  /** Release any long-lived browser handles. */
  dispose(): Promise<void>;
}

export class CaptureUnavailableError extends Error {
  readonly code = "capture_unavailable";
  constructor(
    message = "Capture driver is not available. Install playwright and run `npx playwright install chromium`.",
  ) {
    super(message);
    this.name = "CaptureUnavailableError";
  }
}

export class CaptureFailedError extends Error {
  readonly code = "capture_failed";
  constructor(message: string) {
    super(message);
    this.name = "CaptureFailedError";
  }
}

/** Persisted asset metadata, as returned by the API. */
export interface AssetRecord {
  id: string;
  referenceId: string;
  kind: AssetKind;
  path: string;
  /** Public URL the web app can render. */
  url: string;
  format: string;
  width: number;
  height: number;
  fileSize: number;
  checksum: string;
  viewportWidth: number | null;
  viewportHeight: number | null;
  deviceScaleFactor: number | null;
  version: number;
  capturedAt: string;
  createdAt: string;
}

export interface CaptureOutcome {
  referenceId: string;
  status: CaptureStatus;
  assets: AssetRecord[];
  error: string | null;
  version: number;
}
