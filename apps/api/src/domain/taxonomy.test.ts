import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  INDUSTRIES,
  PAGE_TYPES,
  PATTERNS,
  REFERENCE_TYPES,
  industrySet,
  pageTypeSet,
  patternSet,
} from "./taxonomy.js";
import { validateImportPayload } from "./validation.js";

/* ---------------------------------------------------------------------------
   Taxonomy extension (v2).

   The library audit found 102 of 104 references were marketing homepages and
   the `type` split was 103 website / 1 mobile — ADI had no vocabulary for an
   actual product interface. These terms exist so dashboards, documentation,
   search and filter experiences can be classified rather than collapsed into
   "Content Grid".
--------------------------------------------------------------------------- */

const ADDED_INDUSTRIES = ["Architecture", "Developer Tools"] as const;
const ADDED_PAGE_TYPES = ["Documentation", "Marketplace"] as const;
const ADDED_PATTERNS = [
  "Search",
  "Filtering",
  "Content Discovery",
  "Dashboard",
  "Portfolio Grid",
] as const;

describe("taxonomy extension", () => {
  it("exposes the new industries", () => {
    for (const term of ADDED_INDUSTRIES) {
      assert.ok(INDUSTRIES.includes(term), `${term} missing from INDUSTRIES`);
      assert.ok(industrySet.has(term), `${term} missing from industrySet`);
    }
  });

  it("exposes the new page types", () => {
    for (const term of ADDED_PAGE_TYPES) {
      assert.ok(PAGE_TYPES.includes(term), `${term} missing from PAGE_TYPES`);
      assert.ok(pageTypeSet.has(term), `${term} missing from pageTypeSet`);
    }
  });

  it("exposes the new product/application patterns", () => {
    for (const term of ADDED_PATTERNS) {
      assert.ok(PATTERNS.includes(term), `${term} missing from PATTERNS`);
      assert.ok(patternSet.has(term), `${term} missing from patternSet`);
    }
  });

  it("leaves the reference type enum unchanged", () => {
    assert.deepEqual(
      [...REFERENCE_TYPES],
      ["website", "ui", "mobile", "branding", "component"],
      "type describes the artifact and must stay closed",
    );
  });

  it("has no duplicate terms on any axis", () => {
    for (const [label, list] of [
      ["INDUSTRIES", INDUSTRIES],
      ["PAGE_TYPES", PAGE_TYPES],
      ["PATTERNS", PATTERNS],
    ] as const) {
      assert.equal(
        new Set(list).size,
        list.length,
        `${label} contains a duplicate`,
      );
    }
  });

  it("accepts a product-interface reference that previously failed import", () => {
    const { records, summary } = validateImportPayload(
      {
        references: [
          {
            title: "Product interface reference",
            url: "https://example.com/product-ui",
            source: "Other",
            type: "website",
            industries: ["Developer Tools", "Architecture"],
            pageTypes: ["Documentation", "Marketplace"],
            styles: ["Technical"],
            patterns: [
              "Search",
              "Filtering",
              "Content Discovery",
              "Dashboard",
              "Portfolio Grid",
            ],
            tags: ["faceted browse"],
          },
        ],
      },
      new Set<string>(),
    );

    assert.equal(summary.errors, 0, JSON.stringify(records[0]?.issues));
    assert.equal(records[0]?.status, "valid");
  });

  it("still rejects genuinely unknown taxonomy values", () => {
    const { summary } = validateImportPayload(
      {
        references: [
          {
            title: "Bogus",
            url: "https://example.com/bogus",
            source: "Other",
            type: "website",
            industries: ["Underwater Basket Weaving"],
            pageTypes: ["Homepage"],
            styles: ["Minimal"],
            patterns: ["Hero"],
            tags: [],
          },
        ],
      },
      new Set<string>(),
    );
    assert.equal(summary.errors, 1, "strict taxonomy must still hold");
  });
});
