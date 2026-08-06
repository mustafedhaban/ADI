import {
  industrySet,
  pageTypeSet,
  patternSet,
  sourceSet,
  styleSet,
  typeSet,
  type ReferenceType,
} from "./taxonomy.js";

export interface ReferenceInput {
  title: string;
  source: string;
  url: string;
  image?: string | null;
  type: string;
  description?: string | null;
  whySaved?: string | null;
  whatToLearn?: string[] | null;
  industries?: string[];
  pageTypes?: string[];
  styles?: string[];
  patterns?: string[];
  tags?: string[];
}

export interface ReferenceRecord extends ReferenceInput {
  id: string;
  type: ReferenceType;
  image: string | null;
  description: string | null;
  whySaved: string | null;
  whatToLearn: string[];
  industries: string[];
  pageTypes: string[];
  styles: string[];
  patterns: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // --- visual capture pipeline (v2) ---
  captureStatus: string;
  captureError: string | null;
  capturedAt: string | null;
  captureAttempts: number;
  /** Best available captured image; falls back to `image` when absent. */
  thumbnailUrl: string | null;
}

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  field?: string;
  message: string;
  severity: ValidationSeverity;
}

export interface ValidatedImportRecord {
  index: number;
  data: ReferenceInput | null;
  status: "valid" | "warning" | "error" | "duplicate";
  issues: ValidationIssue[];
  normalizedUrl?: string;
}

export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  parsed.hash = "";
  // Normalize host casing; keep path case-sensitive
  parsed.hostname = parsed.hostname.toLowerCase();

  let href = parsed.toString();
  // Strip trailing slash except for root
  if (href.endsWith("/") && parsed.pathname !== "/") {
    href = href.slice(0, -1);
  }

  return href;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asStringArray(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return null;
  if (!value.every((v) => typeof v === "string")) return null;
  return value.map((v) => v.trim()).filter(Boolean);
}

function validateTaxonomyValues(
  values: string[],
  allowed: Set<string>,
  field: string,
  issues: ValidationIssue[],
  strict: boolean,
): string[] {
  const valid: string[] = [];
  for (const value of values) {
    if (allowed.has(value)) {
      valid.push(value);
    } else if (strict) {
      issues.push({
        field,
        message: `Unknown ${field} value: "${value}"`,
        severity: "error",
      });
    } else {
      issues.push({
        field,
        message: `Unknown ${field} value: "${value}"`,
        severity: "warning",
      });
      valid.push(value);
    }
  }
  return valid;
}

