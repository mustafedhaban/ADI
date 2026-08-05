/**
 * Design DNA v1 — structured synthesis of what a project's references demonstrate.
 *
 * This module is DB- and provider-agnostic: it owns the DNA shape, normalization,
 * and validation of AI output so any provider implementation can reuse it.
 */

export const DESIGN_DNA_STATUSES = ["draft", "published"] as const;
export type DesignDnaStatus = (typeof DESIGN_DNA_STATUSES)[number];
export const designDnaStatusSet = new Set<string>(DESIGN_DNA_STATUSES);

/** Section definitions drive validation, merging, and UI ordering. */
export const DESIGN_DNA_SECTIONS = [
  {
    key: "visualLanguage",
    label: "Visual Language",
    fields: ["overallStyle", "visualCharacteristics", "designPrinciples"],
  },
  {
    key: "colorDirection",
    label: "Color Direction",
    fields: [
      "paletteCharacteristics",
      "dominantApproach",
      "contrast",
      "usagePatterns",
    ],
  },
  {
    key: "typography",
    label: "Typography",
    fields: [
      "typographyStyles",
      "hierarchyPatterns",
      "scaleCharacteristics",
      "fontCharacteristics",
    ],
  },
  {
    key: "layout",
    label: "Layout",
    fields: [
      "layoutPatterns",
      "gridPatterns",
      "spacingPatterns",
      "compositionPatterns",
    ],
  },
  {
    key: "imagery",
    label: "Imagery",
    fields: [
      "imageryStyles",
      "photographyCharacteristics",
      "illustrationCharacteristics",
      "imageTreatment",
    ],
  },
  {
    key: "components",
    label: "Components",
    fields: [
      "navigationPatterns",
      "heroPatterns",
      "cardPatterns",
      "ctaPatterns",
      "footerPatterns",
      "otherPatterns",
    ],
  },
  {
    key: "motionInteraction",
    label: "Motion & Interaction",
    fields: ["animationPatterns", "interactionPatterns", "transitionPatterns"],
  },
  {
    key: "contentPresentation",
    label: "Content Presentation",
    fields: ["storytellingPatterns", "contentHierarchy", "contentPatterns"],
  },
  {
    key: "patterns",
    label: "Patterns",
    fields: ["recurringPatterns", "strongPatterns", "emergingPatterns"],
  },
  {
    key: "antiPatterns",
    label: "Anti-Patterns",
    fields: ["avoidPatterns", "overusedPatterns", "conflictsWithBrief"],
  },
  /** keyInsights is a flat string array, not a field group. */
  { key: "keyInsights", label: "Key Insights", fields: null },
] as const;

export type DesignDnaSectionKey = (typeof DESIGN_DNA_SECTIONS)[number]["key"];

export const DESIGN_DNA_SECTION_KEYS = DESIGN_DNA_SECTIONS.map(
  (section) => section.key,
) as DesignDnaSectionKey[];

const sectionByKey = new Map(
  DESIGN_DNA_SECTIONS.map((section) => [section.key as string, section]),
);

export function isDesignDnaSectionKey(
  value: unknown,
): value is DesignDnaSectionKey {
  return typeof value === "string" && sectionByKey.has(value);
}

export function designDnaSectionLabel(key: DesignDnaSectionKey): string {
  return sectionByKey.get(key)?.label ?? key;
}

