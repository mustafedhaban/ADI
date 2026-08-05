import type {
  DesignDnaEvidenceEntry,
  DesignDnaStructure,
  ValidationIssue,
} from "../domain/design-dna.js";

/** AI is not configured — never fabricate DNA in this case. */
export class DesignDnaProviderUnavailableError extends Error {
  readonly code = "design_dna_ai_unavailable";

  constructor(
    message = "AI provider is not configured. Set OPENAI_API_KEY to generate Design DNA.",
  ) {
    super(message);
    this.name = "DesignDnaProviderUnavailableError";
  }
}

/** AI responded but the payload could not be validated into a DNA document. */
export class DesignDnaSynthesisError extends Error {
  readonly code = "design_dna_invalid_output";

  constructor(
    message: string,
    readonly issues: ValidationIssue[] = [],
  ) {
    super(message);
    this.name = "DesignDnaSynthesisError";
  }
}

/** The project has no references to synthesize from. */
export class DesignDnaNoReferencesError extends Error {
  readonly code = "design_dna_no_references";

  constructor(
    message = "Add research references to this project before generating Design DNA.",
  ) {
    super(message);
    this.name = "DesignDnaNoReferencesError";
  }
}

/**
 * Reference evidence sent to the AI.
 *
 * Deliberately excludes ids, urls, images and timestamps — the model works from
 * design signal only and refers to references by `index`.
 */
export interface DesignDnaReferenceInput {
  index: number;
  title: string;
  description: string | null;
  whySaved: string | null;
  whatToLearn: string[];
  styles: string[];
  patterns: string[];
  tags: string[];
  industries: string[];
  pageTypes: string[];
}

/** The project research brief, passed as context — not as source material. */
export interface DesignDnaBriefContext {
  projectName: string;
  industry: string | null;
  projectType: string | null;
  audience: string | null;
  audienceNeeds: string | null;
  businessGoals: string | null;
  projectGoals: string | null;
  designGoals: string | null;
  desiredStyles: string[];
  avoidStyles: string[];
  keyMessages: string | null;
  contentTypes: string[];
  requiredFeatures: string[];
  referenceKeywords: string[];
  competitors: string[];
  constraints: string | null;
}

export interface DesignDnaSynthesis {
  structure: DesignDnaStructure;
  evidence: DesignDnaEvidenceEntry[];
}

export interface DesignDnaAIProvider {
  readonly name: string;
  readonly available: boolean;
  /**
   * Synthesize Design DNA from reference evidence.
   *
   * Implementations must throw rather than return partial or invented output:
   * `DesignDnaProviderUnavailableError` when unconfigured,
   * `DesignDnaSynthesisError` when the response fails validation.
   */
  synthesize(
    context: DesignDnaBriefContext,
    references: DesignDnaReferenceInput[],
    referenceIds: string[],
  ): Promise<DesignDnaSynthesis>;
}
