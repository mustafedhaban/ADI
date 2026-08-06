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
  // --- visual capture pipeline (v2) ---
  captureStatus: CaptureStatus;
  captureError: string | null;
  capturedAt: string | null;
  captureAttempts: number;
  /** Locally-stored capture; falls back to `image` when null. */
  thumbnailUrl: string | null;
}

export type CaptureStatus =
  | "pending"
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export type AssetKind =
  | "desktop"
  | "mobile"
  | "fullpage"
  | "hero"
  | "thumbnail";

export interface ReferenceAsset {
  id: string;
  referenceId: string;
  kind: AssetKind;
  path: string;
  url: string;
  format: string;
  width: number;
  height: number;
  fileSize: number;
  checksum: string;
  viewportWidth: number | null;
  viewportHeight: number | null;
  deviceScaleFactor: number | null;
  version: number;
  capturedAt: string;
  createdAt: string;
}

export interface AssetsResponse {
  referenceId: string;
  captureStatus: CaptureStatus;
  captureError: string | null;
  capturedAt: string | null;
  captureAttempts: number;
  items: ReferenceAsset[];
  total: number;
}

export interface CaptureOutcome {
  referenceId: string;
  status: CaptureStatus;
  assets: ReferenceAsset[];
  error: string | null;
  version: number;
}

