import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "../db/index.js";
import {
  industries,
  pageTypes,
  patterns,
  referenceIndustries,
  referencePageTypes,
  referencePatterns,
  referenceStyles,
  referenceTags,
  references,
  styles,
  tags,
} from "../db/schema.js";
import type { ReferenceInput, ReferenceRecord } from "../domain/validation.js";
import { referenceAssets } from "../db/schema.js";
import { assetUrl } from "../capture/storage.js";

export interface ReferenceFilters {
  q?: string;
  type?: string;
  source?: string;
  industries?: string[];
  pageTypes?: string[];
  styles?: string[];
  patterns?: string[];
  tags?: string[];
}

function parseWhatToLearn(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function attachRelations(
  db: Db,
  referenceId: string,
  input: ReferenceInput,
) {
  const industryMap = ensureNamedRowsSync(db, industries, input.industries ?? []);
  const pageTypeMap = ensureNamedRowsSync(db, pageTypes, input.pageTypes ?? []);
  const styleMap = ensureNamedRowsSync(db, styles, input.styles ?? []);
  const patternMap = ensureNamedRowsSync(db, patterns, input.patterns ?? []);
  const tagMap = ensureNamedRowsSync(db, tags, input.tags ?? []);

  for (const id of industryMap.values()) {
    db.insert(referenceIndustries)
      .values({ referenceId, industryId: id })
      .onConflictDoNothing()
      .run();
  }
  for (const id of pageTypeMap.values()) {
    db.insert(referencePageTypes)
      .values({ referenceId, pageTypeId: id })
      .onConflictDoNothing()
      .run();
  }
  for (const id of styleMap.values()) {
    db.insert(referenceStyles)
      .values({ referenceId, styleId: id })
      .onConflictDoNothing()
      .run();
  }
  for (const id of patternMap.values()) {
    db.insert(referencePatterns)
      .values({ referenceId, patternId: id })
      .onConflictDoNothing()
      .run();
  }
  for (const id of tagMap.values()) {
    db.insert(referenceTags)
      .values({ referenceId, tagId: id })
      .onConflictDoNothing()
      .run();
  }
}

function ensureNamedRowsSync(
  db: Db,
  table: typeof industries | typeof pageTypes | typeof styles | typeof patterns | typeof tags,
  names: string[],
): Map<string, number> {
  const map = new Map<string, number>();
  if (names.length === 0) return map;

  const existing = db
    .select()
    .from(table)
    .where(inArray(table.name, names))
    .all();

  for (const row of existing) {
    map.set(row.name, row.id);
  }

  for (const name of names) {
    if (map.has(name)) continue;
    const inserted = db
      .insert(table)
      .values({ name })
      .returning({ id: table.id, name: table.name })
      .get();
    map.set(inserted.name, inserted.id);
  }

  return map;
}

function clearRelations(db: Db, referenceId: string) {
  db.delete(referenceIndustries)
    .where(eq(referenceIndustries.referenceId, referenceId))
    .run();
  db.delete(referencePageTypes)
    .where(eq(referencePageTypes.referenceId, referenceId))
    .run();
  db.delete(referenceStyles)
    .where(eq(referenceStyles.referenceId, referenceId))
    .run();
  db.delete(referencePatterns)
    .where(eq(referencePatterns.referenceId, referenceId))
    .run();
  db.delete(referenceTags)
    .where(eq(referenceTags.referenceId, referenceId))
    .run();
}

function loadRelations(db: Db, referenceId: string) {
  const industryRows = db
    .select({ name: industries.name })
    .from(referenceIndustries)
    .innerJoin(industries, eq(referenceIndustries.industryId, industries.id))
    .where(eq(referenceIndustries.referenceId, referenceId))
    .all();

  const pageTypeRows = db
    .select({ name: pageTypes.name })
    .from(referencePageTypes)
    .innerJoin(pageTypes, eq(referencePageTypes.pageTypeId, pageTypes.id))
    .where(eq(referencePageTypes.referenceId, referenceId))
    .all();

  const styleRows = db
    .select({ name: styles.name })
    .from(referenceStyles)
    .innerJoin(styles, eq(referenceStyles.styleId, styles.id))
    .where(eq(referenceStyles.referenceId, referenceId))
    .all();

  const patternRows = db
    .select({ name: patterns.name })
    .from(referencePatterns)
    .innerJoin(patterns, eq(referencePatterns.patternId, patterns.id))
    .where(eq(referencePatterns.referenceId, referenceId))
    .all();

  const tagRows = db
    .select({ name: tags.name })
    .from(referenceTags)
    .innerJoin(tags, eq(referenceTags.tagId, tags.id))
    .where(eq(referenceTags.referenceId, referenceId))
    .all();

  return {
    industries: industryRows.map((r) => r.name),
    pageTypes: pageTypeRows.map((r) => r.name),
    styles: styleRows.map((r) => r.name),
    patterns: patternRows.map((r) => r.name),
    tags: tagRows.map((r) => r.name),
  };
}

function toRecord(
  row: typeof references.$inferSelect,
  relations: ReturnType<typeof loadRelations>,
  thumbnailUrl: string | null = null,
): ReferenceRecord {
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    url: row.url,
    image: row.image,
    type: row.type as ReferenceRecord["type"],
    description: row.description,
    whySaved: row.whySaved,
    whatToLearn: parseWhatToLearn(row.whatToLearn),
    industries: relations.industries,
    pageTypes: relations.pageTypes,
    styles: relations.styles,
    patterns: relations.patterns,
    tags: relations.tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    captureStatus: row.captureStatus ?? "pending",
    captureError: row.captureError ?? null,
    capturedAt: row.capturedAt ?? null,
    captureAttempts: row.captureAttempts ?? 0,
    thumbnailUrl,
  };
}

