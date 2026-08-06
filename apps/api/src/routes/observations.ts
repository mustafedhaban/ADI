import type { FastifyInstance } from "fastify";
import type { ObservationRepository } from "../repositories/observation-repository.js";
import type { ReferenceRepository } from "../repositories/reference-repository.js";
import type { CollectionRepository } from "../repositories/collection-repository.js";
import {
  CATEGORY_LABELS,
  OBSERVATION_CATEGORIES,
  PROVENANCES,
  TRAITS,
  isCategory,
  isProvenance,
  validateObservation,
  type ObservationCategory,
  type Provenance,
} from "../domain/observations.js";

/* ---------------------------------------------------------------------------
   Observation routes.

   Read paths are shaped for the four questions the UI asks:
     one reference      -> GET /api/references/:id/observations
     several references -> GET /api/observations/compare
     a collection       -> GET /api/collections/:id/observations
     the whole library  -> GET /api/observations/patterns

   All aggregate endpoints default to provenance=observed. Inference and notes
   are readable but never silently folded into a pattern claim.
--------------------------------------------------------------------------- */

function parseIdList(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return [...new Set(value.split(",").map((s) => s.trim()).filter(Boolean))];
}

function parseProvenance(value: unknown): Provenance {
  return isProvenance(value) ? value : "observed";
}