export interface DesignDnaStructure {
  visualLanguage: {
    overallStyle: string[];
    visualCharacteristics: string[];
    designPrinciples: string[];
  };
  colorDirection: {
    paletteCharacteristics: string[];
    dominantApproach: string[];
    contrast: string[];
    usagePatterns: string[];
  };
  typography: {
    typographyStyles: string[];
    hierarchyPatterns: string[];
    scaleCharacteristics: string[];
    fontCharacteristics: string[];
  };
  layout: {
    layoutPatterns: string[];
    gridPatterns: string[];
    spacingPatterns: string[];
    compositionPatterns: string[];
  };
  imagery: {
    imageryStyles: string[];
    photographyCharacteristics: string[];
    illustrationCharacteristics: string[];
    imageTreatment: string[];
  };
  components: {
    navigationPatterns: string[];
    heroPatterns: string[];
    cardPatterns: string[];
    ctaPatterns: string[];
    footerPatterns: string[];
    otherPatterns: string[];
  };
  motionInteraction: {
    animationPatterns: string[];
    interactionPatterns: string[];
    transitionPatterns: string[];
  };
  contentPresentation: {
    storytellingPatterns: string[];
    contentHierarchy: string[];
    contentPatterns: string[];
  };
  patterns: {
    recurringPatterns: string[];
    strongPatterns: string[];
    emergingPatterns: string[];
  };
  antiPatterns: {
    avoidPatterns: string[];
    overusedPatterns: string[];
    conflictsWithBrief: string[];
  };
  keyInsights: string[];
}

export interface ValidationIssue {
  field?: string;
  message: string;
}

const MAX_ITEMS_PER_FIELD = 24;
const MAX_KEY_INSIGHTS = 24;
const MAX_ITEM_LENGTH = 500;

export function emptyDesignDnaStructure(): DesignDnaStructure {
  const structure = {} as Record<string, unknown>;
  for (const section of DESIGN_DNA_SECTIONS) {
    if (section.fields === null) {
      structure[section.key] = [];
      continue;
    }
    const group: Record<string, string[]> = {};
    for (const field of section.fields) group[field] = [];
    structure[section.key] = group;
  }
  return structure as unknown as DesignDnaStructure;
}

function normalizeStringList(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim().slice(0, MAX_ITEM_LENGTH);
    if (!trimmed) continue;
    const dedupeKey = trimmed.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    items.push(trimmed);
    if (items.length >= limit) break;
  }
  return items;
}

/** Total number of populated entries across every section. */
export function countDesignDnaEntries(structure: DesignDnaStructure): number {
  const record = structure as unknown as Record<string, unknown>;
  let total = 0;
  for (const section of DESIGN_DNA_SECTIONS) {
    const value = record[section.key];
    if (section.fields === null) {
      total += Array.isArray(value) ? value.length : 0;
      continue;
    }
    const group = (value ?? {}) as Record<string, unknown>;
    for (const field of section.fields) {
      const items = group[field];
      total += Array.isArray(items) ? items.length : 0;
    }
  }
  return total;
}

/** Number of sections that contain at least one entry. */
export function countPopulatedSections(structure: DesignDnaStructure): number {
  const record = structure as unknown as Record<string, unknown>;
  let populated = 0;
  for (const section of DESIGN_DNA_SECTIONS) {
    const value = record[section.key];
    if (section.fields === null) {
      if (Array.isArray(value) && value.length) populated += 1;
      continue;
    }
    const group = (value ?? {}) as Record<string, unknown>;
    const hasContent = section.fields.some((field) => {
      const items = group[field];
      return Array.isArray(items) && items.length > 0;
    });
    if (hasContent) populated += 1;
  }
  return populated;
}

/** Flatten every string in one section — used to reconcile evidence after edits. */
export function sectionEntries(
  structure: DesignDnaStructure,
  key: DesignDnaSectionKey,
): string[] {
  const section = sectionByKey.get(key);
  if (!section) return [];
  const value = (structure as unknown as Record<string, unknown>)[key];
  if (section.fields === null) {
    return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  }
  const group = (value ?? {}) as Record<string, unknown>;
  const entries: string[] = [];
  for (const field of section.fields) {
    const items = group[field];
    if (Array.isArray(items)) {
      entries.push(...items.filter((v): v is string => typeof v === "string"));
    }
  }
  return entries;
}

/**
 * Normalize an arbitrary object into a full DesignDnaStructure.
 * Shape violations are reported as issues; unknown keys are ignored.
 */
