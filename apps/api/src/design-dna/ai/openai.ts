import { parseDesignDnaPayload } from "../../domain/design-dna.js";
import {
  DesignDnaProviderUnavailableError,
  DesignDnaSynthesisError,
  type DesignDnaAIProvider,
  type DesignDnaBriefContext,
  type DesignDnaReferenceInput,
  type DesignDnaSynthesis,
} from "../types.js";

const SYSTEM_PROMPT = `You are a design research synthesist for Alool Design Intelligence.

You are given a set of design references that a human curator selected for one project, plus that project's research brief.

Your job is to describe WHAT THE REFERENCES DEMONSTRATE. You are NOT designing anything and you are NOT restating the brief.

Hard rules:
1. Every statement must be grounded in the supplied reference evidence (titles, descriptions, whySaved, whatToLearn, styles, patterns, tags, industries, page types).
2. The brief is CONTEXT ONLY. Never copy brief wording into the DNA. If the references do not show something the brief asks for, that belongs in antiPatterns.conflictsWithBrief, not in the other sections.
3. Do NOT invent exact colour hex values, font names, pixel values or measurements unless a reference explicitly states them. Describe characteristics instead ("high-contrast neutral palette with a single warm accent").
4. Prefer observations supported by multiple references. Leave a field as an empty array when the evidence does not support anything — an empty array is correct and expected, fabrication is not.
5. Write concise, specific statements. No generic design platitudes.

Return ONLY valid JSON with exactly this shape:
{
  "visualLanguage": {"overallStyle": [], "visualCharacteristics": [], "designPrinciples": []},
  "colorDirection": {"paletteCharacteristics": [], "dominantApproach": [], "contrast": [], "usagePatterns": []},
  "typography": {"typographyStyles": [], "hierarchyPatterns": [], "scaleCharacteristics": [], "fontCharacteristics": []},
  "layout": {"layoutPatterns": [], "gridPatterns": [], "spacingPatterns": [], "compositionPatterns": []},
  "imagery": {"imageryStyles": [], "photographyCharacteristics": [], "illustrationCharacteristics": [], "imageTreatment": []},
  "components": {"navigationPatterns": [], "heroPatterns": [], "cardPatterns": [], "ctaPatterns": [], "footerPatterns": [], "otherPatterns": []},
  "motionInteraction": {"animationPatterns": [], "interactionPatterns": [], "transitionPatterns": []},
  "contentPresentation": {"storytellingPatterns": [], "contentHierarchy": [], "contentPatterns": []},
  "patterns": {"recurringPatterns": [], "strongPatterns": [], "emergingPatterns": []},
  "antiPatterns": {"avoidPatterns": [], "overusedPatterns": [], "conflictsWithBrief": []},
  "keyInsights": [],
  "evidence": [{"section": "keyInsights", "insight": "<the exact string you used>", "referenceIndexes": [0, 2]}]
}

Every array item is a plain string.

keyInsights are the headline findings — each should combine observations from several references, e.g. "Large editorial typography is repeatedly paired with generous whitespace to create a premium and confident visual hierarchy."

evidence traces statements back to references. Use the reference "index" values exactly as supplied. "section" must be one of: visualLanguage, colorDirection, typography, layout, imagery, components, motionInteraction, contentPresentation, patterns, antiPatterns, keyInsights. "insight" must be character-for-character identical to a string you placed in that section. Provide evidence for every keyInsight and for the most important statements in the other sections.`;

/**
 * OpenAI Chat Completions provider for Design DNA synthesis.
 * Uses OPENAI_API_KEY (optional OPENAI_BASE_URL, OPENAI_DESIGN_DNA_MODEL/OPENAI_MODEL).
 */
export class OpenAIDesignDnaProvider implements DesignDnaAIProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string | undefined = process.env.OPENAI_API_KEY,
    private readonly baseUrl: string = (
      process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
    ).replace(/\/$/, ""),
    private readonly model: string = process.env.OPENAI_DESIGN_DNA_MODEL ??
      process.env.OPENAI_MODEL ??
      "gpt-4o-mini",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  get available(): boolean {
    return Boolean(this.apiKey?.trim());
  }

  async synthesize(
    context: DesignDnaBriefContext,
    references: DesignDnaReferenceInput[],
    referenceIds: string[],
  ): Promise<DesignDnaSynthesis> {
    if (!this.available || !this.apiKey) {
      throw new DesignDnaProviderUnavailableError();
    }
    if (!references.length) {
      throw new DesignDnaSynthesisError(
        "No references were supplied for Design DNA synthesis",
      );
    }

    const user = JSON.stringify({
      brief: context,
      references,
    });

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
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
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: user },
          ],
        }),
      });
    } catch (err) {
      throw new DesignDnaSynthesisError(
        `Design DNA provider request failed: ${
          err instanceof Error ? err.message : "network error"
        }`,
      );
    }

    if (!response.ok) {
      throw new DesignDnaSynthesisError(
        `Design DNA provider returned ${response.status}`,
      );
    }

    let content: string | undefined;
    try {
      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      content = payload.choices?.[0]?.message?.content ?? undefined;
    } catch {
      throw new DesignDnaSynthesisError(
        "Design DNA provider returned an unreadable response",
      );
    }

    if (!content) {
      throw new DesignDnaSynthesisError(
        "Design DNA provider returned an empty response",
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new DesignDnaSynthesisError(
        "Design DNA provider returned invalid JSON",
      );
    }

    const { data, issues } = parseDesignDnaPayload(parsed, referenceIds);
    if (!data) {
      throw new DesignDnaSynthesisError(
        "Design DNA response failed validation",
        issues,
      );
    }

    return data;
  }
}

export class UnavailableDesignDnaProvider implements DesignDnaAIProvider {
  readonly name = "unavailable";
  readonly available = false;

  async synthesize(): Promise<DesignDnaSynthesis> {
    throw new DesignDnaProviderUnavailableError();
  }
}

export function createDesignDnaProvider(): DesignDnaAIProvider {
  const openai = new OpenAIDesignDnaProvider();
  if (openai.available) return openai;
  return new UnavailableDesignDnaProvider();
}
