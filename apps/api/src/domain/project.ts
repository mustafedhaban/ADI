import {
  industrySet,
  sourceSet,
  styleSet,
} from "./taxonomy.js";

export const PROJECT_STATUSES = ["active", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Project types aligned with common ADI research use cases / taxonomy. */
export const PROJECT_TYPES = [
  "Website",
  "Website Redesign",
  "Landing Page",
  "Branding",
  "Mobile App",
  "Dashboard",
  "Other",
] as const;

export const CONTENT_TYPES = [
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
] as const;

export const projectTypeSet = new Set<string>(PROJECT_TYPES);
export const projectStatusSet = new Set<string>(PROJECT_STATUSES);
export const contentTypeSet = new Set<string>(CONTENT_TYPES);

export interface ProjectInput {
  name?: string;
  description?: string | null;
  clientName?: string | null;
  industry?: string | null;
  audience?: string | null;
  location?: string | null;
  projectType?: string | null;
  designGoals?: string | null;
  status?: ProjectStatus;
  // Research brief
  audienceNeeds?: string | null;
  businessGoals?: string | null;
  projectGoals?: string | null;
  desiredStyles?: string[];
  avoidStyles?: string[];
  keyMessages?: string | null;
  contentTypes?: string[];
  requiredFeatures?: string[];
  preferredSources?: string[];
  referenceKeywords?: string[];
  competitors?: string[];
  competitorNotes?: string | null;
  constraints?: string | null;
}

export interface ValidationIssue {
  field?: string;
  message: string;
}

function optionalString(
  record: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[],
): string | null | undefined {
  if (!(field in record)) return undefined;
  const value = record[field];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    issues.push({ field, message: `${field} must be a string` });
    return undefined;
  }
  return value.trim() || null;
}

function optionalStringArray(
  record: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[],
  allowed?: Set<string>,
): string[] | undefined {
  if (!(field in record)) return undefined;
  const value = record[field];
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) {
    issues.push({ field, message: `${field} must be an array` });
    return undefined;
  }

  const items: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") {
      issues.push({
        field,
        message: `${field} must be an array of strings`,
      });
      return undefined;
    }
    const trimmed = entry.trim();
    if (!trimmed) continue;
    if (allowed && !allowed.has(trimmed)) {
      issues.push({
        field,
        message: `Unknown ${field} value: "${trimmed}"`,
      });
      return undefined;
    }
    items.push(trimmed);
  }

  return [...new Set(items)];
}