export function normalizeDesignDnaStructure(
  raw: unknown,
  options: { path?: string } = {},
): { data: DesignDnaStructure; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const prefix = options.path ? `${options.path}.` : "";
  const data = emptyDesignDnaStructure();

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    issues.push({
      field: options.path ?? "structure",
      message: "Design DNA must be an object",
    });
    return { data, issues };
  }

  const record = raw as Record<string, unknown>;
  const target = data as unknown as Record<string, unknown>;

  for (const section of DESIGN_DNA_SECTIONS) {
    if (!(section.key in record)) continue;
    const value = record[section.key];

    if (section.fields === null) {
      if (value === null || value === undefined) continue;
      if (!Array.isArray(value)) {
        issues.push({
          field: `${prefix}${section.key}`,
          message: `${section.key} must be an array of strings`,
        });
        continue;
      }
      target[section.key] = normalizeStringList(value, MAX_KEY_INSIGHTS);
      continue;
    }

    if (value === null || value === undefined) continue;
    if (typeof value !== "object" || Array.isArray(value)) {
      issues.push({
        field: `${prefix}${section.key}`,
        message: `${section.key} must be an object`,
      });
      continue;
    }

    const group = value as Record<string, unknown>;
    const normalized = target[section.key] as Record<string, string[]>;
    for (const field of section.fields) {
      if (!(field in group)) continue;
      const items = group[field];
      if (items === null || items === undefined) continue;
      if (!Array.isArray(items)) {
        issues.push({
          field: `${prefix}${section.key}.${field}`,
          message: `${section.key}.${field} must be an array of strings`,
        });
        continue;
      }
      normalized[field] = normalizeStringList(items, MAX_ITEMS_PER_FIELD);
    }
  }

  return { data, issues };
}

export interface DesignDnaEvidenceEntry {
  section: DesignDnaSectionKey;
  insight: string;
  referenceIds: string[];
}

/**
 * Resolve AI-reported evidence into reference IDs.
 *
 * The AI is given references by index and never sees database IDs, so indexes
 * are mapped here and anything out of range is dropped rather than trusted.
 */
export function normalizeDesignDnaEvidence(
  raw: unknown,
  referenceIds: string[],
): { data: DesignDnaEvidenceEntry[]; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (raw === null || raw === undefined) return { data: [], issues };
  if (!Array.isArray(raw)) {
    issues.push({ field: "evidence", message: "evidence must be an array" });
    return { data: [], issues };
  }

  const byKey = new Map<string, DesignDnaEvidenceEntry>();

  for (const row of raw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const record = row as Record<string, unknown>;

    if (!isDesignDnaSectionKey(record.section)) continue;
    if (typeof record.insight !== "string") continue;
    const insight = record.insight.trim().slice(0, MAX_ITEM_LENGTH);
    if (!insight) continue;

    const indexes = Array.isArray(record.referenceIndexes)
      ? record.referenceIndexes
      : Array.isArray(record.referenceIndices)
        ? record.referenceIndices
        : [];

    const resolved: string[] = [];
    for (const value of indexes) {
      const index = typeof value === "number" ? value : Number(value);
      if (!Number.isInteger(index)) continue;
      const referenceId = referenceIds[index];
      if (!referenceId) continue;
      if (!resolved.includes(referenceId)) resolved.push(referenceId);
    }

    if (!resolved.length) continue;

    const key = `${record.section}::${insight.toLowerCase()}`;
    const existing = byKey.get(key);
    if (existing) {
      for (const referenceId of resolved) {
        if (!existing.referenceIds.includes(referenceId)) {
          existing.referenceIds.push(referenceId);
        }
      }
      continue;
    }

    byKey.set(key, {
      section: record.section,
      insight,
      referenceIds: resolved,
    });
  }

  return { data: [...byKey.values()], issues };
}

export interface DesignDnaPayload {
  structure: DesignDnaStructure;
  evidence: DesignDnaEvidenceEntry[];
}

