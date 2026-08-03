export interface Reference {
  id: string;
  title: string;
  source: string;
  url: string;
  image: string | null;
  type: string;
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
}

export interface ReferenceInput {
  title: string;
  source: string;
  url: string;
  image?: string | null;
  type: string;
  description?: string | null;
  whySaved?: string | null;
  whatToLearn?: string[];
  industries?: string[];
  pageTypes?: string[];
  styles?: string[];
  patterns?: string[];
  tags?: string[];
}

export interface Taxonomy {
  types: string[];
  sources: string[];
  industries: string[];
  pageTypes: string[];
  styles: string[];
  patterns: string[];
  tags: string[];
  projectTypes?: string[];
  contentTypes?: string[];
}

export interface DashboardStats {
  total: number;
  byType: { type: string; count: number }[];
  bySource: { source: string; count: number }[];
  recent: Reference[];
  industryCount: number;
  styleCount: number;
  patternCount: number;
}

export interface ImportPreviewRow {
  index: number;
  status: "valid" | "warning" | "error" | "duplicate";
  title: string | null;
  source: string | null;
  url: string | null;
  type: string | null;
  issues: { field?: string; message: string; severity: string }[];
}

export interface ImportPreviewResponse {
  summary: {
    total: number;
    valid: number;
    warnings: number;
    errors: number;
    duplicates: number;
  };
  records: ImportPreviewRow[];
  importableCount: number;
  error?: string;
}

export interface ImportConfirmResponse {
  imported: number;
  skipped: number;
  warnings: number;
  duplicates: number;
  errors: number;
  items: Reference[];
  records: ImportPreviewRow[];
}

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

export interface ResolveUrlResponse {
  originalUrl: string;
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  source: string;
  fetchFailed: boolean;
  warnings: string[];
  existingId: string | null;
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

export interface CollectionDetail extends CollectionSummary {
  references: Reference[];
}

export interface CollectionInput {
  name?: string;
  description?: string | null;
  coverImage?: string | null;
}

export type ProjectStatus = "active" | "archived";

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  clientName: string | null;
  industry: string | null;
  audience: string | null;
  location: string | null;
  projectType: string | null;
  designGoals: string | null;
  audienceNeeds: string | null;
  businessGoals: string | null;
  projectGoals: string | null;
  desiredStyles: string[];
  avoidStyles: string[];
  keyMessages: string | null;
  contentTypes: string[];
  requiredFeatures: string[];
  preferredSources: string[];
  referenceKeywords: string[];
  competitors: string[];
  competitorNotes: string | null;
  constraints: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  collectionCount: number;
  referenceCount: number;
}

export interface ProjectDetail extends ProjectSummary {
  collections: CollectionSummary[];
  references: Reference[];
}

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

export type ResearchCandidateStatus = "candidate" | "accepted" | "rejected";

export interface ResearchProviderStatus {
  search: { name: string; available: boolean };
  ai: { name: string; available: boolean };
}