/** Validate a single reference for create/update (strict taxonomy). */
export function validateReferenceInput(
  input: unknown,
  options: { requireAll?: boolean } = {},
): { data: ReferenceInput | null; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  if (!input || typeof input !== "object") {
    return {
      data: null,
      issues: [{ message: "Record must be an object", severity: "error" }],
    };
  }

  const record = input as Record<string, unknown>;
  const requireAll = options.requireAll ?? true;

  if (requireAll || "title" in record) {
    if (!isNonEmptyString(record.title)) {
      issues.push({
        field: "title",
        message: "title is required and cannot be empty",
        severity: "error",
      });
    }
  }

  if (requireAll || "source" in record) {
    if (!isNonEmptyString(record.source)) {
      issues.push({
        field: "source",
        message: "source is required and cannot be empty",
        severity: "error",
      });
    } else if (!sourceSet.has(record.source.trim())) {
      issues.push({
        field: "source",
        message: `source should be a known source or "Other" (got "${record.source}")`,
        severity: "warning",
      });
    }
  }

  let normalizedUrl: string | null = null;
  if (requireAll || "url" in record) {
    if (!isNonEmptyString(record.url)) {
      issues.push({
        field: "url",
        message: "url is required and cannot be empty",
        severity: "error",
      });
    } else {
      normalizedUrl = normalizeUrl(record.url);
      if (!normalizedUrl) {
        issues.push({
          field: "url",
          message: "url must be a valid HTTP or HTTPS URL",
          severity: "error",
        });
      }
    }
  }

  if (requireAll || "type" in record) {
    if (!isNonEmptyString(record.type)) {
      issues.push({
        field: "type",
        message: "type is required and cannot be empty",
        severity: "error",
      });
    } else if (!typeSet.has(record.type.trim())) {
      issues.push({
        field: "type",
        message: `type must be one of: website, ui, mobile, branding, component`,
        severity: "error",
      });
    }
  }

  const industries = asStringArray(record.industries);
  if (industries === null) {
    issues.push({
      field: "industries",
      message: "industries must be an array of strings",
      severity: "error",
    });
  }

  const pageTypes = asStringArray(record.pageTypes);
  if (pageTypes === null) {
    issues.push({
      field: "pageTypes",
      message: "pageTypes must be an array of strings",
      severity: "error",
    });
  }

  const styles = asStringArray(record.styles);
  if (styles === null) {
    issues.push({
      field: "styles",
      message: "styles must be an array of strings",
      severity: "error",
    });
  }

  const patterns = asStringArray(record.patterns);
  if (patterns === null) {
    issues.push({
      field: "patterns",
      message: "patterns must be an array of strings",
      severity: "error",
    });
  }

  const tags = asStringArray(record.tags);
  if (tags === null) {
    issues.push({
      field: "tags",
      message: "tags must be an array of strings",
      severity: "error",
    });
  }

  const whatToLearn = asStringArray(record.whatToLearn);
  if (whatToLearn === null) {
    issues.push({
      field: "whatToLearn",
      message: "whatToLearn must be an array of strings",
      severity: "error",
    });
  }

  if (record.image !== undefined && record.image !== null && typeof record.image !== "string") {
    issues.push({
      field: "image",
      message: "image must be a string",
      severity: "error",
    });
  }

  if (record.description !== undefined && record.description !== null && typeof record.description !== "string") {
    issues.push({
      field: "description",
      message: "description must be a string",
      severity: "error",
    });
  }

  if (record.whySaved !== undefined && record.whySaved !== null && typeof record.whySaved !== "string") {
    issues.push({
      field: "whySaved",
      message: "whySaved must be a string",
      severity: "error",
    });
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  if (hasErrors) {
    return { data: null, issues };
  }

  const validatedIndustries = validateTaxonomyValues(
    industries ?? [],
    industrySet,
    "industries",
    issues,
    true,
  );
  const validatedPageTypes = validateTaxonomyValues(
    pageTypes ?? [],
    pageTypeSet,
    "pageTypes",
    issues,
    true,
  );
  const validatedStyles = validateTaxonomyValues(
    styles ?? [],
    styleSet,
    "styles",
    issues,
    true,
  );
  const validatedPatterns = validateTaxonomyValues(
    patterns ?? [],
    patternSet,
    "patterns",
    issues,
    true,
  );

  if (issues.some((i) => i.severity === "error")) {
    return { data: null, issues };
  }

  const data: ReferenceInput = {
    title: String(record.title).trim(),
    source: String(record.source).trim(),
    url: normalizedUrl ?? String(record.url).trim(),
    type: String(record.type).trim(),
    image:
      typeof record.image === "string" && record.image.trim()
        ? record.image.trim()
        : null,
    description:
      typeof record.description === "string" ? record.description.trim() || null : null,
    whySaved:
      typeof record.whySaved === "string" ? record.whySaved.trim() || null : null,
    whatToLearn: whatToLearn ?? [],
    industries: validatedIndustries,
    pageTypes: validatedPageTypes,
    styles: validatedStyles,
    patterns: validatedPatterns,
    tags: tags ?? [],
  };

  return { data, issues };
}

/** Validate an import payload and check duplicates against existing URLs. */
export function validateImportPayload(
  payload: unknown,
  existingUrls: Set<string>,
): {
  ok: boolean;
  structureError?: string;
  records: ValidatedImportRecord[];
  summary: {
    total: number;
    valid: number;
    warnings: number;
    errors: number;
    duplicates: number;
  };
} {
  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      structureError: "Root JSON value must be an object",
      records: [],
      summary: { total: 0, valid: 0, warnings: 0, errors: 0, duplicates: 0 },
    };
  }

  const root = payload as Record<string, unknown>;
  if (!Array.isArray(root.references)) {
    return {
      ok: false,
      structureError: 'Root object must contain a "references" array',
      records: [],
      summary: { total: 0, valid: 0, warnings: 0, errors: 0, duplicates: 0 },
    };
  }

  const seenInBatch = new Set<string>();
  const records: ValidatedImportRecord[] = [];

  root.references.forEach((item, index) => {
    const { data, issues } = validateReferenceInput(item);
    let status: ValidatedImportRecord["status"] = "valid";
    let normalizedUrl = data?.url;

    if (!data || issues.some((i) => i.severity === "error")) {
      status = "error";
    } else if (normalizedUrl) {
      if (existingUrls.has(normalizedUrl) || seenInBatch.has(normalizedUrl)) {
        status = "duplicate";
        issues.push({
          field: "url",
          message: existingUrls.has(normalizedUrl)
            ? "URL already exists in the library"
            : "Duplicate URL within this import batch",
          severity: "error",
        });
      } else {
        seenInBatch.add(normalizedUrl);
        if (issues.some((i) => i.severity === "warning")) {
          status = "warning";
        }
      }
    }

    records.push({
      index,
      data: status === "error" || status === "duplicate" ? data : data,
      status,
      issues,
      normalizedUrl,
    });
  });

  const summary = {
    total: records.length,
    valid: records.filter((r) => r.status === "valid").length,
    warnings: records.filter((r) => r.status === "warning").length,
    errors: records.filter((r) => r.status === "error").length,
    duplicates: records.filter((r) => r.status === "duplicate").length,
  };

  return { ok: true, records, summary };
}

/** Records that can be imported: valid + warning (not error/duplicate). */
export function importableRecords(
  records: ValidatedImportRecord[],
): ValidatedImportRecord[] {
  return records.filter(
    (r) => (r.status === "valid" || r.status === "warning") && r.data,
  );
}