/**
 * Validate a raw AI synthesis payload. Returns `data: null` when the payload is
 * unusable so callers never persist malformed DNA.
 */
export function parseDesignDnaPayload(
  raw: unknown,
  referenceIds: string[],
): { data: DesignDnaPayload | null; issues: ValidationIssue[] } {
  const structureResult = normalizeDesignDnaStructure(raw);
  const issues = [...structureResult.issues];

  if (issues.length) return { data: null, issues };

  const structure = structureResult.data;

  if (!structure.keyInsights.length) {
    issues.push({
      field: "keyInsights",
      message: "Design DNA must include at least one key insight",
    });
  }

  if (countPopulatedSections(structure) < 2) {
    issues.push({
      field: "structure",
      message:
        "Design DNA must populate at least two sections from the reference evidence",
    });
  }

  if (issues.length) return { data: null, issues };

  const evidenceRaw =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>).evidence
      : undefined;
  const evidenceResult = normalizeDesignDnaEvidence(evidenceRaw, referenceIds);

  return {
    data: { structure, evidence: evidenceResult.data },
    issues: evidenceResult.issues,
  };
}

export interface DesignDnaEditInput {
  structure?: Partial<DesignDnaStructure>;
  /** Section keys present in `structure` — used to reconcile evidence. */
  touchedSections: DesignDnaSectionKey[];
}

/**
 * Validate a manual edit. Only the sections/fields present in the body are
 * touched; everything else is preserved from the stored DNA.
 */
export function validateDesignDnaEdit(input: unknown): {
  data: DesignDnaEditInput | null;
  issues: ValidationIssue[];
} {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { data: null, issues: [{ message: "Body must be an object" }] };
  }

  const record = input as Record<string, unknown>;
  const rawStructure =
    "structure" in record ? record.structure : pickSectionKeys(record);

  if (rawStructure === undefined) {
    return {
      data: null,
      issues: [
        {
          field: "structure",
          message: "Provide a structure object with the sections to update",
        },
      ],
    };
  }

  if (
    !rawStructure ||
    typeof rawStructure !== "object" ||
    Array.isArray(rawStructure)
  ) {
    return {
      data: null,
      issues: [{ field: "structure", message: "structure must be an object" }],
    };
  }

  const provided = rawStructure as Record<string, unknown>;
  const touchedSections = DESIGN_DNA_SECTION_KEYS.filter(
    (key) => key in provided,
  );

  if (!touchedSections.length) {
    return {
      data: null,
      issues: [
        {
          field: "structure",
          message: `structure must contain at least one known section (${DESIGN_DNA_SECTION_KEYS.join(", ")})`,
        },
      ],
    };
  }

  const { data, issues } = normalizeDesignDnaStructure(provided, {
    path: "structure",
  });
  if (issues.length) return { data: null, issues };

  const partial: Partial<DesignDnaStructure> = {};
  const source = data as unknown as Record<string, unknown>;
  for (const key of touchedSections) {
    (partial as Record<string, unknown>)[key] = source[key];
  }

  return { data: { structure: partial, touchedSections }, issues: [] };
}

function pickSectionKeys(
  record: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const picked: Record<string, unknown> = {};
  let found = false;
  for (const key of DESIGN_DNA_SECTION_KEYS) {
    if (key in record) {
      picked[key] = record[key];
      found = true;
    }
  }
  return found ? picked : undefined;
}

/** Replace whole sections of `base` with the sections present in `patch`. */
export function mergeDesignDnaStructure(
  base: DesignDnaStructure,
  patch: Partial<DesignDnaStructure>,
): DesignDnaStructure {
  const merged = normalizeDesignDnaStructure(base).data;
  const target = merged as unknown as Record<string, unknown>;
  const source = patch as unknown as Record<string, unknown>;
  for (const key of DESIGN_DNA_SECTION_KEYS) {
    if (key in source) target[key] = source[key];
  }
  return merged;
}
