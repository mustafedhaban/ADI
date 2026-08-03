export interface CollectionInput {
  name?: string;
  description?: string | null;
  coverImage?: string | null;
}

export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
  referenceCount: number;
  coverImages: string[];
}

export interface ValidationIssue {
  field?: string;
  message: string;
}

export function validateCollectionInput(
  input: unknown,
  options: { partial?: boolean } = {},
): { data: CollectionInput | null; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const partial = options.partial ?? false;

  if (!input || typeof input !== "object") {
    return {
      data: null,
      issues: [{ message: "Body must be an object" }],
    };
  }

  const record = input as Record<string, unknown>;

  if (!partial || "name" in record) {
    if (typeof record.name !== "string" || !record.name.trim()) {
      issues.push({
        field: "name",
        message: "Collection name is required and cannot be empty",
      });
    }
  }

  if (
    "description" in record &&
    record.description !== null &&
    record.description !== undefined &&
    typeof record.description !== "string"
  ) {
    issues.push({
      field: "description",
      message: "description must be a string",
    });
  }

  if (
    "coverImage" in record &&
    record.coverImage !== null &&
    record.coverImage !== undefined &&
    typeof record.coverImage !== "string"
  ) {
    issues.push({
      field: "coverImage",
      message: "coverImage must be a string",
    });
  }

  if (issues.length) {
    return { data: null, issues };
  }

  const data: CollectionInput = {};
  if ("name" in record) {
    data.name = String(record.name).trim();
  }
  if ("description" in record) {
    data.description =
      typeof record.description === "string"
        ? record.description.trim() || null
        : null;
  }
  if ("coverImage" in record) {
    data.coverImage =
      typeof record.coverImage === "string"
        ? record.coverImage.trim() || null
        : null;
  }

  return { data, issues };
}

export function parseReferenceIds(body: unknown): {
  referenceIds: string[];
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  if (!body || typeof body !== "object") {
    return {
      referenceIds: [],
      issues: [{ message: "Body must be an object" }],
    };
  }

  const record = body as Record<string, unknown>;
  const ids: string[] = [];

  if (typeof record.referenceId === "string" && record.referenceId.trim()) {
    ids.push(record.referenceId.trim());
  }

  if (Array.isArray(record.referenceIds)) {
    for (const value of record.referenceIds) {
      if (typeof value !== "string" || !value.trim()) {
        issues.push({
          field: "referenceIds",
          message: "referenceIds must be an array of non-empty strings",
        });
        return { referenceIds: [], issues };
      }
      ids.push(value.trim());
    }
  }

  const unique = [...new Set(ids)];
  if (!unique.length) {
    issues.push({
      field: "referenceIds",
      message: "Provide referenceId or referenceIds",
    });
  }

  return { referenceIds: unique, issues };
}
