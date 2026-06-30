import type { GeneratedStorefront } from "../models/generated-storefront.js";
import type { CodeGenerationRepository } from "../repositories/code-generation-repository.js";
import {
  scoreStorefrontCodeGeneration,
  type StorefrontCodeGenerationInput,
} from "../scoring/storefront-code-generation-scoring.js";

/** Converts storefront assembly outputs into deployable website code structures. */
export class StorefrontCodeGenerationEngine {
  constructor(private readonly repository: CodeGenerationRepository) {}

  generateCode(input: StorefrontCodeGenerationInput) {
    return scoreStorefrontCodeGeneration(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: StorefrontCodeGenerationInput,
  ): Promise<GeneratedStorefront> {
    const breakdown = scoreStorefrontCodeGeneration(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultStorefrontCodeGenerationEngine = {
  generateCode: scoreStorefrontCodeGeneration,
};

export type { StorefrontCodeGenerationInput };
