import {
  SearchProviderUnavailableError,
  type SearchOptions,
  type SearchProvider,
  type SearchResult,
} from "../types.js";

/**
 * Tavily Search API provider.
 * Requires TAVILY_API_KEY. Does not invent results when unavailable.
 */
export class TavilySearchProvider implements SearchProvider {
  readonly name = "tavily";

  constructor(
    private readonly apiKey: string | undefined = process.env.TAVILY_API_KEY,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  get available(): boolean {
    return Boolean(this.apiKey?.trim());
  }

  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    if (!this.available || !this.apiKey) {
      throw new SearchProviderUnavailableError(
        "Search provider is not configured. Set TAVILY_API_KEY to enable web research.",
      );
    }

    const response = await this.fetchImpl("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        query,
        max_results: Math.min(Math.max(options.limit, 1), 20),
        search_depth: "basic",
        include_answer: false,
        include_images: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Tavily search failed (${response.status}): ${text.slice(0, 200)}`,
      );
    }

    const payload = (await response.json()) as {
      results?: Array<{
        title?: string;
        url?: string;
        content?: string;
      }>;
    };

    const results: SearchResult[] = [];
    for (const item of payload.results ?? []) {
      if (!item.url || !item.title) continue;
      results.push({
        title: item.title.trim(),
        url: item.url.trim(),
        snippet: item.content?.trim() || null,
      });
    }
    return results;
  }
}

export class UnavailableSearchProvider implements SearchProvider {
  readonly name = "unavailable";
  readonly available = false;

  async search(): Promise<SearchResult[]> {
    throw new SearchProviderUnavailableError(
      "Search provider is not configured. Set TAVILY_API_KEY to enable web research.",
    );
  }
}

export function createSearchProvider(): SearchProvider {
  const tavily = new TavilySearchProvider();
  if (tavily.available) return tavily;
  return new UnavailableSearchProvider();
}
