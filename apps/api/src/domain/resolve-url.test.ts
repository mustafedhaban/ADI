import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertPublicHttpUrl,
  isPrivateIpAddress,
  UrlSafetyError,
} from "./url-safety.js";
import { detectSourceFromHostname, detectSourceFromUrl } from "./source-detection.js";
import { extractMetadata, isValidPublicImageUrl } from "./metadata.js";
import { resolveUrlPreview } from "./resolve-url.js";

describe("url-safety", () => {
  it("accepts valid public https URLs", () => {
    const url = assertPublicHttpUrl("https://example.com/path");
    assert.equal(url.hostname, "example.com");
  });

  it("rejects empty URL", () => {
    assert.throws(() => assertPublicHttpUrl(""), (err: unknown) => {
      assert.ok(err instanceof UrlSafetyError);
      assert.equal(err.code, "empty");
      return true;
    });
  });

  it("rejects invalid URL", () => {
    assert.throws(() => assertPublicHttpUrl("not-a-url"), UrlSafetyError);
  });

  it("rejects file protocol", () => {
    assert.throws(() => assertPublicHttpUrl("file:///etc/passwd"), UrlSafetyError);
  });

  it("rejects localhost", () => {
    assert.throws(() => assertPublicHttpUrl("http://localhost/admin"), UrlSafetyError);
  });

  it("rejects 127.0.0.1", () => {
    assert.throws(() => assertPublicHttpUrl("http://127.0.0.1:3000"), UrlSafetyError);
  });

  it("rejects private IPv4", () => {
    assert.equal(isPrivateIpAddress("10.0.0.5"), true);
    assert.equal(isPrivateIpAddress("192.168.1.10"), true);
    assert.equal(isPrivateIpAddress("172.16.0.1"), true);
    assert.equal(isPrivateIpAddress("8.8.8.8"), false);
    assert.throws(() => assertPublicHttpUrl("http://192.168.0.1/"), UrlSafetyError);
  });
});

describe("source-detection", () => {
  it("maps known hostnames", () => {
    assert.equal(detectSourceFromHostname("www.behance.net"), "Behance");
    assert.equal(detectSourceFromHostname("dribbble.com"), "Dribbble");
    assert.equal(detectSourceFromHostname("www.pinterest.com"), "Pinterest");
    assert.equal(detectSourceFromHostname("x.com"), "X");
    assert.equal(detectSourceFromHostname("twitter.com"), "X");
    assert.equal(detectSourceFromHostname("www.figma.com"), "Figma Community");
    assert.equal(detectSourceFromHostname("land-book.com"), "Land-book");
  });

  it("returns Other for unknown domains", () => {
    assert.equal(detectSourceFromUrl("https://example.com/page"), "Other");
  });
});

describe("metadata extraction", () => {
  const html = `
    <html><head>
      <title>Fallback Title</title>
      <meta property="og:title" content="OG Title &amp; More" />
      <meta property="og:description" content="OG Description" />
      <meta property="og:image" content="/images/cover.jpg" />
      <meta property="og:url" content="https://example.com/canonical" />
      <meta name="twitter:title" content="Twitter Title" />
      <meta name="description" content="Meta Description" />
      <link rel="canonical" href="https://example.com/link-canonical" />
    </head></html>
  `;

  it("prefers Open Graph fields", () => {
    const meta = extractMetadata(html, "https://example.com/page");
    assert.equal(meta.title, "OG Title & More");
    assert.equal(meta.description, "OG Description");
    assert.equal(meta.image, "https://example.com/images/cover.jpg");
    assert.equal(meta.canonicalUrl, "https://example.com/canonical");
  });

  it("falls back when OG is missing", () => {
    const fallbackHtml = `
      <html><head>
        <title>Plain Title</title>
        <meta name="twitter:description" content="TW Desc" />
        <meta name="twitter:image" content="https://cdn.example.com/a.png" />
      </head></html>
    `;
    const meta = extractMetadata(fallbackHtml, "https://example.com");
    assert.equal(meta.title, "Plain Title");
    assert.equal(meta.description, "TW Desc");
    assert.equal(meta.image, "https://cdn.example.com/a.png");
  });

  it("validates image URLs", () => {
    assert.equal(isValidPublicImageUrl("https://cdn.example.com/a.png"), true);
    assert.equal(isValidPublicImageUrl("file:///tmp/a.png"), false);
    assert.equal(isValidPublicImageUrl("not a url"), false);
  });
});

describe("resolveUrlPreview", () => {
  it("extracts metadata from a mocked fetch", async () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Behance Project" />
        <meta property="og:description" content="A design case study" />
        <meta property="og:image" content="https://mir-s3-cdn-cf.behance.net/cover.jpg" />
      </head></html>
    `;

    const result = await resolveUrlPreview("https://www.behance.net/gallery/123", {
      fetchImpl: async () =>
        new Response(html, {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
    });

    assert.equal(result.fetchFailed, false);
    assert.equal(result.title, "Behance Project");
    assert.equal(result.description, "A design case study");
    assert.equal(result.source, "Behance");
    assert.equal(result.image, "https://mir-s3-cdn-cf.behance.net/cover.jpg");
    assert.match(result.url, /behance\.net/);
  });

  it("returns partial preview on timeout/network error", async () => {
    const result = await resolveUrlPreview("https://example.com/missing", {
      fetchImpl: async () => {
        throw Object.assign(new Error("aborted"), { name: "AbortError" });
      },
      timeoutMs: 50,
    });

    assert.equal(result.fetchFailed, true);
    assert.equal(result.source, "Other");
    assert.ok(result.warnings.length > 0);
    assert.ok(result.url.includes("example.com"));
  });

  it("reports duplicate existingId without failing resolve", async () => {
    const result = await resolveUrlPreview("https://example.com/dup", {
      fetchImpl: async () =>
        new Response("<html><head><title>Dup</title></head></html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      findExistingId: () => "existing-ref-id",
    });

    assert.equal(result.existingId, "existing-ref-id");
    assert.equal(result.title, "Dup");
  });

  it("rejects SSRF targets before fetching", async () => {
    await assert.rejects(
      () =>
        resolveUrlPreview("http://127.0.0.1/secret", {
          fetchImpl: async () => {
            throw new Error("should not fetch");
          },
        }),
      UrlSafetyError,
    );
  });

  it("rejects empty URL", async () => {
    await assert.rejects(() => resolveUrlPreview("   "), UrlSafetyError);
  });
});