export async function observationRoutes(
  app: FastifyInstance,
  deps: {
    observations: ObservationRepository;
    referencesRepo: ReferenceRepository;
    collections: CollectionRepository;
  },
) {
  const { observations, referencesRepo, collections } = deps;

  /* --- vocabulary ---------------------------------------------------------- */

  /** The closed vocabulary, for UI pickers and for agents writing observations. */
  app.get("/api/observations/vocabulary", async () => ({
    categories: OBSERVATION_CATEGORIES.map((c) => ({
      id: c,
      label: CATEGORY_LABELS[c],
      traits: TRAITS[c],
    })),
    provenances: PROVENANCES.map((p) => ({
      id: p,
      label:
        p === "observed"
          ? "Observed fact"
          : p === "inferred"
            ? "Inferred conclusion"
            : "Written note",
    })),
  }));

  /* --- one reference ------------------------------------------------------- */

  app.get("/api/references/:id/observations", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!referencesRepo.findById(id)) {
      return reply.status(404).send({ error: "Reference not found" });
    }
    const items = observations.listForReference(id);
    // Grouped by category for direct rendering, plus flat for programmatic use.
    const byCategory = OBSERVATION_CATEGORIES.map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      items: items.filter((o) => o.category === category),
    })).filter((g) => g.items.length > 0);

    return {
      referenceId: id,
      total: items.length,
      counts: {
        observed: items.filter((o) => o.provenance === "observed").length,
        inferred: items.filter((o) => o.provenance === "inferred").length,
        authored: items.filter((o) => o.provenance === "authored").length,
      },
      byCategory,
      items,
    };
  });

  /** Record one or many observations. Accepts a single object or `{ observations: [] }`. */
  app.post("/api/references/:id/observations", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!referencesRepo.findById(id)) {
      return reply.status(404).send({ error: "Reference not found" });
    }

    const body = request.body as
      | { observations?: unknown[] }
      | unknown[]
      | Record<string, unknown>;
    const raw = Array.isArray(body)
      ? body
      : Array.isArray((body as { observations?: unknown[] })?.observations)
        ? (body as { observations: unknown[] }).observations
        : [body];

    const valid: ReturnType<typeof validateObservation>["value"][] = [];
    const errors: { index: number; issues: unknown[] }[] = [];

    raw.forEach((item, index) => {
      const result = validateObservation(item);
      if (result.ok && result.value) valid.push(result.value);
      else errors.push({ index, issues: result.issues });
    });

    if (errors.length) {
      // All-or-nothing: a partially applied batch would leave the caller unable
      // to tell what landed without re-reading.
      return reply.status(400).send({
        error: "Invalid observations",
        accepted: 0,
        rejected: errors.length,
        errors,
      });
    }

    const created = observations.upsertMany(id, valid as never[]);
    return reply.status(201).send({ accepted: created.length, items: created });
  });

  app.delete("/api/observations/:observationId", async (request, reply) => {
    const { observationId } = request.params as { observationId: string };
    if (!observations.remove(observationId)) {
      return reply.status(404).send({ error: "Observation not found" });
    }
    return reply.status(204).send();
  });

  /* --- compare several references ------------------------------------------ */

  /**
   * Compare observations across references. Returns a trait matrix: every trait
   * any of them carries, and which of them carry it — so shared and unique
   * traits are both readable off one structure.
   */
  app.get("/api/observations/compare", async (request, reply) => {
    const query = request.query as { referenceIds?: string; provenance?: string };
    const ids = parseIdList(query.referenceIds);
    if (ids.length < 2) {
      return reply
        .status(400)
        .send({ error: "Provide at least two referenceIds, comma separated" });
    }
    if (ids.length > 8) {
      return reply
        .status(400)
        .send({ error: "Compare supports at most 8 references at once" });
    }

    const provenance = parseProvenance(query.provenance);
    const refs = ids
      .map((id) => referencesRepo.findById(id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r));
    if (refs.length !== ids.length) {
      return reply.status(404).send({ error: "One or more references not found" });
    }

    const all = observations
      .listForReferences(ids)
      .filter((o) => o.provenance === provenance);

    const key = (c: string, t: string) => `${c}|${t}`;
    const traitMap = new Map<
      string,
      { category: ObservationCategory; trait: string; referenceIds: Set<string> }
    >();
    for (const o of all) {
      const k = key(o.category, o.trait);
      if (!traitMap.has(k)) {
        traitMap.set(k, {
          category: o.category,
          trait: o.trait,
          referenceIds: new Set(),
        });
      }
      traitMap.get(k)!.referenceIds.add(o.referenceId);
    }

    const rows = [...traitMap.values()]
      .map((r) => ({
        category: r.category,
        label: CATEGORY_LABELS[r.category],
        trait: r.trait,
        presentIn: ids.filter((id) => r.referenceIds.has(id)),
        count: r.referenceIds.size,
        /** True when every compared reference carries it. */
        shared: r.referenceIds.size === ids.length,
        /** True when exactly one does — what makes that reference different. */
        unique: r.referenceIds.size === 1,
      }))
      .sort(
        (a, b) =>
          b.count - a.count ||
          a.category.localeCompare(b.category) ||
          a.trait.localeCompare(b.trait),
      );

    return {
      provenance,
      references: refs.map((r) => ({ id: r.id, title: r.title, url: r.url })),
      totalTraits: rows.length,
      sharedCount: rows.filter((r) => r.shared).length,
      rows,
    };
  });

  /* --- collection summary --------------------------------------------------- */

  app.get("/api/collections/:id/observations", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!collections.findById(id)) {
      return reply.status(404).send({ error: "Collection not found" });
    }
    const referenceIds = observations.referenceIdsInCollection(id);
    if (!referenceIds.length) {
      return {
        collectionId: id,
        referenceCount: 0,
        observedReferenceCount: 0,
        topTraits: [],
        distinctive: [],
        byCategory: [],
      };
    }

    const scoped = observations.traitCounts({ referenceIds });
    const withObs = new Set(
      observations.listForReferences(referenceIds).map((o) => o.referenceId),
    );

    const byCategory = OBSERVATION_CATEGORIES.map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      traits: scoped.filter((t) => t.category === category).slice(0, 8),
    })).filter((g) => g.traits.length > 0);

    return {
      collectionId: id,
      referenceCount: referenceIds.length,
      observedReferenceCount: withObs.size,
      topTraits: scoped.slice(0, 15),
      // What this collection does more than the library does.
      distinctive: observations.distinctiveTraits(referenceIds),
      byCategory,
    };
  });

  /* --- library-wide patterns ------------------------------------------------ */

  app.get("/api/observations/patterns", async (request) => {
    const query = request.query as {
      provenance?: string;
      category?: string;
      minCount?: string;
    };
    const provenance = parseProvenance(query.provenance);
    const category = isCategory(query.category) ? query.category : undefined;
    const minCount = Number(query.minCount);

    const counts = observations.traitCounts({
      provenance,
      category,
      minCount: Number.isFinite(minCount) && minCount > 0 ? minCount : 2,
    });

    return {
      provenance,
      category: category ?? null,
      coverage: observations.coverage(),
      traits: counts,
      byCategory: OBSERVATION_CATEGORIES.map((c) => ({
        category: c,
        label: CATEGORY_LABELS[c],
        traits: counts.filter((t) => t.category === c),
      })).filter((g) => g.traits.length > 0),
      cooccurrence: observations.cooccurrence({ minCount: 3, limit: 30 }),
    };
  });

  /** Drill-down: which references carry a trait. */
  app.get("/api/observations/trait", async (request, reply) => {
    const query = request.query as {
      category?: string;
      trait?: string;
      provenance?: string;
    };
    if (!isCategory(query.category) || typeof query.trait !== "string") {
      return reply
        .status(400)
        .send({ error: "category and trait query parameters are required" });
    }
    const items = observations.referencesWithTrait(
      query.category,
      query.trait,
      parseProvenance(query.provenance),
    );
    return { category: query.category, trait: query.trait, total: items.length, items };
  });
}