export interface ResearchCandidate {
  id: string;
  researchId: string;
  title: string;
  url: string;
  source: string;
  description: string | null;
  image: string | null;
  relevanceScore: number | null;
  relevanceReason: string | null;
  matchedCriteria: string[];
  suggestedStyles: string[];
  suggestedPatterns: string[];
  suggestedTags: string[];
  status: ResearchCandidateStatus;
  referenceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchRunSummary {
  id: string;
  projectId: string;
  focus: string | null;
  status: string;
  sources: string[];
  resultLimit: number;
  query: string | null;
  message: string | null;
  createdAt: string;
  completedAt: string | null;
  candidateCount: number;
}

export interface ResearchRunDetail extends ResearchRunSummary {
  candidates: ResearchCandidate[];
}

export interface ResearchStartResponse {
  researchId: string;
  status: string;
  message: string | null;
  query: string | null;
  providers: ResearchProviderStatus;
  candidates: ResearchCandidate[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : `Request failed (${res.status})`;
    throw Object.assign(new Error(message), { status: res.status, data });
  }
  return data as T;
}

function toQuery(filters: ReferenceFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.source) params.set("source", filters.source);
  if (filters.industries?.length)
    params.set("industries", filters.industries.join(","));
  if (filters.pageTypes?.length)
    params.set("pageTypes", filters.pageTypes.join(","));
  if (filters.styles?.length) params.set("styles", filters.styles.join(","));
  if (filters.patterns?.length)
    params.set("patterns", filters.patterns.join(","));
  if (filters.tags?.length) params.set("tags", filters.tags.join(","));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  getDashboard: () => request<DashboardStats>("/api/dashboard"),
  getTaxonomy: () => request<Taxonomy>("/api/taxonomy"),
  listReferences: (filters: ReferenceFilters = {}) =>
    request<{ items: Reference[]; total: number }>(
      `/api/references${toQuery(filters)}`,
    ),
  getReference: (id: string) => request<Reference>(`/api/references/${id}`),
  createReference: (body: ReferenceInput) =>
    request<Reference>("/api/references", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateReference: (id: string, body: ReferenceInput) =>
    request<Reference>(`/api/references/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteReference: (id: string) =>
    request<void>(`/api/references/${id}`, { method: "DELETE" }),
  resolveReferenceUrl: (url: string) =>
    request<ResolveUrlResponse>("/api/references/resolve", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
  previewImport: (payload: unknown) =>
    request<ImportPreviewResponse>("/api/import/preview", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  confirmImport: (payload: unknown) =>
    request<ImportConfirmResponse>("/api/import/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listCollections: () =>
    request<{ items: CollectionSummary[]; total: number }>("/api/collections"),
  getCollection: (id: string) =>
    request<CollectionDetail>(`/api/collections/${id}`),
  createCollection: (body: CollectionInput) =>
    request<CollectionDetail>("/api/collections", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCollection: (id: string, body: CollectionInput) =>
    request<CollectionDetail>(`/api/collections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteCollection: (id: string) =>
    request<void>(`/api/collections/${id}`, { method: "DELETE" }),
  addReferencesToCollection: (id: string, referenceIds: string[]) =>
    request<{
      added: string[];
      skippedDuplicates: string[];
      missing: string[];
      collection: CollectionDetail;
    }>(`/api/collections/${id}/references`, {
      method: "POST",
      body: JSON.stringify({ referenceIds }),
    }),
  removeReferenceFromCollection: (id: string, referenceId: string) =>
    request<void>(`/api/collections/${id}/references/${referenceId}`, {
      method: "DELETE",
    }),
  listCollectionsForReference: (referenceId: string) =>
    request<{ items: CollectionSummary[]; total: number }>(
      `/api/references/${referenceId}/collections`,
    ),
  listProjects: (status?: ProjectStatus) =>
    request<{ items: ProjectSummary[]; total: number }>(
      `/api/projects${status ? `?status=${status}` : ""}`,
    ),
  getProject: (id: string) => request<ProjectDetail>(`/api/projects/${id}`),
  createProject: (body: ProjectInput) =>
    request<ProjectDetail>("/api/projects", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateProject: (id: string, body: ProjectInput) =>
    request<ProjectDetail>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteProject: (id: string) =>
    request<void>(`/api/projects/${id}`, { method: "DELETE" }),
  addCollectionsToProject: (id: string, collectionIds: string[]) =>
    request<{
      added: string[];
      skippedDuplicates: string[];
      missing: string[];
      project: ProjectDetail;
    }>(`/api/projects/${id}/collections`, {
      method: "POST",
      body: JSON.stringify({ collectionIds }),
    }),
  removeCollectionFromProject: (id: string, collectionId: string) =>
    request<void>(`/api/projects/${id}/collections/${collectionId}`, {
      method: "DELETE",
    }),
  listProjectsForCollection: (collectionId: string) =>
    request<{ items: ProjectSummary[]; total: number }>(
      `/api/collections/${collectionId}/projects`,
    ),
  getResearchProviders: () =>
    request<ResearchProviderStatus>("/api/research/providers"),
  startResearch: (body: {
    projectId: string;
    focus?: string | null;
    limit?: 10 | 20 | 30;
    sources?: string[];
  }) =>
    request<ResearchStartResponse>("/api/research", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getResearch: (id: string) =>
    request<ResearchRunDetail>(`/api/research/${id}`),
  listProjectResearch: (projectId: string) =>
    request<{ items: ResearchRunSummary[]; total: number }>(
      `/api/projects/${projectId}/research`,
    ),
  updateResearchCandidate: (
    candidateId: string,
    status: ResearchCandidateStatus,
  ) =>
    request<ResearchCandidate>(`/api/research/candidates/${candidateId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  addResearchToLibrary: (researchId: string, candidateIds: string[]) =>
    request<{
      created: number;
      reused: number;
      failed: Array<{ candidateId: string; error: string }>;
      items: Reference[];
      research: ResearchRunDetail;
    }>(`/api/research/${researchId}/library`, {
      method: "POST",
      body: JSON.stringify({ candidateIds }),
    }),
  addResearchToCollection: (
    researchId: string,
    collectionId: string,
    candidateIds: string[],
  ) =>
    request<{
      added: string[];
      skippedDuplicates: string[];
      missing: string[];
      collection: CollectionDetail;
    }>(`/api/research/${researchId}/collection`, {
      method: "POST",
      body: JSON.stringify({ collectionId, candidateIds }),
    }),
};
