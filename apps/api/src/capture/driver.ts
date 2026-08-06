import type { Browser, Page, Response } from "playwright";
import {
  CaptureFailedError,
  VIEWPORTS,
  type CaptureDriver,
  type CaptureDriverOptions,
  type DriverResult,
  type RawShot,
} from "./types.js";

/* ---------------------------------------------------------------------------
   Playwright capture driver.

   The only module in the codebase that knows a browser exists. Everything
   above it works against the CaptureDriver interface, mirroring how the
   research layer treats its AI/search providers.

   The browser is launched lazily and reused across captures — launching per
   reference would dominate runtime on a 300-item batch.
--------------------------------------------------------------------------- */

const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_SETTLE_MS = 1_200;

/** Budget for parsing once the server has answered. See `navigate`. */
const DOM_READY_TIMEOUT_MS = 20_000;

/** Blocked so pages settle instead of streaming forever. */
const HEAVY_RESOURCES = new Set(["media", "websocket", "eventsource"]);

/**
 * `animations: "disabled"` freezes CSS animations and fast-forwards transitions
 * to their end state. Without it, a page with an infinite animation never
 * reaches a stable frame and the screenshot call hangs until it times out.
 */
const SHOT_OPTS = {
  type: "png",
  animations: "disabled",
  caret: "hide",
  scale: "css",
} as const;

/**
 * Screenshot with a fallback.
 *
 * `animations: "disabled"` makes Playwright wait for a stable frame, which is
 * what we want for a clean specimen. But a site driving its layout from a
 * requestAnimationFrame loop — smooth-scroll libraries and WebGL heroes, which
 * is most of the agency sites in this library — never produces one, and the
 * call burns its whole budget. Falling back to an un-stabilised shot may catch
 * a frame mid-motion; that is strictly better than having no image at all.
 */
async function shoot(
  page: Page,
  extra: { fullPage?: boolean } = {},
  timeout = 20_000,
): Promise<Buffer> {
  try {
    return await page.screenshot({ ...SHOT_OPTS, ...extra, timeout });
  } catch {
    return await page.screenshot({
      ...SHOT_OPTS,
      ...extra,
      animations: "allow",
      timeout: Math.round(timeout / 2),
    });
  }
}

export class PlaywrightCaptureDriver implements CaptureDriver {
  readonly name = "playwright";
  private browser: Browser | null = null;
  private launchFailed = false;

  get available(): boolean {
    return !this.launchFailed;
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser?.isConnected()) return this.browser;
    const { chromium } = await import("playwright");
    this.browser = await chromium.launch({
      args: [
        "--disable-dev-shm-usage",
        "--hide-scrollbars",
        // Chromium otherwise advertises itself as automated, which makes some
        // sites serve a challenge page instead of the design we came for.
        "--disable-blink-features=AutomationControlled",
      ],
    });
    return this.browser;
  }

  async capture(
    url: string,
    options: CaptureDriverOptions = {},
  ): Promise<DriverResult> {
    const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const settle = options.settleMs ?? DEFAULT_SETTLE_MS;

    let browser: Browser;
    try {
      browser = await this.getBrowser();
    } catch (err) {
      this.launchFailed = true;
      throw new CaptureFailedError(
        `Could not launch Chromium: ${err instanceof Error ? err.message : String(err)}. Run \`npx playwright install chromium\`.`,
      );
    }

    const shots: RawShot[] = [];
    let finalUrl = url;

    // --- desktop + full page ------------------------------------------------
    const desktopContext = await browser.newContext({
      viewport: { width: VIEWPORTS.desktop.width, height: VIEWPORTS.desktop.height },
      deviceScaleFactor: VIEWPORTS.desktop.deviceScaleFactor,
      // A real UA: many sites serve a degraded page to obvious headless agents.
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      ignoreHTTPSErrors: true,
      locale: "en-US",
      // Some CDNs answer 403 to a request that sends no language preference.
      extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
    });

    try {
      const page = await desktopContext.newPage();
      await page.route("**/*", (route) => {
        if (HEAVY_RESOURCES.has(route.request().resourceType())) {
          void route.abort();
        } else {
          void route.continue();
        }
      });

      const response = await navigate(page, url, timeout);
      if (response && response.status() >= 400) {
        throw new CaptureFailedError(
          `Page returned HTTP ${response.status()}`,
        );
      }
      finalUrl = page.url();

      // Wait for a stable state, but never hang the whole batch on it.
      await page
        .waitForLoadState("networkidle", { timeout: Math.min(timeout, 12_000) })
        .catch(() => undefined);
      await page.waitForTimeout(settle);

      // Dismiss the most common cookie overlays so shots aren't a consent wall.
      await dismissOverlays(page).catch(() => undefined);

      shots.push({
        kind: "desktop",
        buffer: await shoot(page),
        viewportWidth: VIEWPORTS.desktop.width,
        viewportHeight: VIEWPORTS.desktop.height,
        deviceScaleFactor: VIEWPORTS.desktop.deviceScaleFactor,
      });

      // Full page is the least reliable shot: very tall or animation-heavy
      // pages can exceed any budget. It must never fail the whole capture —
      // the desktop viewport shot is what the product actually renders.
      try {
        shots.push({
          kind: "fullpage",
          buffer: await shoot(page, { fullPage: true }, 25_000),
          viewportWidth: VIEWPORTS.desktop.width,
          viewportHeight: VIEWPORTS.desktop.height,
          deviceScaleFactor: VIEWPORTS.desktop.deviceScaleFactor,
        });
      } catch {
        /* keep the desktop shot */
      }
    } finally {
      await desktopContext.close().catch(() => undefined);
    }

    // --- mobile -------------------------------------------------------------
    const mobileContext = await browser.newContext({
      viewport: { width: VIEWPORTS.mobile.width, height: VIEWPORTS.mobile.height },
      deviceScaleFactor: VIEWPORTS.mobile.deviceScaleFactor,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ignoreHTTPSErrors: true,
      locale: "en-US",
      // Some CDNs answer 403 to a request that sends no language preference.
      extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
    });

    try {
      const page = await mobileContext.newPage();
      await navigate(page, finalUrl, timeout);
      await page
        .waitForLoadState("networkidle", { timeout: Math.min(timeout, 10_000) })
        .catch(() => undefined);
      await page.waitForTimeout(settle);
      await dismissOverlays(page).catch(() => undefined);

      shots.push({
        kind: "mobile",
        buffer: await shoot(page),
        viewportWidth: VIEWPORTS.mobile.width,
        viewportHeight: VIEWPORTS.mobile.height,
        deviceScaleFactor: VIEWPORTS.mobile.deviceScaleFactor,
      });
    } catch {
      // A missing mobile shot must not fail the whole capture.
    } finally {
      await mobileContext.close().catch(() => undefined);
    }

    if (!shots.length) {
      throw new CaptureFailedError("No screenshots were produced");
    }

    return { finalUrl, shots };
  }

  async dispose(): Promise<void> {
    await this.browser?.close().catch(() => undefined);
    this.browser = null;
  }
}