/**
 * Current thumbnail per reference, resolved in a single query.
 * Highest asset version wins; `references.image` remains the fallback and is
 * never overwritten by the capture pipeline.
 */
function loadThumbnails(db: Db, ids?: string[]): Map<string, string> {
  const rows = db
    .select({
      referenceId: referenceAssets.referenceId,
      path: referenceAssets.path,
      version: referenceAssets.version,
    })
    .from(referenceAssets)
    .where(
      ids?.length
        ? and(
            eq(referenceAssets.kind, "thumbnail"),
            inArray(referenceAssets.referenceId, ids),
          )
        : eq(referenceAssets.kind, "thumbnail"),
    )
    .all();

  const best = new Map<string, { version: number; path: string }>();
  for (const row of rows) {
    const current = best.get(row.referenceId);
    if (!current || row.version > current.version) {
      best.set(row.referenceId, { version: row.version, path: row.path });
    }
  }

  const map = new Map<string, string>();
  for (const [id, entry] of best) map.set(id, assetUrl(entry.path));
  return map;
}

export class ReferenceRepository {
  constructor(private readonly db: Db) {}

  listAllUrls(): Set<string> {
    const rows = this.db.select({ url: references.url }).from(references).all();
    return new Set(rows.map((r) => r.url));
  }

  findById(id: string): ReferenceRecord | null {
    const row = this.db
      .select()
      .from(references)
      .where(eq(references.id, id))
      .get();
    if (!row) return null;
    return toRecord(
      row,
      loadRelations(this.db, id),
      loadThumbnails(this.db, [id]).get(id) ?? null,
    );
  }

  findByUrl(url: string): ReferenceRecord | null {
    const row = this.db
      .select()
      .from(references)
      .where(eq(references.url, url))
      .get();
    if (!row) return null;
    return toRecord(
      row,
      loadRelations(this.db, row.id),
      loadThumbnails(this.db, [row.id]).get(row.id) ?? null,
    );
  }

  list(filters: ReferenceFilters = {}): ReferenceRecord[] {
    const conditions = [];

    if (filters.q) {
      const term = `%${filters.q}%`;
      conditions.push(
        or(
          like(references.title, term),
          like(references.description, term),
          like(references.whySaved, term),
          like(references.url, term),
          like(references.source, term),
        ),
      );
    }

    if (filters.type) {
      conditions.push(eq(references.type, filters.type));
    }

    if (filters.source) {
      conditions.push(eq(references.source, filters.source));
    }

    let rows = this.db
      .select()
      .from(references)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(references.createdAt))
      .all();

    const thumbs = loadThumbnails(
      this.db,
      rows.map((r) => r.id),
    );
    let results = rows.map((row) =>
      toRecord(row, loadRelations(this.db, row.id), thumbs.get(row.id) ?? null),
    );

