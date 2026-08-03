export interface ExtractedMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  canonicalUrl: string | null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10)),
    )
    .trim();
}

function getMetaContent(
  html: string,
  attr: "property" | "name",
  key: string,
): string | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta\\s+[^>]*${attr}\\s*=\\s*["']${escaped}["'][^>]*content\\s*=\\s*["']([^"']*)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta\\s+[^>]*content\\s*=\\s*["']([^"']*)["'][^>]*${attr}\\s*=\\s*["']${escaped}["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]);
  }
  return null;
}

function getTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return null;
  return decodeHtmlEntities(match[1].replace(/\s+/g, " "));
}

function getCanonicalHref(html: string): string | null {
  const patterns = [
    /<link\s+[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i,
    /<link\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["']canonical["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]);
  }
  return null;
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function resolveAgainstBase(
  maybeRelative: string | null,
  baseUrl: string,
): string | null {
  if (!maybeRelative) return null;
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return null;
  }
}

export function extractMetadata(html: string, pageUrl: string): ExtractedMetadata {
  const title = firstNonEmpty(
    getMetaContent(html, "property", "og:title"),
    getMetaContent(html, "name", "twitter:title"),
    getTitleTag(html),
  );

  const description = firstNonEmpty(
    getMetaContent(html, "property", "og:description"),
    getMetaContent(html, "name", "twitter:description"),
    getMetaContent(html, "name", "description"),
  );

  const imageRaw = firstNonEmpty(
    getMetaContent(html, "property", "og:image"),
    getMetaContent(html, "name", "twitter:image"),
  );
  const image = resolveAgainstBase(imageRaw, pageUrl);

  const canonicalRaw = firstNonEmpty(
    getMetaContent(html, "property", "og:url"),
    getCanonicalHref(html),
  );
  const canonicalUrl = resolveAgainstBase(canonicalRaw, pageUrl);

  return { title, description, image, canonicalUrl };
}

export function isValidPublicImageUrl(raw: string | null | undefined): boolean {
  if (!raw || !raw.trim()) return false;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
