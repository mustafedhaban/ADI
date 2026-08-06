import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  OBSERVATION_CATEGORIES,
  PROVENANCES,
  TRAITS,
  allTraits,
  isCategory,
  isTrait,
  validateObservation,
} from "./observations.js";

/* ---------------------------------------------------------------------------
   The value of an observation is that it is comparable across references, and
   that a fact is never mistaken for an inference. These tests guard both.
--------------------------------------------------------------------------- */

const base = {
  category: "navigation",
  trait: "Left Sidebar",
  provenance: "observed",
};

describe("observation vocabulary", () => {
  it("exposes a trait list for every category", () => {
    for (const c of OBSERVATION_CATEGORIES) {
      assert.ok(TRAITS[c]?.length, `${c} has no traits`);
    }
  });

  it("has no duplicate traits within a category", () => {
    for (const c of OBSERVATION_CATEGORIES) {
      assert.equal(
        new Set(TRAITS[c]).size,
        TRAITS[c].length,
        `${c} contains a duplicate trait`,
      );
    }
  });

  it("covers every category the brief asked for", () => {
    for (const required of [
      "navigation",
      "search",
      "layout",
      "typography",
      "content",
      "interaction",
      "density",
      "ai",
      "conversion",
      "accessibility",
    ]) {
      assert.ok(isCategory(required), `${required} missing from categories`);
    }
  });

  it("scopes traits to their category", () => {
    assert.ok(isTrait("navigation", "Left Sidebar"));
    // A real trait, but not of this category — cross-category use must fail or
    // the same string would mean two different things in aggregate counts.
    assert.equal(isTrait("typography", "Left Sidebar"), false);
  });

  it("enumerates every category/trait pair", () => {
    const pairs = allTraits();
    const expected = OBSERVATION_CATEGORIES.reduce(
      (n, c) => n + TRAITS[c].length,
      0,
    );
    assert.equal(pairs.length, expected);
  });
});

describe("observation validation", () => {
  it("accepts a well-formed observed fact", () => {
    const r = validateObservation(base);
    assert.ok(r.ok, JSON.stringify(r.issues));
    assert.equal(r.value?.trait, "Left Sidebar");
    assert.equal(r.value?.confidence, null);
  });

  it("rejects a trait outside the vocabulary", () => {
    const r = validateObservation({ ...base, trait: "Vibes Sidebar" });
    assert.equal(r.ok, false);
    assert.ok(r.issues.some((i) => i.field === "trait"));
  });

  it("rejects an unknown category", () => {
    const r = validateObservation({ ...base, category: "astrology" });
    assert.equal(r.ok, false);
    assert.ok(r.issues.some((i) => i.field === "category"));
  });

  it("rejects an unknown provenance", () => {
    const r = validateObservation({ ...base, provenance: "probably" });
    assert.equal(r.ok, false);
    assert.ok(r.issues.some((i) => i.field === "provenance"));
  });

  it("refuses a confidence score on an observed fact", () => {
    // The core guarantee: an observed fact is visible or it is not. Allowing a
    // score would let inference be recorded as evidence.
    const r = validateObservation({ ...base, confidence: 80 });
    assert.equal(r.ok, false);
    assert.ok(
      r.issues.some((i) => i.field === "confidence"),
      "observed facts must not carry confidence",
    );
  });

  it("allows a confidence score on an inferred conclusion", () => {
    const r = validateObservation({
      ...base,
      provenance: "inferred",
      confidence: 70,
    });
    assert.ok(r.ok, JSON.stringify(r.issues));
    assert.equal(r.value?.confidence, 70);
  });

  it("rejects a confidence outside 0-100", () => {
    const r = validateObservation({
      ...base,
      provenance: "inferred",
      confidence: 140,
    });
    assert.equal(r.ok, false);
  });

  it("reports every problem at once rather than the first", () => {
    const r = validateObservation({
      category: "nonsense",
      trait: "also nonsense",
      provenance: "nonsense",
    });
    assert.equal(r.ok, false);
    assert.ok(r.issues.length >= 2, "expected multiple issues");
  });

  it("normalises blank detail and evidence note to null", () => {
    const r = validateObservation({ ...base, detail: "   ", evidenceNote: "" });
    assert.ok(r.ok);
    assert.equal(r.value?.detail, null);
    assert.equal(r.value?.evidenceNote, null);
  });

  it("keeps all three provenances distinguishable", () => {
    for (const p of PROVENANCES) {
      const r = validateObservation({ ...base, provenance: p });
      assert.ok(r.ok, `${p} should validate`);
      assert.equal(r.value?.provenance, p);
    }
  });
});
