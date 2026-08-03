import {
  contextFromProject,
  generateResearchQueries,
  type ResearchLimit,
  type ResearchSourceOption,
} from "../domain/research.js";
import { resolveUrlPreview } from "../domain/resolve-url.js";
import { normalizeUrl } from "../domain/validation.js";
import { UrlSafetyError } from "../domain/url-safety.js";
import type { ProjectDetail } from "../repositories/project-repository.js";
import type { ReferenceRepository } from "../repositories/reference-repository.js";
import type {
  CreateCandidateInput,
  ResearchRepository,
  ResearchRunDetail,
} from "../repositories/research-repository.js";
import {
  SearchProviderUnavailableError,
  type AnalysisContext,
  type ResearchAIProvider,
  type SearchProvider,
  type SearchResult,
} from "./types.js";
import { UNAVAILABLE_REASON } from "./ai/openai.js";

export class ResearchAgent {
  constructor(
    private readonly researchRepo: ResearchRepository,
    private readonly referenceRepo: ReferenceRepository,
    private readonly searchProvider: SearchProvider,
    private readonly aiProvider: ResearchAIProvider,
  ) {}

  getProviderStatus() {
    return {
      search: {
        name: this.searchProvider.name,
        available: this.searchProvider.available,
      },
      ai: {
        name: this.aiProvider.name,
        available: this.aiProvider.available,
      },
    };
  }

  async run(input: {
    project: ProjectDetail;
    focus: string | null;
    limit: ResearchLimit;
    sources: ResearchSourceOption[];
  }): Promise<ResearchRunDetail> {
    if (!this.searchProvider.available) {
      throw new SearchProviderUnavailableError(
        "Search provider is not configured. Set TAVILY_API_KEY to enable web research.",
      );
    }

    const run = this.researchRepo.createRun({
      projectId: input.project.id,
      focus: input.focus,
      sources: input.sources,
      limit: input.limit,
    });

    const queries = generateResearchQueries(
      contextFromProject(input.project, input.focus, input.sources),
    );
    const primaryQuery = queries[0] ?? "design website inspiration";

    this.researchRepo.markRunning(run.id, queries.join(" | "));

    try {
      const searchHits = await this.collectSearchResults(
        queries,
        input.limit,
        input.sources,
      );

      const resolved = await this.resolveHits(searchHits, input.limit);

      const analysisContext: AnalysisContext = {
        projectName: input.project.name,
        industry: input.project.industry,
        audience: input.project.audience,
        projectGoals: input.project.projectGoals,
        desiredStyles: input.project.desiredStyles,
        avoidStyles: input.project.avoidStyles,
        contentTypes: input.project.contentTypes,
        requiredFeatures: input.project.requiredFeatures,
        referenceKeywords: input.project.referenceKeywords,
        competitors: input.project.competitors,
        focus: input.focus,
      };

      const analyses = await this.aiProvider.analyzeCandidates(
        analysisContext,
        resolved.map((item) => ({
          title: item.title,
          url: item.url,
          source: item.source,
          description: item.description,
          image: item.image,
          snippet: item.snippet,
        })),
      );

      const candidates: CreateCandidateInput[] = resolved.map((item, index) => {
        const analysis = analyses[index] ?? {
          relevanceScore: null,
          relevanceReason: UNAVAILABLE_REASON,
          matchedCriteria: [],
          suggestedStyles: [],
          suggestedPatterns: [],
          suggestedTags: [],
        };
        return {
          title: item.title,
          url: item.url,
          source: item.source,
          description: item.description,
          image: item.image,
          analysis,
        };
      });

      this.researchRepo.addCandidates(run.id, candidates);

      const messageParts: string[] = [];
      if (!this.aiProvider.available) {
        messageParts.push("AI analysis unavailable.");
      }
      if (!candidates.length) {
        messageParts.push("No usable public URLs were found from search results.");
      }

      this.researchRepo.markCompleted(
        run.id,
        messageParts.length ? messageParts.join(" ") : null,
      );

      return this.researchRepo.findRunDetail(run.id)!;
    } catch (err) {
      if (err instanceof SearchProviderUnavailableError) {
        this.researchRepo.markFailed(run.id, err.message);
        throw err;
      }
      const message =
        err instanceof Error ? err.message : "Research run failed";
      this.researchRepo.markFailed(run.id, message);
      throw err;
    }
  }

  private async collectSearchResults(
    queries: string[],
    limit: number,
    sources: ResearchSourceOption[],
  ): Promise<SearchResult[]> {
    const byUrl = new Map<string, SearchResult>();

    for (const query of queries) {
      if (byUrl.size >= limit * 2) break;
      const hits = await this.searchProvider.search(query, {
        limit: Math.min(limit, 20),
        sources,
      });
      for (const hit of hits) {
        const normalized = normalizeUrl(hit.url);
        if (!normalized) continue;
        if (!byUrl.has(normalized)) {
          byUrl.set(normalized, { ...hit, url: normalized });
        }
      }
    }

    return [...byUrl.values()].slice(0, limit * 2);
  }

  private async resolveHits(
    hits: SearchResult[],
    limit: number,
  ): Promise<
    Array<{
      title: string;
      url: string;
      source: string;
      description: string | null;
      image: string | null;
      snippet: string | null;
    }>
  > {
    const resolved: Array<{
      title: string;
      url: string;
      source: string;
      description: string | null;
      image: string | null;
      snippet: string | null;
    }> = [];

    for (const hit of hits) {
      if (resolved.length >= limit) break;
      try {
        const preview = await resolveUrlPreview(hit.url, {
          findExistingId: (normalized) =>
            this.referenceRepo.findByUrl(normalized)?.id ?? null,
        });
        resolved.push({
          title: preview.title?.trim() || hit.title || preview.url,
          url: preview.url,
          source: preview.source || "Other",
          description:
            preview.description?.trim() || hit.snippet?.trim() || null,
          image: preview.image,
          snippet: hit.snippet ?? null,
        });
      } catch (err) {
        if (err instanceof UrlSafetyError) {
          continue;
        }
        // Keep search hit with minimal metadata when fetch fails safely
        const normalized = normalizeUrl(hit.url);
        if (!normalized) continue;
        resolved.push({
          title: hit.title || normalized,
          url: normalized,
          source: "Other",
          description: hit.snippet ?? null,
          image: null,
          snippet: hit.snippet ?? null,
        });
      }
    }

    return resolved;
  }
}
