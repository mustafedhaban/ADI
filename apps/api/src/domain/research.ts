export const RESEARCH_LIMITS = [10, 20, 30] as const;
export type ResearchLimit = (typeof RESEARCH_LIMITS)[number];

export const RESEARCH_SOURCES = [
  "Web",
  "Awwwards",
  "Behance",
  "Dribbble",
  "Pinterest",
  "Mobbin",
  "SiteInspire",
  "Land-book",
  "Other",
] as const;
export type ResearchSourceOption = (typeof RESEARCH_SOURCES)[number];

export const RESEARCH_RUN_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
] as const;
export type ResearchRunStatus = (typeof RESEARCH_RUN_STATUSES)[number];

export const CANDIDATE_STATUSES = [
  "candidate",
  "accepted",
  "rejected",
] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export interface ResearchRequestInput {
  projectId: string;
  focus?: string | null;
  limit: ResearchLimit;
  sources: ResearchSourceOption[];
}

export interface ValidationIssue {
  field?: string;
  message: string;
}

const researchLimitSet = new Set<number>(RESEARCH_LIMITS);
const researchSourceSet = new Set<string>(RESEARCH_SOURCES);

/** Site operators for constraining search to known design galleries. */
export const RESEARCH_SOURCE_SITE_HINTS: Record<
  Exclude<ResearchSourceOption, "Web" | "Other">,
  string
> = {
  Awwwards: "site:awwwards.com",
  Behance: "site:behance.net",
  Dribbble: "site:dribbble.com",
  Pinterest: "site:pinterest.com",
  Mobbin: "site:mobbin.com",
  SiteInspire: "site:siteinspire.com",
  "Land-book": "site:land-book.com",
};

export function validateResearchRequest(input: unknown): {
  data: ResearchRequestInput | null;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  if (!input || typeof input !== "object") {
    return { data: null, issues: [{ message: "Body must be an object" }] };
  }

  const record = input as Record<string, unknown>;

  if (typeof record.projectId !== "string" || !record.projectId.trim()) {
    issues.push({
      field: "projectId",
      message: "projectId is required",
    });
  }

  let focus: string | null = null;
  if ("focus" in record) {
    if (record.focus === null || record.focus === undefined) {
      focus = null;
    } else if (typeof record.focus === "string") {
      focus = record.focus.trim() || null;
    } else {
      issues.push({ field: "focus", message: "focus must be a string" });
    }
  }

  let limit: ResearchLimit = 20;
  if ("limit" in record) {
    const value = Number(record.limit);
    if (!researchLimitSet.has(value)) {
      issues.push({
        field: "limit",
        message: "limit must be 10, 20, or 30",
      });
    } else {
      limit = value as ResearchLimit;
    }
  }

  let sources: ResearchSourceOption[] = ["Web"];
  if ("sources" in record) {
    if (!Array.isArray(record.sources) || !record.sources.length) {
      issues.push({
        field: "sources",
        message: "sources must be a non-empty array",
      });
    } else {
      const parsed: ResearchSourceOption[] = [];
      for (const entry of record.sources) {
        if (typeof entry !== "string" || !researchSourceSet.has(entry)) {
          issues.push({
            field: "sources",
            message: `Unknown research source: "${String(entry)}"`,
          });
          return { data: null, issues };
        }
        parsed.push(entry as ResearchSourceOption);
      }
      sources = [...new Set(parsed)];
    }
  }

  if (issues.length) return { data: null, issues };

  return {
    data: {
      projectId: String(record.projectId).trim(),
      focus,
      limit,
      sources,
    },
    issues,
  };
}

export interface QueryGenerationContext {
  name?: string | null;
  industry?: string | null;
  projectType?: string | null;
  audience?: string | null;
  projectGoals?: string | null;
  desiredStyles?: string[];
  avoidStyles?: string[];
  contentTypes?: string[];
  requiredFeatures?: string[];
  referenceKeywords?: string[];
  preferredSources?: string[];
  competitors?: string[];
  focus?: string | null;
  sources?: ResearchSourceOption[];
}

