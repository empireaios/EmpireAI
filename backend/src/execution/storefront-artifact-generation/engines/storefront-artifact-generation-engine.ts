import type { GeneratedArtifact } from "../models/generated-artifact.js";
import type { ArtifactRepository } from "../repositories/artifact-repository.js";
import {
  scoreStorefrontArtifactGeneration,
  type StorefrontArtifactGenerationInput,
} from "../scoring/artifact-generation-scoring.js";

/** Converts storefront code generation outputs into concrete file artifacts. */
export class StorefrontArtifactGenerationEngine {
  constructor(private readonly repository: ArtifactRepository) {}

  generateArtifacts(input: StorefrontArtifactGenerationInput) {
    return scoreStorefrontArtifactGeneration(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: StorefrontArtifactGenerationInput,
  ): Promise<GeneratedArtifact[]> {
    const breakdown = scoreStorefrontArtifactGeneration(input);
    return this.repository.saveMany(workspaceId, breakdown.artifacts);
  }
}

export const defaultStorefrontArtifactGenerationEngine = {
  generateArtifacts: scoreStorefrontArtifactGeneration,
};

export type { StorefrontArtifactGenerationInput };
