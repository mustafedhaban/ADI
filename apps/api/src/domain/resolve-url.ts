import {
  assertPublicHttpUrl,
  assertSafeFetchUrl,
  UrlSafetyError,
} from "./url-safety.js";
import { detectSourceFromUrl } from "./source-detection.js";
import {
  extractMetadata,
  isValidPublicImageUrl,
} from "./metadata.js";
import { normalizeUrl } from "./validation.js";

export const RESOLVE_TIMEOUT_MS = 10_000;
export const RESOLVE_MAX_REDIRECTS = 5;
export const RESOLVE_MAX_BYTES = 1_500_000;

export interface ResolveUrlResult {
  originalUrl: string;
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  source: string;
  fetchFailed: boolean;
  warnings: string[];
  existingId: string | null;
}

export type ResolveFetch = (
  url: string,
  init: RequestInit,
) => Promise<Response>;

export interface ResolveUrlOptions {
  fetchImpl?: ResolveFetch;
  timeoutMs?: number;
  findExistingId?: (normalizedUrl: string) => string | null;
}

function emptyPreview(
  originalUrl: string,
  url: string,
  warnings: string[],
  existingId: string | null = null,
): ResolveUrlResult {
  return {
    originalUrl,
    url,
    title: null,
    description: null,
    image: null,
    source: detectSourceFromUrl(url),
    fetchFailed: true,
    warnings,
    existingId,
  };
}

async function fetchHtml(
  startUrl: string,
  fetchImpl: ResolveFetch,
  timeoutMs: number,
): Promise<{ finalUrl: string; html: string; warnings: string[] }> {
  const warnings: string[] = [];
  let current = startUrl;

  for (let hop = 0; hop <= RESOLVE_MAX_REDIRECTS; hop += 1) {
    await assertSafeFetchUrl(current);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetchImpl(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "User-Agent":
            "AloolDesignIntelligence/1.2 (+local-reference-library)",
        },
      });
    } catch (err) {
      if (err instanceof UrlSafetyError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Request timed out while fetching the webpage");
      }
      throw new Error("Website unavailable or network error while fetching URL");
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error(`Redirect response (${response.status}) missing Location header`);
      }
      let nextUrl: string;
      try {
        nextUrl = new URL(location, current).toString();
      } catch {
        throw new Error("Redirect target was not a valid URL");
      }
      assertPublicHttpUrl(nextUrl);
      current = nextUrl;
      continue;
    }

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} while fetching webpage`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (
      contentType &&
      !/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)
    ) {
      warnings.push(
        `Unexpected content type "${contentType}". Metadata extraction may be incomplete.`,
      );
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > RESOLVE_MAX_BYTES) {
      throw new Error("Webpage response is too large to process");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > RESOLVE_MAX_BYTES) {
      throw new Error("Webpage response is too large to process");
    }

    const html = buffer.toString("utf8");
    return { finalUrl: current, html, warnings };
  }

  throw new Error("Too many redirects while fetching webpage");
}

/**
 * Fetch a public webpage and extract reference preview metadata.
 * On fetch failure, returns a partial preview so the user can fill fields manually.
 */
export async function resolveUrlPreview(
  rawUrl: string,
  options: ResolveUrlOptions = {},
): Promise<ResolveUrlResult> {
  const warnings: string[] = [];
  let parsed: URL;

  try {
    parsed = assertPublicHttpUrl(rawUrl);
  } catch (err) {
    if (err instanceof UrlSafetyError) throw err;
    throw new UrlSafetyError("URL must be a valid HTTP or HTTPS address", "invalid");
  }

  const originalUrl = rawUrl.trim();
  const normalizedOriginal = normalizeUrl(originalUrl) ?? parsed.toString();
  const findExistingId = options.findExistingId ?? (() => null);

  // Early duplicate check on submitted URL
  let existingId = findExistingId(normalizedOriginal);

  try {
    await assertSafeFetchUrl(normalizedOriginal);
  } catch (err) {
    if (err instanceof UrlSafetyError) throw err;
    throw err;
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? RESOLVE_TIMEOUT_MS;

  try {
    const { finalUrl, html, warnings: fetchWarnings } = await fetchHtml(
      normalizedOriginal,
      fetchImpl,
      timeoutMs,
    );
    warnings.push(...fetchWarnings);

    const meta = extractMetadata(html, finalUrl);
    const resolvedUrl =
      normalizeUrl(meta.canonicalUrl ?? finalUrl) ??
      normalizeUrl(finalUrl) ??
      normalizedOriginal;

    if (!existingId) {
      existingId = findExistingId(resolvedUrl);
    }

    let image = meta.image;
    if (image && !isValidPublicImageUrl(image)) {
      warnings.push("Extracted image URL was invalid and was discarded");
      image = null;
    }

    if (!meta.title && !meta.description && !image) {
      warnings.push(
        "No Open Graph / Twitter / HTML metadata was found. You can fill fields manually.",
      );
    }

    return {
      originalUrl,
      url: resolvedUrl,
      title: meta.title,
      description: meta.description,
      image,
      source: detectSourceFromUrl(resolvedUrl),
      fetchFailed: false,
      warnings,
      existingId,
    };
  } catch (err) {
    if (err instanceof UrlSafetyError) throw err;

    const message =
      err instanceof Error ? err.message : "Failed to fetch webpage metadata";
    warnings.push(message);
    warnings.push("You can still create a reference manually with this URL.");

    return emptyPreview(originalUrl, normalizedOriginal, warnings, existingId);
  }
}