/**
 * Navigate in two separately-bounded stages.
 *
 * `waitUntil: "domcontentloaded"` couples two very different questions into one
 * budget: did the server answer, and did every blocking script finish parsing.
 * Heavy marketing sites routinely spend the whole budget on the second half, so
 * a reachable page fails outright. Committing first and waiting for the DOM
 * separately means a slow parse costs us some settle time, not the reference.
 */
async function navigate(
  page: Page,
  url: string,
  timeout: number,
): Promise<Response | null> {
  const response = await page.goto(url, { waitUntil: "commit", timeout });
  await page
    .waitForLoadState("domcontentloaded", { timeout: DOM_READY_TIMEOUT_MS })
    .catch(() => undefined);
  return response;
}

/** Best-effort consent/overlay dismissal. Never throws. */
async function dismissOverlays(page: {
  evaluate: (fn: () => void) => Promise<unknown>;
}): Promise<void> {
  await page.evaluate(() => {
    const patterns =
      /(accept|agree|got it|allow all|i understand|continue|close)/i;
    const buttons = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button, [role="button"], a.button, input[type="submit"]',
      ),
    ).slice(0, 400);
    for (const el of buttons) {
      const text = (el.innerText || (el as HTMLInputElement).value || "").trim();
      if (text && text.length < 40 && patterns.test(text)) {
        el.click();
        break;
      }
    }
    // Remove fixed full-viewport overlays that survive dismissal.
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("*")).slice(
      0,
      2500,
    )) {
      const style = window.getComputedStyle(el);
      if (
        (style.position === "fixed" || style.position === "sticky") &&
        el.getBoundingClientRect().height > window.innerHeight * 0.6 &&
        Number(style.zIndex) > 500
      ) {
        el.style.display = "none";
      }
    }
  });
}

/** Stub used when no browser is installed — keeps tests and CI browser-free. */
export class UnavailableCaptureDriver implements CaptureDriver {
  readonly name = "unavailable";
  readonly available = false;

  async capture(): Promise<DriverResult> {
    throw new CaptureFailedError(
      "Capture driver is not available. Install playwright and run `npx playwright install chromium`.",
    );
  }

  async dispose(): Promise<void> {}
}

export function createCaptureDriver(): CaptureDriver {
  if (process.env.ADI_CAPTURE_DISABLED === "1") {
    return new UnavailableCaptureDriver();
  }
  return new PlaywrightCaptureDriver();
}
