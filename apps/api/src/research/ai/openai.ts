import {
  patternSet,
  styleSet,
} from "../../domain/taxonomy.js";
import { filterTaxonomyValues } from "../../domain/research.js";
import type {
  AnalysisCandidateInput,
  AnalysisContext,
  CandidateAnalysis,
  ResearchAIProvider,
} from "../types.js";

const UNAVAILABLE_REASON = "AI analysis unavailable.";

function emptyUnavailableAnalysis(): CandidateAnalysis {
  return {
    relevanceScore: null,
    relevanceReason: UNAVAILABLE_REASON,
    matchedCriteria: [],
    suggestedStyles: [],
    suggestedPatterns: [],
    suggestedTags: [],
  };
}

/**
 * OpenAI Chat Completions provider for candidate relevance analysis.
 * Uses OPENAI_API_KEY (optional OPENAI_BASE_URL, OPENAI_MODEL).
 */
export class OpenAIResearchProvider implements ResearchAIProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string | undefined = process.env.OPENAI_API_KEY,
    private readonly baseUrl: string = (
      process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
    ).replace(/\/$/, ""),
    private readonly model: string = process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  get available(): boolean {
    return Boolean(this.apiKey?.trim());
  }

  async analyzeCandidates(
    context: AnalysisContext,
    candidates: AnalysisCandidateInput[],
  ): Promise<(CandidateAnalysis | null)[]> {
    if (!this.available || !this.apiKey || !candidates.length) {
      return candidates.map(() => emptyUnavailableAnalysis());
    }

    const system = `You are a design research analyst for Alool Design Intelligence.
Score each candidate website/reference for relevance to the project brief.
Return ONLY valid JSON: {"results":[{"index":0,"relevanceScore":0-100,"relevanceReason":"...","matchedCriteria":[],"suggestedStyles":[],"suggestedPatterns":[],"suggestedTags":[]}]}
Use ADI style names when possible: Minimal, Editorial, Brutalist, Luxury, Corporate, Playful, Human-centered, Experimental, Modern African, Dark, Light, Premium, Clean, Elegant, etc.
Use pattern names when possible: Hero, Navigation, Content Grid, Testimonials, etc.
Penalize candidates that match avoidStyles.`;

    const user = JSON.stringify({
      brief: context,
      candidates: candidates.map((c, index) => ({
        index,
        title: c.title,
        url: c.url,
        source: c.source,
        description: c.description,
        snippet: c.snippet ?? null,
      })),
    });

    try {
      const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });

      if (!response.ok) {
        return candidates.map(() => emptyUnavailableAnalysis());
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        return candidates.map(() => emptyUnavailableAnalysis());
      }

      const parsed = JSON.parse(content) as {
        results?: Array<{
          index?: number;
          relevanceScore?: number;
          relevanceReason?: string;
          matchedCriteria?: string[];
          suggestedStyles?: string[];
          suggestedPatterns?: string[];
          suggestedTags?: string[];
        }>;
      };

      const byIndex = new Map<number, CandidateAnalysis>();
      for (const row of parsed.results ?? []) {
        if (typeof row.index !== "number") continue;
        const score =
          typeof row.relevanceScore === "number"
            ? Math.max(0, Math.min(100, Math.round(row.relevanceScore)))
            : null;
        byIndex.set(row.index, {
          relevanceScore: score,
          relevanceReason:
            typeof row.relevanceReason === "string" && row.relevanceReason.trim()
              ? row.relevanceReason.trim()
              : UNAVAILABLE_REASON,
          matchedCriteria: Array.isArray(row.matchedCriteria)
            ? row.matchedCriteria.filter((v) => typeof v === "string")
            : [],
          suggestedStyles: filterTaxonomyValues(
            Array.isArray(row.suggestedStyles)
              ? row.suggestedStyles.filter((v) => typeof v === "string")
              : [],
            styleSet,
          ),
          suggestedPatterns: filterTaxonomyValues(
            Array.isArray(row.suggestedPatterns)
              ? row.suggestedPatterns.filter((v) => typeof v === "string")
              : [],
            patternSet,
          ),
          suggestedTags: Array.isArray(row.suggestedTags)
            ? [
                ...new Set(
                  row.suggestedTags
                    .filter((v) => typeof v === "string")
                    .map((v) => v.trim())
                    .filter(Boolean),
                ),
              ].slice(0, 12)
            : [],
        });
      }

      return candidates.map((_, index) =>
        byIndex.get(index) ?? emptyUnavailableAnalysis(),
      );
    } catch {
      return candidates.map(() => emptyUnavailableAnalysis());
    }
  }
}

export class UnavailableAIProvider implements ResearchAIProvider {
  readonly name = "unavailable";
  readonly available = false;

  async analyzeCandidates(
    _context: AnalysisContext,
    candidates: AnalysisCandidateInput[],
  ): Promise<(CandidateAnalysis | null)[]> {
    return candidates.map(() => emptyUnavailableAnalysis());
  }
}

export function createAIProvider(): ResearchAIProvider {
  const openai = new OpenAIResearchProvider();
  if (openai.available) return openai;
  return new UnavailableAIProvider();
}

export { UNAVAILABLE_REASON };
