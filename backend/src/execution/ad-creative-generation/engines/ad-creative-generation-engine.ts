import type { AdCreativeRecord } from "../models/ad-creative-record.js";
import type { AdCreativeRepository } from "../repositories/ad-creative-repository.js";
import {
  generateAdCreativePackage,
  type AdCreativeGenerationInput,
} from "../scoring/ad-creative-generation-scoring.js";

/** Generates ad creative packages from brand and offer inputs. */
export class AdCreativeGenerationEngine {
  constructor(private readonly repository: AdCreativeRepository) {}

  generatePackage(input: AdCreativeGenerationInput) {
    return generateAdCreativePackage(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: AdCreativeGenerationInput,
  ): Promise<AdCreativeRecord> {
    const breakdown = generateAdCreativePackage(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultAdCreativeGenerationEngine = {
  generatePackage: generateAdCreativePackage,
};

export type { AdCreativeGenerationInput };