export interface CaptureRun {
  id: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  message: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface CaptureStats {
  byStatus: Record<CaptureStatus, number>;
  totalReferences: number;
  referencesWithAssets: number;
  assetCount: number;
  assetBytes: number;
  storage: { files: number; bytes: number };
}

export interface CaptureStatusResponse {
  driver: string;
  available: boolean;
  running: boolean;
  currentRunId: string | null;
  stats: Omit<CaptureStats, "storage">;
  storage: { files: number; bytes: number };
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

export type DesignDnaStatus = "draft" | "published";

export type DesignDnaSectionKey =
  | "visualLanguage"
  | "colorDirection"
  | "typography"
  | "layout"
  | "imagery"
  | "components"
  | "motionInteraction"
  | "contentPresentation"
  | "patterns"
  | "antiPatterns"
  | "keyInsights";

/** Field-group sections are objects of string arrays; keyInsights is a flat array. */
export type DesignDnaSectionValue = Record<string, string[]> | string[];

export type DesignDnaStructure = Record<
  DesignDnaSectionKey,
  DesignDnaSectionValue
>;

export interface DesignDnaSectionMeta {
  key: DesignDnaSectionKey;
  label: string;
  fields: string[] | null;
}

export interface DesignDnaEvidenceGroup {
  section: DesignDnaSectionKey;
  insight: string;
  references: Reference[];
}

export interface DesignDnaSummary {
  id: string;
  projectId: string;
  version: number;
  status: DesignDnaStatus;
  referenceCount: number;
  sourceCollectionIds: string[];
  evidenceCount: number;
  generatedAt: string;
  updatedAt: string;
}

export interface DesignDnaDetail extends DesignDnaSummary {
  structure: DesignDnaStructure;
  evidence: DesignDnaEvidenceGroup[];
}

export interface DesignDnaProviderStatus {
  ai: { name: string; available: boolean };
}

export interface ProjectDesignDnaResponse {
  current: DesignDnaDetail | null;
  versions: DesignDnaSummary[];
  referenceCount: number;
  providers: DesignDnaProviderStatus;
}


/* --- structured visual observations (v3) --- */

export type ObservationCategory =
  | "navigation" | "search" | "layout" | "typography" | "content"
  | "interaction" | "density" | "ai" | "conversion" | "accessibility"
  | "media" | "theme";

/** observed = fact read off a capture; inferred = conclusion; authored = note. */
export type Provenance = "observed" | "inferred" | "authored";

export interface Observation {
  id: string;
  referenceId: string;
  category: ObservationCategory;
  trait: string;
  provenance: Provenance;
  detail: string | null;
  confidence: number | null;
  evidenceAssetId: string | null;
  evidenceNote: string | null;
  recordedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ObservationVocabulary {
  categories: { id: ObservationCategory; label: string; traits: string[] }[];
  provenances: { id: Provenance; label: string }[];
}

export interface ReferenceObservations {
  referenceId: string;
  total: number;
  counts: Record<Provenance, number>;
  byCategory: {
    category: ObservationCategory;
    label: string;
    items: Observation[];
  }[];
  items: Observation[];
}

export interface TraitCount {
  category: ObservationCategory;
  trait: string;
  count: number;
  share: number;
}

export interface ObservationPatterns {
  provenance: Provenance;
  category: ObservationCategory | null;
  coverage: { referencesWithObservations: number; totalObservations: number };
  traits: TraitCount[];
  byCategory: { category: ObservationCategory; label: string; traits: TraitCount[] }[];
  cooccurrence: {
    category: ObservationCategory; trait: string;
    otherCategory: ObservationCategory; otherTrait: string; count: number;
  }[];
}

export interface ObservationComparison {
  provenance: Provenance;
  references: { id: string; title: string; url: string }[];
  totalTraits: number;
  sharedCount: number;
  rows: {
    category: ObservationCategory;
    label: string;
    trait: string;
    presentIn: string[];
    count: number;
    shared: boolean;
    unique: boolean;
  }[];
}

export interface CollectionObservations {
  collectionId: string;
  referenceCount: number;
  observedReferenceCount: number;
  topTraits: TraitCount[];
  distinctive: (TraitCount & { libraryShare: number; lift: number })[];
  byCategory: { category: ObservationCategory; label: string; traits: TraitCount[] }[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Only declare a JSON body when one is actually being sent. Fastify rejects a
  // request that advertises application/json but carries an empty body with
  // FST_ERR_CTP_EMPTY_JSON_BODY (400), which is what bodyless POSTs like
  // /api/capture/retry-failed and every DELETE were hitting.
  const headers: Record<string, string> = {
    ...(init?.body === undefined ? {} : { "Content-Type": "application/json" }),
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };

  const res = await fetch(path, { ...init, headers });

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

  // --- visual capture pipeline (v2) ---
  getReferenceAssets: (id: string, all = false) =>
    request<AssetsResponse>(
      `/api/references/${id}/assets${all ? "?all=true" : ""}`,
    ),
  captureReference: (id: string, force = false) =>
    request<CaptureOutcome>(`/api/references/${id}/capture`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),
  getCaptureStatus: () =>
    request<CaptureStatusResponse>("/api/capture/status"),
  getCaptureStats: () => request<CaptureStats>("/api/capture/stats"),
  startCaptureBatch: (body: {
    referenceIds?: string[];
    force?: boolean;
    includeFailed?: boolean;
    limit?: number;
  } = {}) =>
    request<{ accepted: boolean; runId: string | null; queued: number | null }>(
      "/api/capture/batch",
      { method: "POST", body: JSON.stringify(body) },
    ),
  retryFailedCaptures: () =>
    request<{ accepted: boolean; runId: string | null }>(
      "/api/capture/retry-failed",
      { method: "POST" },
    ),
  cancelCapture: () =>
    request<{ cancelled: boolean; runId: string | null }>(
      "/api/capture/cancel",
      { method: "POST" },
    ),
  listCaptureRuns: () =>
    request<{ items: CaptureRun[]; total: number }>("/api/capture/runs"),
  getCaptureRun: (runId: string) =>
    request<CaptureRun>(`/api/capture/runs/${runId}`),
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
  getDesignDnaSections: () =>
    request<{ items: DesignDnaSectionMeta[] }>("/api/design-dna/sections"),
  getProjectDesignDna: (projectId: string) =>
    request<ProjectDesignDnaResponse>(`/api/projects/${projectId}/design-dna`),
  listProjectDesignDnaVersions: (projectId: string) =>
    request<{ items: DesignDnaSummary[]; total: number }>(
      `/api/projects/${projectId}/design-dna/versions`,
    ),
  generateDesignDna: (projectId: string) =>
    request<DesignDnaDetail>(`/api/projects/${projectId}/design-dna`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  getDesignDna: (id: string) =>
    request<DesignDnaDetail>(`/api/design-dna/${id}`),
  updateDesignDna: (id: string, structure: Partial<DesignDnaStructure>) =>
    request<DesignDnaDetail>(`/api/design-dna/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ structure }),
    }),
  publishDesignDna: (id: string) =>
    request<DesignDnaDetail>(`/api/design-dna/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  unpublishDesignDna: (id: string) =>
    request<DesignDnaDetail>(`/api/design-dna/${id}/unpublish`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  // --- structured visual observations (v3) ---
  getObservationVocabulary: () =>
    request<ObservationVocabulary>("/api/observations/vocabulary"),
  getReferenceObservations: (id: string) =>
    request<ReferenceObservations>(`/api/references/${id}/observations`),
  addObservations: (id: string, observations: unknown[]) =>
    request<{ accepted: number; items: Observation[] }>(
      `/api/references/${id}/observations`,
      { method: "POST", body: JSON.stringify({ observations }) },
    ),
  deleteObservation: (observationId: string) =>
    request<void>(`/api/observations/${observationId}`, { method: "DELETE" }),
  getObservationPatterns: (params: { category?: string; minCount?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.category) q.set("category", params.category);
    if (params.minCount) q.set("minCount", String(params.minCount));
    const qs = q.toString();
    return request<ObservationPatterns>(
      `/api/observations/patterns${qs ? `?${qs}` : ""}`,
    );
  },
  compareObservations: (referenceIds: string[]) =>
    request<ObservationComparison>(
      `/api/observations/compare?referenceIds=${referenceIds.join(",")}`,
    ),
  getCollectionObservations: (id: string) =>
    request<CollectionObservations>(`/api/collections/${id}/observations`),
  getReferencesWithTrait: (category: string, trait: string) =>
    request<{ category: string; trait: string; total: number; items: { id: string; title: string; url: string }[] }>(
      `/api/observations/trait?category=${encodeURIComponent(category)}&trait=${encodeURIComponent(trait)}`,
    ),
};