/**
 * Build web search queries from project research brief + optional focus.
 * Kept as a pure domain function so ranking/phrasing can improve later.
 */
export function generateResearchQueries(
  context: QueryGenerationContext,
): string[] {
  const parts: string[] = [];

  if (context.focus?.trim()) {
    parts.push(context.focus.trim());
  }

  if (context.industry) parts.push(context.industry);
  if (context.projectType) parts.push(context.projectType);
  else parts.push("website");

  if (context.desiredStyles?.length) {
    parts.push(...context.desiredStyles.slice(0, 3));
  }

  if (context.contentTypes?.length) {
    parts.push(...context.contentTypes.slice(0, 2));
  }

  if (context.referenceKeywords?.length) {
    parts.push(...context.referenceKeywords.slice(0, 5));
  }

  if (context.requiredFeatures?.length) {
    parts.push(...context.requiredFeatures.slice(0, 2));
  }

  const core = [
    "best",
    ...parts.filter(Boolean),
    "design",
    "inspiration",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const queries = [core];

  if (context.projectGoals?.trim()) {
    queries.push(
      `${context.industry ?? ""} ${context.projectType ?? "website"} ${context.projectGoals.trim()} design`
        .replace(/\s+/g, " ")
        .trim(),
    );
  }

  if (context.competitors?.length) {
    queries.push(
      `${context.competitors.slice(0, 2).join(" ")} website design alternative inspiration`
        .replace(/\s+/g, " ")
        .trim(),
    );
  }

  const sourceHints = (context.sources ?? ["Web"]).filter(
    (s): s is Exclude<ResearchSourceOption, "Web" | "Other"> =>
      s !== "Web" && s !== "Other" && s in RESEARCH_SOURCE_SITE_HINTS,
  );

  if (sourceHints.length) {
    for (const source of sourceHints.slice(0, 3)) {
      queries.push(
        `${RESEARCH_SOURCE_SITE_HINTS[source]} ${core}`.replace(/\s+/g, " ").trim(),
      );
    }
  }

  // Prefer sources from brief when no explicit gallery filters
  if (
    !sourceHints.length &&
    context.preferredSources?.length &&
    (context.sources ?? []).includes("Web")
  ) {
    for (const preferred of context.preferredSources.slice(0, 2)) {
      if (
        preferred in RESEARCH_SOURCE_SITE_HINTS ||
        (RESEARCH_SOURCES as readonly string[]).includes(preferred)
      ) {
        const hint =
          RESEARCH_SOURCE_SITE_HINTS[
            preferred as keyof typeof RESEARCH_SOURCE_SITE_HINTS
          ];
        if (hint) {
          queries.push(`${hint} ${core}`.replace(/\s+/g, " ").trim());
        }
      }
    }
  }

  return [...new Set(queries.filter(Boolean))].slice(0, 5);
}

export function contextFromProject(
  project: {
    name: string;
    industry: string | null;
    projectType: string | null;
    audience: string | null;
    projectGoals: string | null;
    desiredStyles: string[];
    avoidStyles: string[];
    contentTypes: string[];
    requiredFeatures: string[];
    referenceKeywords: string[];
    preferredSources: string[];
    competitors: string[];
  },
  focus?: string | null,
  sources?: ResearchSourceOption[],
): QueryGenerationContext {
  return {
    name: project.name,
    industry: project.industry,
    projectType: project.projectType,
    audience: project.audience,
    projectGoals: project.projectGoals,
    desiredStyles: project.desiredStyles,
    avoidStyles: project.avoidStyles,
    contentTypes: project.contentTypes,
    requiredFeatures: project.requiredFeatures,
    referenceKeywords: project.referenceKeywords,
    preferredSources: project.preferredSources,
    competitors: project.competitors,
    focus,
    sources,
  };
}

export function filterTaxonomyValues(
  values: string[],
  allowed: Set<string>,
): string[] {
  return [...new Set(values.map((v) => v.trim()).filter((v) => allowed.has(v)))];
}
