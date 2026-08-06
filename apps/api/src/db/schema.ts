import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const references = sqliteTable(
  "references",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    source: text("source").notNull(),
    url: text("url").notNull(),
    image: text("image"),
    type: text("type").notNull(),
    description: text("description"),
    whySaved: text("why_saved"),
    whatToLearn: text("what_to_learn"), // JSON array string
    // --- visual capture pipeline (v2) ---
    /** pending | queued | processing | completed | failed */
    captureStatus: text("capture_status").notNull().default("pending"),
    captureError: text("capture_error"),
    capturedAt: text("captured_at"),
    captureAttempts: integer("capture_attempts").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [uniqueIndex("references_url_idx").on(table.url)],
);

export const industries = sqliteTable("industries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const pageTypes = sqliteTable("page_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const styles = sqliteTable("styles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const patterns = sqliteTable("patterns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const referenceIndustries = sqliteTable(
  "reference_industries",
  {
    referenceId: text("reference_id")
      .notNull()
      .references(() => references.id, { onDelete: "cascade" }),
    industryId: integer("industry_id")
      .notNull()
      .references(() => industries.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("ref_industry_idx").on(table.referenceId, table.industryId),
  ],
);

export const referencePageTypes = sqliteTable(
  "reference_page_types",
  {
    referenceId: text("reference_id")
      .notNull()
      .references(() => references.id, { onDelete: "cascade" }),
    pageTypeId: integer("page_type_id")
      .notNull()
      .references(() => pageTypes.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("ref_page_type_idx").on(table.referenceId, table.pageTypeId),
  ],
);

export const referenceStyles = sqliteTable(
  "reference_styles",
  {
    referenceId: text("reference_id")
      .notNull()
      .references(() => references.id, { onDelete: "cascade" }),
    styleId: integer("style_id")
      .notNull()
      .references(() => styles.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("ref_style_idx").on(table.referenceId, table.styleId),
  ],
);

export const referencePatterns = sqliteTable(
  "reference_patterns",
  {
    referenceId: text("reference_id")
      .notNull()
      .references(() => references.id, { onDelete: "cascade" }),
    patternId: integer("pattern_id")
      .notNull()
      .references(() => patterns.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("ref_pattern_idx").on(table.referenceId, table.patternId),
  ],
);

export const referenceTags = sqliteTable(
  "reference_tags",
  {
    referenceId: text("reference_id")
      .notNull()
      .references(() => references.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("ref_tag_idx").on(table.referenceId, table.tagId),
  ],
);

export const referencesRelations = relations(references, ({ many }) => ({
  industries: many(referenceIndustries),
  pageTypes: many(referencePageTypes),
  styles: many(referenceStyles),
  patterns: many(referencePatterns),
  tags: many(referenceTags),
}));

export const referenceIndustriesRelations = relations(
  referenceIndustries,
  ({ one }) => ({
    reference: one(references, {
      fields: [referenceIndustries.referenceId],
      references: [references.id],
    }),
    industry: one(industries, {
      fields: [referenceIndustries.industryId],
      references: [industries.id],
    }),
  }),
);

export const referencePageTypesRelations = relations(
  referencePageTypes,
  ({ one }) => ({
    reference: one(references, {
      fields: [referencePageTypes.referenceId],
      references: [references.id],
    }),
    pageType: one(pageTypes, {
      fields: [referencePageTypes.pageTypeId],
      references: [pageTypes.id],
    }),
  }),
);

export const referenceStylesRelations = relations(
  referenceStyles,
  ({ one }) => ({
    reference: one(references, {
      fields: [referenceStyles.referenceId],
      references: [references.id],
    }),
    style: one(styles, {
      fields: [referenceStyles.styleId],
      references: [styles.id],
    }),
  }),
);

export const referencePatternsRelations = relations(
  referencePatterns,
  ({ one }) => ({
    reference: one(references, {
      fields: [referencePatterns.referenceId],
      references: [references.id],
    }),
    pattern: one(patterns, {
      fields: [referencePatterns.patternId],
      references: [patterns.id],
    }),
  }),
);

export const referenceTagsRelations = relations(referenceTags, ({ one }) => ({
  reference: one(references, {
    fields: [referenceTags.referenceId],
    references: [references.id],
  }),
  tag: one(tags, {
    fields: [referenceTags.tagId],
    references: [tags.id],
  }),
}));

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const collectionReferences = sqliteTable(
  "collection_references",
  {
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    referenceId: text("reference_id")
      .notNull()
      .references(() => references.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("collection_ref_idx").on(table.collectionId, table.referenceId),
  ],
);

export const collectionsRelations = relations(collections, ({ many }) => ({
  references: many(collectionReferences),
  projects: many(projectCollections),
}));

export const collectionReferencesRelations = relations(
  collectionReferences,
  ({ one }) => ({
    collection: one(collections, {
      fields: [collectionReferences.collectionId],
      references: [collections.id],
    }),
    reference: one(references, {
      fields: [collectionReferences.referenceId],
      references: [references.id],
    }),
  }),
);

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  clientName: text("client_name"),
  industry: text("industry"),
  audience: text("audience"),
  location: text("location"),
  projectType: text("project_type"),
  designGoals: text("design_goals"),
  // Research brief (v1) — multi-value fields stored as JSON array strings
  audienceNeeds: text("audience_needs"),
  businessGoals: text("business_goals"),
  projectGoals: text("project_goals"),
  desiredStyles: text("desired_styles"),
  avoidStyles: text("avoid_styles"),
  keyMessages: text("key_messages"),
  contentTypes: text("content_types"),
  requiredFeatures: text("required_features"),
  preferredSources: text("preferred_sources"),
  referenceKeywords: text("reference_keywords"),
  competitors: text("competitors"),
  competitorNotes: text("competitor_notes"),
  constraints: text("constraints"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const projectCollections = sqliteTable(
  "project_collections",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("project_collection_idx").on(
      table.projectId,
      table.collectionId,
    ),
  ],
);

export const projectsRelations = relations(projects, ({ many }) => ({
  collections: many(projectCollections),
  researchRuns: many(researchRuns),
  designDna: many(designDna),
}));

export const projectCollectionsRelations = relations(
  projectCollections,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectCollections.projectId],
      references: [projects.id],
    }),
    collection: one(collections, {
      fields: [projectCollections.collectionId],
      references: [collections.id],
    }),
  }),
);

export const researchRuns = sqliteTable("research_runs", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  focus: text("focus"),
  status: text("status").notNull().default("pending"),
  sources: text("sources"), // JSON array
  resultLimit: integer("result_limit").notNull().default(20),
  query: text("query"),
  message: text("message"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  completedAt: text("completed_at"),
});

export const researchCandidates = sqliteTable(
  "research_candidates",
  {
    id: text("id").primaryKey(),
    researchId: text("research_id")
      .notNull()
      .references(() => researchRuns.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    source: text("source").notNull().default("Other"),
    description: text("description"),
    image: text("image"),
    relevanceScore: integer("relevance_score"),
    relevanceReason: text("relevance_reason"),
    matchedCriteria: text("matched_criteria"), // JSON array
    suggestedStyles: text("suggested_styles"), // JSON array
    suggestedPatterns: text("suggested_patterns"), // JSON array
    suggestedTags: text("suggested_tags"), // JSON array
    status: text("status").notNull().default("candidate"),
    referenceId: text("reference_id").references(() => references.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("research_candidate_url_idx").on(table.researchId, table.url),
  ],
);

export const researchRunsRelations = relations(researchRuns, ({ one, many }) => ({
  project: one(projects, {
    fields: [researchRuns.projectId],
    references: [projects.id],
  }),
  candidates: many(researchCandidates),
}));

export const researchCandidatesRelations = relations(
  researchCandidates,
  ({ one }) => ({
    research: one(researchRuns, {
      fields: [researchCandidates.researchId],
      references: [researchRuns.id],
    }),
    reference: one(references, {
      fields: [researchCandidates.referenceId],
      references: [references.id],
    }),
  }),
);

export const designDna = sqliteTable(
  "design_dna",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    status: text("status").notNull().default("draft"),
    /** Full structured DNA document (see domain/design-dna.ts). */
    content: text("content").notNull(),
    referenceCount: integer("reference_count").notNull().default(0),
    sourceCollectionIds: text("source_collection_ids"), // JSON array
    generatedAt: text("generated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("design_dna_project_version_idx").on(
      table.projectId,
      table.version,
    ),
  ],
);

export const designDnaEvidence = sqliteTable(
  "design_dna_evidence",
  {
    id: text("id").primaryKey(),
    dnaId: text("dna_id")
      .notNull()
      .references(() => designDna.id, { onDelete: "cascade" }),
    referenceId: text("reference_id")
      .notNull()
      .references(() => references.id, { onDelete: "cascade" }),
    section: text("section").notNull(),
    insight: text("insight").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("design_dna_evidence_idx").on(
      table.dnaId,
      table.referenceId,
      table.section,
      table.insight,
    ),
  ],
);

export const designDnaRelations = relations(designDna, ({ one, many }) => ({
  project: one(projects, {
    fields: [designDna.projectId],
    references: [projects.id],
  }),
  evidence: many(designDnaEvidence),
}));

export const designDnaEvidenceRelations = relations(
  designDnaEvidence,
  ({ one }) => ({
    dna: one(designDna, {
      fields: [designDnaEvidence.dnaId],
      references: [designDna.id],
    }),
    reference: one(references, {
      fields: [designDnaEvidence.referenceId],
      references: [references.id],
    }),
  }),
);

/* ---------------------------------------------------------------------------
   Visual capture pipeline (v2)

   `references.image` is intentionally left untouched — it remains the single
   author-supplied/preview URL. Captured assets live in their own table so a
   reference can carry many assets, of many kinds, across versions.
--------------------------------------------------------------------------- */

export const referenceAssets = sqliteTable(
  "reference_assets",
  {
    id: text("id").primaryKey(),
    referenceId: text("reference_id")
      .notNull()
      .references(() => references.id, { onDelete: "cascade" }),
    /** desktop | mobile | fullpage | hero | thumbnail — open for future kinds. */
    kind: text("kind").notNull(),
    /** Path relative to the assets root; never an external URL. */
    path: text("path").notNull(),
    format: text("format").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    fileSize: integer("file_size").notNull(),
    checksum: text("checksum").notNull(),
    viewportWidth: integer("viewport_width"),
    viewportHeight: integer("viewport_height"),
    deviceScaleFactor: integer("device_scale_factor"),
    /** Bumped on every recapture so history is preserved, not overwritten. */
    version: integer("version").notNull().default(1),
    capturedAt: text("captured_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("reference_asset_kind_version_idx").on(
      table.referenceId,
      table.kind,
      table.version,
    ),
  ],
);

export const captureRuns = sqliteTable("capture_runs", {
  id: text("id").primaryKey(),
  /** pending | running | completed | failed | cancelled */
  status: text("status").notNull().default("pending"),
  total: integer("total").notNull().default(0),
  completed: integer("completed").notNull().default(0),
  failed: integer("failed").notNull().default(0),
  skipped: integer("skipped").notNull().default(0),
  message: text("message"),
  startedAt: text("started_at"),
  finishedAt: text("finished_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const referenceAssetsRelations = relations(referenceAssets, ({ one }) => ({
  reference: one(references, {
    fields: [referenceAssets.referenceId],
    references: [references.id],
  }),
}));

/* ---------------------------------------------------------------------------
   Structured visual observations.

   One row = one objectively checkable statement about a captured reference,
   drawn from the closed vocabulary in domain/observations.ts. This is the layer
   AI Research and Design DNA read instead of re-analysing screenshots.
--------------------------------------------------------------------------- */
export const referenceObservations = sqliteTable(
  "reference_observations",
  {
    id: text("id").primaryKey(),
    referenceId: text("reference_id")
      .notNull()
      .references(() => references.id, { onDelete: "cascade" }),
    /** navigation | search | layout | typography | content | interaction | density | ai | conversion | accessibility | media | theme */
    category: text("category").notNull(),
    /** Controlled vocabulary term; validated in the domain layer. */
    trait: text("trait").notNull(),
    /** observed | inferred | authored — observed facts are the source of truth. */
    provenance: text("provenance").notNull().default("observed"),
    detail: text("detail"),
    /** 0-100, only meaningful for `inferred`. */
    confidence: integer("confidence"),
    /**
     * SET NULL rather than cascade: a recapture replaces assets, and losing the
     * evidence pointer must not delete the observation it justified.
     */
    evidenceAssetId: text("evidence_asset_id").references(
      () => referenceAssets.id,
      { onDelete: "set null" },
    ),
    evidenceNote: text("evidence_note"),
    recordedBy: text("recorded_by"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("observation_unique_idx").on(
      table.referenceId,
      table.category,
      table.trait,
      table.provenance,
    ),
  ],
);

export const referenceObservationsRelations = relations(
  referenceObservations,
  ({ one }) => ({
    reference: one(references, {
      fields: [referenceObservations.referenceId],
      references: [references.id],
    }),
    evidenceAsset: one(referenceAssets, {
      fields: [referenceObservations.evidenceAssetId],
      references: [referenceAssets.id],
    }),
  }),
);