export function validateProjectInput(
  input: unknown,
  options: { partial?: boolean } = {},
): { data: ProjectInput | null; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const partial = options.partial ?? false;

  if (!input || typeof input !== "object") {
    return { data: null, issues: [{ message: "Body must be an object" }] };
  }

  const record = input as Record<string, unknown>;

  if (!partial || "name" in record) {
    if (typeof record.name !== "string" || !record.name.trim()) {
      issues.push({
        field: "name",
        message: "Project name is required and cannot be empty",
      });
    }
  }

  const description = optionalString(record, "description", issues);
  const clientName = optionalString(record, "clientName", issues);
  const industry = optionalString(record, "industry", issues);
  const audience = optionalString(record, "audience", issues);
  const location = optionalString(record, "location", issues);
  const projectType = optionalString(record, "projectType", issues);
  const designGoals = optionalString(record, "designGoals", issues);
  const audienceNeeds = optionalString(record, "audienceNeeds", issues);
  const businessGoals = optionalString(record, "businessGoals", issues);
  const projectGoals = optionalString(record, "projectGoals", issues);
  const keyMessages = optionalString(record, "keyMessages", issues);
  const competitorNotes = optionalString(record, "competitorNotes", issues);
  const constraints = optionalString(record, "constraints", issues);

  const desiredStyles = optionalStringArray(
    record,
    "desiredStyles",
    issues,
    styleSet,
  );
  const avoidStyles = optionalStringArray(
    record,
    "avoidStyles",
    issues,
    styleSet,
  );
  const contentTypes = optionalStringArray(
    record,
    "contentTypes",
    issues,
    contentTypeSet,
  );
  const requiredFeatures = optionalStringArray(
    record,
    "requiredFeatures",
    issues,
  );
  const preferredSources = optionalStringArray(
    record,
    "preferredSources",
    issues,
    sourceSet,
  );
  const referenceKeywords = optionalStringArray(
    record,
    "referenceKeywords",
    issues,
  );
  const competitors = optionalStringArray(record, "competitors", issues);

  if (industry && !industrySet.has(industry)) {
    issues.push({
      field: "industry",
      message: `Unknown industry value: "${industry}"`,
    });
  }

  if (projectType && !projectTypeSet.has(projectType)) {
    issues.push({
      field: "projectType",
      message: `Unknown projectType value: "${projectType}"`,
    });
  }

  let status: ProjectStatus | undefined;
  if ("status" in record) {
    if (
      typeof record.status !== "string" ||
      !projectStatusSet.has(record.status)
    ) {
      issues.push({
        field: "status",
        message: 'status must be "active" or "archived"',
      });
    } else {
      status = record.status as ProjectStatus;
    }
  }

  if (issues.length) return { data: null, issues };

  const data: ProjectInput = {};
  if ("name" in record) data.name = String(record.name).trim();
  if ("description" in record) data.description = description ?? null;
  if ("clientName" in record) data.clientName = clientName ?? null;
  if ("industry" in record) data.industry = industry ?? null;
  if ("audience" in record) data.audience = audience ?? null;
  if ("location" in record) data.location = location ?? null;
  if ("projectType" in record) data.projectType = projectType ?? null;
  if ("designGoals" in record) data.designGoals = designGoals ?? null;
  if ("audienceNeeds" in record) data.audienceNeeds = audienceNeeds ?? null;
  if ("businessGoals" in record) data.businessGoals = businessGoals ?? null;
  if ("projectGoals" in record) data.projectGoals = projectGoals ?? null;
  if ("desiredStyles" in record) data.desiredStyles = desiredStyles ?? [];
  if ("avoidStyles" in record) data.avoidStyles = avoidStyles ?? [];
  if ("keyMessages" in record) data.keyMessages = keyMessages ?? null;
  if ("contentTypes" in record) data.contentTypes = contentTypes ?? [];
  if ("requiredFeatures" in record)
    data.requiredFeatures = requiredFeatures ?? [];
  if ("preferredSources" in record)
    data.preferredSources = preferredSources ?? [];
  if ("referenceKeywords" in record)
    data.referenceKeywords = referenceKeywords ?? [];
  if ("competitors" in record) data.competitors = competitors ?? [];
  if ("competitorNotes" in record)
    data.competitorNotes = competitorNotes ?? null;
  if ("constraints" in record) data.constraints = constraints ?? null;
  if (status) data.status = status;

  return { data, issues };
}

export function parseCollectionIds(body: unknown): {
  collectionIds: string[];
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  if (!body || typeof body !== "object") {
    return { collectionIds: [], issues: [{ message: "Body must be an object" }] };
  }

  const record = body as Record<string, unknown>;
  const ids: string[] = [];

  if (typeof record.collectionId === "string" && record.collectionId.trim()) {
    ids.push(record.collectionId.trim());
  }

  if (Array.isArray(record.collectionIds)) {
    for (const value of record.collectionIds) {
      if (typeof value !== "string" || !value.trim()) {
        issues.push({
          field: "collectionIds",
          message: "collectionIds must be an array of non-empty strings",
        });
        return { collectionIds: [], issues };
      }
      ids.push(value.trim());
    }
  }

  const unique = [...new Set(ids)];
  if (!unique.length) {
    issues.push({
      field: "collectionIds",
      message: "Provide collectionId or collectionIds",
    });
  }

  return { collectionIds: unique, issues };
}

export function emptyResearchBriefArrays() {
  return {
    desiredStyles: [] as string[],
    avoidStyles: [] as string[],
    contentTypes: [] as string[],
    requiredFeatures: [] as string[],
    preferredSources: [] as string[],
    referenceKeywords: [] as string[],
    competitors: [] as string[],
  };
}
