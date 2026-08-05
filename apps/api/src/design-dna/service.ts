import type { ProjectDetail, ProjectRepository } from "../repositories/project-repository.js";
import type {
  DesignDnaDetail,
  DesignDnaRepository,
} from "../repositories/design-dna-repository.js";
import type { ReferenceRecord } from "../domain/validation.js";
import {
  DesignDnaNoReferencesError,
  DesignDnaProviderUnavailableError,
  type DesignDnaAIProvider,
  type DesignDnaBriefContext,
  type DesignDnaReferenceInput,
} from "./types.js";

export class ProjectNotFoundError extends Error {
  readonly code = "project_not_found";

  constructor(message = "Project not found") {
    super(message);
    this.name = "ProjectNotFoundError";
  }
}

/**
 * Design DNA synthesis.
 *
 * Reads project → collections → references and writes only design_dna rows;
 * it never mutates projects, collections or references.
 */
export class DesignDnaService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly dnaRepo: DesignDnaRepository,
    private readonly aiProvider: DesignDnaAIProvider,
  ) {}

  getProviderStatus() {
    return {
      ai: {
        name: this.aiProvider.name,
        available: this.aiProvider.available,
      },
    };
  }

  /**
   * Aggregate the references reachable from a project's collections.
   * Deduplicated by reference id — the same reference may sit in several
   * collections of one project.
   */
  collectProjectReferences(project: ProjectDetail): ReferenceRecord[] {
    const byId = new Map<string, ReferenceRecord>();
    for (const reference of project.references) {
      if (!byId.has(reference.id)) byId.set(reference.id, reference);
    }
    return [...byId.values()];
  }

  async generate(projectId: string): Promise<DesignDnaDetail> {
    const project = this.projectRepo.findById(projectId);
    if (!project) throw new ProjectNotFoundError();

    const references = this.collectProjectReferences(project);

    // No references → never call the AI.
    if (!references.length) throw new DesignDnaNoReferencesError();

    if (!this.aiProvider.available) {
      throw new DesignDnaProviderUnavailableError();
    }

    const referenceIds = references.map((reference) => reference.id);
    const synthesis = await this.aiProvider.synthesize(
      buildBriefContext(project),
      references.map((reference, index) =>
        toReferenceInput(reference, index),
      ),
      referenceIds,
    );

    // Only reached when the provider validated its own output, so an existing
    // published version is never touched by a failed generation.
    return this.dnaRepo.create({
      projectId: project.id,
      structure: synthesis.structure,
      evidence: synthesis.evidence,
      referenceCount: references.length,
      sourceCollectionIds: project.collections.map((c) => c.id),
    });
  }
}

export function buildBriefContext(
  project: ProjectDetail,
): DesignDnaBriefContext {
  return {
    projectName: project.name,
    industry: project.industry,
    projectType: project.projectType,
    audience: project.audience,
    audienceNeeds: project.audienceNeeds,
    businessGoals: project.businessGoals,
    projectGoals: project.projectGoals,
    designGoals: project.designGoals,
    desiredStyles: project.desiredStyles,
    avoidStyles: project.avoidStyles,
    keyMessages: project.keyMessages,
    contentTypes: project.contentTypes,
    requiredFeatures: project.requiredFeatures,
    referenceKeywords: project.referenceKeywords,
    competitors: project.competitors,
    constraints: project.constraints,
  };
}

export function toReferenceInput(
  reference: ReferenceRecord,
  index: number,
): DesignDnaReferenceInput {
  return {
    index,
    title: reference.title,
    description: reference.description,
    whySaved: reference.whySaved,
    whatToLearn: reference.whatToLearn,
    styles: reference.styles,
    patterns: reference.patterns,
    tags: reference.tags,
    industries: reference.industries,
    pageTypes: reference.pageTypes,
  };
}
