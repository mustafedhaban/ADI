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
