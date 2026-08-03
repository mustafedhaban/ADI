export interface SearchResult {
  title: string;
  url: string;
  snippet?: string | null;
  sourceHint?: string | null;
}

export interface SearchOptions {
  limit: number;
  /** Extra site: operators or source labels for filtering. */
  sources?: string[];
}

export class SearchProviderUnavailableError extends Error {
  readonly code = "search_unavailable";

  constructor(message = "Search provider is not configured") {
    super(message);
    this.name = "SearchProviderUnavailableError";
  }
}

export interface SearchProvider {
  readonly name: string;
  readonly available: boolean;
  search(query: string, options: SearchOptions): Promise<SearchResult[]>;
}

export interface CandidateAnalysis {
  relevanceScore: number | null;
  relevanceReason: string;
  matchedCriteria: string[];
  suggestedStyles: string[];
  suggestedPatterns: string[];
  suggestedTags: string[];
}

export interface AnalysisCandidateInput {
  title: string;
  url: string;
  source: string;
  description: string | null;
  image: string | null;
  snippet?: string | null;
}

export interface AnalysisContext {
  projectName: string;
  industry: string | null;
  audience: string | null;
  projectGoals: string | null;
  desiredStyles: string[];
  avoidStyles: string[];
  contentTypes: string[];
  requiredFeatures: string[];
  referenceKeywords: string[];
  competitors: string[];
  focus: string | null;
}

export interface ResearchAIProvider {
  readonly name: string;
  readonly available: boolean;
  analyzeCandidates(
    context: AnalysisContext,
    candidates: AnalysisCandidateInput[],
  ): Promise<(CandidateAnalysis | null)[]>;
}