    if (filters.industries?.length) {
      results = results.filter((r) =>
        filters.industries!.every((v) => r.industries.includes(v)),
      );
    }
    if (filters.pageTypes?.length) {
      results = results.filter((r) =>
        filters.pageTypes!.every((v) => r.pageTypes.includes(v)),
      );
    }
    if (filters.styles?.length) {
      results = results.filter((r) =>
        filters.styles!.every((v) => r.styles.includes(v)),
      );
    }
    if (filters.patterns?.length) {
      results = results.filter((r) =>
        filters.patterns!.every((v) => r.patterns.includes(v)),
      );
    }
    if (filters.tags?.length) {
      results = results.filter((r) =>
        filters.tags!.every((v) => r.tags.includes(v)),
      );
    }

    return results;
  }

  create(input: ReferenceInput): ReferenceRecord {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .insert(references)
      .values({
        id,
        title: input.title,
        source: input.source,
        url: input.url,
        image: input.image ?? null,
        type: input.type,
        description: input.description ?? null,
        whySaved: input.whySaved ?? null,
        whatToLearn: JSON.stringify(input.whatToLearn ?? []),
        createdAt: now,
        updatedAt: now,
      })
      .run();

    attachRelations(this.db, id, input);
    return this.findById(id)!;
  }

  update(id: string, input: ReferenceInput): ReferenceRecord | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    this.db
      .update(references)
      .set({
        title: input.title,
        source: input.source,
        url: input.url,
        image: input.image ?? null,
        type: input.type,
        description: input.description ?? null,
        whySaved: input.whySaved ?? null,
        whatToLearn: JSON.stringify(input.whatToLearn ?? []),
        updatedAt: now,
      })
      .where(eq(references.id, id))
      .run();

    clearRelations(this.db, id);
    attachRelations(this.db, id, input);
    return this.findById(id);
  }

  delete(id: string): boolean {
    const existing = this.findById(id);
    if (!existing) return false;
    clearRelations(this.db, id);
    this.db.delete(references).where(eq(references.id, id)).run();
    return true;
  }

  createMany(inputs: ReferenceInput[]): ReferenceRecord[] {
    return this.db.transaction(() => {
      return inputs.map((input) => this.create(input));
    });
  }

  dashboardStats() {
    const total = this.db
      .select({ count: sql<number>`count(*)` })
      .from(references)
      .get()?.count ?? 0;

    const byType = this.db
      .select({
        type: references.type,
        count: sql<number>`count(*)`,
      })
      .from(references)
      .groupBy(references.type)
      .all();

    const bySource = this.db
      .select({
        source: references.source,
        count: sql<number>`count(*)`,
      })
      .from(references)
      .groupBy(references.source)
      .all();

    const recent = this.list({}).slice(0, 8);

    return {
      total,
      byType,
      bySource,
      recent,
      industryCount: this.db.select({ count: sql<number>`count(*)` }).from(industries).get()?.count ?? 0,
      styleCount: this.db.select({ count: sql<number>`count(*)` }).from(styles).get()?.count ?? 0,
      patternCount: this.db.select({ count: sql<number>`count(*)` }).from(patterns).get()?.count ?? 0,
    };
  }
}

export class TaxonomyRepository {
  constructor(private readonly db: Db) {}

  getAll() {
    return {
      types: ["website", "ui", "mobile", "branding", "component"],
      sources: [
        "Awwwards",
        "Behance",
        "Dribbble",
        "Pinterest",
        "Mobbin",
        "Land-book",
        "Godly",
        "SiteInspire",
        "Are.na",
        "Savee",
        "X",
        "Figma Community",
        "Other",
      ],
      industries: this.db.select().from(industries).all().map((r) => r.name),
      pageTypes: this.db.select().from(pageTypes).all().map((r) => r.name),
      styles: this.db.select().from(styles).all().map((r) => r.name),
      patterns: this.db.select().from(patterns).all().map((r) => r.name),
      tags: this.db.select().from(tags).all().map((r) => r.name),
      projectTypes: [
        "Website",
        "Website Redesign",
        "Landing Page",
        "Branding",
        "Mobile App",
        "Dashboard",
        "Other",
      ],
      contentTypes: [
        "Text",
        "Photography",
        "Video",
        "Illustration",
        "Data",
        "Case Studies",
        "Testimonials",
        "Blog",
        "Documentation",
        "Other",
      ],
    };
  }
}
